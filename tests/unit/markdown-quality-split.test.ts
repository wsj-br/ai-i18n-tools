import { describe, expect, it } from "vitest";
import { splitSegmentForQualityRetry } from "../../src/extractors/markdown-quality-split.js";

const THREE_ITEM_LIST = [
  "1. **Rephrase…** — click **Rephrase…** above the output.",
  "2. **Word alternatives** — select one or more words in the output, then right-click.",
  "3. **Costs** — each **Rephrase…** click uses the model again.",
].join("\n");

describe("splitSegmentForQualityRetry", () => {
  it("splits a 3-item numbered list in half at depth 0", () => {
    const parts = splitSegmentForQualityRetry(THREE_ITEM_LIST, "paragraph", 0, 3);
    expect(parts).toHaveLength(2);
    expect(parts![0]).toContain("1. **Rephrase");
    expect(parts![0]).toContain("2. **Word alternatives");
    expect(parts![1]).toContain("3. **Costs");
  });

  it("splits to single list items at depth 1", () => {
    const parts = splitSegmentForQualityRetry(THREE_ITEM_LIST, "paragraph", 1, 3);
    expect(parts).toHaveLength(3);
    expect(parts![0]).toMatch(/^1\./);
    expect(parts![1]).toMatch(/^2\./);
    expect(parts![2]).toMatch(/^3\./);
  });

  it("returns null when depth exceeds maxDepth", () => {
    expect(splitSegmentForQualityRetry(THREE_ITEM_LIST, "paragraph", 3, 3)).toBeNull();
  });

  it("returns null for non-splittable segment types", () => {
    expect(splitSegmentForQualityRetry("**bold**", "code", 0, 3)).toBeNull();
  });

  it("returns null for atomic short single-line content", () => {
    expect(splitSegmentForQualityRetry("**Save**", "paragraph", 0, 3)).toBeNull();
  });

  it("splits dense paragraph by char midpoint at depth 0", () => {
    const body = Array.from({ length: 30 }, (_, i) => `Line ${i}: some **bold** text here.`).join(
      "\n"
    );
    const parts = splitSegmentForQualityRetry(body, "paragraph", 0, 3);
    expect(parts).not.toBeNull();
    expect(parts!.length).toBeGreaterThanOrEqual(2);
    expect(parts!.join("\n")).toBe(body);
  });
});
