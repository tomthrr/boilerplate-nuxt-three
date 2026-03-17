export default class Sizes {
    width: number;
    height: number;
    pixelRatio: number;
    canvas: Element | null;

    constructor(canvas: Element | null = null) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.canvas = canvas;
    }

    update() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.pixelRatio = Math.min(window.devicePixelRatio, 2)
    }
}