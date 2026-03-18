import * as THREE from "three";
import Sizes from "~/utils/Sizes";
import Debug from "./Debug";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface LineData {
    mesh: THREE.Line;
    positions: Float32Array;
    colors: Float32Array;
    color: THREE.Color;
    pts: THREE.Vector3[];
    offset: THREE.Vector3;
    velocity: THREE.Vector3;
    target: THREE.Vector3;
    spring: number;
    friction: number;
}

/* ─────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────── */
const CONFIG = {
    NUM_LINES: 40,
    NUM_POINTS: 28,
    SPRING: 0.10,
    FRICTION: 0.82,
    PALETTE: [
        new THREE.Color(0xFF3366), // rose vif
        new THREE.Color(0xFF6B00), // orange brûlé
        new THREE.Color(0xFFCC00), // jaune électrique
        new THREE.Color(0xFF0066), // magenta
        new THREE.Color(0xFF4400), // rouge orangé
    ],
} as const;

/* ─────────────────────────────────────────────────────────
   CLASS
───────────────────────────────────────────────────────── */
export default class WindLines {
    scene: THREE.Scene;
    camera: THREE.Camera;
    lines: LineData[] = [];
    mouse: THREE.Vector3 = new THREE.Vector3();
    smoothMouse: THREE.Vector3 = new THREE.Vector3();
    raycaster: THREE.Raycaster = new THREE.Raycaster();
    pointer: THREE.Vector2 = new THREE.Vector2();
    groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    sizes: Sizes;
    debug: Debug;

    // internal
    private worldTarget: THREE.Vector3 = new THREE.Vector3();
    private mouseSpeed: number = 0;
    private _tmp: THREE.Vector3 = new THREE.Vector3();
    private _force: THREE.Vector3 = new THREE.Vector3();
    private prevMX: number = 0;
    private prevMY: number = 0;

    readonly NUM_LINES = CONFIG.NUM_LINES;
    readonly NUM_POINTS = CONFIG.NUM_POINTS;

    constructor(scene: THREE.Scene, camera: THREE.Camera) {
        this.scene = scene;
        this.camera = camera;
        this.sizes = new Sizes();
        this.debug = new Debug();

        this.createLines();
        this.bindMouse();
        this.addDebug();
    }

    /* ─────────────────────────────────────────────────────
       HELPERS
    ───────────────────────────────────────────────────── */
    private rand(min = 0, max = 1): number {
        return min + Math.random() * (max - min);
    }

    private widthFactor(t: number): number {
        const edge = 0.12;
        if (t < edge) return THREE.MathUtils.lerp(0.01, 1, t / edge);
        if (t > 1 - edge) return THREE.MathUtils.lerp(0.01, 1, (1 - t) / edge);
        return 1;
    }

