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

const rScore = document.getElementById("rScore");
const rHits = document.getElementById("rHits");
const rShots = document.getElementById("rShots");
const rAcc = document.getElementById("rAcc");

// ===== STATE =====
let mode = "";
let running = false;

let score = 0;
let hits = 0;
let shots = 0;
let timeLeft = 30;

let targets = [];
let angle = 0;

let bounceBall = null;

// ===== MOUSE =====
let mouseX = 0, mouseY = 0;
document.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// ===== BUTTONS =====
document.getElementById("gridBtn").onclick = () => start("grid");
document.getElementById("trackBtn").onclick = () => start("tracking");
document.getElementById("bounceBtn").onclick = () => start("bounce");
document.getElementById("backBtn").onclick = backToMenu;

// ===== START =====
function start(m) {
  mode = m;
  running = true;

  score = 0;
  hits = 0;
  shots = 0;
  timeLeft = 30;
  angle = 0;

  menu.style.display = "none";
  results.style.display = "none";
  hud.style.display = "flex";

  if (mode === "grid") targets = spawnGrid();
  if (mode === "tracking") targets = spawnTracking();

  if (mode === "bounce") {
    bounceBall = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 6,
      vy: 5,
      r: 25
    };
  }
}

// ===== BACK =====
function backToMenu() {
  running = false;
  menu.style.display = "flex";
  hud.style.display = "none";
  results.style.display = "none";
}

// ===== TARGETS =====
function spawnGrid() {
  return Array.from({ length: 6 }, () => ({
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * (canvas.height - 100) + 50,
    r: 22
  }));
}

function spawnTracking() {
  return [{ x: innerWidth / 2, y: innerHeight / 2, r: 30 }];
}

// ===== CLICK GRID =====
canvas.addEventListener("click", () => {
  if (!running || mode !== "grid") return;

  shots++;
  targets.forEach((t, i) => {
    if (Math.hypot(mouseX - t.x, mouseY - t.y) <= t.r) {
      score++;
      hits++;
      targets[i] = spawnGrid()[0];
    }
  });
});

// ===== TIMER =====
setInterval(() => {
  if (!running) return;
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

// ===== UPDATE =====
function update() {
  if (!running) return;

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

  if (mode === "bounce") {
    bounceBall.x += bounceBall.vx;
    bounceBall.y += bounceBall.vy;

    // Bounce tegen randen
    if (bounceBall.x + bounceBall.r > canvas.width || bounceBall.x - bounceBall.r < 0) {
      bounceBall.vx *= -1;
    }

    if (bounceBall.y + bounceBall.r > canvas.height || bounceBall.y - bounceBall.r < 0) {
      bounceBall.vy *= -1;
    }

    shots++;
    if (Math.hypot(mouseX - bounceBall.x, mouseY - bounceBall.y) <= bounceBall.r) {
      score++;
      hits++;
    }
  }

  timeEl.textContent = `⏱ ${timeLeft}`;
  scoreEl.textContent = `Score: ${score}`;
  accEl.textContent = `Accuracy: ${shots ? Math.round(hits / shots * 100) : 0}%`;
}

// ===== DRAW =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (mode === "grid" || mode === "tracking") {
    targets.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();
    });
  }

  if (mode === "bounce") {
    ctx.beginPath();
    ctx.arc(bounceBall.x, bounceBall.y, bounceBall.r, 0, Math.PI * 2);
    ctx.fillStyle = "orange";
    ctx.fill();
  }

  // Crosshair
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