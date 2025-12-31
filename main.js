import * as THREE from 'three';
import { makeNoise2D } from 'simplex-noise';

// --- 1. Setup ---
const noise2D = makeNoise2D();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ'; 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));

// --- 2. Terrain Data & Optimization ---
const worldSize = 32; 
const worldData = {}; 

// Generate Data
for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
        // Divide by 20 to make the terrain even smoother/flatter
        const noiseValue = noise2D(x / 20, z / 20);
        const height = Math.floor(noiseValue * 5) + 5;
        for (let y = 0; y <= height; y++) {
            worldData[`${x},${y},${z}`] = (y === height) ? 'grass' : 'dirt';
        }
    }
}

// Build Mesh with Face Culling
const geometry = new THREE.BoxGeometry(1, 1, 1);
const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d9e3d });
const dirtMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
const worldBlocks = [];

for (const key in worldData) {
    const [x, y, z] = key.split(',').map(Number);
    
    // Check neighbors
    const hasAbove = worldData[`${x},${y+1},${z}`];
    const hasBelow = worldData[`${x},${y-1},${z}`];
    const hasLeft  = worldData[`${x-1},${y},${z}`];
    const hasRight = worldData[`${x+1},${y},${z}`];
    const hasFront = worldData[`${x},${y},${z+1}`];
    const hasBack  = worldData[`${x},${y},${z-1}`];

    // Face Culling: Only draw if exposed to air
    if (!hasAbove || !hasBelow || !hasLeft || !hasRight || !hasFront || !hasBack) {
        const type = worldData[key];
        const block = new THREE.Mesh(geometry, type === 'grass' ? grassMat : dirtMat);
        block.position.set(x, y, z);
        scene.add(block);
        worldBlocks.push(new THREE.Box3().setFromObject(block));
    }
}

// --- 3. Physics & Controls ---
const player = {
    pos: new THREE.Vector3(worldSize/2, 15, worldSize/2),
    vel: new THREE.Vector3(0, 0, 0),
    width: 0.5,
    height: 1.8,
    onGround: false
};

const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.addEventListener('mousedown', () => document.body.requestPointerLock());

let pitch = 0, yaw = 0;
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        camera.rotation.set(pitch, yaw, 0);
    }
});

function checkCollision(newPos) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        newPos, 
        new THREE.Vector3(player.width, player.height, player.width)
    );
    for (let box of worldBlocks) {
        if (playerBox.intersectsBox(box)) return true;
    }
    return false;
}

function updatePhysics() {
    const speed = 0.12;
    const gravity = -0.015;
    const jumpStrength = 0.25;

    let moveX = 0, moveZ = 0;
    if (keys['KeyW']) moveZ -= 1;
    if (keys['KeyS']) moveZ += 1;
    if (keys['KeyA']) moveX -= 1;
    if (keys['KeyD']) moveX += 1;

    const direction = new THREE.Vector3(moveX, 0, moveZ).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), yaw)).normalize();
    player.vel.x = direction.x * speed;
    player.vel.z = direction.z * speed;

    player.vel.y += gravity;
    if (keys['Space'] && player.onGround) {
        player.vel.y = jumpStrength;
        player.onGround = false;
    }

    player.pos.x += player.vel.x;
    if (checkCollision(player.pos)) player.pos.x -= player.vel.x;
    
    player.pos.z += player.vel.z;
    if (checkCollision(player.pos)) player.pos.z -= player.vel.z;

    player.pos.y += player.vel.y;
    player.onGround = false;
    if (checkCollision(player.pos)) {
        if (player.vel.y < 0) player.onGround = true;
        player.pos.y -= player.vel.y;
        player.vel.y = 0;
    }

    camera.position.copy(player.pos);
    camera.position.y += 0.7; 
}

function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});