import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';

// --- 1. Scene & Renderer Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// Fog is important for the "Subtle" transition you wanted
// It hides chunks popping in at the 18-billion block mark
scene.fog = new THREE.Fog(0x87CEEB, 20, 80);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.rotation.order = 'YXZ'; 

const renderer = new THREE.WebGLRenderer({ 
    antialias: false,
    powerPreference: "high-performance" 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// --- 2. Lighting ---
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(50, 100, 50);
scene.add(sun, new THREE.AmbientLight(0xffffff, 0.4));

// --- 3. Module Instances ---
// World.js now manages TerrainGenerator and ChunkBuilder internally
const world = new World(scene);
const player = new Player(camera);

// --- 4. Input & Pointer Lock ---
document.addEventListener('mousedown', () => {
    if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
    }
});

// --- 5. The Command Center (Main Loop) ---
function animate() {
    requestAnimationFrame(animate);

    // Only run logic if the game is active/focused
    if (document.pointerLockElement === renderer.domElement) {
        
        // Step 1: Update Player (Physics, Movement, Collision)
        // We pass 'world' so the player can check heights for floor collision
        player.update(world);
        
        // Step 2: Update World (Super-Chunk Tagging & Infinite Generation)
        // This handles the 480x480 logic and building chunks via the builder
        world.update(player.pos.x, player.pos.z);
    }

    renderer.render(scene, camera);
}

// Start the engine
animate();

// --- 6. Window Management ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});