import GUI from 'lil-gui'
import Stats from 'three/examples/jsm/libs/stats.module.js'

let instance: Debug | null = null

export default class Debug {
    active: boolean
    gui: GUI | any
    stats: Stats | null

    constructor() {
        // Check if #debug is in URL
        this.active = window.location.hash === '#debug'

        if (this.active) {
            if (instance) return instance;

            instance = this;

            this.gui = new GUI({ width: 340 })
        } else {
            // Create a chainable dummy object
            const createChainable = () => {
                const chainable = {}
                const methods = ['add', 'addColor', 'addFolder', 'min', 'max', 'step', 'name', 'onChange', 'listen', 'open', 'close']
                methods.forEach(method => {
                    chainable[method] = () => chainable
                })
                return chainable
            }
            
            this.gui = createChainable()
            this.stats = null
        }
    }

    update() {
        if (this.stats) {
            this.stats.update()
        }
    }
}
