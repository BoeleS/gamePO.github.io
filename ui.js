function showResults(score, accuracy, hits, shots) {
  document.exitPointerLock();
  hud.style.display = "none";
  menu.style.display = "flex";

  menu.innerHTML = `
    <h1>RESULTS</h1>
    <div class="result">Score: ${score}</div>
    <div class="result">Hits: ${hits}</div>
    <div class="result">Shots: ${shots}</div>
    <div class="result">Accuracy: ${accuracy}%</div>
    <button onclick="location.reload()">BACK TO MENU</button>
  `;
}
