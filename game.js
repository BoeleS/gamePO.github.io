// ===== BASIC 3D SETUP =====
const canvas = document.getElementById("game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 2, 8);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);

addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// ===== LIGHT =====
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);

// ===== CHECKER TEXTURE =====
function createCheckerTexture(size = 512, squares = 8) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const sq = size / squares;

  for (let y = 0; y < squares; y++) {
    for (let x = 0; x < squares; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#d9d9d9" : "#bfbfbf";
      ctx.fillRect(x * sq, y * sq, sq, sq);
    }
  }
  return new THREE.CanvasTexture(c);
}

const checker = createCheckerTexture();

// ===== ROOM =====
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ map: checker })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 10),
  new THREE.MeshStandardMaterial({ map: checker })
);
backWall.position.z = -10;
backWall.position.y = 5;
scene.add(backWall);

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

const gridBtn = document.getElementById("gridBtn");
const backBtn = document.getElementById("backBtn");

// ===== STATE =====
let running = false;
let score = 0, hits = 0, shots = 0, timeLeft = 60;
let targets = [];

// ===== POINTER LOOK =====
canvas.addEventListener("click", () => {
  if (running) canvas.requestPointerLock();
});

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === canvas) {
    camera.rotation.y -= e.movementX * 0.002;
    camera.rotation.x -= e.movementY * 0.002;
    camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, camera.rotation.x));
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.exitPointerLock();
    backToMenu();
  }
});

// ===== BUTTONS =====
gridBtn.onclick = startGrid;
backBtn.onclick = backToMenu;

// ===== START GRIDSHOT =====
function startGrid() {
  running = true;
  score = 0;
  hits = 0;
  shots = 0;
  timeLeft = 60;

  clearTargets();

  menu.style.display = "none";
  results.style.display = "none";
  hud.style.display = "flex";

  camera.position.set(0, 2, 8);
  camera.rotation.set(0, 0, 0);

  spawnThree();
}

// ===== SPAWN 3 TARGETS (GRIDSHOT STYLE) =====
function spawnThree() {
  clearTargets();

  const positions = [
    [-2.2, 2.0, -9.5],
    [ 0.0, 2.0, -9.5],
    [ 2.2, 2.0, -9.5]
  ];

  for (let i = 0; i < 3; i++) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x00ffff })
    );

    ball.position.set(
      positions[i][0] + (Math.random() * 0.4 - 0.2),
      positions[i][1] + (Math.random() * 0.4 - 0.2),
      positions[i][2]
    );

    scene.add(ball);
    targets.push(ball);
  }
}

// ===== CLEAR TARGETS =====
function clearTargets() {
  targets.forEach(t => scene.remove(t));
  targets = [];
}

// ===== SHOOT =====
addEventListener("mousedown", () => {
  if (!running) return;
  shots++;

  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hit = ray.intersectObjects(targets);

  if (hit.length > 0) {
    hits++;
    score += 386; // exact score per bal
    spawnThree(); // respawn alle 3 tegelijk
  }
});

// ===== TIMER =====
setInterval(() => {
  if (!running) return;
  timeLeft--;
  if (timeLeft <= 0) {
    timeLeft = 0;
    endGame();
  }
}, 1000);

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ===== END GAME =====
function endGame() {
  running = false;
  document.exitPointerLock();
  hud.style.display = "none";
  results.style.display = "flex";

  const acc = shots ? Math.round(hits / shots * 100) : 0;
  rScore.textContent = "Score: " + score;
  rHits.textContent = "Hits: " + hits;
  rShots.textContent = "Shots: " + shots;
  rAcc.textContent = "Accuracy: " + acc + "%";
}

// ===== UPDATE HUD =====
function update() {
  if (!running) return;

  scoreEl.textContent = "PTS " + score;
  timeEl.textContent = formatTime(timeLeft);
  const acc = shots ? Math.round(hits / shots * 100) : 100;
  accEl.textContent = acc + "%";
}

// ===== CROSSHAIR =====
const crosshair = document.createElement("div");
crosshair.style.position = "fixed";
crosshair.style.left = "50%";
crosshair.style.top = "50%";
crosshair.style.width = "6px";
crosshair.style.height = "6px";
crosshair.style.background = "#00ffff";
crosshair.style.transform = "translate(-50%, -50%)";
crosshair.style.borderRadius = "50%";
crosshair.style.zIndex = "5";
document.body.appendChild(crosshair);

// ===== LOOP =====
function animate() {
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}
animate();

// ===== BACK TO MENU =====
function backToMenu() {
  running = false;
  clearTargets();
  menu.style.display = "flex";
  hud.style.display = "none";
  results.style.display = "none";
}
