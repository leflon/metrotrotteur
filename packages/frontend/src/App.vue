<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import GameMap from "./components/GameMap.vue";
import GameMenu from "./components/GameMenu.vue";
import GameInput from "./components/GameInput.vue";
import type { PlayableTrips } from "metroclavier-server";

const PLAYABLE_TRIPS = ref<PlayableTrips | null>(null);

const gameParameters = ref({
  route: "",
  trip: "",
  stops: [] as PlayableTrips[string]['trips'][number]['stops']
});
const gameState = ref({
  currentStopIndex: -1
});
const currentStopName = computed(() => {
  const i = gameState.value.currentStopIndex;
  if (i === -1 || gameParameters.value.stops.length === 0) return "";

  return gameParameters.value.stops[i].stopName;
});
const appState = ref<'menu' | 'playing'>('menu');

const startGame = (route: string, trip: string) => {
  gameParameters.value.route = route;
  gameParameters.value.trip = trip;
  gameParameters.value.stops = PLAYABLE_TRIPS.value[route].trips.find(t => t.tripId === trip).stops;
  gameState.value.currentStopIndex = 0;
  appState.value = 'playing';
}
const endGame = () => {
  appState.value = 'menu';
  gameState.value.currentStopIndex = -1;
  gameParameters.value.stops = [];
}

const onCorrect = () => {
  if (gameState.value.currentStopIndex === gameParameters.value.stops.length - 1)
    endGame();
  else
    gameState.value.currentStopIndex++;
}

onMounted(async () => {
  const raw = await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/trips`);
  PLAYABLE_TRIPS.value = await raw.json() as PlayableTrips
});
</script>

<template>
  <template v-if="PLAYABLE_TRIPS">
    <game-map 
      :stops="gameParameters.stops"
      :focusedStopIndex="gameState.currentStopIndex"
      :stopsColor="gameParameters.route ? PLAYABLE_TRIPS[gameParameters.route].routeColor : '#000'"
     />
      <game-menu 
      v-if="appState === 'menu'" 
      :trips="PLAYABLE_TRIPS"
      @play="(route, trip) => startGame(route, trip)"
    ></game-menu>  
    <game-input
      v-if="appState === 'playing'"
      :word='currentStopName'
      @correct="onCorrect"
      />
  </template>
  <div class="loading" v-else>
    Chargement des ressources...
  </div>
</template>
<style>
html, body, #app {
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
