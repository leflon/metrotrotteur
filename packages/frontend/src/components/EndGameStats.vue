<script setup lang="ts">
import { calculateStopWPM, formatDuration } from "@/lib/utils";
import type { GameStats } from "@/types/GameStats";
import {
    CategoryScale,
    Chart,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
} from "chart.js";
import { computed, onMounted, toRaw, useTemplateRef } from "vue";

const props = defineProps<{ stats: GameStats }>();
const emit = defineEmits<{ playAgain: [] }>();

const canvas = useTemplateRef("chart");

const headsign = computed(
  () =>
    props.stats.visitedStops[0]?.stop.name +
    " ➜ " +
    props.stats.visitedStops.at(-1)?.stop.name,
);

const formattedClock = computed(() => {
  const time = props.stats.duration;
  return formatDuration(time);
});

const wpmValues = computed(() => props.stats.visitedStops.map(calculateStopWPM));
const wpmLabels = computed(() => props.stats.visitedStops.map(s => s.stop.name));

const maxWPM = computed(() => Math.max(...wpmValues.value));
const avgWPM = computed(() =>
  Math.floor(
    wpmValues.value.reduce((a, b) => a + b, 0) / wpmValues.value.length,
  ),
);

const isTransfer = (index: number) => {
  const current = props.stats.visitedStops[index];
  const previous = props.stats.visitedStops[index - 1];
  console.log(current, previous);
  if (!current || !previous) return false;
  return current.route.id !== previous.route.id;
};
const isStart = (index: number) => index === 0;
const isEnd = (index: number) => index === props.stats.visitedStops.length - 1;

const onPlayAgain = () => emit("playAgain");

onMounted(() => {
  Chart.register(
    LineController,
    LinearScale,
    CategoryScale,
    PointElement,
    LineElement,
    Tooltip,
  );
  new Chart(canvas.value!, {
    type: "line",
    data: {
      labels: toRaw(wpmLabels.value),
      yLabels: undefined,
      datasets: [
        {
          label: "Mots Par Minute (WPM)",
          data: toRaw(wpmValues.value),
          borderColor: "#FFBE00",
          pointBackgroundColor: "#FFBE00",
          borderCapStyle: "round",
        },
      ],
    },
    options: {
      scales: {
        y: {
          grid: { display: false },
          ticks: { color: "white" },
        },
        x: {
          grid: { display: false },
          ticks: { color: "white" },
        },
      },
    },
  });
});
</script>

<template>
  <Transition name="stats">
    <div class="end-game-stats-container">
      <div class="header">
        <div class="header-trip">{{ headsign }}</div>
        <div class="header-clock">{{ formattedClock }}</div>
      </div>
      <div class="content">
        <div class="trip-breakdown">
          <div
            class="trip-stop"
            v-for="(info, index) in stats.visitedStops"
            :class="{
              'is-transfer': isTransfer(index),
              'is-start': isStart(index),
              'is-end': isEnd(index),
            }"
            :style="{ '--bg': '#' + info.route.color }"
          >
            <div class="stop-transfer-picto">
              <img
                v-if="isTransfer(index) || isStart(index)"
                :src="info.route.picto"
              />
            </div>
            <div class="stop-circle"></div>
            <div class="stop-name">{{ info.stop.name }}</div>
            <div class="stop-duration">{{ formatDuration(info.duration) }}</div>
            <div class="stop-wpm">
              {{
                calculateStopWPM(info)
              }}
              WPM
            </div>
          </div>
        </div>
        <div class="stats">
          <div class="stat-title">Mots Par Minute (WPM)</div>
          <canvas class="wpm-chart" ref="chart"></canvas>
          <div class="figures">
            <div data-label="Moyenne">{{ avgWPM }}<span>WPM</span></div>
            <div data-label="Maximum">{{ maxWPM }}<span>WPM</span></div>
          </div>
          <div class="next-cta">
            <button @click="onPlayAgain">Rejouer</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.stats-enter-from,
.stats-leave-to {
  opacity: 0;
  transition: translateY(100%);
}

