const { default: axios } = require("axios");

const overlay = document.getElementById("gameOverlay");
const startButton = document.getElementById("startButton");
const nameInput = document.getElementById("nameInput");

startButton.addEventListener("click", function (event) {
    event.stopPropagation();
    event.preventDefault();
    console.log(nameInput.value);

    overlay.style.display = "none";
});
