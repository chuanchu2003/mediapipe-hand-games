
class BirdScene extends Phaser.Scene {

    constructor() {

        super({ key: "BirdScene" });

        this.controller = null;

        this.bird = null;
        this.pipes = null;

        this.score = 0;
        this.debugNoCollision = false; //test xuyên tường để kiểm tra map 
        this.scoreText = null;
        this.instructionText = null;

        this.gameStarted = false;
        this.gameOverFlag = false;

        this.pipeSpeed = 200;
    }

    init(data) {

        this.controller = data.controller;

        this.score = 0;
        this.passCount = 0;
        this.gameStarted = false;
        this.gameOverFlag = false;

        this.pipeSpeed = 200;

        if (this.controller) {

            this.controller.setControlMode("pinch");
            this.controller.resetGestureState();

        }
    }

    preload() {

        this.load.image(
            "bg",
            "images/buildingsAndSky.png"
        );

        this.load.image(
            "ground",
            "images/chevronGround.png"
        );

        this.load.image(
            "pipeUp",
            "images/pipeUP.png"
        );

        this.load.image(
            "pipeDown",
            "images/pipeDOWN.png"
        );

        this.load.image(
            "bird1",
            "images/FlappyFrame1.png"
        );

        this.load.image(
            "bird2",
            "images/FlappyFrame2.png"
        );

        this.load.image(
            "bird3",
            "images/FlappyFrame3.png"
        );

        this.load.image(
            "birdDead",
            "images/FlappyFrameFail.png"
        );

    }

    create() {
        this.add.image(
            400,
            300,
            "bg"
        ).setDisplaySize(
            800,
            600
        ).setDepth(0);
        this.ground =
            this.physics.add.staticImage(
                400,
                599,
                "ground"
            );

        this.ground.displayWidth = 800;
        this.ground.refreshBody();
        this.ground.setDepth(1);
        this.physics.world.setBounds(
            0,
            0,
            800,
            600
        );

        this.bird =
        this.physics.add.sprite(
            200,
            300,
            "bird1"
        );
        this.bird.setScale(1.5);
        this.bird.setDepth(2);
        this.bird.setGravityY(0);
        this.bird.setVelocityY(0);
        this.anims.create({

            key: "fly",

            frames: [

                { key: "bird1" },
                { key: "bird2" },
                { key: "bird3" }

            ],

            frameRate: 8,

            repeat: -1

        });
        this.bird.play("fly");
        if (!this.debugNoCollision) {

            this.physics.add.collider(
                this.bird,
                this.ground,
                this.gameOver,
                null,
                this
            );

        }

        this.pipes =
            this.physics.add.group();

        this.scoreText =
            this.add.text(
                20,
                20,
                "Điểm: 0",
                {
                    fontSize: "30px",
                    fill: "#ffffff"
                }
            );
        this.scoreText.setDepth(3);
        this.instructionText =
            this.add.text(
                400,
                250,
                "🤏 Pinch để bắt đầu",
                {
                    fontSize: "32px",
                    fill: "#ffffff"
                }
            )
            .setOrigin(0.5);

            if (!this.debugNoCollision) {

                this.physics.add.overlap(
                    this.bird,
                    this.pipes,
                    this.gameOver,
                    null,
                    this
                );

            }

        this.time.addEvent({

            delay: 1500,

            loop: true,

            callback: () => {

                if (
                    this.gameStarted &&
                    !this.gameOverFlag
                ) {

                    this.spawnPipe();

                }

            }

        });

    }

    spawnPipe() {

        const gap = 220;

        const center =
            Phaser.Math.Between(
                180,
                420
            );

        const topHeight =
            center - gap / 2;

        const bottomY =
            center + gap / 2;

        // ===== TOP PIPE =====

        const topPipe =
            this.pipes.create(
                850,
                topHeight-25,
                "pipeDown"
            );

        topPipe.body.allowGravity =
            false;

        topPipe.setImmovable(true);

        topPipe.setVelocityX(
            -this.pipeSpeed
        );

        // ===== BOTTOM PIPE =====

        const bottomPipe =
            this.pipes.create(
                850,
                bottomY-20,
                "pipeUp"
            );


        bottomPipe.body.allowGravity =
            false;

        bottomPipe.setImmovable(true);

        bottomPipe.setVelocityX(
            -this.pipeSpeed
        );

        bottomPipe.scored = false;
        bottomPipe.isScorePipe = true;

        topPipe.isScorePipe = false;
        topPipe.setOrigin(0.5,1);
        bottomPipe.setOrigin(0.5,0);
        topPipe.setScale(1.3);
        bottomPipe.setScale(1.3);
    }

    update() {

        if (this.gameOverFlag) {

            if (
                this.controller &&
                this.controller.justClosedFist()
            ) {

                this.scene.restart({
                    controller:
                        this.controller
                });

            }

            return;
        }
        this.bird.rotation =
            Phaser.Math.Clamp(
                this.bird.body.velocity.y / 700,
                -0.5,
                1
            );

        if (this.controller) {

        if (
            !this.gameStarted &&
            this.controller.isJumping("flappy")
        ) {

            this.gameStarted = true;

            this.bird.setGravityY(800);

            this.bird.setVelocityY(-350);

            if (this.instructionText) {
                this.instructionText.destroy();
            }

        }
        else if (
            this.gameStarted &&
            this.controller.isJumping("flappy")
        ) {

            this.bird.setVelocityY(-350);

        }

        }

        if (
        !this.debugNoCollision &&
        (
            this.bird.y < -20 ||
            this.bird.y > 600
        ) 
        ){

            this.gameOver();

        }

        this.pipes
            .getChildren()
            .forEach(pipe => {

            if (
                pipe.isScorePipe &&
                !pipe.scored &&
                pipe.x < this.bird.x
            ){

                    pipe.scored = true;

                    this.passCount++;

                    const reward =
                        10 +
                        Math.floor((this.passCount - 1) / 10);

                    this.score += reward;

                    this.scoreText.setText(
                        "Điểm: " + this.score
                    );

                    this.pipeSpeed =
                        Math.min(
                            350,
                            this.pipeSpeed + 5
                        );

                }

                if (pipe.x < -100) {

                    pipe.destroy();

                }

            });

    }

    async gameOver() {

        if (this.gameOverFlag)
            return;

        this.gameOverFlag = true;
        this.bird.anims.stop();

        this.bird.setTexture(
            "birdDead"
        );
        this.bird.setVelocity(0,0);
        this.physics.pause();

        this.add.text(
            400,
            280,
            "GAME OVER",
            {
                fontSize: "60px",
                fill: "#ff0000"
            }
        )
        .setOrigin(0.5);

        this.add.text(
            400,
            350,
            "👊 Nắm tay để chơi lại",
            {
                fontSize: "28px",
                fill: "#ffffff"
            }
        )
        .setOrigin(0.5);

        if (
            window.currentUserId
        ) {

            await fetch(
                `${API_URL}/saveScore`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({

                        userId:
                            window.currentUserId,

                        game:
                            "flappy",

                        score:
                            this.score

                    })
                }
            );

            if (
                window
                    .updateHighScoreBoard
            ) {

                window
                    .updateHighScoreBoard();

            }

        }

    }

}