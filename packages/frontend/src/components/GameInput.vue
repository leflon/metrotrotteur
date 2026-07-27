<script setup lang='ts'>
import { onMounted, ref, watch, useTemplateRef } from 'vue';

const props = defineProps<{
  word: string;
}>();
const emit = defineEmits<{ correct: [] }>();


const attempt = ref("");
const input = useTemplateRef<HTMLInputElement>('input');

onMounted(() => {
  input.value?.focus();
});

watch(attempt, (value) => {
  if (value === props.word) {
    emit('correct');
    attempt.value = '';
  }
});
</script>

<template>

<div class='game-input'>
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