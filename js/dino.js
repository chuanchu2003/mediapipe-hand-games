class DinoScene extends Phaser.Scene {

  constructor() {
    super({ key: "DinoScene" });

    this.controller = null;

    this.score = 0;
    this.lives = 3;

    this.speed = 10;
    this.baseWorldSpeed = 450;

    this.gameStarted = true;
    this.isGameOver = false;

    this.invincible = false;

    this.groundY = 700;

    this.dino = null;

    this.grounds = [];
    this.obstacles = [];
    this.clouds = [];

    this.scoreText = null;
    this.speedText = null;
    this.livesText = null;

    this.restartButton = null;
    this.gameOverText = null;
    this.restartHint = null;

    this.spawnTimer = 0;
    this.cloudTimer = 0;

    this.scaleFactor = 2.5;
  }

  init(data) {

    this.controller = data?.controller || this.controller;

    if (this.controller) {

      this.controller.setControlMode("pinch");

      if (this.controller.resetGestureState) {
        this.controller.resetGestureState();
      }
    }

    this.score = 0;
    this.lives = 3;
    this.speed = 10;

    this.gameStarted = true;
    this.isGameOver = false;
    this.invincible = false;

    this.obstacles = [];
    this.clouds = [];
  }

  preload() {

    const img = "images/";

    this.load.image("restart", img + "restart.png");

    this.load.image("cloud", img + "cloud.png");

    this.load.image("way", img + "way.png");

    this.load.image("cactusmini1", img + "cactusmini1.png");
    this.load.image("cactusmini2", img + "cactusmini2.png");
    this.load.image("cactusmini3", img + "cactusmini3.png");

    this.load.image("cactus1", img + "cactus1.png");
    this.load.image("cactus2", img + "cactus2.png");
    this.load.image("cactus3", img + "cactus3.png");

    this.load.image("flydino1", img + "flydino1.png");
    this.load.image("flydino2", img + "flydino2.png");

    this.load.image("dino1", img + "dino1.png");
    this.load.image("dino2", img + "dino2.png");
    this.load.image("dino3", img + "dino3.png");
    this.load.image("dino4", img + "dino4.png");
    this.load.image("dino5", img + "dino5.png");

    this.load.image("dinodie", img + "dinodie.png");
  }

  create() {

    const W = this.sys.game.config.width;
    const H = this.sys.game.config.height;

    this.cameras.main.setBackgroundColor("#f5f5f5");

    this.createGround();

    this.createDino();

    this.createUI();

    this.createAnimations();
  }

  createGround() {

    const wayScale = this.scaleFactor;

    const groundWidth = 1204 * wayScale;

    const g1 = this.add.image(
      groundWidth / 2,
      this.groundY,
      "way"
    )
    .setOrigin(0.5, 0.5)
    .setScale(wayScale);

    const g2 = this.add.image(
      groundWidth + groundWidth / 2,
      this.groundY,
      "way"
    )
    .setOrigin(0.5, 0.5)
    .setScale(wayScale);

    this.grounds = [g1, g2];
  }

  createDino() {

    const dinoScale = this.scaleFactor;

    const dinoHeight = 47 * dinoScale;

    this.dino = this.add.sprite(
      120,
      this.groundY - dinoHeight / 2 + 4,
      "dino1"
    );

    this.dino.setScale(dinoScale);

    this.dinoVelocityY = 0;

    this.gravity = 2200;

    this.jumpVelocity = -950;

    this.onGround = true;
  }

  createUI() {

    const W = this.sys.game.config.width;

    this.livesText = this.add.text(
      20,
      20,
      "❤️❤️❤️",
      {
        fontSize: "32px",
        color: "#ff0000",
        fontFamily: "Arial"
      }
    );

    this.scoreText = this.add.text(
      W - 20,
      20,
      "Score: 0",
      {
        fontSize: "28px",
        color: "#000",
        fontFamily: "Arial"
      }
    )
    .setOrigin(1, 0);

    this.speedText = this.add.text(
      20,
      this.groundY + 40,
      "Speed: 10",
      {
        fontSize: "24px",
        color: "#000",
        fontFamily: "Arial"
      }
    );
  }

  createAnimations() {

    this.anims.create({
      key: "run",
      frames: [
        { key: "dino1" },
        { key: "dino2" },
        { key: "dino3" },
        { key: "dino4" },
        { key: "dino5" }
      ],
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "fly",
      frames: [
        { key: "flydino1" },
        { key: "flydino2" }
      ],
      frameRate: 6,
      repeat: -1
    });

    this.dino.play("run");
  }

  update(time, delta) {

    if (this.isGameOver) {
      return;
    }

    if (this.controller) {
      this.controller.updateMovement();
    }

    this.updateGround(delta);

    this.updateJump(delta);
  }

  updateGround(delta) {

    const speed =
      this.baseWorldSpeed *
      (delta / 1000);

    this.grounds.forEach(g => {

      g.x -= speed;

    });

    const width =
      1204 *
      this.scaleFactor;

    if (this.grounds[0].x < -width / 2) {

      this.grounds[0].x =
        this.grounds[1].x + width;

      this.grounds.push(
        this.grounds.shift()
      );
    }
  }

  updateJump(delta) {

    const jumpPressed =
      this.controller &&
      this.controller.isJumping &&
      this.controller.isJumping("dino");

    if (
      jumpPressed &&
      this.onGround
    ) {

      this.dinoVelocityY =
        this.jumpVelocity;

      this.onGround = false;
    }

    const dt = delta / 1000;

    this.dinoVelocityY +=
      this.gravity * dt;

    this.dino.y +=
      this.dinoVelocityY * dt;

    const groundLevel =
      this.groundY -
      (47 * this.scaleFactor) / 2 +
      4;

    if (this.dino.y >= groundLevel) {

      this.dino.y =
        groundLevel;

      this.dinoVelocityY = 0;

      this.onGround = true;
    }
  }
}