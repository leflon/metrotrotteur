<script setup lang="ts">
import type { GameTransfer, GameTrip } from "@metroclavier/shared";
import { onMounted, ref, watch, useTemplateRef, computed } from "vue";

const props = defineProps<{
  currentStop: string;
  nextStop: string;
  previousStop: string;
  trip: GameTrip;
  transfers: GameTransfer[];
}>();
const emit = defineEmits<{ correct: []; transfer: [string] }>();

const guess = ref("");
const transferIndex = ref(0);

const input = useTemplateRef<HTMLInputElement>("input");

const formattedGuess = computed(() => {
  let html = "";
  let i = 0;
  for (; i < guess.value.length; i++) {
    const guessLetter = guess.value[i]!;
    const correctLetter = props.currentStop[i];

    if (guessLetter === correctLetter)
      html += `<span class='correct'>${guessLetter}</span>`;
    else html += `<span class='incorrect'>${guessLetter}</span>`;
  }

  let isFirst = true;
  for (; i < props.currentStop.length; i++) {
    const letter = props.currentStop[i]!;
    if (isFirst) {
      html += `<span class='current'>${letter}</span>`;
      isFirst = false;
    } else html += `<span class='next'>${letter}</span>`;
  }

  return html;
});

onMounted(() => {
  input.value?.focus();
});

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Tab") {
    e.preventDefault();
    onTransfer();
  }
};

const onTransfer = () => {
  if (props.transfers.length === 0) return;
  emit("transfer", props.transfers[transferIndex.value]!.trip);
  if (transferIndex.value === props.transfers.length - 1)
    transferIndex.value = 0;
  else transferIndex.value++;
};

watch(guess, (value) => {
  if (value === props.currentStop) {
    emit("correct");
    guess.value = "";
    transferIndex.value = 0;
  }
});
</script>

<template>
  <div class="game-input">
    <div class="visible-container">
      <Transition name='transfer'>
        <div 
          class='transfer-container' 
          v-if='transfers.length > 0' 
          :style='{"--color": "#" + transfers[transferIndex]?.route.color}'
        >
          <div class='key-indicator'>TAB</div>
          <div class='arrow'>➜</div>
          <img :src='transfers[transferIndex]?.route.picto' width="24" /></img>
          <div class='transfer-headsign'>{{transfers[transferIndex]?.destination}}</div>
        </div>
      </Transition>
      <div
        class="headsign"
        :style="{
          '--bg': '#' + trip.route.color,
          '--fg': '#' + trip.route.textColor,
        }"
      >
        <img :src="trip.route.picto" width="24" />
        {{ trip.destination }}
      </div>
      <div class="guess-container" v-html="formattedGuess"></div>
    </div>
    <input
      class="catch-input"
      ref="input"
      v-model="guess"
      @keydown="onKeydown"
      type="text"
    />
  </div>
</template>

<style>
.game-input {
  position: fixed;
  z-index: 9999999;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
}

input.catch-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.visible-container {
  width: max-content;
}

.transfer-container {
  position: absolute;
  width: max-content;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  top: -20px;
  left: 50%;
  transform: translate(-50%,-100%);
  background: #fff;
  border-radius: 10em;
  padding: 10px 30px;
  font-family: Arial;
  border: 2px solid var(--color);
  transition: all .3s ease;
  
  & .key-indicator {
    background: #222;
    border: 2px solid #444;
    color: white;
    font: 10pt monospace;
    border-radius: 4px;
    padding: 2px 4px;
  }
}

.transfer-enter-from,
.transfer-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%);
}

.headsign {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  background: var(--bg);
  color: var(--fg);
  padding: 4px 5px;
  transition: background .3s ease, color .3s ease;
}

.guess-container {
  background: #0a0082;
  padding: 10px 30px;
  font-family: monospace;
  font-weight: bold;
  font-size: 20pt;
  text-align: center;

  & span {
    white-space: pre;
    --color: white;
    position: relative;
    display: inline-block;
    margin: 0 4px;
    border-bottom: 3px solid var(--color);
    color: var(--color);
    padding-bottom: 3px;
  }

  & .current {
    --color: #fffc;
    &:after {
      content: "";
      height: 70%;
      width: 2px;
      position: absolute;
      left: -5px;
      bottom: 15%;
      background: white;
      border-radius: 10em;
      animation: caret 1.2s steps(2, jump-none) infinite;
    }
  }

  & .incorrect {
    --color: red;
  }

  & .next {
    --color: #fff8;
  }
}

@keyframes caret {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
