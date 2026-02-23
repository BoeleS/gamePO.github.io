// ================= GLOBAL STATE =================
let mode = "";
let running = false;
let paused = false;

let score = 0;
let hits = 0;
let shots = 0;
let timeLeft = 30;
let angle = 0;

// ================= UI =================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

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

// ================= BUTTONS =================
document.getElementById("gridBtn").onclick = () => start("grid");
document.getElementById("trackBtn").onclick = () => start("tracking");
document.getElementById("arenaBtn").onclick = () => start("arena3d");
document.getElementById("backBtn").onclick = backToMenu;

// ================= TIMER =================
setInterval(() => {
  if (!running || paused) return;
  timeLeft--;
  if (timeLeft <= 0) endGame();
}, 1000);

// ================= 2D ENGINE =================
let targets = [];
let mouseX = 0;
let mouseY = 0;

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

document.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (mode === "arena3d" && running && !paused) {
    yaw.rotation.y -= e.movementX * 0.002;
    pitch.rotation.x -= e.movementY * 0.002;

    // Clamp vertical look
    pitch.rotation.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, pitch.rotation.x)
    );
  }
});

canvas.addEventListener("click", () => {
  if (!running || paused || mode !== "grid") return;

  shots++;
  targets.forEach((t, i) => {
    if (Math.hypot(mouseX - t.x, mouseY - t.y) <= t.r) {
      score++;
      hits++;
      targets[i] = newTarget();
    }
  });
});

function spawnGrid() {
  return Array.from({ length: 6 }, () => newTarget());
}

function spawnTracking() {
  return [{ x: innerWidth/2, y: innerHeight/2, r: 30 }];
}

function newTarget() {
  return {
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * (canvas.height - 100) + 50,
    r: 22
  };
}

// ================= 3D ENGINE =================
let scene, camera, renderer;
let arenaTarget;
let yaw, pitch;

function initArena() {

  const container = document.createElement("div");
  container.id = "threeContainer";
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

  // FPS Camera setup (NO ROLL)
  yaw = new THREE.Object3D();
  pitch = new THREE.Object3D();

  yaw.add(pitch);
  pitch.add(camera);

  scene.add(yaw);

  yaw.position.set(0, 2, 8);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x228822 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Bergen
  for (let i = 0; i < 30; i++) {
    const mountain = new THREE.Mesh(
      new THREE.ConeGeometry(5 + Math.random()*5, 10 + Math.random()*10, 6),
      new THREE.MeshStandardMaterial({ color: 0x556b2f })
    );
    mountain.position.set(
      (Math.random()-0.5)*150,
      5,
      (Math.random()-0.5)*150
    );
    scene.add(mountain);
  }

  // 🔴 RONDE BOL (geen blok meer)
  arenaTarget = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  scene.add(arenaTarget);

  animateArena();
}

function animateArena() {
  if (!running || paused || mode !== "arena3d") return;

  requestAnimationFrame(animateArena);

  angle += 0.02;

  // Rondje rondom speler
  arenaTarget.position.x = Math.cos(angle) * 8;
  arenaTarget.position.z = Math.sin(angle) * 8;
  arenaTarget.position.y = 2 + Math.abs(Math.sin(angle*3)) * 3;

  // Projecteer naar schermruimte
  const vector = arenaTarget.position.clone();
  vector.project(camera);

  shots++;

  // Als bol in midden van scherm zit → score omhoog
  const tolerance = 0.06;

  if (Math.abs(vector.x) < tolerance &&
      Math.abs(vector.y) < tolerance &&
      vector.z < 1) {

    score += 1;
    hits++;
  }

  scoreEl.textContent = `Score: ${Math.floor(score)}`;
  accEl.textContent = `Accuracy: ${shots ? Math.round(hits/shots*100) : 0}%`;
  timeEl.textContent = `⏱ ${timeLeft}`;

  renderer.render(scene, camera);
}

// ================= START =================
function start(m) {
  mode = m;
  running = true;
  paused = false;
  score = 0;
  hits = 0;
  shots = 0;
  timeLeft = 30;
  angle = 0;

  menu.style.display = "none";
  results.style.display = "none";
  hud.style.display = "flex";

  canvas.style.display = (mode === "arena3d") ? "none" : "block";

  if (mode === "grid") targets = spawnGrid();
  if (mode === "tracking") targets = spawnTracking();
  if (mode === "arena3d") initArena();
}

// ================= END =================
function endGame() {
  running = false;

  if (mode === "arena3d") {
    document.getElementById("threeContainer").remove();
  }

  hud.style.display = "none";
  results.style.display = "flex";

  const acc = shots ? Math.round((hits/shots)*100) : 0;

  rScore.textContent = `Score: ${Math.floor(score)}`;
  rHits.textContent = `Hits: ${hits}`;
  rShots.textContent = `Shots: ${shots}`;
  rAcc.textContent = `Accuracy: ${acc}%`;
}

// ================= 2D LOOP =================
function loop() {
  if (running && !paused && mode !== "arena3d") {

    if (mode === "tracking") {
      angle += 0.03;
      const t = targets[0];
      t.x = innerWidth/2 + Math.cos(angle)*220;
      t.y = innerHeight/2 + Math.sin(angle)*220;

      shots++;
      if (Math.hypot(mouseX - t.x, mouseY - t.y) <= t.r) {
        score++;
        hits++;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    targets.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI*2);
      ctx.fillStyle = "red";
      ctx.fill();
    });

    scoreEl.textContent = `Score: ${score}`;
    accEl.textContent = `Accuracy: ${shots ? Math.round(hits/shots*100) : 0}%`;
    timeEl.textContent = `⏱ ${timeLeft}`;
  }

  requestAnimationFrame(loop);
}
loop();

function backToMenu() {
  running = false;
  results.style.display = "none";
  menu.style.display = "flex";
}