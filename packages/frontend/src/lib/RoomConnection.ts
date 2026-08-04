import type { MultiplayerRoom, Player } from "@metroclavier/shared";
import { Socket } from "socket.io-client";

type ConnectionAttemptResponse =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      room: MultiplayerRoom;
      player: Player;
    };

export class RoomConnection extends EventTarget {
  private socket: Socket;
  private roomId: string;
  private _connected: boolean = true;

  constructor(socket: Socket, roomId: string) {
    super();
    this.socket = socket;
    this.roomId = roomId;

    if (import.meta.env.DEV) {
      (window as any).__killSocket = () =>
        socket.io.engine.transport.close();
    }

    socket.on("start", () => {
      this.dispatchEvent(new Event("start"));
    });

    socket.on("update-room", (room: MultiplayerRoom) => {
      this.dispatchEvent(new CustomEvent("update-room", { detail: room }));
    });

    socket.on("disconnect", () => {
      this._connected = false;
    });

    socket.on("connect", () => {
      this._connected = true;
      socket.emit("join-room", { roomId: this.roomId }, () => {});
    });
  }

  async joinRoom(
    roomId: string,
    password?: string,
  ): Promise<ConnectionAttemptResponse> {
    console.log("join attempted", roomId);
    return new Promise((resolve) => {
      console.log("emitting join-room", { roomId, password });
      this.socket.emit("join-room", { roomId, password }, resolve);
    });
  }

  async updateRoom(room: Partial<MultiplayerRoom>) {
    this.socket.emit("update-room", room);
  }

  async startGame() {
    this.socket.emit("start-game");
  }

  async emitReady() {
    this.socket.emit("ready");
  }

  emitCorrect(duration: number) {
    this.socket.emit("correct", duration);
  }

  rename(name: string) {
    this.socket.emit("rename", name);
  }

  kick(playerId: string) {
    this.socket.emit("kick", playerId);
  }

  makeHost(playerId: string) {
    this.socket.emit("make-host", playerId);
  }
}
