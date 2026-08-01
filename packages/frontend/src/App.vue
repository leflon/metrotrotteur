<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import "./index.css";
import { RouterView } from "vue-router";
import { api } from "./lib/api";
import { ArrowLeftToLine } from "@lucide/vue";
import { resources } from "./stores/resources";

const N_RESOURCES_TO_DOWNLOAD = 2;
const currentDownload = ref<number>(0);

onMounted(async () => {
  const routes = await api.get("routes");
  resources.GAME_ROUTES = routes;
  currentDownload.value++;

  const map = await api.get("map.json");
  currentDownload.value++;
  resources.GAME_GEOJSON = map;

  // Let the progress bar move before shutting down the loading indicator
  setTimeout(() => (currentDownload.value = -1), 300);
});

const progressWidth = computed(
  () =>
    Math.floor((currentDownload.value / N_RESOURCES_TO_DOWNLOAD) * 100) + "%",
);
</script>

<template>
  <Transition name="fade">
    <div
      v-if="currentDownload >= 0"
      class="loading-indicator cloud flex column center"
      :style="{ '--progress': progressWidth }"
    >
      <div class="text flex alc">
        <div>Chargement des ressources</div>
        <div class="spinner"></div>
      </div>
      <div class="progress">
        <div class="progress-fill"></div>
      </div>
    </div>
  </Transition>
  <router-view v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
</template>

<style scoped>
.loading-indicator {
  z-index: 999999999999;
  position: fixed;
  top: 10px;
  right: 10px;
  gap: 5px;

  & .text {
    gap: 5px;
    font: 8pt "Parisine";
  }
}

.spinner {
  width: 10px;
  height: 10px;
  border: 2px solid #444;
  border-top-color: transparent;
  border-radius: 50%;
  animation: rotate 1s linear infinite;
}

.progress {
  width: 100%;
  height: 3px;
  background: #fff4;
  border-radius: 10em;
  overflow: hidden;

  & .progress-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: var(--progress);
    background: #1f9aff;
    border-radius: 10em;
    transition: width 0.25s ease-out;
  }
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
