/*
 * DinoScene — Google T-Rex clone
 *
 * Asset dimensions (1x, scale ×2 in-game):
 *   dino1-5, dinodie : 44 × 47
 *   cactus1-3        : 25-29 × 47-50
 *   cactusmini1-3    : 17 × 35
 *   bird1-2          : 46 × 40
 *   cloud            : 46 × 13
 *   restart          : 36 × 32
 *   offline-sprite   : 1204 × 68  (ground texture strip)
 *
 * Controller API used:
 *   setControlMode("pinch") + resetGestureState()  — in init()
 *   isJumping("dino")                              — pinch held, 80ms interval
 *   justClosedFist()                               — one-shot fist for restart
 */

class DinoScene extends Phaser.Scene {

    // ─────────────────────────────────────────────────────────────────
    //  Lifecycle
    // ─────────────────────────────────────────────────────────────────

    constructor() {
        super({ key: "DinoScene" });
        this.controller = null;
    }

    init(data) {
        this.controller = data.controller;
        this.hiScore    = data.hiScore || 0;

        if (this.controller) {
            this.controller.setControlMode("pinch");
            this.controller.resetGestureState();
        }
    }

    preload() {
        // Dino
        this.load.image("dino1",       "images/dino1.png");
        this.load.image("dino2",       "images/dino2.png");
        this.load.image("dino3",       "images/dino3.png");
        this.load.image("dino4",       "images/dino4.png");
        this.load.image("dino5",       "images/dino5.png");
        this.load.image("dinodie",     "images/dinodie.png");
        // Large cacti
        this.load.image("cactus1",     "images/cactus1.png");
        this.load.image("cactus2",     "images/cactus2.png");
        this.load.image("cactus3",     "images/cactus3.png");
        // Small cacti
        this.load.image("cactusmini1", "images/cactusmini1.png");
        this.load.image("cactusmini2", "images/cactusmini2.png");
        this.load.image("cactusmini3", "images/cactusmini3.png");
        // Bird
        this.load.image("dino-bird1",  "images/bird1.png");
        this.load.image("dino-bird2",  "images/bird2.png");
        // Misc
        this.load.image("cloud",       "images/cloud.png");
        this.load.image("restart",     "images/restart.png");
        this.load.image("gndstrip",    "images/offline-sprite-1x.png");
    }

    create() {
        // ── Game constants ────────────────────────────────────────────
        this.SCALE       = 2;
        this.GROUND_Y    = 500;   // y where dino feet rest (origin bottom)
        this.DINO_X      = 80;
        this.GRAVITY     = 2400;
        // J=700 → window above large cactus (Δt) = 0.417s
        // BASE_SPEED: Δt > 2-cactus danger (0.391s) ✓  — Δt < 3-cactus danger (0.566s) ✓
        // MAX_SPEED:  Δt > 3-cactus danger (0.165s) ✓
        this.JUMP_VEL    = -900;
        this.BASE_SPEED  = 320;
        this.MAX_SPEED   = 1100;

        // ── State ──────────────────────────────────────────────────────
        this.gameStarted = false;
        this.isDead      = false;
        this.score       = 0;
        this.speed       = this.BASE_SPEED;

        // Obstacle spawn timer (manual, not time.addEvent, for speed-responsive gaps)
        this.obstacleTimer     = 0;
        this.nextObstacleDelay = Phaser.Math.Between(1800, 2800);

        // Cloud spawn timer
        this.cloudTimer     = 0;
        this.nextCloudDelay = Phaser.Math.Between(1000, 3500);
        this.clouds         = [];

        // Cactus pools
        this.largeCactusPool = ["cactus1", "cactus2", "cactus3"];
        this.smallCactusPool = ["cactusmini1", "cactusmini2", "cactusmini3"];

        // ── World ─────────────────────────────────────────────────────
        // Bottom bound = GROUND_Y acts as the physics floor for the dino
        this.physics.world.setBounds(0, 0, 800, this.GROUND_Y);
        this.cameras.main.setBackgroundColor("#f7f7f7");

        // ── Ground visuals ────────────────────────────────────────────
        // Scrolling ground strip (offline-sprite is 1204×68, top row = ground detail)
        this.groundTile = this.add.tileSprite(0, this.GROUND_Y, 800, 16, "gndstrip")
            .setOrigin(0, 0);

        // Solid ground line on top of the strip
        this.add.rectangle(400, this.GROUND_Y, 800, 2, 0x535353)
            .setOrigin(0.5, 1);

        // ── Animations ────────────────────────────────────────────────
        if (!this.anims.exists("dino-run")) {
            this.anims.create({
                key: "dino-run",
                frames: [
                    { key: "dino1" }, { key: "dino2" }, { key: "dino3" },
                    { key: "dino4" }, { key: "dino5" },
                ],
                frameRate: 10,
                repeat: -1,
            });
        }
        if (!this.anims.exists("dino-bird")) {
            this.anims.create({
                key: "dino-bird",
                frames: [{ key: "dino-bird1" }, { key: "dino-bird2" }],
                frameRate: 6,
                repeat: -1,
            });
        }

        // ── Dino sprite ───────────────────────────────────────────────
        this.dino = this.physics.add.sprite(this.DINO_X, this.GROUND_Y, "dino1")
            .setOrigin(0.5, 1)
            .setScale(this.SCALE)
            .setDepth(2);

        this.dino.body.setGravityY(this.GRAVITY);
        this.dino.body.setCollideWorldBounds(true);
        // No manual setSize — Phaser uses frame dimensions by default,
        // which aligns body.bottom correctly with sprite.y (origin 0.5,1)

        // ── Obstacles group ───────────────────────────────────────────
        this.obstacles = this.physics.add.group();

        this.physics.add.overlap(
            this.dino,
            this.obstacles,
            this.onHitObstacle,
            null,
            this
        );

        // ── Score display ─────────────────────────────────────────────
        const monoStyle = {
            fontSize: "22px",
            color: "#535353",
            fontFamily: "monospace",
        };
        this.hiText    = this.add.text(610, 18, "HI " + this._fmt(this.hiScore), monoStyle).setDepth(10);
        this.scoreText = this.add.text(780, 18, this._fmt(0), monoStyle).setOrigin(1, 0).setDepth(10);

        // Score flash on milestone (every 100 pts)
        this.lastMilestone = 0;

        // ── Game-over overlay (hidden at start) ───────────────────────
        this.goContainer = this.add.container(400, 0).setVisible(false).setDepth(10);

        const goTitle = this.add.text(0, 210, "GAME OVER", {
            fontSize: "32px",
            color: "#535353",
            fontFamily: "monospace",
            fontStyle: "bold",
        }).setOrigin(0.5);

        this.restartIcon = this.add.image(0, 310, "restart")
            .setScale(2.5)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        this.restartIcon.on("pointerdown", () => this.restartGame());

        const goHint = this.add.text(0, 385, "✊ Nắm tay  /  Click để chơi lại", {
            fontSize: "15px",
            color: "#535353",
            fontFamily: "monospace",
        }).setOrigin(0.5);

        this.goContainer.add([goTitle, this.restartIcon, goHint]);

        // ── Start hint ────────────────────────────────────────────────
        this.startHint = this.add.text(400, 430, "🤏 Pinch để bắt đầu", {
            fontSize: "20px",
            color: "#535353",
            fontFamily: "monospace",
        }).setOrigin(0.5).setDepth(10);
    }

