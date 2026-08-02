<script setup lang="ts">
import GameParamsMenu from "@/components/GameParamsMenu.vue";
import GamePlay from "@/components/GamePlay.vue";
import MultiplayerGameData from "@/components/ui/MultiplayerGameData.vue";
import { RoomConnection } from "@/lib/socket";
import { type Player, type MultiplayerRoom, type GameTrip } from "@metroclavier/shared";
import { io } from "socket.io-client";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

let connection: RoomConnection;

const room = ref<MultiplayerRoom & { [x: string]: any }>({
  id: "",
  name: "",
  password: "",
  maxPlayers: -1,
  hostId: "",
  status: "idle",
  players: [],
  currentGameData: { timings: {} },
  gameParams: {
    gamemode: "multi",
    network: "metro",
    rules: { easy: false },
    trip: "",
  },
});

const me = ref<Player>({
  id: "",
  name: "",
  isConnected: false,
  score: -1,
});

// Room joining state
const requirePassword = ref(false);
const invalidPassword = ref(false);

// Game state
const isGameLoading = ref(false);

function registerEvents(c: RoomConnection) {
  c.addEventListener("update-room", (_e: Event) => {
    const e = _e as CustomEvent;
    const data = e.detail as Partial<MultiplayerRoom>;
    for (const [key, val] of Object.entries(data)) {
      console.log('updating');
      room.value[key] = val;
    }
  });

  c.addEventListener("all-ready", () => {
    isGameLoading.value = false;
  });
}

const onReady = () => {
  connection.emitReady();
};

const onCorrect = (duration: number) => {
  connection.emitCorrect(duration);
}

function onBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
}

onMounted(async () => {
  window.addEventListener("beforeunload", onBeforeUnload);

  const socket = io(import.meta.env.VITE_PUBLIC_API_URL);
  socket.once("player-data", (p) => (me.value = p));

  connection = new RoomConnection(socket);

  const roomId = route.params["id"]! as string;
  const res = await connection.joinRoom(roomId);

  if (!res.success) {
    if (res.error === "password") return (requirePassword.value = true);

    // Any other reason just gets the user back to the hub
    router.replace(`/multi?reject_reason=${res.error}`);
  } else {
    room.value = res.room;
    registerEvents(connection);
  }
});
onUnmounted(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
});

watch(() => room.value.status, (newVal) => {
  if (newVal === 'playing')
    isGameLoading.value = true;
});

watch(
  () => room.value.gameParams,
  (params) => {
    connection.updateRoom({gameParams: params });
  },
  { deep: true },
);
</script>

<template>
  <div class='f1'>
    <div class="lobby" v-if="room.status === 'idle'">
      <game-params-menu
        v-if="room.hostId === me.id"
        v-model="room.gameParams"
      />
      <button @click="connection.startGame()">play</button>
    </div>
    <div class='hf game' v-else>
      <game-play :params="room.gameParams" :multiplayerRoom="room" @correct='onCorrect'></game-play>
    </div>
  </div>
</template>

<style scoped>

</style>
