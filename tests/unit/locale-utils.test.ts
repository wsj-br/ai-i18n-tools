import { describe, expect, it } from "vitest";
import {
  assignCoercedTargetLocales,
  coerceTargetLocalesField,
  disallowedScriptLetters,
  englishLanguageNameForLocale,
  englishScriptName,
  isLatinScriptLocale,
  nonLatinLettersIn,
  normalizeLocale,
  normalizeManifestLocaleKey,
  parseLocaleList,
  primaryLanguageSubtag,
  scriptSubtag,
  unicodeScriptPropertyForSubtag,
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

describe("scriptSubtag", () => {
  it("extracts and Title-cases a script subtag (hyphen or underscore)", () => {
    expect(scriptSubtag("hi-Latn")).toBe("Latn");
    expect(scriptSubtag("hi_latn")).toBe("Latn");
    expect(scriptSubtag("zh-Hant-HK")).toBe("Hant");
    expect(scriptSubtag("sr-CYRL")).toBe("Cyrl");
  });

  it("returns undefined when there is no script subtag", () => {
    expect(scriptSubtag("hi")).toBeUndefined();
    expect(scriptSubtag("en-GB")).toBeUndefined();
    expect(scriptSubtag("pt-BR")).toBeUndefined();
    expect(scriptSubtag("zh-419")).toBeUndefined();
  });
});

describe("isLatinScriptLocale", () => {
  it("is true only for *-Latn tags", () => {
    expect(isLatinScriptLocale("hi-Latn")).toBe(true);
    expect(isLatinScriptLocale("sr-Latn")).toBe(true);
    expect(isLatinScriptLocale("hi")).toBe(false);
    expect(isLatinScriptLocale("sr-Cyrl")).toBe(false);
    expect(isLatinScriptLocale("en-GB")).toBe(false);
  });
});

describe("englishScriptName", () => {
  it("resolves common ISO 15924 codes", () => {
    expect(englishScriptName("Latn")).toBe("Latin");
    expect(englishScriptName("Cyrl")).toBe("Cyrillic");
    expect(englishScriptName("latn")).toBe("Latin");
  });

  it("returns undefined for empty input", () => {
    expect(englishScriptName("   ")).toBeUndefined();
  });
});

describe("nonLatinLettersIn", () => {
  it("returns [] for romanized / Latin text (incl. accents, digits, placeholders)", () => {
    expect(nonLatinLettersIn("Namaste duniya — café 123 {{URL_0}}")).toEqual([]);
  });

  it("reports distinct native-script letters", () => {
    expect(nonLatinLettersIn("नमस्ते hello")).toContain("न");
    expect(nonLatinLettersIn("Привет world")).toContain("П");
  });

  it("respects the limit and de-duplicates", () => {
    const out = nonLatinLettersIn("ααα ββ γ", 2);
    expect(out).toEqual(["α", "β"]);
  });
});

describe("unicodeScriptPropertyForSubtag", () => {
  it("maps ISO 15924 subtags to ECMAScript script property values", () => {
    expect(unicodeScriptPropertyForSubtag("Latn")).toBe("Latin");
    expect(unicodeScriptPropertyForSubtag("Cyrl")).toBe("Cyrillic");
    expect(unicodeScriptPropertyForSubtag("Arab")).toBe("Arabic");
    expect(unicodeScriptPropertyForSubtag("Deva")).toBe("Devanagari");
    expect(unicodeScriptPropertyForSubtag("Mong")).toBe("Mongolian");
    expect(unicodeScriptPropertyForSubtag("hant")).toBe("Han");
    expect(unicodeScriptPropertyForSubtag("Hans")).toBe("Han");
  });

  it("returns undefined for composite or unknown script codes", () => {
    expect(unicodeScriptPropertyForSubtag("Jpan")).toBeUndefined();
    expect(unicodeScriptPropertyForSubtag("Kore")).toBeUndefined();
    expect(unicodeScriptPropertyForSubtag("Zxxx")).toBeUndefined();
    expect(unicodeScriptPropertyForSubtag("")).toBeUndefined();
  });
});

describe("disallowedScriptLetters", () => {
  it("Latn target: rejects any non-Latin letter, allows Latin/accents/placeholders", () => {
    expect(disallowedScriptLetters("Namaste café {{X}}", "Latn")).toEqual([]);
    expect(disallowedScriptLetters("नमस्ते hi", "Latn")).toContain("न");
  });

  it("non-Latin target: allows Latin-only output (no false positives on code/URLs)", () => {
    expect(disallowedScriptLetters("Salom dunyo GitHub {{URL_0}}", "Cyrl")).toEqual([]);
    expect(disallowedScriptLetters("简体中文 GitHub", "Hans")).toEqual([]);
  });

  it("non-Latin target: allows the expected script (plus Latin)", () => {
    expect(disallowedScriptLetters("Салом dunyo", "Cyrl")).toEqual([]);
    expect(disallowedScriptLetters("सिन्धी text", "Deva")).toEqual([]);
    expect(disallowedScriptLetters("هَوْسَ code", "Arab")).toEqual([]);
  });

  it("non-Latin target: flags letters from a different non-Latin script", () => {
    expect(disallowedScriptLetters("नमस्ते Салом", "Cyrl")).toContain("न");
    expect(disallowedScriptLetters("سنڌي test", "Deva")).toContain("س");
    expect(disallowedScriptLetters("Привет code", "Arab")).toContain("П");
    expect(disallowedScriptLetters("Монгол", "Mong")).toContain("М");
    expect(disallowedScriptLetters("简体 Привет", "Hans")).toContain("П");
  });

  it("composite/unknown scripts are not enforced", () => {
    expect(disallowedScriptLetters("anything ここ 한국", "Jpan")).toEqual([]);
  });
});
