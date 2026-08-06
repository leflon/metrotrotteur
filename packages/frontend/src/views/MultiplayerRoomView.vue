<script setup lang="ts">
import GameParamsMenu from "@/components/GameParamsMenu.vue";
import GamePlay from "@/components/GamePlay.vue";
import ChatPane from "@/components/multiplayer/ChatPane.vue";
import SocialPane from "@/components/multiplayer/SocialPane.vue";
import AppHeader from "@/components/ui/AppHeader.vue";
import GameStartBanner from "@/components/ui/GameStartBanner.vue";
import { RoomConnection } from "@/lib/RoomConnection";
import { createSocket } from "@/lib/socket";
import { Check, Pencil, Settings } from "@lucide/vue";
import {
    type MultiplayerRoom,
    type Player,
    DEFAULT_MULTIPLAYER_ROOM,
} from "@metroclavier/shared";
import {
    computed,
    onMounted,
    onUnmounted,
    ref,
    watch
} from "vue";
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
const isEditingName = ref(false);
const editedName = ref("");

const isHost = computed(() => me.value.id === room.value.hostId);
const canLaunchGame = computed(
  () => me.value.id === room.value.hostId && room.value.status !== "playing",
);
const bannerText = computed(() =>
  room.value.status === "playing"
    ? "En jeu..."
    : isHost.value
      ? "Lancer"
      : "En attente de l'hôte",
);
let updateWasDistant = false;

// Game state
const startAtStopIndex = ref<number | undefined>();
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

  c.addEventListener("kicked", () => {
    router.push("/multi?reject_reason=kicked");
  });

  c.addEventListener("socket-replaced", () => {
    router.push("/multi?reject_reason=connection-replaced");
  });
}

const onNameKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape") isEditingName.value = false;
  else if (e.key === "Enter") editName();
};

const onNameEditStart = () => {
  isEditingName.value = true;
  editedName.value = room.value.name;
};

const editName = () => {
  const name = editedName.value.trim();
  if (!name) return;
  isEditingName.value = false;
  connection.updateRoom({ name });
};

const onReady = () => {
  connection.emitReady();
};

const onCorrect = (duration: number) => {
  connection.emitCorrect(duration);
};

const onBeforeUnload = (e: BeforeUnloadEvent) => {
  connection?.kill();
};

const leaveRoom = () => {
  connection.leaveRoom();
  router.push("/multi");
};

const cancelGame = () => {
  room.value.status = "idle";
  connection.updateRoom({ status: "idle" });
};

const onExit = () => {
  if (room.value.hostId === me.value.id) cancelGame();
  else leaveRoom();
};

onMounted(async () => {
  window.addEventListener("beforeunload", onBeforeUnload);
  if (connection) return;
  const roomId = route.params["id"]! as string;
  const socket = createSocket();
  socket.once("player-data", (p) => (me.value = p));

  connection = new RoomConnection(socket, roomId);

  const res = await connection.joinRoom(roomId);

  if (!res?.success) {
    if (res.error === "password") return (requirePassword.value = true);

    // Any other reason just gets the user back to the hub
    router.replace(`/multi?reject_reason=${res.error}`);
  } else {
    room.value = res.room;
    registerEvents(connection);
    if (res.room.status === 'playing') {
      // Rejoined during an ongoing game, should allow to directly hop back in
      startAtStopIndex.value = res.room.currentGameData.timings[me.value.id]?.length ?? 0;
    }
  }
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  connection?.kill();
});

watch(
  () => room.value.status,
  (newVal, oldVal) => {
    if (newVal === "playing" && oldVal !== "playing") {
      isGameLoading.value = true;
      isInGame.value = true;
    }
    if (newVal === 'idle') {
      startAtStopIndex.value = undefined;
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
  <div class="hf">
    <Transition name="fade" mode="out-in">
      <div class="lobby flex column hf" v-if="!isInGame">
        <app-header @exit="leaveRoom" />
        <Transition name="fade">
          <div class="params-container flex center" v-if="isParamsOpen">
            <game-params-menu
              v-model="room.gameParams"
              :closable="true"
              @close="isParamsOpen = false"
            />
          </div>
        </Transition>
        <div class="room-view window flex column">
          <div class="title flex alc">
            <h1 class="flex alc">
              <template v-if="!isEditingName">
                {{ room.name }}
                <button class="discreet" v-if="isHost" @click="onNameEditStart">
                  <Pencil color="white" :size="16" />
                </button>
              </template>
              <template v-else>
                <input @keydown="onNameKeyDown" v-model="editedName" />
                <button class="discreet" @click="editName">
                  <Check color="white" :size="16" />
                </button>
              </template>
            </h1>
            <button v-if="isHost" @click="isParamsOpen = true">
              <settings />
              Paramètres
            </button>
          </div>
          <div class="room-view-panes flex f1">
            <social-pane
              class="pane"
              :players="room.players"
              :maxPlayers="room.maxPlayers"
              :hostId="room.hostId"
              :meId="me.id"
              @rename="(name) => connection.rename(name)"
              @kick="(id) => connection.kick(id)"
              @host-change="(id) => connection.makeHost(id)"
            />
            <chat-pane
              class="pane f1"
              :messages="room.chat"
              :players="room.players"
              @send="(msg) => connection.sendChat(msg)"
            />
          </div>
        </div>
        <game-start-banner
          :params="room.gameParams"
          :readonly="!canLaunchGame"
          :text="bannerText"
          :displayDetails="true"
          @play="connection.startGame()"
        ></game-start-banner>
      </div>
      <div class="hf game" v-else>
        <game-play
          :params="room.gameParams"
          :multiplayerRoom="room"
          :loading="isGameLoading"
          :startAt="startAtStopIndex"
          @ready="onReady"
          @correct="onCorrect"
          @end="isInGame = false"
          @exitInGame="onExit"
        ></game-play>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
h1 {
  --color: white;
  gap: 5px;
}
.pane {
  height: 100%;
  overflow: hidden;
  @media screen and (max-width: 600px) {
    height: auto;
    overflow: hidden;
  }
}
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

.lobby {
  justify-content: space-between;
  padding-bottom: 20px;
  gap: 10px;
}

.room-view {
  height: 600px;
  overflow: hidden;
}
.room-view-panes {
  overflow: hidden;

  @media screen and (max-width: 600px) {
    flex-direction: column;
  }
}
</style>
