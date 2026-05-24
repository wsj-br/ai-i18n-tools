import { describe, expect, it } from "vitest";
import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config.js";
import type { I18nDocTranslateConfig } from "../../src/core/types.js";
import {
  computeFlatLinkRewritePrefixes,
  computePerFileDepthPrefix,
  normalizeMarkdownRelPath,
  rewriteDocLinksForFlatOutput,
  rewriteOneRelativePathForFlatOutput,
} from "../../src/processors/flat-link-rewrite.js";

const cwd = "/proj";

function cfg(over: Record<string, unknown> = {}): I18nDocTranslateConfig {
  const full = parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en",
      targetLocales: ["de"],
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels: ["m"],
        maxTokens: 100,
        temperature: 0.1,
      },
      features: { translateDocs: true },
      ui: { sourceRoots: [], stringsJson: "s.json", flatOutputDir: "locales" },
      cacheDir: ".cache",
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "i18n",
          docsOutput: { style: "nested", docsRoot: "docs" },
        },
      ],
      ...over,
    })
  );
  return toDocTranslateConfig(full, full.docs[0]!);
}

describe("normalizeMarkdownRelPath", () => {
  it("normalizes mixed separators", () => {
    expect(normalizeMarkdownRelPath("docs\\foo\\bar.md")).toBe("docs/foo/bar.md");
  });
});

describe("rewriteOneRelativePathForFlatOutput", () => {
  it("returns original when path empty after trim", () => {
    expect(
      rewriteOneRelativePathForFlatOutput("", "", "", "es", "i18n", "../", {
        cwd,
        config: cfg(),
        currentSourceRelPath: "foo.md",
        translatedMarkdownRelPaths: new Set(),
      })
    ).toBe("");
  });

  it("strips i18n prefix when present", () => {
    expect(
      rewriteOneRelativePathForFlatOutput("i18n/out/foo.md", "", "", "es", "i18n/out", "../", {
        cwd,
        config: cfg(),
        currentSourceRelPath: "foo.md",
        translatedMarkdownRelPaths: new Set(),
      })
    ).toBe("foo.md");
  });

  it("depth prefix for self link (resolved target equals current source)", () => {
    expect(
      rewriteOneRelativePathForFlatOutput("foo.md", "", "", "es", "", "../", {
        cwd,
        config: cfg(),
        currentSourceRelPath: "foo.md",
        translatedMarkdownRelPaths: new Set(["foo.md"]),
      })
    ).toBe("../foo.md");
  });

  it("locale suffix for sibling in same flat output folder (no preserve dir)", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["a.md", "b.md"],
          outputDir: "out",
          docsOutput: { style: "flat", linkRewriteDocsRoot: "." },
        },
      ],
    });
    expect(
      rewriteOneRelativePathForFlatOutput("b.md", "", "", "es", "", "../", {
        cwd,
        config: c,
        currentSourceRelPath: "a.md",
        translatedMarkdownRelPaths: new Set(["a.md", "b.md"]),
      })
    ).toBe("b.es.md");
  });

  it("preserves subdirectory for flat + flatPreserveRelativeDir (README → docs sibling)", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["README.md", "docs/GETTING_STARTED.md"],
          outputDir: "translated-docs",
          docsOutput: {
            style: "flat",
            flatPreserveRelativeDir: true,
            linkRewriteDocsRoot: ".",
          },
        },
      ],
    });
    expect(
      rewriteOneRelativePathForFlatOutput(
        "docs/GETTING_STARTED.md",
        "",
        "",
        "es",
        "translated-docs",
        "../",
        {
          cwd,
          config: c,
          currentSourceRelPath: "README.md",
          translatedMarkdownRelPaths: new Set(["README.md", "docs/GETTING_STARTED.md"]),
        }
      )
    ).toBe("docs/GETTING_STARTED.es.md");
  });

  it("resolves duplicate basenames by directory (same-folder vs cross-folder)", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/a.md", "other/a.md", "docs/x.md", "other/x.md"],
          outputDir: "out",
          docsOutput: {
            style: "flat",
            flatPreserveRelativeDir: true,
            linkRewriteDocsRoot: ".",
          },
        },
      ],
    });
    const set = new Set(["docs/a.md", "other/a.md", "docs/x.md", "other/x.md"]);
    expect(
      rewriteOneRelativePathForFlatOutput("./a.md", "", "", "de", "", "../", {
        cwd,
        config: c,
        currentSourceRelPath: "docs/x.md",
        translatedMarkdownRelPaths: set,
      })
    ).toBe("a.de.md");
    expect(
      rewriteOneRelativePathForFlatOutput("./a.md", "", "", "de", "", "../", {
        cwd,
        config: c,
        currentSourceRelPath: "other/x.md",
        translatedMarkdownRelPaths: set,
      })
    ).toBe("a.de.md");
    expect(
      rewriteOneRelativePathForFlatOutput("../other/a.md", "", "", "de", "", "../", {
        cwd,
        config: c,
        currentSourceRelPath: "docs/x.md",
        translatedMarkdownRelPaths: set,
      })
    ).toBe("../other/a.de.md");
  });

  it("resolves nested relative link from docs to repo root README", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["README.md", "docs/page.md"],
          outputDir: "translated-docs",
          docsOutput: {
            style: "flat",
            flatPreserveRelativeDir: true,
            linkRewriteDocsRoot: ".",
          },
        },
      ],
    });
    expect(
      rewriteOneRelativePathForFlatOutput("../README.md", "", "", "es", "translated-docs", "../", {
        cwd,
        config: c,
        currentSourceRelPath: "docs/page.md",
        translatedMarkdownRelPaths: new Set(["README.md", "docs/page.md"]),
      })
    ).toBe("../README.es.md");
  });

  it("default depth prefix for paths not in translated set", () => {
    expect(
      rewriteOneRelativePathForFlatOutput("sub/page.md", "?q=1", "#h", "es", "", "../", {
        cwd,
        config: cfg(),
        currentSourceRelPath: "foo.md",
        translatedMarkdownRelPaths: new Set(["foo.md"]),
      })
    ).toBe("../sub/page.md?q=1#h");
  });
});

