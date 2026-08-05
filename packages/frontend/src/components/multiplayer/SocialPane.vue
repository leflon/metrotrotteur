<script setup lang="ts">
import { Check, Crown, Pencil, UserMinus, ShieldCheck } from '@lucide/vue';
import type { MultiplayerRoom } from '@metroclavier/shared';
import { ref } from 'vue';

const props = defineProps<{
  meId: string;
  players: MultiplayerRoom['players'];
  hostId: string;
}>();

const emit = defineEmits<{
  kick: [string];
  hostChange: [string];
  rename: [string];
}>();

const isEditingName = ref(false);
const newName = ref(props.players.find(p => p.id === props.meId)?.name ?? '');

const onRename = () => {
  if (newName.value.trim()) {
    emit('rename', newName.value.trim());
  }
  isEditingName.value = false;
};

const onRenameKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') onRename();
  if (e.key === 'Escape') isEditingName.value = false;
};

const startEditing = () => {
  newName.value = props.players.find(p => p.id === props.meId)?.name ?? '';
  isEditingName.value = true;
};
</script>

<template>
  <div class='social-pane'>
    <h2>Joueurs</h2>
    <div class='players-list'>
      <div
        class='player flex alc'
        v-for="player in players"
        :key="player.id"
        :class="{ me: player.id === meId, host: player.id === hostId, disconnected: !player.isConnected }"
      >
        <div class='player-identity flex alc f1'>
          <div v-if="player.id === meId && isEditingName" class='name-edit flex alc'>
            <input
              v-model='newName'
              class='name-input'
              @keydown='onRenameKeydown'
              autofocus
              maxlength="24"
            />
            <button class="discreet confirm-btn" @click="onRename">
              <Check :size="16" />
            </button>
          </div>
          <div class='name flex alc' v-else>
            <span class='player-name'>{{ player.name }}</span>
            <button
              v-if="player.id === meId"
              @click="startEditing"
              class='discreet edit-btn'
              title="Modifier mon pseudo"
            >
              <Pencil :size="14" />
            </button>
          </div>

          <!-- Badges -->
          <div class='badges flex alc'>
            <div class='badge host-badge' v-if="player.id === hostId" title="Hôte">
              <Crown :size="16" />
            </div>
            <div class='badge offline-badge' v-if="!player.isConnected" title="Hors ligne">
              ●
            </div>
          </div>
        </div>

        <!-- Host actions -->
        <div class='actions flex alc' v-if="meId === hostId && player.id !== meId">
          <button
            class='action-btn host-btn discreet'
            @click="emit('hostChange', player.id)"
            title="Rendre hôte"
          >
            <Crown :size="16" />
          </button>
          <button
            class='action-btn kick-btn discreet'
            @click="emit('kick', player.id)"
            title="Exclure"
          >
            <UserMinus :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.social-pane {
  padding: 12px;
  width: 30%;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.player {
  padding: 8px 10px;
  background: #fafafa;
  border: var(--border);
  border-radius: var(--xs-radius);
  gap: 6px;
  width: 100%;
  transition: background 0.2s ease, opacity 0.2s ease;
}

.player.me {
  background: color-mix(in srgb, var(--blue) 3%, white);
  border-color: color-mix(in srgb, var(--blue) 30%, transparent);
}

.player.disconnected {
  opacity: 0.5;
}

.player-identity {
  gap: 6px;
  min-width: 0;
}

.name {
  gap: 4px;
  min-width: 0;
}

.player-name {
  font: 11pt "Parisine";
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player.me .player-name {
  font-weight: bold;
}

.name-edit {
  gap: 4px;
}

.name-input {
  font: 11pt "Parisine";
  border: 1px solid var(--blue);
  border-radius: var(--xs-radius);
  padding: 2px 6px;
  outline: none;
  width: 140px;
  -webkit-user-select: text;
  user-select: text;
}

.edit-btn {
  color: #aaa;
  padding: 2px;
  &:hover {
    color: var(--blue);
  }
}

.confirm-btn {
  color: var(--jade);
  padding: 2px;
}

.badges {
  gap: 4px;
  flex-shrink: 0;
}

.badge {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100px;
  padding: 2px 4px;
  font-size: 8pt;
}

.host-badge {
  color: var(--yellow);
}

.offline-badge {
  color: #bbb;
  font-size: 7pt;
}

.actions {
  gap: 2px;
  flex-shrink: 0;
  margin-left: auto;
}

.action-btn {
  padding: 4px;
  border-radius: var(--xs-radius);
  transition: background 0.15s ease, color 0.15s ease;
}

.host-btn {
  color: #888;
  &:hover {
    color: var(--blue);
    background: color-mix(in srgb, var(--blue) 10%, transparent);
  }
}

.kick-btn {
  color: #888;
  &:hover {
    color: #d44;
    background: color-mix(in srgb, #d44 10%, transparent);
  }
}
</style>
