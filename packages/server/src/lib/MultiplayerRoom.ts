import {
  DEFAULT_MULTIPLAYER_ROOM,
  type ChatMessage,
  type GameParams,
  type MultiplayerRoom as MultiplayerRoomData,
  type Player,
} from "@metroclavier/shared";
import type { MultiplayerGameData } from "@metroclavier/shared/src/types/Multiplayer";
import { GAME_TRIPS } from "./db";

function randomRoomId(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function randomStopName() {
  const arr = Object.values(GAME_TRIPS);
  const n = Math.floor(Math.random() * arr.length);
  const m = Math.floor(Math.random() * arr[n]!.stops.length);
  return arr[n]!.stops[m]!.name;
}

const DISCONNECT_GRACE_PERIOD = 3_000;

export default class MultiplayerRoom
  extends EventTarget
  implements MultiplayerRoomData
{
  id: string;
  name: string;
  hostId: string;
  players: Player[];
  status: "playing" | "idle";
  gameParams: GameParams;
  maxPlayers: number;
  password: string;
  currentGameData: MultiplayerGameData;
  chat: ChatMessage[];

  static ROOMS: Record<string, MultiplayerRoom> = {};

  activeSockets: Map<string, string> = new Map();
  removePlayerTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(data: MultiplayerRoomData) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.hostId = data.hostId;
    this.players = data.players;
    this.status = data.status;
    this.gameParams = data.gameParams;
    this.maxPlayers = data.maxPlayers;
    this.password = data.password;
    this.currentGameData = data.currentGameData;
    this.chat = data.chat;
    MultiplayerRoom.ROOMS[this.id] = this;
  }

  setActiveSocket(playerId: string, socketId: string): void {
    this.activeSockets.set(playerId, socketId);
  }

  isActiveSocket(playerId: string, socketId: string): boolean {
    return this.activeSockets.get(playerId) === socketId;
  }

  addPlayer(player: Player): void {
    if (this.players.find((p) => p.id === player.id)) return;

    if (this.players.length >= this.maxPlayers) {
      throw new Error("full");
    }
    if (this.status === "playing") {
      throw new Error("playing");
    }

    if (this.players.length === 0) this.hostId = player.id;

    this.players.push(player);
  }

  playerDisconnected(playerId: string): void {
    const player = this.players.find((p) => p.id === playerId);
    if (player) player.isConnected = false;
    this.removePlayerTimeouts.set(
      playerId,
      setTimeout(() => {
        this.removePlayer(playerId);
        this.dispatchEvent(new Event("player-removed"));
        this.removePlayerTimeouts.delete(playerId);
      }, DISCONNECT_GRACE_PERIOD),
    );
  }

  playerReconnected(playerId: string): void {
    const timeout = this.removePlayerTimeouts.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      this.removePlayerTimeouts.delete(playerId);
    }
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter((p) => p.id !== playerId);
    if (this.players.length === 0) {
      delete MultiplayerRoom.ROOMS[this.id];
      return;
    } else if (this.hostId === playerId) {
      this.hostId = this.players[0]?.id ?? "";
    }
  }

  update(data: Partial<MultiplayerRoomData>): void {
    Object.assign(this, data);
  }

  startGame() {
    if (this.status === "playing") {
      return false;
    }
    this.status = "playing";
    this.readyPlayers = new Set();
    this.finishedPlayers = new Set();
    const timings = this.players.reduce(
      (acc, player) => ({ ...acc, [player.id]: [] }),
      {} as Record<string, number[]>,
    );
    this.currentGameData = {
      timings,
      willEndAt: null,
    };
    return true;
  }

  readyPlayers: Set<string> = new Set();
  playerReady(id: string) {
    this.readyPlayers.add(id);
    return this.readyPlayers.size === this.players.length;
  }

  finishTimeout: NodeJS.Timeout | null = null;
  finishedPlayers: Set<string> = new Set();
  playerCorrect(playerId: string, duration: number) {
    this.currentGameData.timings[playerId]!.push(duration);
    if (this.checkHasFinished(playerId)) {
      this.finishedPlayers.add(playerId);

      if (this.currentGameData.willEndAt === null) {
        this.currentGameData.willEndAt = new Date(Date.now() + 15 * 1000);
        this.finishTimeout = setTimeout(() => {
          this.status = "idle";
          this.dispatchEvent(new Event("end"));
        }, 15 * 1000);
      }

      if (this.finishedPlayers.size === this.players.length) {
        this.status = "idle";
        this.dispatchEvent(new Event("end"));
        if (this.finishTimeout) {
          clearTimeout(this.finishTimeout);
          this.finishTimeout = null;
        }
      }
    }
  }

  private checkHasFinished(playerId: string): boolean {
    const trip = GAME_TRIPS[this.gameParams.trip];
    if (!trip) return false;

    return this.currentGameData.timings[playerId]!.length === trip.stops.length;
  }

  static create(): MultiplayerRoom {
    return new MultiplayerRoom({
      ...structuredClone(DEFAULT_MULTIPLAYER_ROOM),
      id: randomRoomId(),
      name: randomStopName(),
    });
  }

  toJSON(): MultiplayerRoomData {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      players: this.players,
      status: this.status,
      gameParams: this.gameParams,
      maxPlayers: this.maxPlayers,
      currentGameData: this.currentGameData,
      password: this.password ? "XXX" : "",
      chat: this.chat,
    };
  }
}
