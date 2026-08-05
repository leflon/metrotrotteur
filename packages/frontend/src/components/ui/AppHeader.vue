<script setup lang="ts">
import { ArrowLeftToLine } from '@lucide/vue';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{
  exitButtonText?: string;
  exitHref?: string;
  hideExit?: boolean;
}>();
const emit = defineEmits<{
  exit: []
}>();

const route = useRoute();
const router = useRouter();

const onExit = () => {
  emit('exit');
  if (props.exitHref)
    router.push(props.exitHref);
}

</script>

<template>
<div class='app-header'>
  <button v-if='!hideExit' class='back' @click='onExit'>
    <ArrowLeftToLine></ArrowLeftToLine>
    {{exitButtonText ?? 'Retour'}}
  </button>
</div>
</template>

<style scoped>
.app-header {
  padding: 15px;
  width: 100%;
}

.back {
  border: none;
  background: var(--blue);
  color: white;
}
</style>