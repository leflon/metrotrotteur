<script setup lang="ts">
import { api } from "@/lib/api";
import { angle, convertStopsToEasy } from "@/lib/utils";
import type { GameParams } from "@/types/GameParams";
import type { GameStats } from "@/types/GameStats";
import { type GameTransfer, type GameTrip } from "@metroclavier/shared";
import { computed, onMounted, onUnmounted, ref, watch, type ComputedRef } from "vue";
import EndGameStats from "./EndGameStats.vue";
import GameInput from "./GameInput.vue";
import GameMap from "./GameMap.vue";
import InGameStats from "./InGameStats.vue";

const emit = defineEmits<{
  end: [];
}>();

const props = defineProps<{
  // Not reactive. The parent should not be able to alter the current trip,
  // after the gameplay was mounted. The gameplay handles it itself.
  trip: GameTrip;
  map: any; // TODO: get the right type
  params: GameParams;
}>();

const state = ref({
  trip: props.trip,
  currentStopIndex: 0,
  possibleTransfers: [] as GameTransfer[],
  currentStopStart: new Date(),
  status: "playing" as "playing" | "stats",
});

const stats = ref<GameStats>({
  visitedStops: [],
  timedCorrectChars: [],
  duration: 0,
  gameStart: new Date()
});

const isExiting = ref(false);

const currentStop = computed(() => {
  const i = state.value.currentStopIndex;
  if (i === -1) return null;
  return state.value.trip.stops[i];
});

const currentStopName = computed(() => currentStop.value?.name ?? "");

const currentTransfers = computed<GameTransfer[]>(() => {
  // Don't return any transfer if only the current trip is available.
  if (state.value.possibleTransfers.length === 1) return [];
  return state.value.possibleTransfers;
});

const trainAngle: ComputedRef<number> = computed<number>(() => {
  const nextStop = state.value.trip.stops[state.value.currentStopIndex + 1];
  if (!currentStop.value || !nextStop) return trainAngle.value ?? 0;
  
  const currentCoords = [currentStop.value.longitude, currentStop.value.latitude];
  const nextCoords = [nextStop.longitude, nextStop.latitude];
  
  const a = angle(currentCoords, nextCoords);

  const previousAngle = trainAngle.value;
  if (!previousAngle) return a;

  const plus360 = a + 360;
  const d1 = Math.abs(previousAngle - a);
  const d2 = Math.abs(previousAngle - plus360);
  const shortest = Math.min(d1, d2);

  return shortest === d1 ? a : plus360;
});

const setPossibleTransfers = () => {
  const trip = state.value.trip;

  const transfers = trip.transfers[state.value.currentStopIndex];
  if (!transfers) return (state.value.possibleTransfers = []);

  const possible = transfers
    .filter(
      (t) =>
        // Always allow the current trip so we can circle back to it
        t.trip === state.value.trip.id ||
        // Allow any transfer to another line
        state.value.trip.route.id !== t.route.id ||
        // Prevent a transfer that would make it go backwards on the same line
        (stats.value.visitedStops.at(-1)?.stop.id !== t.nextStop &&
          // Also prevent a transfer that would not change the next stop while on the next line
          state.value.trip.stops[state.value.currentStopIndex + 1]?.id !==
            t.nextStop),
    )
    // Force the current trip at the last position to loop through all other options
    // before falling back on it.
    .sort((a, b) =>
      a.trip === trip.id
        ? 1
        : b.trip === trip.id
          ? -1
          : parseInt(a.route.name) - parseInt(b.route.name),
    );
  state.value.possibleTransfers = possible;
};

const onCorrect = () => {
  stats.value.visitedStops.push({
    stop: currentStop.value!,
    route: state.value.trip.route,
    duration: Date.now() - state.value.currentStopStart.getTime(),
  });
  
  if (state.value.currentStopIndex === state.value.trip.stops.length - 1) {
    displayGameStats();
  } else {
    state.value.currentStopIndex++;
    state.value.currentStopStart = new Date();
    setPossibleTransfers();
  }
};

