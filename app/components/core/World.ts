import * as THREE from "three";
import Environment from "./Environment";
import Experience from "./Experience";
import CubeTester from "./CubeTester";
import SceneModel from "./SceneModel";
import { GridHelper } from "three";
import WindLines from "./WindLines";

export default class World {
    experience!: Experience;
    scene!: THREE.Scene;
    sceneModel!: SceneModel;
    gridHelper: GridHelper;
    windLines: WindLines;
    environment: Environment | undefined;
    cubeTester!: CubeTester;
    clock!: THREE.Clock;


    constructor(experience: Experience) {
        this.experience = experience;
        this.scene = experience.scene.instance;
        this.environment = new Environment(this.scene);
        this.gridHelper = new GridHelper(10, 10);
        this.scene.add(this.gridHelper);

        
        //this.cubeTester = new CubeTester(this.scene);

        this.windLines = new WindLines(this.scene, this.experience.camera.instance);
        this.clock = new THREE.Clock()
        this.sceneModel = new SceneModel(this.experience);
    }

    update(deltaTime: number) {
        const elapsedTime = this.clock.getElapsedTime();
        if(this.cubeTester) this.cubeTester.update();
        if(this.windLines) this.windLines.update(elapsedTime);
    }
}