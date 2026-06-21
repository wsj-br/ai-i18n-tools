import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  augmentConfigWithUiLanguagesMaster,
  loadI18nConfigFromFile,
  mergeWithDefaults,
  parseI18nConfig,
} from "../../src/core/config.js";
import type { I18nConfig } from "../../src/core/types.js";
import { ConfigValidationError } from "../../src/core/errors.js";
import {
  assertTargetLocalesAreLocaleCodes,
  expandDocTargetLocalesInRawInput,
  expandDocumentationTargetLocalesInRawInput,
  expandJsonTargetLocalesInRawInput,
  expandTargetLocalesFileReferenceInRawInput,
  getDocumentationTargetLocaleCodes,
  getJsonTargetLocaleCodes,
  loadUiLanguageEntries,
  looksLikeUiLanguagesFileRef,
  mergeUiLanguageDisplayNames,
  resolveLocalesForDocumentation,
  resolveLocalesForJson,
  resolveLocalesForSvg,
  resolveLocalesForUI,
  resolveUiLanguagesAbsPath,
  resolveUiTranslationTargetCodes,
} from "../../src/core/ui-languages.js";

const defaultMarkdownOutput = { style: "nested" as const, flatPreserveRelativeDir: false };
const defaultDocumentationFields = {
  docsOutput: defaultMarkdownOutput,
  translateFrontmatterFields: true,
};

function baseUiConfig(over: Record<string, unknown> = {}): I18nConfig {
  return parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en-GB",
      targetLocales: ["de", "fr"],
      uiLanguagesPath: "ui-languages.json",
      ui: {
        sourceRoots: [],
        stringsJson: "strings.json",
        flatOutputDir: "./locales",
      },
      cacheDir: ".translation-cache",
      docs: [{ contentPaths: [], outputDir: "./i18n" }],
      provider: "openrouter",
      providers: {
        openrouter: {
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
      },
      features: {
        translateUIStrings: false,
        translateDocs: false,
        translateJson: false,
        translateSVG: false,
      },
      ...over,
    })
  );
}

