<script setup lang="ts">
import { getRouteFromTrip } from '@/stores/resources';
import type { GameParams } from '@metroclavier/shared';
import { computed } from 'vue';


const props = defineProps<{
  params: GameParams;
  displayDetails?: boolean;
  readonly?: boolean;
  text?: string;
}>();

const DISABLED_COLOR = '#aaa';
const DISABLED_TEXT_COLOR = '#000';

const route = computed(() => getRouteFromTrip(props.params.trip));
const enabled = computed(() => Boolean(route.value));
const color = computed(() => route.value ? '#' + route.value.color : DISABLED_COLOR);
const textColor = computed(() => route.value ? '#' + route.value.textColor : DISABLED_TEXT_COLOR);
const headsign = computed(() => route.value?.trips.find(p => p.id === props.params.trip)?.destination);

const emit = defineEmits<{play: []}>();
</script>

<template>
  <div
    class="game-start"
    :style="{
      '--color': color,
      '--text': textColor
    }"
  >
    <div class="line-design"></div>
    <div class='details flex alc' v-if="displayDetails">
      <div class='detail important' v-if="headsign && route">
        <img :src="route.picto" :alt="route.name" :width="24" />
        {{headsign}}
      </div>
      <div class="detail" v-if="params.rules.easy">
        Mode Facile
      </div>
    </div>
    <div class="stop-arrow">➔</div>
    <button class="big" :disabled='!enabled || readonly' @click="emit('play')">
      {{text ?? 'Jouer'}}
    </button>
  </div>
</template>

<style scoped>
.game-start {
  height: 100px;
  width: 95%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  border-radius: var(--radius);
  backdrop-filter: blur(10px);
  background: color-mix(in hsl, var(--color) 40%, transparent);
  transition: background 0.5s ease;
  & * {
    transition: inherit;
  }
}

.line-design {
  position: absolute;
  background: var(--color);
  height: 20px;
  width: 100%;
}

.details {
  background: var(--color);
  color: var(--text);
  gap: 10px;
  padding: 8px 16px;
  border-radius: var(--xs-radius);
  margin-left: 40px;
  
  & .detail {
    display: flex;
    align-items: center;
    gap: 5px;
    opacity: .8;
    font-size: 10pt;

    &.important {
      font-weight: bold;
      opacity: 1;
      font-size: 14pt;
    }
  }
}

.stop-arrow {
  background: var(--color);
  color: var(--text);
  font-size: 16pt;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  margin-left: auto;
  margin-right: 80px;
  margin-left: auto;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.big {
  --text: inherit;
  --color: inherit;
  font-size: 22pt;
  border-radius: 10em;
  opacity: 1;
  margin-right: 40px;
  transition:
    transform 0.3s ease,
    background 0.5s ease,
    border-color 0.5s ease,
    color 0.5s ease;
  white-space: pre;
}
</style>
