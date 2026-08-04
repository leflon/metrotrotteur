import { SOCKET_TIMEOUT, type Player } from "@metroclavier/shared";
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
  },
  pingInterval: SOCKET_TIMEOUT / 2,
  pingTimeout: SOCKET_TIMEOUT,
});

// User token -> Room -> PlayerId
export const USER_STORE = new Map<string, Map<string, string>>();


io.bind(engine);

io.on('connection', (socket) => {
  registerMultiplayerHandlers(io, socket)
});

