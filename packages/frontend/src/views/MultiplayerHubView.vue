<script setup lang="ts">
import AppHeader from "@/components/ui/AppHeader.vue";
import { api } from "@/lib/api";
import { Plus, RefreshCcw } from "@lucide/vue";
import type { MultiplayerRoom } from "@metroclavier/shared";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();

const isLoadingRooms = ref(true);
const rooms = ref<MultiplayerRoom[]>([]);

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
    <AppHeader></AppHeader>
    <div class="flex center f1">
      <div class="rooms-list-container">
        <h1 class="title">Salles de jeu</h1>
        <div class="toolbar">
          <button @click="createRoom">
            <Plus></Plus>
            Créer
          </button>
          <button>
            <RefreshCcw></RefreshCcw>
            Rafraîchir
          </button>
        </div>
        <div class="rooms-list">
          <div v-if="isLoadingRooms">Chargement des salles...</div>
          <div v-else-if="rooms.length === 0">Aucune salle</div>
          <div v-else>
            <div class="room" v-for="room in rooms">
              {{ JSON.stringify(room) }}
            </div>
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
  width: 80%;
  background: white;
  margin: 0 auto;
}

.rooms-list {
  border: var(--border);
  border-radius: var(--xs-radius);
  background: #eee;
  height: 400px;
  margin: 20px auto;
  width: calc(100% - 60px);
  margin-bottom: 30px;
}
</style>
