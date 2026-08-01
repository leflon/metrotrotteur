import type { GameParams } from "./GameParams";

export interface MultiplayerRoom {
  id: string;
  name: string;
  hostId: string;
  players: Player[];
  status: 'playing' | 'idle';
  maxPlayers: number;
  password: string;
  gameParams: GameParams;
};


export type Player = {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
};