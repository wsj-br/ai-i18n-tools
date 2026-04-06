import {
  getUILanguageLabel,
  getUILanguageLabelNative,
} from "../../src/runtime/ui-language-display";
import type { UiLanguageEntry } from "../../src/core/ui-languages";

describe("getUILanguageLabelNative", () => {
  it("returns single label when englishName matches label", () => {
    const lang: UiLanguageEntry = { code: "en-GB", label: "English (UK)", englishName: "English (UK)" };
    expect(getUILanguageLabelNative(lang)).toBe("English (UK)");
  });

  it("returns englishName / label when different", () => {
    const lang: UiLanguageEntry = { code: "de", label: "Deutsch", englishName: "German" };
    expect(getUILanguageLabelNative(lang)).toBe("German / Deutsch");
  });
});

describe("getUILanguageLabel", () => {
  const noop = (s: string) => s;

  it("returns englishName when t is identity", () => {
    const lang: UiLanguageEntry = { code: "de", label: "Deutsch", englishName: "German" };
    expect(getUILanguageLabel(lang, noop)).toBe("German");
  });

  it("returns english / translated when t changes string", () => {
    const lang: UiLanguageEntry = { code: "de", label: "Deutsch", englishName: "German" };
    const t = (s: string) => (s === "German" ? "Allemand" : s);
    expect(getUILanguageLabel(lang, t)).toBe("German / Allemand");
  });
});
