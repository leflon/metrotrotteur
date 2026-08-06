<script setup lang="ts">
import RoomButton from "@/components/multiplayer/RoomButton.vue";
import AppHeader from "@/components/ui/AppHeader.vue";
import { api } from "@/lib/api";
import { Plus, RefreshCcw, X } from "@lucide/vue";
import type { MultiplayerRoom } from "@metroclavier/shared";
import type { emptyStyle } from "maplibre-gl";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const ERROR_CODE_MESSAGES: Record<string, string> = {
  'kicked': 'Vous avez été expulsé de la salle.',
  'connection-replaced': 'Vous vous êtes connecté à la salle via un autre onglet.',
  'not-found': 'La salle demandée n\'existe pas.'
};

const router = useRouter();
const route = useRoute();

const isLoadingRooms = ref(true);
const rooms = ref<MultiplayerRoom[]>([]);

const orderedRooms = computed(() => {
  return [...rooms.value].sort((a, b) => {
    const aJoinable = a.status === 'idle' && a.players.length < a.maxPlayers;
    const bJoinable = b.status === 'idle' && b.players.length < b.maxPlayers;

    return Number(bJoinable) - Number(aJoinable);
  });
});

const errorMessage = computed(() => {
  const code = route.query['reject_reason'] as string;
  if (code) {
    return ERROR_CODE_MESSAGES[code] ?? code
  }
});

const removeError = () => {
  router.replace({ query: {} });
}

const fetchRooms = async () => {
  const res = await api.get("multi/rooms");
  rooms.value = res;
};

const createRoom = async () => {
  const { roomId } = await api.post('multi/create-room');
  router.push(`/multi/${roomId}`);
}

onMounted(async () => {
  await fetchRooms();
  isLoadingRooms.value = false;
});
</script>

<template>
  <div class="f1 flex column">
    <AppHeader exitHref="/"></AppHeader>
    <div class="flex center f1">
      <div class="rooms-list-container">
        <h1 class="title">Salles de jeu</h1>
        <div class='error flex center' v-if='errorMessage'>
          <span>{{errorMessage}}</span>
          <button class="discreet" @click="removeError"><X :size="16" color="white" /></button>
        </div>
        <div class="toolbar flex alc">
          <button @click="createRoom">
            <Plus></Plus>
            Créer
          </button>
          <button @click="fetchRooms">
            <RefreshCcw></RefreshCcw>
            Rafraîchir
          </button>
        </div>
        <div class="rooms-list" :class="{ empty: rooms.length === 0 }">
          <div v-if="isLoadingRooms">Chargement des salles...</div>
          <div v-else-if="rooms.length === 0">Aucune salle</div>
          <div v-else>
            <RoomButton v-for="room in orderedRooms" :room="room" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rooms-list-container {
  border: var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 800px;
  max-width: 80%;
  background: white;
  margin: 0 auto;
}

.error {
  text-align: center;
  margin: 10px auto;
  background: #f008;
  width: calc(100% - 60px);
  border: 1.5px solid #f00;
  border-radius: var(--xs-radius);
  padding: 5px;
  color: white;

  & button {
    position: absolute;
    right: 10px;
  }
}

.rooms-list {
  border: var(--border);
  border-radius: var(--xs-radius);
  background: #eee;
  height: 400px;
  padding: 0 10px;
  margin: 20px auto;
  width: calc(100% - 60px);
  margin-bottom: 30px;
  overflow: auto;

  &.empty {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.toolbar {
  width: calc(100% - 60px);
  margin: 0 auto;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
