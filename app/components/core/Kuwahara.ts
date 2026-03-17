import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import fragmentShader from '~/shaders/kuwahara/fragment.glsl?raw';

const kuwaharaShader = {
    uniforms: {
        inputBuffer: { value: null },
        resolution: { value: new THREE.Vector4() },
        radius: { value: 10.0 },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader,
};

type KuwaharaPassParams = {
    radius?: number;
};

export class KuwaharaPass extends Pass {
    material: THREE.ShaderMaterial;
    fsQuad: FullScreenQuad;
    radius: number;

    constructor(params: KuwaharaPassParams = {}) {
        super();
        this.material = new THREE.ShaderMaterial({ ...kuwaharaShader });
        this.fsQuad = new FullScreenQuad(this.material);
        this.radius = params.radius ?? 10.0;
    }

    override dispose(): void {
        this.material.dispose();
        this.fsQuad.dispose();
    }

    override render(
        renderer: THREE.WebGLRenderer,
        writeBuffer: THREE.WebGLRenderTarget,
        readBuffer: THREE.WebGLRenderTarget
    ): void {
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        const width = window.innerWidth * pixelRatio;
        const height = window.innerHeight * pixelRatio;

        if (!this.material.uniforms['resolution'] || !this.material.uniforms['inputBuffer'] || !this.material.uniforms['radius']) {
            console.error('KuwaharaPass: Missing uniforms.');
            return;
        }
        this.material.uniforms['resolution'].value.set(width, height, 1 / width, 1 / height);
        this.material.uniforms['radius'].value = this.radius;
        this.material.uniforms['inputBuffer'].value = readBuffer.texture;

        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
        } else {
            renderer.setRenderTarget(writeBuffer);
            if (this.clear) renderer.clear();
        }

        this.fsQuad.render(renderer);
    }
}