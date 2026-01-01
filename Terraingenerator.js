import { createNoise2D } from 'simplex-noise';

export class TerrainGenerator {
    constructor(seed) {
        this.noise2D = createNoise2D(); // You can pass a seed function here if needed
    }

    getHeight(x, z) {
        const absX = Math.abs(x);
        const absZ = Math.abs(z);
        const dist = absX + absZ;

        let freq = 64;
        let amp = 10;

        // Far Lands Distortion Logic
        if (dist > 100000) { 
            freq = 64 / (dist * 0.00001);
            amp = 10 + (dist * 0.001);
        }

        return Math.floor(this.noise2D(x / freq, z / freq) * amp) + 10;
    }
}