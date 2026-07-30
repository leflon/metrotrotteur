<script setup lang="ts">
import type { GameParams } from "@/types/GameParams";
import type { GameRoutes } from "@metroclavier/shared";
import ButtonGrid from "./shared/ButtonGrid.vue";
import { computed, onMounted, ref } from "vue";

const TRANSPORT_MODES = [
  {
    value: 'metro',
    icon: 'metro',
  },
  {
    value: 'rer',
    icon: 'rer',
    disabled: true
  },
  {
    value: 'train',
    icon: 'train',
    disabled: true
  },
  {
    value: 'tram',
    icon: 'tram',
    disabled: true
  }
];

const props = defineProps<{
  routes: GameRoutes;
  gamemode: string;
}>();

const emit = defineEmits<{
  play: [];
}>();

const params = defineModel<GameParams>({ required: true });

const selectedRoute = ref('');

const routeOptions = computed(() => 
  Object.values(props.routes)
  .sort((a, b) => parseInt(a.name) - parseInt(b.name))
  .map((r) => ({
    icon: r.picto,
    value: r.id,
    focusColor: '#' + r.color
  }))
);

const tripOptions = computed(() => !selectedRoute.value ? [] :
  props.routes[selectedRoute.value]!.trips
  .map(t => ({
    value: t.id,
    label: t.destination
  }))
);

onMounted(() => params.value.trip = '');
</script>

<template>
  <div class='game-params-menu'>
    <h1>Mode {{gamemode}}</h1>
    <div class='menu-main'>
      <div class='general-pane'>
        
        <h2>Réseau</h2>
        <button-grid :options="TRANSPORT_MODES" v-model="params.mode"></button-grid>
        
        <h2>Directions</h2>
        <button-grid v-if="tripOptions.length > 0" v-model="params.trip" :options="tripOptions"></button-grid>
        <p v-else>
          <i>Sélectionnez une ligne</i>
        </p>

        <h2>Modes de jeu</h2>
        <button class='toggle' @click='params.easyMode = !params.easyMode' :data-checked="params.easyMode">Mode Facile</button>
      </div>
      <div class='lines-selector'>
        <h2>Lignes</h2>
        <button-grid :options="routeOptions" v-model="selectedRoute"></button-grid>
      </div>
    </div>
    <div class='menu-footer' 
      :style="{
        '--color': '#' + (props.routes[selectedRoute]?.color ?? 'ddd'),
        '--text': '#' + (props.routes[selectedRoute]?.textColor ?? '000')
      }"
      :class='{visible: params.trip }'
    >
      <div class='line-design'></div>
      <div class='stop-arrow'>➔</div>
      <button class='big' @click='emit("play")'>Jouer</button>
    </div>
  </div>
</template>

<style scoped>
.game-params-menu {
  border: var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 80%;
  max-width: 100%;
  height: max-content;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;

  @media screen and (max-width: 840px) {
    width: 99%;
    flex: 1;
    margin-bottom: 1px;
    overflow: auto;
  }
}

.menu-main {
  padding: 20px 15px;
  display: flex;
  flex: 1;

  @media screen and (max-width: 640px) {
    flex-direction: column-reverse;

    & .general-pane, & .lines-selector { width: 100%; }
  }
}

.menu-main .general-pane {
  flex: 1;
}

.menu-main .lines-selector {
  width: 40%;
}

.menu-footer {
  position: relative;
  height: 100px !important;
  width: 100%;
  flex-shrink: 0;
  background: #f001;
  display: flex;
  align-items: center;
  background: color-mix(in hsl, var(--color) 40%, transparent);
  transition: transform .3s ease, background .5s ease;
  & * { transition: background .5s ease, color .5s ease;}
}

.menu-footer:not(.visible) {
  transform: translateX(-100%);
}

.menu-footer .line-design {
  position: absolute;
  background: var(--color);
  height: 20px;
  width: 100%;
}

.stop-arrow {
  position: absolute;
  background: var(--color);
  color: var(--text);
  font-size: 16pt;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  right: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.big {
  --text: inherit;
  --color: inherit;
  font-size: 28pt;
  border-radius: 10em;
  position: absolute;
  right: 50px;
  transition: transform .3s ease, background .5s ease, border-color .5s ease, color .5s ease;
}
</style>
