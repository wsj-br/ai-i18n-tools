import {
  getUILanguageLabel,
  getUILanguageLabelNative,
} from "../../src/runtime/ui-language-display.js";
import type { UiLanguageEntry } from "../../src/core/ui-languages.js";

describe("getUILanguageLabelNative", () => {
  it("returns single label when englishName matches label", () => {
    const lang: UiLanguageEntry = {
      code: "en-GB",
      label: "English (UK)",
      englishName: "English (UK)",
      direction: "ltr",
    };
    expect(getUILanguageLabelNative(lang)).toBe("English (UK)");
  });

  it("returns englishName / label when different", () => {
    const lang: UiLanguageEntry = {
      code: "de",
      label: "Deutsch",
      englishName: "German",
      direction: "ltr",
    };
    expect(getUILanguageLabelNative(lang)).toBe("German / Deutsch");
  });
});

describe("getUILanguageLabel", () => {
  const noop = (s: string) => s;

  it("returns englishName when t is identity", () => {
    const lang: UiLanguageEntry = {
      code: "de",
      label: "Deutsch",
      englishName: "German",
      direction: "ltr",
    };
    expect(getUILanguageLabel(lang, noop)).toBe("German");
  });

  it("returns english / translated when t changes string", () => {
    const lang: UiLanguageEntry = {
      code: "de",
      label: "Deutsch",
      englishName: "German",
      direction: "ltr",
    };
    const t = (s: string) => (s === "German" ? "Allemand" : s);
    expect(getUILanguageLabel(lang, t)).toBe("German / Allemand");
  });
});
