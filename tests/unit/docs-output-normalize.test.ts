import { describe, expect, it } from "vitest";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import { ConfigValidationError } from "../../src/core/errors.js";
import { normalizeDocsOutputStyle } from "../../src/core/docs-output-normalize.js";

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
