// ===== BASIC 3D SETUP =====
const canvas = document.getElementById("game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101218);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 2000);
camera.position.set(0, 2, 18);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);

window.addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// ===== LIGHT =====
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// ===== ROOM =====
function createCheckerTexture(size = 512, squares = 8) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const sq = size / squares;

  for (let y = 0; y < squares; y++) {
    for (let x = 0; x < squares; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#1b1f2a" : "#151822";
      ctx.fillRect(x * sq, y * sq, sq, sq);
    }
  }
  return new THREE.CanvasTexture(c);
}
const checker = createCheckerTexture();

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ map: checker })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const platform = new THREE.Mesh(
  new THREE.BoxGeometry(34, 1.2, 14),
  new THREE.MeshStandardMaterial({ color: 0x20232f })
);
platform.position.set(0, 0.6, -14);
scene.add(platform);

const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 22),
  new THREE.MeshStandardMaterial({ color: 0x181b26 })
);
backWall.position.set(0, 11, -46);
scene.add(backWall);

// ===== FIRST PERSON WEAPON =====
const weapon = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.45, 1.9),
  new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.4, roughness: 0.3 })
);
body.position.set(0.6, -0.45, -1.5);
weapon.add(body);

const barrel = new THREE.Mesh(
  new THREE.CylinderGeometry(0.09, 0.09, 1.3, 16),
  new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.2 })
);
barrel.rotation.x = Math.PI / 2;
barrel.position.set(0.6, -0.4, -2.3);
weapon.add(barrel);

const grip = new THREE.Mesh(
  new THREE.BoxGeometry(0.28, 0.55, 0.35),
  new THREE.MeshStandardMaterial({ color: 0x151515 })
);
grip.position.set(0.8, -0.8, -1.3);
weapon.add(grip);

const accent = new THREE.Mesh(
  new THREE.BoxGeometry(0.45, 0.12, 0.45),
  new THREE.MeshStandardMaterial({ color: 0x00bcd4, emissive: 0x007888, emissiveIntensity: 0.6 })
);
accent.position.set(0.45, -0.25, -1.0);
weapon.add(accent);

camera.add(weapon);
scene.add(camera);

// ===== UI ELEMENTS =====
const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const results = document.getElementById("results");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const accEl = document.getElementById("accuracy");
const modeNameEl = document.getElementById("modeName");
const rMode = document.getElementById("rMode");
const rScore = document.getElementById("rScore");
const rHits = document.getElementById("rHits");
const rShots = document.getElementById("rShots");
const rAcc = document.getElementById("rAcc");

const gridBtn = document.getElementById("gridBtn");
const bounceBtn = document.getElementById("bounceBtn");
const ballBtn = document.getElementById("ballBtn");
const backBtn = document.getElementById("backBtn");

// ===== STATE =====
let running = false;
let mode = null; // "grid", "bounce", "ball"
let score = 0, hits = 0, shots = 0, timeLeft = 60;
let targets = [];
let velocities = [];
let gridPositions = [];

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

// ESC → terug naar menu
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.exitPointerLock();
    backToMenu();
  }
});

// ===== BUTTONS =====
gridBtn.onclick = () => startMode("grid");
bounceBtn.onclick = () => startMode("bounce");
ballBtn.onclick = () => startMode("ball");
backBtn.onclick = backToMenu;

// ===== MODE START =====
function startMode(m) {
  mode = m;
  running = true;
  score = 0;
  hits = 0;
  shots = 0;
  timeLeft = 60;

  clearTargets();
  velocities = [];

  menu.style.display = "none";
  results.style.display = "none";
  hud.style.display = "flex";

  camera.position.set(0, 2, 18);
  camera.rotation.set(0, 0, 0);

  if (mode === "grid") {
    modeNameEl.textContent = "GRIDSHOT (NEW)";
    setupGridPositions();
    spawnGridTargets();
  } else if (mode === "bounce") {
    modeNameEl.textContent = "BOUNCE TRACKING (NEW)";
    spawnBounceTargets();
  } else if (mode === "ball") {
    modeNameEl.textContent = "BALL TRACKING (NEW)";
    spawnBallTarget();
  }
}

// ===== GRIDSHOT: NIEUWE GRID =====
function setupGridPositions() {
  gridPositions = [];
  const cols = 6;
  const rows = 3;
  const spacingX = 3.0;
  const spacingY = 2.6;
  const baseZ = -32;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * spacingX;
      const y = 3 + r * spacingY;
      const z = baseZ;
      gridPositions.push(new THREE.Vector3(x, y, z));
    }
  }
}

function getRandomGridPosition() {
  const idx = Math.floor(Math.random() * gridPositions.length);
  return gridPositions[idx].clone();
}

