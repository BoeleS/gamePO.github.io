// ===== BASIC SETUP =====
const canvas = document.getElementById("game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa);

// camera
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 2000);
camera.position.set(0, 2, 14);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);

addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
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
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ map: checker })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const platform = new THREE.Mesh(
  new THREE.BoxGeometry(26, 1.2, 10),
  new THREE.MeshStandardMaterial({ color: 0x888888 })
);
platform.position.set(0, 0.6, -10);
scene.add(platform);

const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 16),
  new THREE.MeshStandardMaterial({ map: checker })
);
backWall.position.set(0, 8, -30);
scene.add(backWall);

// ===== FIRST PERSON WEAPON =====
const weapon = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.4, 1.6),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
body.position.set(0.4, -0.4, -1.2);
weapon.add(body);

const barrel = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.08, 1, 16),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
barrel.rotation.x = Math.PI / 2;
barrel.position.set(0.4, -0.35, -2);
weapon.add(barrel);

const grip = new THREE.Mesh(
  new THREE.BoxGeometry(0.25, 0.5, 0.3),
  new THREE.MeshStandardMaterial({ color: 0x111111 })
);
grip.position.set(0.55, -0.7, -1.1);
weapon.add(grip);

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
let velocities = []; // voor bounce / ball tracking

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

  camera.position.set(0, 2, 14);
  camera.rotation.set(0, 0, 0);

  if (mode === "grid") {
    modeNameEl.textContent = "GRIDSHOT";
    spawnGridTargets();
  } else if (mode === "bounce") {
    modeNameEl.textContent = "BOUNCE TRACKING";
    spawnBounceTargets();
  } else if (mode === "ball") {
    modeNameEl.textContent = "BALL TRACKING";
    spawnBallTarget();
  }
}

// ===== RANDOM POSITIES =====
function randomGridPosition() {
  // voor gridshot: meer gecentreerd
  return {
    x: (Math.random() * 18 - 9),
    y: (Math.random() * 4 + 2),
    z: -(Math.random() * 8 + 18)
  };
}

function randomWidePosition() {
  // voor bounce / ball tracking: grotere ruimte
  return {
    x: (Math.random() * 30 - 15),
    y: (Math.random() * 8 + 2),
    z: -(Math.random() * 20 + 10)
  };
}

function randomVelocity(speed = 0.12) {
  const angleXY = Math.random() * Math.PI * 2;
  const angleZ = Math.random() * Math.PI * 2;
  return new THREE.Vector3(
    Math.cos(angleXY) * speed,
    Math.sin(angleXY) * speed * 0.5,
    Math.sin(angleZ) * speed
  );
}

// ===== SPAWN MODES =====
function spawnGridTargets() {
  clearTargets();
  for (let i = 0; i < 3; i++) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x00ffff })
    );
    const p = randomGridPosition();
    ball.position.set(p.x, p.y, p.z);
    scene.add(ball);
    targets.push(ball);
  }
}

function spawnBounceTargets() {
  clearTargets();
  velocities = [];
  const count = 6;
  for (let i = 0; i < count; i++) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xff00ff })
    );
    const p = randomWidePosition();
    ball.position.set(p.x, p.y, p.z);
    scene.add(ball);
    targets.push(ball);
    velocities.push(randomVelocity(0.15));
  }
}

function spawnBallTarget() {
  clearTargets();
  velocities = [];
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );
  const p = randomWidePosition();
  ball.position.set(p.x, p.y, p.z);
  scene.add(ball);
  targets.push(ball);
  velocities.push(randomVelocity(0.18));
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
    score += 386;

    const hitObj = hit[0].object;

    if (mode === "grid") {
      // alleen dit target verplaatsen
      const p = randomGridPosition();
      hitObj.position.set(p.x, p.y, p.z);
    } else if (mode === "bounce") {
      // bij bounce tracking: target blijft bestaan, maar krijgt nieuwe positie + velocity
      const index = targets.indexOf(hitObj);
      const p = randomWidePosition();
      hitObj.position.set(p.x, p.y, p.z);
      if (index !== -1) {
        velocities[index] = randomVelocity(0.18);
      }
    } else if (mode === "ball") {
      // ball tracking: zelfde target, nieuwe positie + velocity
      const p = randomWidePosition();
      hitObj.position.set(p.x, p.y, p.z);
      velocities[0] = randomVelocity(0.2);
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
  rMode.textContent = "Mode: " + (mode === "grid" ? "Gridshot" : mode === "bounce" ? "Bounce Tracking" : "Ball Tracking");
  rScore.textContent = "Score: " + score;
  rHits.textContent = "Hits: " + hits;
  rShots.textContent = "Shots: " + shots;
  rAcc.textContent = "Accuracy: " + acc + "%";
}

// ===== UPDATE HUD =====
function updateHUD() {
  if (!running) return;

  scoreEl.textContent = "PTS " + score;
  timeEl.textContent = formatTime(timeLeft);
  const acc = shots ? Math.round(hits / shots * 100) : 100;
  accEl.textContent = acc + "%";
}

// ===== TARGET MOVEMENT (BOUNCE / BALL) =====
function updateTargetsMovement() {
  if (!running) return;
  if (mode !== "bounce" && mode !== "ball") return;

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const v = velocities[i];
    if (!t || !v) continue;

    t.position.add(v);

    // simpele bounds voor bounce
    const maxX = 18, minX = -18;
    const maxY = 12, minY = 1;
    const maxZ = -8, minZ = -40;

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

// ===== LOOP =====
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
