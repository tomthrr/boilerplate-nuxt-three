import * as THREE from 'three';

export default class Scene {
    public instance: THREE.Scene;

    constructor() {
        this.instance = new THREE.Scene()
    }
}