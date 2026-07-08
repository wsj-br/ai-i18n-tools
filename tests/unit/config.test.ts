import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  applyEnvOverrides,
  loadI18nConfigFromFile,
  mergeWithDefaults,
  normalizeLocale,
  parseI18nConfig,
  parseLocaleList,
  resolveTranslationModels,
  resolveTranslationModelsForLocale,
  resolveUITranslationModels,
  resolveAllConfiguredModelIds,
  dedupeOrderedModelIds,
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
  sourceRoots: ["src/"] as string[],
  stringsJson: "strings.json",
  flatOutputDir: "./locales",
};

describe("resolveTranslationModels", () => {
  it("returns the active provider's translationModels", () => {
    expect(
      resolveTranslationModels({
        provider: "openrouter",
        providers: { openrouter: { translationModels: ["a", "b"] } },
      })
    ).toEqual(["a", "b"]);
  });

  it("uses the single configured provider when no selector is set", () => {
    expect(
      resolveTranslationModels({
        providers: { groq: { translationModels: ["llama-3.3-70b-versatile"] } },
      })
    ).toEqual(["llama-3.3-70b-versatile"]);
  });

  it("returns [] when the active provider has no models", () => {
    expect(
      resolveTranslationModels({ provider: "openrouter", providers: { openrouter: {} } })
    ).toEqual([]);
  });

  it("returns [] when the active provider cannot be resolved (ambiguous)", () => {
    expect(
      resolveTranslationModels({
        providers: { openrouter: { translationModels: ["a"] }, groq: { translationModels: ["b"] } },
      })
    ).toEqual([]);
  });
});

describe("dedupeOrderedModelIds", () => {
  it("preserves order and drops duplicates across tiers", () => {
    expect(dedupeOrderedModelIds(["a", "b"], ["b", "c"], ["a", "d"])).toEqual(["a", "b", "c", "d"]);
  });
});

describe("resolveTranslationModelsForLocale", () => {
  const providerConfig = {
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: ["t1", "t2"],
        uiModels: ["u1", "t1"],
        localeModels: [
          { locale: "pt-br", models: ["l1", "t1"] },
          { locale: "zh-Hans", models: ["l2"] },
        ],
      },
    },
  } as const;

  it("merges locale + ui + translation for UI tasks", () => {
    expect(
      resolveTranslationModelsForLocale(providerConfig, "pt-BR", { ui: true })
    ).toEqual(["l1", "t1", "u1", "t2"]);
  });

  it("merges locale + translation only for non-UI tasks", () => {
    expect(resolveTranslationModelsForLocale(providerConfig, "pt-BR")).toEqual(["l1", "t1", "t2"]);
  });

  it("normalizes locale tags when matching localeModels", () => {
    expect(resolveTranslationModelsForLocale(providerConfig, "pt-br", { ui: true })).toEqual([
      "l1",
      "t1",
      "u1",
      "t2",
    ]);
  });

  it("falls back to ui + translation when no locale entry matches", () => {
    expect(resolveTranslationModelsForLocale(providerConfig, "de", { ui: true })).toEqual([
      "u1",
      "t1",
      "t2",
    ]);
  });
});

describe("resolveAllConfiguredModelIds", () => {
  it("returns the union of translation, ui, and locale model ids", () => {
    expect(
      resolveAllConfiguredModelIds({
        provider: "openrouter",
        providers: {
          openrouter: {
            translationModels: ["t1", "t2"],
            uiModels: ["u1"],
            localeModels: [{ locale: "de", models: ["l1", "t1"] }],
          },
        },
      })
    ).toEqual(["t1", "t2", "u1", "l1"]);
  });
});

