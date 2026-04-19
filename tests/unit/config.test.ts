import fs from "fs";
import os from "os";
import path from "path";
import {
  applyEnvOverrides,
  loadI18nConfigFromFile,
  mergeWithDefaults,
  normalizeLocale,
  parseI18nConfig,
  parseLocaleList,
  resolveTranslationModels,
  resolveUITranslationModels,
  validateI18nBusinessRules,
  writeInitConfigFile,
} from "../../src/core/config.js";
import { ConfigValidationError } from "../../src/core/errors.js";
import type { I18nConfig } from "../../src/core/types.js";

const docBlockDefaults = {
  contentPaths: ["docs/"] as string[],
  outputDir: "./out",
};

const uiDefaults = {
  sourceRoots: [] as string[],
  stringsJson: "strings.json",
  flatOutputDir: "./locales",
};

describe("resolveTranslationModels", () => {
  it("prefers non-empty translationModels", () => {
    expect(
      resolveTranslationModels({
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels: ["a", "b"],
        maxTokens: 100,
        temperature: 0.1,
      })
    ).toEqual(["a", "b"]);
  });

  it("falls back to defaultModel and fallbackModel", () => {
    expect(
      resolveTranslationModels({
        baseUrl: "https://openrouter.ai/api/v1",
        maxTokens: 100,
        temperature: 0.1,
        defaultModel: "x",
        fallbackModel: "y",
      })
    ).toEqual(["x", "y"]);
  });

  it("dedupes duplicate fallback", () => {
    expect(
      resolveTranslationModels({
        baseUrl: "https://openrouter.ai/api/v1",
        maxTokens: 100,
        temperature: 0.1,
        defaultModel: "same",
        fallbackModel: "same",
      })
    ).toEqual(["same"]);
  });
});

describe("resolveUITranslationModels", () => {
  function uiConfig(overrides: Record<string, unknown>): I18nConfig {
    return parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["de"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["a", "b"],
          maxTokens: 8192,
          temperature: 0.2,
        },
        features: {
          extractUIStrings: false,
          translateUIStrings: true,
          translateMarkdown: false,
          translateJSON: false,
        },
        glossary: {},
        ui: {
          sourceRoots: ["src/"],
          stringsJson: "strings.json",
          flatOutputDir: "./locales",
        },
        documentations: [{ contentPaths: [], outputDir: "./i18n" }],
        ...overrides,
      })
    );
  }

  it("returns base order when preferredModel is unset", () => {
    expect(resolveUITranslationModels(uiConfig({}))).toEqual(["a", "b"]);
  });

  it("prepends preferredModel and skips duplicate in the tail", () => {
    expect(
      resolveUITranslationModels(
        uiConfig({
          ui: {
            sourceRoots: ["src/"],
            stringsJson: "strings.json",
            flatOutputDir: "./locales",
            preferredModel: "b",
          },
        })
      )
    ).toEqual(["b", "a"]);
  });

  it("prepends preferredModel before legacy default/fallback models", () => {
    expect(
      resolveUITranslationModels(
        uiConfig({
          openrouter: {
            baseUrl: "https://openrouter.ai/api/v1",
            translationModels: [],
            defaultModel: "x",
            fallbackModel: "y",
            maxTokens: 8192,
            temperature: 0.2,
          },
          ui: {
            sourceRoots: ["src/"],
            stringsJson: "strings.json",
            flatOutputDir: "./locales",
            preferredModel: "z",
          },
        })
      )
    ).toEqual(["z", "x", "y"]);
  });
});

