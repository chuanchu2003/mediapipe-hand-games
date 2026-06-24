// ================================================================
//  DinoScene  –  Dino Run game
//  Controller: controller.js (pinch = jump, fist = restart)
//  Renderer:   Phaser 3 Arcade Physics
// ================================================================

class DinoScene extends Phaser.Scene {

    constructor() {
        super({ key: "DinoScene" });

        this.controller = null;

        // game state
        this.gameStarted  = false;
        this.gameOver     = false;
        this.score        = 0;
        this.hiScore      = 0;

        // physics tuning
        this.baseSpeed    = 320;
        this.speed        = 320;
        this.gravity      = 1400;
        this.jumpForce    = -680;

        // dino ground Y — sprite.y khi đứng (origin 0.5, 0 = top-left anchor)
        // dùng origin(0,0) để physics body khớp hoàn toàn với sprite.y
        this.groundY      = 448;   // = GROUND_Y(510) - dinoHeight(62)

        // spawn timing (ms)
        this.spawnDelay   = 1600;
        this.minDelay     = 750;

        // visuals
        this.dino         = null;
        this.obstacles    = null;
        this.clouds       = [];

        // scroll
        this.groundTiles  = [];
        this.GROUND_Y     = 565;

        // UI
        this.scoreText    = null;
        this.hiScoreText  = null;
        this.messageText  = null;
        this.subText      = null;

        // dino sprite frames
        this.dinoFrame    = 0;
        this.frameTick    = 0;

        // dust particles
        this.dustTimer    = 0;

        // flash effect on hit
        this.flashTimer   = 0;
    }

    // ----------------------------------------------------------------
    //  INIT  – receives controller from main.js
    // ----------------------------------------------------------------
    init(data) {
        this.controller  = data.controller;

        this.gameStarted = false;
        this.gameOver    = false;
        this.score       = 0;
        this.speed       = this.baseSpeed;
        this.spawnDelay  = 1600;
        this.flashTimer  = 0;

        if (this.controller) {
            this.controller.setControlMode("pinch");
            this.controller.resetGestureState();
        }
    }

    // ----------------------------------------------------------------
    //  PRELOAD  – generate textures with Phaser graphics API
    // ----------------------------------------------------------------
    preload() {
        this.load.image(
            "spriteSheet",
            "images/offline-sprite-1x.png"
        );

        this._makeDustTexture();
    }

    // ---- texture helpers ----

    _makeDinoTextures() {
        // Frame 0 – standing / mid-air
        const g0 = this.make.graphics({ x: 0, y: 0, add: false });
        // body
        g0.fillStyle(0x333333); g0.fillRect(8, 0, 26, 30);
        // head bump
        g0.fillStyle(0x333333); g0.fillRect(20, 0, 18, 18);
        // eye
        g0.fillStyle(0xffffff); g0.fillRect(32, 4, 5, 5);
        g0.fillStyle(0x000000); g0.fillRect(34, 5, 3, 3);
        // legs – both down
        g0.fillStyle(0x333333);
        g0.fillRect(10, 28, 8, 16);
        g0.fillRect(22, 28, 8, 16);
        // tail
        g0.fillRect(0, 10, 12, 8);
        g0.generateTexture("dino0", 42, 44);
        g0.destroy();

        // Frame 1 – left leg forward
        const g1 = this.make.graphics({ x: 0, y: 0, add: false });
        g1.fillStyle(0x333333); g1.fillRect(8, 0, 26, 30);
        g1.fillStyle(0x333333); g1.fillRect(20, 0, 18, 18);
        g1.fillStyle(0xffffff); g1.fillRect(32, 4, 5, 5);
        g1.fillStyle(0x000000); g1.fillRect(34, 5, 3, 3);
        g1.fillStyle(0x333333);
        g1.fillRect(8, 28, 8, 20);   // left leg long
        g1.fillRect(22, 28, 8, 10);  // right leg short
        g1.fillRect(0, 10, 12, 8);
        g1.generateTexture("dino1", 42, 48);
        g1.destroy();

        // Frame 2 – right leg forward
        const g2 = this.make.graphics({ x: 0, y: 0, add: false });
        g2.fillStyle(0x333333); g2.fillRect(8, 0, 26, 30);
        g2.fillStyle(0x333333); g2.fillRect(20, 0, 18, 18);
        g2.fillStyle(0xffffff); g2.fillRect(32, 4, 5, 5);
        g2.fillStyle(0x000000); g2.fillRect(34, 5, 3, 3);
        g2.fillStyle(0x333333);
        g2.fillRect(8,  28, 8, 10);  // left leg short
        g2.fillRect(22, 28, 8, 20);  // right leg long
        g2.fillRect(0, 10, 12, 8);
        g2.generateTexture("dino2", 42, 48);
        g2.destroy();

        // Dead frame
        const gd = this.make.graphics({ x: 0, y: 0, add: false });
        gd.fillStyle(0x555555); gd.fillRect(8, 0, 26, 30);
        gd.fillStyle(0x555555); gd.fillRect(20, 0, 18, 18);
        gd.fillStyle(0xff4444); gd.fillRect(28, 3, 10, 8); // X eye
        gd.fillStyle(0x222222); gd.fillRect(31, 5, 4, 4);
        gd.fillStyle(0x555555);
        gd.fillRect(10, 28, 8, 16);
        gd.fillRect(22, 28, 8, 16);
        gd.fillRect(0, 10, 12, 8);
        gd.generateTexture("dinoDead", 42, 44);
        gd.destroy();
    }

