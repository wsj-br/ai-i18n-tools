import { describe, expect, it } from "vitest";
import {
  assignCoercedTargetLocales,
  coerceTargetLocalesField,
  englishLanguageNameForLocale,
  normalizeLocale,
  normalizeManifestLocaleKey,
  parseLocaleList,
  primaryLanguageSubtag,
} from "../../src/core/locale-utils.js";

describe("coerceTargetLocalesField", () => {
  it("wraps non-empty string as one-element array", () => {
    expect(coerceTargetLocalesField("src/locales/ui-languages.json")).toEqual([
      "src/locales/ui-languages.json",
    ]);
    expect(coerceTargetLocalesField("de")).toEqual(["de"]);
  });

  it("trims string and treats empty as []", () => {
    expect(coerceTargetLocalesField("  fr  ")).toEqual(["fr"]);
    expect(coerceTargetLocalesField("   ")).toEqual([]);
    expect(coerceTargetLocalesField("")).toEqual([]);
  });

  it("normalizes array of strings", () => {
    expect(coerceTargetLocalesField([" de ", "fr"])).toEqual(["de", "fr"]);
  });

  it("returns [] for invalid input", () => {
    expect(coerceTargetLocalesField(null)).toEqual([]);
    expect(coerceTargetLocalesField(1)).toEqual([]);
  });
});

describe("englishLanguageNameForLocale", () => {
  it("returns English labels for common BCP-47 tags", () => {
    expect(englishLanguageNameForLocale("ko")).toBe("Korean");
    expect(englishLanguageNameForLocale("en-GB")).toBe("British English");
    expect(englishLanguageNameForLocale("de")).toBe("German");
  });

  it("returns undefined for empty input", () => {
    expect(englishLanguageNameForLocale("   ")).toBeUndefined();
  });
});

describe("normalizeLocale", () => {
  it("normalizes two-part tags and lowercases single-tag locales", () => {
    expect(normalizeLocale("  PT-br  ")).toBe("pt-BR");
    expect(normalizeLocale("DE")).toBe("de");
  });
});

describe("primaryLanguageSubtag", () => {
  it("returns empty string for blank input", () => {
    expect(primaryLanguageSubtag("")).toBe("");
    expect(primaryLanguageSubtag("   ")).toBe("");
  });

  it("takes first segment before hyphen or underscore", () => {
    expect(primaryLanguageSubtag("zh_CN")).toBe("zh");
    expect(primaryLanguageSubtag("en-GB")).toBe("en");
  });
});

describe("normalizeManifestLocaleKey", () => {
  it("maps hyphens to underscores and lowercases", () => {
    expect(normalizeManifestLocaleKey("pt-BR")).toBe("pt_br");
  });
});

describe("parseLocaleList", () => {
  it("splits on commas and whitespace and dedupes in order", () => {
    expect(parseLocaleList("de, fr  de")).toEqual(["de", "fr"]);
  });
});

describe("assignCoercedTargetLocales", () => {
  it("mutates raw object", () => {
    const raw: { targetLocales?: unknown } = { targetLocales: "a/b.json" };
    assignCoercedTargetLocales(raw);
    expect(raw.targetLocales).toEqual(["a/b.json"]);
  });
});
