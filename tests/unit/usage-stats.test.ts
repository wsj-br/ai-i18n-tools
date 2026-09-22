import { describe, expect, it } from "vitest";
import {
  collectProviderPricing,
  estimateCostUsd,
  resolvedCostUsd,
  isUsageLongRange,
  parseUsageDeleteOlderThan,
  parseUsageSince,
  toSqliteUtcDatetime,
  usageDeleteCutoffMonth,
  usageDetailRetentionCutoff,
  withEstimatedCosts,
} from "../../src/core/usage-stats.js";
import type { ApiCallStatsResult } from "../../src/core/types.js";

describe("parseUsageSince", () => {
  it("parses duration, calendar date, and ISO timestamps", () => {
    const now = new Date("2026-09-21T12:00:00.000Z");
    expect(parseUsageSince("7d", now)).toBe("2026-09-14 12:00:00");
    expect(parseUsageSince("24h", now)).toBe("2026-09-20 12:00:00");
    expect(parseUsageSince("30m", now)).toBe("2026-09-21 11:30:00");
    expect(parseUsageSince("1h", now)).toBe("2026-09-21 11:00:00");
    expect(parseUsageSince("6h", now)).toBe("2026-09-21 06:00:00");
    expect(parseUsageSince("12h", now)).toBe("2026-09-21 00:00:00");
    expect(parseUsageSince("1mo", now)).toBe("2026-09-01 00:00:00");
    expect(parseUsageSince("2mo", now)).toBe("2026-08-01 00:00:00");
    expect(parseUsageSince("3mo", now)).toBe("2026-07-01 00:00:00");
    expect(parseUsageSince("2024-01-02")).toBe("2024-01-02 00:00:00");
    expect(parseUsageSince("2024-01-02T15:04:05.000Z")).toBe("2024-01-02 15:04:05");
    expect(toSqliteUtcDatetime(now)).toBe("2026-09-21 12:00:00");
  });

  it("rejects empty or invalid values", () => {
    expect(() => parseUsageSince("")).toThrow(/Empty since/);
    expect(() => parseUsageSince("not-a-date")).toThrow(/Invalid since/);
  });
});

describe("usage range helpers", () => {
  const now = new Date("2026-09-21T12:00:00.000Z");

  it("uses seven full UTC calendar days for detail retention", () => {
    expect(usageDetailRetentionCutoff(now)).toBe("2026-09-14 00:00:00");
  });

  it("treats all-time and multi-month windows as long ranges", () => {
    expect(isUsageLongRange(undefined)).toBe(true);
    expect(isUsageLongRange("")).toBe(true);
    expect(isUsageLongRange("2mo")).toBe(true);
    expect(isUsageLongRange("3mo")).toBe(true);
    expect(isUsageLongRange("30d")).toBe(false);
    expect(isUsageLongRange("30m")).toBe(false);
  });

  it("parses delete presets and calendar-month cutoffs", () => {
    expect(parseUsageDeleteOlderThan("all")).toBe("all");
    expect(parseUsageDeleteOlderThan("1mo")).toBe("1mo");
    expect(parseUsageDeleteOlderThan("1y")).toBe("1y");
    expect(() => parseUsageDeleteOlderThan("30")).toThrow(/Invalid older-than/);
    expect(usageDeleteCutoffMonth("1mo", now)).toBe("2026-09");
    expect(usageDeleteCutoffMonth("2mo", now)).toBe("2026-08");
    expect(usageDeleteCutoffMonth("1y", now)).toBe("2025-10");
  });
});

