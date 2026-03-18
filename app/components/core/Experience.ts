import * as THREE from "three";

import Camera from "./Camera";
import Scene from "./Scene";
import Renderer from "./Renderer";
import CubeTester from "./CubeTester";
import World from "./World";
import Sizes from "~/utils/Sizes";
import Helpers from "./Helpers";
import Loaders from "~/utils/Loaders";
import PostProcessing from "./PostProcessing";
import Debug from './Debug';
import Time from "~/utils/Time";

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
    postprocessing!: PostProcessing;
    helpers!: Helpers;
    debug!: Debug;
    time!: Time;

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
        this.sizes = new Sizes(canvas);
        this.time = new Time();
        this.debug = new Debug();

        /* -------------------------
         * Core
         * ------------------------- */
        this.scene = new Scene();
        this.renderer = new Renderer(canvas, this.sizes)
        this.renderer.setClearColor('#fd6666');
        this.camera = new Camera(canvas, this.sizes);
        //this.postprocessing = new PostProcessing(this.renderer, this.scene.instance, this.camera.instance);

        /* -------------------------
         * setup
         * ------------------------- */
        this.helpers = new Helpers();
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
        if (this.postprocessing) this.postprocessing.resize(this.sizes.width, this.sizes.height);
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
        this.time.update();
        if (this.camera) this.camera.update();
        if (this.world) this.world.update(this.time.delta);
        if (this.helpers) this.helpers.update();

        // Render
        // if (this.postprocessing) {
        //     this.postprocessing.render();
        // } else {
        //     this.renderer.instance.render(this.scene.instance, this.camera.instance);
        // }
        this.renderer.instance.render(this.scene.instance, this.camera.instance);

        window.requestAnimationFrame(() => this.tick());
    }
}
