<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import GameMenu from "./components/GameMenu.vue";
import GamePlay from "./components/GamePlay.vue";
import {
  type GameRoutes,
  type GameTrip,
} from "@metroclavier/shared";
import { api } from "./lib/api";
import { GeoJSONSource } from "maplibre-gl";

const GAME_ROUTES = ref<GameRoutes>({});
const MAP_LINES = ref<GeoJSONSource>({} as GeoJSONSource);

const appState = ref<"menu" | "playing">("menu");

const gameParameters = ref({
  trip: null as GameTrip | null,
});

const onPlay = async (trip: string) => {
  const tripData = await api.get(`trip/${trip}`) as GameTrip;
  gameParameters.value.trip = tripData;
  appState.value = "playing";
};

const onEnd = () => {
  appState.value = "menu";
};

onMounted(async () => {
  const routes = await api.get('routes');
  GAME_ROUTES.value = routes as GameRoutes;

  const lines = await api.get('map.json');
  MAP_LINES.value = lines as GeoJSONSource;
});
</script>

<template>
  <template v-if="GAME_ROUTES">
    <game-menu v-if="appState === 'menu'" :routes="GAME_ROUTES" @play="onPlay" />
    <game-play v-if="appState === 'playing'" :trip='gameParameters.trip!' :lines="MAP_LINES" @end="onEnd" />
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
