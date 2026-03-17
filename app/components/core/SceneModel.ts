import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import Experience from "./Experience";
import Sizes from "~/utils/Sizes";

export default class SceneModel {
    loaders: Loaders;
    experience: Experience;
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    sizes: Sizes;

    constructor(experience: Experience) {
        this.loaders = new Loaders();
        this.experience = experience;
        this.scene = experience.scene!.instance;
        this.sizes = experience.sizes;
        this.camera = experience.camera!.instance;

        //this.loadSceneModel();
        this.loadSpaceShipModel();
    }

    loadSpaceShipModel() {
    this.loaders?.loadModel('./models/spaceship-optimized.glb').then((model: unknown) => {
        const gltf = model as GLTF;

        const alphaFix = (material: THREE.Material) => {
            const mat = material as THREE.MeshStandardMaterial;
            mat.transparent = true;
            mat.alphaToCoverage = true;
            mat.depthFunc = THREE.LessEqualDepth;
            mat.depthTest = true;
            mat.depthWrite = true;
        };
        console.log("GLTF Materials:", gltf);
        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(alphaFix);
                }
                else {
                    alphaFix(child.material);
                }
            }
        });
                    

        // Transforms équivalentes à l'exemple (scale 0.005 + position/rotation)
        gltf.scene.rotation.set(Math.PI * 0.05, Math.PI * 0.4, 0);
        gltf.scene.position.set(1.583, 0, -3.725);

        // Ajoute une lumière directionnelle comme dans l'exemple
        const light = new THREE.DirectionalLight(0xffffff, 25.0);
        light.position.set(5, 10, 5.95);
        gltf.scene.add(light);

        this.scene.add(gltf.scene);
    });
}

    loadSceneModel() {
        this.loaders?.loadModel('./models/scene.glb').then((scene: unknown) => {
            const gltf = scene as GLTF;
            console.log(gltf)

            const loadedObject = gltf.scene.getObjectByName("Plane");
            const blenderCamera = gltf.scene.getObjectByName("Camera");

            if (!loadedObject) {
                console.log("GLB File not find.");
                return;
            }

            if (blenderCamera && this.scene && this.camera && this.sizes) {
                const cube = new THREE.Mesh(
                    new THREE.BoxGeometry(0.01, 0.01, 0.01),
                    new THREE.MeshBasicMaterial({ color: "#ff0000" })
                );
                this.scene.add(cube);

                cube.position.copy(blenderCamera.position);
                cube.position.z -= 200;
                cube.position.y += 25;

                this.camera.position.copy(blenderCamera.position);
                this.camera.position.y += 1;

                // Add pivot
                const pivot = new THREE.Object3D();
                pivot.name = "cameraPivot";
                pivot.rotation.set(0, 0, 0);

                pivot.add(this.camera);
                this.scene.add(pivot);
                this.camera.userData.pivot = pivot;


                this.camera.lookAt(cube.position);
                this.camera.updateProjectionMatrix();
                this.camera.aspect = this.sizes.width / this.sizes.height;
                this.camera.lookAt(cube.position);

                this.scene.add(loadedObject);
            }

        })
    }
}