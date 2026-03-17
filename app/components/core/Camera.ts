import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import Sizes from "~/utils/Sizes";

export default class Camera {
    sizes: Sizes;
    instance: THREE.PerspectiveCamera;
    controls: OrbitControls;

    constructor(canvas: Element, sizes: Sizes) {
        this.sizes = sizes;

        this.instance = new THREE.PerspectiveCamera(
            35,
            this.sizes.width / this.sizes.height,
            0.001,
            5000
        )
        this.instance.position.set(0, 0, 5);

        this.controls = new OrbitControls(this.instance, this.sizes.canvas as HTMLElement)
        this.controls.enableDamping = true
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update() {
        this.controls.update()
    }
}