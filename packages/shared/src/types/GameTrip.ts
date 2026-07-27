import { type GameRoute } from "./GameRoute";
import { type GameStop } from "./GameStop";
import { type GameTransfer } from "./GameTransfer";

export type GameTrip = {
  id: string;
  route: Omit<GameRoute, 'trips'>;
  destination: string;
  stops: GameStop[];
  transfers: GameTransfer[][];
}