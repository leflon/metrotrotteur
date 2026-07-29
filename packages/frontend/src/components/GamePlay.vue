<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import GameMap from "./GameMap.vue";
import GameInput from "./GameInput.vue";
import InGameStats from "./InGameStats.vue";
import {
  type GameRoutes,
  type GameTrip,
  type GameTransfer,
} from "@metroclavier/shared";
import { api } from "@/lib/api";
import type { GeoJSONSource } from "maplibre-gl";

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
  visitedStops: [] as string[],
  startTime: new Date(),
  correctCharCount: 0,
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

  console.log(state.value.visitedStops);

  const possible = transfers
    .filter(
      (t) =>
        // Always allow the current trip so we can circle back to it
        t.trip === state.value.trip.id
        // Allow any transfer to another line
        || state.value.trip.route.id !== t.route.id
        // Prevent a transfer that would make it go backwards on the same line
        || state.value.visitedStops.at(-1) !== t.nextStop 
        &&
        // Also prevent a transfer that would not change the next stop while on the next line
        (state.value.trip.stops[state.value.currentStopIndex + 1]?.id !== t.nextStop),
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
  if (state.value.currentStopIndex === state.value.trip.stops.length - 1)
    emit("end");
  else {
    state.value.visitedStops.push(currentStop.value!.id);
    state.value.currentStopIndex++;
    setPossibleTransfers();
  }
};

const onCorrectChar = () => state.value.correctCharCount++;

const onTransfer = async (trip: string) => {
  const tripData = (await api.get(`trip/${trip}`)) as GameTrip;

  console.log(state.value.currentStopIndex);
  const currentStop = state.value.trip.stops[state.value.currentStopIndex]!;
  console.log(currentStop);
  const newIndex = tripData.stops.findIndex((s) => s.id === currentStop.id);
  console.log(newIndex);

  state.value.trip = tripData;
  state.value.currentStopIndex = newIndex;
};

onMounted(async () => {
  setPossibleTransfers();
});
</script>

<template>
  <game-map
    :trip="state.trip"
    :geojson="map"
    :focusedStopIndex="state.currentStopIndex"
  />
  <div class='game-center-overlay'>
    <in-game-stats
      :start="state.startTime"
      :correctCharCount="state.correctCharCount"
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
</template>

<style scoped>
.game-center-overlay {
  position: fixed;
  z-index: 999999;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
