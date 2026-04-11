/** Shared formatting helpers for CLI log output. */

/** Returns current time as HH:MM:SS. */
export function timestamp(): string {
  return new Date().toTimeString().slice(0, 8);
}

/** Format elapsed milliseconds as MM:SS (minutes and seconds, zero-padded). */
export function formatElapsedMmSs(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Format elapsed milliseconds as HH:MM:SS. */
export function formatElapsedHhMmSs(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
