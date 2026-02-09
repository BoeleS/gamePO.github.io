const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const accEl = document.getElementById("accuracy");

let targets = [];
let score = 0;
let shots = 0;
let hits = 0;
let timeLeft = 180;
let running = false;
let mode = "";

/* START */
function startGame(selectedMode) {
  mode = selectedMode;
  menu.style.display = "none";
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

/* SHOOT */
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
      targets.push(createTarget(mode));
    }
  });
});

/* TIMER */
setInterval(() => {
  if (!running) return;
  timeLeft--;
  if (timeLeft <= 0) {
    running = false;
    showResults(score, Math.round((hits / shots) * 100), hits, shots);
  }
}, 1000);

/* UPDATE */
function update() {
  if (!running) return;

  if (mode === "tracking") {
    targets.forEach(t => {
      t.x += t.vx;
      t.y += t.vy;
      if (t.x < 0 || t.x > canvas.width) t.vx *= -1;
      if (t.y < 0 || t.y > canvas.height) t.vy *= -1;
    });
  }

  const acc = shots === 0 ? 100 : Math.round((hits / shots) * 100);
  scoreEl.textContent = `Score: ${score}`;
  timeEl.textContent = `⏱ ${timeLeft}`;
  accEl.textContent = `Accuracy: ${acc}%`;
}

/* DRAW */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  targets.forEach(t => {
    ctx.fillStyle = "#ff3b3b";
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // crosshair
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(canvas.width/2 - 8, canvas.height/2);
  ctx.lineTo(canvas.width/2 + 8, canvas.height/2);
  ctx.moveTo(canvas.width/2, canvas.height/2 - 8);
  ctx.lineTo(canvas.width/2, canvas.height/2 + 8);
  ctx.stroke();
}

/* LOOP */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
