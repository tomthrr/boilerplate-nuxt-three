export default class Time {
    start: number;
    current: number;
    elapsed: number;
    delta: number;

    constructor() {
        const now = performance.now();

        this.start = now;
        this.current = now;
        this.elapsed = 0;
        this.delta = 0;
    }

    update() {
        const now = performance.now();

        this.delta = (now - this.current) / 1000;
        this.elapsed = (now - this.start) / 1000;
        this.current = now;
    }
}