function spawnGridTargets() {
  clearTargets();
  for (let i = 0; i < 3; i++) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xff4081,
        emissive: 0x7b1fa2,
        emissiveIntensity: 0.5
      })
    );
    const p = getRandomGridPosition();
    ball.position.copy(p);
    scene.add(ball);
    targets.push(ball);
  }
}

// ===== BOUNCE TRACKING: NIEUWE ARENA =====
function randomWidePosition() {
  return {
    x: (Math.random() * 32 - 16),
    y: (Math.random() * 10 + 2),
    z: -(Math.random() * 22 + 14)
  };
}

function randomVelocity(speed = 0.18) {
  const angleXY = Math.random() * Math.PI * 2;
  const angleZ = Math.random() * Math.PI * 2;
  return new THREE.Vector3(
    Math.cos(angleXY) * speed,
    Math.sin(angleXY) * speed * 0.6,
    Math.sin(angleZ) * speed
  );
}

function spawnBounceTargets() {
  clearTargets();
  velocities = [];
  const count = 7;
  for (let i = 0; i < count; i++) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x00838f,
        emissiveIntensity: 0.6
      })
    );
    const p = randomWidePosition();
    ball.position.set(p.x, p.y, p.z);
    scene.add(ball);
    targets.push(ball);
    velocities.push(randomVelocity(0.2));
  }
}

// ===== BALL TRACKING: NIEUWE BEWEGENDE BAL =====
function spawnBallTarget() {
  clearTargets();
  velocities = [];
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0x76ff03,
      emissive: 0x33691e,
      emissiveIntensity: 0.6
    })
  );
  const p = randomWidePosition();
  ball.position.set(p.x, p.y, p.z);
  scene.add(ball);
  targets.push(ball);
  velocities.push(randomVelocity(0.24));
}

// ===== CLEAR TARGETS =====
function clearTargets() {
  targets.forEach(t => scene.remove(t));
  targets = [];
}

// ===== SHOOT =====
window.addEventListener("mousedown", () => {
  if (!running) return;
  shots++;

  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hit = ray.intersectObjects(targets);

  if (hit.length > 0) {
    hits++;
    score += 386;

    const hitObj = hit[0].object;

    if (mode === "grid") {
      const p = getRandomGridPosition();
      hitObj.position.copy(p);
    } else if (mode === "bounce") {
      const index = targets.indexOf(hitObj);
      const p = randomWidePosition();
      hitObj.position.set(p.x, p.y, p.z);
      if (index !== -1) velocities[index] = randomVelocity(0.22);
    } else if (mode === "ball") {
      const p = randomWidePosition();
      hitObj.position.set(p.x, p.y, p.z);
      velocities[0] = randomVelocity(0.26);
    }
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
  rMode.textContent = "Mode: " + (
    mode === "grid" ? "Gridshot (New)" :
    mode === "bounce" ? "Bounce Tracking (New)" :
    "Ball Tracking (New)"
  );
  rScore.textContent = "Score: " + score;
  rHits.textContent = "Hits: " + hits;
  rShots.textContent = "Shots: " + shots;
  rAcc.textContent = "Accuracy: " + acc + "%";
}

// ===== HUD UPDATE =====
function updateHUD() {
  if (!running) return;
  scoreEl.textContent = "PTS " + score;
  timeEl.textContent = formatTime(timeLeft);
  const acc = shots ? Math.round(hits / shots * 100) : 100;
  accEl.textContent = acc + "%";
}

// ===== TARGET MOVEMENT =====
function updateTargetsMovement() {
  if (!running) return;
  if (mode !== "bounce" && mode !== "ball") return;

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const v = velocities[i];
    if (!t || !v) continue;

    t.position.add(v);

    const maxX = 22, minX = -22;
    const maxY = 16, minY = 1.5;
    const maxZ = -8, minZ = -48;

    if (t.position.x > maxX || t.position.x < minX) v.x *= -1;
    if (t.position.y > maxY || t.position.y < minY) v.y *= -1;
    if (t.position.z > maxZ || t.position.z < minZ) v.z *= -1;
  }
}

// ===== CROSSHAIR =====
const crosshair = document.createElement("div");
crosshair.style.position = "fixed";
crosshair.style.left = "50%";
crosshair.style.top = "50%";
crosshair.style.width = "6px";
crosshair.style.height = "6px";
crosshair.style.background = "#00ffff";
crosshair.style.transform = "translate(-50%,-50%)";
crosshair.style.borderRadius = "50%";
crosshair.style.zIndex = "5";
document.body.appendChild(crosshair);

// ===== MAIN LOOP =====
function animate() {
  requestAnimationFrame(animate);
  updateHUD();
  updateTargetsMovement();
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
