import * as THREE from "three";
import Environment from "./Environment";
import Experience from "./Experience";
import CubeTester from "./CubeTester";
import SceneModel from "./SceneModel";

export default class World {
    experience!: Experience;
    scene!: THREE.Scene;
    sceneModel: SceneModel;
    environment: Environment | undefined;
    cubeTester: CubeTester;

    constructor(experience: Experience) {
        this.experience = experience;
        this.scene = experience.scene.instance;
        this.environment = new Environment(this.scene);
        this.cubeTester = new CubeTester(this.scene);
        this.sceneModel = new SceneModel(this.experience);
    }

    update() {
        if(this.cubeTester) this.cubeTester.update();
    }
}