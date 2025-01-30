<template>
  <div
      class="advanced-glow-box"
      :style="{
      '--border-width': `${borderWidth}px`,
      '--gradient-colors': gradientColors.join(','),
      '--animation-duration': `${animationDuration}s`
    }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  borderWidth?: number
  gradientColors?: string[]
  animationDuration?: number
}

withDefaults(defineProps<Props>(), {
  borderWidth: 4,
  gradientColors: () => ['#45f3ff', '#ff2770', '#45f3ff'],
  animationDuration: 4
})
</script>

<style scoped>
.advanced-glow-box {
  --border-width: 4px;
  --gradient-colors: #45f3ff, #ff2770, #45f3ff;
  --animation-duration: 4s;
}

.advanced-glow-box {
  position: relative;
  background: transparent; /* 父元素背景透明 */
  border-radius: 10px;
  overflow: hidden;
  padding: var(--border-width);
}

.advanced-glow-box::before {
  content: '';
  position: absolute;
  width: 150%;
  height: 150%;
  background: linear-gradient(
      0deg,
      transparent,
      var(--gradient-colors),
      transparent
  );
  animation: rotate var(--animation-duration) linear infinite;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -2; /* 置于最底层 */
}

.advanced-glow-box::after {
  content: '';
  position: absolute;
  inset: var(--border-width);
  background: #ffffff;
  border-radius: calc(10px - var(--border-width));
  z-index: -1; /* 在内容下方，但在渐变层之上 */
}

@keyframes rotate {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>