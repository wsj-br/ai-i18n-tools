import { describe, expect, it } from "vitest";
import {
  assignCoercedTargetLocales,
  coerceTargetLocalesField,
  disallowedScriptLetters,
  englishLanguageNameForLocale,
  englishScriptName,
  hanVariantCounts,
  isLatinScriptLocale,
  nonLatinLettersIn,
  normalizeLocale,
  normalizeManifestLocaleKey,
  parseLocaleList,
  primaryLanguageSubtag,
  scriptLetterCounts,
  scriptSubtag,
  effectiveScriptSubtag,
  scriptValidationIssue,
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

  it("does not invent a script for languages without a default", () => {
    expect(effectiveScriptSubtag("en-GB")).toBeUndefined();
    expect(effectiveScriptSubtag("de")).toBeUndefined();
    expect(effectiveScriptSubtag("pt-BR")).toBeUndefined();
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
  it("returns null when there is no script subtag or for composite scripts", () => {
    expect(scriptValidationIssue("anything", "")).toBeNull();
    expect(scriptValidationIssue("ここ 한국", "Jpan")).toBeNull();
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

  it("allows Latin-only / symbol-only output (handled by the prompt directive)", () => {
    expect(scriptValidationIssue("GitHub {{URL_0}} OK", "Hans")).toBeNull();
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
});
