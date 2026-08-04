<script setup lang="ts">
import { getRouteFromTrip } from "@/stores/resources";
import { Ban, DoorOpen, Lock, LogIn, Users } from "@lucide/vue";
import type { MultiplayerRoom } from "@metroclavier/shared";
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const props = defineProps<{
  room: MultiplayerRoom;
}>();

const route = computed(() => getRouteFromTrip(props.room.gameParams.trip));
const color = computed(() => route.value?.color ?? "aaa");

const canJoin = computed(
  () =>
    props.room.status === "idle" &&
    props.room.players.length < props.room.maxPlayers,
);
const btnText = computed(() =>
  canJoin.value
    ? "Rejoindre"
    : props.room.status === "playing"
      ? "En jeu"
      : "Salle comble",
);

const join = () => {
  router.push(`/multi/${props.room.id}`);
};
</script>

<template>
  <div class="room flex alc" 
    tabindex="0" 
    :style="{ '--color': '#' + color }"
    :class="{ joinable: canJoin }"
  >
    <div class="room-icon flex center">
      <Lock :size="32" v-if="room.password" />
      <DoorOpen v-else :size="32" />
    </div>
    <div class="room-text flex alc f1">
      <div class="room-name">{{ room.name }}</div>
      <div class="room-infos flex alc">
        <div class="room-info">
          <Users :size="16" />
          <span>{{ room.players.length }} / {{ room.maxPlayers }}</span>
        </div>
        <div class="room-info" v-if="route">
          <img :src="route.picto" width="16" />
          <span>Ligne {{ route.name }}</span>
        </div>
      </div>
    </div>
    <div class="room-join">
      <button class="big" :disabled="!canJoin" @click="join">
        <LogIn v-if="canJoin" /><Ban v-else /> {{ btnText }}
      </button>
    </div>
  </div>
</template>
<style scoped>
.room {
  background: var(--white);
  border: var(--border);
  border-radius: var(--radius);
  margin: 10px auto;
  padding: 10px 0;
  padding-right: 10px;
  transition: 0.3s ease;
  &:not(.joinable) {
    opacity: .5;
  }
  &.joinable {
    cursor: pointer;
  }
  &.joinable:hover {
    --mix: color-mix(in srgb, var(--color) 20%, var(--white));
    border-color: var(--color);
    background: var(--mix);
    box-shadow: 0px 10px 10px var(--mix);
  }
}

.room-icon {
  padding: 0 10px;
}

.room-text {
  gap: 10px;
}

.room-name {
  font: bold 14pt "Parisine";
}

.room-infos {
  gap: 10px;
}

.room-info {
  display: flex;
  align-items: enter;
  gap: 5px;
  font-size: 10pt;
  color: #555;
}

.big {
  font-size: 14pt;
  --color: var(--blue);
  --text: var(--white);
  padding: 4px 8px;
}
</style>
