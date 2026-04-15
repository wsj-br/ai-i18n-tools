import { hasInternalPlaceholderLeak } from "../../src/processors/translation-placeholder-leaks.js";

describe("hasInternalPlaceholderLeak", () => {
  it("detects leaked HDG heading-id tokens", () => {
    expect(hasInternalPlaceholderLeak("ok {#x}")).toBe(false);
    expect(hasInternalPlaceholderLeak("bad {{HDG_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("bad {{HDG-0}}")).toBe(true);
  });

  it("detects other internal markers", () => {
    expect(hasInternalPlaceholderLeak("x {{ANC_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{URL_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{BLD_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{ILC_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{HTM_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{GLS_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{ADM_OPEN_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{ADM_END_0}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{IT}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{IU}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{SE}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{SU}}")).toBe(true);
    expect(hasInternalPlaceholderLeak("x {{ST}}")).toBe(true);
  });
});
