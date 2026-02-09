const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let targets = [];
let score = 0;
let shots = 0;
let hits = 0;
let timeLeft = 180;
let gameMode = "";
let running = false;

const hud = document.getElementById("hud");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const accEl = document.getElementById("accuracy");
const menu = document.getElementById("menu");

// Start game
function startGame(mode) {
  gameMode = mode;
  menu.style.display = "none";
  hud.style.display = "block";

  score = 0;
  shots = 0;
  hits = 0;
  timeLeft = 180;
  targets = [];
  running = true;

  canvas.requestPointerLock();
  spawnTarget();
}

// Mouse shooting
window.addEventListener("mousedown", () => {
  if (!running) return;
  shots++;

  targets.forEach((t, i) => {
    const dx = canvas.width / 2 - t.x;
    const dy = canvas.height / 2 - t.y;
    if (Math.hypot(dx, dy) < t.r) {
      hits++;
      score += 100;
      targets.splice(i, 1);
      spawnTarget();
    }
  });
});

// Spawn target
function spawnTarget() {
  targets.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: 25,
    vx: Math.random() * 4 - 2,
    vy: Math.random() * 4 - 2
  });
}

// Timer
setInterval(() => {
  if (!running) return;
  timeLeft--;
  if (timeLeft <= 0) endGame();
}, 1000);

// End screen
function endGame() {
  running = false;
  document.exitPointerLock();
  menu.style.display = "flex";
  hud.style.display = "none";

  const accuracy = shots === 0 ? 0 : Math.round((hits / shots) * 100);

  menu.innerHTML = `
    <h1>Training Klaar</h1>
    <p>Score: ${score}</p>
    <p>Accuracy: ${accuracy}%</p>
    <button onclick="location.reload()">Opnieuw</button>
  `;
}

// Update
function update() {
  if (!running) return;

  if (gameMode === "moving") {
    targets.forEach(t => {
      t.x += t.vx;
      t.y += t.vy;

      if (t.x < 0 || t.x > canvas.width) t.vx *= -1;
      if (t.y < 0 || t.y > canvas.height) t.vy *= -1;
    });
  }

  const accuracy = shots === 0 ? 100 : Math.round((hits / shots) * 100);

  scoreEl.textContent = `Score: ${score}`;
  timeEl.textContent = `⏱ ${timeLeft}`;
  accEl.textContent = `Accuracy: ${accuracy}%`;
}

// Draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  targets.forEach(t => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Crosshair
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2);
  ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2);
  ctx.moveTo(canvas.width / 2, canvas.height / 2 - 10);
  ctx.lineTo(canvas.width / 2, canvas.height / 2 + 10);
  ctx.stroke();
}

// Loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
