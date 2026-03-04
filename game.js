// ===== THREE SETUP =====
const canvas = document.getElementById("game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ===== LIGHT =====
scene.add(new THREE.AmbientLight(0xffffff,0.6));
const light = new THREE.DirectionalLight(0xffffff,1);
light.position.set(5,10,7);
scene.add(light);

// ===== FLOOR =====
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100,100),
  new THREE.MeshStandardMaterial({color:0x111111})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

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
let mode="", running=false;
let score=0,hits=0,shots=0,timeLeft=30;
let targets=[];
let bounceBall=null;
let angle=0;

document.getElementById("gridBtn").onclick=()=>start("grid");
document.getElementById("trackBtn").onclick=()=>start("tracking");
document.getElementById("bounceBtn").onclick=()=>start("bounce");
document.getElementById("backBtn").onclick=backToMenu;

// ===== START =====
function start(m){
mode=m; running=true;
score=0;hits=0;shots=0;timeLeft=30;
angle=0;
menu.style.display="none";
results.style.display="none";
hud.style.display="flex";
clearScene();

if(mode==="grid") spawnGrid();
if(mode==="tracking") spawnTracking();
if(mode==="bounce") spawnBounce();
}

// ===== CLEAR OBJECTS =====
function clearScene(){
targets.forEach(t=>scene.remove(t));
targets=[];
if(bounceBall){scene.remove(bounceBall);bounceBall=null;}
}

// ===== GRID =====
function spawnGrid(){
for(let i=0;i<6;i++){
const ball=createBall(0xff0000,1);
ball.position.set(
(Math.random()-0.5)*15,
Math.random()*6+1,
(Math.random()-0.5)*15
);
scene.add(ball);
targets.push(ball);
}
}

// ===== TRACKING =====
function spawnTracking(){
const ball=createBall(0xff0000,1.2);
scene.add(ball);
targets=[ball];
}

// ===== BOUNCE =====
function spawnBounce(){
bounceBall=createBall(0xff8800,1.2);
bounceBall.position.set(0,5,0);
bounceBall.userData.vx=0.2;
bounceBall.userData.vy=0.25;
bounceBall.userData.vz=0.18;
scene.add(bounceBall);
}

// ===== CREATE BALL =====
function createBall(color,size){
return new THREE.Mesh(
new THREE.SphereGeometry(size,32,32),
new THREE.MeshStandardMaterial({color})
);
}

// ===== TIMER =====
setInterval(()=>{
if(!running)return;
timeLeft--;
if(timeLeft<=0)endGame();
},1000);

// ===== END =====
function endGame(){
running=false;
hud.style.display="none";
results.style.display="flex";
const acc=shots?Math.round(hits/shots*100):0;
rScore.textContent="Score: "+score;
rHits.textContent="Hits: "+hits;
rShots.textContent="Shots: "+shots;
rAcc.textContent="Accuracy: "+acc+"%";
}

// ===== RAYCAST =====
const raycaster=new THREE.Raycaster();
const mouse=new THREE.Vector2();

window.addEventListener("mousemove",e=>{
mouse.x=(e.clientX/window.innerWidth)*2-1;
mouse.y=-(e.clientY/window.innerHeight)*2+1;
});

// ===== UPDATE =====
function update(){
if(!running)return;

if(mode==="tracking"){
angle+=0.02;
targets[0].position.x=Math.cos(angle)*6;
targets[0].position.z=Math.sin(angle)*6;
shots++;
}

if(mode==="bounce"){
const b=bounceBall;
b.position.x+=b.userData.vx;
b.position.y+=b.userData.vy;
b.position.z+=b.userData.vz;

if(b.position.x>10||b.position.x<-10)b.userData.vx*=-1;
if(b.position.z>10||b.position.z<-10)b.userData.vz*=-1;
if(b.position.y>8||b.position.y<1)b.userData.vy*=-1;

shots++;
}

raycaster.setFromCamera(mouse,camera);
const intersects=raycaster.intersectObjects(mode==="bounce"?[bounceBall]:targets);

if(intersects.length>0){
score++;hits++;
}

scoreEl.textContent="Score: "+score;
timeEl.textContent="⏱ "+timeLeft;
accEl.textContent="Accuracy: "+(shots?Math.round(hits/shots*100):0)+"%";
}

// ===== LOOP =====
function animate(){
requestAnimationFrame(animate);
update();
renderer.render(scene,camera);
}
animate();

// ===== BACK =====
function backToMenu(){
running=false;
menu.style.display="flex";
hud.style.display="none";
results.style.display="none";
clearScene();
}