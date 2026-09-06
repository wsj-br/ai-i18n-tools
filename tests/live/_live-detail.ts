/**
 * Shared console dump helpers for opt-in live LLM smokes (`pnpm test:live`).
 * Detail dumps are off by default; enable with `pnpm test:live -- --verbose`.
 */

/** True when the live runner saw `--verbose` / `-v` (sets `AI_I18N_LIVE_VERBOSE=1`). */
export function isLiveVerbose(): boolean {
  const flag = process.env.AI_I18N_LIVE_VERBOSE?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export function logLiveBanner(label: string): void {
  if (!isLiveVerbose()) {
    return;
  }
  console.log(`\n${"═".repeat(72)}\n${label}\n${"═".repeat(72)}`);
}

export function logLiveSection(title: string, body: unknown): void {
  if (!isLiveVerbose()) {
    return;
  }
  const text =
    typeof body === "string"
      ? body
      : body === undefined
        ? "(undefined)"
        : JSON.stringify(body, null, 2);
  console.log(`\n── ${title} ──\n${text}`);
}
