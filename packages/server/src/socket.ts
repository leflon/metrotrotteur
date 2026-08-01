import type { Player } from "@metroclavier/shared";
import { Server as Engine } from '@socket.io/bun-engine';
import { Server } from "socket.io";
import registerMultiplayerHandlers from "./lib/handlers";

export const engine = new Engine({
  cors: {
    origin: '*',
  }
});
export const io = new Server({
  cors: {
    origin: '*',
  }
});

function randomPlayerId(): string {
  const id = Math.random().toString(36).substring(2, 12);
  return `guest-${id}`;
}

io.bind(engine);

io.on('connection', (socket) => {
  const uid = randomPlayerId();
  const player: Player = {
    id: uid,
    name: uid,
    score: 0,
    isConnected: true,
  };
  socket.data.player = player;
  socket.emit('player-data', player);
  registerMultiplayerHandlers(io, socket)
});

