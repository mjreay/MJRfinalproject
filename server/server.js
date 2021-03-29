const express = require("express");
const app = express();
const path = require("path");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const db = require("./db.js");

// app.get("/", function (req, res) {
//     // just a normal route
//     res.render("./index.html");
// });

app.use(express.static(path.join(__dirname, "..", "client")));
app.use(express.static(path.join(__dirname, "..", "client", "public")));
app.use(express.static(path.join(__dirname, "..", "node_modules")));

server.listen(process.env.PORT || 8080, function () {
    console.log("I'm listening.");
});

let playersList = {};

io.on("connection", (socket) => {
    console.log(`Socket with id of ${socket.id} just connected`);
    playersList[socket.id] = {
        x: null,
        y: null,
        playerId: socket.id,
    };
    socket.emit("allPlayers", playersList);
    socket.broadcast.emit("newPlayerConnected", playersList[socket.id]);
    console.log("PlayersList after add:", playersList);

    socket.on("playerMovement", function (movementData) {
        playersList[socket.id].x = movementData.x;
        playersList[socket.id].y = movementData.y;
        playersList[socket.id].rotation = movementData.rotation;
        socket.broadcast.emit("playerMoved", playersList[socket.id]);
    });

    socket.on("disconnect", function () {
        console.log(`socket with the id ${socket.id} is now disconnected`);
        delete playersList[socket.id];
        console.log("PlayersList after delete:", playersList);
        io.emit("playerDisconnected", playersList);
    });
});
