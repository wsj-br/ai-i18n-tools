import { describe, expect, it } from "vitest";
import {
  MODELS_TRY_ORDER_LOG_INDENT,
  MODELS_TRY_ORDER_LOG_PREFIX,
  MODELS_TRY_ORDER_LOG_WIDTH,
  wrapCommaSeparatedListForWidth,
} from "../../src/cli/format.js";

describe("wrapCommaSeparatedListForWidth", () => {
  it("wraps at comma boundaries within width budgets", () => {
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
      MODELS_TRY_ORDER_LOG_WIDTH - MODELS_TRY_ORDER_LOG_PREFIX.length,
      MODELS_TRY_ORDER_LOG_WIDTH - MODELS_TRY_ORDER_LOG_INDENT.length
    );
    expect(parts.length).toBeGreaterThanOrEqual(2);
    const firstMax = MODELS_TRY_ORDER_LOG_WIDTH - MODELS_TRY_ORDER_LOG_PREFIX.length;
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