    _makeGroundTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x888888); g.fillRect(0, 0, 800, 4);
        // pebble pattern
        g.fillStyle(0xaaaaaa);
        for (let i = 0; i < 30; i++) {
            const x = (i * 37) % 800;
            g.fillRect(x, 6, 6, 2);
        }
        g.fillStyle(0x999999);
        for (let i = 0; i < 20; i++) {
            const x = (i * 53 + 15) % 800;
            g.fillRect(x, 10, 10, 2);
        }
        g.generateTexture("groundTile", 800, 14);
        g.destroy();
    }

    _makeCactusTextures() {
        // Small single cactus
        const cs = this.make.graphics({ x: 0, y: 0, add: false });
        cs.fillStyle(0x2d7a2d);
        cs.fillRect(12, 0, 14, 60);   // main stem
        cs.fillRect(0, 16, 12, 10);   // left arm
        cs.fillRect(0, 6,  8,  10);   // left up
        cs.fillRect(26, 20, 12, 10);  // right arm
        cs.fillRect(30, 10, 8, 10);   // right up
        // spikes
        cs.fillStyle(0x1a5c1a);
        cs.fillRect(11, 0, 2, 6);
        cs.fillRect(25, 0, 2, 6);
        cs.generateTexture("cactusS", 38, 60);
        cs.destroy();

        // Tall double cactus
        const ct = this.make.graphics({ x: 0, y: 0, add: false });
        ct.fillStyle(0x2d7a2d);
        ct.fillRect(14, 0, 16, 80);
        ct.fillRect(0,  24, 14, 12);
        ct.fillRect(0,  12, 10, 12);
        ct.fillRect(30, 30, 14, 12);
        ct.fillRect(34, 18, 10, 12);
        // second cactus next to it
        ct.fillRect(54, 10, 12, 70);
        ct.fillRect(42, 28, 12, 10);
        ct.fillRect(66, 32, 12, 10);
        ct.fillStyle(0x1a5c1a);
        ct.fillRect(13, 0, 2, 8); ct.fillRect(29, 0, 2, 8);
        ct.fillRect(53, 10, 2, 8); ct.fillRect(65, 10, 2, 8);
        ct.generateTexture("cactusT", 80, 80);
        ct.destroy();
    }

    _makeBirdTexture() {
        // Frame A – wings up
        const ba = this.make.graphics({ x: 0, y: 0, add: false });
        ba.fillStyle(0x555566);
        ba.fillRect(10, 12, 28, 12); // body
        ba.fillRect(26, 6, 10, 8);   // head
        ba.fillRect(36, 9, 6, 4);    // beak
        ba.fillStyle(0xffffff); ba.fillRect(28, 7, 4, 4);
        ba.fillStyle(0x000000); ba.fillRect(29, 8, 2, 2);
        // wings up
        ba.fillStyle(0x444455);
        ba.fillRect(0, 0, 14, 10);   // left wing up
        ba.fillRect(30, 0, 14, 10);  // right wing up
        ba.generateTexture("birdA", 44, 30);
        ba.destroy();

        // Frame B – wings down
        const bb = this.make.graphics({ x: 0, y: 0, add: false });
        bb.fillStyle(0x555566);
        bb.fillRect(10, 10, 28, 12);
        bb.fillRect(26, 4,  10, 8);
        bb.fillRect(36, 7,   6, 4);
        bb.fillStyle(0xffffff); bb.fillRect(28, 5, 4, 4);
        bb.fillStyle(0x000000); bb.fillRect(29, 6, 2, 2);
        // wings down
        bb.fillStyle(0x444455);
        bb.fillRect(0, 18, 14, 10);
        bb.fillRect(30, 18, 14, 10);
        bb.generateTexture("birdB", 44, 30);
        bb.destroy();
    }

    _makeCloudTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xdddddd, 0.85);
        g.fillEllipse(40, 16, 80, 28);
        g.fillEllipse(24, 20, 44, 20);
        g.fillEllipse(62, 22, 40, 16);
        g.generateTexture("cloud", 88, 36);
        g.destroy();
    }

    _makeDustTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xbbbbbb, 0.7);
        g.fillCircle(4, 4, 4);
        g.generateTexture("dust", 8, 8);
        g.destroy();
    }

    // ----------------------------------------------------------------
    //  CREATE
    // ----------------------------------------------------------------
    create() {
        this.invincibleTimer = 0;
        this.dustTimer = 0;
        this.gameStarted = false;
        this.gameOver    = false;
        this.score       = 0;
        this.speed       = this.baseSpeed;
        this.spawnDelay  = 1600;
        this.flashTimer  = 0;
        this.dinoFrame   = 0;
        this.frameTick   = 0;
        this.dustTimer   = 0;
        this.lives = 3;

        this.hearts = [];

        for(let i=0;i<3;i++){
            this.hearts.push(
                this.add.text(
                    680 + i*35,
                    45,
                    "❤",
                    {
                        fontSize:"32px",
                        color:"#ff4444"
                    }
                ).setDepth(10)
            );
        }
        // ---- sky gradient (draw as rectangle layers) ----
        this.add.rectangle(430, 322, 860, 451, 0xf7f7f7).setDepth(0);

        // ---- ground line ----
        this.add.rectangle( 430, this.GROUND_Y, 860, 4, 0x888888).setDepth(1);

        // ---- scrolling ground tiles ----
        this.groundTiles = [];
        for (let i = 0; i < 2; i++) {
            const t = this.add.image(i * 860, this.GROUND_Y + 9, "groundTile")
                .setOrigin(0, 0)
                .setDepth(1);
            this.groundTiles.push(t);
        }

        // ---- obstacle group ----
        this.obstacles = this.physics.add.group();

        // ---- static ground collider (invisible) ----
        // đặt ngay sát đường kẻ đất để physics body va chạm chính xác
        this.groundCollider = this.physics.add.staticImage(
            400, this.GROUND_Y + 2, null
        ).setDisplaySize(800, 4).refreshBody();
        // ẩn đi (đường kẻ đã được vẽ bằng rectangle riêng)
        this.groundCollider.setVisible(false);

        // ---- dino ----
        // dùng origin(0,0) → sprite.y = top-left → body.y = sprite.y → không bị offset
        // đặt dino sao cho đáy sprite = GROUND_Y
        const DINO_W = 44;
        const DINO_H = 47;

        this.dino = this.physics.add.sprite(
            60,
            this.GROUND_Y - DINO_H + 4,
            "spriteSheet"
        )
        .setOrigin(0,0)
        .setCrop(677,2,44,47)
        .setDepth(3);

        this.dino.body.setGravityY(this.gravity);
        this.dino.body.setCollideWorldBounds(false);

        this.dino.body.setSize(34, 39);
        this.dino.body.setOffset(5, 6);
        // va chạm với ground tĩnh
        this.physics.add.collider(this.dino, this.groundCollider);


        // ---- score UI ----
        const textStyle = {
            fontSize: "22px",
            fontFamily: "monospace",
            color: "#222222",
            stroke: "#ffffff",
            strokeThickness: 3
        };
        this.scoreText = this.add.text(20, 18, "SCORE  0", textStyle).setDepth(5);
        this.hiScoreText = this.add.text(580, 18,
            "HI  " + this.hiScore, textStyle).setDepth(5);

        this.speedDisplay = this.add.text(
            430,
            600,
            "Speed: 0",
            {
                fontSize:"24px",
                color:"#333",
                fontFamily:"monospace"
            }
        )
        .setOrigin(0.5)
        .setDepth(10);            

        this.subText = this.add.text(400, 310,
            "🤏  Pinch to start",
            {
                fontSize: "26px",
                fontFamily: "monospace",
                color: "#444444"
            }
        ).setOrigin(0.5).setDepth(6);

        // ---- obstacle spawn timer ----
        this.spawnEvent = this.time.addEvent({
            delay: this.spawnDelay,
            loop: true,
            callback: () => {
                if (this.gameStarted && !this.gameOver) {
                    this._spawnObstacle();
                    // gradually speed up spawn rate
                    const newDelay = Math.max(
                        this.minDelay,
                        this.spawnDelay - 15
                    );
                    if (newDelay !== this.spawnDelay) {
                        this.spawnDelay = newDelay;
                        this.spawnEvent.reset({
                            delay: this.spawnDelay,
                            loop: true,
                            callback: this.spawnEvent.callback,
                            callbackScope: this
                        });
                    }
                }
            }
        });

        // ---- cloud spawn timer ----
        this.time.addEvent({
            delay: 3500,
            loop: true,
            callback: this._spawnCloud,
            callbackScope: this
        });
        // seed one cloud immediately
        this._spawnCloud();
    }

    // ----------------------------------------------------------------
    //  SPAWN helpers
    // ----------------------------------------------------------------
    _spawnObstacle() {

        // chim chỉ xuất hiện khi đã chơi được một lúc
        if (this.score > 300 && Phaser.Math.Between(0,100) < 18) {
            this._spawnBird();
            return;
        }

        // 20 giây đầu hoặc khoảng 200 điểm đầu chỉ spawn đơn
        const allowDouble =
            this.score > 100 &&
            Phaser.Math.Between(0,100) < 20;

        // 50% mini - 50% cactus lớn
        const useMini = Phaser.Math.Between(0,1) === 0;

        if (useMini) {

            const type = Phaser.Math.Between(1,3);

            this._spawnMini(type,880);

            // chỉ spawn đôi cùng loại
            if (allowDouble) {
                this._spawnMini(
                    type,
                    880 + 17 + 2
                );
            }

        } else {

            const first = Phaser.Math.Between(1,3);

            this._spawnBig(first,880);

            // cactus3 + cactus3 bị cấm
            if (allowDouble) {

                let second;

                if (first === 3) {
                    second = Phaser.Math.Between(1,2);
                }
                else {
                    second = Phaser.Math.Between(1,3);

                    while (first === 3 && second === 3) {
                        second = Phaser.Math.Between(1,2);
                    }
                }

                const width =
                    first === 3 ? 29 : 25;

                this._spawnBig(
                    second,
                    880 + width + 2
                );
            }
        }
    }

    _spawnMini(type,x){

        const cropX = {
            1:245,
            2:262,
            3:296
        };

        const obs = this.obstacles.create(
            x,
            this.GROUND_Y - 35 + 4,
            "spriteSheet"
        )
        .setOrigin(0,0)
        .setCrop(cropX[type],2,17,35)
        .setDepth(2);

        obs.body.setAllowGravity(false);
        obs.body.setImmovable(true);
        obs.body.setVelocityX(-this.speed);

        obs.obsType = "mini";
        obs.variant = type;
    }
    _spawnBig(type,x){

        const cropX = {
            1:332,
            2:382,
            3:431
        };

        const width = {
            1:25,
            2:25,
            3:29
        };

        const height = {
            1:50,
            2:50,
            3:47
        };

        const obs = this.obstacles.create(
            x,
            this.GROUND_Y - height[type] + 4,
            "spriteSheet"
        )
        .setOrigin(0,0)
        .setCrop(
            cropX[type],
            2,
            width[type],
            height[type]
        )
        .setDepth(2);

        obs.body.setAllowGravity(false);
        obs.body.setImmovable(true);
        obs.body.setVelocityX(-this.speed);

        obs.obsType =
            type === 3
                ? "cactus3"
                : "cactus";

        obs.variant = type;
    }
    _spawnBird() {
        const heightOptions = [
            this.GROUND_Y - 130,
            this.GROUND_Y - 90,
            this.GROUND_Y - 55
        ];
        const y = Phaser.Math.RND.pick(heightOptions);

        const bird = this.obstacles.create(880, y, "birdA")
            .setOrigin(0.5, 0.5).setDepth(2);
        bird.body.setAllowGravity(false);
        bird.body.setImmovable(true);
        bird.body.setVelocityX(-this.speed * 1.1);
        bird.body.setSize(30, 18, true);
        bird.obsType = "bird";
        bird.birdTick = 0;
    }

    _spawnCloud() {
        const y = Phaser.Math.Between(50, 180);
        const spd = Phaser.Math.Between(40, 80);

        const cloud = this.add.image(
            900,
            y,
            "cloud"
        )
        .setAlpha(0.75)
        .setDepth(1);

        const scale = Phaser.Math.FloatBetween(
            0.7,
            1.3
        );

        cloud.setScale(scale);
    }

    // ----------------------------------------------------------------
    //  HIT
    // ----------------------------------------------------------------
    _hitObstacle() {

        if(this.invincibleTimer > 0)
            return;

        this.lives--;

        if(this.hearts[this.lives]){
            this.hearts[this.lives].setVisible(false);
        }

        this.invincibleTimer = 1200;

        if(this.lives <= 0){
            this._triggerGameOver();
        }
    }
    async _triggerGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;

        // freeze obstacles
        this.obstacles.getChildren().forEach(o => {
            if (o.body) o.body.setVelocityX(0);
        });

        // dead pose
        this.dino.setCrop(897,2,44,47);

        // flash red overlay
        this.flashTimer = 300;

        if (this.score > this.hiScore) {
            this.hiScore = Math.floor(this.score);
        }
        this.hiScoreText.setText("HI  " + this.hiScore);

        // big game over text
        this.messageText.setText("GAME OVER");
        this.messageText.y = 250;
        this.messageText.setVisible(true);

        this.subText.setText("👊  Fist to restart");
        this.subText.setVisible(true);
        this.restartIcon = this.add.image(
                    430,
                    320,
                    "spriteSheet"
                )
                .setCrop(2,2,36,32)
                .setScale(2);
                this.restartHint = this.add.text(
            430,
            385,
            "Click mouse or close your hand to restart",
            {
                fontSize:"20px",
                color:"#444"
            }
        ).setOrigin(0.5);

        // save score
        if (window.currentUserId) {
            try {
                await fetch(`${API_URL}/saveScore`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: window.currentUserId,
                        game: "dino",
                        score: Math.floor(this.score)
                    })
                });
                if (window.updateHighScoreBoard) {
                    window.updateHighScoreBoard();
                }
            } catch (e) {
                // offline – skip silently
            }
        }
    }

    // ----------------------------------------------------------------
    //  UPDATE  (called every frame)
    // ----------------------------------------------------------------
    update(time, delta) {
        // ---- flash overlay ----
        if (this.flashTimer > 0) {
            this.flashTimer -= delta;
        }

        this.obstacles.getChildren().forEach(obs => {
            if (this._complexCollision(this.dino, obs)) {
                this._hitObstacle();
            }
        });
        if(this.invincibleTimer > 0){
            this.invincibleTimer -= delta;
        }
        // ---- game over: wait for fist ----
        if (this.gameOver) {
            if (this.controller && this.controller.justClosedFist()) {
                this.scene.restart({ controller: this.controller });
            }
            return;
        }

        // ---- start on first pinch ----
        if (!this.gameStarted) {
            if (this.controller && this.controller.isJumping("dino")) {
                this.gameStarted = true;
                this.messageText.setVisible(false);
                this.subText.setVisible(false);
                this.dino.body.setVelocityY(this.jumpForce);
            }
            return;
        }

        const dt = delta / 1000; // seconds

        // ---- score ----
        this.score += dt * (this.speed / 30);
        this.scoreText.setText("SCORE  " + Math.floor(this.score));

        // ---- speed ramp ----
        this.speed = this.baseSpeed + Math.floor(this.score / 4);
        this.speedDisplay.setText(
            "Speed: " +
            Math.floor(this.speed)
        );
        // ---- jump input ----
        // dùng body.blocked.down (chính xác nhất với static collider)
        const onGround = this.dino.body.blocked.down ||
                         this.dino.body.touching.down;
        if (this.controller && this.controller.isJumping("dino") && onGround) {
            this.dino.body.setVelocityY(this.jumpForce);
        }

        // ---- safety clamp (phòng khi rơi qua ground) ----
        const floorTop = this.GROUND_Y - 44;   // = groundY
        if (this.dino.y > floorTop) {
            this.dino.y = floorTop;
            this.dino.body.reset(this.dino.x, floorTop);
        }

        // ---- dino animation ----
        const onGround2 = this.dino.body.blocked.down || this.dino.body.touching.down;
        if (onGround2) {
            this.frameTick += delta;
            if (this.frameTick > 80) {
                this.frameTick = 0;

                const frames = [
                    [677,2],
                    [721,2],
                    [765,2],
                    [809,2],
                    [853,2]
                ];

                this.dinoFrame++;
                if(this.dinoFrame >= frames.length)
                    this.dinoFrame = 0;

                const f = frames[this.dinoFrame];

                this.dino.setCrop(
                    f[0],
                    f[1],
                    44,
                    47
                );
            }
        } else {
            // airborne – standing frame
            this.dino.setCrop(677,2,44,47);
        }

        // ---- bird wing flap ----
        this.obstacles.getChildren().forEach(obs => {
            if (obs.obsType === "bird") {
                obs.birdTick = (obs.birdTick || 0) + delta;
                if (obs.birdTick > 200) {
                    obs.birdTick = 0;
                    obs.setTexture(
                        obs.texture.key === "birdA" ? "birdB" : "birdA"
                    );
                }
            }
            // update velocity so acceleration is applied
            if (obs.body) {
                const spd = obs.obsType === "bird"
                    ? -this.speed * 1.1
                    : -this.speed;
                obs.body.setVelocityX(spd);
            }
            // cull off-screen
            if (obs.x < -120) obs.destroy();
        });

        // ---- scroll ground tiles ----
        this.groundTiles.forEach(tile => {
            tile.x -= this.speed * dt;
            if (tile.x <= -860) {
                tile.x += 1720;
            }
        });

        // ---- dust when running on ground ----
        const onGround3 = this.dino.body.blocked.down || this.dino.body.touching.down;
        if (onGround3 && this.gameStarted) {
            this.dustTimer += delta;
            if (this.dustTimer > 120) {
                this.dustTimer = 0;
                this._emitDust();
            }
        }
    }

    _complexCollision(dino, obs) {

        const dinoRects = [
            {x:dino.x+0 ,y:dino.y+0 ,w:32,h:35},
            {x:dino.x+32,y:dino.y+0 ,w:12,h:19},
            {x:dino.x+8 ,y:dino.y+35,w:18,h:12}
        ];

        let obsRects=[];

        /*
        if(this.debugRects){
            this.debugRects.clear();
        }

        this.debugRects = this.add.graphics();

        this.debugRects.lineStyle(1,0xff0000);

        [...dinoRects,...obsRects].forEach(r=>{
            this.debugRects.strokeRect(
                r.x,
                r.y,
                r.w,
                r.h
            );
        });
        */    
        if(obs.obsType==="mini"){
            obsRects=[
                {x:obs.x,y:obs.y+5,w:17,h:30},
                {x:obs.x+5,y:obs.y,w:7,h:5}
            ];
        }

        if(obs.obsType==="cactus"){
            obsRects=[
                {x:obs.x,y:obs.y+12,w:25,h:38},
                {x:obs.x+12,y:obs.y,w:1,h:12}
            ];
        }

        if(obs.obsType==="cactus3"){
            obsRects=[
                {x:obs.x+0,y:obs.y+17,w:29,h:30},
                {x:obs.x+5,y:obs.y+0,w:13,h:14}
            ];
        }

        if(obs.obsType==="bird"){
            obsRects=[
                {x:obs.x,y:obs.y+12,w:46,h:16}
            ];
        }

        for(const a of dinoRects){
            for(const b of obsRects){

                if(
                    a.x < b.x+b.w &&
                    a.x+a.w > b.x &&
                    a.y < b.y+b.h &&
                    a.y+a.h > b.y
                ){
                    return true;
                }
            }
        }

        return false;
    }
    // ----------------------------------------------------------------
    //  DUST particles
    // ----------------------------------------------------------------
    _emitDust() {
        // dino origin(0,0) → center X = dino.x + width/2
        const x = this.dino.x + 14 + Phaser.Math.Between(-6, 6);
        const y = this.GROUND_Y;
        const dust = this.add.image(x, y, "dust")
            .setAlpha(0.6)
            .setDepth(2);
        this.tweens.add({
            targets: dust,
            x: x - Phaser.Math.Between(10, 25),
            y: y - Phaser.Math.Between(4, 14),
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 350,
            onComplete: () => dust.destroy()
        });
    }
}