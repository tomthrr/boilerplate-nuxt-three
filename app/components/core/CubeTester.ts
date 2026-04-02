import * as THREE from 'three';
import Debug from './Debug';
import fragmentShader from '~/shaders/erosion_vent/fragment.glsl?raw';
import vertexShader from '~/shaders/erosion_vent/vertex.glsl?raw';

export default class CubeTester {
    mesh!: THREE.Mesh;
    loader: THREE.TextureLoader;
    debug: Debug;
    scene: THREE.Scene;
    cube!: THREE.Mesh;
    size: Sizes
    clock: THREE.Clock;
    debugObjects: { [key: string]: any };
    debugOptions: { [key: string]: any };

    constructor(scene: THREE.Scene) {
        this.loader = new THREE.TextureLoader();
        this.scene = scene;
        this.size = new Sizes();
        this.debug = new Debug();
        this.debugObjects = {};
        
        this.debugOptions = {
            u_scale: { value: .1 },
            u_strength: { value: 1.2 },
            u_frequency: { value: 1.4 },
            u_base: { value: new THREE.Color("#ebebeb") },
            u_eroded: { value: new THREE.Color("#cacbcd") }
        }
        this.createCube();
        this.clock = new THREE.Clock()

        if (this.debug.active) {
            this.addDebug();
        }
    }

    createCube() {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            //new THREE.PlaneGeometry(5, 5, 256, 256),
            //new THREE.TorusKnotGeometry(3, 1, 1024, 256),
            new THREE.MeshStandardMaterial({ color: "white", side: THREE.DoubleSide })
            // new THREE.ShaderMaterial({
            //     uniforms: {
            //         u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            //         uTime: { value: 0 },
            //         u_scale: { value: this.debugOptions.u_scale.value },
            //         u_strength: { value: this.debugOptions.u_strength.value },
            //         u_frequency: { value: this.debugOptions.u_frequency.value },
            //         u_base: { value: this.debugOptions.u_base.value },
            //         u_eroded: { value: this.debugOptions.u_eroded.value },
            //     },
            //     vertexShader: vertexShader,
            //     fragmentShader: fragmentShader,
            //     side: THREE.DoubleSide,
            // })
        );

        box.position.set(0, 2, 0);
        this.cube = box;

        this.scene.add(this.cube);
    }

    addDebug() {
        this.debug.gui.addFolder("Cube Shader");
        this.debug.gui.add(this.debugOptions.u_scale, "value", 0.1, 5, 0.1).name("Scale").onChange((value) => {
            if (this.cube.material instanceof THREE.ShaderMaterial) {
                this.cube.material.uniforms.u_scale.value = value;
            }
        });
        this.debug.gui.add(this.debugOptions.u_strength, "value", 0.1, 10, 0.1).name("Strength").onChange((value) => {
            if (this.cube.material instanceof THREE.ShaderMaterial) {
                this.cube.material.uniforms.u_strength.value = value;
            }
        });
        this.debug.gui.add(this.debugOptions.u_frequency, "value", 0.1, 20, 0.1).name("Frequency").onChange((value) => {
            if (this.cube.material instanceof THREE.ShaderMaterial) {
                this.cube.material.uniforms.u_frequency.value = value;
            }
        });

        this.debug.gui.addColor(this.debugOptions.u_base, "value").name("Base Color").onChange((value) => {
            if (this.cube.material instanceof THREE.ShaderMaterial) {
                this.cube.material.uniforms.u_base.value = new THREE.Color(value);
            }
        });

        this.debug.gui.addColor(this.debugOptions.u_eroded, "value").name("Eroded Color").onChange((value) => {
            if (this.cube.material instanceof THREE.ShaderMaterial) {
                this.cube.material.uniforms.u_eroded.value = new THREE.Color(value);
            }
        });
    }

    update() {
        const elapsedTime = this.clock.getElapsedTime();
        if (this.cube && this.cube.material instanceof THREE.ShaderMaterial) {
            const uTime = this.cube.material.uniforms.uTime;
            if (uTime) uTime.value = elapsedTime;
        }
        // this.mesh.rotation.x += 0.01;
        //this.mesh.rotation.y += 0.015;
    }

    dispose(scene: THREE.Scene) {
        scene.remove(this.cube);
        this.cube.geometry.dispose();
        if (Array.isArray((this.cube.material as THREE.Material).dispose)) {
            // no-op
        } else {
            (this.cube.material as THREE.Material).dispose();
        }
    }
}
