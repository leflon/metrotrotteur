<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import GameMap from "./components/GameMap.vue";
import GameMenu from "./components/GameMenu.vue";
import GameInput from "./components/GameInput.vue";
import {
  type GameRoutes,
  type GameRoute,
  type GameStop,
  type GameTrip,
} from "@metroclavier/shared";

const GAME_ROUTES = ref<GameRoutes>({});

const gameParameters = ref({
  trip: null as GameTrip | null,
});

const gameState = ref({
  currentStopIndex: -1,
});
const currentStopName = computed(() => {
  const i = gameState.value.currentStopIndex;
  if (i === -1 || gameParameters.value.trip?.stops.length === 0) return "";

  return gameParameters.value.trip?.stops[i]!.name ?? '';
});
const appState = ref<"menu" | "playing">("menu");

const startGame = async (trip: string) => {
  const tripData = (await (
    await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/trip/${trip}`)
  ).json()) as GameTrip;
  gameParameters.value.trip = tripData;
  gameState.value.currentStopIndex = 0;
  appState.value = "playing";
};
const endGame = () => {
  appState.value = "menu";
  gameState.value.currentStopIndex = -1;
  gameParameters.value.trip = null;
};

const onCorrect = () => {
  if (
    gameState.value.currentStopIndex ===
    gameParameters.value.trip!.stops.length - 1
  )
    endGame();
  else gameState.value.currentStopIndex++;
};

onMounted(async () => {
  const raw = await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/routes`);
  GAME_ROUTES.value = (await raw.json()) as GameRoutes;
});
</script>

<template>
  <template v-if="GAME_ROUTES">
    <game-map :trip="gameParameters.trip" :focusedStopIndex="gameState.currentStopIndex" />
    <game-menu
      v-if="appState === 'menu'"
      :routes="GAME_ROUTES"
      @play="(trip) => startGame(trip)"
    ></game-menu>
    <game-input
      v-if="appState === 'playing'"
      :word="currentStopName"
      @correct="onCorrect"
    />
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
</style>
