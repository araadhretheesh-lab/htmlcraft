import * as THREE from 'three';

// --- 1. Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ'; 
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

// --- 2. Terrain Generation (16x16 Chunk) ---
const geometry = new THREE.BoxGeometry(1, 1, 1);
const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d9e3d }); // Green
const dirtMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });  // Brown

const worldBlocks = [];
for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
        // Simple height variation
        const height = Math.floor(Math.random() * 2) + 1; 
        for (let y = 0; y <= height; y++) {
            const material = (y === height) ? grassMat : dirtMat;
            const block = new THREE.Mesh(geometry, material);
            block.position.set(x, y, z);
            scene.add(block);
            
            // Store for collision (using a simple Box3 for each)
            const box = new THREE.Box3().setFromObject(block);
            worldBlocks.push(box);
        }
    }
}

// --- 3. Physics & Movement Variables ---
const player = {
    pos: new THREE.Vector3(8, 10, 8),
    vel: new THREE.Vector3(0, 0, 0),
    width: 0.6,
    height: 1.8,
    onGround: false
};
camera.position.copy(player.pos);

const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.addEventListener('mousedown', () => document.body.requestPointerLock());

// Mouse Control
let pitch = 0, yaw = 0;
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        camera.rotation.set(pitch, yaw, 0);
    }
});

// --- 4. Collision Engine (The "Secret Sauce") ---
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

    // A. Apply Input to Velocity
    let moveX = 0, moveZ = 0;
    if (keys['KeyW']) moveZ -= 1;
    if (keys['KeyS']) moveZ += 1;
    if (keys['KeyA']) moveX -= 1;
    if (keys['KeyD']) moveX += 1;

    // Vector math to move relative to camera direction
    const direction = new THREE.Vector3(moveX, 0, moveZ).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), yaw)).normalize();
    player.vel.x = direction.x * speed;
    player.vel.z = direction.z * speed;

    // B. Gravity & Jumping
    player.vel.y += gravity;
    if (keys['Space'] && player.onGround) {
        player.vel.y = jumpStrength;
        player.onGround = false;
    }

    // C. Solve X Collision
    player.pos.x += player.vel.x;
    if (checkCollision(player.pos)) {
        player.pos.x -= player.vel.x;
        player.vel.x = 0;
    }

    // D. Solve Z Collision
    player.pos.z += player.vel.z;
    if (checkCollision(player.pos)) {
        player.pos.z -= player.vel.z;
        player.vel.z = 0;
    }

    // E. Solve Y Collision (Floor/Ceiling)
    player.pos.y += player.vel.y;
    player.onGround = false;
    if (checkCollision(player.pos)) {
        if (player.vel.y < 0) player.onGround = true; // Hit floor
        player.pos.y -= player.vel.y;
        player.vel.y = 0;
    }

    camera.position.copy(player.pos);
    camera.position.y += 0.8; // Eyes at top of player height
}

// --- 5. Game Loop ---
function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    renderer.render(scene, camera);
}
animate();