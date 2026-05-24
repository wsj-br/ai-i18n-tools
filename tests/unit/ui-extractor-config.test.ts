import { describe, expect, it } from "vitest";
import { getUiExtractorConfig } from "../../src/core/ui-extractor-config.js";
import type { UiConfig } from "../../src/core/types.js";

describe("getUiExtractorConfig", () => {
  it("prefers uiExtractor over reactExtractor", () => {
    const ui = {
      sourceRoots: ["src/"],
      stringsJson: "strings.json",
      flatOutputDir: "./locales",
      uiExtractor: { extensions: [".astro"] },
      reactExtractor: { extensions: [".ts"] },
    } as UiConfig;
    expect(getUiExtractorConfig(ui)?.extensions).toEqual([".astro"]);
  });

  it("falls back to reactExtractor when uiExtractor is unset", () => {
    const ui = {
      sourceRoots: ["src/"],
      stringsJson: "strings.json",
      flatOutputDir: "./locales",
      reactExtractor: { extensions: [".tsx"] },
    } as UiConfig;
    expect(getUiExtractorConfig(ui)?.extensions).toEqual([".tsx"]);
  });
});
