import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config.js";
import {
  expandPathTemplate,
  resolveDocumentationOutputPath,
  shouldRewriteFlatMarkdownLinks,
  toPosix,
} from "../../src/core/output-paths.js";

function cfg(over: Record<string, unknown> = {}) {
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
      features: { translateMarkdown: true },
      ui: { sourceRoots: [], stringsJson: "s.json", flatOutputDir: "locales" },
      cacheDir: ".cache",
      documentations: [
        {
          contentPaths: ["docs/"],
          outputDir: "i18n",
          markdownOutput: { style: "nested", docsRoot: "docs" },
        },
      ],
      ...over,
    })
  );
  return toDocTranslateConfig(full, full.documentations[0]!);
}

describe("output-paths", () => {
  const cwd = "/proj";

  it("nested style mirrors locale and relPath", () => {
    const c = cfg();
    const out = resolveDocumentationOutputPath(c, cwd, "de", "docs/intro.md", "markdown");
    expect(toPosix(out)).toBe("/proj/i18n/de/docs/intro.md");
  });

  it("docusaurus style uses plugin path under docsRoot", () => {
    const c = cfg({
      documentations: [
        {
          contentPaths: ["docs/"],
          outputDir: "i18n",
          markdownOutput: { style: "docusaurus", docsRoot: "docs" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "de", "docs/intro.md", "markdown");
    expect(toPosix(out)).toBe("/proj/i18n/de/docusaurus-plugin-content-docs/current/intro.md");
  });

  it("flat style writes stem.locale.ext in outputDir", () => {
    const c = cfg({
      documentations: [
        {
          contentPaths: ["README.md"],
          outputDir: "translated-docs",
          markdownOutput: { style: "flat" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "pt-BR", "README.md", "markdown");
    expect(toPosix(out)).toBe("/proj/translated-docs/README.pt-BR.md");
  });

  it("pathTemplate overrides style", () => {
    const c = cfg({
      documentations: [
        {
          contentPaths: ["docs/a.md"],
          outputDir: "out",
          markdownOutput: {
            style: "nested",
            pathTemplate: "{outputDir}/custom/{locale}/{relPath}",
          },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "fr", "docs/a.md", "markdown");
    expect(toPosix(out)).toBe("/proj/out/custom/fr/docs/a.md");
  });

  it("expandPathTemplate fills placeholders", () => {
    const s = expandPathTemplate("{stem}.{locale}{extension}", {
      outputDir: "/out",
      locale: "de",
      relPath: "docs/x.md",
      docsRoot: "/proj/docs",
    });
    expect(s).toBe("x.de.md");
  });

  it("shouldRewriteFlatMarkdownLinks defaults for flat without template", () => {
    const c = cfg({
      documentations: [
        {
          contentPaths: ["README.md"],
          outputDir: "translated-docs",
          markdownOutput: { style: "flat" },
        },
      ],
    });
    expect(shouldRewriteFlatMarkdownLinks(c)).toBe(true);
  });

  it("JSON uses nested layout by default", () => {
    const c = cfg();
    const out = resolveDocumentationOutputPath(c, cwd, "de", "navbar.json", "json");
    expect(toPosix(out)).toBe("/proj/i18n/de/navbar.json");
  });

  it("docusaurus style uses nested path when source is outside docsRoot", () => {
    const c = cfg({
      documentations: [
        {
          contentPaths: ["other/"],
          outputDir: "i18n",
          markdownOutput: { style: "docusaurus", docsRoot: "docs" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "de", "other/intro.md", "markdown");
    expect(toPosix(out)).toBe("/proj/i18n/de/other/intro.md");
  });

  it("flat with flatPreserveRelativeDir nests under subdirectories", () => {
    const c = cfg({
      documentations: [
        {
          contentPaths: ["docs/"],
          outputDir: "out",
          markdownOutput: { style: "flat", flatPreserveRelativeDir: true },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "de", "docs/sub/page.md", "markdown");
    expect(toPosix(out)).toBe("/proj/out/docs/sub/page.de.md");
  });

  it("jsonPathTemplate applies to json artifacts", () => {
    const c = cfg({
      documentations: [
        {
          contentPaths: ["docs/"],
          outputDir: "i18n",
          markdownOutput: {
            style: "nested",
            jsonPathTemplate: "{outputDir}/j/{locale}/{relPath}",
          },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "de", "foo.json", "json");
    expect(toPosix(out)).toBe("/proj/i18n/j/de/foo.json");
  });
});
