import { protectMarkdownUrls, restoreMarkdownUrls } from "../../src/processors/url-placeholders.js";

describe("url-placeholders", () => {
  it("protectMarkdownUrls replaces link targets with placeholders", () => {
    const { protected: p, urlMap } = protectMarkdownUrls("[a](https://x.com/y)");
    expect(p).toContain("{{URL_PLACEHOLDER_0}}");
    expect(urlMap).toEqual(["https://x.com/y"]);
  });

  it("restoreMarkdownUrls returns text unchanged when urlMap empty", () => {
    expect(restoreMarkdownUrls("no placeholders", [])).toBe("no placeholders");
  });

  it("restoreMarkdownUrls restores multiple placeholders in order", () => {
    const { protected: p, urlMap } = protectMarkdownUrls("[a](u1)[b](u2)");
    expect(restoreMarkdownUrls(p, urlMap)).toBe("[a](u1)[b](u2)");
  });
});
