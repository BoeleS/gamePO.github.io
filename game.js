// ===== CANVAS =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

// ===== UI =====
const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const results = document.getElementById("results");

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const accEl = document.getElementById("accuracy");

// ===== PAUSE MENU =====
const pauseMenu = document.createElement("div");
pauseMenu.className = "overlay";
pauseMenu.style.display = "none";
pauseMenu.innerHTML = `
  <h1>PAUSED</h1>
  <button id="resume">RESUME</button>
  <button id="quit">BACK TO MENU</button>
`;
document.body.appendChild(pauseMenu);

// ===== STATE =====
let mode = "";
let running = false;
let paused = false;

let score = 0;
let hits = 0;
let shots = 0;
let timeLeft = 30;

let targets = [];
let angle = 0;

// ===== MOUSE =====
let mouseX = 0, mouseY = 0;
document.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// ===== BUTTONS =====
document.getElementById("gridBtn").onclick = () => start("grid");
document.getElementById("trackBtn").onclick = () => start("tracking");
document.getElementById("backBtn").onclick = backToMenu;
document.getElementById("resume").onclick = resume;
document.getElementById("quit").onclick = backToMenu;

// ===== ESC =====
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && running) {
    paused ? resume() : pause();
  }
});

// ===== START =====
function start(m) {
  mode = m;
  running = true;
  paused = false;

  score = hits = shots = 0;
  timeLeft = 30;
  angle = 0;

  menu.style.display = "none";
  results.style.display = "none";
  pauseMenu.style.display = "none";
  hud.style.display = "flex";

  targets = mode === "grid" ? spawnGrid() : spawnTracking();
}

// ===== PAUSE =====
function pause() {
  paused = true;
  pauseMenu.style.display = "flex";
}

function resume() {
  paused = false;
  pauseMenu.style.display = "none";
}

function backToMenu() {
  running = false;
  paused = false;
  menu.style.display = "flex";
  hud.style.display = "none";
  results.style.display = "none";
  pauseMenu.style.display = "none";
}

// ===== TARGETS =====
function spawnGrid() {
  return Array.from({ length: 6 }, () => newTarget());
}

function spawnTracking() {
  return [{ x: innerWidth / 2, y: innerHeight / 2, r: 30 }];
}

function newTarget() {
  return {
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * (canvas.height - 100) + 50,
    r: 22
  };
}

// ===== CLICK GRIDSHOT =====
canvas.addEventListener("click", () => {
  if (!running || paused || mode !== "grid") return;

  targets.forEach((t, i) => {
    if (Math.hypot(mouseX - t.x, mouseY - t.y) <= t.r) {
      score++;
      hits++;
      shots++;
      targets[i] = newTarget();
    }
  });
});

// ===== TIMER =====
setInterval(() => {
  if (!running || paused) return;
  timeLeft--;
  if (timeLeft <= 0) endGame();
}, 1000);

// ===== END =====
function endGame() {
  running = false;
  hud.style.display = "none";
  results.style.display = "flex";

  const acc = shots ? Math.round((hits / shots) * 100) : 0;
  rScore.textContent = `Score: ${score}`;
  rHits.textContent = `Hits: ${hits}`;
  rShots.textContent = `Shots: ${shots}`;
  rAcc.textContent = `Accuracy: ${acc}%`;
}

// ===== LOOP =====
function update() {
  if (!running || paused) return;

  if (mode === "tracking") {
    angle += 0.03;
    const t = targets[0];
    t.x = innerWidth / 2 + Math.cos(angle) * 220;
    t.y = innerHeight / 2 + Math.sin(angle) * 220;

    shots++;
    if (Math.hypot(mouseX - t.x, mouseY - t.y) <= t.r) {
      score++;
      hits++;
    }
  }

  timeEl.textContent = `⏱ ${timeLeft}`;
  scoreEl.textContent = `Score: ${score}`;
  accEl.textContent = `Accuracy: ${shots ? Math.round(hits / shots * 100) : 0}%`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  targets.forEach(t => {
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  });

  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(mouseX - 8, mouseY);
  ctx.lineTo(mouseX + 8, mouseY);
  ctx.moveTo(mouseX, mouseY - 8);
  ctx.lineTo(mouseX, mouseY + 8);
  ctx.stroke();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
