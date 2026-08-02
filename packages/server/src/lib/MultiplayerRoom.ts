import type { GameParams, MultiplayerRoom as MultiplayerRoomData, Player } from "@metroclavier/shared";
import { GAME_TRIPS } from "./db";
import type { MultiplayerGameData } from "@metroclavier/shared/src/types/Multiplayer";

function randomRoomId(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function randomStopName() {
  const arr = Object.values(GAME_TRIPS);
  const n = Math.floor(Math.random() * arr.length);
  const m = Math.floor(Math.random() * arr[n]!.stops.length);
  return arr[n]!.stops[m]!.name;
}

export default class MultiplayerRoom implements MultiplayerRoomData {
  [x: string]: any;
  id: string;
  name: string;
  hostId: string;
  players: Player[];
  status: 'playing' | 'idle';
  gameParams: GameParams;
  maxPlayers: number;
  password: string;
  currentGameData: MultiplayerGameData;

  static ROOMS: Record<string, MultiplayerRoom> = {};

  constructor(data: MultiplayerRoomData) {
    this.id = data.id;
    this.name = data.name;
    this.hostId = data.hostId;
    this.players = data.players;
    this.status = data.status;
    this.gameParams = data.gameParams;
    this.maxPlayers = data.maxPlayers;
    this.password = data.password;
    this.currentGameData = data.currentGameData;
    
    MultiplayerRoom.ROOMS[this.id] = this;
  }


  addPlayer(player: Player): void {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('full');
    }
    if (this.status === 'playing') {
      throw new Error('playing');
    }

    if (this.players.length === 0)
      this.hostId = player.id;
    
    
    this.players.push(player);
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter(p => p.id !== playerId);
  }

  update(data: Partial<MultiplayerRoomData>): void {
    for (const [key, val] of Object.entries(data)) {
      this[key as any as keyof typeof MultiplayerRoom] = val;
    }
  }

  startGame() {
    if (this.status === 'playing') {
      return false;
    }
    this.status = 'playing';
    this.readyPlayers = new Set();
    const timings = this.players.reduce((acc, player) => ({...acc, [player.id]: [] }), {} as Record<string, number[]>);
    this.currentGameData.timings = timings;
    return true;
  }

  readyPlayers: Set<string> = new Set();
  playerReady(id: string) {
    this.readyPlayers.add(id);
    return this.readyPlayers.size === this.players.length;
  }

  playerCorrect(playerId: string, duration: number) {
    this.currentGameData.timings[playerId]!.push(duration);
  }

  static create(): MultiplayerRoom {
    return new MultiplayerRoom({
      id: randomRoomId(),
      name: randomStopName(),
      hostId: '',
      players: [],
      status: 'idle',
      gameParams: {
        gamemode: 'multi',
        network: 'metro',
        trip: '',
        rules: {
          easy: false,
        },
      },
      currentGameData: { timings: {} },
      maxPlayers: 8,
      password: '',
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
      password: this.password ? 'XXX' : '',
    };
  }

}