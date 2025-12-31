import * as THREE from 'three';

// 1. Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 0.5);
sun.position.set(10, 20, 10);
scene.add(sun);

// 3. 16x16 Grid Generation
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x3d9e3d }); // Grass Green

for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x, 0, z);
        scene.add(block);
    }
}

// Initial Camera Position
camera.position.set(8, 5, 18);
camera.lookAt(8, 0, 8);

// 4. Movement & Controls
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

window.addEventListener('mousedown', () => {
    document.body.requestPointerLock();
});

function animate() {
    requestAnimationFrame(animate);
    
    const speed = 0.1;
    if (keys['KeyW']) camera.position.z -= speed;
    if (keys['KeyS']) camera.position.z += speed;
    if (keys['KeyA']) camera.position.x -= speed;
    if (keys['KeyD']) camera.position.x += speed;

    renderer.render(scene, camera);
}
animate();

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});