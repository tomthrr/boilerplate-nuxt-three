import * as THREE from "three";
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';
import Sizes from "~/utils/Sizes";
import Debug from "./Debug";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface LineData {
    mesh:      THREE.Mesh;
    meshLine:  MeshLine;
    material:  MeshLineMaterial;
    pts:       THREE.Vector3[];
    offset:    THREE.Vector3;
    velocity:  THREE.Vector3;
    target:    THREE.Vector3;
    color:     THREE.Color;
    spring:    number;
    friction:  number;
}

/* ─────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────── */
const CONFIG = {
    NUM_LINES:  20,
    NUM_POINTS: 28,
    SPRING:     0.10,
    FRICTION:   0.82,
    LINE_WIDTH: 15,   // world units (sizeAttenuation: 0) ou pixels (sizeAttenuation: 1)
    PALETTE: [
        new THREE.Color(0xCFD4D9), // gris clair nuageux
        new THREE.Color(0xA8B0B8), // gris bleuté
        new THREE.Color(0xE8EAEC), // blanc cassé
        new THREE.Color(0x8C9399), // gris moyen
        new THREE.Color(0xBCC3C9), // gris perle
    ],
    // PALETTE: [
    //     new THREE.Color(0xFF3366), // rose vif
    //     new THREE.Color(0xFF6B00), // orange vif
    //     new THREE.Color(0xFFCC00), // jaune vif
    //     new THREE.Color(0xFF0066), // rose foncé
    //     new THREE.Color(0xFF4400), // orange foncé
    // ],
} as const;

/* ─────────────────────────────────────────────────────────
   CLASS
───────────────────────────────────────────────────────── */
export default class WindLines {
    scene:       THREE.Scene;
    camera:      THREE.Camera;
    lines:       LineData[] = [];
    mouse:       THREE.Vector3 = new THREE.Vector3();
    smoothMouse: THREE.Vector3 = new THREE.Vector3();
    raycaster:   THREE.Raycaster = new THREE.Raycaster();
    pointer:     THREE.Vector2 = new THREE.Vector2();
    groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    sizes:       Sizes;
    debug:       Debug;

    private worldTarget: THREE.Vector3 = new THREE.Vector3();
    private mouseSpeed:  number = 0;
    private _tmp:        THREE.Vector3 = new THREE.Vector3();
    private _force:      THREE.Vector3 = new THREE.Vector3();
    private prevMX:      number = 0;
    private prevMY:      number = 0;

    readonly NUM_LINES  = CONFIG.NUM_LINES;
    readonly NUM_POINTS = CONFIG.NUM_POINTS;

