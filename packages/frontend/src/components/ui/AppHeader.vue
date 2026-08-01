<script setup lang="ts">
import { ArrowLeftToLine } from '@lucide/vue';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const isHome = computed(() => route.path === '/');
</script>

<template>
<div class='app-header'>
  <button v-if='!isHome' class='back' @click='router.go(-1)'>
    <ArrowLeftToLine></ArrowLeftToLine>
    Retour
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