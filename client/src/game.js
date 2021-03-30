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
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

var game = new Phaser.Game(config);

function preload() {
    this.load.image("sky", "./assets/sky.png");
    this.load.image("cloud", "./assets/cloud.png");
    this.load.image("ground", "./assets/ground.png");
    this.load.image("star", "./assets/star.png");
    this.load.image("bomb", "./assets/bomb.png");
    this.load.image("plane", "./assets/greenplane.png");
    this.load.image("planeP2", "./assets/blueplane.png");
}

function create() {
    var self = this;
    this.physics.world.bounds.width = 12000;
    this.physics.world.bounds.height = 600;
    this.cameras.main.setBounds(0, 0, 12000, 300);

    background = this.add.tileSprite(400, 300, 24000, 600, "sky");
    var groundTile = this.add.tileSprite(50, 580, 24000, 50, "ground");

    var yourScore = 0;
    var yourScoreText = this.add
        .text(16, 16, "Your Score: " + yourScore, {
            fontSize: "32px",
            fill: "#252b31",
        })
        .setScrollFactor(0)
        .setDepth(2);

    var otherScore = 0;
    var otherScoreText = self.add
        .text(18, 45, "", {
            fontSize: "20px",
            fill: "#252b31",
        })
        .setScrollFactor(0)
        .setDepth(2);

    // this.add
    //     .text(100, 250, "Catch the stars, avoid the bombs!", {
    //         fontSize: "32px",
    //         fill: "#f505f3",
    //     })
    //     .setDepth(4);

    //// PLAYER 2 and SOCKET IO STUFF

    this.socket = io();

    this.otherPlayers = this.physics.add.group();

    this.starGroup = this.physics.add.group();
    this.cloudGroup = this.physics.add.group();
    this.bombGroup = this.physics.add.group();

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
                yourScore += 10;
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
                gameOver = true;
                background.setTint(0xff0000).setDepth(5);

                this.add
                    .text(250, 250, "Game Over :(", {
                        fontSize: "40px",
                        fill: "#000000",
                    })
                    .setDepth(5)
                    .setScrollFactor(0);
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

    this.socket.on("playerDisconnected", function (payload) {
        console.log("disconnect notice recieved");
        console.log("payload on disconnect is:", payload);
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
    this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
    if (this.player) {
        if (this.cursors.right.isDown) {
            if (this.cursors.right.isDown && this.cursors.space.isDown) {
                this.player.setVelocityX(650);
            } else this.player.setVelocityX(450);

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

        /// EMITTING OWN MOVEMENT
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
    // console.log("my socket id is:", mySocketId);
}
