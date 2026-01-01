import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.noise2D = createNoise2D();
        this.worldData = new Map();
        this.chunks = new Map();
        this.CHUNK_SIZE = 16;
        this.material = new THREE.MeshStandardMaterial({ color: 0x55aa55 });
    }

    getBlock(x, y, z) {
        return this.worldData.get(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`);
    }

    generateChunk(cx, cz) {
        const positions = [];
        const normals = [];
        const indices = [];
        let vertexCount = 0;

        // Generate Data
        for (let x = 0; x < this.CHUNK_SIZE; x++) {
            for (let z = 0; z < this.CHUNK_SIZE; z++) {
                const worldX = cx * this.CHUNK_SIZE + x;
                const worldZ = cz * this.CHUNK_SIZE + z;
                const height = Math.floor(this.noise2D(worldX / 24, worldZ / 24) * 8) + 10;
                for (let y = 0; y <= height; y++) {
                    this.worldData.set(`${worldX},${y},${worldZ}`, 1);
                }
            }
        }

        // Generate Mesh (Face Culling)
        for (let x = 0; x < this.CHUNK_SIZE; x++) {
            for (let z = 0; z < this.CHUNK_SIZE; z++) {
                const worldX = cx * this.CHUNK_SIZE + x;
                const worldZ = cz * this.CHUNK_SIZE + z;
                for (let y = 0; y < 25; y++) {
                    if (!this.getBlock(worldX, y, worldZ)) continue;
                    
                    const neighbors = [
                        { dir: [0, 1, 0], n: [0, 1, 0], corners: [[0,1,1], [1,1,1], [0,1,0], [1,1,0]] }, 
                        { dir: [0, -1, 0], n: [0, -1, 0], corners: [[0,0,0], [1,0,0], [0,0,1], [1,0,1]] },
                        { dir: [1, 0, 0], n: [1, 0, 0], corners: [[1,0,1], [1,0,0], [1,1,1], [1,1,0]] },
                        { dir: [-1, 0, 0], n: [-1, 0, 0], corners: [[0,0,0], [0,0,1], [0,1,0], [0,1,1]] },
                        { dir: [0, 0, 1], n: [0, 0, 1], corners: [[0,0,1], [1,0,1], [0,1,1], [1,1,1]] },
                        { dir: [0, 0, -1], n: [0, 0, -1], corners: [[1,0,0], [0,0,0], [1,1,0], [0,1,0]] },
                    ];

                    for (const { dir, n, corners } of neighbors) {
                        if (!this.getBlock(worldX + dir[0], y + dir[1], worldZ + dir[2])) {
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
        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);
        this.chunks.set(`${cx},${cz}`, mesh);
    }
}