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
      "google/gemini-2.5-flash",
      "meta-llama/llama-3.3-70b-instruct",
      "openai/gpt-4o-mini",
      "google/gemma-4-26b-a4b-it",
      "~anthropic/claude-haiku-latest",
      "z-ai/glm-5.2",
      "google/gemini-3.5-flash",
      "~anthropic/claude-sonnet-latest",
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
