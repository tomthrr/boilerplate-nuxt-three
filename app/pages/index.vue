<template>
  <div class="homepage">
    <!-- THREE -->
    <canvas ref="canvasRef" class="webgl"></canvas>

    <!-- WEBCAM -->
    <div class="webcam-container">
      <video id="inputVideo" class="webcam-video" autoplay playsinline muted></video>

      <canvas id="output_canvas" class="output_canvas"></canvas>
    </div>

    <button class="webcam-button" id="webcamButton">ENABLE WEBCAM</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Experience from '~/components/core/Experience'

const canvasRef = ref<HTMLCanvasElement | null>(null)

let experience: Experience | null = null

onMounted(() => {
    if (canvasRef.value) {
        experience = new Experience(canvasRef.value)
    }
})
</script>

<style scoped lang="scss">
.homepage {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* THREE */
.webgl {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* WEBCAM CONTAINER */
.webcam-container {
  position: absolute;
  bottom: 50px;
  left: 50px;
  width: 320px; 
  aspect-ratio: 4 / 3;
}

/* VIDEO + CANVAS SUPERPOSÉS */
.webcam-video,
.output_canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;

  transform: scaleX(-1); /* miroir camera */
}

/* IMPORTANT */
.webcam-video {
  object-fit: contain;
}

.output_canvas {
  pointer-events: none;
}

/* BUTTON */
.webcam-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  padding: 12px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
