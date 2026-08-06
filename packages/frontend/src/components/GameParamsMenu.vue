<script setup lang="ts">
import { getRouteFromTrip, resources } from "@/stores/resources";
import { type GameParams } from "@metroclavier/shared";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import ButtonGrid from "./ui/ButtonGrid.vue";
import { X } from "@lucide/vue";

const TRANSPORT_MODES = [
  {
    value: "metro",
    icon: "metro",
  },
  {
    value: "rer",
    icon: "rer",
    disabled: true,
  },
  {
    value: "train",
    icon: "train",
    disabled: true,
  },
  {
    value: "tram",
    icon: "tram",
    disabled: true,
  },
];

const emit = defineEmits<{
  close: []
}>();

const props = defineProps<{
  closable?: boolean;
}>();

const params = defineModel<GameParams>({ required: true });

const selectedRoute = ref("");

const routeOptions = computed(() =>
  Object.values(resources.GAME_ROUTES)
    .sort((a, b) => parseInt(a.name) - parseInt(b.name))
    .map((r) => ({
      icon: r.picto,
      value: r.id,
      focusColor: "#" + r.color,
    })),
);

const tripOptions = computed(() =>
  !selectedRoute.value
    ? []
    : resources.GAME_ROUTES[selectedRoute.value]!.trips.map((t) => ({
        value: t.id,
        label: t.destination,
      })),
);

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closable)
    emit('close');
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});

watch(tripOptions, (opts) => (params.value.trip = opts[0]?.value ?? ""));
watch(() => params.value.trip, (trip) => {
  const route = getRouteFromTrip(trip);
  if (route)
    selectedRoute.value = route.id;
}, { immediate: true });
</script>

<template>
  <div class="game-params-menu window">
    <button v-if="closable" class='close discreet' @click="emit('close')"><x /></button>
    <h1>Mode <span class='mode'>{{ params.gamemode }}</span></h1>
    <div class="menu-main">
      <div class="general-pane">
        <h2>Réseau</h2>
        <button-grid
          :options="TRANSPORT_MODES"
          v-model="params.network"
        ></button-grid>

        <h2>Directions</h2>
        <button-grid
          v-if="tripOptions.length > 0"
          v-model="params.trip"
          :options="tripOptions"
        ></button-grid>
        <p v-else>
          <i>Sélectionnez une ligne</i>
        </p>

        <h2>Règles de la partie</h2>
        <button
          class="toggle"
          @click="params.rules.easy = !params.rules.easy"
          :data-checked="params.rules.easy"
        >
          Mode Facile
        </button>
      </div>
      <div class="lines-selector">
        <h2>Lignes</h2>
        <button-grid
          :options="routeOptions"
          v-model="selectedRoute"
        ></button-grid>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 span { text-transform: capitalize; }

.game-params-menu {
  display: flex;
  flex-direction: column;
}

.close {
  position: absolute;
  top: 10px;
  right: 10px;
}

.menu-main {
  padding: 20px 15px;
  display: flex;
  flex: 1;

  @media screen and (max-width: 640px) {
    flex-direction: column-reverse;

    & .general-pane,
    & .lines-selector {
      width: 100%;
    }
  }
}

.menu-main .general-pane {
  flex: 1;
}

.general-pane p {
  font: 10pt 'Parisine';
  padding: 7px 0;
}

.menu-main .lines-selector {
  width: 40%;
}
</style>
