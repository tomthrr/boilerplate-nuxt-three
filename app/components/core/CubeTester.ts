import * as THREE from 'three';
import { texture } from 'three/src/nodes/accessors/TextureNode.js';
import {vertexShader, fragmentShader} from "~/shaders/toon/ToonShader";
import WatercolorMaterial from '../materials/WaterColorShader';
import Debug from './Debug';

const materialToonShader = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        'uDirLightPos': { value: new THREE.Vector3(15, 15, 15) },
        'uDirLightColor': { value: new THREE.Color( 0xeeeeee ).convertLinearToSRGB() },

        'uAmbientLightColor': { value: new THREE.Color( 0x050505 ).convertLinearToSRGB() },
        'uBaseColor': { value: new THREE.Color( 0xeeeeee ).convertLinearToSRGB() },
        'uLineColor1': { value: new THREE.Color( 0x808080 ).convertLinearToSRGB() },
        'uLineColor2': { value: new THREE.Color( 0x000000 ).convertLinearToSRGB() },
        'uLineColor3': { value: new THREE.Color( 0x000000 ).convertLinearToSRGB() },
        'uLineColor4': { value: new THREE.Color( 0x000000 ).convertLinearToSRGB() }
    }
});

export default class CubeTester {
    mesh: THREE.Mesh;
    loader: THREE.TextureLoader;
    debug: Debug;
    scene: THREE.Scene;
    debugObjects: { [key: string]: any };

    constructor(scene: THREE.Scene) {
        this.loader = new THREE.TextureLoader();
        this.scene = scene;
        this.debug = new Debug();
        this.debugObjects = {};
        
        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.TorusKnotGeometry( 1, .3, 100, 16 );
        const material = this.createMaterialWaterColor();

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        this.mesh.position.set(0, 0, 0);

        this.scene.add(this.mesh);
    }

    createMaterialWaterColor() {
        const paintNormalTexture = this.loader.load( 'https://cdn.maximeheckel.com/textures/paint-normal.jpg' );
        paintNormalTexture.colorSpace = THREE.SRGBColorSpace;

        paintNormalTexture.minFilter = THREE.LinearMipmapLinearFilter;
        paintNormalTexture.magFilter = THREE.LinearFilter;
        paintNormalTexture.generateMipmaps = true;

        // building material 
        const material = new WatercolorMaterial();

        material.color = new THREE.Color("hotpink");
        
        
        material.uniforms.uScale.value = 9.0;
        material.uniforms.uColorLevels.value = 4.0;
        
        this.debugObjects['uScale'] = material.uniforms.uScale;
        this.debugObjects['uColorLevels'] = material.uniforms.uColorLevels;

        material.uniforms.uPaintNormalMap.value = paintNormalTexture;

        this.addDebug();

        return (material);
    }

    addDebug() {
        this.debug.gui
            .add(this.debugObjects['uScale'], 'value')
            .min(1)
            .max(10)
            .step(1)
            .name('uScale');

        this.debug.gui
            .add(this.debugObjects['uColorLevels'], 'value')
            .min(1)
            .max(10)
            .step(1)
            .name('uColorLevels');
    }

    update() {
        // this.mesh.rotation.x += 0.01;
        //this.mesh.rotation.y += 0.015;
    }

    dispose(scene: THREE.Scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        if (Array.isArray((this.mesh.material as THREE.Material).dispose)) {
            // no-op
        } else {
            (this.mesh.material as THREE.Material).dispose();
        }
    }
}
