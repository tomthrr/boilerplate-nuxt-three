import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import Experience from "./Experience";
import Sizes from "~/utils/Sizes";
import Loaders from "~/utils/Loaders";
import Debug from "./Debug";

export default class Statue {
    loaders: Loaders;
    experience: Experience;
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    sizes: Sizes;
    debug: Debug;
    instance!: THREE.Group;
    displacementMaterials: Array<THREE.MeshStandardMaterial | THREE.MeshPhongMaterial>;
    private readyCallbacks: Array<(group: THREE.Group) => void> = [];
    private collisionActive: boolean = false;
    private collisionOriginalColors: Array<{ material: THREE.Material; color: THREE.Color }> = [];

    constructor(experience: Experience) {
        this.loaders = new Loaders();
        this.experience = experience;
        this.debug = new Debug();
        this.scene = experience.scene!.instance;
        this.sizes = experience.sizes;
        this.camera = experience.camera!.instance;
        this.displacementMaterials = [];
        this.loadSceneModel();
    }

    onReady(callback: (group: THREE.Group) => void) {
        if (this.instance) {
            callback(this.instance);
            return;
        }
        this.readyCallbacks.push(callback);
    }

    setCollisionActive(active: boolean) {
        if (this.collisionActive === active) return;
        this.collisionActive = active;

        if (!this.instance) return;

        if (this.collisionOriginalColors.length === 0) {
            this.instance.traverse((obj) => {
                const mesh = obj as THREE.Mesh;
                if (!mesh.isMesh) return;

                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                for (const material of materials) {
                    const matAny: any = material;
                    if (matAny?.color) {
                        this.collisionOriginalColors.push({
                            material,
                            color: matAny.color.clone()
                        });
                    }
                }
            });
        }

        for (const entry of this.collisionOriginalColors) {
            const matAny: any = entry.material;
            if (!matAny?.color) continue;
            if (active) {
                matAny.color.set(0xff3333);
            } else {
                matAny.color.copy(entry.color);
            }
        }
    }

    loadSceneModel() {
        this.loaders?.loadModel('./models/Nedaura_statue.glb').then((scene: unknown) => {
            const gltf = scene as GLTF;

            const loadedObject = gltf.scene;
            if (!loadedObject) {
                console.log("GLB File not find.");
                return;
            } else {
                console.log("GLB File loaded successfully.");
                loadedObject.scale.set(0.5, 0.5, 0.5);
                this.experience.camera!.instance.lookAt(loadedObject.position);
                this.instance = loadedObject;
                this.scene.add(loadedObject);

                const callbacks = this.readyCallbacks;
                this.readyCallbacks = [];
                for (const cb of callbacks) cb(loadedObject);
            }
        })
    }
}