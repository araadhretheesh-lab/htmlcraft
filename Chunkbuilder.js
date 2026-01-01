import * as THREE from 'three';

export class ChunkBuilder {
    constructor(generator, material) {
        this.generator = generator;
        this.material = material;
        this.CHUNK_SIZE = 16;
    }

    build(cx, cz) {
        const positions = [];
        const normals = [];
        const indices = [];
        let vCount = 0;

        for (let x = 0; x < this.CHUNK_SIZE; x++) {
            for (let z = 0; z < this.CHUNK_SIZE; z++) {
                const wX = cx * this.CHUNK_SIZE + x;
                const wZ = cz * this.CHUNK_SIZE + z;
                const h = this.generator.getHeight(wX, wZ);

                for (let y = 0; y <= h; y++) {
                    const neighbors = [[0,1,0], [0,-1,0], [1,0,0], [-1,0,0], [0,0,1], [0,0,-1]];
                    const corners = [
                        [[0,1,1], [1,1,1], [0,1,0], [1,1,0]], [[0,0,0], [1,0,0], [0,0,1], [1,0,1]],
                        [[1,0,1], [1,0,0], [1,1,1], [1,1,0]], [[0,0,0], [0,0,1], [0,1,0], [0,1,1]],
                        [[0,0,1], [1,0,1], [0,1,1], [1,1,1]], [[1,0,0], [0,0,0], [1,1,0], [0,1,0]]
                    ];

                    for (let i = 0; i < 6; i++) {
                        const ny = y + neighbors[i][1];
                        if (ny > this.generator.getHeight(wX + neighbors[i][0], wZ + neighbors[i][2]) || ny < 0) {
                            corners[i].forEach(c => {
                                positions.push(wX + c[0], y + c[1], wZ + c[2]);
                                normals.push(...neighbors[i]);
                            });
                            indices.push(vCount, vCount+1, vCount+2, vCount+2, vCount+1, vCount+3);
                            vCount += 4;
                        }
                    }
                }
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geo.setIndex(indices);
        
        return new THREE.Mesh(geo, this.material);
    }
}