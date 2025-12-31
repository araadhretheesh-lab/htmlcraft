import * as THREE from 'three';

// --- 1. Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ'; 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));

// --- 2. Terrain Generation (16x16 Chunk) ---
const geometry = new THREE.BoxGeometry(1, 1, 1);
const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d9e3d });
const dirtMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

const worldBlocks = [];
for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
        // Flat base + some simple hills
        const height = Math.floor(Math.random() * 2); 
        for (let y = 0; y <= height; y++) {
            const material = (y === height) ? grassMat : dirtMat;
            const block = new THREE.Mesh(geometry, material);
            block.position.set(x, y, z);
            scene.add(block);
            
            // Box3 is the standard way to handle voxel collision boundaries
            const box = new THREE.Box3().setFromObject(block);
            worldBlocks.push(box);
        }
    }
}

// --- 3. Player Physics Config (Minecraft Scale) ---
const player = {
    pos: new THREE.Vector3(8, 5, 8), // Starting position
    vel: new THREE.Vector3(0, 0, 0),
    width: 0.5,    // Hitbox width
    height: 1.8,   // Player is 1.8 units tall
    onGround: false
};

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

// --- 4. Collision Engine ---
function checkCollision(newPos) {
    // We create a bounding box around the player's current proposed position
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

    // Movement relative to camera direction
    let moveX = 0, moveZ = 0;
    if (keys['KeyW']) moveZ -= 1;
    if (keys['KeyS']) moveZ += 1;
    if (keys['KeyA']) moveX -= 1;
    if (keys['KeyD']) moveX += 1;

    const direction = new THREE.Vector3(moveX, 0, moveZ).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), yaw)).normalize();
    player.vel.x = direction.x * speed;
    player.vel.z = direction.z * speed;

    // Gravity
    player.vel.y += gravity;
    if (keys['Space'] && player.onGround) {
        player.vel.y = jumpStrength;
        player.onGround = false;
    }

    // Solve X Collision (prevents walking through sides)
    player.pos.x += player.vel.x;
    if (checkCollision(player.pos)) player.pos.x -= player.vel.x;
    
    // Solve Z Collision (prevents walking through sides)
    player.pos.z += player.vel.z;
    if (checkCollision(player.pos)) player.pos.z -= player.vel.z;

    // Solve Y Collision (Floor/Ceiling)
    player.pos.y += player.vel.y;
    player.onGround = false;
    if (checkCollision(player.pos)) {
        if (player.vel.y < 0) player.onGround = true; // Landed
        player.pos.y -= player.vel.y;
        player.vel.y = 0;
    }

    // SYNC CAMERA
    camera.position.copy(player.pos);
    // 0.7 offset from player center (height 1.8) puts eyes at 1.6 blocks high
    camera.position.y += 0.7; 
}

// --- 5. Game Loop ---
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