    // ─────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────

    _fmt(n) {
        return String(Math.floor(n)).padStart(5, "0");
    }

    _isOnGround() {
        return this.dino.body.blocked.down;
    }

    // ─────────────────────────────────────────────────────────────────
    //  Spawning
    // ─────────────────────────────────────────────────────────────────

    _spawnObstacleGroup() {
        const sc = Math.floor(this.score);

        // Birds appear only after score 300
        const canBird = sc >= 300;
        const roll    = Phaser.Math.Between(0, canBird ? 9 : 5);

        if (canBird && roll >= 8) {
            this._spawnBird();
            return;
        }

        const isLarge = roll <= 2;
        const pool    = isLarge ? this.largeCactusPool : this.smallCactusPool;
        const key     = Phaser.Utils.Array.GetRandom(pool);

        // Cap group size by score so player can always survive the maximum obstacle:
        //   score <200 → max 1  (warm-up phase)
        //   score <500 → max 2  (Δt=0.417s > 2-cactus danger at BASE_SPEED)
        //   score≥500  → max 3  (at speed≥770, 3-cactus danger=0.235s < Δt)
        const maxCount  = sc < 200 ? 1 : sc < 500 ? 2 : 3;
        const countRoll = Phaser.Math.Between(0, 9);
        const count     = Math.min(
            countRoll <= 4 ? 1 : countRoll <= 7 ? 2 : 3,
            maxCount
        );

        // Measure cactus display width from texture
        const frame = this.textures.getFrame(key);
        const cw    = frame.realWidth * this.SCALE;
        const gap   = 6;

        for (let i = 0; i < count; i++) {
            this._spawnCactus(key, 860 + i * (cw + gap));
        }
    }

    _spawnCactus(key, x) {
        const c = this.obstacles.create(x, this.GROUND_Y, key)
            .setOrigin(0.5, 1)
            .setScale(this.SCALE)
            .setDepth(2);

        c.body.setImmovable(true);
        c.body.setAllowGravity(false);
        c.body.setVelocityX(-this.speed);
    }

