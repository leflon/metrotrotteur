<script setup lang="ts">
import { computeRanking, formatDuration } from "@/lib/utils";
import type { MultiplayerRoom } from "@metroclavier/shared";
import { computed } from "vue";

const props = defineProps<{
  room: MultiplayerRoom;
  stopsCount: number;
}>();

const ranking = computed(() => computeRanking(props.room));
const finishedRankings = computed(() =>
  props.room.status === "playing"
    ? Object.entries(ranking.value)
        .filter(([id, _]) => hasFinished(id))
        .map(([_, data]) => data)
    : Object.values(ranking.value),
);
const allFinished = computed(() =>
  props.room.players.every((p) => hasFinished(p.id)),
);

function hasFinished(playerId: string) {
  return ranking.value[playerId]?.timings.length === props.stopsCount;
}

function rankingColor(rank: number) {
  switch (rank) {
    case 0:
      return '#83C491'
    case 1:
      return '#FFCE00'
    case 2:
      return '#98D4E2';
    default:
      return '#CEADD3';
  }
}
</script>

<template>
  <div class="multi-ranking">
    <div class="ranking-row flex alc" v-for="data in finishedRankings">
      <div class="rank" :style="{ '--color': rankingColor(data.rank) }">{{data.rank + 1}}</div>
      <div class="name">{{ data.name }}</div>
      <div class="achieved stat">{{ data.timings.length }} / {{ stopsCount }}</div>
      <div class="timing stat">
        {{ formatDuration(data.timings.reduce((a, b) => a + b, 0)) }}
      </div>
    </div>
    <div class='ranking-row flex alc next-player' v-if="!allFinished && room.status === 'playing'">
      <div class="rank" :style="{ '--color': rankingColor(finishedRankings.length) }">{{finishedRankings.length + 1}}</div>
      <div class="name">Prochain joueur</div>
      <div class="achieved stat loading">
        <span class="dot" :style="{ '--offset': 0 }"></span>
        <span class="dot" :style="{ '--offset': 1 }"></span>
        <span class="dot" :style="{ '--offset': 2 }"></span>
      </div>
      <div class="timing stat loading">
        <span class="dot" :style="{ '--offset': 0 }"></span>
        <span class="dot" :style="{ '--offset': 1 }"></span>
        <span class="dot" :style="{ '--offset': 2 }"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.multi-ranking {
  background: #ccc;
  padding: 10px;
}
.ranking-row {
  background: white;
  margin: 10px auto;
  padding: 10px 15px;
  gap: 10px;
}

.rank {
  background: var(--color);
  font: bold 18pt 'Parisine';
  padding: 0px 16px;
}

.name {
  font: bold 18pt 'Parisine';
  color: var(--blue);
  margin-left: 10px;
}

.stat {
  display: flex;
  justify-content: center;
  align-items: center;
  background: black;
  color: var(--yellow);
  font: bold 16pt 'Parisine';
  border-radius: 6px;
  width: 75px;
  height: 40px;
}

.achieved {
  margin-left: auto;
}

.stat.loading {
  gap: 5px;
  align-items: end;
  padding-bottom: 10px;
}
.stat.loading span {
  display: block;
  width: 8px;
  height: 8px;
  background-color: var(--yellow);
  border-radius: 50%;
  animation: blink 1.5s steps(2, jump-none) infinite;
  animation-delay: calc(var(--offset) * .5s);
}

@keyframes blink {
  0%, 33% {
    opacity: 1;
  }
  33%, 100% {
    opacity: .5;
  }
}

</style>
