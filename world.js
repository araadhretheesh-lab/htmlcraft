import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.noise2D = createNoise2D();
        this.worldData = new Map();
        this.chunks = new Map();
        
        // Settings
        this.CHUNK_SIZE = 16;
        this.RENDER_DISTANCE = 3; 
        
        // Shared material to save memory
        this.material = new THREE.MeshStandardMaterial({ 
            color: 0x55aa55,
            roughness: 0.8,
            metalness: 0.1
        });
    }

    // Helper to safely get block data
    getBlock(x, y, z) {
        return this.worldData.get(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`);
    }

    update(playerX, playerZ) {
        const pCX = Math.floor(playerX / this.CHUNK_SIZE);
        const pCZ = Math.floor(playerZ / this.CHUNK_SIZE);

        // 1. Generate new chunks in range
        for (let x = -this.RENDER_DISTANCE; x <= this.RENDER_DISTANCE; x++) {
            for (let z = -this.RENDER_DISTANCE; z <= this.RENDER_DISTANCE; z++) {
                this.buildChunkMesh(pCX + x, pCZ + z);
            }
        }

        // 2. The "Freeze Fixer": Garbage Collection
        for (const [key, mesh] of this.chunks) {
            const [cx, cz] = key.split(',').map(Number);
            
            if (Math.abs(cx - pCX) > this.RENDER_DISTANCE || Math.abs(cz - pCZ) > this.RENDER_DISTANCE) {
                // Remove from Scene
                this.scene.remove(mesh);
                
                // CRITICAL: Clean up GPU memory
                mesh.geometry.dispose(); 
                
                // Remove the raw block data for this chunk to keep Map size small
                this.clearChunkData(cx, cz);
                
                // Delete from tracking map
                this.chunks.delete(key);
            }
        }
    }

    clearChunkData(cx, cz) {
        const startX = cx * this.CHUNK_SIZE;
        const startZ = cz * this.CHUNK_SIZE;
        for (let x = 0; x < this.CHUNK_SIZE; x++) {
            for (let z = 0; z < this.CHUNK_SIZE; z++) {
                for (let y = 0; y < 30; y++) {
                    this.worldData.delete(`${startX + x},${y},${startZ + z}`);
                }
            }
        }
    }

    buildChunkMesh(cx, cz) {
        const chunkKey = `${cx},${cz}`;
        if (this.chunks.has(chunkKey)) return;

        // 1. Generate Data for this chunk if missing
        for (let x = 0; x < this.CHUNK_SIZE; x++) {
            for (let z = 0; z < this.CHUNK_SIZE; z++) {
                const worldX = cx * this.CHUNK_SIZE + x;
                const worldZ = cz * this.CHUNK_SIZE + z;
                
                // Skip if data already exists
                if (this.worldData.has(`${worldX},10,${worldZ}`)) continue;

                const height = Math.floor(this.noise2D(worldX / 24, worldZ / 24) * 8) + 10;
                for (let y = 0; y <= height; y++) {
                    this.worldData.set(`${worldX},${y},${worldZ}`, 1);
                }
            }
        }

        // 2. Geometry Arrays
        const positions = [];
        const normals = [];
        const indices = [];
        let vertexCount = 0;

        // 3. Face Culling Loop
        for (let x = 0; x < this.CHUNK_SIZE; x++) {
            for (let z = 0; z < this.CHUNK_SIZE; z++) {
                const worldX = cx * this.CHUNK_SIZE + x;
                const worldZ = cz * this.CHUNK_SIZE + z;
                
                for (let y = 0; y < 30; y++) {
                    if (!this.getBlock(worldX, y, worldZ)) continue;

                    const neighbors = [
                        { dir: [0, 1, 0], n: [0, 1, 0], corners: [[0,1,1], [1,1,1], [0,1,0], [1,1,0]] }, // Top
                        { dir: [0, -1, 0], n: [0, -1, 0], corners: [[0,0,0], [1,0,0], [0,0,1], [1,0,1]] }, // Bottom
                        { dir: [1, 0, 0], n: [1, 0, 0], corners: [[1,0,1], [1,0,0], [1,1,1], [1,1,0]] }, // Right
                        { dir: [-1, 0, 0], n: [-1, 0, 0], corners: [[0,0,0], [0,0,1], [0,1,0], [0,1,1]] }, // Left
                        { dir: [0, 0, 1], n: [0, 0, 1], corners: [[0,0,1], [1,0,1], [0,1,1], [1,1,1]] }, // Front
                        { dir: [0, 0, -1], n: [0, 0, -1], corners: [[1,0,0], [0,0,0], [1,1,0], [0,1,0]] }, // Back
                    ];

                    for (const { dir, n, corners } of neighbors) {
                        const nx = worldX + dir[0];
                        const ny = y + dir[1];
                        const nz = worldZ + dir[2];

                        // ONLY add face if the neighbor is AIR
                        if (!this.getBlock(nx, ny, nz)) {
                            corners.forEach(c => {
                                positions.push(worldX + c[0], y + c[1], worldZ + c[2]);
                                normals.push(...n);
                            });
                            indices.push(
                                vertexCount, vertexCount + 1, vertexCount + 2, 
                                vertexCount + 2, vertexCount + 1, vertexCount + 3
                            );
                            vertexCount += 4;
                        }
                    }
                }
            }
        }

        // 4. Create BufferGeometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setIndex(indices);
        
        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);
        this.chunks.set(chunkKey, mesh);
    }
}