import { splitTranslatableIntoBatches } from "../../src/processors/batch-processor.js";
import type { Segment } from "../../src/core/types.js";

function seg(content: string, t = true): Segment {
  return {
    id: "x",
    type: "paragraph",
    content,
    hash: "h",
    translatable: t,
  };
}

describe("splitTranslatableIntoBatches", () => {
  it("respects batchSize", () => {
    const s = [seg("a"), seg("b"), seg("c"), seg("d")];
    const batches = splitTranslatableIntoBatches(s, { batchSize: 2, maxBatchChars: 10000 });
    expect(batches.length).toBe(2);
    expect(batches[0].length).toBe(2);
  });

  it("respects maxBatchChars", () => {
    const s = [seg("aaaa"), seg("bbbb")];
    const batches = splitTranslatableIntoBatches(s, { batchSize: 10, maxBatchChars: 5 });
    expect(batches.length).toBe(2);
  });

  it("skips non-translatable", () => {
    const s = [seg("a", false), seg("b", true)];
    const batches = splitTranslatableIntoBatches(s, { batchSize: 10, maxBatchChars: 1000 });
    expect(batches[0].length).toBe(1);
  });

  it("returns empty when no translatable segments", () => {
    expect(
      splitTranslatableIntoBatches([seg("a", false)], { batchSize: 2, maxBatchChars: 100 })
    ).toEqual([]);
  });

  it("uses default batch config when omitted", () => {
    const many = Array.from({ length: 25 }, (_, i) => seg(`x${i}`));
    const batches = splitTranslatableIntoBatches(many, {});
    expect(batches.length).toBeGreaterThan(1);
  });
});
