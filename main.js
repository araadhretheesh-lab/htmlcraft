import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// --- 1. Setup ---
const noise2D = createNoise2D();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 80); // Fog hides the edge of the world

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

// Helper to get block type at coordinates
const getBlock = (x, y, z) => worldData.get(`${x},${y},${z}`);

function buildChunkMesh(cx, cz) {
    const positions = [];
    const normals = [];
    const indices = [];
    let vertexCount = 0;

    // 1. Generate local data for the chunk
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            const height = Math.floor(noise2D(worldX / 20, worldZ / 20) * 10) + 10;
            
            for (let y = 0; y <= height; y++) {
                worldData.set(`${worldX},${y},${worldZ}`, y === height ? 1 : 2);
            }
        }
    }

    // 2. Build geometry only for EXPOSED faces (Face Culling)
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            
            for (let y = 0; y < 30; y++) {
                if (!getBlock(worldX, y, worldZ)) continue;

                // Define the 6 possible neighbors
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
                        // Add face
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
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

// Build initial area
for(let x = -1; x <= 1; x++) for(let z = -1; z <= 1; z++) buildChunkMesh(x, z);

camera.position.set(8, 25, 30);
camera.lookAt(8, 15, 8);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();