import type { GameTransfer, GameTrip } from "@metroclavier/shared";

export type GameState = {
  trip: GameTrip;
  currentStopIndex: number;
  possibleTransfers: GameTransfer[];
  currentStopStart: Date;
  status: 'pregame' | 'playing' | 'postgame';
};