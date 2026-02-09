const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let keys = {};
let bullets = [];
let enemies = [];
let score = 0;
let gameRunning = false;

const player = {
  x: 0,
  y: 0,
  angle: 0,
  health: 100
};

const menu = document.getElementById("menu");
const healthEl = document.getElementById("health");
const scoreEl = document.getElementById("score");

// Start game
menu.onclick = () => {
  menu.style.display = "none";
  canvas.requestPointerLock();
  gameRunning = true;
};

// Keyboard input
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// Mouse look
window.addEventListener("mousemove", e => {
  if (document.pointerLockElement === canvas) {
    player.angle += e.movementX * 0.002;
  }
});

// Shooting
window.addEventListener("mousedown", () => {
  if (!gameRunning) return;

  bullets.push({
    x: player.x,
    y: player.y,
    angle: player.angle
  });
});

// Enemy spawning
function spawnEnemy() {
  enemies.push({
    x: Math.random() * 2000 - 1000,
    y: Math.random() * 2000 - 1000
  });
}
setInterval(spawnEnemy, 2000);

// Update game logic
function update() {
  if (!gameRunning) return;

  const speed = 5;

  if (keys["w"]) {
    player.x += Math.cos(player.angle) * speed;
    player.y += Math.sin(player.angle) * speed;
  }
  if (keys["s"]) {
    player.x -= Math.cos(player.angle) * speed;
    player.y -= Math.sin(player.angle) * speed;
  }
  if (keys["a"]) {
    player.x += Math.cos(player.angle - Math.PI / 2) * speed;
    player.y += Math.sin(player.angle - Math.PI / 2) * speed;
  }
  if (keys["d"]) {
    player.x += Math.cos(player.angle + Math.PI / 2) * speed;
    player.y += Math.sin(player.angle + Math.PI / 2) * speed;
  }

  bullets.forEach(b => {
    b.x += Math.cos(b.angle) * 20;
    b.y += Math.sin(b.angle) * 20;
  });

  enemies.forEach((e, ei) => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);

    e.x += dx / dist;
    e.y += dy / dist;

    if (dist < 30) {
      player.health -= 0.5;
    }

    bullets.forEach((b, bi) => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < 20) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score += 10;
      }
    });
  });

  healthEl.textContent = `❤️ ${Math.max(0, Math.floor(player.health))}`;
  scoreEl.textContent = `Score: ${score}`;

  if (player.health <= 0) {
    gameRunning = false;
    menu.style.display = "flex";
    menu.innerHTML = "<h1>Game Over</h1><p>Klik om opnieuw te starten</p>";
    resetGame();
  }
}

// Reset
function resetGame() {
  player.health = 100;
  player.x = 0;
  player.y = 0;
  bullets = [];
  enemies = [];
  score = 0;
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-player.angle);
  ctx.translate(-player.x, -player.y);

  ctx.fillStyle = "#333";
  ctx.fillRect(-5000, -5000, 10000, 10000);

  ctx.fillStyle = "red";
  enemies.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, 20, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "yellow";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();

  // Crosshair
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2);
  ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2);
  ctx.moveTo(canvas.width / 2, canvas.height / 2 - 10);
  ctx.lineTo(canvas.width / 2, canvas.height / 2 + 10);
  ctx.stroke();
}

// Game loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
