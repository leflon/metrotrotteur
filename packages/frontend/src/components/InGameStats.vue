<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

const props = defineProps<{
  start: Date;
  correctCharCount: number;
}>();

const elapsedTime = ref(Date.now() - props.start.getTime());

const formattedClock = computed(() => {
  let time = elapsedTime.value;

  const minutes = Math.floor(time / 60_000);
  const seconds = Math.floor((time % 60_000) / 1000);

  const sSec = `${seconds}`.padStart(2, "0");
  const sMin = `${minutes}`.padStart(2, "0");
  // Set opacity here rather than in a CSS keyframes to ensure seconds and the clock tick are synchronized.
  const opacity = seconds % 2 === 0 ? 1 : 0.5;
  return [sMin, sSec, opacity];
});

const wpm = computed(() =>
  `${Math.floor((props.correctCharCount / 5 / elapsedTime.value) * 60_000)}`.padStart(
    3,
    "0",
  ),
);

let intervalId: number;
onMounted(() => {
  intervalId = setInterval(() => {
    elapsedTime.value = Date.now() - props.start.getTime();
  }, 1000);
});
onUnmounted(() => clearInterval(intervalId));
</script>

<template>
  <div class="ingame-stats">
    <div class="stat wpm" data-label="WPM">{{ wpm }}</div>
    <div class="stat clock" data-label="Temps">
      <span>{{formattedClock[0]}}</span>
      <span class='clock-sep' :style="{ opacity: formattedClock[2] }">:</span>
      <span>{{formattedClock[1]}}</span>
    </div>
  </div>
</template>

<style scoped>
.ingame-stats {
  width: max-content;
  margin: 10px auto;
  background: white;
  display: flex;
  border: 3px solid #333;
  border-radius: 10px 10px 20px 20px;
  overflow: hidden;
}

.stat {
  position: relative;
  color: #ffbe00;
  min-width: 70px;
  text-align: center;
  background: #000;
  padding: 20px 0;
  font-family: "Parisine";
  font-weight: 600;
  font-size: 14pt;

  &:before {
    content: attr(data-label);
    position: absolute;
    top: 5px;
    left: 7px;
    font-weight: 400;
    color: white;
    font-size: 7pt;
  }

  &:not(:last-child):after {
    --width: 2px;
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    width: var(--width);
    height: 50%;
    background: white;
    border-radius: 10em;
    transform: translate(0, -50%);
  }
}
.clock-sep {
  padding: 0 1px;
}
</style>