    /* ─────────────────────────────────────────────────────
       CREATE LINES
    ───────────────────────────────────────────────────── */
    createLines(): void {
        for (let i = 0; i < this.NUM_LINES; i++) {
            const angle = this.rand(0, Math.PI * 2);
            const radius = 0.15 + this.rand(-0.25, 0.25);
            const offset = new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius,
            );

            /* geometry */
            const positions = new Float32Array(this.NUM_POINTS * 3);
            const colors = new Float32Array(this.NUM_POINTS * 3);
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
            geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

            /* initial color bake */
            const col = CONFIG.PALETTE[i % CONFIG.PALETTE.length];
            for (let k = 0; k < this.NUM_POINTS; k++) {
                const wf = this.widthFactor(k / (this.NUM_POINTS - 1));
                colors[k * 3] = col.r * wf;
                colors[k * 3 + 1] = col.g * wf;
                colors[k * 3 + 2] = col.b * wf;
            }

            const mat = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.85,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });

            const mesh = new THREE.Line(geo, mat);
            this.scene.add(mesh);

            /* physics state */
            const pts = Array.from(
                { length: this.NUM_POINTS },
                () => offset.clone(),
            );

            this.lines.push({
                mesh,
                positions,
                colors,
                color: col,
                pts,
                offset,
                velocity: new THREE.Vector3(),
                target: new THREE.Vector3(),
                spring: CONFIG.SPRING + this.rand(-0.02, 0.02),
                friction: CONFIG.FRICTION + this.rand(-0.04, 0.04),
            });
        }
    }

    /* ─────────────────────────────────────────────────────
       MOUSE
    ───────────────────────────────────────────────────── */
    bindMouse(): void {
        window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    }

    onMouseMove(event: MouseEvent): void {
        /* speed */
        const dx = event.clientX - this.prevMX;
        const dy = event.clientY - this.prevMY;
        this.prevMX = event.clientX;
        this.prevMY = event.clientY;
        this.mouseSpeed = Math.sqrt(dx * dx + dy * dy);

        /* NDC */
        this.pointer.x = (event.clientX / this.sizes.width) * 2 - 1;
        this.pointer.y = -(event.clientY / this.sizes.height) * 2 + 1;

        /* world position on y=0 plane */
        this.raycaster.setFromCamera(this.pointer, this.camera);
        this.raycaster.ray.intersectPlane(this.groundPlane, this._tmp);
        if (this._tmp) this.worldTarget.copy(this._tmp);
    }

    /* ─────────────────────────────────────────────────────
       DEBUG (leva / dat.gui — fill as needed)
    ───────────────────────────────────────────────────── */
    addDebug(): void {
        if (!this.debug.active) return;
        // e.g. with leva:
        // const folder = this.debug.ui.addFolder("WindLines")
        // folder.add(CONFIG, "SPRING", 0.01, 0.3)
    }

    /* ─────────────────────────────────────────────────────
       UPDATE  (call every frame from your render loop)
    ───────────────────────────────────────────────────── */
    update(_elapsedTime: number): void {
        /* decay mouse speed */
        this.mouseSpeed *= 0.88;

        const speed01 = Math.min(this.mouseSpeed / 20, 1);

        for (const line of this.lines) {
            /* head target */
            line.target.set(
                this.worldTarget.x + line.offset.x,
                0,
                this.worldTarget.z + line.offset.z,
            );

            /* spring on head */
            this._force
                .copy(line.target)
                .sub(line.pts[0])
                .multiplyScalar(line.spring);
            line.velocity.add(this._force).multiplyScalar(line.friction);
            line.pts[0].add(line.velocity);

            /* chain lerp: tail follows head */
            for (let k = 1; k < this.NUM_POINTS; k++) {
                line.pts[k].lerp(line.pts[k - 1], 0.55);
            }

            /* write buffer */
            for (let k = 0; k < this.NUM_POINTS; k++) {
                const p = line.pts[k];
                const t = k / (this.NUM_POINTS - 1);
                const brightness = this.widthFactor(t) * (0.3 + speed01 * 0.7);

                line.positions[k * 3] = p.x;
                line.positions[k * 3 + 1] = p.y + 0.02;   // tiny lift
                line.positions[k * 3 + 2] = p.z;

                line.colors[k * 3] = line.color.r * brightness;
                line.colors[k * 3 + 1] = line.color.g * brightness;
                line.colors[k * 3 + 2] = line.color.b * brightness;
            }

            const geo = line.mesh.geometry;
            geo.attributes.position.needsUpdate = true;
            geo.attributes.color.needsUpdate = true;
            geo.setDrawRange(0, this.NUM_POINTS);
        }
    }

    /* ─────────────────────────────────────────────────────
       DISPOSE
    ───────────────────────────────────────────────────── */
    dispose(): void {
        window.removeEventListener("mousemove", (e) => this.onMouseMove(e));

        for (const line of this.lines) {
            line.mesh.geometry.dispose();
            (line.mesh.material as THREE.Material).dispose();
            this.scene.remove(line.mesh);
        }

        this.lines = [];
    }
}