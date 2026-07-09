import { describe, expect, it } from "vitest";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import { ConfigValidationError } from "../../src/core/errors.js";
import {
  matchesDocsOutputStylePreset,
  normalizeDocsOutputStyle,
} from "../../src/core/docs-output-normalize.js";

describe("normalizeDocsOutputStyle", () => {
  it("maps docusaurus alias to doc-system with default localeSubpath", () => {
    const out = normalizeDocsOutputStyle({
      style: "docusaurus",
      flatPreserveRelativeDir: false,
    });
    expect(out.style).toBe("doc-system");
    expect(out.localeSubpath).toBe("docusaurus-plugin-content-docs/current");
  });

  it("maps astro-starlight alias to doc-system with empty localeSubpath and localePathLowercase", () => {
    const out = normalizeDocsOutputStyle({
      style: "astro-starlight",
      flatPreserveRelativeDir: false,
    });
    expect(out.style).toBe("doc-system");
    expect(out.localeSubpath).toBe("");
    expect(out.localePathLowercase).toBe(true);
  });

  it("doc-system with empty localeSubpath defaults localePathLowercase to true", () => {
    const out = normalizeDocsOutputStyle({
      style: "doc-system",
      localeSubpath: "",
      flatPreserveRelativeDir: false,
    });
    expect(out.localePathLowercase).toBe(true);
  });

  it("preserves explicit localePathLowercase false on astro-starlight", () => {
    const out = normalizeDocsOutputStyle({
      style: "astro-starlight",
      localePathLowercase: false,
      flatPreserveRelativeDir: false,
    });
    expect(out.localePathLowercase).toBe(false);
  });

  it("maps vitepress alias to doc-system with empty localeSubpath and localePathLowercase false", () => {
    const out = normalizeDocsOutputStyle({
      style: "vitepress",
      flatPreserveRelativeDir: false,
    });
    expect(out.style).toBe("doc-system");
    expect(out.localeSubpath).toBe("");
    expect(out.localePathLowercase).toBe(false);
  });

  it("maps nextra alias to doc-system with empty localeSubpath and localePathLowercase false", () => {
    const out = normalizeDocsOutputStyle({
      style: "nextra",
      flatPreserveRelativeDir: false,
    });
    expect(out.style).toBe("doc-system");
    expect(out.localeSubpath).toBe("");
    expect(out.localePathLowercase).toBe(false);
  });

  it("preserves explicit localePathLowercase true on vitepress", () => {
    const out = normalizeDocsOutputStyle({
      style: "vitepress",
      localePathLowercase: true,
      flatPreserveRelativeDir: false,
    });
    expect(out.localePathLowercase).toBe(true);
  });

  it("preserves explicit localeSubpath on docusaurus alias", () => {
    const out = normalizeDocsOutputStyle({
      style: "docusaurus",
      localeSubpath: "custom",
      flatPreserveRelativeDir: false,
    });
    expect(out.localeSubpath).toBe("custom");
  });

  it("records stylePreset for each alias so it survives the style rewrite to doc-system", () => {
    for (const style of ["docusaurus", "astro-starlight", "vitepress", "nextra"] as const) {
      const out = normalizeDocsOutputStyle({ style, flatPreserveRelativeDir: false });
      expect(out.style).toBe("doc-system");
      expect(out.stylePreset).toBe(style);
    }
  });

  it("leaves stylePreset unset for non-alias styles", () => {
    const nested = normalizeDocsOutputStyle({ style: "nested", flatPreserveRelativeDir: false });
    expect(nested.stylePreset).toBeUndefined();
    const flat = normalizeDocsOutputStyle({ style: "flat", flatPreserveRelativeDir: false });
    expect(flat.stylePreset).toBeUndefined();
  });
});

