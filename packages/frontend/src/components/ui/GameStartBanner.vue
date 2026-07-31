<script setup lang="ts">

const props = defineProps<{
  color?: string;
  textColor?: string;
  enabled: boolean
}>();

const emit = defineEmits<{play: []}>();

const DISABLED_COLOR = '#aaa';
const DISABLED_TEXT_COLOR = '#000';

</script>

<template>
  <div
    class="game-start"
    :style="{
      '--color': enabled ? '#' + color : DISABLED_COLOR,
      '--text': enabled ? '#' + textColor : DISABLED_TEXT_COLOR
    }"
  >
    <div class="line-design"></div>
    <div class="stop-arrow">➔</div>
    <button class="big" :disabled='!enabled' @click="emit('play')">Jouer</button>
  </div>
</template>

<style scoped>
.game-start {
  height: 100px;
  width: 95%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  border-radius: var(--radius);
  backdrop-filter: blur(10px);
  background: color-mix(in hsl, var(--color) 40%, transparent);
  transition: background 0.5s ease;
  & * {
    transition: inherit;
  }
}

.line-design {
  position: absolute;
  background: var(--color);
  height: 20px;
  width: 100%;
}

.stop-arrow {
  position: absolute;
  background: var(--color);
  color: var(--text);
  font-size: 16pt;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  right: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.big {
  --text: inherit;
  --color: inherit;
  font-size: 28pt;
  border-radius: 10em;
  position: absolute;
  right: 50px;
  opacity: 1;
  transition:
    transform 0.3s ease,
    background 0.5s ease,
    border-color 0.5s ease,
    color 0.5s ease;
}
</style>
