import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import * as THREE from 'three';

import Renderer from "./Renderer";
import {KuwaharaPass} from "./Kuwahara";
import Debug from './Debug';

export default class PostProcessing {
    renderer!: Renderer;
    composer!: EffectComposer;
    outlinePass!: OutlinePass;
    scene!: THREE.Scene;
    debug!: Debug;
    camera!: THREE.Camera;
    kuwaharaPass!: KuwaharaPass;

    constructor(renderer: Renderer, scene: THREE.Scene, camera: THREE.Camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.renderer.setClearColor('#ffffff');
        this.debug = new Debug();
        this.composer = new EffectComposer(this.renderer.instance);

        this.composer.addPass(new RenderPass(this.scene, this.camera));

        this.createOutlinePass();
        //this.createKuwaharaPass();

        this.addDebug();
    }

    private getAllMeshes(): THREE.Object3D[] {
        const selected: THREE.Object3D[] = [];
        this.scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                selected.push(obj);
            }
        });
        return selected;
    }

    createKuwaharaPass() {
        const kuwaharaPass = new KuwaharaPass({ radius: 6 });
        this.kuwaharaPass = kuwaharaPass;
        this.composer.addPass(this.kuwaharaPass);
    }

    createOutlinePass() {
        this.outlinePass = new OutlinePass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.scene,
            this.camera
        );
        this.outlinePass.edgeStrength = 10;
        this.outlinePass.edgeGlow = 0;
        this.outlinePass.edgeThickness = 1;
        this.outlinePass.pulsePeriod = 0;
        this.outlinePass.visibleEdgeColor.set('#111111');
        this.outlinePass.hiddenEdgeColor.set('#111111');
        
        this.composer.addPass(this.outlinePass);
    }

    resize(width: number, height: number) {
        this.composer.setSize(width, height);
        this.outlinePass.setSize(width, height);
    }

    addDebug() {
        if (this.kuwaharaPass) {
            this.debug.gui
            .add(this.kuwaharaPass, 'radius')
            .min(1)
            .max(10)
            .step(1)
            .name('uSize')
        }
    }

    render() {
        this.outlinePass.selectedObjects = this.getAllMeshes();
        this.composer.render();
    }
}
