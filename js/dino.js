class DinoScene extends Phaser.Scene {

  constructor() {
    super({ key: "DinoScene" });
    this.lastSpawnWasFly = false;
    this.nextSpawnDistance = 900;
    this.distanceCounter = 0;
    this.controller = null;

    this.score = 0;
    this.lives = 3;

    this.speed = 10;
    this.baseWorldSpeed = 450;

    this.gameStarted = true;
    this.isGameOver = false;

    this.invincible = false;
    this.invincibleTimer = 0;

    this.groundY = 500;

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

    this.scaleFactor = 2;
    this.debugHitbox = false;
    this.noCollision = false;

    this.hitboxGraphics = null;
    this.baseGap = 900;
    this.gapScaleBonus = 1.3;
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
    this.invincibleTimer = 0;

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
    this.lastObstacleX = 900;
    this.spawnTimer = 0;
    this.cloudTimer = 0;
    this.hitboxGraphics =
    this.add.graphics();
    this.nextSpawnDistance = 900;
    this.distanceCounter = 0;
    this.lastSpawnWasFly = false;
    this.mouseJump = false;

    this.input.on(
    "pointerdown",
    () => {
        this.mouseJump = true;
    }
    );
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

    this.jumpVelocity = -1000;

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

  drawHitboxes(){

  if(!this.debugHitbox){
    this.hitboxGraphics.clear();
    return;
  }

  this.hitboxGraphics.clear();

  this.hitboxGraphics.lineStyle(
    2,
    0xff0000,
    1
  );

  // hitbox dino
    const dinoBoxes =
    this.getDinoHitboxes();

    dinoBoxes.forEach(box=>{

    this.hitboxGraphics.strokeRect(
        box.x,
        box.y,
        box.w,
        box.h
    );

    });

  // hitbox obstacle
  this.obstacles.forEach(obs=>{

    const boxes =
      this.getObstacleHitboxes(obs);

    boxes.forEach(box=>{

      this.hitboxGraphics.strokeRect(
        box.x,
        box.y,
        box.w,
        box.h
      );

    });

  });

}
getDinoHitboxes(){

  const S = this.scaleFactor;

  const left =
    this.dino.x -
    this.dino.displayWidth/2;

  const top =
    this.dino.y -
    this.dino.displayHeight/2;

  return [

    {
      x:left + 0*S,
      y:top + 15*S,
      w:32*S,
      h:20*S
    },
    {
      x:left + 20*S,
      y:top + 0*S,
      w:12*S,
      h:35*S
    },
    {
      x:left + 32*S,
      y:top + 0*S,
      w:12*S,
      h:19*S
    },

    {
      x:left + 8*S,
      y:top + 35*S,
      w:18*S,
      h:12*S
    }

  ];

}
toggleDebugHitbox(){

  this.debugHitbox =
    !this.debugHitbox;

}
toggleNoCollision(){

  this.noCollision =
    !this.noCollision;

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

    if(this.isGameOver){

    const restartPressed =
        this.controller &&
        this.controller.isJumping &&
        this.controller.isJumping("dino");

    if(restartPressed){

        this.restartGame();

    }

    return;

    }

    if (this.controller) {
      this.controller.updateMovement();
    }

    this.updateGround(delta);

    this.updateJump(delta);
    this.updateClouds(delta);
    this.updateObstacles(delta);
    this.updateScore(delta);
    this.drawHitboxes();
    this.updateInvincible(delta);
    this.checkCollision();
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
updateScore(delta){

    this.score += delta * 0.01;

    const scoreInt = Math.floor(this.score);

    this.scoreText.setText(
        "Score: " + scoreInt
    );

    this.speed =
        10 + Math.floor(scoreInt / 100);

    this.speedText.setText(
        "Speed: " + this.speed
    );

}
spawnCloud(){

  const cloud = this.add.image(
    this.sys.game.config.width + 100,
    this.groundY - Phaser.Math.Between(120,300),
    "cloud"
  );

  cloud.setScale(
    Phaser.Math.FloatBetween(
      1.5,
      2.8
    )
  );

  this.clouds.push(cloud);

}
updateClouds(delta){

  this.cloudTimer += delta;

  const speedRatio =
  this.speed / 10;

    let cloudMultiplier =
    1 +
    (speedRatio-1)*1.3;

    cloudMultiplier =
    Math.min(
        2,
        cloudMultiplier
    );

    const cloudGap =
    2500 *
    cloudMultiplier;
  if(this.cloudTimer > cloudGap){

    this.cloudTimer = 0;

    this.spawnCloud();

  }

  const moveSpeed =
    this.baseWorldSpeed * 0.25 *
    (delta/1000);

  for(let i=this.clouds.length-1;i>=0;i--){

    const cloud = this.clouds[i];

    cloud.x -= moveSpeed;

    if(cloud.x < -200){

      cloud.destroy();

      this.clouds.splice(i,1);

    }

  }

}
spawnObstacle(type){

  let sprite;

  if(type==="mini"){

    const key =
      Phaser.Utils.Array.GetRandom([
        "cactusmini1",
        "cactusmini2",
        "cactusmini3"
      ]);

    sprite = this.add.image(
      900,
      0,
      key
    );
    sprite.obsType = "cactusmini";

  }
  else if(type==="big"){

    const key =
      Phaser.Utils.Array.GetRandom([
        "cactus1",
        "cactus2",
        "cactus3"
      ]);

    sprite = this.add.image(
      900,
      0,
      key
    );
    if(key==="cactus3"){
        sprite.obsType="cactus3";
    }else{
        sprite.obsType="cactus";
    }

  }
  else{

    sprite = this.add.sprite(
      900,
      0,
      "flydino1"
    );
    sprite.obsType = "flydino";
    sprite.play("fly");

  }

  sprite.setScale(this.scaleFactor);

  sprite.obstacleType = type;

  this.positionObstacle(sprite);

  this.obstacles.push(sprite);

}
positionObstacle(obs){

  const key = obs.texture.key;

  if(obs.obstacleType==="fly"){

    const offset =
      Phaser.Math.Between(
        30,
        150
      );

    obs.y =
      this.groundY - offset;

    return;

  }

  const h =
    obs.height *
    this.scaleFactor;

  obs.y =
    this.groundY -
    h/2 +
    4;

}
updateObstacles(delta){

  const move =
    this.baseWorldSpeed *
    (1 + this.score/3000) *
    (delta/1000);

  this.distanceCounter += move;

  if(
    this.distanceCounter >
    this.nextSpawnDistance
  ){

    this.distanceCounter = 0;

    const scoreInt =
      Math.floor(this.score);

    const r = Math.random();

    if(
      scoreInt >= 300 &&
      r < 0.2 &&
      !this.lastSpawnWasFly
    ){

      this.spawnObstacle("fly");

      this.lastSpawnWasFly = true;

    }
    else{

      const type =
        Math.random() < 0.5
        ? "mini"
        : "big";

      this.spawnObstacle(type);

      this.lastSpawnWasFly = false;

      // cactus đôi
      if(
        scoreInt >= 100 &&
        Math.random() < 0.25
      ){

        const second =
          this.obstacles[
            this.obstacles.length-1
          ];

        if(second){

          const key =
            second.texture.key;

          if(key !== "cactus3"){

            const clone =
              this.add.image(
                second.x +
                second.displayWidth +
                4 * this.scaleFactor,
                second.y,
                key
              );

            clone.setScale(
              this.scaleFactor
            );

            clone.obsType =
              second.obsType;

            clone.obstacleType =
              second.obstacleType;

            this.obstacles.push(
              clone
            );

          }

        }

      }

    }

    // ===== tính khoảng cách cho lần spawn tiếp theo =====

    const speedRatio =
      this.speed / 10;

    let gapMultiplier =
      1 +
      (speedRatio - 1) * 1.3;

    // giới hạn tối đa x2

    gapMultiplier =
      Math.min(
        2,
        gapMultiplier
      );

    this.nextSpawnDistance =
      Phaser.Math.Between(
        800,
        1100
      ) * gapMultiplier;

  }

  for(
    let i=this.obstacles.length-1;
    i>=0;
    i--
  ){

    const obs =
      this.obstacles[i];

    obs.x -= move;

    if(obs.x < -300){

      obs.destroy();

      this.obstacles.splice(i,1);

    }

  }

}
  updateJump(delta) {

    const jumpPressed =
      this.controller &&
      this.controller.isJumping &&
      this.controller.isJumping("dino");

    const jumpPressed =
        gestureJump ||
        this.mouseJump;

    if (
      jumpPressed &&
      this.onGround
    ) {
        this.mouseJump = false;
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
  rectOverlap(a,b){

    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );

    }

    checkCollision(){

    if(this.noCollision) return;

    if(this.invincible) return;

    const dinoBoxes =
        this.getDinoHitboxes();

    for(const obs of this.obstacles){

        const obsBoxes =
        this.getObstacleHitboxes(obs);

        for(const dinoBox of dinoBoxes){

        for(const obsBox of obsBoxes){

            if(
            this.rectOverlap(
                dinoBox,
                obsBox
            )
            ){

            this.loseLife();

            return;

            }

        }

        }

    }

    }

    loseLife(){

    this.lives--;

    const hearts =
        "❤️".repeat(this.lives) +
        "🤍".repeat(3-this.lives);

    this.livesText.setText(
        hearts
    );

    if(this.lives <= 0){

        this.gameOver();

        return;

    }

    this.invincible = true;

    this.invincibleTimer = 2000;

    }

    updateInvincible(delta){

    if(!this.invincible)
        return;

    this.invincibleTimer -= delta;

    this.dino.visible =
        Math.floor(
        this.invincibleTimer / 100
        ) % 2 === 0;

    if(this.invincibleTimer <= 0){

        this.invincible = false;


        this.dino.visible = true;

    }

  }
  gameOver(){

    this.isGameOver = true;

    this.dino.setTexture(
        "dinodie"
    );

    const W =
        this.sys.game.config.width;

    const H =
        this.sys.game.config.height;

    this.gameOverText =
        this.add.text(
        W/2,
        H/2 - 120,
        "GAME OVER",
        {
            fontSize:"48px",
            color:"#000",
            fontStyle:"bold"
        }
        )
        .setOrigin(0.5);

    this.restartButton =
        this.add.image(
        W/2,
        H/2,
        "restart"
        )
        .setScale(2)
        .setInteractive();

    this.restartHint =
        this.add.text(
        W/2,
        H/2 + 55,
        "👊 Nắm tay để chơi lại",
        {
            fontSize:"20px",
            color:"#000"
        }
        )
        .setOrigin(0.5);

    this.restartButton.on(
        "pointerdown",
        ()=>{
        this.restartGame();
        }
    );

  }
  restartGame(){

    this.scene.restart({
        controller:
        this.controller
    });

  }  
  getObstacleHitboxes(obs){

    const S = this.scaleFactor;

    const left =
        obs.x - obs.displayWidth/2;

    const top =
        obs.y - obs.displayHeight/2;

    if(obs.obsType==="cactusmini"){

        return [

        {
            x:left + 0*S,
            y:top + 5*S,
            w:17*S,
            h:30*S
        },

        {
            x:left + 5*S,
            y:top + 0*S,
            w:7*S,
            h:5*S
        }

        ];

    }

    if(obs.obsType==="cactus"){

        return [

        {
            x:left + 0*S,
            y:top + 12*S,
            w:25*S,
            h:38*S
        },

        {
            x:left + 12*S,
            y:top + 0*S,
            w:1*S,
            h:12*S
        }

        ];

    }

    if(obs.obsType==="cactus3"){

        return [

        {
            x:left + 0*S,
            y:top + 17*S,
            w:29*S,
            h:30*S
        },

        {
            x:left + 5*S,
            y:top + 0*S,
            w:13*S,
            h:14*S
        }

        ];

    }

    if(obs.obsType==="flydino"){

        return [

        {
            x:left + 0*S,
            y:top + 12*S,
            w:46*S,
            h:16*S
        }

        ];

    }

    return [];
    }
}