describe("resolveUITranslationModels", () => {
  function uiConfig(overrides: Record<string, unknown>): I18nConfig {
    return parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["de"],
        provider: "openrouter",
        providers: {
          openrouter: {
            translationModels: ["a", "b"],
            maxTokens: 8192,
            temperature: 0.2,
          },
        },
        features: {
          translateUIStrings: true,
          translateDocs: false,
        },
        glossary: {},
        ui: {
          sourceRoots: ["src/"],
          stringsJson: "strings.json",
          flatOutputDir: "./locales",
        },
        docs: [{ contentPaths: [], outputDir: "./i18n" }],
        ...overrides,
      })
    );
  }

  it("returns translationModels when no uiModels or localeModels", () => {
    expect(resolveUITranslationModels(uiConfig({}), "de")).toEqual(["a", "b"]);
  });

  it("prepends uiModels before translationModels", () => {
    expect(
      resolveUITranslationModels(
        uiConfig({
          providers: {
            openrouter: {
              translationModels: ["a", "b"],
              uiModels: ["b", "c"],
              maxTokens: 8192,
              temperature: 0.2,
            },
          },
        }),
        "de"
      )
    ).toEqual(["b", "c", "a"]);
  });

  it("prepends localeModels before uiModels and translationModels", () => {
    expect(
      resolveUITranslationModels(
        uiConfig({
          providers: {
            openrouter: {
              translationModels: ["a", "b"],
              uiModels: ["u"],
              localeModels: [{ locale: "de", models: ["l", "a"] }],
              maxTokens: 8192,
              temperature: 0.2,
            },
          },
        }),
        "de"
      )
    ).toEqual(["l", "a", "u", "b"]);
  });
});

