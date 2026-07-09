import { describe, expect, it } from "vitest";
import {
  filterFumadocsDotMarkdownSources,
  isFumadocsDotLocaleSuffixedSource,
} from "../../src/core/fumadocs-dot-source-filter.js";
import type { I18nDocTranslateConfig } from "../../src/core/types.js";

function dotConfig(): I18nDocTranslateConfig {
  return {
    doc: {
      contentPaths: ["content/docs"],
      outputDir: "content/docs",
      docsOutput: {
        style: "fumadocs",
        docsRoot: "content/docs",
        fumadocsParser: "dot",
      },
    },
    features: { translateDocs: true },
    targetLocales: ["pt", "zh"],
  } as I18nDocTranslateConfig;
}

describe("fumadocs dot source filter", () => {
  it("excludes locale-suffixed markdown sources for dot parser", () => {
    const config = dotConfig();
    expect(isFumadocsDotLocaleSuffixedSource("content/docs/foo.pt.mdx", config)).toBe(true);
    expect(isFumadocsDotLocaleSuffixedSource("content/docs/foo.mdx", config)).toBe(false);
    expect(isFumadocsDotLocaleSuffixedSource("content/docs/guide/bar.zh.mdx", config)).toBe(true);
  });

  it("filters a file list", () => {
    const config = dotConfig();
    const files = [
      "content/docs/index.mdx",
      "content/docs/index.pt.mdx",
      "content/docs/guide/start.zh.mdx",
    ];
    expect(filterFumadocsDotMarkdownSources(files, config)).toEqual(["content/docs/index.mdx"]);
  });

  it("does not filter when parser is dir", () => {
    const config = {
      ...dotConfig(),
      doc: {
        ...dotConfig().doc,
        docsOutput: {
          style: "fumadocs",
          docsRoot: "content/docs/en",
          fumadocsParser: "dir",
        },
      },
    } as I18nDocTranslateConfig;
    const files = ["content/docs/en/index.mdx", "content/docs/pt/index.mdx"];
    expect(filterFumadocsDotMarkdownSources(files, config)).toEqual(files);
  });
});
