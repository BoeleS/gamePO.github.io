// ================== CANVAS SETUP ==================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ================== UI ELEMENTEN ==================
const menu = document.getElementById("menu");
const hud = document.getElementById("hud");

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const accEl = document.getElementById("accuracy");

// ================== GAME STATE ==================
let targets = [];
let mode = "";
let running = false;

let score = 0;
let shots = 0;
let hits = 0;
let timeLeft = 180;

// ================== START GAME ==================
function startGame(selectedMode) {
  mode = selectedMode;

  menu.style.display = "none";
  document.getElementById("results").style.display = "none";
  hud.style.display = "block";

  score = 0;
  shots = 0;
  hits = 0;
  timeLeft = 180;
  targets = [];
  running = true;

  canvas.requestPointerLock();
  targets.push(createTarget(mode));
}

// ================== SHOOTING ==================
window.addEventListener("mousedown", () => {
  if (!running) return;

  shots++;

  let hit = false;

  targets.forEach((t, i) => {
    const dx = canvas.width / 2 - t.x;
    const dy = canvas.height / 2 - t.y;

    if (Math.hypot(dx, dy) <= t.r) {
      hit = true;
      hits++;
      score += 100;
      targets.splice(i, 1);
      targets.push(createTarget(mode));
    }
  });

  // kleine straf voor miss (Aimlabs-achtig)
  if (!hit) {
    score = Math.max(0, score - 10);
  }
});

// ================== TIMER ==================
setInterval(() => {
  if (!running) return;

  timeLeft--;

  if (timeLeft <= 0) {
    endGame();
  }
}, 1000);

// ================== END GAME ==================
function endGame() {
  running = false;
  document.exitPointerLock();
  hud.style.display = "none";

  const accuracy = shots === 0 ? 0 : Math.round((hits / shots) * 100);
  showResults(score, accuracy, hits, shots);
}

// ================== UPDATE ==================
function update() {
  if (!running) return;

  if (mode === "tracking") {
    targets.forEach(t => {
      t.x += t.vx;
      t.y += t.vy;

      if (t.x < t.r || t.x > canvas.width - t.r) t.vx *= -1;
      if (t.y < t.r || t.y > canvas.height - t.r) t.vy *= -1;
    });
  }

  const accuracy = shots === 0 ? 100 : Math.round((hits / shots) * 100);

  scoreEl.textContent = `Score: ${score}`;
  timeEl.textContent = `⏱ ${timeLeft}`;
  accEl.textContent = `Accuracy: ${accuracy}%`;
}

// ================== DRAW ==================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // targets
  targets.forEach(t => {
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ff3b3b";
    ctx.fill();
  });

  // crosshair
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 8, canvas.height / 2);
  ctx.lineTo(canvas.width / 2 + 8, canvas.height / 2);
  ctx.moveTo(canvas.width / 2, canvas.height / 2 - 8);
  ctx.lineTo(canvas.width / 2, canvas.height / 2 + 8);
  ctx.stroke();
}

// ================== GAME LOOP ==================
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
