const results = document.getElementById("results");

document.getElementById("gridBtn").onclick = () => startGame("grid");
document.getElementById("trackingBtn").onclick = () => startGame("tracking");

function showResults(score, accuracy, hits, shots) {
  document.exitPointerLock();
  hud.style.display = "none";
  results.style.display = "flex";

  document.getElementById("resScore").textContent = `Score: ${score}`;
  document.getElementById("resHits").textContent = `Hits: ${hits}`;
  document.getElementById("resShots").textContent = `Shots: ${shots}`;
  document.getElementById("resAcc").textContent = `Accuracy: ${accuracy}%`;
}

function backToMenu() {
  results.style.display = "none";
  menu.style.display = "flex";
}
