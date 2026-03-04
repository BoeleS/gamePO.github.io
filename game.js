// ===== BASIC 3D SETUP =====
const canvas = document.getElementById("game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0066ff); // blauwe ruimte

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0,2,15);

const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setSize(innerWidth, innerHeight);

addEventListener("resize", ()=>{
renderer.setSize(innerWidth, innerHeight);
camera.aspect = innerWidth/innerHeight;
camera.updateProjectionMatrix();
});

// ===== LIGHT =====
scene.add(new THREE.AmbientLight(0xffffff,0.7));
const light = new THREE.DirectionalLight(0xffffff,1);
light.position.set(5,10,7);
scene.add(light);

// ===== FLOOR =====
const floor = new THREE.Mesh(
new THREE.PlaneGeometry(200,200),
new THREE.MeshStandardMaterial({color:0x0044aa})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// ===== UI =====
const menu=document.getElementById("menu");
const hud=document.getElementById("hud");
const results=document.getElementById("results");
const scoreEl=document.getElementById("score");
const timeEl=document.getElementById("time");
const accEl=document.getElementById("accuracy");
const rScore=document.getElementById("rScore");
const rHits=document.getElementById("rHits");
const rShots=document.getElementById("rShots");
const rAcc=document.getElementById("rAcc");

let mode="", running=false;
let score=0,hits=0,shots=0,timeLeft=30;
let targets=[];
let angle=0;

// ===== BUTTONS =====
gridBtn.onclick=()=>start("grid");
trackBtn.onclick=()=>start("tracking");
bounceBtn.onclick=()=>start("bounce");
backBtn.onclick=backToMenu;

document.addEventListener("keydown", e=>{
if(e.key==="Escape") backToMenu();
});

// ===== START =====
function start(m){
mode=m;
running=true;
score=0;hits=0;shots=0;timeLeft=30;
angle=0;
clearTargets();

menu.style.display="none";
results.style.display="none";
hud.style.display="flex";

camera.rotation.set(0,0,0);
camera.position.set(0,2,15);

if(mode==="grid") spawnGrid();
if(mode==="tracking") spawnTracking();
if(mode==="bounce") spawnBounce();
}

// ===== CLEAR =====
function clearTargets(){
targets.forEach(t=>scene.remove(t));
targets=[];
}

// ===== BALL =====
function createBall(){
return new THREE.Mesh(
new THREE.SphereGeometry(1,32,32),
new THREE.MeshStandardMaterial({color:0xff0000})
);
}

function randomPosition(radius=25){
const theta=Math.random()*Math.PI*2;
return new THREE.Vector3(
Math.cos(theta)*radius,
Math.random()*8+1,
Math.sin(theta)*radius
);
}

// ===== GRIDSHOT =====
function spawnGrid(){
for(let i=0;i<20;i++){
const ball=createBall();
ball.position.copy(randomPosition());
scene.add(ball);
targets.push(ball);
}
}

// ===== TRACKING =====
function spawnTracking(){
const ball=createBall();
ball.position.set(25,3,0);
scene.add(ball);
targets=[ball];
}

// ===== BOUNCE =====
function spawnBounce(){
const ball=createBall();
ball.position.copy(randomPosition(20));
ball.userData.vel=new THREE.Vector3(
(Math.random()-0.5)*0.4,
(Math.random()-0.5)*0.4,
(Math.random()-0.5)*0.4
);
scene.add(ball);
targets=[ball];
}

// ===== SHOOT =====
addEventListener("mousedown", e=>{
if(!running)return;
shots++;

const mouse=new THREE.Vector2(
(e.clientX/innerWidth)*2-1,
-(e.clientY/innerHeight)*2+1
);

const ray=new THREE.Raycaster();
ray.setFromCamera(mouse,camera);
const hit=ray.intersectObjects(targets);

if(hit.length>0){
hits++;
score++;
scene.remove(hit[0].object);
targets.splice(targets.indexOf(hit[0].object),1);

if(mode==="tracking") spawnTracking();
if(mode==="bounce") spawnBounce();
}
});

// ===== TIMER =====
setInterval(()=>{
if(!running)return;
timeLeft--;
if(timeLeft<=0) endGame();
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

// ===== UPDATE =====
function update(){
if(!running)return;

if(mode==="tracking" && targets[0]){
angle+=0.02;
targets[0].position.x=Math.cos(angle)*25;
targets[0].position.z=Math.sin(angle)*25;
}

if(mode==="bounce" && targets[0]){
const b=targets[0];
b.position.add(b.userData.vel);
if(b.position.x>40||b.position.x<-40)b.userData.vel.x*=-1;
if(b.position.y>15||b.position.y<1)b.userData.vel.y*=-1;
if(b.position.z>40||b.position.z<-40)b.userData.vel.z*=-1;
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
clearTargets();
menu.style.display="flex";
hud.style.display="none";
results.style.display="none";
}