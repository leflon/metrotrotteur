<script setup lang="ts">
import type { GameTransfer, GameTrip } from "@metroclavier/shared";
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";

const props = defineProps<{
  currentStop: string;
  trip: GameTrip;
  transfers: GameTransfer[];
}>();
const emit = defineEmits<{ correct: []; transfer: [string], correctChar: [] }>();

const guess = ref("");
const guessBefore = ref("");
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

const FORBIDDEN_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

const onKeydown = (e: KeyboardEvent) => {
  if (FORBIDDEN_KEYS.includes(e.key)) return e.preventDefault();
  
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
  } else {
    if (guess.value.length > guessBefore.value.length) {
      const index = guess.value.length - 1;
      const letter = guess.value[index];
      const correct = props.currentStop[index];
      if (letter === correct)
        emit('correctChar');
    } // else it was a deletion, don't emit anything.
    guessBefore.value = guess.value;
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
      <div class='input-container'>
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
  position: relative;
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
  display: flex;
  flex-direction: column;
  align-items: center;
}

.transfer-container {
  --height: 45px;
  box-sizing: border-box;
  z-index: -1;
  width: max-content;
  height: var(--height);
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: #fff;
  border-radius: 10em;
  font-family: 'Parisine';
  border: 2px solid var(--color);
  transition: all .5s ease;
  margin-bottom: 10px;
  
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
  margin-bottom: calc( -1 * var(--height));
}

.input-container {
  width: max-content;
  box-shadow: 0px -9px 22px 12px rgba(0,0,0,0.1);
}

.headsign {
  z-index: 20;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  background: white;
  font: 12pt 'Parisine';
  color: var(--black);
  border-radius: 2px 2px 0px 0px;
  padding: 4px 5px;
  transition: background .3s ease, color .3s ease;
}

.guess-container {
  background: var(--blue);
  padding: 10px 30px;
  font-family: monospace;
  font-size: 18pt;
  font-weight: bold;
  text-align: center;

  & span {
    white-space: pre;
    --color: white;
    position: relative;
    display: inline-block;
    color: var(--color);
    margin: 0 3px;
    padding-bottom: 3px;
    &:before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      height: 2px;
      background: var(--color);
    }
  }

  & .current {
    --color: #fffc;
    &:after {
      content: "";
      height: 70%;
      width: 2px;
      position: absolute;
      left: -3px;
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

.game-input:has(input:not(:focus)) .current:after {
  display: none;
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
