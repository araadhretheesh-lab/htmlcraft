import * as THREE from 'three';

export class Player {
    constructor(camera) {
        this.camera = camera;
        this.pos = new THREE.Vector3(8, 30, 8);
        this.vel = new THREE.Vector3(0, 0, 0);
        this.keys = {};
        this.yaw = 0;
        this.pitch = 0;
        this.height = 1.8;
        this.onGround = false;

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

    update(world) {
        const speed = 0.12;
        const gravity = -0.012;

        // Gravity
        this.vel.y += gravity;

        // Move Direction
        const move = new THREE.Vector3();
        if (this.keys['KeyW']) move.z -= 1;
        if (this.keys['KeyS']) move.z += 1;
        if (this.keys['KeyA']) move.x -= 1;
        if (this.keys['KeyD']) move.x += 1;
        move.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).normalize().multiplyScalar(speed);

        // Simple Collision & Jump
        this.pos.x += move.x;
        this.pos.z += move.z;
        this.pos.y += this.vel.y;

        const groundY = Math.floor(world.noise2D(this.pos.x / 24, this.pos.z / 24) * 8) + 11;
        if (this.pos.y < groundY + this.height) {
            this.pos.y = groundY + this.height;
            this.vel.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        if (this.keys['Space'] && this.onGround) {
            this.vel.y = 0.22;
        }

        this.camera.position.set(this.pos.x, this.pos.y - 0.2, this.pos.z);
    }
}