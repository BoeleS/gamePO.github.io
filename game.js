// ================= CANVAS =================
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

window.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ================= UI =================
const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const results = document.getElementById("results");

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const accEl = document.getElementById("accuracy");

// ================= GAME STATE =================
let mode = "";
let running = false;

let score = 0;
let shots = 0;
let hits = 0;
let timeLeft = 180;

let targets = [];
let angle = 0;

// ================= START =================
function startGame(selectedMode) {
  mode = selectedMode;

  menu.style.display = "none";
  results.style.display = "none";
  hud.style.display = "flex";

  score = 0;
  shots = 0;
  hits = 0;
  timeLeft = 180;
  targets = [];
  angle = 0;
  running = true;

  document.exitPointerLock();

  if (mode === "grid") spawnGridTargets();
  if (mode === "tracking") spawnTrackingTarget();
}

// ================= TARGETS =================
function spawnGridTargets() {
  targets = [];
  for (let i = 0; i < 6; i++) {
    targets.push(createTarget());
  }
}

function createTarget() {
  return {
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * (canvas.height - 100) + 50,
    r: 22
  };
}

function spawnTrackingTarget() {
  targets = [{
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 30
  }];
}

// ================= SHOOTING =================
window.addEventListener("mousedown", () => {
  if (!running) return;

  shots++;
  let hit = false;

  targets.forEach((t, i) => {
    const dx = mouseX - t.x;
const dy = mouseY - t.y;

    if (Math.hypot(dx, dy) <= t.r) {
      hit = true;
      hits++;
      score += 100;

      if (mode === "grid") {
        targets[i] = createTarget();
      }
    }
  });

  if (!hit) score = Math.max(0, score - 10);
});

// ================= TIMER =================
setInterval(() => {
  if (!running) return;
  timeLeft--;

  if (timeLeft <= 0) endGame();
}, 1000);

// ================= END =================
function endGame() {
  running = false;
  document.exitPointerLock();
  hud.style.display = "none";
  results.style.display = "flex";

  const acc = shots === 0 ? 0 : Math.round((hits / shots) * 100);

  document.getElementById("rScore").textContent = `Score: ${score}`;
  document.getElementById("rHits").textContent = `Hits: ${hits}`;
  document.getElementById("rShots").textContent = `Shots: ${shots}`;
  document.getElementById("rAcc").textContent = `Accuracy: ${acc}%`;
}

function backToMenu() {
  results.style.display = "none";
  menu.style.display = "flex";
}

// ================= UPDATE =================
function update() {
  if (!running) return;

  if (mode === "tracking") {
    angle += 0.02;
    const radius = 200;

    targets[0].x = canvas.width / 2 + Math.cos(angle) * radius;
    targets[0].y = canvas.height / 2 + Math.sin(angle) * radius;
  }

  const acc = shots === 0 ? 100 : Math.round((hits / shots) * 100);

  scoreEl.textContent = `Score: ${score}`;
  timeEl.textContent = `⏱ ${timeLeft}`;
  accEl.textContent = `Accuracy: ${acc}%`;
}

// ================= DRAW =================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  targets.forEach(t => {
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ff3b3b";
    ctx.fill();
  });

  // Crosshair
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mouseX - 8, mouseY);
ctx.lineTo(mouseX + 8, mouseY);
ctx.moveTo(mouseX, mouseY - 8);
ctx.lineTo(mouseX, mouseY + 8);

  ctx.stroke();
}

// ================= LOOP =================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