describe("parseI18nConfig", () => {
  it("accepts a minimal valid config with all features off", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        documentations: [{ ...docBlockDefaults, contentPaths: [], outputDir: "./out" }],
        features: {
          extractUIStrings: false,
          translateMarkdown: false,
          translateJSON: false,
        },
      })
    );
    expect(c.sourceLocale).toBe("en");
    expect(c.documentations[0].outputDir).toBe("./out");
  });

  it("merges sourceFiles into contentPaths and dedupes", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        documentations: [
          {
            contentPaths: ["docs/"],
            sourceFiles: ["docs/", "extra.md"],
            outputDir: "./out",
          },
        ],
        features: {
          extractUIStrings: false,
          translateMarkdown: false,
          translateJSON: false,
        },
      })
    );
    expect(c.documentations[0].contentPaths).toEqual(["docs/", "extra.md"]);
  });

  it("uses sourceFiles when contentPaths is omitted", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        documentations: [
          {
            sourceFiles: ["only-from-source-files.md"],
            outputDir: "./out",
          },
        ],
        features: {
          extractUIStrings: false,
          translateMarkdown: false,
          translateJSON: false,
        },
      })
    );
    expect(c.documentations[0].contentPaths).toEqual(["only-from-source-files.md"]);
  });

  it("accepts documentations[].markdownOutput.postProcessing", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        documentations: [
          {
            contentPaths: ["docs/"],
            outputDir: "./out",
            markdownOutput: {
              style: "flat",
              postProcessing: {
                regexAdjustments: [
                  {
                    description: "screenshots",
                    search: "x/",
                    replace: "y/${translatedLocale}/",
                  },
                ],
                languageListBlock: {
                  start: "<s>",
                  end: "</s>",
                  separator: " ",
                },
              },
            },
          },
        ],
        targetLocales: ["de"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: {
          translateMarkdown: true,
          translateJSON: false,
          extractUIStrings: false,
          translateUIStrings: false,
          translateSVG: false,
        },
      })
    );
    const pp = c.documentations[0]!.markdownOutput.postProcessing;
    expect(pp?.regexAdjustments).toHaveLength(1);
    expect(pp?.languageListBlock?.start).toBe("<s>");
  });

  it("accepts documentations[].segmentSplitting alongside markdownOutput", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        documentations: [
          {
            contentPaths: ["docs/"],
            outputDir: "./out",
            markdownOutput: { style: "nested" },
            segmentSplitting: { enabled: true, maxCharsPerSegment: 3000 },
          },
        ],
        targetLocales: ["de"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: {
          translateMarkdown: true,
          translateJSON: false,
          extractUIStrings: false,
          translateUIStrings: false,
          translateSVG: false,
        },
      })
    );
    expect(c.documentations[0]!.segmentSplitting?.enabled).toBe(true);
    expect(c.documentations[0]!.segmentSplitting?.maxCharsPerSegment).toBe(3000);
  });

  it("preserves optional documentations[].description", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        documentations: [
          {
            description: "Docusaurus docs tree",
            ...docBlockDefaults,
            contentPaths: [],
            outputDir: "./out",
          },
        ],
        features: {
          extractUIStrings: false,
          translateMarkdown: false,
          translateJSON: false,
        },
      })
    );
    expect(c.documentations[0].description).toBe("Docusaurus docs tree");
  });

  it("rejects translate feature without models", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          documentations: [docBlockDefaults],
          targetLocales: ["de"],
          openrouter: {
            baseUrl: "https://openrouter.ai/api/v1",
            translationModels: [],
            maxTokens: 100,
            temperature: 0.1,
          },
          features: { translateMarkdown: true },
        })
      )
    ).toThrow(ConfigValidationError);
  });

  it("rejects translate feature without targetLocales", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          documentations: [docBlockDefaults],
          targetLocales: [],
          features: { translateMarkdown: true },
        })
      )
    ).toThrow(ConfigValidationError);
  });

  it("allows translateMarkdown with empty root targetLocales when documentations[].targetLocales is set", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        documentations: [
          {
            ...docBlockDefaults,
            targetLocales: ["de", "fr"],
          },
        ],
        targetLocales: [],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: {
          translateMarkdown: true,
          translateUIStrings: false,
          translateJSON: false,
          extractUIStrings: false,
        },
      })
    );
    expect(c.documentations[0].targetLocales).toEqual(["de", "fr"]);
  });

  it("rejects translateUIStrings with empty targetLocales when uiLanguagesPath is unset", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          documentations: [{ contentPaths: [], outputDir: "./out" }],
          ui: uiDefaults,
          targetLocales: [],
          openrouter: {
            baseUrl: "https://openrouter.ai/api/v1",
            translationModels: ["m"],
            maxTokens: 100,
            temperature: 0.1,
          },
          features: { translateUIStrings: true },
        })
      )
    ).toThrow(ConfigValidationError);
  });

  it("rejects translateUIStrings with empty targetLocales", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en-GB",
          cacheDir: ".translation-cache",
          documentations: [{ contentPaths: [], outputDir: "./out" }],
          ui: uiDefaults,
          targetLocales: [],
          uiLanguagesPath: "src/renderer/locales/ui-languages.json",
          openrouter: {
            baseUrl: "https://openrouter.ai/api/v1",
            translationModels: ["m"],
            maxTokens: 100,
            temperature: 0.1,
          },
          features: {
            translateUIStrings: true,
            translateMarkdown: false,
            translateJSON: false,
            extractUIStrings: false,
          },
        })
      )
    ).toThrow(ConfigValidationError);
  });

  it("rejects translateUIStrings without models", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          documentations: [{ contentPaths: [], outputDir: "./out" }],
          ui: uiDefaults,
          targetLocales: ["de"],
          openrouter: {
            baseUrl: "https://openrouter.ai/api/v1",
            translationModels: [],
            maxTokens: 100,
            temperature: 0.1,
          },
          features: { translateUIStrings: true },
        })
      )
    ).toThrow(ConfigValidationError);
  });

  it("allows translateUIStrings without documentations[].contentPaths when doc translate is off", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        documentations: [{ contentPaths: [], outputDir: "./out" }],
        ui: uiDefaults,
        targetLocales: ["de"],
        features: {
          extractUIStrings: false,
          translateUIStrings: true,
          translateMarkdown: false,
          translateJSON: false,
        },
      })
    );
    expect(c.features.translateUIStrings).toBe(true);
  });

  it("rejects translateSVG when no svg block is configured", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          documentations: [{ contentPaths: [], outputDir: "./out" }],
          targetLocales: ["de"],
          openrouter: {
            baseUrl: "https://openrouter.ai/api/v1",
            translationModels: ["m"],
            maxTokens: 100,
            temperature: 0.1,
          },
          features: {
            extractUIStrings: false,
            translateUIStrings: false,
            translateMarkdown: false,
            translateJSON: false,
            translateSVG: true,
          },
        })
      )
    ).toThrow(/translateSVG is enabled but no svg block/);
  });
});

