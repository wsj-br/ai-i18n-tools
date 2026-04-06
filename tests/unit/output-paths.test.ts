import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config";
import {
  expandPathTemplate,
  resolveDocumentationOutputPath,
  shouldRewriteFlatMarkdownLinks,
  toPosix,
} from "../../src/core/output-paths";

function cfg(over: Record<string, unknown> = {}) {
  return parseI18nConfig(
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
      documentation: {
        contentPaths: ["docs/"],
        outputDir: "i18n",
        cacheDir: ".cache",
        markdownOutput: { style: "nested", docsRoot: "docs" },
      },
      ...over,
    })
  );
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
      documentation: {
        contentPaths: ["docs/"],
        outputDir: "i18n",
        cacheDir: ".cache",
        markdownOutput: { style: "docusaurus", docsRoot: "docs" },
      },
    });
    const out = resolveDocumentationOutputPath(c, cwd, "de", "docs/intro.md", "markdown");
    expect(toPosix(out)).toBe("/proj/i18n/de/docusaurus-plugin-content-docs/current/intro.md");
  });

  it("flat style writes stem.locale.ext in outputDir", () => {
    const c = cfg({
      documentation: {
        contentPaths: ["README.md"],
        outputDir: "translated-docs",
        cacheDir: ".cache",
        markdownOutput: { style: "flat" },
      },
    });
    const out = resolveDocumentationOutputPath(c, cwd, "pt-BR", "README.md", "markdown");
    expect(toPosix(out)).toBe("/proj/translated-docs/README.pt-BR.md");
  });

  it("pathTemplate overrides style", () => {
    const c = cfg({
      documentation: {
        contentPaths: ["docs/a.md"],
        outputDir: "out",
        cacheDir: ".cache",
        markdownOutput: {
          style: "nested",
          pathTemplate: "{outputDir}/custom/{locale}/{relPath}",
        },
      },
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
      documentation: {
        contentPaths: ["README.md"],
        outputDir: "translated-docs",
        cacheDir: ".cache",
        markdownOutput: { style: "flat" },
      },
    });
    expect(shouldRewriteFlatMarkdownLinks(c)).toBe(true);
  });

  it("JSON uses nested layout by default", () => {
    const c = cfg();
    const out = resolveDocumentationOutputPath(c, cwd, "de", "navbar.json", "json");
    expect(toPosix(out)).toBe("/proj/i18n/de/navbar.json");
  });
});
