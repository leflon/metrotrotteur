<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import GameMap from "./components/GameMap.vue";
import GameMenu from "./components/GameMenu.vue";
import GameInput from "./components/GameInput.vue";
import {
  type GameRoutes,
  type GameTrip,
  type GameTransfer,
} from "@metroclavier/shared";

const GAME_ROUTES = ref<GameRoutes>({});

const gameParameters = ref({
  trip: null as GameTrip | null,
});

const gameState = ref({
  currentStopIndex: -1,
  possibleTransfers: [] as GameTransfer[],
});
const currentStopName = computed(() => {
  const i = gameState.value.currentStopIndex;
  if (i === -1 || !gameParameters.value.trip) return "";

  return gameParameters.value.trip.stops[i]?.name ?? "";
});
const currentTransfers = computed<GameTransfer[]>(() => {
  // Don't return any transfer if only the current trip is available.
  if (gameState.value.possibleTransfers.length === 1) return [];
  else return gameState.value.possibleTransfers;
});

const appState = ref<"menu" | "playing">("menu");

const startGame = async (trip: string) => {
  const tripData = (await (
    await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/trip/${trip}`)
  ).json()) as GameTrip;
  gameParameters.value.trip = tripData;
  gameState.value.currentStopIndex = 0;
  appState.value = "playing";
  setPossibleTransfers();
};
const endGame = () => {
  appState.value = "menu";
  gameState.value.currentStopIndex = -1;
  gameParameters.value.trip = null;
};

const setPossibleTransfers = () => {
  const trip = gameParameters.value.trip;
  if (!trip) return;
  const transfers = trip.transfers[gameState.value.currentStopIndex];
  if (!transfers) return;

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
  gameState.value.possibleTransfers = possible;
};

const onCorrect = () => {
  if (
    gameState.value.currentStopIndex ===
    gameParameters.value.trip!.stops.length - 1
  )
    endGame();
  else {
    gameState.value.currentStopIndex++;
    setPossibleTransfers();
  }
};

const onTransfer = async (trip: string) => {
  const tripData = (await (
    await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/trip/${trip}`)
  ).json()) as GameTrip;

  const currentStop =
    gameParameters.value.trip!.stops[gameState.value.currentStopIndex]!;
  const newIndex = tripData.stops.findIndex((s) => s.id === currentStop.id);

  gameParameters.value.trip = tripData;
  gameState.value.currentStopIndex = newIndex;
};

onMounted(async () => {
  const raw = await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/routes`);
  GAME_ROUTES.value = (await raw.json()) as GameRoutes;
});
</script>

<template>
  <template v-if="GAME_ROUTES">
    <game-map
      :trip="gameParameters.trip"
      :focusedStopIndex="gameState.currentStopIndex"
    />
    <game-menu
      v-if="appState === 'menu'"
      :routes="GAME_ROUTES"
      @play="(trip) => startGame(trip)"
    ></game-menu>
    <game-input
      v-if="appState === 'playing'"
      :word="currentStopName"
      :transfers="currentTransfers"
      @correct="onCorrect"
      @transfer="onTransfer"
    />
    <div class="debug">
      <p>
        Current Trip : {{ gameParameters.trip?.route.name }} -
        {{ gameParameters.trip?.destination }}
      </p>
    </div>
  </template>
  <div class="loading" v-else>Chargement des ressources...</div>
</template>
<style>
html,
body,
#app {
  margin: 0;
  height: 100%;
}
.loading {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 99999;
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
}
.debug {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999999;
  background: #0004;
  border: 1px dashed red;
}
</style>
