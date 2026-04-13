import {
  protectInlineCodeSpans,
  restoreInlineCodeSpans,
} from "../../src/processors/inline-code-placeholders.js";
import { PlaceholderHandler } from "../../src/processors/placeholder-handler.js";

describe("inline-code-placeholders", () => {
  it("replaces each `span` with {{ILC_N}} and round-trips", () => {
    const src = "Use `foo` and `bar` here.";
    const { protected: p, ilcMap } = protectInlineCodeSpans(src);
    expect(ilcMap).toEqual(["`foo`", "`bar`"]);
    expect(p).toBe("Use {{ILC_0}} and {{ILC_1}} here.");
    expect(restoreInlineCodeSpans(p, ilcMap)).toBe(src);
  });

  it("skips existing {{...}} regions", () => {
    const src = "x {{URL_0}} y `z`";
    const { protected: p, ilcMap } = protectInlineCodeSpans(src);
    expect(ilcMap).toEqual(["`z`"]);
    expect(p).toContain("{{URL_0}}");
    expect(restoreInlineCodeSpans(p, ilcMap)).toBe(src);
  });

  it("PlaceholderHandler applies ILC after BLD so **`x`** stays one BLD token", () => {
    const h = new PlaceholderHandler();
    const src = "A **`boldcode`** B `plain` C.";
    const st = h.protectForTranslation(src);
    expect(st.boldCodeMap).toEqual(["**`boldcode`**"]);
    expect(st.ilcMap).toEqual(["`plain`"]);
    expect(st.text).toContain("{{BLD_0}}");
    expect(st.text).toContain("{{ILC_0}}");
    expect(h.restoreAfterTranslation(st.text, st)).toBe(src);
  });
});
