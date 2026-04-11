import {
  applyEnvOverrides,
  mergeWithDefaults,
  parseI18nConfig,
  parseLocaleList,
  resolveTranslationModels,
  validateI18nBusinessRules,
} from "../../src/core/config";
import { ConfigValidationError } from "../../src/core/errors";

const docDefaults = {
  contentPaths: ["docs/"] as string[],
  outputDir: "./out",
  cacheDir: ".translation-cache",
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

describe("parseI18nConfig", () => {
  it("accepts a minimal valid config with all features off", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        documentation: { ...docDefaults, contentPaths: [], outputDir: "./out" },
        features: {
          extractUIStrings: false,
          translateMarkdown: false,
          translateJSON: false,
        },
      })
    );
    expect(c.sourceLocale).toBe("en");
    expect(c.documentation.outputDir).toBe("./out");
  });

  it("rejects translate feature without models", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          documentation: docDefaults,
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
          documentation: docDefaults,
          targetLocales: [],
          features: { translateMarkdown: true },
        })
      )
    ).toThrow(ConfigValidationError);
  });

  it("allows translateMarkdown with empty root targetLocales when documentation.targetLocales is set", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        documentation: {
          ...docDefaults,
          targetLocales: ["de", "fr"],
        },
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
    expect(c.documentation.targetLocales).toEqual(["de", "fr"]);
  });

  it("rejects translateUIStrings with empty targetLocales when uiLanguagesPath is unset", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          documentation: { contentPaths: [], outputDir: "./out", cacheDir: ".translation-cache" },
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

  it("allows translateUIStrings with empty targetLocales when uiLanguagesPath is set (doc translate off)", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        documentation: { contentPaths: [], outputDir: "./out", cacheDir: ".translation-cache" },
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
    );
    expect(c.uiLanguagesPath).toContain("ui-languages");
  });

  it("rejects translateUIStrings without models", () => {
    expect(() =>
      parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          documentation: { contentPaths: [], outputDir: "./out", cacheDir: ".translation-cache" },
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

  it("allows translateUIStrings without documentation.contentPaths when doc translate is off", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        documentation: { contentPaths: [], outputDir: "./out", cacheDir: ".translation-cache" },
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
});

describe("applyEnvOverrides", () => {
  const base = parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en",
      documentation: { ...docDefaults, contentPaths: ["src/"] },
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
});

describe("validateI18nBusinessRules after env", () => {
  it("throws when env clears targets while translate is enabled", () => {
    const base = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        documentation: { ...docDefaults, contentPaths: ["src/"] },
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

describe("parseI18nConfig targetLocales string", () => {
  it("accepts targetLocales as a string path and coerces to array in output", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        documentation: { contentPaths: [], outputDir: "./out", cacheDir: ".translation-cache" },
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
    );
    expect(c.targetLocales).toEqual(["src/locales/ui-languages.json"]);
  });
});
