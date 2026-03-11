import * as THREE from 'three';

export default class CubeTester {
    mesh: THREE.Mesh;

    constructor(scene: THREE.Scene) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xff5533 });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 2, -2);

        scene.add(this.mesh);
    }

    update() {
        this.mesh.rotation.x += 0.01;
        this.mesh.rotation.y += 0.015;
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
