import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// --- 1. Setup ---
const noise2D = createNoise2D();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ'; 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));

// --- 2. Chunk Management System ---
const CHUNK_SIZE = 16;
const RENDER_DISTANCE = 3; // Number of chunks around player
const chunks = new Map(); // Key: "x,z", Value: THREE.Group
const worldData = {};    // Key: "x,y,z", Value: type

const geometry = new THREE.BoxGeometry(1, 1, 1);
const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d9e3d });
const dirtMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

function getChunkCoords(x, z) {
    return {
        cx: Math.floor(x / CHUNK_SIZE),
        cz: Math.floor(z / CHUNK_SIZE)
    };
}

function generateChunk(cx, cz) {
    const chunkKey = `${cx},${cz}`;
    if (chunks.has(chunkKey)) return;

    const chunkGroup = new THREE.Group();
    
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            
            // Terrain noise
            const noiseValue = noise2D(worldX / 20, worldZ / 20);
            const height = Math.floor(noiseValue * 5) + 5;

            for (let y = 0; y <= height; y++) {
                worldData[`${worldX},${y},${worldZ}`] = (y === height) ? 'grass' : 'dirt';
            }

            // Render logic (simplified face culling for performance)
            const y = height; 
            const block = new THREE.Mesh(geometry, grassMat);
            block.position.set(worldX, y, worldZ);
            chunkGroup.add(block);
        }
    }

    scene.add(chunkGroup);
    chunks.set(chunkKey, chunkGroup);
}

function updateChunks(playerX, playerZ) {
    const { cx, cz } = getChunkCoords(playerX, playerZ);

    // Load new chunks
    for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
        for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
            generateChunk(cx + x, cz + z);
        }
    }

    // Unload far chunks
    for (const [key, group] of chunks) {
        const [ccx, ccz] = key.split(',').map(Number);
        if (Math.abs(ccx - cx) > RENDER_DISTANCE || Math.abs(ccz - cz) > RENDER_DISTANCE) {
            scene.remove(group);
            chunks.delete(key);
        }
    }
}

// --- 3. Player Physics & Loop ---
const player = {
    pos: new THREE.Vector3(8, 20, 8),
    vel: new THREE.Vector3(0, 0, 0),
    onGround: false
};

const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.addEventListener('mousedown', () => document.body.requestPointerLock());

let yaw = 0, pitch = 0;
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        camera.rotation.set(pitch, yaw, 0);
    }
});

function updatePhysics() {
    const speed = 0.15;
    const gravity = -0.01;
    
    // Movement
    let moveX = 0, moveZ = 0;
    if (keys['KeyW']) moveZ -= 1;
    if (keys['KeyS']) moveZ += 1;
    if (keys['KeyA']) moveX -= 1;
    if (keys['KeyD']) moveX += 1;

    const moveDir = new THREE.Vector3(moveX, 0, moveZ)
        .applyAxisAngle(new THREE.Vector3(0,1,0), yaw)
        .normalize()
        .multiplyScalar(speed);

    player.pos.add(moveDir);
    player.vel.y += gravity;
    player.pos.y += player.vel.y;

    // Floor collision (Simple)
    const floorY = 10; // Placeholder for real collision logic
    if (player.pos.y < floorY) {
        player.pos.y = floorY;
        player.vel.y = 0;
        player.onGround = true;
    }

    if (keys['Space'] && player.onGround) {
        player.vel.y = 0.2;
        player.onGround = false;
    }

    camera.position.copy(player.pos);
    updateChunks(player.pos.x, player.pos.z);
}

function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    renderer.render(scene, camera);
}
animate();