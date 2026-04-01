import * as THREE from 'three';
import { MeshLine, MeshLineMaterial } from 'three.meshline';
import Debug from './Debug';

const CONFIG = {
    NUM_TRAILS: 6,
    TRAIL_LEN: 80,
    trailColors: [
        0x4488ff,
        0xaa44ff,
        0x44ffcc,
        0xff44aa,
        0xffcc44
    ]
};

export default class MouseLines {
    debug: Debug;
    scene: THREE.Scene;
    trails: any[];
    target3D: THREE.Vector3;
    elapsedTime: number;
    collisionPoint: THREE.Mesh;

    constructor(scene: THREE.Scene, collisionPoint: THREE.Mesh) {
        this.scene = scene;
        this.debug = new Debug();
        this.trails = [];
        this.target3D = new THREE.Vector3();
        this.elapsedTime = 0;
        this.collisionPoint = collisionPoint;
        console.log("CUBE collisionPoint:", this.collisionPoint);
        this.createLines();
    }

    createLines() {
        for (let t = 0; t < CONFIG.NUM_TRAILS; t++) {
            const points: THREE.Vector3[] = Array(CONFIG.TRAIL_LEN).fill(0).map(() => new THREE.Vector3());

            const meshLine = new MeshLine();
            meshLine.setPoints(points.map(p => p.clone()));

            const mat = new MeshLineMaterial({
                color: CONFIG.trailColors[t % CONFIG.trailColors.length],
                lineWidth: 0.2 + Math.random() * 0.3,
                sizeAttenuation: 1,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending,
                dashArray: 0, // pas de dash
            });

            const mesh = new THREE.Mesh(meshLine, mat);
            this.scene.add(mesh);

            this.trails.push({
                mesh,
                meshLine,
                material: mat,
                points,
                offset: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.6,
                    0.5 + Math.random() * 1.5,
                    (Math.random() - 0.5) * 0.6
                ),
                phase: Math.random() * Math.PI * 2,
                speed: 0.8 + Math.random() * 0.6,
                smoothedTarget: new THREE.Vector3(),
            });
        }
    }

    public setTargetFromHand(handLandmarks: number[][]) {
        if (!handLandmarks || handLandmarks.length === 0) return;

        const indexTip = handLandmarks[0][8];
        const targetX = (indexTip.x - 0.5) * -10;
        const targetY = (0.5 - indexTip.y) * 10;
        const targetZ = -indexTip.z * 10;

        this.target3D.set(targetX, targetY, targetZ);
    }

    // Check collision between trails and cube
    checkCollision(cubeBox: THREE.Box3, cubeSphere: THREE.Sphere) {
        const MAX_POINTS_TO_CHECK = 4;
        let hit = false;

        for (let t = 0; t < this.trails.length; t++) {
            const tr = this.trails[t];

            for (let i = 0; i < MAX_POINTS_TO_CHECK; i++) {
                const p = tr.points[i];
                if (!p) break;

                // 🔹 1. Sphere check (ultra rapide)
                if (!cubeSphere.containsPoint(p)) continue;

                // 🔹 box check (precise)
                if (cubeBox.containsPoint(p)) {
                    hit = true;
                    break;
                }
            }

            if (hit) break;
        }

        const mat = this.collisionPoint.material as THREE.MeshStandardMaterial;
        if (hit) {
            mat.color.set(0xff0000); // rouge collision
        } else {
            mat.color.set(0x00ff00); // couleur normale
        }
    }

    update(_elapsedTime: number) {
        const t = _elapsedTime;
        this.elapsedTime = t;

        this.trails.forEach((tr) => {
            tr.smoothedTarget.lerp(this.target3D, 0.07);

            tr.points.unshift(this.getWavePoint(tr, t));
            if (tr.points.length > CONFIG.TRAIL_LEN) tr.points.pop();

            // largeur variable pour effet cartoon
            tr.meshLine.setPoints(tr.points.map((p, idx) => p.clone()), (p) => {
                const edge = 0.1;
                if (p < edge) return THREE.MathUtils.lerp(0.05, tr.material.lineWidth, p / edge);
                if (p > 1 - edge) return THREE.MathUtils.lerp(0.05, tr.material.lineWidth, (1 - p) / edge);
                return tr.material.lineWidth;
            });
        });
    }

    /** Calcul d’un point avec ondulation style cartoon */
    private getWavePoint(tr: any, t: number) {
        const idx = tr.points.length;
        const wave = new THREE.Vector3(
            Math.sin(t * tr.speed + tr.phase + idx * 0.2) * 0.5,
            Math.cos(t * tr.speed * 1.3 + tr.phase + idx * 0.15) * 0.5,
            Math.sin(t * tr.speed * 0.7 + tr.phase + idx * 0.1) * 0.3
        );
        return new THREE.Vector3().copy(tr.smoothedTarget).add(tr.offset).add(wave);
    }

    dispose() {
        this.trails.forEach((tr) => {
            this.scene.remove(tr.mesh);
            tr.mesh.geometry.dispose();
            tr.mesh.material.dispose();
        });
        this.trails = [];
    }
}