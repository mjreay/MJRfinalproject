const express = require("express");
const app = express();
const path = require("path");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const db = require("./db.js");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/newscore", function (req, res) {
    console.log("ping on new score route");
    const { name, score, socket } = req.query;
    db.addHighScore(name, score, socket)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((err) => {
            console.log("error in adding score serverside:", err);
            res.sendStatus(500);
        });
});

app.get("/getscores", function (req, res) {
    console.log("ping on get top ten scores route");
    db.getHighScores()
        .then(({ rows }) => {
            res.json({ rows });
        })
        .catch((err) => {
            console.log("error in retiriving scores serverside:", err);
            res.sendStatus(500);
        });
});

app.use(express.static(path.join(__dirname, "..", "client")));
app.use(express.static(path.join(__dirname, "..", "client", "public")));
app.use(express.static(path.join(__dirname, "..", "node_modules")));

server.listen(process.env.PORT || 8080, function () {
    console.log("I'm listening.");
});

let playersList = {};
let starPositions = [];
let cloudPositions = [];

function starProcessor() {
    starPositions = [];
    for (var s = 0; s < 40; s++) {
        var star = {
            x: Math.random() * (12800 - 50) + 50,
            y: Math.random() * (400 - 30) + 30,
            size: Math.random() * (1.8 - 0.8) + 0.8,
        };
        starPositions.push(star);
    }
}

function cloudProcessor() {
    cloudPositions = [];
    for (var s = 0; s < 30; s++) {
        var cloud = {
            x: Math.random() * (12800 - 50) + 50,
            y: Math.random() * (400 - 30) + 30,
            size: Math.random() * (0.8 - 0.5) + 0.5,
        };
        cloudPositions.push(cloud);
    }
}

starProcessor();
cloudProcessor();
io.on("connection", (socket) => {
    console.log(`Socket with id of ${socket.id} just connected`);
    let clientName = socket.handshake.query.playerName;
    playersList[socket.id] = {
        x: 100,
        y: 450,
        playerId: socket.id,
        playerName: clientName,
    };
    console.log("clientName is", clientName);
    socket.emit("allPlayers", playersList);
    socket.emit("environmentTrigger", {
        clouds: cloudPositions,
        stars: starPositions,
    });
    socket.broadcast.emit("newPlayerConnected", playersList[socket.id]);

    socket.on("playerMovement", function (movementData) {
        playersList[socket.id].x = movementData.x;
        playersList[socket.id].y = movementData.y;
        socket.broadcast.emit("playerMoved", playersList[socket.id]);
    });

    socket.on("starCollected", function (payload) {
        console.log(payload);
        socket.broadcast.emit("starSyncing", payload);
    });

    socket.on("clientPauseGameRequset", function () {
        socket.broadcast.emit("pauseAll");
    });

    socket.on("gameOver", function () {
        socket.broadcast.emit("gameOverYouWon");
        cloudProcessor();
        starProcessor();
    });

    socket.on("clientResumeGameRequset", function () {
        socket.broadcast.emit("resumeAll");
    });

    socket.on("disconnect", function () {
        console.log(`socket with the id ${socket.id} is now disconnected`);
        socket.broadcast.emit("playerDisconnected", socket.id);
        delete playersList[socket.id];
    });
});