describe("matchesDocsOutputStylePreset", () => {
  it("matches the raw alias before normalization", () => {
    expect(
      matchesDocsOutputStylePreset(
        { style: "vitepress", flatPreserveRelativeDir: false },
        "vitepress"
      )
    ).toBe(true);
  });

  it("matches via stylePreset after normalization rewrote style to doc-system", () => {
    const normalized = normalizeDocsOutputStyle({ style: "nextra", flatPreserveRelativeDir: false });
    expect(matchesDocsOutputStylePreset(normalized, "nextra")).toBe(true);
    expect(matchesDocsOutputStylePreset(normalized, "vitepress")).toBe(false);
  });

  it("does not match unrelated styles", () => {
    expect(
      matchesDocsOutputStylePreset({ style: "flat", flatPreserveRelativeDir: false }, "nextra")
    ).toBe(false);
  });
});

describe("parseI18nConfig doc-system", () => {
  const baseOpenRouter = {
    baseUrl: "https://openrouter.ai/api/v1",
    translationModels: ["m"],
    maxTokens: 100,
    temperature: 0.1,
  };

  it("normalizes docusaurus alias to doc-system on parse", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["de"],
        openrouter: baseOpenRouter,
        features: { translateDocs: true },
        docs: [
          {
            contentPaths: ["docs/"],
            outputDir: "i18n",
            docsOutput: { style: "docusaurus", docsRoot: "docs" },
          },
        ],
      })
    );
    expect(c.docs[0]!.docsOutput.style).toBe("doc-system");
    expect(c.docs[0]!.docsOutput.stylePreset).toBe("docusaurus");
    expect(c.docs[0]!.docsOutput.localeSubpath).toBe("docusaurus-plugin-content-docs/current");
  });

  it("normalizes astro-starlight alias to doc-system on parse", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        targetLocales: ["de"],
        openrouter: baseOpenRouter,
        features: { translateDocs: true },
        docs: [
          {
            contentPaths: ["src/content/docs/a.md"],
            outputDir: "src/content/docs",
            docsOutput: { style: "astro-starlight", docsRoot: "src/content/docs" },
          },
        ],
      })
    );
    expect(c.docs[0]!.docsOutput.style).toBe("doc-system");
    expect(c.docs[0]!.docsOutput.stylePreset).toBe("astro-starlight");
    expect(c.docs[0]!.docsOutput.localeSubpath).toBe("");
  });

  it("normalizes vitepress alias to doc-system on parse", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        targetLocales: ["pt-BR"],
        openrouter: baseOpenRouter,
        features: { translateDocs: true },
        docs: [
          {
            contentPaths: ["docs/index.md"],
            outputDir: "docs",
            docsOutput: { style: "vitepress", docsRoot: "docs" },
          },
        ],
      })
    );
    expect(c.docs[0]!.docsOutput.style).toBe("doc-system");
    expect(c.docs[0]!.docsOutput.stylePreset).toBe("vitepress");
    expect(c.docs[0]!.docsOutput.localeSubpath).toBe("");
    expect(c.docs[0]!.docsOutput.localePathLowercase).toBe(false);
  });

  it("normalizes nextra alias to doc-system on parse", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        targetLocales: ["pt-BR"],
        openrouter: baseOpenRouter,
        features: { translateDocs: true },
        docs: [
          {
            contentPaths: ["content/en/index.mdx"],
            outputDir: "content",
            docsOutput: { style: "nextra", docsRoot: "content/en" },
          },
        ],
      })
    );
    expect(c.docs[0]!.docsOutput.style).toBe("doc-system");
    expect(c.docs[0]!.docsOutput.stylePreset).toBe("nextra");
    expect(c.docs[0]!.docsOutput.localeSubpath).toBe("");
    expect(c.docs[0]!.docsOutput.localePathLowercase).toBe(false);
  });

  it("rejects doc-system without localeSubpath", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          targetLocales: ["de"],
          openrouter: baseOpenRouter,
          features: { translateDocs: true },
          docs: [
            {
              contentPaths: ["docs/"],
              outputDir: "i18n",
              docsOutput: { style: "doc-system", docsRoot: "docs" },
            },
          ],
        })
      )
    ).toThrow(ConfigValidationError);
  });
});
