import { describe, expect, it } from "vitest";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import { ConfigValidationError } from "../../src/core/errors.js";
import { uiBlockFileTrackingKey } from "../../src/core/doc-file-tracking.js";
import { resolveCacheTrackingKeyToAbs } from "../../src/core/cache-tracking-keys.js";
import {
  collectUiTargetLocales,
  configHasDocWork,
  configHasJsonWork,
  configHasUiWork,
  effectiveUiTargetLocales,
  resolveLocalesForUiBlock,
  resolveUiBlockPaths,
  resolveUiGlossaryPaths,
  selectUiBlocks,
} from "../../src/core/ui-blocks.js";

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

  it("resolves block paths and glossary paths", () => {
    const config = load({
      languagesManifestPath: "root-manifest.json",
      ui: [
        {
          sourceRoots: ["src/"],
          stringsJson: "locales/app.json",
          flatOutputDir: "locales/app",
          languagesManifestPath: "locales/app/ui-languages.json",
        },
        {
          sourceRoots: ["site/"],
          stringsJson: "locales/site.json",
          flatOutputDir: "locales/site",
          uiGlossary: false,
        },
      ],
    });
    const cwd = "/proj";
    const block0 = resolveUiBlockPaths(config, config.ui[0]!, 0, cwd);
    expect(block0.languagesManifest).toBe("/proj/locales/app/ui-languages.json");
    const block1 = resolveUiBlockPaths(config, config.ui[1]!, 1, cwd);
    expect(block1.languagesManifest).toBe("/proj/locales/site/ui-languages.json");
    const rootOnly = load({
      ui: {
        sourceRoots: ["src/"],
        stringsJson: "locales/strings.json",
        flatOutputDir: "locales",
      },
      languagesManifestPath: "manifest.json",
    });
    const rootPaths = resolveUiBlockPaths(rootOnly, rootOnly.ui[0]!, 0, cwd);
    expect(rootPaths.languagesManifest).toBe("/proj/manifest.json");
    expect(resolveUiGlossaryPaths(config, cwd)).toEqual(["/proj/locales/app.json"]);
    expect(resolveUiGlossaryPaths({}, cwd)).toEqual([]);
  });

  it("resolves locales per block and collects targets", () => {
    const config = load({
      targetLocales: ["de", "fr"],
      ui: [
        {
          sourceRoots: ["src/"],
          stringsJson: "a.json",
          flatOutputDir: "locales/a",
          targetLocales: ["de"],
        },
        {
          sourceRoots: ["site/"],
          stringsJson: "b.json",
          flatOutputDir: "locales/b",
        },
      ],
    });
    expect(effectiveUiTargetLocales(config, config.ui[0]!)).toEqual(["de"]);
    expect(effectiveUiTargetLocales(config, config.ui[1]!)).toEqual(["de", "fr"]);
    expect(resolveLocalesForUiBlock(config, config.ui[0]!, "/p", "de fr")).toEqual(["de"]);
    expect(collectUiTargetLocales(config, "/p")).toEqual(["de", "fr"]);
    expect(configHasUiWork(config)).toBe(true);
    expect(configHasDocWork(config)).toBe(true);
    expect(
      configHasJsonWork(
        load({
          json: [{ contentPaths: ["data/"], outputPathTemplate: "{locale}.json" }],
        })
      )
    ).toBe(true);
  });

  it("selectUiBlocks by index and rejects bad selectors", () => {
    const config = {
      ...load({
        ui: {
          description: "App",
          sourceRoots: ["src/"],
          stringsJson: "locales/app.json",
          flatOutputDir: "locales/app",
        },
      }),
      ui: [
        {
          description: "Dup",
          sourceRoots: ["src/"],
          stringsJson: "locales/app.json",
          flatOutputDir: "locales/app",
          uiGlossary: true,
        },
        {
          description: "Dup",
          sourceRoots: ["site/"],
          stringsJson: "locales/site.json",
          flatOutputDir: "locales/site",
          uiGlossary: true,
        },
      ],
    };
    expect(selectUiBlocks(config, "0")[0]?.index).toBe(0);
    expect(() => selectUiBlocks(config, "missing")).toThrow(/Unknown --ui-block/);
    expect(() => selectUiBlocks(config, "Dup")).toThrow(/more than one/);
    const empty = load({
      ui: { sourceRoots: [], stringsJson: "x.json", flatOutputDir: "locales" },
    });
    expect(() => selectUiBlocks(empty, "x.json")).toThrow(/no sourceRoots/);
  });
});
