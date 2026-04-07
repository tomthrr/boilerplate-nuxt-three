import * as THREE from "three";
import { GridHelper } from "three";

import Environment from "./Environment";
import Experience from "./Experience";
import CubeTester from "./CubeTester";
import SceneModel from "./SceneModel";
import WindLines from "./WindLines";
import { MediaPipeHands } from "./MediaPipeHands.js";
import MouseLines from "./MouseLines";
import Statue from "./Statue";

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
    statue!: Statue;
    cubeBox: THREE.Box3;
    cubeSphere: THREE.Sphere;
    statueBox: THREE.Box3;
    statueSphere: THREE.Sphere;
    private statueBoundsReady: boolean = false;
    private lastStatueHit: boolean = false;


    constructor(experience: Experience) {
        this.experience = experience;
        this.scene = experience.scene.instance;
        this.environment = new Environment(this.scene);
        this.gridHelper = new GridHelper(100, 100);
        this.scene.add(this.gridHelper);
        this.scene.add(new THREE.AxesHelper(5));

        
        // Cube 
        // this.cubeTester = new CubeTester(this.scene);
        // this.cube = this.cubeTester.cube;
        // this.cubeBox = new THREE.Box3();
        // this.cubeSphere = new THREE.Sphere();
        
        // Windlines
        //this.windLines = new WindLines(this.scene, this.experience.camera.instance);
        this.lines = new MouseLines(this.scene);
        
        this.statue = new Statue(this.experience);
        this.statueBox = new THREE.Box3();
        this.statueSphere = new THREE.Sphere();

        this.statue.onReady((group) => {
            group.updateMatrixWorld(true);
            this.statueBox.setFromObject(group);
            this.statueBox.getBoundingSphere(this.statueSphere);
            this.statueBoundsReady = true;
        });

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

                        // Update mouse lines based on hand positions
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


        if (this.lines && this.statueBoundsReady) {
            const hit = this.lines.checkCollision(this.statueBox, this.statueSphere);
            if (hit !== this.lastStatueHit) {
                this.lastStatueHit = hit;
                this.statue.setCollisionActive(hit);
            }
        }
    }
}