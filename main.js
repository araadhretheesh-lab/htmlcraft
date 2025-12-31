import * as THREE from 'three';

// --- 1. Basic Engine Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky Blue

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// CRITICAL: This prevents the camera from tilting like a plane when you look around
camera.rotation.order = 'YXZ'; 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 2. Lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 0.5);
sun.position.set(10, 20, 10);
scene.add(sun);

// --- 3. 16x16 Grid Generation ---
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x3d9e3d }); // Grass Green

for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x, 0, z);
        scene.add(block);
    }
}

// Start the player in the middle of the grid
camera.position.set(8, 2, 12);

// --- 4. Controls (Mouse & Keyboard) ---
const keys = {};
let pitch = 0; // Vertical rotation
let yaw = 0;   // Horizontal rotation

window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// Lock mouse on click
window.addEventListener('mousedown', () => {
    document.body.requestPointerLock();
});

// Capture Mouse Movement
window.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === document.body) {
        const sensitivity = 0.002;
        
        // Update yaw (Left/Right) and pitch (Up/Down)
        yaw -= event.movementX * sensitivity;
        pitch -= event.movementY * sensitivity;

        // Clamp pitch so you can't flip the camera upside down
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

        camera.rotation.set(pitch, yaw, 0);
    }
});

// --- 5. Game Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    const speed = 0.1;
    // .translate lets us move relative to where the camera is LOOKING
    if (keys['KeyW']) camera.translateZ(-speed);
    if (keys['KeyS']) camera.translateZ(speed);
    if (keys['KeyA']) camera.translateX(-speed);
    if (keys['KeyD']) camera.translateX(speed);

    // Lock Y position so we stay on the ground
    camera.position.y = 2;

    renderer.render(scene, camera);
}
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});