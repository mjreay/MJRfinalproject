const mainPage = $("#mainPage");
const scoresScreen = $("#scoresScreen");
const overlay = document.getElementById("gameOverlay");
const pauseOverlay = document.getElementById("pause");
const preGame = document.getElementById("preGame");
const startButton = document.getElementById("startButton");
const nameInput = document.getElementById("nameInput");
const winScreen = document.getElementById("win");
const loseScreen = document.getElementById("lose");

let game;
let playersList = {};
let yourName;
let otherPlayerName;
let pauseHandler;
let pauseEmitter;
let makeAScene;
let yourScore = 0;
let mySocket;
let scoresFromServer;

let scoresList = "<h1><a href=' / '>Top Scores</a></h1>";

//// UI CODE

startButton.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    yourName = nameInput.value;
    if (yourName) {
        runGame();
        preGame.style.display = "none";
        overlay.style.display = "none";
    }
});

pauseOverlay.addEventListener("click", function () {
    pauseEmitter();
    console.log(mySocket);
});

loseScreen.addEventListener("click", function () {
    // overlay.style.display = "none";
    loseScreen.style.display = "none";
    scoreBoardGenerator();
});

winScreen.addEventListener("click", function () {
    // overlay.style.display = "none";
    winScreen.style.display = "none";
    scoreBoardGenerator();
});

function scoreBoardGenerator() {
    axios.get("/getscores").then((response) => {
        scoresFromServer = response.data.rows;
        for (var i = 0; i < scoresFromServer.length; i++) {
            scoresList += `<div class="scoreItem">${i + 1} - ${
                scoresFromServer[i].first
            } - ${scoresFromServer[i].score}</div>`;
        }
        scoresScreen.css("display", "inherit");
        scoresScreen.html(scoresList);
    });
}

//// GAME CODE

