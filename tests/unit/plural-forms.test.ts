import { describe, expect, it } from "vitest";
import {
  compactIdenticalPluralForms,
  expandPluralFormsForFlatOutput,
  formsCompleteForLocale,
  pluralCategoryExamplesHint,
  pluralFormsRequiredForTranslateUi,
  pluralTranslatedLocaleHasContent,
  requiredCldrPluralForms,
} from "../../src/core/plural-forms.js";

describe("requiredCldrPluralForms", () => {
  it("returns a non-empty ordered subset for en", () => {
    const f = requiredCldrPluralForms("en");
    expect(f.length).toBeGreaterThan(0);
    expect(f).toContain("one");
    expect(f).toContain("other");
  });

  it("includes many categories for ar", () => {
    const f = requiredCldrPluralForms("ar");
    expect(f.length).toBeGreaterThanOrEqual(2);
  });
});

describe("pluralFormsRequiredForTranslateUi", () => {
  it("returns one+other when Intl exposes one (en)", () => {
    expect(pluralFormsRequiredForTranslateUi("en")).toEqual(["one", "other"]);
  });

  it("returns other-only when Intl has no one (zh)", () => {
    expect(pluralFormsRequiredForTranslateUi("zh")).toEqual(["other"]);
  });
});

describe("formsCompleteForLocale", () => {
  it("returns false when forms undefined", () => {
    expect(formsCompleteForLocale(undefined, "en")).toBe(false);
  });

  it("returns true when all required forms present", () => {
    const req = requiredCldrPluralForms("en");
    const forms: Record<string, string> = {};
    for (const k of req) {
      forms[k] = `x_${k}`;
    }
    expect(formsCompleteForLocale(forms, "en")).toBe(true);
  });
});

describe("pluralTranslatedLocaleHasContent", () => {
  it("returns false for undefined / empty / missing other", () => {
    expect(pluralTranslatedLocaleHasContent(undefined, "en")).toBe(false);
    expect(pluralTranslatedLocaleHasContent({}, "en")).toBe(false);
    expect(pluralTranslatedLocaleHasContent({ one: "", other: "   " }, "en")).toBe(false);
    expect(pluralTranslatedLocaleHasContent({ one: "x", other: "" }, "en")).toBe(false);
  });

  it("requires one and other when the locale uses a one category", () => {
    expect(pluralTranslatedLocaleHasContent({ one: "a", other: "b" }, "en")).toBe(true);
    expect(pluralTranslatedLocaleHasContent({ one: "a", other: "b" }, "pt-BR")).toBe(true);
    expect(pluralTranslatedLocaleHasContent({ other: "only" }, "en")).toBe(false);
    expect(pluralTranslatedLocaleHasContent({ one: "only" }, "en")).toBe(false);
  });

  it("allows other-only when Intl has no one category (e.g. Chinese)", () => {
    expect(pluralTranslatedLocaleHasContent({ other: "{{count}} 项" }, "zh")).toBe(true);
    expect(pluralTranslatedLocaleHasContent({ one: "x", other: "" }, "zh")).toBe(false);
  });
});

describe("expandPluralFormsForFlatOutput", () => {
  it("fills Arabic many from other when many key is omitted", () => {
    expect(requiredCldrPluralForms("ar")).toContain("many");
    const expanded = expandPluralFormsForFlatOutput(
      {
        one: "هذا واحد",
        two: "هذا اثنان",
        few: "قليل",
        other: "عام {{count}}",
      },
      "ar"
    );
    expect(expanded.many).toBe("عام {{count}}");
  });

  it("does not invent keys beyond required categories for English", () => {
    const expanded = expandPluralFormsForFlatOutput(
      {
        one: "one cat",
        other: "{{count}} cats",
      },
      "en"
    );
    expect(expanded.one).toBeDefined();
    expect(expanded.other).toBeDefined();
    expect(expanded.many).toBeUndefined();
  });
});

describe("pluralCategoryExamplesHint", () => {
  it("lists sample n per category for Arabic", () => {
    const h = pluralCategoryExamplesHint("ar");
    expect(h).toContain("Intl.PluralRules reference");
    expect(h).toContain("few:");
    expect(h).toContain("many:");
  });
});

describe("compactIdenticalPluralForms", () => {
  it("merges duplicate values keeping other when present", () => {
    const out = compactIdenticalPluralForms({
      one: "same",
      other: "same",
    });
    expect(Object.keys(out)).toEqual(["other"]);
    expect(out.other).toBe("same");
  });

  it("leaves distinct values", () => {
    const out = compactIdenticalPluralForms({
      one: "one cat",
      other: "{{count}} cats",
    });
    expect(out.one).toBe("one cat");
    expect(out.other).toBe("{{count}} cats");
  });
});
