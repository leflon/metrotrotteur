<script setup lang='ts'>
import type { GameTransfer } from '@metroclavier/shared';
import { onMounted, ref, watch, useTemplateRef } from 'vue';

const props = defineProps<{
  word: string;
  transfers: GameTransfer[]
}>();
const emit = defineEmits<{ correct: [], transfer: [string] }>();


const attempt = ref("");
const transferIndex = ref(0);


const input = useTemplateRef<HTMLInputElement>('input');

onMounted(() => {
  input.value?.focus();

  input.value?.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      onTransfer();
    }
  });
});

const onTransfer = () => {
  if (props.transfers.length === 0) return;
  emit('transfer', props.transfers[transferIndex.value]!.trip);
  if (transferIndex.value === props.transfers.length - 1)
    transferIndex.value = 0;
  else
    transferIndex.value++;
}

watch(attempt, (value) => {
  if (value === props.word) {
    emit('correct');
    attempt.value = '';
    transferIndex.value = 0;
  }
});
</script>

<template>

<div class='game-input'>
  <div v-if="transfers.length > 0">
    TAB: {{transfers[transferIndex]?.route.name}} - {{transfers[transferIndex]?.destination}}
  </div>
  <div class='target'>{{props.word}}</div>
  <input type='text' v-model="attempt" ref="input"></input>
</div>
</template>

<style scoped>
.game-input {
  position: fixed;
  z-index: 9999999;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
}
</style>