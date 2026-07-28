import type { GameRoute } from './GameRoute';

export type GameTransfer = {
  route: Omit<GameRoute, "trips">;
  trip: string;
  destination: string;
  nextStop: string;
}