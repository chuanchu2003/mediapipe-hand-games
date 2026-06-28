

class BootScene extends Phaser.Scene {

    constructor() {
        super({ key: "BootScene" });
    }

    create() {
        // rỗng
    }
}
class BreakoutScene extends Phaser.Scene {
  constructor() {
    super({ key: "BreakoutScene" });

    this.controller = null;
    this.paddle = null;
    this.mode = "classic";
    this.level = 1;

    this.balls = null;
    this.bricks = null;

    this.score = 0;
    this.lives = 3;
    this.scorePerBrick = 10;

    this.levelText = null;
    this.scoreText = null;
    this.livesText = null;
    this.instructionText = null;

    this.gameStarted = false;

    this.baseSpeed = 300;

    this.isPaused = false;
    this.lifeLock = false;
    this.isGameOver = false;
  }

  init(data) {
    if (data) {

      this.controller = data.controller || this.controller;
      this.mode = data.mode || "classic";
      this.level = data.level || 1;
      this.player = data.player;


      if (data.score !== undefined) {
        this.score = data.score;
      }

    }
    
    if (this.controller) {
      this.controller.setControlMode("angle");
    }

    if (this.controller && this.controller.resetGestureState) {
      this.controller.resetGestureState();
    }


  }

  preload() {
    this.createSprites();
  }

  createSprites() {
    // Paddle
    const paddleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    paddleGraphics.fillStyle(0x3498db);
    paddleGraphics.fillRoundedRect(0, 0, 100, 20, 10);
    paddleGraphics.generateTexture("paddle", 100, 20);
    paddleGraphics.destroy();

    // Ball
    const ballGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    ballGraphics.fillStyle(0xe74c3c);
    ballGraphics.fillCircle(10, 10, 10);
    ballGraphics.generateTexture("ball", 20, 20);
    ballGraphics.destroy();

    // Bricks
    const colors = [
      0xe74c3c,
      0xf39c12,
      0xf1c40f,
      0x2ecc71,
      0x3498db,
      0x9b59b6
    ];

    colors.forEach((color, index) => {
      const brickGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      brickGraphics.fillStyle(color);
      brickGraphics.fillRoundedRect(0, 0, 60, 25, 5);
      brickGraphics.generateTexture(`brick${index}`, 60, 25);
      brickGraphics.destroy();
    });
        // ===== OBSTACLE =====
    const obstacleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    obstacleGraphics.fillStyle(0xffffff);
    obstacleGraphics.fillRoundedRect(0, 0, 60, 25, 5);
    obstacleGraphics.generateTexture("obstacle", 60, 25);
    obstacleGraphics.destroy();
  }

