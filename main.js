import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';

// --- 1. Command Center Initialization ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(5, 10, 7);
scene.add(sun, new THREE.AmbientLight(0xffffff, 0.5));

// --- 2. Module Instances ---
const world = new World(scene);
const player = new Player(camera);

// Generate initial world
for(let x = -2; x <= 2; x++) {
    for(let z = -2; z <= 2; z++) {
        world.generateChunk(x, z);
    }
}

// --- 3. Pointer Lock Request (Command Center Task) ---
document.addEventListener('mousedown', () => {
    renderer.domElement.requestPointerLock();
});

// --- 4. The Heartbeat (Main Loop) ---
function animate() {
    requestAnimationFrame(animate);

    if (document.pointerLockElement === renderer.domElement) {
        // Send a message to the player to update itself using world data
        player.update(world);
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});