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

  it("splits heading and admonition segment types", () => {
    expect(splitSegmentForQualityRetry(THREE_ITEM_LIST, "heading", 0, 3)).toHaveLength(2);
    expect(splitSegmentForQualityRetry(THREE_ITEM_LIST, "admonition", 0, 3)).toHaveLength(2);
  });

  it("returns null for empty or whitespace-only content", () => {
    expect(splitSegmentForQualityRetry("", "paragraph", 0, 3)).toBeNull();
    expect(splitSegmentForQualityRetry("   \n  \n", "paragraph", 0, 3)).toBeNull();
  });

  it("returns null at the maxDepth boundary even with splittable content", () => {
    expect(splitSegmentForQualityRetry(THREE_ITEM_LIST, "paragraph", 5, 5)).toBeNull();
  });

  it("splits to single list items at depth 2 and beyond", () => {
    const parts = splitSegmentForQualityRetry(THREE_ITEM_LIST, "paragraph", 2, 5);
    expect(parts).not.toBeNull();
    expect(parts!.length).toBeGreaterThanOrEqual(2);
    expect(parts![0]).toMatch(/^1\./);
  });

  it("falls back to the line midpoint for a multi-line non-list paragraph", () => {
    const body = ["First short line.", "Second short line.", "Third short line."].join("\n");
    const parts = splitSegmentForQualityRetry(body, "paragraph", 0, 3);
    expect(parts).not.toBeNull();
    expect(parts!.length).toBeGreaterThanOrEqual(2);
    expect(parts!.join("\n")).toContain("First short line.");
    expect(parts!.join("\n")).toContain("Third short line.");
  });

  it("splits a long single line via the char midpoint and preserves all words", () => {
    // Single line > 160 chars (char-midpoint floor) but <= 200 (so dense-paragraph
    // splitting does not pre-split it), so the char-midpoint fallback handles it.
    const body = Array.from({ length: 28 }, (_, i) => `word${i}`).join(" ");
    expect(body).not.toContain("\n");
    expect(body.length).toBeGreaterThan(160);
    expect(body.length).toBeLessThanOrEqual(200);
    const parts = splitSegmentForQualityRetry(body, "paragraph", 0, 3);
    expect(parts).toHaveLength(2);
    expect(parts!.join(" ")).toBe(body);
  });

  it("returns null for a single line over the split gate but under the char-split floor", () => {
    // One line, length in (MIN_SPLITTABLE_CHARS, MIN_SPLITTABLE_CHARS*2]: passes the
    // "can split" gate but is too short for the char-midpoint fallback (<= 160 chars).
    const body = Array.from({ length: 20 }, (_, i) => `word${i}`).join(" ");
    expect(body).not.toContain("\n");
    expect(body.length).toBeGreaterThan(80);
    expect(body.length).toBeLessThanOrEqual(160);
    expect(splitSegmentForQualityRetry(body, "paragraph", 0, 3)).toBeNull();
  });
});
