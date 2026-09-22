import type { LlmApiCallEvent } from "./types.js";
import type { TranslationCache } from "./cache.js";

/**
 * Compact `api_calls` older than seven UTC calendar days into `api_totals`.
 * No-op when this cache instance has not recorded a billed call.
 */
export function consolidateUsageAfterRun(cache: TranslationCache | null | undefined): void {
  if (!cache) {
    return;
  }
  try {
    cache.consolidateApiCallsIfRecorded();
  } catch {
    // Best-effort; must not abort translation cleanup.
  }
}

/**
 * Persist one billed LLM call into `api_calls`. The callback never throws — a logging failure
 * must not abort translation.
 */
export function createUsageRecorder(
  cache: TranslationCache,
  operation: string,
  locale?: string
): (event: LlmApiCallEvent) => void {
  return (event: LlmApiCallEvent): void => {
    try {
      cache.recordApiCall({
        provider: event.provider,
        model: event.model,
        operation,
        locale,
        outcome: event.outcome,
        inputTokens: event.usage.inputTokens,
        outputTokens: event.usage.outputTokens,
        totalTokens: event.usage.totalTokens,
        costUsd: event.cost,
      });
    } catch {
      // Best-effort; LlmClient's onApiCall contract is "must not throw".
    }
  };
}

/** Undefined when there is no cache (`--no-cache` / dry-run). */
export function usageRecorderForCache(
  cache: TranslationCache | null | undefined,
  operation: string,
  locale?: string
): ((event: LlmApiCallEvent) => void) | undefined {
  if (!cache) {
    return undefined;
  }
  return createUsageRecorder(cache, operation, locale);
}