const onCorrectChar = () => {
  stats.value.timedCorrectChars.push(new Date());
};

const onTransfer = async (trip: string) => {
  const tripData = (await api.get(`trip/${trip}`)) as GameTrip;

  const currentStop = state.value.trip.stops[state.value.currentStopIndex]!;
  const newIndex = tripData.stops.findIndex((s) => s.id === currentStop.id);

  state.value.trip = tripData;
  state.value.currentStopIndex = newIndex;
};

const onPlayAgain = () => {
  emit('end');
}

const startGame = () => {
  setPossibleTransfers();
};

const displayGameStats = () => {
  state.value.status = "stats";
  state.value.currentStopIndex = -1;
  stats.value.duration = Date.now() - stats.value.gameStart.getTime();
};

const overlayOffset = ref<number>(0);
const syncViewport = () => {
  const vv = window.visualViewport;
  if (!vv) return;
  overlayOffset.value = window.innerHeight - (vv.height + vv.offsetTop);
}

watch(() => state.value.trip, () => {
  if (props.params.easyMode) {
    state.value.trip.stops = convertStopsToEasy(state.value.trip.stops);
  }
}, { immediate: true });

let exitTimeout: number | undefined;
const startExit = () => {
  isExiting.value = true;
  exitTimeout = setTimeout(() => {
    emit('end');
  }, 1500);
}
const stopExit = () => {
  clearTimeout(exitTimeout);
  exitTimeout = undefined;
  isExiting.value = false;
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || exitTimeout !== undefined) return;
  startExit();
}
const onKeyUp = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return;
  stopExit();
}

onMounted(() => {
  startGame();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.visualViewport?.addEventListener('resize', syncViewport);
// window.visualViewport?.addEventListener('scroll', syncToVisualViewport);

});
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.visualViewport?.removeEventListener('resize', syncViewport);
});
</script>

<template>
  <game-map
      :trip="state.trip"
      :geojson="map"
      :focusedStopIndex="state.currentStopIndex"
      :angle="trainAngle"
      :style="{ height: `calc(100% - ${overlayOffset}px)` }"
  />
  <button 
    class='exit-indicator' 
    :class="{exiting: isExiting }"
    @mousedown.prevent
    @pointerdown.prevent
    @dblclick.prevent
    @click="emit('end')"
  >
    <span class='regular'>Quitter la partie</span>
    <div class='overlay-wrapper'>
      <div>Quitter la partie</div>
    </div>
  </button>
  <div 
    class="game-center-overlay" 
    v-if="state.status === 'playing'"
    :style='{ transform: `translateY(${-overlayOffset}px)` }'
  >
    <in-game-stats
      :start="stats.gameStart"
      :timedChars="stats.timedCorrectChars"
    />
    <game-input
      :currentStop="currentStopName"
      :trip="state.trip"
      :transfers="currentTransfers"
      @correct="onCorrect"
      @transfer="onTransfer"
      @correctChar="onCorrectChar"
    />
  </div>
  <div v-else-if="state.status = 'stats'" class='end-game-stats'>
    <end-game-stats :stats="stats" @playAgain="onPlayAgain"></end-game-stats>
  </div>
</template>

<style scoped>
.exit-indicator {
  all: unset;
  --width: 120px;
  position: fixed;
  z-index: 99999;
  top: 20px;
  left: 20px;
  transition: .3s ease;
  padding: 10px 0;
  width: var(--width);
  text-align: center;
  font: bold 10pt 'Parisine';
  background: #fffe;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  & .overlay-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 100%;
    overflow: hidden;
    transition: width .2s ease;
  }
  
  & .overlay-wrapper > div {
    white-space: pre;
    color: white;
    width: var(--width);
    height: 100%;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--blue);
  }

  &.exiting {
    transform: scale(.9);
  }
  &.exiting .overlay-wrapper {
    width: 100%;
    transition: width 1.5s linear;
  }
}

.game-center-overlay {
  position: fixed;
  z-index: 999999;
  bottom: 20px;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.end-game-stats {
  position: fixed;
  z-index: 99999999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(3px);
}
</style>

