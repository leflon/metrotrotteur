<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import GameMap from "./GameMap.vue";
import GameInput from "./GameInput.vue";
import InGameStats from "./InGameStats.vue";
import EndGameStats from "./EndGameStats.vue";
import { type GameTrip, type GameTransfer } from "@metroclavier/shared";
import { api } from "@/lib/api";
import type { GeoJSONSource } from "maplibre-gl";
import type { GameStats } from "@/types/GameStats";
import { calculateSlidingWPM } from "@/lib/utils";

const emit = defineEmits<{
  end: [];
}>();

const props = defineProps<{
  // Not reactive. The parent should not be able to alter the current trip,
  // after the gameplay was mounted. The gameplay handles it itself.
  trip: GameTrip;
  map: GeoJSONSource;
}>();

const state = ref({
  trip: props.trip,
  currentStopIndex: 0,
  possibleTransfers: [] as GameTransfer[],
  currentStopStart: new Date(),
  status: "playing" as "playing" | "stats",
});

const stats = ref<GameStats>({
  visitedStops: [],
  wpmHistory: [],
  timedCorrectChars: [],
  duration: 0,
  gameStart: new Date()
});

const currentStop = computed(() => {
  const i = state.value.currentStopIndex;
  if (i === -1) return null;
  return state.value.trip.stops[i];
});

const currentStopName = computed(() => currentStop.value?.name ?? "");

const currentTransfers = computed<GameTransfer[]>(() => {
  // Don't return any transfer if only the current trip is available.
  if (state.value.possibleTransfers.length === 1) return [];
  return state.value.possibleTransfers;
});

const setPossibleTransfers = () => {
  const trip = state.value.trip;

  const transfers = trip.transfers[state.value.currentStopIndex];
  if (!transfers) return (state.value.possibleTransfers = []);

  const possible = transfers
    .filter(
      (t) =>
        // Always allow the current trip so we can circle back to it
        t.trip === state.value.trip.id ||
        // Allow any transfer to another line
        state.value.trip.route.id !== t.route.id ||
        // Prevent a transfer that would make it go backwards on the same line
        (stats.value.visitedStops.at(-1)?.stop.id !== t.nextStop &&
          // Also prevent a transfer that would not change the next stop while on the next line
          state.value.trip.stops[state.value.currentStopIndex + 1]?.id !==
            t.nextStop),
    )
    // Force the current trip at the last position to loop through all other options
    // before falling back on it.
    .sort((a, b) =>
      a.trip === trip.id
        ? 1
        : b.trip === trip.id
          ? -1
          : parseInt(a.route.name) - parseInt(b.route.name),
    );
  console.table(possible);
  state.value.possibleTransfers = possible;
};

const onCorrect = () => {
  stats.value.visitedStops.push({
    stop: currentStop.value!,
    route: state.value.trip.route,
    duration: Date.now() - state.value.currentStopStart.getTime(),
  });
  
  if (state.value.currentStopIndex === state.value.trip.stops.length - 1) {
    displayGameStats();
    clearInterval(wpmInterval);
  } else {
    state.value.currentStopIndex++;
    state.value.currentStopStart = new Date();
    setPossibleTransfers();
  }
};

const onCorrectChar = () => {
  stats.value.timedCorrectChars.push(new Date());
};

const onTransfer = async (trip: string) => {
  const tripData = (await api.get(`trip/${trip}`)) as GameTrip;

  const currentStop = state.value.trip.stops[state.value.currentStopIndex]!;
  const newIndex = tripData.stops.findIndex((s) => s.id === currentStop.id);

  state.value.trip = tripData;
  state.value.currentStopIndex = newIndex;
};

const onPlayAgain = () => {
  emit('end');
}

let wpmInterval: number;
const startGame = () => {
  setPossibleTransfers();
  wpmInterval = setInterval(computeAndSaveWPM, 3000);
};

const computeAndSaveWPM = () => {
  const wpm = calculateSlidingWPM(stats.value.timedCorrectChars);
  stats.value.wpmHistory.push({ value: wpm, time: new Date() });
};

const displayGameStats = () => {
  state.value.status = "stats";
  stats.value.duration = Date.now() - stats.value.gameStart.getTime();
};

onMounted(startGame);
onUnmounted(() => clearInterval(wpmInterval));
</script>

<template>
  <game-map
    :trip="state.trip"
    :geojson="map"
    :focusedStopIndex="state.currentStopIndex"
  />
  <div class="game-center-overlay" v-if="state.status === 'playing'">
    <in-game-stats
      :start="stats.gameStart"
      :timedChars="stats.timedCorrectChars"
    />
    <game-input
      :currentStop="currentStopName"
      :trip="state.trip"
      :transfers="currentTransfers"
      @correct="onCorrect"
      @transfer="onTransfer"
      @correctChar="onCorrectChar"
    />
  </div>
  <div v-else-if="state.status = 'stats'" class='end-game-stats'>
    <end-game-stats :stats="stats" @playAgain="onPlayAgain"></end-game-stats>
  </div>
</template>

<style scoped>
.game-center-overlay {
  position: fixed;
  z-index: 999999;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.end-game-stats {
  position: fixed;
  z-index: 99999999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(3px);
}
</style>
