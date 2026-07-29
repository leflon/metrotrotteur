import type { GameStop, GameTrip } from "@metroclavier/shared";

export type GameStats = {
  visitedStops: {
    stop: GameStop;
    route: GameTrip['route'];
    duration: number;
  }[];
  wpmHistory: {
    value: number;
    time: Date;
  }[];
  timedCorrectChars: Date[];
  duration: number;
};