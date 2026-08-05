<script setup lang="ts">
import { ArrowDown, Send } from "@lucide/vue";
import type { ChatMessage, MultiplayerRoom } from "@metroclavier/shared";
import { ref, useTemplateRef, watch } from "vue";

const props = defineProps<{
  messages: ChatMessage[];
  players: MultiplayerRoom["players"];
}>();

const emit = defineEmits<{
  send: [string];
}>();

const message = ref("");
const isAutoScrolling = ref(true);

const messagesContainer = useTemplateRef("messages");

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter") onSend();
}

function onSend() {
  const msg = message.value.trim();
  if (msg) {
    emit("send", msg);
    message.value = "";
  }
}

function onScroll(e: Event) {
  const target = e.target as HTMLDivElement;
  const fullyScrolled =
    Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 30;
  isAutoScrolling.value = fullyScrolled;
}

watch(
  () => props.messages,
  () => {
    setTimeout(() => {
      if (!isAutoScrolling.value || !messagesContainer.value) return;
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
      });
    }, 10);
  },
  { immediate: true },
);

function scrollDown() {
  if (!messagesContainer.value) return;
  messagesContainer.value.scrollTo({
    top: messagesContainer.value.scrollHeight,
    behavior: "smooth",
  });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleTimeString();
}

function username(userId: string) {
  return props.players.find((p) => p.id === userId)?.name ?? userId;
}
</script>

<template>
  <div class="chat-container flex column">
    <h2>Chat</h2>
    <div class="chat-box f1 flex column">
      <Transition name="slide">
        <button
          class="scroll-cta flex alc"
          v-if="!isAutoScrolling"
          @click="scrollDown"
        >
          <ArrowDown /> Messages récents <ArrowDown />
        </button>
      </Transition>
      <div class="messages f1" ref="messages" @scroll="onScroll">
        <div class="message flex alc" v-for="msg in messages">
          <div class="time">{{ formatDate(msg.createdAt) }}</div>
          <div class="author">{{ username(msg.author) }}</div>
          <div class="content">{{ msg.content }}</div>
        </div>
      </div>
      <div class="input flex">
        <input
          v-model="message"
          placeholder="Envoyer un message..."
          @keydown="onKeyDown"
        />
        <button class="big" @click="onSend"><Send /></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  padding: 10px;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

h2 {
  width: 100%;
}

.chat-box {
  border: var(--border);
  border-radius: var(--xs-radius);
  width: 100%;
  overflow: hidden;
}

.messages {
  overflow: auto;
}

.scroll-cta {
  z-index: 10;
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--blue);
  color: white;
  font: bold 12pt "Parisine";
  padding: 4px 8px;
  border-radius: 10em;
  box-shadow: 0px 10px 10px color-mix(in srgb, var(--blue) 30%, transparent);
  transition: 0.1s ease;
  &:hover {
    transform: translateX(-50%) scale(0.98) !important;
  }
  &:active {
    transform: translateX(-50%) scale(0.95) !important;
  }
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translate(-50%, 100%);
}

.message {
  padding: 2px;
  gap: 5px;

  &:nth-child(odd) {
    background: #eee;
  }
}
.message .time {
  font: 10pt "Parisine";
  opacity: 0.5;
}

.message .author {
  color: var(--blue);
  font-weight: bold;
}

.input {
  z-index: 20;
  height: 30px;
  overflow: hidden;
  border-top: 1px solid #eee;

  & input {
    flex: 1;
    appearance: none;
    border-radius: 0;
    padding: 0 5px;
    border: none;
    overflow: hidden;
    outline: none;
    &:focus {
      background-color: #eee;
    }
  }
}

button {
  --color: var(--blue);
  --text: white;
  border-radius: 0;
  outline-color: var(--yellow);
  &:hover {
    transform: none !important;
  }
}
</style>
