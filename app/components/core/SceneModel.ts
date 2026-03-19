import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import Experience from "./Experience";
import Sizes from "~/utils/Sizes";
import Loaders from "~/utils/Loaders";
import Debug from "./Debug";

export default class SceneModel {
    loaders: Loaders;
    experience: Experience;
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    sizes: Sizes;
    debug: Debug;
    displacementMaterials: Array<THREE.MeshStandardMaterial | THREE.MeshPhongMaterial>;

    constructor(experience: Experience) {
        this.loaders = new Loaders();
        this.experience = experience;
        this.debug = new Debug();
        this.scene = experience.scene!.instance;
        this.sizes = experience.sizes;
        this.camera = experience.camera!.instance;
        this.displacementMaterials = [];

        this.loadSceneModel();
        this.addDisplacementDebug();
    }

    addDisplacementDebug() {
        const debugFolder = this.debug.gui.addFolder("Displacement");

        const params = {
            scale: this.displacementMaterials[0]?.displacementScale ?? 14,
            bias: this.displacementMaterials[0]?.displacementBias ?? -7,
        };

        debugFolder
            .add(params, "scale")
            .min(-30)
            .max(30)
            .step(0.1)
            .name("Scale")
            .onChange((value: number) => {
                this.displacementMaterials.forEach((material) => {
                    material.displacementScale = value;
                    material.needsUpdate = true;
                });
            });

        debugFolder
            .add(params, "bias")
            .min(-20)
            .max(20)
            .step(0.1)
            .name("Bias")
            .onChange((value: number) => {
                this.displacementMaterials.forEach((material) => {
                    material.displacementBias = value;
                    material.needsUpdate = true;
                });
            });
    }

    loadSceneModel() {
        this.loaders?.loadModel('./models/desert.glb').then((scene: unknown) => {
            const gltf = scene as GLTF;

            const loadedObject = gltf.scene.getObjectByName("Plane");
            const blenderCamera = gltf.scene.getObjectByName("Camera");

            if (!loadedObject) {
                console.log("GLB File not find.");
                return;
            }

            // SCENE
            if (loadedObject) {
                
                const textureLoader = new THREE.TextureLoader();
                const displacementMap = textureLoader.load('/textures/displace.png');

                const mesh = loadedObject as THREE.Mesh;
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

                this.displacementMaterials = materials.filter(
                    (material): material is THREE.MeshStandardMaterial | THREE.MeshPhongMaterial =>
                        material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhongMaterial
                );
                
                displacementMap.colorSpace = THREE.NoColorSpace;
                displacementMap.minFilter = THREE.LinearFilter;
                displacementMap.magFilter = THREE.LinearFilter;

                
                this.displacementMaterials.forEach((material) => {
                    material.displacementMap = displacementMap;
                    material.displacementScale = 14.0;
                    material.displacementBias = -7.0;
                    material.needsUpdate = true;
                });

                displacementMap.flipY = false;
                displacementMap.colorSpace = THREE.NoColorSpace;

                //loadedObject.material.map = displacementMap;

                
                this.scene.add(loadedObject);
            }

            // CAMERA SETUP
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
            }

        })
    }
}