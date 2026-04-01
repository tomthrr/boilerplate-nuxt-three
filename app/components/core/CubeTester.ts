import * as THREE from 'three';
import Debug from './Debug';

export default class CubeTester {
    mesh: THREE.Mesh;
    loader: THREE.TextureLoader;
    debug: Debug;
    scene: THREE.Scene;
    debugObjects: { [key: string]: any };

    constructor(scene: THREE.Scene) {
        this.loader = new THREE.TextureLoader();
        this.scene = scene;
        this.debug = new Debug();
        this.debugObjects = {};
        
        this.createCube();
    }

    createCube() {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: "white", side: THREE.DoubleSide })
        );

        box.position.set(0, 2, 0);

        this.scene.add(box);
    }

    addDebug() {
        this.debug.gui
            .add(this.debugObjects['uScale'], 'value')
            .min(1)
            .max(10)
            .step(1)
            .name('uScale');

        this.debug.gui
            .add(this.debugObjects['uColorLevels'], 'value')
            .min(1)
            .max(10)
            .step(1)
            .name('uColorLevels');
    }

    update() {
        // this.mesh.rotation.x += 0.01;
        //this.mesh.rotation.y += 0.015;
    }

    dispose(scene: THREE.Scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        if (Array.isArray((this.mesh.material as THREE.Material).dispose)) {
            // no-op
        } else {
            (this.mesh.material as THREE.Material).dispose();
        }
    }
}
