// ================= CANVAS =================
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

// ================= PAUSE MENU =================
const pauseMenu = document.createElement("div");
pauseMenu.className = "overlay";
pauseMenu.style.display = "none";
pauseMenu.innerHTML = `
  <h1>PAUSED</h1>
  <button id="resumeBtn">RESUME</button>
  <button id="menuBtn">BACK TO MENU</button>
`;
document.body.appendChild(pauseMenu);

document.getElementById("resumeBtn").onclick = resumeGame;
document.getElementById("menuBtn").onclick = backToMenuFromPause;

// ================= GAME STATE =================
let mode = "";
let running = false;
let paused = false;

let score = 0;
let shots = 0;
let hits = 0;
let timeLeft = 30;

let targets = [];
let angle = 0;

// ================= MOUSE =================
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

document.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// ================= ESC KEY (FIXED) =================
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && running) {
    if (paused) {
      resumeGame();
    } else {
      pauseGame();
    }
  }
});

// ================= START =================
function startGame(selectedMode) {
  mode = selectedMode;

  menu.style.display = "none";
  results.style.display = "none";
  pauseMenu.style.display = "none";
  hud.style.display = "flex";

  score = 0;
  shots = 0;
  hits = 0;
  timeLeft = 30;
  targets = [];
  angle = 0;

  running = true;
  paused = false;

  if (mode === "grid") spawnGridTargets();
  if (mode === "tracking") spawnTrackingTarget();
}

// ================= PAUSE =================
function pauseGame() {
  paused = true;
  pauseMenu.style.display = "flex";
}

function resumeGame() {
  paused = false;
  pauseMenu.style.display = "none";
}

function backToMenuFromPause() {
  paused = false;
  running = false;
  pauseMenu.style.display = "none";
  hud.style.display = "none";
  menu.style.display = "flex";
}

// ================= TARGETS =================
function createTarget() {
  return {
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * (canvas.height - 100) + 50,
    r: 22
  };
}

function spawnGridTargets() {
  targets = [];
  for (let i = 0; i < 6; i++) {
    targets.push(createTarget());
  }
}

function spawnTrackingTarget() {
  targets = [{
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 30
  }];
}

// ================= GRIDSHOT CLICK =================
canvas.addEventListener("click", () => {
  if (!running || paused || mode !== "grid") return;

  targets.forEach((t, i) => {
    const dx = mouseX - t.x;
    const dy = mouseY - t.y;

    if (Math.hypot(dx, dy) <= t.r) {
      score += 1;
      hits += 1;
      shots += 1;
      targets[i] = createTarget();
    }
  });
});

// ================= TIMER (30 SEC) =================
setInterval(() => {
  if (!running || paused) return;

  timeLeft--;
  if (timeLeft <= 0) endGame();
}, 1000);

// ================= END =================
function endGame() {
  running = false;
  paused = false;

  hud.style.display = "none";
  pauseMenu.style.display = "none";
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
  if (!running || paused) return;

  if (mode === "tracking") {
    angle += 0.03;
    const radius = 220;
    const t = targets[0];

    t.x = canvas.width / 2 + Math.cos(angle) * radius;
    t.y = canvas.height / 2 + Math.sin(angle) * radius;

    shots++;

    const dx = mouseX - t.x;
    const dy = mouseY - t.y;

    if (Math.hypot(dx, dy) <= t.r) {
      score++;
      hits++;
    }
  }

  const acc = shots === 0 ? 0 : Math.round((hits / shots) * 100);

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
