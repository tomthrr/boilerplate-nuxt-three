import Stats from 'three/examples/jsm/libs/stats.module.js'


export default class Helpers {
    stats: Stats;

    constructor() {
        this.stats = new Stats(); 
        document.body.appendChild(this.stats.dom);
    }

    update() {
        this.stats.update();
    }
}