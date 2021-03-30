/* eslint-disable no-undef */
// const socket = io();
let playersList = {};

var config = {
    type: Phaser.AUTO,
    parent: "gameContainer",
    width: 800,
    height: 600,
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
            gravity: { y: 0 },
        },
    },
};

var game = new Phaser.Game(config);

function makeAScene() {
    console.log("in the make a scence fn");
    game.scene.add(
        "letsfly",
        { preload: preload, create: create, update: update },
        true
    );
}
makeAScene();

function preload() {
    console.log("in preload");
    this.load.image("sky", "./assets/sky.png");
    this.load.image("cloud", "./assets/cloud.png");
    this.load.image("ground", "./assets/ground.png");
    this.load.image("star", "./assets/star.png");
    this.load.image("bomb", "./assets/bomb.png");
    this.load.image("plane", "./assets/greenplane.png");
    this.load.image("planeP2", "./assets/blueplane.png");
    this.load.image("pause", "./assets/pause.png");
    this.load.image("reset", "./assets/reset.png");
    this.load.audio("collectStar", "./assets/collectStar.mp3");
    this.load.audio("lossSound", "./assets/lossSound.mp3");
}

function create() {
    var self = this;
    this.socket = io();
    console.log("in create");
    this.physics.world.bounds.width = 12000;
    this.physics.world.bounds.height = 600;
    this.cameras.main.setBounds(0, 0, 12000, 300);

    background = this.add.tileSprite(400, 300, 24000, 600, "sky");
    this.add.tileSprite(50, 580, 24000, 50, "ground");

    var yourScore = 0;
    var yourScoreText = this.add
        .text(16, 16, "Your Score: " + yourScore, {
            fontSize: "32px",
            fill: "#252b31",
        })
        .setScrollFactor(0)
        .setDepth(2);

    var otherScore = 0;
    var otherScoreText = this.add
        .text(18, 45, "", {
            fontSize: "20px",
            fill: "#252b31",
        })
        .setScrollFactor(0)
        .setDepth(2);

    this.sound.add("collectStar");
    this.sound.add("lossSound");

    this.pauseButton = this.add
        .image(775, 20, "pause")
        .setInteractive()
        // .image(775, 20, "pause")
        .setScrollFactor(0)
        .on("pointerdown", function () {
            console.log("pausebutton clicked", self.physics);
            if (self.physics.world.isPaused) {
                self.socket.emit("clientResumeGameRequset");
                self.physics.resume();
            } else {
                self.socket.emit("clientPauseGameRequset");
                self.physics.pause();
            }
        });

    // this.add
    //     .text(100, 250, "Catch the stars, avoid the bombs!", {
    //         fontSize: "32px",
    //         fill: "#f505f3",
    //     })
    //     .setDepth(4);

    //// PLAYER 2 and SOCKET IO STUFF

    this.otherPlayers = this.physics.add.group();
    this.starGroup = this.physics.add.group();
    this.cloudGroup = this.physics.add.staticGroup();
    this.bombGroup = this.physics.add.group();

    console.log("in create ln 103");

    this.socket.on("allPlayers", function (payload) {
        console.log("list of all current players", payload);
        console.log(payload);
        playersList = payload;
        Object.keys(playersList).forEach(function (id) {
            if (playersList[id].playerId === self.socket.id) {
                addPlayer(self);
            } else {
                addOtherPlayers(self, playersList[id]);
            }
        });
    });

    this.socket.on("newPlayerConnected", function (payload) {
        addOtherPlayers(self, payload);
    });

    this.socket.on("playerMoved", function (payload) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (payload.playerId === otherPlayer.playerId) {
                otherPlayer.x = payload.x;
                otherPlayer.y = payload.y;
            }
        });
    });

    console.log("in create ln 131");
    this.socket.on("environmentTrigger", function (payload) {
        starHandler(self, payload.stars);
        cloudHandler(self, payload.clouds);
    });

    function cloudHandler(self, cloudPositions) {
        for (var c = 0; c < cloudPositions.length - 1; c++) {
            const cloud = self.physics.add
                .image(cloudPositions[c].x, cloudPositions[c].y, "cloud")
                .setScale(cloudPositions[c].size)
                .setDepth(1);
            cloud.id = c;
            self.cloudGroup.add(cloud);
        }
    }

    this.speedX = 450;
    function starHandler(self, starPositions) {
        for (var s = 0; s < starPositions.length - 1; s++) {
            const star = self.physics.add
                .image(starPositions[s].x, starPositions[s].y, "star")
                .setScale(starPositions[s].size)
                .setDepth(3);
            star.id = s;
            self.starGroup.add(star);
        }
        self.physics.add.collider(
            self.player,
            self.starGroup,
            function (player, starGroup) {
                starGroup.disableBody(true, true);
                this.sound.play("collectStar");
                yourScore += 10;
                if (this.speedX < 800) {
                    console.log("in if block of speed escalator");
                    this.speedX = this.speedX + 50;
                }

                this.socket.emit("starCollected", {
                    starId: starGroup.id,
                    score: yourScore,
                });
                yourScoreText.setText("Your Score: " + yourScore);
                if (yourScore > 100) {
                    console.log("bombs triggerd");
                    self.bombGroup
                        .create(
                            Phaser.Math.FloatBetween(50, 6000),
                            Phaser.Math.FloatBetween(50, 550),
                            "bomb"
                        )
                        .setScale(3)
                        .setBounce(1)
                        .setCollideWorldBounds(true)
                        .setVelocity(Phaser.Math.Between(-300, 300), 300);
                }
            },
            null,
            self
        );

        self.physics.add.collider(
            self.player,
            self.bombGroup,
            function () {
                console.log("hit by a bomb!", self.bombGroup);
                this.physics.pause();
                this.sound.play("lossSound");
                this.gameOver = true;
                self.socket.emit("gameOver");
                gameOverHandler(self);
            },
            null,
            self
        );
    }

    this.socket.on("starSyncing", function (payload) {
        self.starGroup.children.entries[payload.starId].disableBody(true, true);
        otherScore = payload.score;
        otherScoreText.setText("Opponent's Score: " + otherScore);
    });

    this.socket.on("pauseAll", function () {
        console.log("pause heard in all");
        self.physics.pause();
    });

    this.socket.on("resumeAll", function () {
        console.log("resume heard in all");
        self.physics.resume();
    });

    this.socket.on("gameOver", function () {
        gameOverHandler();
    });

    this.socket.on("resetGameCommand", function () {
        console.log("in reset command clientside");
        resetGame();
    });

    this.socket.on("playerDisconnected", function (payload) {
        console.log("disconnect notice recieved");
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (payload === otherPlayer.playerId) {
                otherPlayer.destroy();
                otherScoreText.setText("");
            }
        });
    });

    function addPlayer(self) {
        self.player = self.physics.add
            .image(100, 350, "plane")
            .setScale(0.2)
            .setDepth(3)
            .setCollideWorldBounds(true)
            .setGravityY(300);
    }

    function addOtherPlayers(self, playerInfo) {
        const otherPlayer = self.add
            .sprite(playerInfo.x, playerInfo.y, "planeP2")
            .setScale(0.2);
        otherPlayer.playerId = playerInfo.playerId;
        self.otherPlayers.add(otherPlayer);
        otherScoreText.setText("Opponent's Score: " + otherScore);
    }

    function gameOverHandler(self) {
        if (!self) {
            self = this;
        }
        background.setTint(0xff0000).setDepth(5);
        self.add
            .text(250, 250, "Game Over :(", {
                fontSize: "40px",
                fill: "#ffffff",
            })
            .setDepth(5)
            .setScrollFactor(0);
        self.add
            .image(400, 350, "reset")
            .setDepth(5)
            .setScrollFactor(0)
            .setInteractive()
            .on("pointerdown", function () {
                console.log("reset clicked");
                self.socket.emit("resetGameRequest");
                resetGame();
            });
    }

    function resetGame() {
        console.log("reset game function");
        console.log("this scence in reset fn:", self.scene);
        this.game.destroy(true, false);
        playersList = {};
        game = new Phaser.Game(config);
        makeAScene();
        gameOver = false;
    }

    /// END OF SOCKET IO STUFF

    // this.anims.create({
    //     key: "left",
    //     frames: this.anims.generateFrameNumbers("plane", { start: 0, end: 3 }),
    //     frameRate: 10,
    //     repeat: -1,
    // });

    // this.anims.create({
    //     key: "turn",
    //     frames: [{ key: "dude", frame: 4 }],
    //     frameRate: 20,
    // });

    // this.anims.create({
    //     key: "right",
    //     frames: this.anims.generateFrameNumbers("plane", { start: 5, end: 8 }),
    //     frameRate: 10,
    //     repeat: -1,
    // });
    console.log("player is:", this.player);
    this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
    if (this.player) {
        // console.log("player is:", this.player);
        if (this.cursors.right.isDown) {
            if (this.cursors.right.isDown && this.cursors.space.isDown) {
                this.player.setVelocityX(650);
            } else this.player.setVelocityX(this.speedX);

            // player.anims.play("right", true);
        } else if (this.cursors.left.isDown) {
            this.player.setVelocityX(-450);

            // player.anims.play("right", true);
        } else {
            this.player.setVelocityX(0);

            // player.anims.play("turn");
        }
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-230);
        }
        if (this.cursors.down.isDown) {
            this.player.setVelocityY(230);
        }
        this.cameras.main.startFollow(this.player);
        var x = this.player.x;
        var y = this.player.y;
        if (
            this.player.oldPosition &&
            (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)
        ) {
            this.socket.emit("playerMovement", {
                x: this.player.x,
                y: this.player.y,
            });
        }
        this.player.oldPosition = {
            x: this.player.x,
            y: this.player.y,
        };
    }
}