describe("parseI18nConfig", () => {
  it("accepts a minimal valid config with all features off", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        docs: [{ ...docBlockDefaults, contentPaths: [], outputDir: "./out" }],
        features: {
          translateDocs: false,
        },
      })
    );
    expect(c.sourceLocale).toBe("en");
    expect(c.docs[0].outputDir).toBe("./out");
  });

  it("accepts providers.uiModels and providers.localeModels", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        provider: "openrouter",
        providers: {
          openrouter: {
            translationModels: ["a"],
            uiModels: ["u"],
            localeModels: [{ locale: "de", models: ["l"] }],
          },
        },
        cacheDir: ".translation-cache",
        docs: [{ ...docBlockDefaults, contentPaths: [], outputDir: "./out" }],
      })
    );
    expect(c.providers.openrouter?.uiModels).toEqual(["u"]);
    expect(c.providers.openrouter?.localeModels).toEqual([{ locale: "de", models: ["l"] }]);
  });

  it("rejects duplicate localeModels locale keys after normalization", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          provider: "openrouter",
          providers: {
            openrouter: {
              translationModels: ["a"],
              localeModels: [
                { locale: "pt-BR", models: ["x"] },
                { locale: "pt-br", models: ["y"] },
              ],
            },
          },
          cacheDir: ".translation-cache",
          docs: [{ ...docBlockDefaults, contentPaths: [], outputDir: "./out" }],
        })
      )
    ).toThrow(/duplicate locale/i);
  });

  it("rejects legacy ui.preferredModel", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          ui: { ...uiDefaults, preferredModel: "openai/gpt-4o-mini" },
          docs: [{ ...docBlockDefaults, contentPaths: [], outputDir: "./out" }],
        })
      )
    ).toThrow();
  });

  it("merges sourceFiles into contentPaths and dedupes", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        docs: [
          {
            contentPaths: ["docs/"],
            sourceFiles: ["docs/", "extra.md"],
            outputDir: "./out",
          },
        ],
        features: {
          translateDocs: false,
        },
      })
    );
    expect(c.docs[0].contentPaths).toEqual(["docs/", "extra.md"]);
  });

  it("uses sourceFiles when contentPaths is omitted", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        docs: [
          {
            sourceFiles: ["only-from-source-files.md"],
            outputDir: "./out",
          },
        ],
        features: {
          translateDocs: false,
        },
      })
    );
    expect(c.docs[0].contentPaths).toEqual(["only-from-source-files.md"]);
  });

  it("accepts docs[].docsOutput.postProcessing", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        docs: [
          {
            contentPaths: ["docs/"],
            outputDir: "./out",
            docsOutput: {
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
                  label: "english",
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
          translateDocs: true,

          translateUIStrings: false,
          translateSVG: false,
        },
      })
    );
    const pp = c.docs[0]!.docsOutput.postProcessing;
    expect(pp?.regexAdjustments).toHaveLength(1);
    expect(pp?.languageListBlock?.start).toBe("<s>");
    expect(pp?.languageListBlock?.label).toBe("english");
  });

  it("accepts docs[].segmentSplitting alongside markdownOutput", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        docs: [
          {
            contentPaths: ["docs/"],
            outputDir: "./out",
            docsOutput: { style: "nested" },
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
          translateDocs: true,

          translateUIStrings: false,
          translateSVG: false,
        },
      })
    );
    expect(c.docs[0]!.segmentSplitting?.enabled).toBe(true);
    expect(c.docs[0]!.segmentSplitting?.maxCharsPerSegment).toBe(3000);
  });

  it("preserves optional docs[].description", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        docs: [
          {
            description: "Docusaurus docs tree",
            ...docBlockDefaults,
            contentPaths: [],
            outputDir: "./out",
          },
        ],
        features: {
          translateDocs: false,
        },
      })
    );
    expect(c.docs[0].description).toBe("Docusaurus docs tree");
  });

  it("rejects translate feature without models", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          docs: [docBlockDefaults],
          targetLocales: ["de"],
          provider: "openrouter",
          providers: {
            openrouter: {
              translationModels: [],
              maxTokens: 100,
              temperature: 0.1,
            },
          },
          features: { translateDocs: true },
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
          docs: [docBlockDefaults],
          targetLocales: [],
          features: { translateDocs: true },
        })
      )
    ).toThrow(ConfigValidationError);
  });

  it("allows translateMarkdown with empty root targetLocales when docs[].targetLocales is set", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        docs: [
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
          translateDocs: true,
          translateUIStrings: false,
        },
      })
    );
    expect(c.docs[0].targetLocales).toEqual(["de", "fr"]);
  });

  it("rejects translateUIStrings with empty targetLocales when uiLanguagesPath is unset", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          docs: [{ contentPaths: [], outputDir: "./out" }],
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
          docs: [{ contentPaths: [], outputDir: "./out" }],
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
            translateDocs: false,
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
          docs: [{ contentPaths: [], outputDir: "./out" }],
          ui: uiDefaults,
          targetLocales: ["de"],
          provider: "openrouter",
          providers: {
            openrouter: {
              translationModels: [],
              maxTokens: 100,
              temperature: 0.1,
            },
          },
          features: { translateUIStrings: true },
        })
      )
    ).toThrow(ConfigValidationError);
  });

  it("allows translateUIStrings without docs[].contentPaths when doc translate is off", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        docs: [{ contentPaths: [], outputDir: "./out" }],
        ui: uiDefaults,
        targetLocales: ["de"],
        features: {
          translateUIStrings: true,
          translateDocs: false,
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
          docs: [{ contentPaths: [], outputDir: "./out" }],
          targetLocales: ["de"],
          openrouter: {
            baseUrl: "https://openrouter.ai/api/v1",
            translationModels: ["m"],
            maxTokens: 100,
            temperature: 0.1,
          },
          features: {
            translateUIStrings: false,
            translateDocs: false,

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
      docs: [{ ...docBlockDefaults, contentPaths: ["src/"] }],
      ui: { ...uiDefaults, sourceRoots: ["src/"] },
      targetLocales: ["de"],
      features: { translateUIStrings: true },
    })
  );

  it("overrides OPENROUTER_BASE_URL", () => {
    const prev = process.env.OPENROUTER_BASE_URL;
    process.env.OPENROUTER_BASE_URL = "https://example.com/v1";
    try {
      const next = applyEnvOverrides(base);
      expect(next.providers.openrouter?.baseUrl).toBe("https://example.com/v1");
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
        docs: [{ ...docBlockDefaults, contentPaths: ["src/"] }],
        ui: { ...uiDefaults, sourceRoots: ["src/"] },
        targetLocales: ["de"],
        features: { translateUIStrings: true, translateDocs: true },
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

  it("provider override selects a configured provider", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-prov-"));
    const p = path.join(dir, "ai-i18n-tools.config.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        sourceLocale: "en",
        targetLocales: ["de"],
        provider: "openrouter",
        providers: {
          openrouter: { translationModels: ["a"] },
          groq: { translationModels: ["b"] },
        },
        features: { translateUIStrings: false, translateDocs: false },
      }),
      "utf8"
    );
    try {
      expect(loadI18nConfigFromFile("ai-i18n-tools.config.json", dir).provider).toBe("openrouter");
      expect(loadI18nConfigFromFile("ai-i18n-tools.config.json", dir, "groq").provider).toBe(
        "groq"
      );
      // Empty/whitespace override leaves the config provider untouched.
      expect(loadI18nConfigFromFile("ai-i18n-tools.config.json", dir, "  ").provider).toBe(
        "openrouter"
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("provider override throws when provider is not configured", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-prov-bad-"));
    const p = path.join(dir, "ai-i18n-tools.config.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        sourceLocale: "en",
        targetLocales: ["de"],
        providers: { openrouter: { translationModels: ["a"] } },
        features: { translateUIStrings: false, translateDocs: false },
      }),
      "utf8"
    );
    try {
      expect(() => loadI18nConfigFromFile("ai-i18n-tools.config.json", dir, "nope")).toThrow(
        /--provider "nope" is not defined in providers \(openrouter\)/
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws a fatal error when a locale is not in the bundled UI languages catalog", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-locale-"));
    const p = path.join(dir, "ai-i18n-tools.config.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        sourceLocale: "pt-BR",
        targetLocales: ["en-GB", "hi-Lan", "zh-Hans"],
        providers: { openrouter: { translationModels: ["a"] } },
        features: { translateUIStrings: false, translateDocs: false },
      }),
      "utf8"
    );
    try {
      expect(() => loadI18nConfigFromFile("ai-i18n-tools.config.json", dir)).toThrow(
        /Invalid locale\(s\) in config:.*targetLocales\[1\].*hi-Lan/
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("accepts bare language subtags that have an exact catalog entry", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-locale-ok-"));
    const p = path.join(dir, "ai-i18n-tools.config.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        sourceLocale: "en",
        targetLocales: ["pt", "pt-BR", "fr"],
        providers: { openrouter: { translationModels: ["a"] } },
        features: { translateUIStrings: false, translateDocs: false },
      }),
      "utf8"
    );
    try {
      expect(() => loadI18nConfigFromFile("ai-i18n-tools.config.json", dir)).not.toThrow();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects a script-ambiguous bare subtag and suggests the catalog variants", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-locale-bare-"));
    const p = path.join(dir, "ai-i18n-tools.config.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        sourceLocale: "en",
        targetLocales: ["pa", "zh"],
        providers: { openrouter: { translationModels: ["a"] } },
        features: { translateUIStrings: false, translateDocs: false },
      }),
      "utf8"
    );
    try {
      expect(() => loadI18nConfigFromFile("ai-i18n-tools.config.json", dir)).toThrow(
        /targetLocales\[0\].*unknown locale "pa".*did you mean "pa-IN" or "pa-PK"\?/
      );
      expect(() => loadI18nConfigFromFile("ai-i18n-tools.config.json", dir)).toThrow(
        /targetLocales\[1\].*unknown locale "zh".*did you mean "zh-Hans" or "zh-Hant"\?/
      );
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

describe("parseI18nConfig ui.uiExtractor alias", () => {
  it("maps ui.reactExtractor to ui.uiExtractor when uiExtractor is unset", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["de"],
        cacheDir: ".translation-cache",
        docs: [{ contentPaths: [], outputDir: "./out" }],
        ui: {
          sourceRoots: ["src/"],
          stringsJson: "strings.json",
          flatOutputDir: "./locales",
          reactExtractor: { extensions: [".astro"], funcNames: ["t"] },
        },
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: {
          translateUIStrings: true,
          translateDocs: false,
        },
      })
    );
    expect(c.ui.uiExtractor?.extensions).toEqual([".astro"]);
    expect(c.ui.reactExtractor?.extensions).toEqual([".astro"]);
  });
});

