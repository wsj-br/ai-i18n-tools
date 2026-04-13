import { PlaceholderHandler } from "../../src/processors/placeholder-handler.js";
import { protectDocAnchors, restoreDocAnchors } from "../../src/processors/anchor-placeholders.js";

describe("PlaceholderHandler", () => {
  it("round-trips URL and admonition placeholders", () => {
    const h = new PlaceholderHandler();
    const src = `:::note\nSee [link](https://x.com) and **bold** + *italic* + ~~strike~~\n:::`;
    const st = h.protectForTranslation(src);
    expect(st.text).toContain("{{URL_");
    expect(st.text).toContain("ADM_OPEN");
    expect(st.text).toContain("{{SE}}");
    expect(st.text).toContain("{{IT}}");
    expect(st.text).toContain("{{ST}}");
    const back = h.restoreAfterTranslation(st.text, st);
    expect(back).toContain("https://x.com");
    expect(back).toContain(":::note");
    expect(back).toContain("**bold**");
    expect(back).toContain("*italic*");
    expect(back).toContain("~~strike~~");
  });

  it("protectUrls and restoreUrls round-trip", () => {
    const h = new PlaceholderHandler();
    const src = `See [x](https://a.com)`;
    const p = h.protectUrls(src);
    expect(p.urlMap.length).toBe(1);
    expect(h.restoreUrls(p.text, p.urlMap)).toContain("https://a.com");
  });

  it("protectAdmonitions and restoreAdmonitions round-trip", () => {
    const h = new PlaceholderHandler();
    const src = `:::tip\nHi\n:::`;
    const p = h.protectAdmonitions(src);
    expect(p.openMap.length).toBeGreaterThan(0);
    expect(h.restoreAdmonitions(p.text, p.openMap, p.endMap)).toContain(":::tip");
  });

  it("restores Docusaurus heading id after model hyphen drift", () => {
    const line = "### Step {#my-id}";
    const p = protectDocAnchors(line);
    expect(p.docusaurusHeadingIds).toEqual(["{#my-id}"]);
    const corrupted = p.protected.replace("HDG_0", "HDG-0");
    const out = restoreDocAnchors(corrupted, [], p.docusaurusHeadingIds);
    expect(out).toBe(line);
  });
});
