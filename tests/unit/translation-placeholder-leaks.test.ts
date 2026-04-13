import { hasInternalPlaceholderLeak } from "../../src/processors/translation-placeholder-leaks.js";

describe("hasInternalPlaceholderLeak", () => {
  it("detects leaked DOC_HEADING tokens", () => {
    expect(hasInternalPlaceholderLeak("ok {#x}")).toBe(false);
    expect(hasInternalPlaceholderLeak("bad {{DOC_HEADING_ID_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("bad {{DOC_HEADING-ID_0}}")).toBe(true);
  });

  it("detects other internal markers", () => {
    expect(hasInternalPlaceholderLeak("x {{HTML_ANCHOR_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{URL_PLACEHOLDER_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{ADM_OPEN_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{ADM_END_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{IT}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{IU}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{SE}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{SU}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{ST}}")).toBe(true);
  });
});
