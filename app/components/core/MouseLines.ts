import * as THREE from 'three';
import Debug from './Debug';

const CONFIG = {
    NUM_TRAILS: 5,
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
    mesh: THREE.Mesh;
    loader: THREE.TextureLoader;
    debug: Debug;
    scene: THREE.Scene;
    trails: any[];
    target3D: THREE.Vector3;
    elapsedTime: number;

    constructor(scene: THREE.Scene) {
        this.loader = new THREE.TextureLoader();
        this.scene = scene;
        this.debug = new Debug();
        this.trails = [];
        this.target3D = new THREE.Vector3();
        this.elapsedTime = 0;

        this.createLines();
    }

    createLines() {
        for (let t = 0; t < CONFIG.NUM_TRAILS; t++) {
            const positions = new Float32Array(CONFIG.TRAIL_LEN * 3);
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setDrawRange(0, 0);

            const mat = new THREE.LineBasicMaterial({
                color: CONFIG.trailColors[t],
                transparent: true,
                opacity: 0.85 - t * 0.1,
            });

            const line = new THREE.Line(geo, mat);
            this.scene.add(line);

            this.trails.push({
                line,
                positions,
                points: [],
                offset: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.6,
                    0.5 + Math.random() * 1.5, // hauteur au-dessus du sol
                    (Math.random() - 0.5) * 0.6
                ),
                phase: Math.random() * Math.PI * 2,
                speed: 0.8 + Math.random() * 0.6,
                smoothedTarget: new THREE.Vector3(),
            });
        }
    }

    /** Met à jour la cible depuis la main */
    public setTargetFromHand(handLandmarks: number[][]) {
        if (!handLandmarks || handLandmarks.length === 0) return;

        // Récupérer le bout de l’index
        const indexTip = handLandmarks[0][8];

        // Map x,y,z de la main → espace 3D
        const targetX = (indexTip.x - 0.5) * -10;  // inverser X pour correspondre à la vue
        const targetY = (0.5 - indexTip.y) * 10;   // inverser Y (haut en +Y)
        const targetZ = -indexTip.z * 10;          // profondeur négative vers l’avant

        this.target3D.set(targetX, targetY, targetZ);
    }

    /** Update à chaque frame */
    update(_elapsedTime: number) {
        const t = _elapsedTime;
        this.elapsedTime = t;

        this.trails.forEach((tr) => {
            // Suivi smooth de la cible
            tr.smoothedTarget.lerp(this.target3D, 0.07);

            // Ajouter un petit mouvement fluide
            const wave = new THREE.Vector3(
                Math.sin(t * tr.speed + tr.phase) * 0.3,
                Math.cos(t * tr.speed * 1.3 + tr.phase) * 0.3,
                Math.sin(t * tr.speed * 0.7 + tr.phase + 1.2) * 0.4
            );

            const pos = new THREE.Vector3().copy(tr.smoothedTarget).add(tr.offset).add(wave);
            tr.points.unshift(pos.clone());

            if (tr.points.length > CONFIG.TRAIL_LEN) tr.points.pop();

            // Update du geometry
            const arr = tr.line.geometry.attributes.position.array;
            tr.points.forEach((p, idx) => {
                arr[idx * 3] = p.x;
                arr[idx * 3 + 1] = p.y;
                arr[idx * 3 + 2] = p.z;
            });

            tr.line.geometry.setDrawRange(0, tr.points.length);
            tr.line.geometry.attributes.position.needsUpdate = true;
        });
    }

    /** Supprime les trails de la scène */
    dispose() {
        this.trails.forEach((tr) => {
            this.scene.remove(tr.line);
            tr.line.geometry.dispose();
            tr.line.material.dispose();
        });
        this.trails = [];
    }
}