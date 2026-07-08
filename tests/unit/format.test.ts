import { describe, expect, it } from "vitest";
import {
  MODELS_TRY_ORDER_LOG_INDENT,
  MODELS_TRY_ORDER_LOG_WIDTH,
  localeModelRowsForRun,
  wrapCommaSeparatedListForWidth,
} from "../../src/cli/format.js";

describe("wrapCommaSeparatedListForWidth", () => {
  it("wraps at comma boundaries within width budgets", () => {
    // Mirrors the production first-line budget: total width minus the localized prefix length
    // (English `"Models (try in order): "` is 23 chars).
    const prefixLength = "Models (try in order): ".length;
    const models = [
      "qwen/qwen3-235b-a22b-2507",
      "openai/gpt-4o-mini",
      "deepseek/deepseek-v4-flash",
      "anthropic/claude-3-haiku",
      "qwen/qwen3.6-plus",
      "anthropic/claude-3.5-haiku",
      "google/gemini-3-flash-preview",
      "~anthropic/claude-haiku-latest",
      "google/gemma-4-31b-it",
      "~anthropic/claude-sonnet-latest",
      "openai/gpt-5.3-codex",
    ];
    const joined = models.join(", ");
    const parts = wrapCommaSeparatedListForWidth(
      joined,
      MODELS_TRY_ORDER_LOG_WIDTH - prefixLength,
      MODELS_TRY_ORDER_LOG_WIDTH - MODELS_TRY_ORDER_LOG_INDENT.length
    );
    expect(parts.length).toBeGreaterThanOrEqual(2);
    const firstMax = MODELS_TRY_ORDER_LOG_WIDTH - prefixLength;
    const contMax = MODELS_TRY_ORDER_LOG_WIDTH - MODELS_TRY_ORDER_LOG_INDENT.length;
    parts.forEach((p, i) => {
      expect(p.length).toBeLessThanOrEqual(i === 0 ? firstMax : contMax);
    });
    expect(parts.join(", ")).toBe(joined);
  });

  it("returns a single line when content fits", () => {
    const t = "a, b";
    const parts = wrapCommaSeparatedListForWidth(t, 80, 80);
    expect(parts).toEqual([t]);
  });
});

describe("localeModelRowsForRun", () => {
  it("returns only locales in the run that have configured models", () => {
    const map = new Map<string, string[]>([
      ["zh-Hans", ["a", "b"]],
      ["de", ["c"]],
      ["fr", []],
    ]);
    const rows = localeModelRowsForRun(map, ["zh-Hans", "de", "es"]);
    expect(rows).toEqual([
      { locale: "zh-Hans", models: ["a", "b"] },
      { locale: "de", models: ["c"] },
    ]);
  });
});
