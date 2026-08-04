import type { Server, Socket } from "socket.io";
import type { Player } from "@metroclavier/shared";
import MultiplayerRoom from "./MultiplayerRoom";
import type { MultiplayerRoom as MultiplayerRoomData } from "@metroclavier/shared";
import { USER_STORE } from "@/socket";

function randomPlayerId(): string {
  const id = Math.random().toString(36).substring(2, 12);
  return `guest-${id}`;
}

function withContext(socket: Socket, handler: (room: MultiplayerRoom, player: Player) => void) {
  return () => {
    const roomId = socket.rooms.values().toArray().at(-1);
    const room = MultiplayerRoom.ROOMS[roomId ?? ''];
    const player = socket.data.player as Player;
    if (!room || !player) return;
    handler(room, player);
  };
}

export default function registerMultiplayerHandlers(io: Server, socket: Socket) {
  socket.on('disconnecting', withContext(socket, (room, player) => {
    console.log('SOCKET DISCONNECT', player.id);
    player.isConnected = false;
    io.to(room.id).emit('update-room', { players: room.players, hostId: room.hostId });
  }));
  socket.on('join-room', ({roomId, password}, callback) => {
    const room = MultiplayerRoom.ROOMS[roomId];
    
    if (!room) {
      callback({success: false, error: 'not-found'});
      return;
    }
    if (room.password && room.password !== password) {
      callback({success: false, error: 'password'});
      return;
    }
    try {
      const uid = USER_STORE.get(room.id)!.get(socket.handshake.auth.token)
      let userData = room.players.find(p => p.id === uid);
      if (userData) {
        // Reconnecting
        console.log('known dude,', userData);
        if (userData.isConnected)
          return callback({success: false, error: 'already-connected'});
        userData.isConnected = true;
      } else {
        console.log('new dude,', socket.handshake.auth.token);
        // New player
        const id = randomPlayerId();
        userData = {
          id,
          name: id,
          score: 0,
          isConnected: true,
        };
        room.addPlayer(userData);
        USER_STORE.get(room.id)!.set(socket.handshake.auth.token, userData.id);
      }
      
      socket.data.player = userData;
      socket.emit('player-data', userData);
      
      io.to(room.id).emit('update-room', { players: room.players, hostId: room.hostId });
      socket.join(room.id);
      callback({success: true, room});
    } catch (error: unknown) {
      console.error(error);
      callback({success: false, error: (<Error>error).message});
    }
  });

  socket.on('start-game', withContext(socket, (room, player) => {
    if (room.hostId !== player.id) return;
    if (room.startGame()) {
      io.to(room.id).emit('update-room', { status: 'playing', currentGameData: room.currentGameData });
    }
  }));

  socket.on('ready', withContext(socket, (room, player) => {
    const allReady = room.playerReady(player.id);
    if (allReady) io.to(room.id).emit('all-ready');
  }));

  socket.on('update-room', (data: Partial<MultiplayerRoomData>) => withContext(socket, (room, player) => {
    if (room.hostId !== player.id) return;
    room.update(data);
    socket.broadcast.emit('update-room', data);
  })());

  socket.on('correct', (duration: number) => withContext(socket, (room, player) => {
    room.playerCorrect(player.id, duration);
    io.to(room.id).emit('update-room', { currentGameData: room.currentGameData });
    if (room.currentGameData.willEndAt !== null) {
      function onEnd() {
        io.to(room.id).emit('update-room', { status: 'idle', currentGameData: room.currentGameData });
        room.removeEventListener('end', onEnd);
      }
      room.addEventListener('end', onEnd);
    }
  })());

  socket.on('rename', (name: string) => withContext(socket, (room, player) => {
    player.name = name;
    io.to(room.id).emit('update-room', { players: room.players });
  })());

}
