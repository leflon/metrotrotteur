<script setup lang="ts">
import { computeRanking, formatDuration } from "@/lib/utils";
import type { GameTrip, MultiplayerRoom } from "@metroclavier/shared";
import { computed, onUnmounted, ref, watch } from "vue";

const props = defineProps<{
  room: MultiplayerRoom;
  trip: GameTrip;
}>();

const rankingPerUser = computed(() => computeRanking(props.room));
const formattedEndClock = ref("");

let interval: number | null = null;

function updateClock(willEndAt: Date) {
  const duration = willEndAt.getTime() - Date.now();
  formattedEndClock.value = formatDuration(duration);
}
watch(
  () => props.room.currentGameData.willEndAt,
  (val, oldVal) => {
    if (!val || val === oldVal) return;

    const date = new Date(val);
    updateClock(date)
    let interval = setInterval(() => updateClock(date), 1000);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (interval)
    clearInterval(interval);
});
</script>

<template>
  <div class="multi-data">
    <Transition name='height'>
      <div class="will-end" v-if="room.currentGameData.willEndAt">
        <span>Fin dans</span>
        <span class="countdown">{{ formattedEndClock }}</span>
      </div>
    </Transition>
    <div class="ranking" :style="{ '--players': room.players.length }">
      <div
        class="ranking-row flex alc"
        v-for="p in room.players"
        :style="{ '--rank': rankingPerUser[p.id]!.rank }"
      >
        <div class="rank">{{ rankingPerUser[p.id]!.rank + 1 }}</div>
        <div class="ranking-name">{{ rankingPerUser[p.id]!.name }}</div>
        <div class="ranking-progress">
          <div class="remaining">
            {{ rankingPerUser[p.id]!.timings.length }} / {{ trip.stops.length }}
          </div>
          <div class="progress-bar flex col alc">
            <div
              class="progress-bar-inner"
              :style="{
                width:
                  (rankingPerUser[p.id]!.timings.length / trip.stops.length) *
                    100 +
                  '%',
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.will-end {
  background: red;
  color: white;
  padding: 0px 10px;
  border-radius: var(--xs-radius);
  margin-bottom: 20px;
  font: bold 18pt "Parisine";
  text-align: center;
  animation: red-bg 3s linear infinite;
  height: calc-size(fit-content, size);
  overflow: hidden;
  transition: height 0.2s ease;
  & .countdown {
    margin-left: 5px;
  }
}

.height-enter-from,
.height-leave-to {
  height: 0;
}

@keyframes red-bg {
  50% {
    background: #b00;
  }
}

.ranking {
  --row-height: 40px;
  width: 200px;
  height: calc(var(--players) * var(--row-height));
  border-radius: var(--radius);
  max-height: calc(5 * var(--row-height));
  overflow: hidden;
  background: var(--white);
  border: var(--border);
  transition: height 0.3s ease;
}
.ranking-row {
  position: absolute;
  z-index: calc(5 - var(--rank));
  top: calc(var(--rank) * var(--row-height));
  height: var(--row-height);
  padding: 0 10px;
  gap: 5px;
  border-bottom: 1px solid #eee;
  justify-content: space-between;
  background: var(--white);
  transition: top 0.3s ease;
  width: 100%;
}

.ranking-row .rank {
  font-weight: bold;
}

.ranking-row .ranking-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre;
  flex: 1;
}

.ranking-progress {
  text-align: center;
  white-space: pre;
  flex-shrink: 0;
  font-size: 8pt;
  width: 36px;

  & .progress-bar {
    width: 100%;
    height: 3px;
    background: #0004;
    border-radius: 10em;
    overflow: hidden;

    & .progress-bar-inner {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: var(--blue);
      transition: width 0.3s ease;
    }
  }
}
</style>
