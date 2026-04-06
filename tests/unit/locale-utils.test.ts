import {
  assignCoercedTargetLocales,
  coerceTargetLocalesField,
} from "../../src/core/locale-utils";

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

describe("assignCoercedTargetLocales", () => {
  it("mutates raw object", () => {
    const raw: { targetLocales?: unknown } = { targetLocales: "a/b.json" };
    assignCoercedTargetLocales(raw);
    expect(raw.targetLocales).toEqual(["a/b.json"]);
  });
});
