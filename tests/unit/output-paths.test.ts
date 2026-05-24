import { describe, expect, it } from "vitest";
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

describe("output-paths", () => {
  const cwd = "/proj";

  it("nested style mirrors locale and relPath", () => {
    const c = cfg();
    const out = resolveDocumentationOutputPath(c, cwd, "de", "docs/intro.md", "markdown");
    expect(toPosix(out)).toBe("/proj/i18n/de/docs/intro.md");
  });

  it("docusaurus style uses plugin path under docsRoot", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "i18n",
          docsOutput: { style: "docusaurus", docsRoot: "docs" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "de", "docs/intro.md", "markdown");
    expect(toPosix(out)).toBe("/proj/i18n/de/docusaurus-plugin-content-docs/current/intro.md");
  });

  it("doc-system style uses localeSubpath under docsRoot", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "i18n",
          docsOutput: {
            style: "doc-system",
            docsRoot: "docs",
            localeSubpath: "custom/prefix",
          },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "de", "docs/intro.md", "markdown");
    expect(toPosix(out)).toBe("/proj/i18n/de/custom/prefix/intro.md");
  });

  it("astro-starlight alias writes directly under locale folder", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["src/content/docs/quick-start.md"],
          outputDir: "src/content/docs",
          docsOutput: { style: "astro-starlight", docsRoot: "src/content/docs" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "de",
      "src/content/docs/quick-start.md",
      "markdown"
    );
    expect(toPosix(out)).toBe("/proj/src/content/docs/de/quick-start.md");
  });

  it("astro-starlight lowercases regional locale folders for Starlight", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["src/content/docs/feature-showcase.mdx"],
          outputDir: "src/content/docs",
          docsOutput: { style: "astro-starlight", docsRoot: "src/content/docs" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "pt-BR",
      "src/content/docs/feature-showcase.mdx",
      "markdown"
    );
    expect(toPosix(out)).toBe("/proj/src/content/docs/pt-br/feature-showcase.mdx");
  });

  it("doc-system with empty localeSubpath writes directly under locale folder", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["src/content/docs/quick-start.md"],
          outputDir: "src/content/docs",
          docsOutput: {
            style: "doc-system",
            docsRoot: "src/content/docs",
            localeSubpath: "",
          },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "de",
      "src/content/docs/quick-start.md",
      "markdown"
    );
    expect(toPosix(out)).toBe("/proj/src/content/docs/de/quick-start.md");
  });

  it("flat style writes stem.locale.ext in outputDir", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["README.md"],
          outputDir: "translated-docs",
          docsOutput: { style: "flat" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "pt-BR", "README.md", "markdown");
    expect(toPosix(out)).toBe("/proj/translated-docs/README.pt-BR.md");
  });

  it("pathTemplate overrides style", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/a.md"],
          outputDir: "out",
          docsOutput: {
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

  it("expandPathTemplate fills {llocale} as lowercased locale", () => {
    const s = expandPathTemplate("{outputDir}/{llocale}/{relPath}", {
      outputDir: "/out",
      locale: "pt-BR",
      relPath: "src/i18n/en/translation.json",
      docsRoot: "/proj/docs",
    });
    expect(s).toBe("/out/pt-br/src/i18n/en/translation.json");
  });

  it("localePathLowercase on nested style lowercases folder segment", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "i18n",
          docsOutput: { style: "nested", localePathLowercase: true },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "pt-BR", "docs/intro.md", "markdown");
    expect(toPosix(out)).toBe("/proj/i18n/pt-br/docs/intro.md");
  });

  it("localePathLowercase on flat style lowercases filename segment", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["README.md"],
          outputDir: "translated-docs",
          docsOutput: { style: "flat", localePathLowercase: true },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "pt-BR", "README.md", "markdown");
    expect(toPosix(out)).toBe("/proj/translated-docs/README.pt-br.md");
  });

  it("astro-starlight with localePathLowercase false preserves BCP-47 folder", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["src/content/docs/feature-showcase.mdx"],
          outputDir: "src/content/docs",
          docsOutput: {
            style: "astro-starlight",
            docsRoot: "src/content/docs",
            localePathLowercase: false,
          },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "pt-BR",
      "src/content/docs/feature-showcase.mdx",
      "markdown"
    );
    expect(toPosix(out)).toBe("/proj/src/content/docs/pt-BR/feature-showcase.mdx");
  });

  it("shouldRewriteFlatMarkdownLinks defaults for flat without template", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["README.md"],
          outputDir: "translated-docs",
          docsOutput: { style: "flat" },
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
      docs: [
        {
          contentPaths: ["other/"],
          outputDir: "i18n",
          docsOutput: { style: "docusaurus", docsRoot: "docs" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "de", "other/intro.md", "markdown");
    expect(toPosix(out)).toBe("/proj/i18n/de/other/intro.md");
  });

  it("doc-system style uses nested path when source is outside docsRoot", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["other/"],
          outputDir: "i18n",
          docsOutput: {
            style: "doc-system",
            docsRoot: "docs",
            localeSubpath: "plugin/current",
          },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "de", "other/intro.md", "markdown");
    expect(toPosix(out)).toBe("/proj/i18n/de/other/intro.md");
  });

  it("flat with flatPreserveRelativeDir nests under subdirectories", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "out",
          docsOutput: { style: "flat", flatPreserveRelativeDir: true },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "de", "docs/sub/page.md", "markdown");
    expect(toPosix(out)).toBe("/proj/out/docs/sub/page.de.md");
  });

  it("jsonPathTemplate applies to json artifacts", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "i18n",
          docsOutput: {
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