describe("ui-languages", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ai-i18n-ui-"));
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("looksLikeUiLanguagesFileRef distinguishes paths from locale codes", () => {
    expect(looksLikeUiLanguagesFileRef("src/renderer/locales/ui-languages.json")).toBe(true);
    expect(looksLikeUiLanguagesFileRef("manifest.json")).toBe(true);
    expect(looksLikeUiLanguagesFileRef("de")).toBe(false);
    expect(looksLikeUiLanguagesFileRef("pt-BR")).toBe(false);
    expect(looksLikeUiLanguagesFileRef("en-GB")).toBe(false);
    expect(looksLikeUiLanguagesFileRef("")).toBe(false);
    expect(looksLikeUiLanguagesFileRef("   ")).toBe(false);
  });

  it("expandTargetLocalesFileReferenceInRawInput rejects a path-like targetLocales entry", () => {
    const raw = mergeWithDefaults({
      sourceLocale: "en-GB",
      ui: { flatOutputDir: "locales", sourceRoots: [], stringsJson: "strings.json" },
      cacheDir: ".translation-cache",
      docs: [{ contentPaths: [], outputDir: "./i18n" }],
      targetLocales: ["locales/ui-languages.json"],
      openrouter: { translationModels: ["m"] },
      features: { translateUIStrings: true },
    });
    expect(() => expandTargetLocalesFileReferenceInRawInput(raw, tmp)).toThrow(
      ConfigValidationError
    );
  });

  it("expandTargetLocalesFileReferenceInRawInput accepts locale codes", () => {
    const raw = mergeWithDefaults({
      sourceLocale: "en-GB",
      ui: { flatOutputDir: "locales", sourceRoots: [], stringsJson: "strings.json" },
      cacheDir: ".translation-cache",
      docs: [{ contentPaths: [], outputDir: "./i18n" }],
      targetLocales: ["de", "fr"],
      openrouter: { translationModels: ["m"] },
      features: { translateUIStrings: true },
    });
    expandTargetLocalesFileReferenceInRawInput(raw, tmp);
    expect(raw.targetLocales).toEqual(["de", "fr"]);
  });

  it("loadUiLanguageEntries rejects entries without englishName", () => {
    const p = path.join(tmp, "bad.json");
    fs.writeFileSync(p, JSON.stringify([{ code: "de", label: "Deutsch" }]), "utf8");
    expect(() => loadUiLanguageEntries(p)).toThrow(/englishName/);
  });

  it("loadUiLanguageEntries rejects entries without direction", () => {
    const p = path.join(tmp, "bad-dir.json");
    fs.writeFileSync(
      p,
      JSON.stringify([{ code: "de", label: "Deutsch", englishName: "German" }]),
      "utf8"
    );
    expect(() => loadUiLanguageEntries(p)).toThrow(/direction/);
  });

  it("loadUiLanguageEntries reads ui-languages.json array", () => {
    const p = path.join(tmp, "ui-languages.json");
    fs.writeFileSync(
      p,
      JSON.stringify([
        {
          code: "en-GB",
          label: "English",
          englishName: "English (UK)",
          direction: "ltr",
          isSourceLocale: true,
        },
        { code: "de", label: "Deutsch", englishName: "German", direction: "ltr" },
      ]),
      "utf8"
    );
    const rows = loadUiLanguageEntries(p);
    expect(rows.map((r) => r.code)).toEqual(["en-GB", "de"]);
    expect(rows[0].isSourceLocale).toBe(true);
    expect(rows[1].englishName).toBe("German");
  });

  it("mergeUiLanguageDisplayNames fills missing localeDisplayNames", () => {
    const c = baseUiConfig({ localeDisplayNames: { de: "Custom DE" } });
    const next = mergeUiLanguageDisplayNames(c, [
      { code: "de", label: "Deutsch", englishName: "German", direction: "ltr" },
      { code: "fr", label: "Français", englishName: "French", direction: "ltr" },
    ]);
    expect(next.localeDisplayNames?.de).toBe("Custom DE");
    expect(next.localeDisplayNames?.fr).toBe("French");
  });

  it("resolveUiTranslationTargetCodes drops source and intersects targetLocales", () => {
    const c = baseUiConfig({ sourceLocale: "en-GB", targetLocales: ["de", "xx"] });
    const codes = resolveUiTranslationTargetCodes(c, [
      { code: "en-GB", label: "EN", englishName: "English (UK)", direction: "ltr" },
      { code: "de", label: "DE", englishName: "German", direction: "ltr" },
      { code: "fr", label: "FR", englishName: "French", direction: "ltr" },
    ]);
    expect(codes).toEqual(["de"]);
  });

  it("resolveUiTranslationTargetCodes uses file only when targetLocales empty", () => {
    const c = baseUiConfig({
      sourceLocale: "en-GB",
      targetLocales: [],
      features: {
        translateUIStrings: false,
        translateDocs: false,
        translateJson: false,
        translateSVG: false,
      },
    });
    const codes = resolveUiTranslationTargetCodes(c, [
      { code: "en-GB", label: "EN", englishName: "English (UK)", direction: "ltr" },
      { code: "de", label: "DE", englishName: "German", direction: "ltr" },
    ]);
    expect(codes).toEqual(["de"]);
  });

  it("resolveLocalesForUI uses targetLocales", () => {
    const c = baseUiConfig({ targetLocales: ["de", "fr", "es"] });
    expect(resolveLocalesForUI(c, tmp)).toEqual(["de", "fr", "es"]);
  });

  it("resolveLocalesForUI filters --locale against targetLocales", () => {
    const c = baseUiConfig({ targetLocales: ["de"] });
    expect(resolveLocalesForUI(c, tmp, "de, fr")).toEqual(["de"]);
  });

  it("resolveLocalesForUI throws when --locale codes are not in targetLocales", () => {
    const c = baseUiConfig({ targetLocales: ["de"] });
    expect(() => resolveLocalesForUI(c, tmp, "fr")).toThrow(/None of the requested locales/);
  });

  it("augmentConfigWithUiLanguagesMaster merges display names from bundled master", () => {
    const c = baseUiConfig({ localeDisplayNames: undefined, targetLocales: ["de"] });
    const next = augmentConfigWithUiLanguagesMaster(c);
    expect(next.localeDisplayNames?.de).toBeDefined();
  });

  it("loadI18nConfigFromFile merges display names from bundled master", () => {
    const cfgPath = path.join(tmp, "ai-i18n-tools.config.json");
    fs.writeFileSync(
      cfgPath,
      JSON.stringify({
        sourceLocale: "en-GB",
        targetLocales: ["de"],
        ui: {
          sourceRoots: ["src/"],
          stringsJson: "strings.json",
          flatOutputDir: "locales",
        },
        cacheDir: ".translation-cache",
        docs: [{ contentPaths: [], outputDir: "./i18n" }],
        openrouter: {
          translationModels: ["m"],
        },
        features: {
          translateUIStrings: true,
          translateDocs: false,
        },
      }),
      "utf8"
    );
    const loaded = loadI18nConfigFromFile(cfgPath, tmp);
    expect(loaded.localeDisplayNames?.de).toBeDefined();
  });

  it("loadI18nConfigFromFile rejects targetLocales that look like a manifest path", () => {
    const cfgPath = path.join(tmp, "ai-i18n-tools.config.json");
    fs.writeFileSync(
      cfgPath,
      JSON.stringify({
        sourceLocale: "en-GB",
        targetLocales: ["locales/ui-languages.json"],
        ui: {
          sourceRoots: [],
          stringsJson: "strings.json",
          flatOutputDir: "locales",
        },
        cacheDir: ".translation-cache",
        docs: [{ contentPaths: [], outputDir: "./i18n" }],
        openrouter: {
          translationModels: ["m"],
        },
        features: {
          translateUIStrings: true,
          translateDocs: false,
        },
      }),
      "utf8"
    );
    expect(() => loadI18nConfigFromFile(cfgPath, tmp)).toThrow(ConfigValidationError);
  });

  it("getDocumentationTargetLocaleCodes prefers docs[].targetLocales", () => {
    const c = baseUiConfig({
      sourceLocale: "en",
      targetLocales: ["de", "fr", "es", "pt-BR"],
      cacheDir: ".translation-cache",
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "./i18n",
          targetLocales: ["de", "fr"],
          ...defaultDocumentationFields,
        },
      ],
    });
    expect(getDocumentationTargetLocaleCodes(c)).toEqual(["de", "fr"]);
  });

  it("getDocumentationTargetLocaleCodes falls back to root targetLocales", () => {
    const c = baseUiConfig({
      sourceLocale: "en",
      targetLocales: ["de", "fr"],
      cacheDir: ".translation-cache",
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "./i18n",
          ...defaultDocumentationFields,
        },
      ],
    });
    expect(getDocumentationTargetLocaleCodes(c)).toEqual(["de", "fr"]);
  });

  it("resolveLocalesForSvg includes source locale then documentation targets", () => {
    const c = baseUiConfig({
      sourceLocale: "en-GB",
      targetLocales: ["de", "fr"],
      cacheDir: ".translation-cache",
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "./i18n",
          ...defaultDocumentationFields,
        },
      ],
    });
    expect(resolveLocalesForSvg(c, tmp, null)).toEqual(["en-GB", "de", "fr"]);
  });

  it("resolveLocalesForSvg filters by --locale", () => {
    const c = baseUiConfig({
      sourceLocale: "en-GB",
      targetLocales: ["de", "fr"],
      cacheDir: ".translation-cache",
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "./i18n",
          ...defaultDocumentationFields,
        },
      ],
    });
    expect(resolveLocalesForSvg(c, tmp, "de")).toEqual(["de"]);
  });

  it("resolveLocalesForDocumentation throws when requested locales are not doc targets", () => {
    const c = baseUiConfig({
      sourceLocale: "en",
      targetLocales: ["de", "fr", "es"],
      cacheDir: ".translation-cache",
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "./i18n",
          targetLocales: ["de"],
          ...defaultDocumentationFields,
        },
      ],
      features: {
        translateUIStrings: false,
        translateDocs: true,
        translateJson: false,
        translateSVG: false,
      },
    });
    expect(() => resolveLocalesForDocumentation(c, tmp, "es")).toThrow(/None of the requested/);
  });

  it("resolveLocalesForDocumentation intersects --locale with doc targets", () => {
    const c = baseUiConfig({
      sourceLocale: "en",
      targetLocales: ["de", "fr", "es"],
      cacheDir: ".translation-cache",
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "./i18n",
          targetLocales: ["de", "fr"],
          ...defaultDocumentationFields,
        },
      ],
      features: {
        translateUIStrings: false,
        translateDocs: true,
        translateJson: false,
        translateSVG: false,
      },
    });
    expect(resolveLocalesForDocumentation(c, tmp, "de, es")).toEqual(["de"]);
  });

  it("assertTargetLocalesAreLocaleCodes throws on path-like entries and passes plain codes", () => {
    expect(() => assertTargetLocalesAreLocaleCodes(["de", "fr"], "targetLocales")).not.toThrow();
    expect(() => assertTargetLocalesAreLocaleCodes(["de", "x/y.json"], "targetLocales")).toThrow(
      ConfigValidationError
    );
  });

  it("loadUiLanguageEntries defaults label to code and skips non-object entries", () => {
    const p = path.join(tmp, "ui-languages.json");
    fs.writeFileSync(
      p,
      JSON.stringify([
        null,
        "not-an-object",
        { code: "   " },
        { code: "de", englishName: "German", direction: "ltr" },
      ]),
      "utf8"
    );
    const rows = loadUiLanguageEntries(p);
    expect(rows).toHaveLength(1);
    expect(rows[0].code).toBe("de");
    expect(rows[0].label).toBe("de");
    expect(rows[0].isSourceLocale).toBeUndefined();
  });

  it("loadUiLanguageEntries throws when the JSON is not an array", () => {
    const p = path.join(tmp, "not-array.json");
    fs.writeFileSync(p, JSON.stringify({ code: "de" }), "utf8");
    expect(() => loadUiLanguageEntries(p)).toThrow(/must be a JSON array/);
  });

  it("loadUiLanguageEntries throws when no entries have a code", () => {
    const p = path.join(tmp, "no-codes.json");
    fs.writeFileSync(p, JSON.stringify([{ label: "Deutsch" }, {}]), "utf8");
    expect(() => loadUiLanguageEntries(p)).toThrow(/no valid entries/);
  });

  it("resolveUiLanguagesAbsPath resolves relative, absolute, and missing paths", () => {
    const rel = baseUiConfig({ uiLanguagesPath: "locales/ui-languages.json" });
    expect(resolveUiLanguagesAbsPath(rel, tmp)).toBe(path.join(tmp, "locales/ui-languages.json"));
    const abs = baseUiConfig({ uiLanguagesPath: "/abs/ui-languages.json" });
    expect(resolveUiLanguagesAbsPath(abs, tmp)).toBe("/abs/ui-languages.json");
    expect(resolveUiLanguagesAbsPath({ uiLanguagesPath: undefined } as I18nConfig, tmp)).toBeNull();
    expect(resolveUiLanguagesAbsPath({ uiLanguagesPath: "   " } as I18nConfig, tmp)).toBeNull();
  });

  it("resolveLocalesForUI uses targetLocales when no --locale is given", () => {
    const c = baseUiConfig({ sourceLocale: "en-GB", targetLocales: ["de", "fr"] });
    expect(resolveLocalesForUI(c, tmp).sort()).toEqual(["de", "fr"]);
  });

  it("mergeUiLanguageDisplayNames seeds names when config has none", () => {
    const c = baseUiConfig({ localeDisplayNames: undefined });
    const next = mergeUiLanguageDisplayNames(c, [
      { code: "de", label: "Deutsch", englishName: "German", direction: "ltr" },
    ]);
    expect(next.localeDisplayNames?.de).toBe("German");
  });

  it("getJsonTargetLocaleCodes unions block locales and drops the source locale", () => {
    const c = baseUiConfig({
      sourceLocale: "en",
      targetLocales: ["de", "fr", "es"],
      json: [
        { contentPaths: ["a/"], outputPathTemplate: "{locale}/a.json", targetLocales: ["de"] },
        {
          contentPaths: ["b/"],
          outputPathTemplate: "{locale}/b.json",
          targetLocales: ["fr", "en"],
        },
      ],
    });
    expect(getJsonTargetLocaleCodes(c)).toEqual(["de", "fr"]);
  });

  it("getJsonTargetLocaleCodes falls back to root targetLocales when a block has none", () => {
    const c = baseUiConfig({
      sourceLocale: "en",
      targetLocales: ["de", "fr"],
      json: [{ contentPaths: ["a/"], outputPathTemplate: "{locale}/a.json" }],
    });
    expect(getJsonTargetLocaleCodes(c)).toEqual(["de", "fr"]);
  });

  it("resolveLocalesForJson intersects --locale with json targets", () => {
    const c = baseUiConfig({
      sourceLocale: "en",
      targetLocales: ["de", "fr", "es"],
      json: [
        {
          contentPaths: ["a/"],
          outputPathTemplate: "{locale}/a.json",
          targetLocales: ["de", "fr"],
        },
      ],
    });
    expect(resolveLocalesForJson(c, tmp, "de, es")).toEqual(["de"]);
  });

  it("resolveLocalesForJson throws when --locale codes are not json targets", () => {
    const c = baseUiConfig({
      sourceLocale: "en",
      targetLocales: ["de", "fr", "es"],
      json: [
        { contentPaths: ["a/"], outputPathTemplate: "{locale}/a.json", targetLocales: ["de"] },
      ],
    });
    expect(() => resolveLocalesForJson(c, tmp, "es")).toThrow(/None of the requested/);
  });

  it("expandJsonTargetLocalesInRawInput rejects a path-like json targetLocales entry", () => {
    const raw = mergeWithDefaults({
      sourceLocale: "en",
      targetLocales: ["de", "fr"],
      ui: { flatOutputDir: "locales", sourceRoots: [], stringsJson: "strings.json" },
      cacheDir: ".translation-cache",
      docs: [{ contentPaths: [], outputDir: "./i18n" }],
      json: [
        {
          contentPaths: ["a/"],
          outputPathTemplate: "{locale}/a.json",
          targetLocales: ["x/y.json"],
        },
      ],
      openrouter: { translationModels: ["m"] },
      features: { translateJson: true },
    });
    expect(() => expandJsonTargetLocalesInRawInput(raw, tmp)).toThrow(ConfigValidationError);
  });

  it("expandJsonTargetLocalesInRawInput coerces a scalar block targetLocales to an array", () => {
    const raw = mergeWithDefaults({
      sourceLocale: "en",
      targetLocales: ["de", "fr"],
      ui: { flatOutputDir: "locales", sourceRoots: [], stringsJson: "strings.json" },
      cacheDir: ".translation-cache",
      docs: [{ contentPaths: [], outputDir: "./i18n" }],
      json: [{ contentPaths: ["a/"], outputPathTemplate: "{locale}/a.json", targetLocales: "de" }],
      openrouter: { translationModels: ["m"] },
      features: { translateJson: true },
    });
    expandJsonTargetLocalesInRawInput(raw, tmp);
    const block = (raw.json as Array<Record<string, unknown>>)[0]!;
    expect(block.targetLocales).toEqual(["de"]);
  });

  it("expandDocTargetLocalesInRawInput is the canonical alias of the deprecated export", () => {
    expect(expandDocTargetLocalesInRawInput).toBe(expandDocumentationTargetLocalesInRawInput);
  });

  it("expandDocumentationTargetLocalesInRawInput rejects a path-like doc targetLocales entry", () => {
    const raw = mergeWithDefaults({
      sourceLocale: "en",
      targetLocales: ["de", "fr", "es", "it"],
      ui: { flatOutputDir: "locales", sourceRoots: [], stringsJson: "strings.json" },
      cacheDir: ".translation-cache",
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "./i18n",
          targetLocales: ["doc-locales.json"],
        },
      ],
      openrouter: { translationModels: ["m"] },
      features: { translateDocs: true },
    });
    expect(() => expandDocumentationTargetLocalesInRawInput(raw, tmp)).toThrow(
      ConfigValidationError
    );
  });
});
