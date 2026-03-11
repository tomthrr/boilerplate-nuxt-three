import * as THREE from "three";

export default class Environment {

    constructor(scene: THREE.Scene) {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        const directional = new THREE.DirectionalLight(0xffffff, 0.6);
        directional.position.set(5, 5, 5);

        scene.add(ambient, directional);
    }
}