describe("estimated cost", () => {
  const pricing = collectProviderPricing({
    openai: {
      pricing: { inputPerMTokens: 0.15, outputPerMTokens: 0.6 },
      modelPricing: {
        "gpt-4o": { inputPerMTokens: 2.5, outputPerMTokens: 10 },
      },
    },
  });

  it("uses the provider-wide default when no model override matches", () => {
    expect(estimateCostUsd("openai", "gpt-4o-mini", 1_000_000, 500_000, pricing)).toBeCloseTo(
      0.15 + 0.3
    );
    expect(estimateCostUsd("openai", "unknown", 1_000_000, 0, pricing)).toBeCloseTo(0.15);
    expect(estimateCostUsd("openrouter", "gpt-4o-mini", 1000, 1000, pricing)).toBeUndefined();
  });

  it("prefers an exact modelPricing entry over the provider default", () => {
    expect(estimateCostUsd("openai", "gpt-4o", 1_000_000, 100_000, pricing)).toBeCloseTo(2.5 + 1);
  });

  it("uses modelPricing alone when the provider has no default", () => {
    const modelsOnly = collectProviderPricing({
      groq: {
        modelPricing: { "llama-3.3": { inputPerMTokens: 0.59, outputPerMTokens: 0.79 } },
      },
    });
    expect(estimateCostUsd("groq", "llama-3.3", 1_000_000, 0, modelsOnly)).toBeCloseTo(0.59);
    expect(estimateCostUsd("groq", "other", 1000, 1000, modelsOnly)).toBeUndefined();
  });

  it("attaches estimates only to calls without reported cost", () => {
    const empty: ApiCallStatsResult["summary"] = {
      calls: 2,
      acceptedCalls: 2,
      discardedCalls: 0,
      inputTokens: 2_000_000,
      outputTokens: 1_000_000,
      totalTokens: 3_000_000,
      actualCostUsd: 0.01,
      callsWithCost: 1,
      callsWithoutCost: 1,
      inputTokensWithoutCost: 1_000_000,
      outputTokensWithoutCost: 500_000,
    };
    const stats: ApiCallStatsResult = {
      summary: empty,
      byProvider: [{ provider: "openai", ...empty }],
      byModel: [
        {
          provider: "openai",
          model: "gpt-4o-mini",
          ...empty,
        },
      ],
      byOperation: [],
      byLocale: [],
      byDay: [],
      byMonth: [],
    };
    const withEst = withEstimatedCosts(stats, pricing);
    expect(withEst.byModel[0]?.estimatedCostUsd).toBeCloseTo(0.45);
    expect(withEst.summary.estimatedCostUsd).toBeCloseTo(0.45);
    expect(withEst.byProvider[0]?.estimatedCostUsd).toBeCloseTo(0.45);
    expect(withEst.summary.actualCostUsd).toBeCloseTo(0.01);
  });

  it("does not invent a $0 estimate when every call already stored a cost", () => {
    const row: ApiCallStatsResult["summary"] = {
      calls: 1,
      acceptedCalls: 1,
      discardedCalls: 0,
      inputTokens: 1_000_000,
      outputTokens: 0,
      totalTokens: 1_000_000,
      actualCostUsd: 0.15,
      callsWithCost: 1,
      callsWithoutCost: 0,
      inputTokensWithoutCost: 0,
      outputTokensWithoutCost: 0,
    };
    const stats: ApiCallStatsResult = {
      summary: row,
      byProvider: [{ provider: "openai", ...row }],
      byModel: [{ provider: "openai", model: "gpt-4o-mini", ...row }],
      byOperation: [],
      byLocale: [],
      byDay: [],
      byMonth: [],
    };
    const withEst = withEstimatedCosts(stats, pricing);
    expect(withEst.summary.estimatedCostUsd).toBeUndefined();
    expect(withEst.byModel[0]?.estimatedCostUsd).toBeUndefined();
    expect(resolvedCostUsd(withEst.summary)).toBeCloseTo(0.15);
  });

  it("resolvedCostUsd adds stored and leftover estimated amounts", () => {
    expect(
      resolvedCostUsd({
        actualCostUsd: 0.01,
        callsWithCost: 1,
        estimatedCostUsd: 0.45,
      })
    ).toBeCloseTo(0.46);
    expect(resolvedCostUsd({ actualCostUsd: 0, callsWithCost: 0 })).toBeUndefined();
  });
});
