import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';

// --- 1. Scene & Renderer Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ'; // Important for Minecraft-style looking

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(1); // Performance boost
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 2. Lighting ---
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(5, 10, 7);
scene.add(sun, new THREE.AmbientLight(0xffffff, 0.5));

// --- 3. Module Instances ---
const world = new World(scene);
const player = new Player(camera);

// Build initial starting area (around 0,0)
for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
        world.buildChunkMesh(x, z);
    }
}

// --- 4. Pointer Lock (The "Command" to lock the mouse) ---
document.addEventListener('mousedown', () => {
    // We request the lock on the game canvas
    renderer.domElement.requestPointerLock();
});

// Optional: Error logging for Pointer Lock
document.addEventListener('pointerlockerror', () => {
    console.error("Pointer Lock failed. Ensure you clicked the game window.");
});

// --- 5. The Main Loop (The Heartbeat) ---
function animate() {
    requestAnimationFrame(animate);

    // Only update game logic if the mouse is locked
    if (document.pointerLockElement === renderer.domElement) {
        // 1. Tell player to move and check collisions
        player.update(world);
        
        // 2. Tell world to update infinite chunks based on player location
        world.update(player.pos.x, player.pos.z);
    }

    renderer.render(scene, camera);
}

// Start the game
animate();

// --- 6. Handle Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});