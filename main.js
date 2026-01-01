import * as THREE from 'three';
import { Player } from './Player.js';
import { World } from './World.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.5));

// --- Initialize Modules ---
const world = new World(scene);
const player = new Player(camera, world.noise2D);

// Initial World Load
for(let x = -2; x <= 2; x++) {
    for(let z = -2; z <= 2; z++) {
        world.buildChunkMesh(x, z);
    }
}

// --- Main Loop ---
function animate() {
    requestAnimationFrame(animate);

    if (document.pointerLockElement) {
        // Player needs to check against world data for collisions
        player.update(world.worldData);
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});