<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import GameMap from "./GameMap.vue";
import GameInput from "./GameInput.vue";
import {
  type GameRoutes,
  type GameTrip,
  type GameTransfer,
} from "@metroclavier/shared";
import { api } from "@/lib/api";
import type { GeoJSONSource } from "maplibre-gl";

const emit = defineEmits<{
  end: []
}>();

const props = defineProps<{
  // Not reactive. The parent should not be able to alter the current trip,
  // after the gameplay was mounted. The gameplay handles it itself.
  trip: GameTrip
  map: GeoJSONSource
}>();

const state = ref({
  trip: props.trip,
  currentStopIndex: 0,
  possibleTransfers: [] as GameTransfer[],
});

const currentStopName = computed(() => {
  const i = state.value.currentStopIndex;
  if (i === -1) return "";
  return state.value.trip.stops[i]!.name;
});

const currentTransfers = computed<GameTransfer[]>(() => {
  // Don't return any transfer if only the current trip is available.
  if (state.value.possibleTransfers.length === 1) return [];
  return state.value.possibleTransfers;
});

const setPossibleTransfers = () => {
  const trip = state.value.trip;
  
  const transfers = trip.transfers[state.value.currentStopIndex];
  if (!transfers) return state.value.possibleTransfers = [];

  // Can go anywhere *Except* the other directions on the same line.
  const possible = transfers
    .filter((t) => t.route.id !== trip.route.id || t.trip === trip.id)
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
  if (
    state.value.currentStopIndex ===
    state.value.trip.stops.length - 1
  )
    emit('end');
  else {
    state.value.currentStopIndex++;
    setPossibleTransfers();
  }
};

const onTransfer = async (trip: string) => {
  const tripData = await api.get(`trip/${trip}`) as GameTrip;

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
  <game-input
    :previousStop="''"
    :currentStop="currentStopName"
    :nextStop="''"
    :trip="state.trip"
    :transfers="currentTransfers"
    @correct="onCorrect"
    @transfer="onTransfer"
  />
</template>
