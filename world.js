import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator.js';
import { ChunkBuilder } from './ChunkBuilder.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.generator = new TerrainGenerator();
        this.builder = new ChunkBuilder(this.generator, new THREE.MeshStandardMaterial({ color: 0x55aa55 }));
        
        this.chunks = new Map();
        this.SUPER_CHUNK_SIZE = 480;
        this.activeSuperChunkTag = "";
    }

    update(playerX, playerZ) {
        // 1. Tagging System for Super-Chunks
        const scX = Math.floor(playerX / this.SUPER_CHUNK_SIZE);
        const scZ = Math.floor(playerZ / this.SUPER_CHUNK_SIZE);
        const currentTag = `SC_${scX}_${scZ}`;

        if (this.activeSuperChunkTag !== currentTag) {
            this.handleSuperChunkTransition(currentTag);
        }

        // 2. Standard Chunk Rendering
        const pCX = Math.floor(playerX / 16);
        const pCZ = Math.floor(playerZ / 16);
        const range = 3;

        for (let x = -range; x <= range; x++) {
            for (let z = -range; z <= range; z++) {
                const key = `${pCX + x},${pCZ + z}`;
                if (!this.chunks.has(key)) {
                    const mesh = this.builder.build(pCX + x, pCZ + z);
                    mesh.name = currentTag; // Tag the mesh with the Super-Chunk ID
                    this.scene.add(mesh);
                    this.chunks.set(key, mesh);
                }
            }
        }

        // 3. Cleanup based on distance
        this.cleanup(pCX, pCZ, range);
    }

    handleSuperChunkTransition(newTag) {
        console.log(`Swapping to ${newTag}`);
        this.activeSuperChunkTag = newTag;
        // Optionally: wipe data that doesn't match the new tag to save RAM
    }

    cleanup(pCX, pCZ, range) {
        for (const [key, mesh] of this.chunks) {
            const [cx, cz] = key.split(',').map(Number);
            if (Math.abs(cx - pCX) > range + 1 || Math.abs(cz - pCZ) > range + 1) {
                mesh.geometry.dispose();
                this.scene.remove(mesh);
                this.chunks.delete(key);
            }
        }
    }
}