function runGame() {
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

    game = new Phaser.Game(config);

    makeAScene = function makeAScene() {
        console.log("in the make a scence fn");
        game.scene.add(
            "letsfly",
            { preload: preload, create: create, update: update },
            true
        );
    };
    makeAScene();

    function preload() {
        console.log("in preload");
        this.load.image("sky", "./assets/sky.png");
        this.load.image("cloud", "./assets/cloud.png");
        this.load.image("ground", "./assets/ground.png");
        this.load.image("star", "./assets/star.png");
        this.load.image("bomb", "./assets/cow.png");
        this.load.image("plane", "./assets/greenplane.png");
        this.load.image("planeP2", "./assets/blueplane.png");
        this.load.image("pause", "./assets/pause.png");
        this.load.audio("collectStar", "./assets/collectStar.mp3");
        this.load.audio("lossSound", "./assets/lossSound.mp3");
    }

    function create() {
        var self = this;
        this.socket = io(window.location + "?playerName=" + yourName);
        // this.socket = io();
        console.log("in create");
        this.physics.world.bounds.width = 12000;
        this.physics.world.bounds.height = 600;
        this.cameras.main.setBounds(0, 0, 12000, 300);

        let background = this.add.tileSprite(400, 300, 24000, 600, "sky");
        this.add.tileSprite(50, 580, 24000, 50, "ground");

        var yourScoreText = this.add
            .text(16, 16, "Your Score: " + yourScore, {
                fontSize: "32px",
                fill: "#252b31",
            })
            .setScrollFactor(0)
            .setDepth(4);

        var otherScore = 0;
        var otherScoreText = this.add
            .text(18, 45, "", {
                fontSize: "20px",
                fill: "#252b31",
            })
            .setScrollFactor(0)
            .setDepth(4);

        this.sound.add("collectStar");
        this.sound.add("lossSound");

        this.pauseButton = this.add
            .image(775, 20, "pause")
            .setInteractive()
            // .image(775, 20, "pause")
            .setScrollFactor(0)
            .setDepth(3)
            .on("pointerdown", function () {
                if (self.physics.world.isPaused) {
                    self.socket.emit("clientResumeGameRequset");
                    pauseHandler();
                } else {
                    self.socket.emit("clientPauseGameRequset");
                    pauseHandler();
                }
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

        //// PLAYER 2 and SOCKET IO STUFF

        this.otherPlayers = this.physics.add.group();
        this.starGroup = this.physics.add.group();
        this.cloudGroup = this.physics.add.staticGroup();
        this.bombGroup = this.physics.add.group();

        this.socket.on("allPlayers", function (payload) {
            console.log("list of all current players", payload);
            console.log(payload);
            mySocket = self.socket.id;
            playersList = payload;
            Object.keys(playersList).forEach(function (id) {
                if (playersList[id].playerId === self.socket.id) {
                    addPlayer(self);
                } else {
                    addOtherPlayers(self, playersList[id]);
                }
            });
        });

        this.socket.on("environmentTrigger", function (payload) {
            starHandler(self, payload.stars);
            cloudHandler(self, payload.clouds);
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
                    // if (this.speedX < 800) {
                    //     this.speedX += 50;
                    // }

                    this.socket.emit("starCollected", {
                        starId: starGroup.id,
                        score: yourScore,
                    });
                    yourScoreText.setText("Your Score: " + yourScore);
                    if (yourScore > 50) {
                        self.bombGroup
                            .create(
                                Phaser.Math.FloatBetween(50, 6000),
                                Phaser.Math.FloatBetween(50, 550),
                                "bomb"
                            )
                            .setScale(1)
                            .setBounce(1)
                            .setCollideWorldBounds(true)
                            .setVelocity(Phaser.Math.Between(-500, 500), 400);
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
                    self.socket.emit("gameOver");
                    gameOverHandler("lose");
                },
                null,
                self
            );
        }

        this.socket.on("starSyncing", function (payload) {
            self.starGroup.children.entries[payload.starId].disableBody(
                true,
                true
            );
            otherScore = payload.score;
            otherScoreText.setText(`${otherPlayerName}'s Score: ${otherScore}`);
        });

        this.socket.on("pauseAll", function () {
            console.log("pause heard in all");
            pauseHandler();
        });

        this.socket.on("resumeAll", function () {
            console.log("resume heard in all");
            pauseHandler();
        });

        this.socket.on("gameOverYouWon", function () {
            gameOverHandler("win");
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
            console.log("player info in add other fn:", playerInfo);
            otherPlayerName = playerInfo.playerName;
            self.otherPlayers.add(otherPlayer);
            otherScoreText.setText(`${otherPlayerName}'s Score: ${otherScore}`);
        }

        pauseEmitter = function pauseEmitter() {
            if (self.physics.world.isPaused) {
                self.socket.emit("clientResumeGameRequset");
                pauseHandler();
            } else {
                self.socket.emit("clientPauseGameRequset");
                pauseHandler();
            }
        };

        pauseHandler = function pauseHandler() {
            if (self.physics.world.isPaused) {
                overlay.style.display = "none";
                pauseOverlay.style.display = "none";
                self.physics.resume();
            } else {
                self.physics.pause();
                preGame.style.display = "none";
                pauseOverlay.style.display = "inherit";
                overlay.style.display = "inherit";
            }
        };

        function gameOverHandler(outcome) {
            console.log("game over function");
            self.physics.pause();
            overlay.style.display = "inherit";
            if (outcome == "win") {
                winScreen.style.display = "inherit";
            } else {
                loseScreen.style.display = "inherit";
            }
            axios
                .get(
                    `/newscore?name=${yourName}&score=${yourScore}&socket=${mySocket}`
                )
                .then(() => {
                    console.log("score successfully saved");
                })
                .catch((err) => {
                    console.log("error in saving score clientside");
                });
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
            if (this.cursors.right.isDown) {
                if (this.cursors.right.isDown && this.cursors.space.isDown) {
                    this.player.setVelocityX(this.speedX + 300);
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
                (x !== this.player.oldPosition.x ||
                    y !== this.player.oldPosition.y)
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
}
