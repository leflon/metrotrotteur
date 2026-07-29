<script setup lang="ts">
import { calculateSlidingWPM, splitDuration } from "@/lib/utils";
import { computed, onMounted, onUnmounted, ref } from "vue";

const props = defineProps<{
  start: Date;
  timedChars: Date[];
}>();

const elapsedTime = ref(Date.now() - props.start.getTime());

const formattedClock = computed(() => {
  let time = elapsedTime.value;

  const [minutes, seconds] = splitDuration(time);

  const sSec = `${seconds}`.padStart(2, "0");
  const sMin = `${minutes}`.padStart(2, "0");
  // Set opacity here rather than in a CSS keyframes to ensure seconds and the clock tick are synchronized.
  const opacity = seconds % 2 === 0 ? 1 : 0.5;
  return [sMin, sSec, opacity];
});


let wpmRefreshKey = ref(0);
const wpm = computed(() => {
  wpmRefreshKey.value;
  
  const wpm = calculateSlidingWPM(props.timedChars);
  return `${wpm}`.padStart(3, "0");
});

let intervals: number[] = [];
onMounted(() => {
  let i = setInterval(() => {
    elapsedTime.value = Date.now() - props.start.getTime();
  }, 1000);
  intervals.push(i);

  i = setInterval(() => {
    wpmRefreshKey.value++;
  }, 250);
  intervals.push(i);
});
onUnmounted(() => intervals.forEach(clearInterval));
</script>

<template>
  <div class="ingame-stats">
    <div class="stat wpm" data-label="WPM">{{ wpm }}</div>
    <div class="stat clock" data-label="Temps">
      <span>{{ formattedClock[0] }}</span>
      <span class="clock-sep" :style="{ opacity: formattedClock[2] }">:</span>
      <span>{{ formattedClock[1] }}</span>
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
  color: var(--yellow);
  min-width: 70px;
  text-align: center;
  background: var(--black);
  padding: 20px 0;
  font-family: "Parisine";
  font-weight: 600;
  font-size: 14pt;
  overflow: visible;

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
    z-index: 10;
    --width: 2px;
    content: "";
    position: absolute;
    right: calc(-1 * var(--width) / 2);
    top: 50%;
    width: var(--width);
    height: 50%;
    background: white;
    border-radius: 10em;
    transform: translate(0, -50%);
  }
}
</style>
