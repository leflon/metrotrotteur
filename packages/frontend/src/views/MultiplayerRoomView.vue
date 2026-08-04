<script setup lang="ts">
import GameParamsMenu from "@/components/GameParamsMenu.vue";
import GamePlay from "@/components/GamePlay.vue";
import SocialPane from "@/components/multiplayer/SocialPane.vue";
import GameStartBanner from "@/components/ui/GameStartBanner.vue";
import { RoomConnection } from "@/lib/RoomConnection";
import { createSocket } from "@/lib/socket";
import { Settings } from "@lucide/vue";
import {
  type MultiplayerRoom,
  type Player,
  DEFAULT_MULTIPLAYER_ROOM,
} from "@metroclavier/shared";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

let connection: RoomConnection;

const room = ref<MultiplayerRoom>(structuredClone(DEFAULT_MULTIPLAYER_ROOM));

const me = ref<Player>({
  id: "me",
  name: "Moi",
  isConnected: false,
  score: -1,
});


// Room joining state
const requirePassword = ref(false);
const invalidPassword = ref(false);

// Room state
const isParamsOpen = ref(false);
const isHost = computed(() => me.value.id === room.value.hostId);
let updateWasDistant = false;

// Game state
const isInGame = ref(false);
const isGameLoading = ref(false);

function registerEvents(c: RoomConnection) {
  c.addEventListener("update-room", (_e: Event) => {
    const e = _e as CustomEvent;
    const data = e.detail as Partial<MultiplayerRoom>;
    updateWasDistant = true;
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
};

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
  console.log("cal");
  console.log({ res });

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

watch(
  () => room.value.status,
  (newVal) => {
    if (newVal === "playing") {
      isGameLoading.value = true;
      isInGame.value = true;
    }
  },
  { deep: true },
);

watch(
  () => room.value.gameParams,
  (params) => {
    if (room.value.hostId === me.value.id && !updateWasDistant)
      connection.updateRoom({ gameParams: params });
    if (updateWasDistant) updateWasDistant = false;
  },
  { deep: true },
);
</script>

<template>
  <div class="f1">
    <div class="lobby" v-if="!isInGame">
    <Transition name='fade'>
      <div class='params-container flex center' v-if="isParamsOpen">
        <game-params-menu
          v-model="room.gameParams"
          :closable="true"
          @close="isParamsOpen = false"
        />
      </div>
    </Transition>
      <div class="room-view window">
        <div class='title flex alc'>
        <h1>{{ room.name }}</h1>
        <button v-if="isHost" @click="isParamsOpen = true">
          <settings />
          Paramètres
        </button>
        </div>
        <social-pane
          :players="room.players"
          :hostId="room.hostId"
          :meId="me.id"
          @rename="(name) => connection.rename(name)"
          @kick="(id) => connection.kick(id)"
          @host-change="(id) => connection.makeHost(id)"
        />
      </div>
      <game-start-banner
        :params="room.gameParams"
        :readonly="!isHost"
        :text="isHost ? 'Lancer' : 'En attente de l\'hôte'"
        :displayDetails="true"
        @play="connection.startGame()"
      ></game-start-banner>
    </div>
    <div class="hf game" v-else>
      <game-play
        :params="room.gameParams"
        :multiplayerRoom="room"
        @correct="onCorrect"
        @end="isInGame = false"
      ></game-play>
    </div>
  </div>
</template>

<style scoped>
.params-container {
  z-index: 9999999;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
}
.title {
  gap: 10px;
}
</style>
