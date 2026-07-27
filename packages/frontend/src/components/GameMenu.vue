<script setup lang="ts">
import type { GameRoute, GameRoutes } from "@metroclavier/shared";
import { computed, ref } from "vue";

const props = defineProps<{
  routes: GameRoutes;
}>();

const emit = defineEmits<{
  play: [string];
}>();

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
    <div class="trips-list">
      <div
        v-for="trip in tripsList"
        class="trip"
        :class="{ selected: selectedTrip === trip.id }"
        @click="selectedTrip = trip.id"
      >
        {{ trip.destination }}
      </div>
    </div>
    <button
      class="play"
      v-if="selectedTrip"
      @click="emit('play', selectedTrip)"
    >
      Jouer
    </button>
  </div>
</template>

<style scoped>
.game-menu {
  position: fixed;
  z-index: 9999;
  top: 50%;
  left: 50%;
  background: white;
  width: 600px;
  height: 250px;
  padding: 5px 20px;
  transform: translate(-50%, -50%);
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
.trip {
  background: #0a0082;
  color: white;
  padding: 4px 8px;
  cursor: pointer;
  &:hover,
  &.selected {
    background: black;
  }
}
.play {
  display: block;
  margin: 10px auto;
}
</style>
