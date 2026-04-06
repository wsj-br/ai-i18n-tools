import { computeSegmentHash } from "../../src/utils/hash";
import { TranslationCache } from "../../src/core/cache";

describe("computeSegmentHash", () => {
  it("matches TranslationCache.computeHash", () => {
    const s = "  foo   bar  ";
    expect(computeSegmentHash(s)).toBe(TranslationCache.computeHash(s));
  });
});
