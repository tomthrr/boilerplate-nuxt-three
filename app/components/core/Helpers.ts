import Stats from 'three/examples/jsm/libs/stats.module'


export default class Helpers {
    stats: Stats;

    constructor() {
        this.stats = Stats()
        document.body.appendChild(this.stats.dom);
    }

    update() {
        this.stats.update();
    }
}