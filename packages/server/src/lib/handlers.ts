import type { Server, Socket } from "socket.io";
import type { Player } from "@metroclavier/shared";
import MultiplayerRoom from "./MultiplayerRoom";
import type { MultiplayerRoom as MultiplayerRoomData } from "@metroclavier/shared";

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
  console.log('SOCKET CONNECTION', socket.id);
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
      room.addPlayer(socket.data.player);
      io.to(room.id).emit('update-room', { players: room.players, hostId: room.hostId });
      socket.join(room.id);
      callback({success: true, room});
    } catch (error: unknown) {
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
}