describe("applyEnvOverrides", () => {
  const base = parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en",
      cacheDir: ".translation-cache",
      documentations: [{ ...docBlockDefaults, contentPaths: ["src/"] }],
      ui: { ...uiDefaults, sourceRoots: ["src/"] },
      targetLocales: ["de"],
      features: { extractUIStrings: true },
    })
  );

  it("overrides OPENROUTER_BASE_URL", () => {
    const prev = process.env.OPENROUTER_BASE_URL;
    process.env.OPENROUTER_BASE_URL = "https://example.com/v1";
    try {
      const next = applyEnvOverrides(base);
      expect(next.openrouter.baseUrl).toBe("https://example.com/v1");
    } finally {
      if (prev === undefined) {
        delete process.env.OPENROUTER_BASE_URL;
      } else {
        process.env.OPENROUTER_BASE_URL = prev;
      }
    }
  });

  it("overrides I18N_SOURCE_LOCALE", () => {
    const prev = process.env.I18N_SOURCE_LOCALE;
    process.env.I18N_SOURCE_LOCALE = "fr-CA";
    try {
      const next = applyEnvOverrides(base);
      expect(next.sourceLocale).toBe("fr-CA");
    } finally {
      if (prev === undefined) {
        delete process.env.I18N_SOURCE_LOCALE;
      } else {
        process.env.I18N_SOURCE_LOCALE = prev;
      }
    }
  });

  it("overrides I18N_TARGET_LOCALES", () => {
    const prev = process.env.I18N_TARGET_LOCALES;
    process.env.I18N_TARGET_LOCALES = "it  pt-BR";
    try {
      const next = applyEnvOverrides(base);
      expect(next.targetLocales).toEqual(["it", "pt-BR"]);
    } finally {
      if (prev === undefined) {
        delete process.env.I18N_TARGET_LOCALES;
      } else {
        process.env.I18N_TARGET_LOCALES = prev;
      }
    }
  });
});

