import { describe, expect, it, vi } from "vitest";
import type { TranslationCache } from "../../src/core/cache.js";
import {
  consolidateUsageAfterRun,
  createUsageRecorder,
  usageRecorderForCache,
} from "../../src/core/usage-recorder.js";

describe("usage-recorder", () => {
  it("consolidateUsageAfterRun is a no-op without cache", () => {
    expect(() => consolidateUsageAfterRun(null)).not.toThrow();
    expect(() => consolidateUsageAfterRun(undefined)).not.toThrow();
  });

  it("consolidateUsageAfterRun calls cache consolidation", () => {
    const consolidate = vi.fn();
    consolidateUsageAfterRun({
      consolidateApiCallsIfRecorded: consolidate,
    } as unknown as TranslationCache);
    expect(consolidate).toHaveBeenCalledOnce();
  });

  it("consolidateUsageAfterRun swallows consolidation errors", () => {
    expect(() =>
      consolidateUsageAfterRun({
        consolidateApiCallsIfRecorded: () => {
          throw new Error("db");
        },
      } as unknown as TranslationCache)
    ).not.toThrow();
  });

  it("usageRecorderForCache returns undefined without cache", () => {
    expect(usageRecorderForCache(null, "translate-ui")).toBeUndefined();
  });

  it("createUsageRecorder records API calls and swallows write errors", () => {
    const recordApiCall = vi.fn();
    const cache = { recordApiCall } as unknown as TranslationCache;
    const record = createUsageRecorder(cache, "translate-docs", "de");
    record({
      provider: "openrouter",
      model: "m",
      outcome: "accepted",
      usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
      cost: 0.01,
    });
    expect(recordApiCall).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "translate-docs", locale: "de" })
    );

    const failing = {
      recordApiCall: () => {
        throw new Error("fail");
      },
    } as unknown as TranslationCache;
    expect(() =>
      createUsageRecorder(
        failing,
        "x"
      )({
        provider: "openrouter",
        model: "m",
        outcome: "accepted",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cost: 0,
      })
    ).not.toThrow();
  });
});
