var overlay = document.getElementById("gameOverlay");

overlay.addEventListener("click", function (event) {
    event.stopPropagation();
    console.log("sheep!");
    overlay.style.display = "none";
});
