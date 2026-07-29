<script setup lang="ts">
import './index.css';
import { computed, onMounted, ref } from "vue";
import GameMenu from "./components/GameMenu.vue";
import GamePlay from "./components/GamePlay.vue";
import {
  type GameRoutes,
  type GameTrip,
} from "@metroclavier/shared";
import { api } from "./lib/api";
import { GeoJSONSource } from "maplibre-gl";
import type { GameParams } from './types/GameParams';

const GAME_ROUTES = ref<GameRoutes>({});
const GAME_GEOJSON = ref<GeoJSONSource>({} as GeoJSONSource);

const appState = ref<"menu" | "playing">("menu");

const gameParameters = ref({
  trip: null as GameTrip | null,
  params: { easyMode: false }
});

const onPlay = async (trip: string, params: GameParams) => {
  const tripData = await api.get(`trip/${trip}`) as GameTrip;
  gameParameters.value.trip = tripData;
  gameParameters.value.params = params;
  appState.value = "playing";
};

const onEnd = () => {
  appState.value = "menu";
};

onMounted(async () => {
  const routes = await api.get('routes');
  GAME_ROUTES.value = routes as GameRoutes;

  const map = await api.get('map.json');
  GAME_GEOJSON.value = map as GeoJSONSource;
});
</script>

<template>
  <template v-if="GAME_ROUTES">
    <div class='app-home' v-if="appState === 'menu'">
      <img class='splash' src='/splash.webp'></img>
      <h1><span class='clavi'>Clavi</span><span class='metro'>Métro</span></h1>
      <game-menu :routes="GAME_ROUTES" @play="onPlay" />
    </div>
    <game-play 
      v-if="appState === 'playing'" 
      :trip='gameParameters.trip!' 
      :map="GAME_GEOJSON" 
      :params="gameParameters.params!"
      @end="onEnd" 
    />
  </template>
  <div class="loading" v-else>Chargement des ressources...</div>
</template>
<style scoped>
.app-home {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
}
h1 {
  font: bold 28pt 'Parisine';
  position: relative;
  text-align: center;
  & .metro {
    font-size: 32pt;
  }
  &:after {
    top: 0;
    content: 'INDEV';
    font: bold 11pt monospace;
    background: #fcbb08;
    color: red;
    padding: 2px 4px;
    position: absolute;
    transform: rotate(22deg) translate(-30px,5px);
  }
}
.splash {
  position: fixed;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: blur(10px);
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
