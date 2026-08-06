import type { Server, Socket } from "socket.io";
import type { Player } from "@metroclavier/shared";
import MultiplayerRoom from "./MultiplayerRoom";
import type { MultiplayerRoom as MultiplayerRoomData } from "@metroclavier/shared";
import { USER_STORE } from "@/socket";

function randomPlayerId(): string {
  const id = Math.random().toString(36).substring(2, 12);
  return `guest-${id}`;
}

function withContext(
  socket: Socket,
  handler: (room: MultiplayerRoom, player: Player) => void,
) {
  return () => {
    const roomId = socket.rooms.values().toArray().at(-1);
    const room = MultiplayerRoom.ROOMS[roomId ?? ""];
    const player = socket.data.player as Player;
    if (!room || !player) return;
    handler(room, player);
  };
}

export default function registerMultiplayerHandlers(
  io: Server,
  socket: Socket,
) {
  if (!USER_STORE.has(socket.handshake.auth.token)) {
    USER_STORE.set(socket.handshake.auth.token, new Map());
  }

  socket.on(
    "disconnecting",
    withContext(socket, (room, player) => {
      if (!room.isActiveSocket(player.id, socket.id)) {
        return;
      }
      room.playerDisconnected(player.id);
      io.to(room.id).emit("update-room", {
        players: room.players,
        hostId: room.hostId,
      });
    }),
  );

  socket.on("join-room", ({ roomId, password }, callback) => {
    const room = MultiplayerRoom.ROOMS[roomId];


    if (!room) {
      callback({ success: false, error: "not-found" });
      return;
    }
    if (room.password && room.password !== password) {
      callback({ success: false, error: "password" });
      return;
    }
    try {
      const uid = USER_STORE.get(socket.handshake.auth.token)!.get(room.id);
      let userData = room.players.find((p) => p.id === uid);
      if (userData) {
        // Reconnecting
        if (userData.isConnected) {
          const oldSocketId = room.getActiveSocket(userData.id);
          if (oldSocketId && oldSocketId !== socket.id) {
            io.to(oldSocketId).emit("socket-replaced");
          }
          room.setActiveSocket(userData.id, socket.id);
        }
        userData.isConnected = true;
        room.playerReconnected(userData.id);
      } else {
        // New player
        const id = randomPlayerId();
        userData = {
          id,
          name: socket.handshake.auth.name?.slice(0, 32) ?? id,
          score: 0,
          isConnected: true,
        };
        room.addPlayer(userData);
        USER_STORE.get(socket.handshake.auth.token)!.set(room.id, userData.id);
      }

      socket.data.player = userData;
      room.setActiveSocket(userData.id, socket.id);
      socket.emit("player-data", userData);

      io.to(room.id).emit("update-room", {
        players: room.players,
        hostId: room.hostId,
      });
      socket.join(room.id);
      room.addEventListener("player-removed", () => {
        socket.emit("update-room", {
          players: room.players,
          hostId: room.hostId,
        });
      });
      callback({ success: true, room });
    } catch (error: unknown) {
      console.error(error);
      callback({ success: false, error: (<Error>error).message });
    }
  });

  socket.on(
    "start-game",
    withContext(socket, (room, player) => {
      if (room.hostId !== player.id) return;
      if (room.startGame()) {
        io.to(room.id).emit("update-room", {
          status: "playing",
          currentGameData: room.currentGameData,
        });
      }
    }),
  );

  socket.on(
    "ready",
    withContext(socket, (room, player) => {
      const allReady = room.playerReady(player.id);
      if (allReady) io.to(room.id).emit("all-ready");
    }),
  );

  socket.on("update-room", (data: Partial<MultiplayerRoomData>) =>
    withContext(socket, (room, player) => {
      if (room.hostId !== player.id) return;
      room.update(data);
      io.to(room.id).emit("update-room", data);
    })(),
  );

  socket.on("correct", (duration: number) =>
    withContext(socket, (room, player) => {
      room.playerCorrect(player.id, duration);
      io.to(room.id).emit("update-room", {
        currentGameData: room.currentGameData,
      });
      if (room.currentGameData.willEndAt !== null) {
        function onEnd() {
          io.to(room.id).emit("update-room", {
            status: "idle",
            currentGameData: room.currentGameData,
          });
          room.removeEventListener("end", onEnd);
        }
        room.addEventListener("end", onEnd);
      }
    })(),
  );

  socket.on("rename", (name: string) =>
    withContext(socket, (room, player) => {
      player.name = name;
      io.to(room.id).emit("update-room", { players: room.players });
    })(),
  );

  socket.on("make-host", (playerId: string) =>
    withContext(socket, (room, player) => {
      if (room.hostId !== player.id) return;
      room.hostId = playerId;
      io.to(room.id).emit("update-room", { hostId: playerId });
    })(),
  );

  function removePlayerFromRoom(
    socket: Socket,
    room: MultiplayerRoom,
    playerId: string,
  ) {
    room.removePlayer(playerId);
    io.to(room.id).emit("update-room", { players: room.players });
    const kickedSocket = io.sockets.sockets
      .values()
      .toArray()
      .find((s) => s?.data?.player?.id === playerId);
    if (kickedSocket) {
      kickedSocket?.emit("kicked");
      const token = kickedSocket.handshake.auth.token;
      if (token) {
        USER_STORE.get(token)?.delete(room.id);
      }
    }
  }

  socket.on(
    "leave-room",
    withContext(socket, (room, player) => {
      removePlayerFromRoom(socket, room, player.id);
    }),
  );

  socket.on("kick", (playerId: string) =>
    withContext(socket, (room, player) => {
      if (room.hostId !== player.id) return;
      removePlayerFromRoom(socket, room, playerId);
    })(),
  );

  socket.on("chat", (content: string) =>
    withContext(socket, (room, player) => {
      const id = crypto.randomUUID();
      room.chat.push({ author: player.id, content, createdAt: new Date().toISOString(), id });
      io.to(room.id).emit("update-room", { chat: room.chat });
    })(),
  );
}
