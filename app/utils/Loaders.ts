import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

export default class Loaders {
    dracoLoader: DRACOLoader;
    gltfLoader: GLTFLoader;
    onProgress: ((percent: number, path: string) => void) | null;

    constructor() {
        this.dracoLoader = new DRACOLoader()
        this.dracoLoader.setDecoderPath('/draco/')

        this.gltfLoader = new GLTFLoader()
        this.gltfLoader.setDRACOLoader(this.dracoLoader)
        
        this.onProgress = null
    }

    async loadModel(path: string) {
        return await new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltf) => resolve(gltf),
                (progress) => {
                    if (this.onProgress) {
                        const percent = (progress.loaded / progress.total) * 100
                        this.onProgress(percent, path)
                    }
                },
                (error) => reject(error)
            )
        })
    }

    setProgressCallback(callback: any) {
        this.onProgress = callback
    }
}