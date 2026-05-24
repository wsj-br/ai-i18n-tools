import { describe, expect, it } from "vitest";
import { shouldRunAstro, shouldRunMarkdown } from "../../src/cli/doc-translate.js";
import type { I18nDocTranslateConfig } from "../../src/core/types.js";

function baseConfig(): I18nDocTranslateConfig {
  return {
    sourceLocale: "en",
    targetLocales: ["de"],
    features: {
      extractUIStrings: false,
      translateUIStrings: false,
      translateMarkdown: true,
      translateJSON: false,
      translateSVG: false,
    },
    documentation: {
      contentPaths: ["src/pages"],
      outputDir: "src/pages",
      markdownOutput: { style: "astro-starlight", docsRoot: "src/pages" },
    },
    cacheDir: ".cache",
    openrouter: { baseUrl: "https://openrouter.ai/api/v1" },
  } as I18nDocTranslateConfig;
}

describe("shouldRunAstro / shouldRunMarkdown", () => {
  it("runs astro when translateMarkdown is on and typeFilter is unset", () => {
    const config = baseConfig();
    const opts = {
      cwd: ".",
      locales: ["de"],
      dryRun: true,
      force: false,
      forceUpdate: false,
      noCache: true,
      verbose: false,
    };
    expect(shouldRunAstro(opts, config)).toBe(true);
    expect(shouldRunMarkdown(opts, config)).toBe(true);
  });

  it("typeFilter astro skips markdown", () => {
    const config = baseConfig();
    const opts = {
      cwd: ".",
      locales: ["de"],
      dryRun: true,
      force: false,
      forceUpdate: false,
      noCache: true,
      verbose: false,
      typeFilter: "astro" as const,
    };
    expect(shouldRunAstro(opts, config)).toBe(true);
    expect(shouldRunMarkdown(opts, config)).toBe(false);
  });
});
