const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const results = document.getElementById("results");

const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const finalScoreEl = document.getElementById("finalScore");

const bounceBtn = document.getElementById("bounceBtn");
const backBtn = document.getElementById("backBtn");

let running = false;
let score = 0;
let timeLeft = 30;

let mouseX = 0;
let mouseY = 0;

let ball = null;

document.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

bounceBtn.onclick = startGame;
backBtn.onclick = backToMenu;

function startGame() {
  running = true;
  score = 0;
  timeLeft = 30;

  menu.style.display = "none";
  results.style.display = "none";
  hud.style.display = "flex";

  ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 6,
    vy: 5,
    r: 25
  };
}

function backToMenu() {
  running = false;
  menu.style.display = "flex";
  hud.style.display = "none";
  results.style.display = "none";
}

function endGame() {
  running = false;
  hud.style.display = "none";
  results.style.display = "flex";
  finalScoreEl.textContent = "Score: " + score;
}

setInterval(() => {
  if (!running) return;
  timeLeft--;
  if (timeLeft <= 0) endGame();
}, 1000);

function update() {
  if (!running) return;

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Bounce tegen randen
  if (ball.x + ball.r > canvas.width || ball.x - ball.r < 0) {
    ball.vx *= -1;
  }

  if (ball.y + ball.r > canvas.height || ball.y - ball.r < 0) {
    ball.vy *= -1;
  }

  // Score als cursor op bal zit
  if (Math.hypot(mouseX - ball.x, mouseY - ball.y) <= ball.r) {
    score++;
  }

  timeEl.textContent = "⏱ " + timeLeft;
  scoreEl.textContent = "Score: " + score;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!running) return;

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = "orange";
  ctx.fill();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();