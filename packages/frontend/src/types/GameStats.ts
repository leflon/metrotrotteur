import type { GameStop, GameTrip } from "@metroclavier/shared";

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