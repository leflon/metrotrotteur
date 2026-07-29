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

export function splitDuration(time: number): [number, number] {
  const minutes = Math.floor(time / 60_000);
  const seconds = Math.floor((time % 60_000) / 1000);

  return [minutes, seconds];
}

export function formatDuration(time: number) {
  const [minutes, seconds] = splitDuration(time);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
