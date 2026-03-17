import * as THREE from 'three';
import {vertexShader, fragmentShader} from "~/shaders/toon/ToonShader";

export default class CubeTester {
    mesh: THREE.Mesh;

    constructor(scene: THREE.Scene) {
        const geometry = new THREE.TorusKnotGeometry( 10, 3, 100, 16 );
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                'uDirLightPos': { value: new THREE.Vector3(15, 15, 15) },
                'uDirLightColor': { value: new THREE.Color( 0xeeeeee ).convertLinearToSRGB() },

                'uAmbientLightColor': { value: new THREE.Color( 0x050505 ).convertLinearToSRGB() },
                'uBaseColor': { value: new THREE.Color( 0xeeeeee ).convertLinearToSRGB() },
                'uLineColor1': { value: new THREE.Color( 0x808080 ).convertLinearToSRGB() },
                'uLineColor2': { value: new THREE.Color( 0x000000 ).convertLinearToSRGB() },
                'uLineColor3': { value: new THREE.Color( 0x000000 ).convertLinearToSRGB() },
                'uLineColor4': { value: new THREE.Color( 0x000000 ).convertLinearToSRGB() }
            }
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        this.mesh.position.set(0, 0, -100);

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
