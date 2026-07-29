<script setup lang="ts">
import type { GameParams } from "@/types/GameParams";
import type { GameRoutes } from "@metroclavier/shared";
import { computed, ref } from "vue";

const props = defineProps<{
  routes: GameRoutes;
}>();

const emit = defineEmits<{
  play: [string, GameParams];
}>();

const params = ref<GameParams>({
  easyMode: false
});

const selectedRoute = ref<string>("");
const selectedTrip = ref<string>("");

const setRoute = (route: string) => {
  selectedTrip.value = "";
  selectedRoute.value = route;
};

const routesList = computed(() =>
  Object.values(props.routes).sort(
    (a, b) => parseInt(a.name) - parseInt(b.name),
  ),
);

const tripsList = computed(() =>
  selectedRoute.value ? props.routes[selectedRoute.value]!.trips : [],
);
</script>

<template>
  <div class="game-menu">
    <h2>Sélectionnez une ligne</h2>
    <div class="routes-list">
      <div
        v-for="route in routesList"
        class="route"
        :style="{ '--bg': '#' + route.color }"
        :class="{ selected: selectedRoute === route.id }"
        @click="setRoute(route.id)"
      >
        <img :src="route.picto" :width="24" />
      </div>
    </div>
    <div v-if="tripsList.length > 0">
      <h2>Sélectionnez une direction</h2>
      <div class="trips-list">
        <button
          v-for="trip in tripsList"
          class="trip"
          :class="{ selected: selectedTrip === trip.id }"
          @click="selectedTrip = trip.id"
        >
          {{ trip.destination }}
        </button>
      </div>
    </div>
    <div v-if="selectedTrip">
      <div class='game-params'>
        <button 
          class='toggle-btn' 
          :data-value="params.easyMode"
          @click="params.easyMode = !params.easyMode">
            Mode Facile
          </button>
      </div>
      <button
        class="play"
        v-if="selectedTrip"
        @click="emit('play', selectedTrip, params)"
      >
        Jouer
      </button>
    </div>
  </div>
</template>

<style scoped>
h2 {
  font: bold 14pt 'Parisine';
}
.game-menu {
  box-sizing: border-box;
  background: white;
  border: 2px solid #ddd;
  border-radius: 10px;
  width: 600px;
  max-width: 100%;
  height: max-content;
  padding: 30px 20px;
}

.routes-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.route {
  width: 40px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #0008;
  border-radius: 4px;
  cursor: pointer;
  &.selected {
    background: var(--bg);
  }
}

.trips-list {
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}
.trip.selected {
  background: var(--black);
}
.play {
  display: block;
  margin: 0 auto;
  margin-top: 20px;
}
</style>
