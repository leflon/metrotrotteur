import type { MultiplayerRoom, Player } from "@metroclavier/shared";
import { Socket } from "socket.io-client";

type ConnectionAttemptResponse = {
  success: false;
  error: string;
} | {
  success: true;
  room: MultiplayerRoom;
  player: Player;
}

export class RoomConnection extends EventTarget {
  private socket: Socket;

  constructor(socket: Socket) {
    super();
    this.socket = socket;

    socket.on('start', () => {
      this.dispatchEvent(new Event('start'));
    });

    socket.on('update-room', (room: MultiplayerRoom) => {
      this.dispatchEvent(new CustomEvent('update-room', { detail: room }));
    });
  }

  async joinRoom(roomId: string, password?: string): Promise<ConnectionAttemptResponse> {
    console.log('join attempted', roomId);
    return new Promise((resolve) => {
      this.socket.emit("join-room", {roomId, password}, resolve);
    });
  }

  async updateRoom(room: Partial<MultiplayerRoom>) {
    this.socket.emit('update-room', room);
  }

  async startGame() {
    this.socket.emit('start-game');
  }

  async emitReady() {
    this.socket.emit('ready');
  }

  emitCorrect(duration: number) {
    this.socket.emit('correct', duration);
  }
  
}