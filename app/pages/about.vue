<template>
    <section>
        <div class="canvas-text">
            <span ref="spanRef">Franklin la tortue devait faire du vélo mais son ami n'en avait pas</span>
            <canvas ref="canvasRef"></canvas>
        </div>
    </section>
</template>
<script lang="ts" setup>
    import { ref, onMounted } from 'vue'
    import * as THREE from 'three'
    
    const spanRef = ref<HTMLSpanElement | null>(null)
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const materialRef = ref<THREE.ShaderMaterial | null>(null)

    const vertexShader = `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    const fragmentShader = `
        #ifdef GL_ES
        precision mediump float;
        #endif
        uniform sampler2D u_texture;
        uniform vec2 u_mouse;
        uniform vec2 u_prevMouse;
        uniform float u_time;
        uniform vec2 u_resolution;
        varying vec2 vUv;

        vec2 random2(vec2 st){
            st = vec2( dot(st,vec2(127.1,311.7)),
                    dot(st,vec2(269.5,183.3)) );
            return -1.0 + 2.0*fract(sin(st)*43758.5453123);
        }

        float noise2(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            vec2 u = f*f*(3.0-2.0*f);
            return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                            dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                        mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                            dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
        }

        float random (in vec2 st) {
            return fract(sin(dot(st.xy,
                                vec2(12.9898,78.233)))*
                43758.5453123);
        }

        float noise (in vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) +
                    (c - a)* u.y * (1.0 - u.x) +
                    (d - b) * u.x * u.y;
        }

        #define OCTAVES 6
        float fbm (in vec2 st) {
            float value = 0.0;
            float amplitude = .5;
            float frequency = 0.;
            for (int i = 0; i < OCTAVES; i++) {
                value += amplitude * noise(st);
                st *= 2.;
                amplitude *= .5;
            }
            return value;
        }

        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            st.x *= u_resolution.x / u_resolution.y;
            
            vec2 pos = vec2(st * 2.);
            
            float fbmVal = fbm(st);
            
            float n1 = noise2(pos + vec2(0.)); 
            float n2 = noise2(pos + vec2(5.4, 4.3)); 
            float amplitude = 0.1;
            vec2 distortion = vec2(n1, n2) * amplitude; 
            
            float alpha = smoothstep(u_time + 0.1, u_time - 0.1, fbmVal);

            float strength = (1.0 - u_time) * (1.0 - u_time);
            vec2 distortedUv = vUv + distortion * strength;
            vec4 texColor = texture2D(u_texture, distortedUv);
            
            gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
        }
    `;

    const LINE_HEIGHT = 20
    const FONT = '16px "Gridlite", sans-serif'

    function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
        const words = text.split(' ')
        const lines: string[] = []
        let currentLine = ''

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word
            const { width } = ctx.measureText(testLine)
            if (width > maxWidth && currentLine) {
                lines.push(currentLine)
                currentLine = word
            } else {
                currentLine = testLine
            }
        }
        if (currentLine) lines.push(currentLine)
        return lines
    }

    function createTextTexture(text: string, width: number, height: number): THREE.Texture {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        const dpr = window.devicePixelRatio
        canvas.width = width * dpr
        canvas.height = height * dpr

        ctx.scale(dpr, dpr)
        ctx.font = FONT
        ctx.fillStyle = 'black';

        // ✅ Wrap le texte sur plusieurs lignes
        const lines = getWrappedLines(ctx, text, width)
        lines.forEach((line, i) => {
            ctx.fillText(line, 0, LINE_HEIGHT * (i + 1))
        })

        const texture = new THREE.Texture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        return texture;
    }

    function initScene() {
        const span = spanRef.value!
        const canvas = canvasRef.value!

        const dpr = window.devicePixelRatio || 1

        const width = span.offsetWidth
        const height = span.offsetHeight

        const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 1000)
        camera.position.z = 5

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(dpr) 

        const scene = new THREE.Scene()

        const geometry = new THREE.PlaneGeometry(width, height)
        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_texture: { value: createTextTexture(span.textContent || '', width, height) },
                u_mouse: { value: new THREE.Vector2(0, 0) },
                u_prevMouse: { value: new THREE.Vector2(0, 0) },
                u_resolution: { value: new THREE.Vector2(width * dpr, height * dpr) },
                u_time: { value: 0 },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
        })
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        materialRef.value = material

        const clock = new THREE.Clock()

        const revealDuration = 2
        function animate() {
            const t = clock.getElapsedTime()
            material.uniforms.u_time.value = Math.min(t / revealDuration, 1.0)
            if (material.uniforms.u_time.value >= 1.0) {
                material.uniforms.u_time.value = 1.0 - (t - revealDuration) / revealDuration
            }
            requestAnimationFrame(animate)
            renderer.render(scene, camera)
        }
        animate()
    }

    function initMouseTracking() {
        window.addEventListener('mousemove', (event) => {
            const mat = materialRef.value
            if (!mat) return

            const span = spanRef.value!
            const rect = span.getBoundingClientRect()

            const mouseX = (event.clientX - rect.left) / rect.width
            const mouseY = 1 - (event.clientY - rect.top) / rect.height

            mat.uniforms.u_prevMouse.value.copy(mat.uniforms.u_mouse.value)
            mat.uniforms.u_mouse.value.set(mouseX, mouseY)
        })
    }

    onMounted(() => {
        initScene()
        initMouseTracking()
    })
</script>
<style scoped lang="scss">
    section {
        width: 100%;
        height: 100vh;
        display: flex;
        justify-content: center;
        flex-direction: column;
        align-items: center;

        .canvas-text {
            position: relative;

            span {
                opacity: 0;
                display: inline-block;
                text-align: center;
                width: 300px;       /* ✅ Largeur fixe pour forcer le wrap */
                line-height: 20px;  /* ✅ Doit correspondre à LINE_HEIGHT */
                min-height: 40px;   /* ✅ Deux lignes */
            }
            
            canvas {
                height: calc(100% + 5px);
                left: 0;
                pointer-events: none;
                position: absolute;
                top: 0;
                width: calc(100% + 5px);
            }
        }
    }
</style>