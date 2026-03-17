import * as THREE from 'three';
import Sizes from '~/utils/Sizes';

export default class Renderer {
    canvas: Element | null;
    sizes: Sizes;
    instance: THREE.WebGLRenderer;

    constructor(canvas: Element | null, sizes: Sizes) {
        this.canvas = canvas
        this.sizes = sizes

        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas as HTMLCanvasElement,
            antialias: true,
            alpha: false
        })

        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }

    setClearColor(color: THREE.ColorRepresentation) {
        this.instance.setClearColor(color)
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }
}