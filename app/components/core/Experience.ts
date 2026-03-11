import * as THREE from "three";

import Camera from "./Camera";
import Scene from "./Scene";
import Renderer from "./Renderer";
import CubeTester from "./CubeTester";
import World from "./World";
import Sizes from "~/utils/Sizes";
import Loaders from "~/utils/Loaders";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

declare global {
    interface Window {
        experience: Experience;
    }
}

let instance: Experience | null = null;

export default class Experience {
    scene!: Scene;
    sizes!: Sizes;
    camera!: Camera;
    renderer!: Renderer;
    
    loaders!: Loaders;
    world!: World;

    constructor(canvas: Element) {
        if (instance) return instance;
        
        instance = this;

        // Global access
        window.experience = this;

        /* -------------------------
         * Utils
         * ------------------------- */
        this.sizes = new Sizes();

        /* -------------------------
         * Core
         * ------------------------- */
        this.scene = new Scene();
        this.renderer = new Renderer(canvas, this.sizes)
        this.camera = new Camera(canvas, this.sizes);

        /* -------------------------
         * setup
         * ------------------------- */
        this.world = new World(instance);
        this.tick();

        // Resize handling
        window.addEventListener('resize', () => this.resize());
    }

    /* =====================================================
     * RESIZE
     * ===================================================== */
    resize() {
        if (!this.sizes) return
        this.sizes.update();
        if (this.camera) this.camera.resize();
        if (this.renderer) this.renderer.resize();
    }

    /* =====================================================
     * LOOP
     * ===================================================== */
    tick() {
        if (!this.renderer || !this.scene || !this.camera) {
            window.requestAnimationFrame(() => this.tick());
            return
        }

        // Update components
        if (this.camera) this.camera.update();
        if (this.world) this.world.update();

        // Render
        this.renderer.instance.render(this.scene.instance, this.camera.instance);

        window.requestAnimationFrame(() => this.tick());
    }
}