import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// --- 1. Setup ---
const noise2D = createNoise2D();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ'; 

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.5));

// --- 2. Voxel Data & Mesh Logic ---
const CHUNK_SIZE = 16;
const worldData = new Map();
const getBlock = (x, y, z) => worldData.get(`${x},${y},${z}`);

function buildChunkMesh(cx, cz) {
    const positions = [];
    const normals = [];
    const indices = [];
    let vertexCount = 0;

    // 1. Generate local data
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            const height = Math.floor(noise2D(worldX / 24, worldZ / 24) * 8) + 10;
            
            for (let y = 0; y <= height; y++) {
                worldData.set(`${worldX},${y},${worldZ}`, y === height ? 1 : 2);
            }
        }
    }

    // 2. Build geometry (Face Culling)
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            
            for (let y = 0; y < 25; y++) {
                if (!getBlock(worldX, y, worldZ)) continue;

                const neighbors = [
                    { dir: [0, 1, 0], n: [0, 1, 0], corners: [[0,1,1], [1,1,1], [0,1,0], [1,1,0]] }, // Top
                    { dir: [0, -1, 0], n: [0, -1, 0], corners: [[0,0,0], [1,0,0], [0,0,1], [1,0,1]] }, // Bottom
                    { dir: [1, 0, 0], n: [1, 0, 0], corners: [[1,0,1], [1,0,0], [1,1,1], [1,1,0]] }, // Right
                    { dir: [-1, 0, 0], n: [-1, 0, 0], corners: [[0,0,0], [0,0,1], [0,1,0], [0,1,1]] }, // Left
                    { dir: [0, 0, 1], n: [0, 0, 1], corners: [[0,0,1], [1,0,1], [0,1,1], [1,1,1]] }, // Front
                    { dir: [0, 0, -1], n: [0, 0, -1], corners: [[1,0,0], [0,0,0], [1,1,0], [0,1,0]] }, // Back
                ];

                for (const { dir, n, corners } of neighbors) {
                    if (!getBlock(worldX + dir[0], y + dir[1], worldZ + dir[2])) {
                        corners.forEach(c => {
                            positions.push(worldX + c[0], y + c[1], worldZ + c[2]);
                            normals.push(...n);
                        });
                        indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount + 2, vertexCount + 1, vertexCount + 3);
                        vertexCount += 4;
                    }
                }
            }
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);
    
    const material = new THREE.MeshStandardMaterial({ color: 0x55aa55 });
    scene.add(new THREE.Mesh(geometry, material));
}

// Generate starting area
for(let x = -2; x <= 2; x++) for(let z = -2; z <= 2; z++) buildChunkMesh(x, z);

// --- 3. PointerLock & Controls ---
const player = { pos: new THREE.Vector3(8, 25, 8), velocity: new THREE.Vector3() };
const keys = {};

document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);
document.addEventListener('mousedown', () => document.body.requestPointerLock());

let yaw = 0, pitch = 0;
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        camera.rotation.set(pitch, yaw, 0);
    }
});

// --- 4. Game Loop ---
function animate() {
    requestAnimationFrame(animate);

    if (document.pointerLockElement) {
        const speed = 0.15;
        const move = new THREE.Vector3();
        if (keys['KeyW']) move.z -= 1;
        if (keys['KeyS']) move.z += 1;
        if (keys['KeyA']) move.x -= 1;
        if (keys['KeyD']) move.x += 1;

        move.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).normalize().multiplyScalar(speed);
        player.pos.add(move);

        // Simple Ground Follow
        const heightAtPos = Math.floor(noise2D(player.pos.x / 24, player.pos.z / 24) * 8) + 12;
        player.pos.y = heightAtPos;
    }

    camera.position.copy(player.pos);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});