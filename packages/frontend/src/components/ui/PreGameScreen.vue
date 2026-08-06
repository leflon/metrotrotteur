<script setup lang="ts">
import { funFacts } from "@/lib/fun-facts";
import { wait } from "@/lib/utils";
import { resources } from "@/stores/resources";
import type { GameRoute, GameTrip } from "@metroclavier/shared";
import { computed, ref, useTemplateRef, watch } from "vue";

const props = defineProps<{
  loading: boolean;
  tripId: string;
  skipCount?: boolean;
}>();
const funFact = funFacts[Math.floor(Math.random() * funFacts.length)];

const emit = defineEmits<{ start: [] }>();

const countdownValue = ref(-1);
const showCountdown = ref(false);

const countdownContainer = useTemplateRef("cd");

const info = computed(() => {
  let route: GameRoute | null = null;
  let headsign: string = '';
  for (const r of Object.values(resources.GAME_ROUTES)) {
    for (const t of r.trips) {
      if (t.id === props.tripId) {
        route = r;
        headsign = t.destination;
      }
    }
    if (route) break;
  }
  return {route: route as GameRoute, headsign};
});
const color = computed(() => info.value.route?.color);

let interval: number;

async function startSequence() {
  if (props.skipCount)
    return emit('start');
  
  showCountdown.value = true;
  await wait(500);
  let i = 3;
  countdownValue.value = i;
  interval = setInterval(() => {
    i--;
    countdownValue.value = i;

    if (i == 0) {
      clearInterval(interval);
      emit("start");
    }
  }, 1000);
}

function cancelStart() {
  showCountdown.value = false;
  if (interval) return;
  clearInterval(interval);
  countdownValue.value = -1;
}

watch(
  countdownValue,
  (val) => {
    if (!countdownContainer.value) return;
    const elm = document.createElement("span");
    elm.innerHTML = `${val}`;

    countdownContainer.value.innerHTML = "";
    countdownContainer.value.appendChild(elm);
  },
  { immediate: true },
);

let timeout: number | undefined;
watch(
  () => props.loading,
  (loading) => {
    if (loading) {
      if (timeout) clearTimeout(timeout);
      cancelStart();
    } 
    else 
      setTimeout(startSequence, 1000);
  },
  { immediate: true },
);
</script>

<template>
  <div class="pregame-screen" :style='{"--color": "#" + color }'>
    <Transition name='fade' mode='out-in'>
      <div class="loading-container" v-if='!showCountdown'>
        <div class='header'>
          <img :src='info.route.picto' :alt='info.route.name'/>
          <span>{{info.headsign}}</span>
        </div>
        <div class='wait'>À vos marques</div>
        <p class='fun-facts'>
          <b>Le saviez-vous ?</b>
          {{funFact}}
        </p>
      </div>
      <div class="countdown-container" ref="cd" v-else>
      </div>
    </Transition>
  </div>
</template>
<style>
.pregame-screen {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
  background: #0001;
  color: var(--color);
  -webkit-text-stroke: 1px white;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 10px;
  & .header {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--black);
    -webkit-text-stroke: 0px;
    gap: 10px;
    font: bold clamp(11pt, 2vw, 24pt) 'Parisine';
    & img {
      width: 32px;
    }
  }
  & .wait {
    font: bold 8vw 'Parisine';
  }

  & .fun-facts {
    text-align: center;
    font: 12pt 'Parisine';
    -webkit-text-stroke: 0px;
    color: var(--black);
  }
}

.countdown-container {
  font: bold 100pt "Parisine";
  & span {
    display: block;
    animation: countdown 1s ease forwards;
  }
}

@keyframes countdown {
  from {
    transform: scale(2);
    opacity: 0;
  }
  40%,
  60% {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.5);
    opacity: 0;
  }
}
</style>
