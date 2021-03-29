/* eslint-disable no-undef */
// const socket = io();
let playersList = [];
let mySocketId = null;

// socket.on("allPlayers", function (payload) {
//     console.log("list of all current players", payload);
//     console.log(payload.length);
// });

// socket.on("newPlayerConnected", function (payload) {
//     console.log("new player detected clientside. Player obj is:", payload);
//     playersList = payload;
//     console.log("local playersList is:", playersList);
// });

// socket.on("playerDisconnected", function (payload) {
//     console.log("discnnect notice recieved");
//     playersList = payload;
//     console.log("local playersList after delete:", playersList);
// });

var config = {
    type: Phaser.AUTO,
    parent: "phaser-example",
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
var player;
var cursors;

function preload() {
    this.load.image("sky", "./assets/sky.png");
    this.load.image("cloud", "./assets/cloud.png");
    this.load.image("ground", "./assets/ground.png");
    this.load.image("star", "./assets/star.png");
    this.load.image("bomb", "./assets/bomb.png");
    this.load.image("plane", "./assets/fly.png");
    this.load.image("planeP2", "./assets/flyP2.png");
}

function create() {
    var self = this;
    this.physics.world.bounds.width = 6000;
    this.physics.world.bounds.height = 800;
    this.cameras.main.setBounds(0, 0, 6000, 400);

    background = this.add.tileSprite(400, 300, 12000, 600, "sky");
    var groundTile = this.add.tileSprite(50, 580, 12000, 50, "ground");

    var score = 0;
    var scoreText;
    scoreText = this.add
        .text(16, 16, "Score: 0", {
            fontSize: "32px",
            fill: "#252b31",
        })
        .setScrollFactor(0)
        .setDepth(1);

    this.add
        .text(100, 250, "Catch the stars, avoid the bombs!", {
            fontSize: "32px",
            fill: "#f505f3",
        })
        .setDepth(1);

    // console.log(this.cameras.main);
    // console.log(game.config.width);

    clouds = this.physics.add.group();

    for (var c = 0; c < 20; c++) {
        clouds
            .create(
                Phaser.Math.FloatBetween(50, 6000),
                Phaser.Math.FloatBetween(50, 350),
                "cloud"
            )
            .setScale(Phaser.Math.FloatBetween(0.3, 0.8));
    }

    //// PLAYER 2 and SOCKET IO STUFF

    this.socket = io();

    this.otherPlayers = this.physics.add.group();

    this.socket.on("allPlayers", function (payload) {
        console.log("list of all current players", payload);
        console.log(payload);
        playersList = payload;
        playersList.forEach((arrayElement) => {
            if (arrayElement.playerName === self.socket.id) {
                addPlayer(self, arrayElement.playerName);
            } else {
                addOtherPlayers(self, arrayElement.playerName);
            }
        });
    });

    this.socket.on("newPlayerConnected", function (payload) {
        console.log(
            "new player detected clientside. New player's info is:",
            payload
        );
        // playersList = payload;
        console.log("local playersList is:", newPlayerId);
        addOtherPlayers(self, newPlayerId);
    });

    this.socket.on("playerDisconnected", function (payload) {
        console.log("discnnect notice recieved");
        playersList = payload;
        console.log("local playersList after delete:", playersList);
    });

    function addPlayer(self, playerInfo) {
        self.player = self.physics.add
            .image(200, 450, "plane")
            .setScale(0.2)
            .setDepth(3)
            .setCollideWorldBounds(true);
        // .setGravityY(300)
    }

    function addOtherPlayers(self, playerInfo) {
        const otherPlayer = self.add
            .sprite(playerInfo.x, playerInfo.y, "planeP2")
            .setScale(0.2);
        console.log(
            "player info passed to add other player function:",
            playerInfo
        );
        otherPlayer.playerId = playerInfo;
        self.otherPlayers.add(otherPlayer);
    }
    // self.physics.add.existing(this.groundTile, true);
    // self.physics.add.collider(this.player, self.groundTile);
    // player = this.physics.add
    //     .sprite(200, 450, "plane")
    //     .setScale(0.2)
    //     .setDepth(3);
    // this.cameras.main.startFollow(playerOne);
    // this.physics.add.existing(groundTile, true);
    // this.physics.add.collider(playerOne, groundTile);

    // self.physics.add.existing(groundTile, true);
    // self.physics.add.collider(self, groundTile);

    // if (playersList.length < 1) {
    //     console.log("p2");
    //     player2 = this.physics.add
    //         .sprite(200, 250, "planeP2")
    //         .setScale(0.3)
    //         .setDepth(3);
    //     this.physics.add.collider(player2, groundTile);
    // }

    /// END OF SOCKET IO STUFF

    // stars = this.physics.add.group();

    // // stars.children.iterate(function (child) {
    // //     child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    // // });

    // for (var s = 0; s < 40; s++) {
    //     stars
    //         .create(
    //             Phaser.Math.FloatBetween(50, 6000),
    //             Phaser.Math.FloatBetween(50, 550),
    //             "star"
    //         )
    //         .setScale(Phaser.Math.FloatBetween(0.5, 1.5))
    //         .setBounce(1)
    //         .setCollideWorldBounds(true)
    //         .setVelocity(Phaser.Math.Between(-100, 100), 20);
    // }
    // this.physics.add.overlap(player, stars, collectStar, null, this);
    // function collectStar(player, star) {
    //     star.disableBody(true, true);

    //     score += 10;
    //     scoreText.setText("Score: " + score);

    //     if (score > 100) {
    //         bombs
    //             .create(
    //                 Phaser.Math.FloatBetween(50, 6000),
    //                 Phaser.Math.FloatBetween(50, 550),
    //                 "bomb"
    //             )
    //             .setScale(4)
    //             .setBounce(1)
    //             .setCollideWorldBounds(true)
    //             .setVelocity(Phaser.Math.Between(-200, 200), 300);
    //     }
    // }

    // bombs = this.physics.add.group();
    // this.physics.add.collider(bombs, groundTile);

    // this.physics.add.collider(player, bombs, hitBomb, null, this);

    // function hitBomb(player) {
    //     this.physics.pause();

    //     player.setTint(0xff0000);

    //     gameOver = true;

    //     background.setTint(0xff0000).setDepth(1);

    //     this.add
    //         .text(250, 250, "Game Over :(", {
    //             fontSize: "40px",
    //             fill: "#000000",
    //         })
    //         .setDepth(4);
    // }

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
            this.player.setVelocityX(450);

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
