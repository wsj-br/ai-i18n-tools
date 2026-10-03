import { describe, expect, it } from "vitest";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import { ConfigValidationError } from "../../src/core/errors.js";
import { uiBlockFileTrackingKey } from "../../src/core/doc-file-tracking.js";
import { resolveCacheTrackingKeyToAbs } from "../../src/core/cache-tracking-keys.js";
import { selectUiBlocks } from "../../src/core/ui-blocks.js";

const provider = {
  provider: "openrouter",
  providers: {
    openrouter: {
      translationModels: ["m"],
      maxTokens: 100,
      temperature: 0,
    },
  },
};

function load(extra: Record<string, unknown> = {}) {
  return parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en",
      targetLocales: ["de"],
      cacheDir: ".translation-cache",
      docs: [{ contentPaths: ["docs/"], outputDir: "./out" }],
      ...provider,
      ...extra,
    })
  );
}

describe("ui blocks", () => {
  it("wraps a single ui object into an array", () => {
    const config = load({
      ui: {
        description: "App",
        sourceRoots: ["src/"],
        stringsJson: "locales/strings.json",
        flatOutputDir: "locales",
      },
    });
    expect(config.ui).toHaveLength(1);
    expect(config.ui[0]?.description).toBe("App");
    expect(config.ui[0]?.uiGlossary).toBe(true);
  });

  it("keeps an array of blocks and selects by description or path", () => {
    const config = load({
      ui: [
        {
          description: "App",
          sourceRoots: ["src/"],
          stringsJson: "locales/app.json",
          flatOutputDir: "locales/app",
        },
        {
          description: "Marketing",
          sourceRoots: ["site/"],
          stringsJson: "locales/site.json",
          flatOutputDir: "locales/site",
          uiGlossary: false,
        },
      ],
    });
    expect(selectUiBlocks(config, "Marketing")[0]?.index).toBe(1);
    expect(selectUiBlocks(config, "locales/site.json")[0]?.block.uiGlossary).toBe(false);
    expect(selectUiBlocks(config).map((item) => item.index)).toEqual([0, 1]);
  });

  it("rejects a shared catalog path and a duplicate description", () => {
    expect(() =>
      load({
        ui: [
          { sourceRoots: ["a/"], stringsJson: "same.json", flatOutputDir: "locales/a" },
          { sourceRoots: ["b/"], stringsJson: "same.json", flatOutputDir: "locales/b" },
        ],
      })
    ).toThrow(ConfigValidationError);

    expect(() =>
      load({
        ui: [
          {
            description: "Same",
            sourceRoots: ["a/"],
            stringsJson: "locales/a.json",
            flatOutputDir: "locales/a",
          },
          {
            description: "Same",
            sourceRoots: ["b/"],
            stringsJson: "locales/b.json",
            flatOutputDir: "locales/b",
          },
        ],
      })
    ).toThrow(/Descriptions must be unique/);
  });

  it("fails legacy glossary.uiGlossary with a fix", () => {
    expect(() =>
      load({
        ui: {
          sourceRoots: ["src/"],
          stringsJson: "locales/strings.json",
          flatOutputDir: "locales",
        },
        glossary: { uiGlossary: "locales/strings.json" },
      })
    ).toThrow(/uiGlossary/);
  });

  it("skips an omitted UI flag when no block has sourceRoots", () => {
    const config = load({
      features: { translateDocs: true },
    });
    expect(config.features.translateUIStrings).toBe(true);
    expect(config.ui[0]?.sourceRoots).toEqual([]);
  });

  it("rejects an explicit translateUIStrings with no sourceRoots", () => {
    expect(() => load({ features: { translateUIStrings: true, translateDocs: true } })).toThrow(
      /sourceRoots/
    );
  });

  it("names the guidance row from the catalog path", () => {
    const key = uiBlockFileTrackingKey("src/i18n/strings.json");
    expect(key).toBe("ui-block:src/i18n/strings.json");
    expect(resolveCacheTrackingKeyToAbs("/work", key)).toBe("/work/src/i18n/strings.json");
  });
});
