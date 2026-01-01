import * as THREE from 'three';

export class Player {
    constructor(camera) {
        this.camera = camera;
        this.pos = new THREE.Vector3(0, 20, 0);
        this.vel = new THREE.Vector3(0, 0, 0);
        this.keys = {};
        this.canJump = false;

        // Mouse look sensitivity
        this.lookSpeed = 0.002;

        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.camera.rotation.y -= e.movementX * this.lookSpeed;
                this.camera.rotation.x -= e.movementY * this.lookSpeed;
                this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation.x));
            }
        });
    }

    update(world) {
        // 1. Movement Logic
        const speed = this.keys['ShiftLeft'] ? 0.3 : 0.15; // Sprint support!
        const input = new THREE.Vector3();
        if (this.keys['KeyW']) input.z -= 1;
        if (this.keys['KeyS']) input.z += 1;
        if (this.keys['KeyA']) input.x -= 1;
        if (this.keys['KeyD']) input.x += 1;

        input.normalize().applyQuaternion(this.camera.quaternion);
        this.vel.x = input.x * speed;
        this.vel.z = input.z * speed;

        // 2. Physics & Collision (The "Noise" Fix)
        // We ask the generator directly for the ground height
        const groundHeight = world.generator.getHeight(this.pos.x, this.pos.z);

        if (this.pos.y > groundHeight + 1.6) {
            this.vel.y -= 0.01; // Gravity
            this.canJump = false;
        } else {
            this.pos.y = groundHeight + 1.6; // Floor snap
            this.vel.y = 0;
            this.canJump = true;
        }

        // 3. Jump
        if (this.keys['Space'] && this.canJump) {
            this.vel.y = 0.2;
            this.canJump = false;
        }

        // Apply movement
        this.pos.add(this.vel);
        this.camera.position.copy(this.pos);
    }
}