describe("parseI18nConfig glossary legacy field", () => {
  it("maps glossary.uiGlossaryFromStringsJson to uiGlossary when uiGlossary is unset", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["de"],
        cacheDir: ".translation-cache",
        docs: [{ contentPaths: [], outputDir: "./out" }],
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
          translateDocs: false,
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
          docs: [{ contentPaths: [], outputDir: "./out" }],
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
            translateDocs: false,
          },
        })
      )
    ).toThrow(ConfigValidationError);
  });
});

describe("legacy config migration", () => {
  it("preprocess maps documentations, translateMarkdown, jsonSource, markdownOutput", () => {
    const raw = {
      features: {
        translateMarkdown: true,
        translateJSON: false,
        extractUIStrings: true,
        translateUIStrings: false,
        translateSVG: false,
      },
      documentations: [
        {
          contentPaths: "docs/",
          outputDir: "./i18n",
          jsonSource: "i18n/en",
          markdownOutput: { style: "nested" },
        },
      ],
    };
    const merged = mergeWithDefaults(raw);
    expect(merged.features?.translateDocs).toBe(true);
    expect(merged.features).not.toHaveProperty("translateMarkdown");
    expect(merged.features).not.toHaveProperty("translateJSON");
    expect(merged.features).not.toHaveProperty("extractUIStrings");
    expect(merged.features?.translateUIStrings).toBe(false);
    const block = (merged.docs as Record<string, unknown>[])[0];
    expect(block?.docusaurusCatalogDir).toBe("i18n/en");
    expect(block).not.toHaveProperty("jsonSource");
    expect(block?.docsOutput).toEqual({ style: "nested" });
    expect(block).not.toHaveProperty("markdownOutput");
    expect(block?.contentPaths).toEqual(["docs/"]);
  });

  it("rejects conflicting documentations and docs", () => {
    expect(() =>
      mergeWithDefaults({
        documentations: [{ contentPaths: [], outputDir: "./a" }],
        docs: [{ contentPaths: [], outputDir: "./b" }],
      })
    ).toThrow(/documentations.*docs/i);
  });

  it("migrates a legacy openrouter block to providers + provider selector", () => {
    const merged = mergeWithDefaults({
      sourceLocale: "en",
      targetLocales: ["de"],
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels: ["a/b"],
        defaultModel: "c/d",
        fallbackModel: "a/b",
        maxTokens: 1234,
        temperature: 0.3,
      },
    }) as Record<string, unknown>;
    expect(merged).not.toHaveProperty("openrouter");
    expect(merged.provider).toBe("openrouter");
    const providers = merged.providers as Record<string, Record<string, unknown>>;
    // default openrouter base URL is dropped (inherited from preset); models fold in default/fallback
    expect(providers.openrouter.baseUrl).toBeUndefined();
    expect(providers.openrouter.translationModels).toEqual(["a/b", "c/d"]);
    expect(providers.openrouter.maxTokens).toBe(1234);
    expect(providers.openrouter.temperature).toBe(0.3);
  });

  it("keeps a non-default openrouter baseUrl when migrating", () => {
    const merged = mergeWithDefaults({
      openrouter: {
        baseUrl: "https://proxy.example.com/v1",
        translationModels: ["m"],
      },
    }) as Record<string, unknown>;
    const providers = merged.providers as Record<string, Record<string, unknown>>;
    expect(providers.openrouter.baseUrl).toBe("https://proxy.example.com/v1");
  });

  it("loadI18nConfigFromFile rewrites legacy keys on disk", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-legacy-"));
    const cfgPath = path.join(dir, "ai-i18n-tools.config.json");
    fs.writeFileSync(
      cfgPath,
      JSON.stringify(
        {
          sourceLocale: "en",
          targetLocales: ["de"],
          ui: uiDefaults,
          cacheDir: ".translation-cache",
          openrouter: {
            baseUrl: "https://openrouter.ai/api/v1",
            translationModels: ["m"],
            maxTokens: 100,
            temperature: 0.1,
          },
          features: {
            translateMarkdown: true,
            translateJSON: true,
            translateUIStrings: false,
            translateSVG: false,
          },
          documentations: [
            {
              contentPaths: ["docs/"],
              outputDir: "./out",
              jsonSource: "i18n/en",
            },
          ],
        },
        null,
        2
      ),
      "utf8"
    );
    loadI18nConfigFromFile(cfgPath, dir);
    const onDisk = JSON.parse(fs.readFileSync(cfgPath, "utf8")) as Record<string, unknown>;
    expect(onDisk.documentations).toBeUndefined();
    expect(Array.isArray(onDisk.docs)).toBe(true);
    const f = onDisk.features as Record<string, unknown>;
    expect(f.translateDocs).toBe(true);
    expect(f.translateMarkdown).toBeUndefined();
    expect(f.translateJSON).toBeUndefined();
    const block = (onDisk.docs as Record<string, unknown>[])[0];
    expect(block.docusaurusCatalogDir).toBe("i18n/en");
    expect(block.jsonSource).toBeUndefined();
    loadI18nConfigFromFile(cfgPath, dir);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("parseI18nConfig astro protectAttributes / protectKeys", () => {
  it("accepts optional protectAttributes and protectKeys on docs blocks", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["de"],
        cacheDir: ".translation-cache",
        docs: [
          {
            contentPaths: ["src/pages/index.astro"],
            outputDir: "src/pages",
            protectAttributes: ["variant", "size"],
            protectKeys: ["slug", "code"],
          },
        ],
        ui: uiDefaults,
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: {
          translateUIStrings: false,
          translateDocs: true,
        },
      })
    );
    expect(c.docs[0]?.protectAttributes).toEqual(["variant", "size"]);
    expect(c.docs[0]?.protectKeys).toEqual(["slug", "code"]);
  });
});