    _spawnBird() {
        // Low  = bird at dino-torso level → must jump over
        // High = bird above dino head    → run underneath safely
        // Heights tuned for default frame-sized bodies (bird frame: 46×40, dino frame: 44×47)
        // Dino body on ground: y = GROUND_Y - 47 .. GROUND_Y  (frame coords)
        // Bird body center at BIRD_LOW: top = BIRD_LOW - 20, bottom = BIRD_LOW + 20
        const BIRD_LOW  = this.GROUND_Y - 40;   // body overlaps dino torso → hit
        const BIRD_HIGH = this.GROUND_Y - 110;   // body above dino top      → safe

        const y    = Phaser.Math.Between(0, 1) === 0 ? BIRD_LOW : BIRD_HIGH;
        const bird = this.obstacles.create(870, y, "dino-bird1")
            .setOrigin(0.5, 0.5)
            .setScale(this.SCALE)
            .setDepth(2);

        bird.play("dino-bird");
        bird.body.setAllowGravity(false);
        bird.body.setVelocityX(-this.speed);
    }

    _spawnCloud() {
        const cloud = this.add.image(870, Phaser.Math.Between(60, 220), "cloud")
            .setScale(this.SCALE)
            .setDepth(1);
        this.clouds.push(cloud);
    }

    // ─────────────────────────────────────────────────────────────────
    //  Game events
    // ─────────────────────────────────────────────────────────────────

    onHitObstacle() {
        if (this.isDead) return;
        this.isDead = true;

        // Update HI score
        if (Math.floor(this.score) > this.hiScore) {
            this.hiScore = Math.floor(this.score);
            this.hiText.setText("HI " + this._fmt(this.hiScore));
        }

        // Freeze dino on dead frame
        this.dino.anims.stop();
        this.dino.setTexture("dinodie");
        this.dino.body.setVelocity(0, 0);
        this.dino.body.setAllowGravity(false);

        // Show game-over UI
        this.goContainer.setVisible(true);

        // Brief flash
        this.cameras.main.flash(120, 100, 0, 0);
    }

    restartGame() {
        this.scene.restart({
            controller: this.controller,
            hiScore:    this.hiScore,
        });
    }

    // ─────────────────────────────────────────────────────────────────
    //  Update loop
    // ─────────────────────────────────────────────────────────────────

    update(time, delta) {

        // ── Clouds (always scroll, even before game start) ────────────
        this.cloudTimer += delta;
        if (this.cloudTimer >= this.nextCloudDelay) {
            this.cloudTimer     = 0;
            this.nextCloudDelay = Phaser.Math.Between(2000, 5000);
            this._spawnCloud();
        }
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cl = this.clouds[i];
            cl.x -= 60 * delta / 1000;
            if (cl.x < -100) { cl.destroy(); this.clouds.splice(i, 1); }
        }

        // ── Dead state ────────────────────────────────────────────────
        if (this.isDead) {
            if (this.controller && this.controller.justClosedFist()) {
                this.restartGame();
            }
            return;
        }

        const pinching = this.controller && this.controller.isJumping("dino");

        // ── Waiting for first pinch to start ──────────────────────────
        if (!this.gameStarted) {
            if (pinching) {
                this.gameStarted = true;
                this.startHint.setVisible(false);
                this.dino.play("dino-run");
                this.dino.body.setVelocityY(this.JUMP_VEL);
            }
            return;
        }

        // ── Jump (only when on ground) ────────────────────────────────
        if (pinching && this._isOnGround()) {
            this.dino.body.setVelocityY(this.JUMP_VEL);
        }

        // ── Score & speed ─────────────────────────────────────────────
        this.score += delta * 0.01;
        const sc = Math.floor(this.score);

        this.speed = Math.min(this.BASE_SPEED + sc * 0.9, this.MAX_SPEED);
        this.scoreText.setText(this._fmt(sc));

        // Update HI live
        if (sc > this.hiScore) {
            this.hiScore = sc;
            this.hiText.setText("HI " + this._fmt(sc));
        }

        // Score milestone flash every 100 pts
        if (sc > 0 && sc % 100 === 0 && sc !== this.lastMilestone) {
            this.lastMilestone = sc;
            this.scoreText.setColor("#ff9900");
            this.time.delayedCall(400, () => {
                if (this.scoreText) this.scoreText.setColor("#535353");
            });
        }

        // ── Scroll ground ─────────────────────────────────────────────
        this.groundTile.tilePositionX += this.speed * delta / 1000;

        // ── Obstacle spawning ─────────────────────────────────────────
        this.obstacleTimer += delta;
        if (this.obstacleTimer >= this.nextObstacleDelay) {
            this.obstacleTimer = 0;

            // Gap decreases with speed, but always allows enough reaction time
            const minGap = Math.max(600,  2000 - sc * 1.5);
            const maxGap = Math.max(1100, 3500 - sc * 2.5);
            this.nextObstacleDelay = Phaser.Math.Between(
                Math.floor(minGap),
                Math.floor(maxGap)
            );

            this._spawnObstacleGroup();
        }

        // ── Update obstacle velocities + clean up ─────────────────────
        this.obstacles.getChildren().forEach(obs => {
            if (obs.x < -200) {
                obs.destroy();
            } else if (obs.body) {
                obs.body.setVelocityX(-this.speed);
            }
        });
    }
}
