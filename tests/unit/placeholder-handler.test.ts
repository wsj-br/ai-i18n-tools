import { PlaceholderHandler } from "../../src/processors/placeholder-handler";
import { protectDocAnchors, restoreDocAnchors } from "../../src/processors/anchor-placeholders";

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

  it("restores Docusaurus heading id after model hyphen drift", () => {
    const line = "### Step {#my-id}";
    const p = protectDocAnchors(line);
    expect(p.docusaurusHeadingIds).toEqual(["{#my-id}"]);
    const corrupted = p.protected.replace("DOC_HEADING_ID_0", "DOC_HEADING-ID_0");
    const out = restoreDocAnchors(corrupted, [], p.docusaurusHeadingIds);
    expect(out).toBe(line);
  });
});
