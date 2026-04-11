import {
  MODELS_TRY_ORDER_LOG_INDENT,
  MODELS_TRY_ORDER_LOG_PREFIX,
  MODELS_TRY_ORDER_LOG_WIDTH,
  wrapCommaSeparatedListForWidth,
} from "../../src/cli/format";

describe("wrapCommaSeparatedListForWidth", () => {
  it("wraps at comma boundaries within width budgets", () => {
    const models = [
      "qwen/qwen3-235b-a22b-2507",
      "stepfun/step-3.5-flash",
      "anthropic/claude-3-haiku",
      "anthropic/claude-3.5-haiku"
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
