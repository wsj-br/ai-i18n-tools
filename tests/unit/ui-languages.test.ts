import fs from "fs";
import os from "os";
import path from "path";
import { loadI18nConfigFromFile, mergeWithDefaults, parseI18nConfig } from "../../src/core/config";
import type { I18nConfig } from "../../src/core/types";
import { ConfigValidationError } from "../../src/core/errors";
import {
  augmentConfigWithUiLanguagesFile,
  expandDocumentationTargetLocalesInRawInput,
  expandTargetLocalesFileReferenceInRawInput,
  getDocumentationTargetLocaleCodes,
  loadUiLanguageEntries,
  looksLikeUiLanguagesFileRef,
  mergeUiLanguageDisplayNames,
  resolveLocalesForDocumentation,
  resolveLocalesForSvg,
  resolveLocalesForUI,
  resolveUiTranslationTargetCodes,
} from "../../src/core/ui-languages";

function baseUiConfig(over: Partial<I18nConfig> = {}): I18nConfig {
  return parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en-GB",
      targetLocales: [],
      uiLanguagesPath: "ui-languages.json",
      ui: {
        sourceRoots: [],
        stringsJson: "strings.json",
        flatOutputDir: "./locales",
      },
      documentation: {
        contentPaths: [],
        outputDir: "./i18n",
        cacheDir: ".translation-cache",
      },
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels: ["m"],
        maxTokens: 100,
        temperature: 0.1,
      },
      features: {
        extractUIStrings: false,
        translateUIStrings: true,
        translateMarkdown: false,
        translateJSON: false,
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
  });

  it("expandTargetLocalesFileReferenceInRawInput accepts targetLocales as a string path", () => {
    const uiPath = path.join(tmp, "locales", "ui-languages.json");
    fs.mkdirSync(path.dirname(uiPath), { recursive: true });
    fs.writeFileSync(
      uiPath,
      JSON.stringify([
        { code: "en-GB", label: "English", englishName: "English (UK)" },
        { code: "de", label: "Deutsch", englishName: "German" },
      ]),
      "utf8"
    );
    const raw = mergeWithDefaults({
      sourceLocale: "en-GB",
      ui: { flatOutputDir: "locales", sourceRoots: [], stringsJson: "strings.json" },
      documentation: { contentPaths: [], outputDir: "./i18n", cacheDir: ".translation-cache" },
      targetLocales: "locales/ui-languages.json",
      openrouter: { translationModels: ["m"] },
      features: { translateUIStrings: true },
    });
    expandTargetLocalesFileReferenceInRawInput(raw, tmp);
    expect(raw.targetLocales).toEqual(["de"]);
    expect(raw.uiLanguagesPath).toBe("locales/ui-languages.json");
  });

  it("expandTargetLocalesFileReferenceInRawInput replaces targetLocales and sets uiLanguagesPath", () => {
    const uiPath = path.join(tmp, "locales", "ui-languages.json");
    fs.mkdirSync(path.dirname(uiPath), { recursive: true });
    fs.writeFileSync(
      uiPath,
      JSON.stringify([
        { code: "en-GB", label: "English", englishName: "English (UK)" },
        { code: "de", label: "Deutsch", englishName: "German" },
      ]),
      "utf8"
    );
    const raw = mergeWithDefaults({
      sourceLocale: "en-GB",
      ui: { flatOutputDir: "locales", sourceRoots: [], stringsJson: "strings.json" },
      documentation: { contentPaths: [], outputDir: "./i18n", cacheDir: ".translation-cache" },
      targetLocales: ["locales/ui-languages.json"],
      openrouter: { translationModels: ["m"] },
      features: { translateUIStrings: true },
    });
    expandTargetLocalesFileReferenceInRawInput(raw, tmp);
    expect(raw.targetLocales).toEqual(["de"]);
    expect(raw.uiLanguagesPath).toBe("locales/ui-languages.json");
  });

  it("expandTargetLocalesFileReferenceInRawInput rejects conflicting uiLanguagesPath", () => {
    const uiPath = path.join(tmp, "a.json");
    fs.writeFileSync(
      uiPath,
      JSON.stringify([{ code: "de", label: "D", englishName: "German" }]),
      "utf8"
    );
    const raw = mergeWithDefaults({
      sourceLocale: "en",
      ui: { flatOutputDir: "o", sourceRoots: [], stringsJson: "strings.json" },
      documentation: { contentPaths: [], outputDir: "./i18n", cacheDir: ".translation-cache" },
      targetLocales: ["a.json"],
      uiLanguagesPath: "other.json",
      openrouter: { translationModels: ["m"] },
      features: { translateUIStrings: true },
    });
    expect(() => expandTargetLocalesFileReferenceInRawInput(raw, tmp)).toThrow(ConfigValidationError);
  });

  it("loadUiLanguageEntries rejects entries without englishName", () => {
    const p = path.join(tmp, "bad.json");
    fs.writeFileSync(
      p,
      JSON.stringify([{ code: "de", label: "Deutsch" }]),
      "utf8"
    );
    expect(() => loadUiLanguageEntries(p)).toThrow(/englishName/);
  });

  it("loadUiLanguageEntries reads ui-languages.json array", () => {
    const p = path.join(tmp, "ui-languages.json");
    fs.writeFileSync(
      p,
      JSON.stringify([
        { code: "en-GB", label: "English", englishName: "English (UK)" },
        { code: "de", label: "Deutsch", englishName: "German" },
      ]),
      "utf8"
    );
    const rows = loadUiLanguageEntries(p);
    expect(rows.map((r) => r.code)).toEqual(["en-GB", "de"]);
    expect(rows[1].englishName).toBe("German");
  });

  it("mergeUiLanguageDisplayNames fills missing localeDisplayNames", () => {
    const c = baseUiConfig({ localeDisplayNames: { de: "Custom DE" } });
    const next = mergeUiLanguageDisplayNames(c, [
      { code: "de", label: "Deutsch", englishName: "German" },
      { code: "fr", label: "Français", englishName: "French" },
    ]);
    expect(next.localeDisplayNames?.de).toBe("Custom DE");
    expect(next.localeDisplayNames?.fr).toBe("French");
  });

  it("resolveUiTranslationTargetCodes drops source and intersects targetLocales", () => {
    const c = baseUiConfig({ sourceLocale: "en-GB", targetLocales: ["de", "xx"] });
    const codes = resolveUiTranslationTargetCodes(c, [
      { code: "en-GB", label: "EN", englishName: "English (UK)" },
      { code: "de", label: "DE", englishName: "German" },
      { code: "fr", label: "FR", englishName: "French" },
    ]);
    expect(codes).toEqual(["de"]);
  });

  it("resolveUiTranslationTargetCodes uses file only when targetLocales empty", () => {
    const c = baseUiConfig({ sourceLocale: "en-GB", targetLocales: [] });
    const codes = resolveUiTranslationTargetCodes(c, [
      { code: "en-GB", label: "EN", englishName: "English (UK)" },
      { code: "de", label: "DE", englishName: "German" },
    ]);
    expect(codes).toEqual(["de"]);
  });

  it("resolveLocalesForUI uses file when present", () => {
    const p = path.join(tmp, "ui-languages.json");
    fs.writeFileSync(
      p,
      JSON.stringify([
        { code: "en-GB", label: "EN", englishName: "English (UK)" },
        { code: "de", label: "DE", englishName: "German" },
        { code: "fr", label: "FR", englishName: "French" },
      ]),
      "utf8"
    );
    const c = baseUiConfig({ uiLanguagesPath: p });
    expect(resolveLocalesForUI(c, tmp)).toEqual(["de", "fr"]);
  });

  it("resolveLocalesForUI filters --locale against file", () => {
    const p = path.join(tmp, "ui-languages.json");
    fs.writeFileSync(
      p,
      JSON.stringify([
        { code: "en-GB", label: "EN", englishName: "English (UK)" },
        { code: "de", label: "DE", englishName: "German" },
      ]),
      "utf8"
    );
    const c = baseUiConfig({ uiLanguagesPath: p });
    expect(resolveLocalesForUI(c, tmp, "de, fr")).toEqual(["de"]);
  });

  it("augmentConfigWithUiLanguagesFile merges display names", () => {
    const p = path.join(tmp, "ui-languages.json");
    fs.writeFileSync(
      p,
      JSON.stringify([{ code: "de", label: "Deutsch", englishName: "German" }]),
      "utf8"
    );
    const c = baseUiConfig({ uiLanguagesPath: p });
    const next = augmentConfigWithUiLanguagesFile(c, tmp);
    expect(next.localeDisplayNames?.de).toBe("German");
  });

  it("loadI18nConfigFromFile applies ui file and passes when UI targets resolve", () => {
    const uiPath = path.join(tmp, "locales", "ui-languages.json");
    fs.mkdirSync(path.dirname(uiPath), { recursive: true });
    fs.writeFileSync(
      uiPath,
      JSON.stringify([
        { code: "en-GB", label: "EN", englishName: "English (UK)" },
        { code: "de", label: "DE", englishName: "German" },
      ]),
      "utf8"
    );
    const cfgPath = path.join(tmp, "ai-i18n-tools.config.json");
    fs.writeFileSync(
      cfgPath,
      JSON.stringify({
        sourceLocale: "en-GB",
        targetLocales: [],
        uiLanguagesPath: "locales/ui-languages.json",
        ui: {
          sourceRoots: [],
          stringsJson: "strings.json",
          flatOutputDir: "locales",
        },
        documentation: {
          contentPaths: [],
          outputDir: "./i18n",
          cacheDir: ".translation-cache",
        },
        openrouter: {
          translationModels: ["m"],
        },
        features: {
          translateUIStrings: true,
          translateMarkdown: false,
          translateJSON: false,
          extractUIStrings: false,
        },
      }),
      "utf8"
    );
    const loaded = loadI18nConfigFromFile(cfgPath, tmp);
    expect(loaded.localeDisplayNames?.de).toBe("German");
  });

  it("loadI18nConfigFromFile expands targetLocales when it is a single manifest path", () => {
    const uiPath = path.join(tmp, "locales", "ui-languages.json");
    fs.mkdirSync(path.dirname(uiPath), { recursive: true });
    fs.writeFileSync(
      uiPath,
      JSON.stringify([
        { code: "en-GB", label: "EN", englishName: "English (UK)" },
        { code: "de", label: "DE", englishName: "German" },
      ]),
      "utf8"
    );
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
        documentation: {
          contentPaths: [],
          outputDir: "./i18n",
          cacheDir: ".translation-cache",
        },
        openrouter: {
          translationModels: ["m"],
        },
        features: {
          translateUIStrings: true,
          translateMarkdown: false,
          translateJSON: false,
          extractUIStrings: false,
        },
      }),
      "utf8"
    );
    const loaded = loadI18nConfigFromFile(cfgPath, tmp);
    expect(loaded.targetLocales.map((l) => l.toLowerCase())).toContain("de");
    expect(loaded.uiLanguagesPath).toBe("locales/ui-languages.json");
    expect(loaded.localeDisplayNames?.de).toBe("German");
  });

  it("getDocumentationTargetLocaleCodes prefers documentation.targetLocales", () => {
    const c = baseUiConfig({
      sourceLocale: "en",
      targetLocales: ["de", "fr", "es", "pt-BR"],
      documentation: {
        contentPaths: ["docs/"],
        outputDir: "./i18n",
        cacheDir: ".translation-cache",
        targetLocales: ["de", "fr"],
      },
    });
    expect(getDocumentationTargetLocaleCodes(c)).toEqual(["de", "fr"]);
  });

  it("getDocumentationTargetLocaleCodes falls back to root targetLocales", () => {
    const c = baseUiConfig({
      sourceLocale: "en",
      targetLocales: ["de", "fr"],
      documentation: {
        contentPaths: ["docs/"],
        outputDir: "./i18n",
        cacheDir: ".translation-cache",
      },
    });
    expect(getDocumentationTargetLocaleCodes(c)).toEqual(["de", "fr"]);
  });

  it("resolveLocalesForSvg includes source locale then documentation targets", () => {
    const c = baseUiConfig({
      sourceLocale: "en-GB",
      targetLocales: ["de", "fr"],
      documentation: {
        contentPaths: ["docs/"],
        outputDir: "./i18n",
        cacheDir: ".translation-cache",
      },
    });
    expect(resolveLocalesForSvg(c, tmp, null)).toEqual(["en-GB", "de", "fr"]);
  });

  it("resolveLocalesForSvg filters by --locale", () => {
    const c = baseUiConfig({
      sourceLocale: "en-GB",
      targetLocales: ["de", "fr"],
      documentation: {
        contentPaths: ["docs/"],
        outputDir: "./i18n",
        cacheDir: ".translation-cache",
      },
    });
    expect(resolveLocalesForSvg(c, tmp, "de")).toEqual(["de"]);
  });

  it("resolveLocalesForDocumentation intersects --locale with doc targets", () => {
    const c = baseUiConfig({
      sourceLocale: "en",
      targetLocales: ["de", "fr", "es"],
      documentation: {
        contentPaths: ["docs/"],
        outputDir: "./i18n",
        cacheDir: ".translation-cache",
        targetLocales: ["de", "fr"],
      },
      features: {
        translateUIStrings: false,
        translateMarkdown: true,
        translateJSON: false,
        extractUIStrings: false,
      },
    });
    expect(resolveLocalesForDocumentation(c, tmp, "de, es")).toEqual(["de"]);
  });

  it("expandDocumentationTargetLocalesInRawInput expands manifest without setting uiLanguagesPath", () => {
    const docManifest = path.join(tmp, "doc-locales.json");
    fs.writeFileSync(
      docManifest,
      JSON.stringify([
        { code: "en", label: "English", englishName: "English" },
        { code: "de", label: "Deutsch", englishName: "German" },
        { code: "fr", label: "Français", englishName: "French" },
      ]),
      "utf8"
    );
    const raw = mergeWithDefaults({
      sourceLocale: "en",
      targetLocales: ["de", "fr", "es", "it"],
      ui: { flatOutputDir: "locales", sourceRoots: [], stringsJson: "strings.json" },
      documentation: {
        contentPaths: ["docs/"],
        outputDir: "./i18n",
        cacheDir: ".translation-cache",
        targetLocales: ["doc-locales.json"],
      },
      openrouter: { translationModels: ["m"] },
      features: { translateMarkdown: true },
    });
    expandDocumentationTargetLocalesInRawInput(raw, tmp);
    expect((raw.documentation as { targetLocales: string[] }).targetLocales.sort()).toEqual(["de", "fr"]);
    expect(raw.uiLanguagesPath).toBeUndefined();
  });
});
