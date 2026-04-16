import { protectHtmlTags, restoreHtmlTags } from "../../src/processors/html-tag-placeholders.js";

describe("html-tag-placeholders", () => {
  it("protects and restores HTML comments and tags", () => {
    const src = `<!-- START doctoc -->\n<small id="lang-list">x</small>\n<br/>`;
    const p = protectHtmlTags(src);
    expect(p.htmlTagMap).toEqual([
      "<!-- START doctoc -->",
      '<small id="lang-list">',
      "</small>",
      "<br/>",
    ]);
    expect(p.protected).toContain("{{HTM_0}}");
    expect(p.protected).toContain("{{HTM_1}}");
    expect(p.protected).toContain("{{HTM_2}}");
    expect(p.protected).toContain("{{HTM_3}}");
    expect(restoreHtmlTags(p.protected, p.htmlTagMap)).toBe(src);
  });

  it("does not match prose with angle brackets", () => {
    const src = "This number is < 25 but it is > 15 and x < max and y > 0.";
    const p = protectHtmlTags(src);
    expect(p.htmlTagMap).toHaveLength(0);
    expect(p.protected).toBe(src);
  });

  it("matches tags case-insensitively", () => {
    const src = "<BR>Line</BR><Img src='a.png' />";
    const p = protectHtmlTags(src);
    expect(p.htmlTagMap).toEqual(["<BR>", "</BR>", "<Img src='a.png' />"]);
    expect(restoreHtmlTags(p.protected, p.htmlTagMap)).toBe(src);
  });
});