  create() {

    this.isPaused = false;
    this.isGameOver = false;
    this.gameStarted = false;
    this.lifeLock = false;

    if (this.score === undefined) {
        this.score = 0;
    }
    this.lives = 3;

    if (this.controller && this.controller.resetGestureState) {
      this.controller.resetGestureState();
    }

    this.physics.world.setBoundsCollision(true, true, true, false);

    this.paddle = this.physics.add.sprite(400, 550, "paddle");
    this.paddle.setImmovable(true);
    this.paddle.body.setCollideWorldBounds(true);

    this.balls = this.physics.add.group();

    // tạo gạch trước
    this.createBricks();

    // spawn bóng sau
    this.spawnBall(this.paddle.x, this.paddle.y - 20);

    this.scoreText = this.add.text(16, 16, "Điểm: " + this.score, {
      fontSize: "24px",
      fill: "#fff",
      fontFamily: "Arial",
      stroke: "#000",
      strokeThickness: 4
    });

    this.livesText = this.add.text(630, 16, "Mạng: 3", {
      fontSize: "24px",
      fill: "#fff",
      fontFamily: "Arial",
      stroke: "#000",
      strokeThickness: 4
    });
    this.levelText = this.add.text(300, 16, "Level: " + this.level, {
      fontSize: "24px",
      fill: "#fff",
      fontFamily: "Arial",
      stroke: "#000",
      strokeThickness: 4
    });

    this.instructionText = this.add
      .text(400, 300, "👊 Nắm tay để bắt đầu!", {
        fontSize: "28px",
        fill: "#fff",
        fontFamily: "Arial",
        stroke: "#000",
        strokeThickness: 6,
        align: "center"
      })
      .setOrigin(0.5);
      // ===== NÚT PAUSE =====
      this.pauseButton = this.add.text(770, 20, "❚❚", {
        fontSize: "28px",
        fill: "#ffffff",
        fontFamily: "Arial",
        stroke: "#000",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.pauseButton.on("pointerdown", () => {
      this.openPauseMenu();
    });
  }
  getLevelConfig() {

    const configs = {

      1: { hp1: 60, hp2: 0,  hp3: 0,  heart: 2, multi: 2, cross:1, bomb:1 },

      2: { hp1: 40, hp2: 20, hp3: 0,  heart: 2, multi: 2, cross:1, bomb:1 },

      3: { hp1: 30, hp2: 30, hp3: 0,  heart: 2, multi: 2, cross:1, bomb:1 },

      4: { hp1: 20, hp2: 20, hp3: 20, heart: 2, multi: 2, cross:1, bomb:1 },

      5: { hp1: 10, hp2: 30, hp3: 20, heart: 2, multi: 2, cross:1, bomb:1 },

      6: { hp1: 10, hp2: 20, hp3: 30, heart: 1, multi: 2, cross:1, bomb:1 },

      7: { hp1: 10, hp2: 20, hp3: 30, heart: 1, multi: 2, cross:1, bomb:1 },

      8: { hp1: 0,  hp2: 30, hp3: 30, heart: 1, multi: 2, cross:1, bomb:1 },

      9: { hp1: 0,  hp2: 30, hp3: 30, heart: 1, multi: 1, cross:1, bomb:1 },

      10:{ hp1: 0,  hp2: 20, hp3: 40, heart: 1, multi: 1, cross:1, bomb:1 }

    };

    return configs[this.level] || configs[1];
  }
  getObstaclePositions() {

    const obstacles = [];

    if (this.level === 8 || this.level === 10) {

      obstacles.push({row:1,col:3});
      obstacles.push({row:1,col:6});
      obstacles.push({row:4,col:3});
      obstacles.push({row:4,col:6});

    }

    if (this.level === 9 || this.level === 10) {

      obstacles.push({row:0,col:0});
      obstacles.push({row:0,col:9});
      obstacles.push({row:5,col:0});
      obstacles.push({row:5,col:9});

    }

    return obstacles;
  }
  createBricks() {

    this.bricks = this.physics.add.staticGroup();

    const rows = 6;
    const cols = 10;

    const brickWidth = 60;
    const brickHeight = 25;

    const padding = 10;

    const offsetX = 85;
    const offsetY = 80;

    const config = this.getLevelConfig();
    const obstacles = this.getObstaclePositions();
    const obstacleCount = obstacles.length;
    const totalBricks = rows * cols - obstacleCount;

    // ===== TẠO LIST HP =====
    let hpList = [];

    for (let i = 0; i < config.hp1; i++) hpList.push(1);
    for (let i = 0; i < config.hp2; i++) hpList.push(2);
    for (let i = 0; i < config.hp3; i++) hpList.push(3);

    while (hpList.length < totalBricks) hpList.push(1);

    Phaser.Utils.Array.Shuffle(hpList);

    // ===== TẠO LIST SPECIAL =====
    let specialList = [];

    for (let i = 0; i < config.heart; i++) specialList.push("heart");
    for (let i = 0; i < config.multi; i++) specialList.push("multi");
    for (let i = 0; i < (config.cross || 0); i++) specialList.push("cross");
    for (let i = 0; i < (config.bomb || 0); i++) specialList.push("bomb");

    while (specialList.length < totalBricks) specialList.push(null);

    Phaser.Utils.Array.Shuffle(specialList);

    let index = 0;

    for (let row = 0; row < rows; row++) {

      for (let col = 0; col < cols; col++) {

        const x = offsetX + col * (brickWidth + padding);
        const y = offsetY + row * (brickHeight + padding);
        const isObstacle = obstacles.some(o => o.row === row && o.col === col);

        if (isObstacle) {

          const brick = this.bricks.create(x, y, "obstacle");

          brick.setData("hp", -1);
          brick.setData("special", null);

          continue;
        }
        const hp = hpList[index];
        const special = specialList[index];

        const brickType = `brick${row}`;

        const brick = this.bricks.create(x, y, brickType);

        brick.setData("hp", hp);
        brick.setData("special", special);

        const label = this.add.text(
          x,
          y,
          this.getBrickLabel(hp, special),
          {
            fontSize: "16px",
            color: "#000"
          }
        ).setOrigin(0.5);

        brick.setData("label", label);

        index++;
      }
    }
  }

  update() {

    if (this.isPaused) return;
    if (this.isGameOver) return;

    if (this.controller) {

      this.controller.updateMovement();

      const handPosition = this.controller.getPaddlePosition();
      const gameWidth = this.sys.game.config.width;

      this.paddle.x = handPosition * gameWidth;

      const halfWidth = this.paddle.width / 2;

      this.paddle.x = Phaser.Math.Clamp(
        this.paddle.x,
        halfWidth,
        gameWidth - halfWidth
      );

      if (!this.gameStarted && this.controller.justClosedFist()) {
        this.startGame();
      }
    }

    if (!this.gameStarted) {
      const ball = this.balls.getFirstAlive();

      if (ball) {
        ball.setPosition(this.paddle.x, this.paddle.y - 20);
      }
    }

    if (this.gameStarted && !this.lifeLock) {

      const h = this.sys.game.config.height;

      this.balls.getChildren().forEach(ball => {
        if (ball.y > h + 30) {
          ball.destroy();
        }
      });

      if (this.balls.countActive(true) === 0) {
        this.lifeLock = true;
        this.loseLife();
      }
    }
  }

  startGame() {

    if (this.gameStarted || this.isGameOver) return;

    this.gameStarted = true;
    this.lifeLock = false;

    const angle = Phaser.Math.Between(-30, 30);
    const speed = this.baseSpeed;

    const ball = this.balls.getFirstAlive();

    if (ball) {
      ball.setVelocity(
        Math.sin(angle * Math.PI / 180) * speed,
        -speed
      );
    }

    if (this.instructionText) {
      this.instructionText.destroy();
    }
  }

  hitPaddle(ball, paddle) {

    const diff = ball.x - paddle.x;
    const percent = diff / (paddle.width / 2);

    const angle = percent * 60;
    const speed = this.baseSpeed;

    const rad = Phaser.Math.DegToRad(angle);

    ball.setVelocity(
      speed * Math.sin(rad),
      -speed * Math.cos(rad)
    );
  }

hitBrick(ball, brick) {

  if (brick.getData("hp") === -1) {
    return;
  }

  let hp = brick.getData("hp") - 1;
  brick.setData("hp", hp);

  if (hp > 0) {

    const label = brick.getData("label");

    if (label) {
      label.setText(
        this.getBrickLabel(
          hp,
          brick.getData("special")
        )
      );
    }

    return;
  }

  // gạch chết → chuyển sang damageBrick xử lý
  this.damageBrick(brick);

}

  loseLife() {

    if (this.isGameOver) return;

    this.lives = Math.max(0, this.lives - 1);

    this.livesText.setText("Mạng: " + this.lives);

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.resetBall();
    }
  }

  resetBall() {

    if (this.isGameOver) return;

    this.gameStarted = false;
    this.lifeLock = false;

    if (this.controller && this.controller.resetGestureState) {
      this.controller.resetGestureState();
    }

    this.balls.clear(true, true);

    this.spawnBall(
      this.paddle.x,
      this.paddle.y - 20
    );

    this.instructionText = this.add.text(
      400,
      300,
      "👊 Nắm tay để tiếp tục!",
      {
        fontSize: "32px",
        fill: "#ffff00",
        fontFamily: "Arial",
        stroke: "#000",
        strokeThickness: 6
      }
    ).setOrigin(0.5);
  }

  async gameOver() {

    this.isGameOver = true;
    this.gameStarted = false;
    this.lifeLock = true;

    this.balls.getChildren().forEach(ball => {
      ball.setVelocity(0, 0);
      ball.body.enable = false;
    });

    this.add.text(400, 300, "GAME OVER!", {
      fontSize: "64px",
      fill: "#ff0000",
      fontFamily: "Arial",
      stroke: "#000",
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(400, 370, "Điểm: " + this.score, {
      fontSize: "32px",
      fill: "#fff",
      fontFamily: "Arial",
      stroke: "#000",
      strokeThickness: 4
    }).setOrigin(0.5);
    
    await this.checkHighScore();
    this.time.delayedCall(3000, () => {

      if (this.mode === "level") {
        this.scene.start("LevelSelectScene", {
          controller: this.controller,
          player: this.player,
          userId: window.currentUserId,
          score: 0
        });
      } else {
        this.scene.restart({
          controller: this.controller,
          mode: this.mode,
          player: this.player,
          userId: window.currentUserId,
        });
      }

    });
  }

  winGame() {

    this.isGameOver = true;
    this.gameStarted = false;
    this.lifeLock = true;

    this.balls.getChildren().forEach(ball => {
      ball.setVelocity(0, 0);
      ball.body.enable = false;
    });

    this.add.text(400, 300, "CHIẾN THẮNG!", {
      fontSize: "64px",
      fill: "#00ff00",
      fontFamily: "Arial",
      stroke: "#000",
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(400, 370, "Điểm: " + this.score, {
      fontSize: "32px",
      fill: "#fff",
      fontFamily: "Arial",
      stroke: "#000",
      strokeThickness: 4
    }).setOrigin(0.5);
    if(window.currentUserId){
      fetch(`${API_URL}/completeLevel`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          userId:window.currentUserId,
          level:this.level
        })
      });
    }
    console.log("Hoàn thành level", this.level);

    this.time.delayedCall(3000, () => {

      if (this.mode === "level") {
        this.scene.start("LevelSelectScene", {
          controller: this.controller,
          score: this.score,
          player: this.player,
          userId: window.currentUserId
        });
      } else {
        this.scene.restart({
          controller: this.controller,
          mode: this.mode
        });
      }

    });
  }

  spawnBall(x, y, vx = 0, vy = 0) {

    const ball = this.balls.create(x, y, "ball");

    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    ball.setVelocity(vx, vy);

    this.physics.add.collider(
      ball,
      this.paddle,
      this.hitPaddle,
      null,
      this
    );

    this.physics.add.collider(
      ball,
      this.bricks,
      this.hitBrick,
      null,
      this
    );

    return ball;
  }

  getBrickLabel(hp, special) {

    let text = "";

    if (hp > 1) text += hp;
    if (special === "heart") text += " 💝";
    if (special === "multi") text += " ✨";
    if (special === "cross") text += " ⚡";
    if (special === "bomb") text += " 💣";
    return text;
  }
  explode3x3(centerBrick) {

    const cx = centerBrick.x;
    const cy = centerBrick.y;

    this.bricks.getChildren().forEach(b => {

      if (!b.active) return;
      if (b.getData("hp") === -1) return;

      const dx = Math.abs(b.x - cx);
      const dy = Math.abs(b.y - cy);

      if (dx <= 70 && dy <= 35) {

        this.damageBrick(b);

        const boom = this.add.circle(b.x, b.y, 20, 0xffaa00);
        this.tweens.add({
          targets: boom,
          scale: 2,
          alpha: 0,
          duration: 300,
          onComplete: () => boom.destroy()
        });

      }

    });

  }
  explodeCross(centerBrick) {

    const cx = centerBrick.x;
    const cy = centerBrick.y;

    const hLaser = this.add.rectangle(400, cy, 800, 4, 0xffff00);
    const vLaser = this.add.rectangle(cx, 300, 4, 600, 0xffff00);

    this.tweens.add({
      targets: [hLaser, vLaser],
      alpha: 0,
      duration: 300,
      onComplete: () => {
        hLaser.destroy();
        vLaser.destroy();
      }
    });

    this.bricks.getChildren().forEach(b => {

      if (!b.active) return;
      if (b.getData("hp") === -1) return;

      if (b.x === cx || b.y === cy) {
        this.damageBrick(b);
      }

    });

  }
  damageBrick(brick) {

    if (!brick.active) return;
    if (brick.getData("hp") === -1) return;

    let hp = brick.getData("hp") - 1;
    brick.setData("hp", hp);

    if (hp > 0) {

      const label = brick.getData("label");

      if (label) {
        label.setText(
          this.getBrickLabel(
            hp,
            brick.getData("special")
          )
        );
      }

      return;
    }

    const special = brick.getData("special");

    if (special === "heart") {
      this.lives++;
      this.livesText.setText("Mạng: " + this.lives);
    }

    if (special === "multi") {

      const balls = [...this.balls.getChildren()];

      balls.forEach(b => {

        const vx = b.body.velocity.x;
        const vy = b.body.velocity.y;

        this.spawnBall(
          b.x,
          b.y,
          -vx,
          vy
        );

      });

    }

    if (special === "cross") {
      this.explodeCross(brick);
    }

    if (special === "bomb") {
      this.explode3x3(brick);
    }

    const label = brick.getData("label");
    if (label) label.destroy();

    brick.disableBody(true, true);

    // ===== CỘNG ĐIỂM THEO LEVEL =====
    this.scorePerBrick = 9 + this.level;
    this.score += this.scorePerBrick;

    this.scoreText.setText("Điểm: " + this.score);

    // ===== CHECK WIN =====
    const remaining = this.bricks.getChildren().filter(
      b => b.getData("hp") !== -1 && b.active
    ).length;

    if (remaining === 0) {
      this.winGame();
    }

  }
  async checkHighScore() {

    const userId = window.currentUserId;

    if (!userId) return;

    await fetch(`${API_URL}/saveScore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: userId,
        game: "breakout",
        score: this.score
      })
    });

    if (window.updateHighScoreBoard) {
      window.updateHighScoreBoard();
    }

  }
  openPauseMenu() {

    if (this.isPaused) return;
    this.pauseButton.disableInteractive();
    this.isPaused = true;

    this.physics.pause();

    // nền mờ
    this.pauseBg = this.add.rectangle(
      400, 300, 800, 600, 0x000000, 0.6
    );

    // bảng menu
    this.pausePanel = this.add.rectangle(
      400, 300, 300, 200, 0x222222
    ).setStrokeStyle(3, 0xffffff);

    this.pauseTitle = this.add.text(
      400, 240,
      "PAUSED",
      { fontSize: "40px", fill: "#fff" }
    ).setOrigin(0.5);

    // ===== CONTINUE =====
    this.continueBtn = this.add.text(
      400, 300,
      "CONTINUE",
      {
        fontSize: "28px",
        fill: "#00ff00",
        backgroundColor: "#000",
        padding: { x: 10, y: 5 }
      }
    )
    .setOrigin(0.5)
    .setInteractive();

    this.continueBtn.on("pointerdown", () => {
      this.closePauseMenu();
    });

    // ===== RESET =====
    this.resetBtn = this.add.text(
      400, 350,
      "RESET",
      {
        fontSize: "28px",
        fill: "#ff4444",
        backgroundColor: "#000",
        padding: { x: 10, y: 5 }
      }
    )
    .setOrigin(0.5)
    .setInteractive();

this.resetBtn.on("pointerdown", () => {
  this.score = 0;
  if (this.controller && this.controller.resetGestureState) {
    this.controller.resetGestureState();
  }

      this.scene.restart({
        controller: this.controller,
        mode: this.mode,
        level: this.level
      });
    });
}

  closePauseMenu() {
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.isPaused = false;

    this.physics.resume();

    this.pauseBg.destroy();
    this.pausePanel.destroy();
    this.pauseTitle.destroy();
    this.continueBtn.destroy();
    this.resetBtn.destroy();
  }
}
class LevelSelectScene extends Phaser.Scene {

    constructor() {
        super({ key: "LevelSelectScene" });
        // DEV OPTION
        this.levelLockEnabled = true; 
        // đổi thành false là chơi level nào cũng được
    }

    create(data) {

        this.score = data.score || 0;
        this.controller = data.controller;
        this.player = data.player;
        this.userId = data.userId;
        this.completedLevels = {};

        fetch(`${API_URL}/levels/`+this.userId)
        .then(res=>res.json())
        .then(data=>{
          if(data.success){
            this.completedLevels = data.levels;
          }
          this.createLevelButtons();
        });

        this.add.text(
            400,
            50,
            "CHỌN LEVEL",
            {
                fontSize: "43px",
                fill: "#ffffff",
                fontFamily: "Arial",
                stroke: "#000",
                strokeThickness: 6
            }
        ).setOrigin(0.5);

        const centerX = 400;
        const startY = 120;
        const gapY = 40;

        // ===== PANEL NỀN CHO LEVEL =====

        const panelWidth = 260;
        const panelHeight = 460;

        const panel = this.add.rectangle(
            400, // giữa màn hình
            320, // giữa theo chiều dọc
            panelWidth,
            panelHeight,
            0x1e90ff // xanh nước
        )
        .setAlpha(0.85)
        .setStrokeStyle(3, 0xffffff);
    }
    createLevelButtons(){

        const centerX = 400;
        const startY = 120;
        const gapY = 40;

        for (let i = 1; i <= 10; i++) {

            const x = centerX;
            const y = startY + (i - 1) * gapY;

            let isUnlocked = true;

            if (this.levelLockEnabled) {
                if (i === 1) {
                    isUnlocked = true;
                } else {
                    isUnlocked = this.completedLevels[i - 1];
                }
            }

            let label = "Level " + i;

            if (!isUnlocked) {
                label = "🔒 " + label;
            }

            if (this.completedLevels[i]) {
                label += " ✅";
            }

            const btn = this.add.text(
                x,
                y,
                label,
                {
                    fontSize: "28px",
                    fill: "#ffff00",
                    backgroundColor: "#333",
                    padding: { x: 10, y: 5 }
                }
            )
            .setOrigin(0.5);

            if (isUnlocked) {

                btn.setInteractive();

                btn.on("pointerdown", () => {

                    this.scene.stop("BreakoutScene");

                    this.scene.start("BreakoutScene", {
                        controller: this.controller,
                        mode: "level",
                        level: i,
                        score: this.score,
                        player: this.player,
                        userId: window.currentUserId
                    });

                });

            } else {

                btn.setAlpha(0.5);

            }

        }

    }
}