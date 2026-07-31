import type { GameStop } from "./GameStop";
import type { GameTrip } from "./GameTrip";

export type GameStats = {
  visitedStops: {
    stop: GameStop;
    route: GameTrip['route'];
    duration: number;
  }[];
  timedCorrectChars: Date[];
  duration: number;
  gameStart: Date;
};