import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator.js';
import { ChunkBuilder } from './ChunkBuilder.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        
        // Modules
        this.generator = new TerrainGenerator();
        this.builder = new ChunkBuilder(this.generator, new THREE.MeshStandardMaterial({ color: 0x55aa55 }));
        
        // Data Tracking
        this.chunks = new Map();
        this.CHUNK_SIZE = 16;
        this.SUPER_CHUNK_SIZE = 480;
        this.activeSuperChunkTag = "";
        this.renderDistance = 4;
    }

    update(playerX, playerZ) {
        // 1. Super-Chunk Tagging
        const scX = Math.floor(playerX / this.SUPER_CHUNK_SIZE);
        const scZ = Math.floor(playerZ / this.SUPER_CHUNK_SIZE);
        const currentTag = `SC_${scX}_${scZ}`;

        if (this.activeSuperChunkTag !== currentTag) {
            this.handleSuperChunkTransition(currentTag);
        }

        // 2. Generate/Render nearby chunks
        const pCX = Math.floor(playerX / this.CHUNK_SIZE);
        const pCZ = Math.floor(playerZ / this.CHUNK_SIZE);

        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                const cx = pCX + x;
                const cz = pCZ + z;
                const key = `${cx},${cz}`;

                if (!this.chunks.has(key)) {
                    const mesh = this.builder.build(cx, cz);
                    mesh.name = currentTag; // Tag it
                    this.scene.add(mesh);
                    this.chunks.set(key, mesh);
                }
            }
        }

        this.cleanup(pCX, pCZ);
    }

    handleSuperChunkTransition(newTag) {
        console.log(`Entering New Territory: ${newTag}`);
        this.activeSuperChunkTag = newTag;
        // Optimization: You could clear non-matching tags here to save RAM
    }

    cleanup(pCX, pCZ) {
        const limit = this.renderDistance + 2;
        for (const [key, mesh] of this.chunks) {
            const [cx, cz] = key.split(',').map(Number);
            if (Math.abs(cx - pCX) > limit || Math.abs(cz - pCZ) > limit) {
                mesh.geometry.dispose();
                this.scene.remove(mesh);
                this.chunks.delete(key);
            }
        }
    }
}