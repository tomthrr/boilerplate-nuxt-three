import * as THREE from "three";
import { GridHelper } from "three";

import Environment from "./Environment";
import Experience from "./Experience";
import CubeTester from "./CubeTester";
import SceneModel from "./SceneModel";
import WindLines from "./WindLines";
import { MediaPipeHands } from "./MediaPipeHands.js";
import MouseLines from "./MouseLines";

export default class World {
    experience!: Experience;
    scene!: THREE.Scene;
    sceneModel!: SceneModel;
    gridHelper: GridHelper;
    windLines: WindLines;
    cube: THREE.Mesh | undefined;
    environment: Environment | undefined;
    cubeTester!: CubeTester;
    clock!: THREE.Clock;
    hasCamera: boolean = false;
    mediaPiepeHands: any;
    lines!: MouseLines;
    cubeBox: THREE.Box3;
    cubeSphere: THREE.Sphere;


    constructor(experience: Experience) {
        this.experience = experience;
        this.scene = experience.scene.instance;
        this.environment = new Environment(this.scene);
        this.gridHelper = new GridHelper(100, 100);
        this.scene.add(this.gridHelper);
        this.scene.add(new THREE.AxesHelper(5));

        
        // Cube 
        this.cubeTester = new CubeTester(this.scene);
        this.cube = this.cubeTester.cube;
        this.cubeBox = new THREE.Box3();
        this.cubeSphere = new THREE.Sphere();

        // Windlines
        //this.windLines = new WindLines(this.scene, this.experience.camera.instance);
        this.lines = new MouseLines(this.scene, this.cube);

        // Camera setup 
        if (this.hasGetUserMedia()) {
            const enableWebcamButton = document.getElementById("webcamButton");
            if (!enableWebcamButton) {
                console.error("Webcam button not found");
                return;
            } else {
                console.log("Webcam button found");
            }
            enableWebcamButton.addEventListener("click", (e) => {
                if (this.hasCamera) return;
                e.preventDefault();
                this.hasCamera = true;

                const videoElement = document.getElementById("inputVideo");
                const canvasElement = document.getElementById("output_canvas");
                if (!videoElement || !(videoElement instanceof HTMLVideoElement)) {
                    console.error("Video element not found");
                    return;
                } else {
                    console.log("Video element found");
                }
                if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
                    console.error("Canvas element not found");
                    return;
                } else {
                    console.log("Canvas element found");
                }
                this.mediaPiepeHands = new MediaPipeHands(videoElement, canvasElement, (results) => {
                    if (results.landmarks.length > 0) {
                        const hand = results.landmarks[0];
                        const indexTip = hand[8];

                        // smooth movement
                        // if (this.cube) {
                        //     const lerp = (start: number, end: number, alpha: number) => start + (end - start) * alpha;

                        //     this.cube.position.x = lerp(this.cube.position.x, targetX, 0.1);
                        //     this.cube.position.y = lerp(this.cube.position.y, targetY, 0.1);
                        //     this.cube.position.z = lerp(this.cube.position.z, targetZ, 0.1);
                        // } 
                        // if (this.windLines) {
                        //     this.windLines.setTargetFromHand(results.landmarks);
                        // }
                        if (this.lines) {
                            this.lines.setTargetFromHand(results.landmarks);
                        }
                    }
                });
                this.mediaPiepeHands.start();
                enableWebcamButton.remove();
            });
        } else {
            console.warn("getUserMedia() is not supported by your browser");
        }

        this.clock = new THREE.Clock()
        //this.sceneModel = new SceneModel(this.experience);
    }

    hasGetUserMedia() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }


    update(deltaTime: number) {
        const elapsedTime = this.clock.getElapsedTime();
        
        if (this.cubeTester) this.cubeTester.update();
        if (this.windLines) this.windLines.update(elapsedTime);
        if (this.lines) this.lines.update(elapsedTime);


        if (this.lines && this.cube) {
            this.cubeBox.setFromObject(this.cube);
            this.cubeBox.getBoundingSphere(this.cubeSphere);

            this.lines.checkCollision(this.cubeBox, this.cubeSphere);
        }
    }
}