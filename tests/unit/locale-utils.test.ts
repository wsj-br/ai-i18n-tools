import { describe, expect, it } from "vitest";
import {
  assignCoercedTargetLocales,
  batchScriptValidationIssue,
  batchTranslationScriptIssue,
  coerceTargetLocalesField,
  disallowedScriptLetters,
  effectiveScriptSubtag,
  englishLanguageNameForLocale,
  englishScriptName,
  expectedUnicodeScriptsForSubtag,
  hanVariantCounts,
  isLatinScriptLocale,
  localeEnforcesOutputScript,
  nonLatinLettersIn,
  normalizeLocale,
  normalizeManifestLocaleKey,
  parseLocaleList,
  primaryLanguageSubtag,
  scriptLetterCounts,
  scriptSubtag,
  scriptValidationIssue,
  translationScriptIssue,
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

describe("effectiveScriptSubtag", () => {
  it("returns an explicit script subtag unchanged", () => {
    expect(effectiveScriptSubtag("hi-Latn")).toBe("Latn");
    expect(effectiveScriptSubtag("sd-Deva")).toBe("Deva");
    expect(effectiveScriptSubtag("zh-Hans")).toBe("Hans");
  });

  it("defaults bare hi (and hi with a region) to Devanagari", () => {
    expect(effectiveScriptSubtag("hi")).toBe("Deva");
    expect(effectiveScriptSubtag("hi-IN")).toBe("Deva");
  });

  it("defaults other native-script languages when the tag omits a script subtag", () => {
    expect(effectiveScriptSubtag("ar")).toBe("Arab");
    expect(effectiveScriptSubtag("bn")).toBe("Beng");
    expect(effectiveScriptSubtag("te")).toBe("Telu");
    expect(effectiveScriptSubtag("ru")).toBe("Cyrl");
    expect(effectiveScriptSubtag("ja")).toBe("Jpan");
    expect(effectiveScriptSubtag("ko")).toBe("Kore");
    expect(effectiveScriptSubtag("pa-IN")).toBe("Guru");
    expect(effectiveScriptSubtag("pa-PK")).toBe("Arab");
  });

  it("does not invent a script for Latin-primary or script-ambiguous languages", () => {
    expect(effectiveScriptSubtag("en-GB")).toBeUndefined();
    expect(effectiveScriptSubtag("de")).toBeUndefined();
    expect(effectiveScriptSubtag("pt-BR")).toBeUndefined();
    expect(effectiveScriptSubtag("uz")).toBeUndefined();
    expect(effectiveScriptSubtag("zh")).toBeUndefined();
    expect(effectiveScriptSubtag("pa")).toBeUndefined();
  });

  it("localeEnforcesOutputScript follows effectiveScriptSubtag", () => {
    expect(localeEnforcesOutputScript("hi")).toBe(true);
    expect(localeEnforcesOutputScript("ja")).toBe(true);
    expect(localeEnforcesOutputScript("de")).toBe(false);
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

describe("expectedUnicodeScriptsForSubtag", () => {
  it("maps composite CJK families", () => {
    expect(expectedUnicodeScriptsForSubtag("Jpan")).toEqual(["Han", "Hiragana", "Katakana"]);
    expect(expectedUnicodeScriptsForSubtag("Kore")).toEqual(["Hangul", "Han"]);
  });

  it("wraps single-script subtags", () => {
    expect(expectedUnicodeScriptsForSubtag("Deva")).toEqual(["Devanagari"]);
    expect(expectedUnicodeScriptsForSubtag("Hans")).toEqual(["Han"]);
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

describe("scriptLetterCounts", () => {
  it("counts Latin separately and ignores symbols/punctuation/digits", () => {
    const c = scriptLetterCounts("保存 OK 123 ℹ → ⚠");
    expect(c.latin).toBe(2);
    expect(c.nonLatinTotal).toBe(2);
    expect(c.byScript.get("Han")).toBe(2);
  });

  it("buckets each meaningful letter under its Unicode script", () => {
    const c = scriptLetterCounts("Привет 保存");
    expect(c.byScript.get("Cyrillic")).toBe(6);
    expect(c.byScript.get("Han")).toBe(2);
  });
});

describe("hanVariantCounts", () => {
  it("detects Simplified-exclusive characters", () => {
    const c = hanVariantCounts("无需注册或设置");
    expect(c.simplified).toBeGreaterThan(0);
    expect(c.traditional).toBe(0);
  });

  it("detects Traditional-exclusive characters", () => {
    const c = hanVariantCounts("無需帳戶或註冊");
    expect(c.traditional).toBeGreaterThan(0);
    expect(c.simplified).toBe(0);
  });

  it("returns zero counts for shared-only Han text", () => {
    const c = hanVariantCounts("中文");
    expect(c.simplified).toBe(0);
    expect(c.traditional).toBe(0);
  });

  it("treats ambiguous valid-in-both glyphs (面, 制, 系) as shared, not Simplified", () => {
    const c = hanVariantCounts("界面控制系統");
    expect(c.simplified).toBe(0);
    expect(c.traditional).toBe(1); // 統 is genuinely Traditional-exclusive
  });
});

describe("scriptValidationIssue", () => {
  it("returns null when there is no script subtag", () => {
    expect(scriptValidationIssue("anything", "")).toBeNull();
  });

  it("accepts Japanese kana/kanji and Korean hangul families", () => {
    expect(scriptValidationIssue("保存する こんにちは", "Jpan")).toBeNull();
    expect(scriptValidationIssue("설정 저장", "Kore")).toBeNull();
  });

  it("flags Hangul inside a Japanese family target", () => {
    expect(scriptValidationIssue("ここ 한국한국어", "Jpan")).not.toBeNull();
  });

  it("ignores letter-like symbols such as ℹ for Han targets (false-positive regression)", () => {
    expect(scriptValidationIssue("ℹ 设置 → 模型", "Hans")).toBeNull();
    expect(scriptValidationIssue("ℹ 設定 → 模型", "Hant")).toBeNull();
  });

  it("allows a short foreign-language quote inside a dominant-Han document", () => {
    const text = "这是中文文档，其中包含简短的引用 नमस्ते 以及更多中文内容用于测试。";
    expect(scriptValidationIssue(text, "Hans")).toBeNull();
  });

  it("flags output whose dominant script is wrong", () => {
    const issue = scriptValidationIssue("Привет Салом дунё мир", "Hans");
    expect(issue).not.toBeNull();
    expect(issue?.message).toContain("Cyrillic");
  });

  it("passes when expected script dominates despite stray letters", () => {
    expect(scriptValidationIssue("保存设置历史记录 П", "Hans")).toBeNull();
  });

  it("allows Latin-only brand/code tokens but rejects romanized or copied English", () => {
    expect(scriptValidationIssue("GitHub {{URL_0}} OK", "Hans")).toBeNull();
    expect(scriptValidationIssue("Namaste duniya", "Deva")).not.toBeNull();
    expect(scriptValidationIssue("Save", "Deva", { sourceText: "Save" })).toBeNull();
    expect(scriptValidationIssue("GitHub", "Deva", { sourceText: "GitHub" })).toBeNull();
  });

  it("allows preserved names, emails, hostnames, and code from the source", () => {
    expect(scriptValidationIssue("t", "Hans", { sourceText: "t" })).toBeNull();
    expect(scriptValidationIssue("NTFY", "Deva", { sourceText: "view NTFY messages" })).toBeNull();
    expect(
      scriptValidationIssue("Duplicati configuration", "Deva", {
        sourceText: "Duplicati configuration",
      })
    ).toBeNull();
    expect(
      scriptValidationIssue("recipient@example.com", "Deva", {
        sourceText: "recipient@example.com",
      })
    ).toBeNull();
    expect(
      scriptValidationIssue("smtp.your-domain.com", "Deva", {
        sourceText: "smtp.your-domain.com",
      })
    ).toBeNull();
    expect(
      scriptValidationIssue("Upyogkarta menu", "Deva", { sourceText: "user menu" })
    ).not.toBeNull();
  });

  it("discriminates Hans vs Hant via variant-distinct characters", () => {
    expect(scriptValidationIssue("无需注册或设置历史记录", "Hant")).not.toBeNull();
    expect(scriptValidationIssue("無需帳戶或註冊歷史", "Hans")).not.toBeNull();
    expect(scriptValidationIssue("无需注册或设置历史记录", "Hans")).toBeNull();
    expect(scriptValidationIssue("無需帳戶或註冊歷史", "Hant")).toBeNull();
  });

  it("does not flag Hans/Hant when only shared Han characters are present", () => {
    expect(scriptValidationIssue("中文大生活的人", "Hans")).toBeNull();
    expect(scriptValidationIssue("中文大生活的人", "Hant")).toBeNull();
  });

  it("does not flag a Traditional UI phrase that uses shared merge glyphs (界面/控制/系統)", () => {
    expect(scriptValidationIssue("界面控制系統設定頁面", "Hant")).toBeNull();
  });

  it("does not flag a variant tie (4 distinct chars, 2 vs 2)", () => {
    expect(scriptValidationIssue("设记設記", "Hant")).toBeNull();
    expect(scriptValidationIssue("设记設記", "Hans")).toBeNull();
  });

  it("does not flag when there are too few variant-distinct characters", () => {
    expect(scriptValidationIssue("设记", "Hant")).toBeNull();
    expect(scriptValidationIssue("界面", "Hant")).toBeNull();
  });

  it("Latn target: requires Latin to dominate", () => {
    expect(scriptValidationIssue("Namaste duniya café", "Latn")).toBeNull();
    expect(scriptValidationIssue("नमस्ते दुनिया", "Latn")).not.toBeNull();
  });

  it("accepts native output for Arabic, Bengali, Telugu, and Cyrillic", () => {
    expect(scriptValidationIssue("حفظ الإعدادات", "Arab")).toBeNull();
    expect(scriptValidationIssue("সংরক্ষণ", "Beng")).toBeNull();
    expect(scriptValidationIssue("సేవ్", "Telu")).toBeNull();
    expect(scriptValidationIssue("Сохранить", "Cyrl")).toBeNull();
  });
});

describe("translationScriptIssue", () => {
  it("uses language defaults for bare locale codes", () => {
    expect(translationScriptIssue("नमस्ते", "hi")).toBeNull();
    expect(translationScriptIssue("Hello", "hi", "Hello")).toBeNull();
    expect(translationScriptIssue("Hello", "de")).toBeNull();
    expect(translationScriptIssue("こんにちは", "ja")).toBeNull();
    expect(translationScriptIssue("Konnichiwa", "ja")).not.toBeNull();
    expect(translationScriptIssue("مرحبا", "ar")).toBeNull();
    expect(translationScriptIssue("Marhaba", "ar")).not.toBeNull();
    expect(translationScriptIssue("Сохранить", "ru")).toBeNull();
    expect(translationScriptIssue("GitHub {{URL_0}}", "bn", "GitHub {{URL_0}}")).toBeNull();
    expect(translationScriptIssue("t", "zh-Hans", "t")).toBeNull();
    expect(
      translationScriptIssue("Duplicati configuration", "hi", "Duplicati configuration")
    ).toBeNull();
  });
});

describe("batchScriptValidationIssue", () => {
  it("passes a mostly-Devanagari batch that keeps an email and hostname", () => {
    const sources = [
      "Failed to save daily summary settings",
      "recipient@example.com",
      "smtp.your-domain.com",
      "Enable daily summary",
    ];
    const outputs = [
      "दैनिक सारांश सेटिंग्स सहेजने में विफल",
      "recipient@example.com",
      "smtp.your-domain.com",
      "दैनिक सारांश सक्षम करें",
    ];
    expect(batchScriptValidationIssue(outputs, sources, "Deva")).toBeNull();
    expect(batchTranslationScriptIssue(outputs, sources, "hi")).toBeNull();
  });

  it("flags a batch that echoes English when source prose is long enough", () => {
    const sources = ["Failed to save daily summary settings", "Enable daily summary notifications"];
    const outputs = ["Failed to save daily summary settings", "Enable daily summary notifications"];
    expect(batchScriptValidationIssue(outputs, sources, "Deva")).not.toBeNull();
    expect(batchTranslationScriptIssue(outputs, sources, "hi")).not.toBeNull();
  });

  it("does not flag a two-short-item batch below the letter threshold", () => {
    expect(batchScriptValidationIssue(["Save", "Add"], ["Save", "Add"], "Deva")).toBeNull();
  });

  it("does not enforce romanized locales", () => {
    const sources = ["Failed to save daily summary settings", "Enable daily summary notifications"];
    expect(batchScriptValidationIssue(sources, sources, "Latn")).toBeNull();
    expect(batchTranslationScriptIssue(sources, sources, "hi-Latn")).toBeNull();
  });
});
