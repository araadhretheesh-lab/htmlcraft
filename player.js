import * as THREE from 'three';

export class Player {
    constructor(camera, noise2D) {
        this.camera = camera;
        this.noise2D = noise2D;
        
        // Physical Properties
        this.pos = new THREE.Vector3(8, 30, 8);
        this.vel = new THREE.Vector3(0, 0, 0);
        this.height = 1.8;
        this.eyeLevel = 1.6; // Eyes are slightly below top of head
        this.onGround = false;
        
        // Controls
        this.keys = {};
        this.yaw = 0;
        this.pitch = 0;

        this.initEventListeners();
    }

    initEventListeners() {
        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.yaw -= e.movementX * 0.002;
                this.pitch -= e.movementY * 0.002;
                this.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.pitch));
                this.camera.rotation.set(this.pitch, this.yaw, 0);
            }
        });
    }

    update(worldData) {
        const gravity = -0.012;
        const jumpPower = 0.22;
        const speed = 0.12;

        // 1. Gravity
        this.vel.y += gravity;

        // 2. Input Direction
        const moveDir = new THREE.Vector3();
        if (this.keys['KeyW']) moveDir.z -= 1;
        if (this.keys['KeyS']) moveDir.z += 1;
        if (this.keys['KeyA']) moveDir.x -= 1;
        if (this.keys['KeyD']) moveDir.x += 1;
        
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).normalize().multiplyScalar(speed);

        // 3. Horizontal Collision (X & Z)
        let nextX = this.pos.x + moveDir.x;
        let nextZ = this.pos.z + moveDir.z;

        // Helper to check if a position is solid in the worldData Map
        const isSolid = (x, y, z) => worldData.has(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`);

        // Check feet and chest level
        if (!isSolid(nextX + (moveDir.x > 0 ? 0.3 : -0.3), this.pos.y - 1.5, this.pos.z)) {
            this.pos.x = nextX;
        }
        if (!isSolid(this.pos.x, this.pos.y - 1.5, nextZ + (moveDir.z > 0 ? 0.3 : -0.3))) {
            this.pos.z = nextZ;
        }

        // 4. Vertical Movement & Floor Collision
        this.pos.y += this.vel.y;
        
        // Calculate ground height from noise
        const groundY = Math.floor(this.noise2D(this.pos.x / 24, this.pos.z / 24) * 8) + 11;
        const feetLimit = groundY + this.height;

        if (this.pos.y < feetLimit) {
            this.pos.y = feetLimit;
            this.vel.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // 5. Jump
        if (this.keys['Space'] && this.onGround) {
            this.vel.y = jumpPower;
            this.onGround = false;
        }

        // 6. Update Camera
        this.camera.position.set(this.pos.x, this.pos.y - (this.height - this.eyeLevel), this.pos.z);
    }
}