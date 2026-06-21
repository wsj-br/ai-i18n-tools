import { describe, expect, it } from "vitest";
import { shouldRunAstro, shouldRunMarkdown } from "../../src/cli/doc-translate.js";
import type { I18nDocTranslateConfig } from "../../src/core/types.js";

function baseConfig(): I18nDocTranslateConfig {
  return {
    sourceLocale: "en",
    targetLocales: ["de"],
    features: {
      translateUIStrings: false,
      translateDocs: true,
      translateJson: false,
      translateSVG: false,
    },
    doc: {
      contentPaths: ["src/pages"],
      outputDir: "src/pages",
      docsOutput: { style: "astro-starlight", docsRoot: "src/pages" },
    },
    cacheDir: ".cache",
    provider: "openrouter",
    providers: { openrouter: { translationModels: ["m"] } },
  } as unknown as I18nDocTranslateConfig;
}

describe("shouldRunAstro / shouldRunMarkdown", () => {
  it("runs astro when translateDocs is on and typeFilter is unset", () => {
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
