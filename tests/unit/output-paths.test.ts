import { describe, expect, it } from "vitest";
import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config.js";
import {
  expandPathTemplate,
  resolveDocumentationOutputPath,
  shouldRewriteFlatMarkdownLinks,
  shouldRewriteFumadocsLinks,
  shouldRewriteNextraLinks,
  shouldRewriteVitepressLinks,
  toPosix,
  vitepressLinkNormalizeContext,
  vitepressLocaleRoutePrefix,
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

  it("vitepress alias writes directly under locale folder", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/guide/getting-started.md"],
          outputDir: "docs",
          docsOutput: { style: "vitepress", docsRoot: "docs" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "de",
      "docs/guide/getting-started.md",
      "markdown"
    );
    expect(toPosix(out)).toBe("/proj/docs/de/guide/getting-started.md");
  });

  it("vitepress preserves BCP-47 locale folder casing by default", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/index.md"],
          outputDir: "docs",
          docsOutput: { style: "vitepress", docsRoot: "docs" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "pt-BR", "docs/index.md", "markdown");
    expect(toPosix(out)).toBe("/proj/docs/pt-BR/index.md");
  });

  it("vitepressLocaleRoutePrefix is set for locale output and null for root English paths", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/index.md"],
          outputDir: "docs",
          docsOutput: { style: "vitepress", docsRoot: "docs" },
        },
      ],
    });
    expect(vitepressLocaleRoutePrefix(c, cwd, "pt-BR", "docs/index.md")).toBe("/pt-BR");
    const ctx = vitepressLinkNormalizeContext(c, "docs/index.md", "pt-BR", cwd);
    expect(ctx.localeRoutePrefix).toBe("/pt-BR");
  });

  it("vitepress with localePathLowercase true lowercases locale folder", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/index.md"],
          outputDir: "docs",
          docsOutput: {
            style: "vitepress",
            docsRoot: "docs",
            localePathLowercase: true,
          },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "zh-Hans", "docs/index.md", "markdown");
    expect(toPosix(out)).toBe("/proj/docs/zh-hans/index.md");
  });

  it("vitepress pathTemplate overrides style", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/a.md"],
          outputDir: "docs",
          docsOutput: {
            style: "vitepress",
            docsRoot: "docs",
            pathTemplate: "{outputDir}/custom/{locale}/{relPath}",
          },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(c, cwd, "fr", "docs/a.md", "markdown");
    expect(toPosix(out)).toBe("/proj/docs/custom/fr/docs/a.md");
  });

  it("nextra alias writes directly under locale folder from content/en", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["content/en/guide/getting-started.mdx"],
          outputDir: "content",
          docsOutput: { style: "nextra", docsRoot: "content/en" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "pt-BR",
      "content/en/guide/getting-started.mdx",
      "markdown"
    );
    expect(toPosix(out)).toBe("/proj/content/pt-BR/guide/getting-started.mdx");
  });

  it("nextra json artifacts strip docsRoot like markdown (_meta.ts)", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["content/en"],
          outputDir: "content",
          docsOutput: { style: "nextra", docsRoot: "content/en" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "pt-BR",
      "content/en/guide/_meta.ts",
      "json"
    );
    expect(toPosix(out)).toBe("/proj/content/pt-BR/guide/_meta.ts");
  });

  it("nextra preserves BCP-47 locale folder casing by default", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["content/en/index.mdx"],
          outputDir: "content",
          docsOutput: { style: "nextra", docsRoot: "content/en" },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "zh-Hans",
      "content/en/index.mdx",
      "markdown"
    );
    expect(toPosix(out)).toBe("/proj/content/zh-Hans/index.mdx");
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

  // Regression: `docsOutput.style` is rewritten to canonical "doc-system" by config
  // normalization, so these defaults must survive via `stylePreset`, not a direct
  // `style === "vitepress"` / `"nextra"` comparison (which would never match here).
  it("shouldRewriteVitepressLinks defaults to true for the vitepress alias after normalization", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/index.md"],
          outputDir: "docs",
          docsOutput: { style: "vitepress", docsRoot: "docs" },
        },
      ],
    });
    expect(c.doc.docsOutput.style).toBe("doc-system");
    expect(shouldRewriteVitepressLinks(c)).toBe(true);
  });

  it("shouldRewriteVitepressLinks respects explicit false override on the vitepress alias", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["docs/index.md"],
          outputDir: "docs",
          docsOutput: { style: "vitepress", docsRoot: "docs", rewriteVitepressLinks: false },
        },
      ],
    });
    expect(shouldRewriteVitepressLinks(c)).toBe(false);
  });

  it("shouldRewriteVitepressLinks is false for non-vitepress styles by default", () => {
    const c = cfg();
    expect(shouldRewriteVitepressLinks(c)).toBe(false);
  });

  it("shouldRewriteNextraLinks defaults to true for the nextra alias after normalization", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["content/en/index.mdx"],
          outputDir: "content",
          docsOutput: { style: "nextra", docsRoot: "content/en" },
        },
      ],
    });
    expect(c.doc.docsOutput.style).toBe("doc-system");
    expect(shouldRewriteNextraLinks(c)).toBe(true);
  });

  it("shouldRewriteNextraLinks respects explicit false override on the nextra alias", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["content/en/index.mdx"],
          outputDir: "content",
          docsOutput: { style: "nextra", docsRoot: "content/en", rewriteNextraLinks: false },
        },
      ],
    });
    expect(shouldRewriteNextraLinks(c)).toBe(false);
  });

  it("fumadocs dot parser writes locale suffix beside source", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["content/docs/index.mdx"],
          outputDir: "content/docs",
          docsOutput: {
            style: "fumadocs",
            docsRoot: "content/docs",
            fumadocsParser: "dot",
          },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "pt",
      "content/docs/guide/start.mdx",
      "markdown"
    );
    expect(toPosix(out)).toBe("/proj/content/docs/guide/start.pt.mdx");
  });

  it("fumadocs dir parser writes under locale folder from content/docs/en", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["content/docs/en"],
          outputDir: "content/docs",
          docsOutput: {
            style: "fumadocs",
            docsRoot: "content/docs/en",
            fumadocsParser: "dir",
          },
        },
      ],
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "pt-BR",
      "content/docs/en/guide/start.mdx",
      "markdown"
    );
    expect(toPosix(out)).toBe("/proj/content/docs/pt-BR/guide/start.mdx");
  });

  it("shouldRewriteFumadocsLinks defaults to true for the fumadocs alias after normalization", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["content/docs/index.mdx"],
          outputDir: "content/docs",
          docsOutput: { style: "fumadocs", docsRoot: "content/docs" },
        },
      ],
    });
    expect(c.doc.docsOutput.style).toBe("doc-system");
    expect(shouldRewriteFumadocsLinks(c)).toBe(true);
  });

  it("shouldRewriteFumadocsLinks respects explicit false override", () => {
    const c = cfg({
      docs: [
        {
          contentPaths: ["content/docs/index.mdx"],
          outputDir: "content/docs",
          docsOutput: {
            style: "fumadocs",
            docsRoot: "content/docs",
            rewriteFumadocsLinks: false,
          },
        },
      ],
    });
    expect(shouldRewriteFumadocsLinks(c)).toBe(false);
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