describe("validateI18nBusinessRules after env", () => {
  it("throws when env clears targets while translate is enabled", () => {
    const base = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        documentations: [{ ...docBlockDefaults, contentPaths: ["src/"] }],
        ui: { ...uiDefaults, sourceRoots: ["src/"] },
        targetLocales: ["de"],
        features: { extractUIStrings: true, translateMarkdown: true },
      })
    );
    const prev = process.env.I18N_TARGET_LOCALES;
    process.env.I18N_TARGET_LOCALES = ",";
    try {
      const next = applyEnvOverrides(base);
      expect(() => validateI18nBusinessRules(next)).toThrow(ConfigValidationError);
    } finally {
      if (prev === undefined) {
        delete process.env.I18N_TARGET_LOCALES;
      } else {
        process.env.I18N_TARGET_LOCALES = prev;
      }
    }
  });
});

describe("parseLocaleList", () => {
  it("normalizes and dedupes", () => {
    expect(parseLocaleList("de, DE  fr")).toEqual(["de", "fr"]);
  });
});

describe("normalizeLocale", () => {
  it("normalizes BCP-47 with region", () => {
    expect(normalizeLocale("en-GB")).toBe("en-GB");
    expect(normalizeLocale("  de-at  ")).toBe("de-AT");
  });

  it("lowercases simple language tags", () => {
    expect(normalizeLocale(" FR ")).toBe("fr");
  });
});

describe("loadI18nConfigFromFile", () => {
  it("throws when file is missing", () => {
    expect(() => loadI18nConfigFromFile("nonexistent-config.json", "/tmp")).toThrow(
      ConfigValidationError
    );
    expect(() => loadI18nConfigFromFile("nonexistent-config.json", "/tmp")).toThrow(
      /Config file not found/
    );
  });

  it("throws on invalid JSON", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-json-"));
    const p = path.join(dir, "bad.json");
    fs.writeFileSync(p, "{ not json", "utf8");
    try {
      expect(() => loadI18nConfigFromFile("bad.json", dir)).toThrow(/Invalid JSON/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("writeInitConfigFile", () => {
  it("writes parseable JSON for uiMarkdown template", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "init-cfg-"));
    const out = path.join(dir, "out", "ai-i18n-tools.config.json");
    try {
      writeInitConfigFile(out, "uiMarkdown", dir);
      const raw = JSON.parse(fs.readFileSync(out, "utf8")) as { sourceLocale?: string };
      expect(raw.sourceLocale).toBe("en-GB");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("parseI18nConfig glossary legacy field", () => {
  it("maps glossary.uiGlossaryFromStringsJson to uiGlossary when uiGlossary is unset", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["de"],
        cacheDir: ".translation-cache",
        documentations: [{ contentPaths: [], outputDir: "./out" }],
        ui: uiDefaults,
        glossary: { uiGlossaryFromStringsJson: "strings.json" },
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: {
          translateUIStrings: true,
          translateMarkdown: false,
          translateJSON: false,
          extractUIStrings: false,
        },
      })
    );
    expect(c.glossary?.uiGlossary).toBe("strings.json");
  });
});

describe("parseI18nConfig targetLocales", () => {
  it("rejects targetLocales that look like a ui-languages.json path", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          documentations: [{ contentPaths: [], outputDir: "./out" }],
          ui: uiDefaults,
          targetLocales: "src/locales/ui-languages.json",
          openrouter: {
            baseUrl: "https://openrouter.ai/api/v1",
            translationModels: ["m"],
            maxTokens: 100,
            temperature: 0.1,
          },
          features: {
            translateUIStrings: true,
            translateMarkdown: false,
            translateJSON: false,
            extractUIStrings: false,
          },
        })
      )
    ).toThrow(ConfigValidationError);
  });
});
