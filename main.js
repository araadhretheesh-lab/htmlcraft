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

// --- 2. World Data ---
const CHUNK_SIZE = 16;
const worldData = new Map();
const getBlock = (x, y, z) => worldData.get(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`);

function buildChunkMesh(cx, cz) {
    const positions = [];
    const normals = [];
    const indices = [];
    let vertexCount = 0;

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

    // Rendering logic (Face Culling)
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            for (let y = 0; y < 30; y++) {
                if (!getBlock(worldX, y, worldZ)) continue;
                const neighbors = [
                    { dir: [0, 1, 0], n: [0, 1, 0], corners: [[0,1,1], [1,1,1], [0,1,0], [1,1,0]] }, 
                    { dir: [0, -1, 0], n: [0, -1, 0], corners: [[0,0,0], [1,0,0], [0,0,1], [1,0,1]] },
                    { dir: [1, 0, 0], n: [1, 0, 0], corners: [[1,0,1], [1,0,0], [1,1,1], [1,1,0]] },
                    { dir: [-1, 0, 0], n: [-1, 0, 0], corners: [[0,0,0], [0,0,1], [0,1,0], [0,1,1]] },
                    { dir: [0, 0, 1], n: [0, 0, 1], corners: [[0,0,1], [1,0,1], [0,1,1], [1,1,1]] },
                    { dir: [0, 0, -1], n: [0, 0, -1], corners: [[1,0,0], [0,0,0], [1,1,0], [0,1,0]] },
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
    scene.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x55aa55 })));
}

for(let x = -2; x <= 2; x++) for(let z = -2; z <= 2; z++) buildChunkMesh(x, z);

// --- 3. Better Physics & Controls ---
const player = {
    pos: new THREE.Vector3(8, 30, 8),
    vel: new THREE.Vector3(0, 0, 0),
    height: 1.8,
    radius: 0.4,
    onGround: false
};

const keys = {};
document.addEventListener('mousedown', () => renderer.domElement.requestPointerLock());
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

let yaw = 0, pitch = 0;
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        camera.rotation.set(pitch, yaw, 0);
    }
});

function updatePhysics() {
    const gravity = -0.012;
    const jumpPower = 0.22;
    const speed = 0.12;
    const playerHeight = 1.8; // Standard height

    // 1. Apply Gravity
    player.vel.y += gravity;

    // 2. Horizontal Movement
    const moveDir = new THREE.Vector3();
    if (keys['KeyW']) moveDir.z -= 1;
    if (keys['KeyS']) moveDir.z += 1;
    if (keys['KeyA']) moveDir.x -= 1;
    if (keys['KeyD']) moveDir.x += 1;
    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).normalize().multiplyScalar(speed);

    // 3. X & Z Collision (Wall sliding)
    let nextX = player.pos.x + moveDir.x;
    let nextZ = player.pos.z + moveDir.z;
    
    // Check at "Eye Level" and "Foot Level" to prevent walking through walls
    const isWallX = getBlock(nextX + (moveDir.x > 0 ? 0.3 : -0.3), player.pos.y, player.pos.z) || 
                    getBlock(nextX + (moveDir.x > 0 ? 0.3 : -0.3), player.pos.y - 1, player.pos.z);
    
    if (!isWallX) player.pos.x = nextX;

    const isWallZ = getBlock(player.pos.x, player.pos.y, nextZ + (moveDir.z > 0 ? 0.3 : -0.3)) ||
                    getBlock(player.pos.x, player.pos.y - 1, nextZ + (moveDir.z > 0 ? 0.3 : -0.3));
    
    if (!isWallZ) player.pos.z = nextZ;

    // 4. Vertical Movement (Gravity & Jumping)
    player.pos.y += player.vel.y;

    // 5. Floor Collision
    const currentGround = Math.floor(noise2D(player.pos.x / 24, player.pos.z / 24) * 8) + 11;
    
    if (player.pos.y < currentGround + playerHeight) {
        player.pos.y = currentGround + playerHeight;
        player.vel.y = 0;
        player.onGround = true;
    } else {
        player.onGround = false;
    }

    // 6. Ceiling Check (The "Glue Trap" fix)
    // If our head hits a block above us, stop upward velocity
    if (getBlock(player.pos.x, player.pos.y + 0.1, player.pos.z)) {
        player.vel.y = Math.min(0, player.vel.y);
    }

    // 7. Jump Logic
    if (keys['Space'] && player.onGround) {
        player.vel.y = jumpPower;
        player.onGround = false;
    }

    // 8. Camera Placement (Eye Level)
    camera.position.x = player.pos.x;
    camera.position.y = player.pos.y - 0.2; // Eyes are slightly below the very top of the head
    camera.position.z = player.pos.z;
}}

function animate() {
    requestAnimationFrame(animate);
    if (document.pointerLockElement === renderer.domElement) {
        updatePhysics();
    }
    renderer.render(scene, camera);
}
animate();