    constructor(scene: THREE.Scene, camera: THREE.Camera) {
        this.scene  = scene;
        this.camera = camera;
        this.sizes  = new Sizes();
        this.debug  = new Debug();

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

    // p = 0 → tête, p = 1 → queue  (convention MeshLine)
    private widthCallback(p: number): number {
        const edge = 0.12;
        if (p < edge)     return THREE.MathUtils.lerp(0.01, 1, p / edge);
        if (p > 1 - edge) return THREE.MathUtils.lerp(0.01, 1, (1 - p) / edge);
        return 1;
    }

    // Flatten pts[] → Float32Array [x,y,z, x,y,z, ...]
    private ptsToFloat32(pts: THREE.Vector3[]): Float32Array {
        const arr = new Float32Array(pts.length * 3);
        for (let i = 0; i < pts.length; i++) {
            arr[i * 3]     = pts[i].x;
            arr[i * 3 + 1] = pts[i].y + 0.02;   // tiny lift off ground
            arr[i * 3 + 2] = pts[i].z;
        }
        return arr;
    }

    /* ─────────────────────────────────────────────────────
       CREATE LINES
    ───────────────────────────────────────────────────── */
    createLines(): void {
        for (let i = 0; i < this.NUM_LINES; i++) {
            const angle  = this.rand(0, Math.PI * 2);
            const radius = 0.15 + this.rand(-0.25, 0.25);
            const offset = new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius,
            );

            const color = CONFIG.PALETTE[i % CONFIG.PALETTE.length].clone();

            /* initial pts: all stacked at offset */
            const pts = Array.from(
                { length: this.NUM_POINTS },
                () => offset.clone(),
            );

            /* MeshLine */
            const meshLine = new MeshLine();
            meshLine.setPoints(this.ptsToFloat32(pts), (p) => this.widthCallback(p));

            const material = new MeshLineMaterial({
                color,
                lineWidth:       CONFIG.LINE_WIDTH,
                sizeAttenuation: 0,          // 0 = world units, 1 = screen px
                transparent:     true,
                opacity:         0.9,
                depthWrite:      false,
                blending:        THREE.AdditiveBlending,
                resolution:      new THREE.Vector2(this.sizes.width, this.sizes.height),
            });

            const mesh = new THREE.Mesh(meshLine, material);
            this.scene.add(mesh);

            this.lines.push({
                mesh,
                meshLine,
                material,
                pts,
                offset,
                color,
                velocity: new THREE.Vector3(),
                target:   new THREE.Vector3(),
                spring:   CONFIG.SPRING + this.rand(-0.02, 0.02),
                friction: CONFIG.FRICTION + this.rand(-0.04, 0.04),
            });
        }
    }

    /* ─────────────────────────────────────────────────────
       MOUSE
    ───────────────────────────────────────────────────── */
    private readonly _onMouseMove = (e: MouseEvent) => this.onMouseMove(e);

    bindMouse(): void {
        window.addEventListener("mousemove", this._onMouseMove);
    }

    onMouseMove(event: MouseEvent): void {
        const dx    = event.clientX - this.prevMX;
        const dy    = event.clientY - this.prevMY;
        this.prevMX = event.clientX;
        this.prevMY = event.clientY;
        this.mouseSpeed = Math.sqrt(dx * dx + dy * dy);

        this.pointer.x =  (event.clientX / this.sizes.width)  * 2 - 1;
        this.pointer.y = -(event.clientY / this.sizes.height) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this._tmp);
        if (hit) this.worldTarget.copy(this._tmp);
    }

    /* ─────────────────────────────────────────────────────
       RESIZE
    ───────────────────────────────────────────────────── */
    onResize(): void {
        for (const line of this.lines) {
            line.material.resolution.set(this.sizes.width, this.sizes.height);
        }
    }

    /* ─────────────────────────────────────────────────────
       DEBUG
    ───────────────────────────────────────────────────── */
    addDebug(): void {
        if (!this.debug.active) return;
        // const folder = this.debug.ui.addFolder("WindLines")
        // folder.add(CONFIG, "LINE_WIDTH", 0.01, 0.2).onChange((v) => {
        //     this.lines.forEach(l => l.material.lineWidth = v)
        // })
    }

    /* ─────────────────────────────────────────────────────
       UPDATE
    ───────────────────────────────────────────────────── */
    update(_elapsedTime: number): void {
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

            /* brightness via material color (vitesse souris) */
            const brightness = 0.3 + speed01 * 0.7;
            line.material.color.setRGB(
                line.color.r * brightness,
                line.color.g * brightness,
                line.color.b * brightness,
            );

            /* upload new geometry to MeshLine */
            line.meshLine.setPoints(
                this.ptsToFloat32(line.pts),
                (p) => this.widthCallback(p),
            );
        }
    }

    /* ─────────────────────────────────────────────────────
       DISPOSE
    ───────────────────────────────────────────────────── */
    dispose(): void {
        window.removeEventListener("mousemove", this._onMouseMove);

        for (const line of this.lines) {
            line.meshLine.geometry?.dispose();
            line.material.dispose();
            this.scene.remove(line.mesh);
        }

        this.lines = [];
    }
}