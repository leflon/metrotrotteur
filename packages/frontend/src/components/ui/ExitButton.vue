<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const emit = defineEmits<{click: []}>();
const isExiting = ref(false);

let exitTimeout: number | undefined;
const startExit = () => {
  isExiting.value = true;
  exitTimeout = setTimeout(() => {
    emit('click');
  }, 500);
}
const stopExit = () => {
  clearTimeout(exitTimeout);
  exitTimeout = undefined;
  isExiting.value = false;
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || exitTimeout !== undefined) return;
  startExit();
}
const onKeyUp = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return;
  stopExit();
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
});
</script>

<template>
  <button
    class="exit-button"
    :class="{ exiting: isExiting }"
    @mousedown.prevent
    @pointerdown.prevent
    @dblclick.prevent
    @click="emit('click')"
  >
    <span class="regular">Quitter la partie</span>
    <div class="overlay-wrapper">
      <div>Quitter la partie</div>
    </div>
  </button>
</template>

<style scoped>
.exit-button {
  all: unset;
  --width: 120px;
  position: fixed;
  z-index: 99999;
  top: 20px;
  left: 20px;
  transition: .3s ease;
  padding: 10px 0;
  width: var(--width);
  text-align: center;
  font: bold 10pt 'Parisine';
  background: #fffe;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  & .overlay-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 100%;
    overflow: hidden;
  }
  
  & .overlay-wrapper > div {
    white-space: pre;
    color: white;
    width: var(--width);
    height: 100%;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--blue);
  }

  &.exiting {
    transform: scale(.95);
  }
  &.exiting .overlay-wrapper {
    width: 100%;
    transition: width .5s linear;
  }
}

</style>