describe("rewriteDocLinksForFlatOutput", () => {
  const locale = "es";
  const i18nPrefix = "";
  const depthPrefix = "../";
  const flatCfg = cfg({
    docs: [
      {
        contentPaths: ["a.md", "b.md"],
        outputDir: "out",
        docsOutput: { style: "flat", linkRewriteDocsRoot: "." },
      },
    ],
  });
  const ctx = {
    cwd,
    config: flatCfg,
    currentSourceRelPath: "a.md",
    translatedMarkdownRelPaths: new Set(["a.md", "b.md"]),
  };

  it("rewrites markdown links", () => {
    const body = "See [b](b.md) and [self](a.md).";
    const out = rewriteDocLinksForFlatOutput(body, locale, i18nPrefix, depthPrefix, ctx);
    expect(out).toContain("](b.es.md)");
    expect(out).toContain("](../a.md)");
  });

  it("leaves hash, http, mailto, protocol-relative, absolute windows paths", () => {
    const body = `[h](#x) [u](https://x) [m](mailto:a@b) [p](//cdn/x) [w](D:/foo)`;
    const out = rewriteDocLinksForFlatOutput(body, locale, i18nPrefix, depthPrefix, ctx);
    expect(out).toContain("](#x)");
    expect(out).toContain("(https://x)");
    expect(out).toContain("(mailto:a@b)");
    expect(out).toContain("(//cdn/x)");
    expect(out).toContain("(D:/foo)");
  });

  it('rewrites src="..." attributes', () => {
    const body = `<img src="b.md" />`;
    const out = rewriteDocLinksForFlatOutput(body, locale, i18nPrefix, depthPrefix, ctx);
    expect(out).toContain('src="b.es.md"');
  });
});

describe("computeFlatLinkRewritePrefixes", () => {
  it("computes depth from relative path segments", () => {
    const { i18nPrefix, depthPrefix } = computeFlatLinkRewritePrefixes(
      cwd,
      "docs",
      "docs/translated-docs"
    );
    expect(i18nPrefix).toBe("translated-docs");
    expect(depthPrefix).toBe("../");
  });

  it("empty i18nPrefix yields depth 0", () => {
    const { i18nPrefix, depthPrefix } = computeFlatLinkRewritePrefixes("/proj", "docs", "docs");
    expect(i18nPrefix).toBe("");
    expect(depthPrefix).toBe("");
  });
});

describe("computePerFileDepthPrefix", () => {
  function flatCfg(over: Partial<Parameters<typeof cfg>[0]> = {}) {
    return cfg({
      docs: [
        {
          contentPaths: ["README.md", "docs/GETTING_STARTED.md"],
          outputDir: "translated-docs",
          docsOutput: {
            style: "flat",
            flatPreserveRelativeDir: true,
            linkRewriteDocsRoot: ".",
          },
        },
      ],
      ...over,
    });
  }

  it("source at repo root: same as global depthPrefix (one level)", () => {
    const c = flatCfg();
    const prefix = computePerFileDepthPrefix(cwd, c, "de", "README.md");
    expect(prefix).toBe("../");
  });

  it("source in subdirectory: prefix includes the subdirectory path back to source", () => {
    const c = flatCfg();
    // docs/GETTING_STARTED.md → translated-docs/docs/GETTING_STARTED.de.md
    // from translated-docs/docs/ back to /proj/docs/ = ../../docs/
    const prefix = computePerFileDepthPrefix(cwd, c, "de", "docs/GETTING_STARTED.md");
    expect(prefix).toBe("../../docs/");
  });

  it("ensures asset next to source resolves correctly after prepend", () => {
    const c = flatCfg();
    const prefix = computePerFileDepthPrefix(cwd, c, "de", "docs/GETTING_STARTED.md");
    // asset URL "figure.png" in source docs/GETTING_STARTED.md should become "../../docs/figure.png"
    // which resolves from translated-docs/docs/ → docs/figure.png ✓
    expect(`${prefix}figure.png`).toBe("../../docs/figure.png");
  });

  it("source at repo root, two-level outputDir: two levels deep prefix", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["README.md"],
          outputDir: "out/translated",
          docsOutput: { style: "flat", linkRewriteDocsRoot: "." },
        },
      ],
    });
    // README.md → out/translated/README.de.md; from out/translated/ back to /proj/ = ../../
    const prefix = computePerFileDepthPrefix(cwd, c, "de", "README.md");
    expect(prefix).toBe("../../");
  });
});
