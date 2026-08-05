import type { MultiplayerRoom } from './types/Multiplayer';

export const SOCKET_TIMEOUT = 5_000;

export const DEFAULT_MULTIPLAYER_ROOM: MultiplayerRoom = {
  id: 'undef',
  name: 'undef',
  hostId: '',
  players: [],
  status: 'idle',
  gameParams: {
    gamemode: 'multi',
    network: 'metro',
    trip: '',
    rules: {
      easy: false,
    },
  },
  currentGameData: { timings: {}, willEndAt: null },
  maxPlayers: 8,
  password: '',
  chat: [],
};
