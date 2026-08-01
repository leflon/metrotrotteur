import type { Server, Socket } from "socket.io";
import type { Player } from "@metroclavier/shared";
import MultiplayerRoom from "./MultiplayerRoom";
import type { MultiplayerRoom as MultiplayerRoomData } from "@metroclavier/shared";

export default function registerMultiplayerHandlers(io: Server, socket: Socket) {
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
      socket.join(room.id);
      callback({success: true, room});
    } catch (error: unknown) {
      callback({success: false, error: (<Error>error).message});
    }
  });

  socket.on('start-game', () => {
    const roomId = socket.rooms.values().toArray().at(-1);
    const room = MultiplayerRoom.ROOMS[roomId ?? ''];
    const player = socket.data.player as Player;

    console.log('start attempt', room, player);
    if (!room || room.hostId !== player.id) {
      return;
    }

    if (room.startGame()) {
      io.to(room.id).emit('start');
    }
  });

  socket.on('update-room', (data: MultiplayerRoomData) => {
    const roomId = socket.rooms.values().toArray().at(-1);
    const room = MultiplayerRoom.ROOMS[roomId ?? ''];
    const player = socket.data.player as Player;

    if (!room || room.hostId !== player.id) {
      return;
    }

    room.update(room);
    io.to(room.id).emit('update-room', room);
  });

  
}