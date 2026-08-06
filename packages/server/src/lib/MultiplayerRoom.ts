import {
  DEFAULT_MULTIPLAYER_ROOM,
  type ChatMessage,
  type GameParams,
  type MultiplayerRoom as MultiplayerRoomData,
  type Player,
} from "@metroclavier/shared";
import type { MultiplayerGameData } from "@metroclavier/shared/src/types/Multiplayer";
import { GAME_TRIPS } from "./db";
import { Logger } from "./Logger";

function randomRoomId(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function randomStopName() {
  const arr = Object.values(GAME_TRIPS);
  const n = Math.floor(Math.random() * arr.length);
  const m = Math.floor(Math.random() * arr[n]!.stops.length);
  return arr[n]!.stops[m]!.name;
}

const DISCONNECT_GRACE_PERIOD = 20_000;

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
  logger: Logger;

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
    this.logger = new Logger(this.id);
    MultiplayerRoom.ROOMS[this.id] = this;
    this.logger.info("CREATED");
  }

  setActiveSocket(playerId: string, socketId: string): void {
    this.activeSockets.set(playerId, socketId);
    this.logger.info(`Active socket set for player ${playerId}: ${socketId}`);
  }

  getActiveSocket(playerId: string): string | undefined {
    return this.activeSockets.get(playerId);
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

    this.logger.info(`Player '${player.name}' (${player.id}) joined`);
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
    this.logger.info(`Player (${playerId}) disconnected`);
  }

  playerReconnected(playerId: string): void {
    const timeout = this.removePlayerTimeouts.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      this.removePlayerTimeouts.delete(playerId);
    }
    this.logger.info(`Player (${playerId}) reconnected`);
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter((p) => p.id !== playerId);
    this.logger.info(`Player (${playerId}) removed`);
    if (this.players.length === 0) {
      delete MultiplayerRoom.ROOMS[this.id];
      this.logger.info(`DELETED`);
      return;
    } else if (this.hostId === playerId) {
      this.hostId = this.players[0]?.id ?? "";
      this.logger.info(`Host changed to (${this.hostId})`);
    }
  }

  update(data: Partial<MultiplayerRoomData>): void {
    Object.assign(this, data);
    this.logger.info(`Room updated: ${JSON.stringify(data)}`);
  }

  startGame() {
    if (this.status === "playing") {
      return false;
    }
    this.logger.info(`Starting game with params: ${JSON.stringify(this.gameParams)}`);
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
    this.logger.info(`Player ${id} is ready`);
    return this.readyPlayers.size === this.players.length;
  }

  finishTimeout: NodeJS.Timeout | null = null;
  finishedPlayers: Set<string> = new Set();
  playerCorrect(playerId: string, duration: number) {
    this.currentGameData.timings[playerId]!.push(duration);
    if (this.checkHasFinished(playerId)) {
      this.finishedPlayers.add(playerId);
      this.logger.info(`Player ${playerId} has finished`);
      if (this.currentGameData.willEndAt === null) {
        this.currentGameData.willEndAt = new Date(Date.now() + 15 * 1000);
        this.logger.info(`Game will end at ${this.currentGameData.willEndAt}`);
        this.finishTimeout = setTimeout(() => {
          this.status = "idle";
          this.dispatchEvent(new Event("end"));
          this.logger.info(`Game ended (delay)`);
        }, 15 * 1000);
      }

      if (this.finishedPlayers.size === this.players.length) {
        this.status = "idle";
        this.dispatchEvent(new Event("end"));
        if (this.finishTimeout) {
          clearTimeout(this.finishTimeout);
          this.finishTimeout = null;
        }
        this.logger.info(`Game ended (all players finished)`);
      }
    }
  }

  sendChat(message: ChatMessage): void {
    this.chat.push(message);
    this.logger.info(`Chat message sent: ${message.author}: "${message.content}"`);
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
