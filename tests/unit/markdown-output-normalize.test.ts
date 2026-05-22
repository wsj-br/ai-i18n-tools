import { describe, expect, it } from "vitest";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import { ConfigValidationError } from "../../src/core/errors.js";
import { normalizeMarkdownOutputStyle } from "../../src/core/markdown-output-normalize.js";

describe("normalizeMarkdownOutputStyle", () => {
  it("maps docusaurus alias to doc-system with default localeSubpath", () => {
    const out = normalizeMarkdownOutputStyle({
      style: "docusaurus",
      flatPreserveRelativeDir: false,
    });
    expect(out.style).toBe("doc-system");
    expect(out.localeSubpath).toBe("docusaurus-plugin-content-docs/current");
  });

  it("maps astro-starlight alias to doc-system with empty localeSubpath", () => {
    const out = normalizeMarkdownOutputStyle({
      style: "astro-starlight",
      flatPreserveRelativeDir: false,
    });
    expect(out.style).toBe("doc-system");
    expect(out.localeSubpath).toBe("");
  });

  it("preserves explicit localeSubpath on docusaurus alias", () => {
    const out = normalizeMarkdownOutputStyle({
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
        features: { translateMarkdown: true },
        documentations: [
          {
            contentPaths: ["docs/"],
            outputDir: "i18n",
            markdownOutput: { style: "docusaurus", docsRoot: "docs" },
          },
        ],
      })
    );
    expect(c.documentations[0]!.markdownOutput.style).toBe("doc-system");
    expect(c.documentations[0]!.markdownOutput.localeSubpath).toBe(
      "docusaurus-plugin-content-docs/current"
    );
  });

  it("normalizes astro-starlight alias to doc-system on parse", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        targetLocales: ["de"],
        openrouter: baseOpenRouter,
        features: { translateMarkdown: true },
        documentations: [
          {
            contentPaths: ["src/content/docs/a.md"],
            outputDir: "src/content/docs",
            markdownOutput: { style: "astro-starlight", docsRoot: "src/content/docs" },
          },
        ],
      })
    );
    expect(c.documentations[0]!.markdownOutput.style).toBe("doc-system");
    expect(c.documentations[0]!.markdownOutput.localeSubpath).toBe("");
  });

  it("rejects doc-system without localeSubpath", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          targetLocales: ["de"],
          openrouter: baseOpenRouter,
          features: { translateMarkdown: true },
          documentations: [
            {
              contentPaths: ["docs/"],
              outputDir: "i18n",
              markdownOutput: { style: "doc-system", docsRoot: "docs" },
            },
          ],
        })
      )
    ).toThrow(ConfigValidationError);
  });
});