.end-game-stats-container {
  z-index: 0;
  position: relative;
  background: white;
  width: 90%;
  height: 80%;
  box-sizing: border-box;
  box-shadow: 0px 0px 10px #4444;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: 0.3s ease;
}

.header {
  position: inherit;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: start;
  border-bottom: 8px solid var(--blue);
}

.header-trip {
  background: var(--blue);
  width: max-content;
  color: white;
  font: 16pt "Parisine";
  padding: 10px;
  margin: 20px 30px;
}

.header-clock {
  background: var(--black);
  color: var(--yellow);
  font: 20pt "Parisine";
  width: max-content;
  padding: 5px 16px;
  border-radius: 0px 0px 5px 5px;
  margin-right: 20px;
}

.content {
  box-sizing: border-box;
  flex: 1;
  overflow: hidden;
  display: flex;
}

.trip-breakdown {
  flex: 1;
  box-sizing: border-box;
  padding: 20px 0;
  height: 100%;
  overflow: auto;
}

.trip-stop {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  margin: 0 10px;

  & > * {
    flex-shrink: 0;
  }

  & .stop-transfer-picto {
    width: 24px;
    height: 24px;
    & img {
      width: 100%;
      height: 100%;
    }
    margin-right: 5px;
  }
  & .stop-circle {
    position: relative;
    box-sizing: border-box;
    width: 22px;
    height: 22px;
    background: var(--bg);
    border-radius: 50%;
  }

  &:is(.is-start, .is-end) .stop-circle {
    position: relative;
    background: white;
    border: 3.5px solid var(--black);
    &:before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 8px;
      height: 8px;
      transform: translate(-50%, -50%);
      background: var(--bg);
      border-radius: 50%;
    }
  }

  &:not(:last-child) .stop-circle:after {
    z-index: -1;
    content: "";
    position: absolute;
    top: 80%;
    left: 50%;
    width: 13px;
    height: 30px;
    background: var(--bg);
    transform: translateX(-50%);
  }

  &.is-transfer .stop-circle {
    background: white;
    border: 3.5px solid black;
  }

  & .stop-name {
    font: 600 15pt "Parisine";
    color: var(--blue);
    padding: 4px 4px;
  }

  &.is-start .stop-name {
    background: var(--blue);
    color: white;
  }
  &.is-end .stop-name {
    background: var(--black);
    color: var(--white);
  }
}

.stop-duration,
.stop-wpm {
  font: bold 12pt "Parisine";
  color: var(--yellow);
  background: var(--black);
  padding: 4px 6px;
  border-radius: 4px;
  height: fit-content;
}

.stats {
  width: 40%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  & .next-cta {
    align-self: flex-end;
    margin: 10px 0;
  }

  & canvas {
    background: var(--black);
    border-radius: 6px;
    padding: 10px;
  }
}

.stat-title {
  font: bold 16pt "Parisine";
  margin: 10px 0;
}

.figures {
  display: flex;
  gap: 10px;
  margin: 10px 0;

  & div {
    position: relative;
    width: 100px;
    height: 50px;
    background: var(--black);
    color: var(--yellow);
    border: 2px solid #444;
    border-radius: 4px;
    font: bold 19pt 'Parisine';
    display: flex;
    justify-content: center;
    align-items: center;
    & span {
      font-size: 10pt;
      margin-left: 2px;
    }
    &:before {
      content: attr(data-label);
      position: absolute;
      font: 400 8pt 'Parisine';
      color: white;
      top: 1px;
      left: 5px;
    }
  }
}

@media screen and (max-width: 1024px) {
  .end-game-stats-container {
    width: 100%;
    height: 100%;
  }
  
  .content {
    flex-direction: column;
    overflow: auto;
    display: block;
  }
  .trip-breakdown {
    overflow-y: visible;
    overflow-x: auto;
    height: unset;
    width: 100%;
    padding: 0 5px;
    flex: unset;
  }
  .header-trip {
    font-size: 12pt;
  }
  .stats {width: auto;height: auto;}
}

</style>
