import { resolveSegmentLogFilepath } from "../../src/server/translation-editor.js";

describe("resolveSegmentLogFilepath", () => {
  const js = "docs-site/i18n/en";

  it("prepends jsonSource for bare JSON filename (legacy cache)", () => {
    expect(resolveSegmentLogFilepath("code.json", js)).toBe("docs-site/i18n/en/code.json");
  });

  it("prepends jsonSource for nested path under json root (legacy cache)", () => {
    expect(resolveSegmentLogFilepath("docusaurus-theme-classic/footer.json", js)).toBe(
      "docs-site/i18n/en/docusaurus-theme-classic/footer.json"
    );
  });

  it("does not change paths already under jsonSource", () => {
    expect(resolveSegmentLogFilepath("docs-site/i18n/en/code.json", js)).toBe(
      "docs-site/i18n/en/code.json"
    );
  });

  it("does not change markdown paths", () => {
    expect(resolveSegmentLogFilepath("docs-site/docs/guide.md", js)).toBe("docs-site/docs/guide.md");
  });

  it("no-ops when jsonSource is unset", () => {
    expect(resolveSegmentLogFilepath("code.json", null)).toBe("code.json");
  });
});
