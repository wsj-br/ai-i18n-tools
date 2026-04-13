import {
  computeFlatLinkRewritePrefixes,
  rewriteDocLinksForFlatOutput,
  rewriteOneRelativePathForFlatOutput,
} from "../../src/processors/flat-link-rewrite.js";

describe("rewriteOneRelativePathForFlatOutput", () => {
  it("returns original when path empty after trim", () => {
    expect(
      rewriteOneRelativePathForFlatOutput("", "", "", "es", "i18n", "../", [], "foo.md")
    ).toBe("");
  });

  it("strips i18n prefix when present", () => {
    expect(
      rewriteOneRelativePathForFlatOutput(
        "i18n/out/foo.md",
        "",
        "",
        "es",
        "i18n/out",
        "../",
        [],
        "foo.md"
      )
    ).toBe("foo.md");
  });

  it("depth prefix for same basename as current source", () => {
    expect(
      rewriteOneRelativePathForFlatOutput(
        "foo.md",
        "",
        "",
        "es",
        "",
        "../",
        ["foo.md", "bar.md"],
        "foo.md"
      )
    ).toBe("../foo.md");
  });

  it("locale suffix for sibling doc in same folder set", () => {
    expect(
      rewriteOneRelativePathForFlatOutput(
        "bar.md",
        "",
        "",
        "es",
        "",
        "../",
        ["foo.md", "bar.md"],
        "foo.md"
      )
    ).toBe("bar.es.md");
  });

  it("default depth prefix for other relative paths", () => {
    expect(
      rewriteOneRelativePathForFlatOutput(
        "sub/page.md",
        "?q=1",
        "#h",
        "es",
        "",
        "../",
        [],
        "foo.md"
      )
    ).toBe("../sub/page.md?q=1#h");
  });
});

describe("rewriteDocLinksForFlatOutput", () => {
  const locale = "es";
  const i18nPrefix = "";
  const depthPrefix = "../";
  const basenames = ["a.md", "b.md"];
  const current = "a.md";

  it("rewrites markdown links", () => {
    const body = "See [b](b.md) and [self](a.md).";
    const out = rewriteDocLinksForFlatOutput(
      body,
      locale,
      i18nPrefix,
      depthPrefix,
      basenames,
      current
    );
    expect(out).toContain("](b.es.md)");
    expect(out).toContain("](../a.md)");
  });

  it("leaves hash, http, mailto, protocol-relative, absolute windows paths", () => {
    const body = `[h](#x) [u](https://x) [m](mailto:a@b) [p](//cdn/x) [w](D:/foo)`;
    const out = rewriteDocLinksForFlatOutput(
      body,
      locale,
      i18nPrefix,
      depthPrefix,
      basenames,
      current
    );
    expect(out).toContain("](#x)");
    expect(out).toContain("(https://x)");
    expect(out).toContain("(mailto:a@b)");
    expect(out).toContain("(//cdn/x)");
    expect(out).toContain("(D:/foo)");
  });

  it("rewrites src=\"...\" attributes", () => {
    const body = `<img src="b.md" />`;
    const out = rewriteDocLinksForFlatOutput(
      body,
      locale,
      i18nPrefix,
      depthPrefix,
      basenames,
      current
    );
    expect(out).toContain('src="b.es.md"');
  });
});

describe("computeFlatLinkRewritePrefixes", () => {
  it("computes depth from relative path segments", () => {
    const cwd = "/proj";
    const { i18nPrefix, depthPrefix } = computeFlatLinkRewritePrefixes(
      cwd,
      "docs",
      "docs/translated-docs"
    );
    expect(i18nPrefix).toBe("translated-docs");
    expect(depthPrefix).toBe("../");
  });

  it("empty i18nPrefix yields depth 0", () => {
    const { i18nPrefix, depthPrefix } = computeFlatLinkRewritePrefixes(
      "/proj",
      "docs",
      "docs"
    );
    expect(i18nPrefix).toBe("");
    expect(depthPrefix).toBe("");
  });
});
