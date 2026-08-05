<script setup lang="ts">
import { api } from "@/lib/api";
import { angle, convertStopsToEasy } from "@/lib/utils";
import type { GameState } from "@/types/GameState";
import type {
  GameParams,
  GameStats,
  MultiplayerRoom,
} from "@metroclavier/shared";
import { type GameTransfer, type GameTrip } from "@metroclavier/shared";
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type ComputedRef,
} from "vue";
import EndGameStats from "./EndGameStats.vue";
import GameInput from "./GameInput.vue";
import GameMap from "./GameMap.vue";
import InGameStats from "./InGameStats.vue";
import PreGameScreen from "./ui/PreGameScreen.vue";
import ExitButton from "./ui/ExitButton.vue";
import MultiplayerGameData from "./ui/MultiplayerGameData.vue";

const PLACEHOLDER_TRIP: GameTrip = {
  id: "loading",
  destination: "Chargement...",
  route: {
    id: "loading",
    picto: "/images/1x/metro.webp",
    name: "Chargement",
    color: "eeeee",
    textColor: "000000",
  },
  stops: [],
  transfers: [],
};

//#region State

const emit = defineEmits<{
  end: [];
  exitInGame: [];
  ready: [];
  correct: [number];
}>();

const props = defineProps<{
  params: GameParams;
  loading?: boolean;
  multiplayerRoom?: MultiplayerRoom;
}>();

const state = ref<GameState>({
  trip: PLACEHOLDER_TRIP,
  currentStopIndex: 0,
  possibleTransfers: [] as GameTransfer[],
  currentStopStart: new Date(),
  status: "pregame",
});

const stats = ref<GameStats>({
  visitedStops: [],
  timedCorrectChars: [],
  duration: 0,
  gameStart: new Date(),
});

//#endregion
//#region Computed
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

  const currentCoords = [
    currentStop.value.longitude,
    currentStop.value.latitude,
  ];
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
//#endregion

const loadTrip = async () => {
  const isFirstDl = state.value.trip.id === "loading";
  const trip = await api.get(`trip/${props.params.trip}`);
  state.value.trip = trip;
  if (isFirstDl) emit("ready");
};

const startGame = () => {
  state.value.status = "playing";
  setPossibleTransfers();
};

const displayGameStats = () => {
  state.value.status = "postgame";
  state.value.currentStopIndex = -1;
  stats.value.duration = Date.now() - stats.value.gameStart.getTime();
};

onMounted(() => {
  loadTrip();
  window.visualViewport?.addEventListener("resize", syncViewport);
});
onUnmounted(() => {
  window.visualViewport?.removeEventListener("resize", syncViewport);
});

const setPossibleTransfers = () => {
  const trip = state.value.trip;

  const transfers = trip.transfers[state.value.currentStopIndex];
  if (!transfers) return (state.value.possibleTransfers = []);

  const possible =
    props.params.gamemode === "multi"
      ? []
      : transfers
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

//#region Event Handlers
const onCorrect = () => {
  const duration = Date.now() - state.value.currentStopStart.getTime();
  stats.value.visitedStops.push({
    stop: currentStop.value!,
    route: state.value.trip.route,
    duration,
  });

  emit("correct", duration);

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
  if (props.params.gamemode === "multi") return;

  const tripData = (await api.get(`trip/${trip}`)) as GameTrip;

  const currentStop = state.value.trip.stops[state.value.currentStopIndex]!;
  const newIndex = tripData.stops.findIndex((s) => s.id === currentStop.id);

  state.value.trip = tripData;
  state.value.currentStopIndex = newIndex;
};

const onEnd = () => {
  emit("end");
};
//#endregion

// Shift the game container for the input to be visible when mobile keyboard is opened.
const overlayOffset = ref<number>(0);
const syncViewport = () => {
  const vv = window.visualViewport;
  if (!vv) return;
  overlayOffset.value = window.innerHeight - (vv.height + vv.offsetTop);
};

watch(
  () => state.value.trip,
  () => {
    if (props.params.rules.easy) {
      state.value.trip.stops = convertStopsToEasy(state.value.trip.stops);
    }
  },
  { immediate: true },
);

watch(
  () => props.multiplayerRoom?.status,
  (status, oldStatus) => {
    console.log(status, oldStatus);
    if (status === oldStatus) return;
    if (status === 'idle') {
      state.value.status = 'postgame';
      if (!props.multiplayerRoom?.currentGameData.willEndAt)
        emit('end');
    }
    if (status === 'playing') {
      state.value.status = 'pregame';
      loadTrip();
    }
  },
);
</script>

<template>
  <game-map
    :trip="state.trip"
    :focusedStopIndex="state.currentStopIndex"
    :angle="trainAngle"
    :style="{ height: `calc(100% - ${overlayOffset}px)` }"
  />
  <Transition name="fade">
    <pre-game-screen
      v-if="state.status === 'pregame'"
      :loading="props.loading || state.trip.id === 'loading'"
      :tripId="props.params.trip"
      @start="startGame"
    ></pre-game-screen>
    <div
      class="game-overlay"
      v-else-if="state.status === 'playing'"
      :style="{ transform: `translateY(${-overlayOffset}px)` }"
    >
      <exit-button @click="emit('exitInGame')"></exit-button>
      <div v-if="multiplayerRoom" class="multi-overlay">
        <div v-if="multiplayerRoom.currentGameData.willEndAt">WILL END!!</div>
        <MultiplayerGameData :room="multiplayerRoom" :trip="state.trip" />
      </div>
      <div class="game-center-overlay">
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
    </div>
    <div v-else-if="state.status === 'postgame'" class="end-game-stats">
      <end-game-stats :stats="stats" :trip="state.trip" :room="multiplayerRoom" @playAgain="onEnd"></end-game-stats>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.game-overlay {
  position: fixed;
  z-index: 999999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.multi-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
}
.game-center-overlay {
  position: absolute;
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
