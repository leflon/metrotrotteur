<script setup lang="ts">
import GameParamsMenu from "@/components/GameParamsMenu.vue";
import GamePlay from "@/components/GamePlay.vue";
import SocialPane from "@/components/multiplayer/SocialPane.vue";
import { RoomConnection } from "@/lib/RoomConnection";
import { createSocket } from "@/lib/socket";
import { type MultiplayerRoom, type Player, DEFAULT_MULTIPLAYER_ROOM } from "@metroclavier/shared";
import { io } from "socket.io-client";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

let connection: RoomConnection;

const room = ref<MultiplayerRoom>(structuredClone(DEFAULT_MULTIPLAYER_ROOM));

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
const isInGame = ref(false);
const isGameLoading = ref(false);

function registerEvents(c: RoomConnection) {
  c.addEventListener("update-room", (_e: Event) => {
    const e = _e as CustomEvent;
    const data = e.detail as Partial<MultiplayerRoom>;
    room.value = { ...room.value, ...data };
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
  //window.addEventListener("beforeunload", onBeforeUnload);
  const roomId = route.params["id"]! as string;
  const socket = createSocket();
  socket.once("player-data", (p) => (me.value = p));

  connection = new RoomConnection(socket, roomId);

  const res = await connection.joinRoom(roomId);
  console.log('cal');
  console.log({res});

  if (!res?.success) {
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
  if (newVal === 'playing') {
    isGameLoading.value = true;
    isInGame.value = true;
  }
}, { deep: true });

watch(
  () => room.value.gameParams,
  (params) => {
    if (room.value.hostId === me.value.id)
      connection.updateRoom({gameParams: params });
  },
  { deep: true },
);
</script>

<template>
  <div class='f1'>
    <div class="lobby" v-if="!isInGame">
      <game-params-menu
        v-if="room.hostId === me.id"
        v-model="room.gameParams"
      />
      <div class='room-view window'>
        <h1>{{room.name}}</h1>
        <social-pane
          :players="room.players"
          :hostId="room.hostId"
          :meId="me.id"
          @rename="(name) => connection.rename(name)"
          @kick="(id) => connection.kick(id)"
          @host-change="(id) => connection.makeHost(id)"
        />
      </div>
      <button @click="connection.startGame()">play</button>
    </div>
    <div class='hf game' v-else>
      <game-play :params="room.gameParams" :multiplayerRoom="room" @correct='onCorrect' @end="isInGame = false"></game-play>
    </div>
  </div>
</template>

<style scoped>

</style>
