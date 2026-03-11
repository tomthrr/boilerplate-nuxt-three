<template>
  <div class="homepage">
    <canvas ref="canvasRef" class="webgl"></canvas>
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

<style lang="scss" scoped>
.homepage {
    width: 100%;
    height: 100vh;
    overflow: hidden;

    .webgl {
        display: block;
        width: 100%;
        height: 100%;
    }
}
</style>