<script setup lang="ts">
import { api } from "@/lib/api";
import { type GameTrip, type GameParams } from "@metroclavier/shared";
import { computed, ref } from "vue";
import GameParamsMenu from "@/components/GameParamsMenu.vue";
import GameStartBanner from "@/components/ui/GameStartBanner.vue";
import GamePlay from "@/components/GamePlay.vue";
import { resources } from "@/stores/resources";

const isPlaying = ref(false);

const params = ref<GameParams>({
  gamemode: "solo",
  network: "metro",
  trip: "",
  rules: {
    easy: false,
  },
});

const route = computed(() =>
  Object.values(resources.GAME_ROUTES).find((r) =>
    r.trips.some((t) => t.id === params.value.trip),
  ),
);

const tripData = ref<GameTrip | null>(null);

const onPlay = async () => {
  const data = (await api.get(`trip/${params.value.trip}`)) as GameTrip;
  tripData.value = data;
  isPlaying.value = true;
};

const onEnd = () => {
  isPlaying.value = false;
};
</script>
<template>
  <div class="pregame" v-if="!isPlaying">
    <div class='menu-container'>
      <game-params-menu class='menu' v-model="params"></game-params-menu>
    </div>
    <game-start-banner
      class='start'
      :enabled="params.trip !== ''"
      :color="route?.color"
      :textColor="route?.textColor"
      @play='onPlay'
    >
    </game-start-banner>
  </div>
  <game-play v-else :params='params' @end='onEnd'></game-play>
</template>

<style scoped>
.pregame {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 10px;
  overflow: hidden;
}

.menu-container {
  position: relative;
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 2px;
  
  & .menu {
    max-height: 100%;
  }
}

.start {
  margin-bottom: 10px;
  flex-shrink: 0;
}
</style>