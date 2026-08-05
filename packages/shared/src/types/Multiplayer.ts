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
  currentGameData: MultiplayerGameData;
  chat: ChatMessage[];
};

export type MultiplayerGameData = {
  timings: Record<string, number[]>;
  willEndAt: Date | null;
}

export type Player = {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
};

export type ChatMessage = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};