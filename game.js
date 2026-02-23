// ================= GLOBAL =================
let mode = "";
let score = 0;
let hits = 0;
let shots = 0;
let timeLeft = 30;
let running = false;
let timerInterval;

// UI
const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const results = document.getElementById("results");

const scoreEl = document.getElementById("score");
const accuracyEl = document.getElementById("accuracy");
const timerEl = document.getElementById("timer");

const finalScore = document.getElementById("finalScore");
const finalHits = document.getElementById("finalHits");
const finalShots = document.getElementById("finalShots");
const finalAccuracy = document.getElementById("finalAccuracy");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ================= START =================
function startGame(selectedMode) {
  mode = selectedMode;
  score = 0;
  hits = 0;
  shots = 0;
  timeLeft = 30;
  running = true;

  menu.style.display = "none";
  results.style.display = "none";
  hud.style.display = "flex";

  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) endGame();
    updateHUD();
  }, 1000);

  if (mode === "grid") startGrid();
  if (mode === "tracking") startTracking();
  if (mode === "arena") startArena();
}

// ================= END =================
function endGame() {
  running = false;
  clearInterval(timerInterval);

  hud.style.display = "none";
  results.style.display = "flex";

  finalScore.textContent = "Score: " + Math.floor(score);
  finalHits.textContent = "Hits: " + hits;
  finalShots.textContent = "Shots: " + shots;
  finalAccuracy.textContent =
    "Accuracy: " + (shots ? Math.round((hits / shots) * 100) : 0) + "%";

  if (renderer) {
    renderer.domElement.remove();
  }
}

function backToMenu() {
  results.style.display = "none";
  menu.style.display = "flex";
}

// ================= HUD =================
function updateHUD() {
  scoreEl.textContent = "Score: " + Math.floor(score);
  accuracyEl.textContent =
    "Accuracy: " + (shots ? Math.round((hits / shots) * 100) : 0) + "%";
  timerEl.textContent = "⏱ " + timeLeft;
}

// ================= GRIDSHOT =================
function startGrid() {
  canvas.style.display = "block";
  let targets = Array.from({ length: 6 }, newTarget);

  canvas.onclick = e => {
    shots++;
    targets.forEach((t, i) => {
      if (Math.hypot(e.clientX - t.x, e.clientY - t.y) < t.r) {
        score++;
        hits++;
        targets[i] = newTarget();
      }
    });
    updateHUD();
  };

  function loop() {
    if (!running || mode !== "grid") return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    targets.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();
    });
    requestAnimationFrame(loop);
  }
  loop();
}

function newTarget() {
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: 20
  };
}

// ================= TRACKING =================
function startTracking() {
  canvas.style.display = "block";
  let angle = 0;
  let target = { x: 0, y: 0, r: 25 };

  function loop() {
    if (!running || mode !== "tracking") return;

    angle += 0.03;
    target.x = window.innerWidth / 2 + Math.cos(angle) * 200;
    target.y = window.innerHeight / 2 + Math.sin(angle) * 200;

    shots++;
    if (
      Math.hypot(mouseX - target.x, mouseY - target.y) < target.r
    ) {
      score++;
      hits++;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();

    updateHUD();
    requestAnimationFrame(loop);
  }

  let mouseX = 0;
  let mouseY = 0;
  document.onmousemove = e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };

  loop();
}

// ================= 3D ARENA =================
let scene, camera, renderer, sphere;
let yaw = 0;
let pitch = 0;

function startArena() {
  canvas.style.display = "none";

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.set(0, 2, 8);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x228822 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // 🔴 RONDE BOL
  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  scene.add(sphere);

  // Mouse look zonder roll
  document.body.requestPointerLock();

  document.onmousemove = e => {
    if (!running || mode !== "arena") return;

    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;

    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  };

  let angle = 0;

  function animate() {
    if (!running || mode !== "arena") return;

    angle += 0.02;

    sphere.position.x = Math.cos(angle) * 6;
    sphere.position.z = Math.sin(angle) * 6;
    sphere.position.y = 2 + Math.abs(Math.sin(angle * 3)) * 3;

    // Raycast vanuit midden scherm
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const intersects = raycaster.intersectObject(sphere);

    shots++;
    if (intersects.length > 0) {
      score++;
      hits++;
    }

    updateHUD();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}