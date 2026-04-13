import { computeSegmentHash } from "../../src/utils/hash.js";
import { TranslationCache } from "../../src/core/cache.js";

describe("computeSegmentHash", () => {
  it("matches TranslationCache.computeHash", () => {
    const s = "  foo   bar  ";
    expect(computeSegmentHash(s)).toBe(TranslationCache.computeHash(s));
  });
});
