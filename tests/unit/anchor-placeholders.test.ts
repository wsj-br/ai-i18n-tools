import { protectDocAnchors, restoreDocAnchors } from "../../src/processors/anchor-placeholders.js";

describe("anchor-placeholders", () => {
  it("protects and restores HTML id anchors", () => {
    const src = `<a id="x"></a>\n<p>Hi</p>`;
    const p = protectDocAnchors(src);
    expect(p.htmlAnchors.length).toBe(1);
    expect(p.protected).toContain("HTML_ANCHOR");
    expect(restoreDocAnchors(p.protected, p.htmlAnchors, [])).toContain('<a id="x">');
  });

  it("protects and restores Docusaurus heading ids", () => {
    const src = `## Heading {#my-id}\n`;
    const p = protectDocAnchors(src);
    expect(p.docusaurusHeadingIds).toEqual(["{#my-id}"]);
    expect(restoreDocAnchors(p.protected, [], p.docusaurusHeadingIds)).toContain("{#my-id}");
  });

  it("restoreDocAnchors accepts hyphenated DOC_HEADING-ID placeholder form", () => {
    const corrupted = "x {{DOC_HEADING-ID_0}} y";
    expect(restoreDocAnchors(corrupted, [], ["{#z}"])).toContain("{#z}");
  });
});
