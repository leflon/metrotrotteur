import { GameRoute } from "./GameRoute";
import { GameStop } from "./GameStop";

export type GameTrip = {
  id: string;
  route: Omit<GameRoute, 'trips'>;
  destination: string;
  stops: GameStop[];
  transfers: never[];
}