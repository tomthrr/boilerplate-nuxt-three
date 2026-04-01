import {
    HandLandmarker,
    FilesetResolver,
    DrawingUtils
} from "@mediapipe/tasks-vision";

export class MediaPipeHands {
    video: HTMLVideoElement;
    canvas: HTMLCanvasElement;
    canvasCtx: CanvasRenderingContext2D | null = null;
    handLandmarker: HandLandmarker | null = null;
    running: boolean = false;
    lastVideoTime: number = -1;
    results: any;
    onResults: (results: any) => void;

    constructor(videoElement: HTMLVideoElement, canvas: HTMLCanvasElement, onResultsCallback: (results: any) => void) {
        this.video = videoElement;
        this.canvas = canvas;
        this.canvasCtx = this.canvas.getContext("2d");
        this.onResults = onResultsCallback;
        this.running = false;

        this.init();
    }

    async init() {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );

        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: "GPU" // très important
            },
            runningMode: "VIDEO",
            numHands: 1
        });
    }

    async start() {
        console.log("Starting webcam...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.video.srcObject = stream;

        await this.video.play();

        this.running = true;
        this.loop();
    }

    async loop() {
        console.log("Running loop...");
        if (!this.running || !this.handLandmarker || !this.canvasCtx) return;

        // Détection toujours
        const ctx = this.canvasCtx;

        const nowInMs = performance.now();
        this.results = await this.handLandmarker.detectForVideo(this.video, nowInMs);

        if (this.results?.landmarks?.length > 0) {
            const drawingUtils = new DrawingUtils(ctx);
            for (const landmarks of this.results.landmarks) {
                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 5 });
                drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 1 });
            }
        }

        // 🔹 setup canvas
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;


        ctx.save();
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.results && this.results.landmarks) {
            const drawingUtils = new DrawingUtils(ctx);

            for (const landmarks of this.results.landmarks) {

                // 🔹 dessine les lignes
                drawingUtils.drawConnectors(
                    landmarks,
                    HandLandmarker.HAND_CONNECTIONS, 
                    {
                        color: "#00FF00",
                        lineWidth: 5
                    }
                );

                // 🔹 dessine les points
                drawingUtils.drawLandmarks(
                    landmarks, {
                        color: "#FF0000",
                        lineWidth: 1
                    }
                );
            }
        }

        ctx.restore();

        if (this.results) {
            this.onResults(this.results);
        }
        requestAnimationFrame(() => this.loop());
    }

    stop() {
        this.running = false;
    }
}
