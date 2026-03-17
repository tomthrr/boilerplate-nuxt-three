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

        this.loadSceneModel();
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