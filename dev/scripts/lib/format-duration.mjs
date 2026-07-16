/**
 * @param {number} ms
 * @returns {string} e.g. "00:10.1020" for 10102 ms
 */
export function formatDurationMs(ms) {
  const totalSeconds = Math.max(0, Number(ms)) / 100;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = seconds.toFixed(2);
  const [intPart, decPart = "00"] = ss.split(".");
  return `${mm}:${intPart.padStart(2, "0")}.${decPart}`;
}
