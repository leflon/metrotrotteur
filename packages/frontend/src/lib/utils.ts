import type { GameStats, GameStop } from "@metroclavier/shared";

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateSlidingWPM(
  timedChars: Date[],
  threshold: number = 3_000,
) {
  const now = Date.now();
  let i = timedChars.length - 1;
  while (i >= 0 && now - timedChars[i]!.getTime() <= threshold) i--;
  const chars = timedChars.length - 1 - i;

  const words = chars / 5;
  const wpt = words / threshold;
  const wpm = Math.floor(wpt * 60_000);
  return wpm;
}

export function calculateStopWPM(stop: GameStats['visitedStops'][number]) {
  const { stop: { name }, duration } = stop;
  const words = name.length / 5;
  const wpt = words / duration;
  const wpm = Math.floor(wpt * 60_000);
  return wpm;
}

export function splitDuration(time: number): [number, number] {
  const minutes = Math.floor(time / 60_000);
  const seconds = Math.floor((time % 60_000) / 1000);

  return [minutes, seconds];
}

export function formatDuration(time: number) {
  const [minutes, seconds] = splitDuration(time);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function angle(geo1: number[], geo2: number[]): number {
	const [lon1, lat1] = geo1 as [number, number];
	const [lon2, lat2] = geo2 as [number, number];

	const R = 6371000; // Earth's radius in meters
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const toDeg = (rad: number) => (rad * 180) / Math.PI;

	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);

	// Calculate bearing (angle from North)
	const y = Math.sin(dLon) * Math.cos(toRad(lat2));
	const x =
		Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
		Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
	let angle = Math.atan2(y, x);
	angle = (toDeg(angle) + 360) % 360; // Normalize to 0-360

	return angle;
}

export function convertStopsToEasy(stops: GameStop[]): GameStop[] {
  return stops.map(stop => ({
    ...stop,
    name: stop.name
      .toLowerCase()
      .replace(/\s+\-\s+/g, ' ')
      .replace(/\s+\((.*)\)/g, '')
      .replace(/\./g, '')
      .replace(/[-']/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''),
  }));
}

export function srcset(name: string) {
  return `/images/1x/${name}.webp 1x, /images/2x/${name}.webp 2x, /images/3x/${name}.webp 3x`;
}