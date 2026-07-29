<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, type ComputedRef } from "vue";
import GameMap from "./GameMap.vue";
import GameInput from "./GameInput.vue";
import InGameStats from "./InGameStats.vue";
import EndGameStats from "./EndGameStats.vue";
import { type GameTrip, type GameTransfer } from "@metroclavier/shared";
import { api } from "@/lib/api";
import type { GeoJSONSource } from "maplibre-gl";
import type { GameStats } from "@/types/GameStats";
import { angle, calculateSlidingWPM, convertStopsToEasy } from "@/lib/utils";
import type { GameParams } from "@/types/GameParams";

const emit = defineEmits<{
  end: [];
}>();

const props = defineProps<{
  // Not reactive. The parent should not be able to alter the current trip,
  // after the gameplay was mounted. The gameplay handles it itself.
  trip: GameTrip;
  map: GeoJSONSource;
  params: GameParams;
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

const trainAngle: ComputedRef<number> = computed<number>(() => {
  const nextStop = state.value.trip.stops[state.value.currentStopIndex + 1];
  if (!currentStop.value || !nextStop) return trainAngle.value ?? 0;
  
  const currentCoords = [currentStop.value.longitude, currentStop.value.latitude];
  const nextCoords = [nextStop.longitude, nextStop.latitude];
  
  const a = angle(currentCoords, nextCoords);

  const previousAngle = trainAngle.value;
  if (!previousAngle) return a;

  const plus360 = a + 360;
  const d1 = Math.abs(previousAngle - a);
  const d2 = Math.abs(previousAngle - plus360);
  const shortest = Math.min(d1, d2);

  return shortest === d1 ? a : plus360;
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

const startGame = () => {
  setPossibleTransfers();
};

const displayGameStats = () => {
  state.value.status = "stats";
  state.value.currentStopIndex = -1;
  stats.value.duration = Date.now() - stats.value.gameStart.getTime();
};

let wasSimplified = false;
watch(() => state.value.trip, () => {
  console.log('hello');
  if (wasSimplified) {
    wasSimplified = false;
    return;
  }
  if (props.params.easyMode) {
    state.value.trip.stops = convertStopsToEasy(state.value.trip.stops);
    wasSimplified = true;
  }
}, { immediate: true, deep: true });

onMounted(startGame);
</script>

<template>
  <game-map
    :trip="state.trip"
    :geojson="map"
    :focusedStopIndex="state.currentStopIndex"
    :angle="trainAngle"
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
