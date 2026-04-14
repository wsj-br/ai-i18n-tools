import * as main from "../../src/index.js";
import * as runtime from "../../src/runtime/index.js";

describe("src/index.ts public API", () => {
  it("exports config and locale helpers", () => {
    expect(main.normalizeLocale("EN-us")).toBe("en-US");
    expect(main.parseLocaleList("de fr")).toEqual(["de", "fr"]);
  });

  it("exports extractors and classifiers", () => {
    expect(main.classifySegmentType("# Title")).toBe("heading");
    expect(new main.MarkdownExtractor().name).toBe("markdown");
  });

  it("re-exports runtime helpers", () => {
    expect(main.interpolateTemplate("x {{a}}", { a: 1 })).toBe("x 1");
    expect(main.getTextDirection("ar")).toBe("rtl");
  });
});

describe("src/runtime/index.ts", () => {
  it("exports template and i18next helpers", () => {
    expect(runtime.interpolateTemplate("a {{k}}", { k: "b" })).toBe("a b");
    expect(
      runtime.getUILanguageLabel(
        { code: "de", englishName: "German", label: "Deutsch", direction: "ltr" },
        (s) => s
      )
    ).toBe("German");
    expect(runtime.defaultI18nInitOptions("en").lng).toBe("en");
  });
});
