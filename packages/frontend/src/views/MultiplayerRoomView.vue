<script setup lang="ts">
import GameParamsMenu from "@/components/GameParamsMenu.vue";
import { RoomConnection } from "@/lib/socket";
import { type Player, type MultiplayerRoom } from "@metroclavier/shared";
import { io } from "socket.io-client";
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

let connection: RoomConnection;

const room = ref<MultiplayerRoom>({
  id: "",
  name: "",
  password: "",
  maxPlayers: -1,
  hostId: "",
  status: "idle",
  players: [],
  gameParams: {
    gamemode: 'multi',
    network: 'metro',
    rules: { easy: false },
    trip: ''
  }
});

const me = ref<Player>({
  id: "",
  name: "",
  isConnected: false,
  score: -1,
});

const requirePassword = ref(false);
const invalidPassword = ref(false);

function registerEvents(c: RoomConnection) {
  c.addEventListener("start", () => {
    room.value.status = "playing";
  });

  c.addEventListener('update-room', (_e: Event) => {
    const e = _e as CustomEvent;
    room.value = e.detail;
  });
}

onMounted(async () => {
  const socket = io(import.meta.env.VITE_PUBLIC_API_URL);
  socket.once('player-data', p => me.value = p);
  
  connection = new RoomConnection(socket);

  const roomId = route.params["id"]! as string;
  const res = await connection.joinRoom(roomId);

  if (!res.success) {
    if (res.error === "password") return (requirePassword.value = true);

    // Any other reason just gets the user back to the hub
    router.push(`/multi?reject_reason=${res.error}`);
  } else {
    room.value = res.room;
    registerEvents(connection);
  }
});

watch(room.value.gameParams, (params) => {
  connection.updateRoom(room.value);
}, {deep: true});
</script>

<template>
  <div>
    {{me.name}}
    <hr></hr>
    <div v-for="p in room.players">
      <b>{{p.name}}</b>
    </div>
    <game-params-menu v-model="room.gameParams" />
    <button @click="connection.startGame()">play</button>
  </div>
</template>
