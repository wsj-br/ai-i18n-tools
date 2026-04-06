import { PlaceholderHandler } from "../../src/processors/placeholder-handler";

describe("PlaceholderHandler", () => {
  it("round-trips URL and admonition placeholders", () => {
    const h = new PlaceholderHandler();
    const src = `:::note\nSee [link](https://x.com)\n:::`;
    const st = h.protectForTranslation(src);
    expect(st.text).toContain("URL_PLACEHOLDER");
    expect(st.text).toContain("ADM_OPEN");
    const back = h.restoreAfterTranslation(st.text, st);
    expect(back).toContain("https://x.com");
    expect(back).toContain(":::note");
  });
});
