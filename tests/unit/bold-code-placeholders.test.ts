import {
  protectBoldWrappedInlineCode,
  restoreBoldWrappedInlineCode,
} from "../../src/processors/bold-code-placeholders.js";
import { PlaceholderHandler } from "../../src/processors/placeholder-handler.js";

describe("bold-code-placeholders", () => {
  it("replaces each **`inner`** with one placeholder and round-trips", () => {
    const src = "See **`foo`** and **`bar`** end.";
    const { protected: p, boldCodeMap } = protectBoldWrappedInlineCode(src);
    expect(boldCodeMap).toEqual(["**`foo`**", "**`bar`**"]);
    expect(p).toBe("See {{BLD_0}} and {{BLD_1}} end.");
    expect(restoreBoldWrappedInlineCode(p, boldCodeMap)).toBe(src);
  });

  it("supports double-backtick code spans inside bold", () => {
    const src = "Use **`x`** and **``y``**.";
    const { protected: p, boldCodeMap } = protectBoldWrappedInlineCode(src);
    expect(boldCodeMap).toEqual(["**`x`**", "**``y``**"]);
    expect(restoreBoldWrappedInlineCode(p, boldCodeMap)).toBe(src);
  });

  it("does not match when ** is not followed by code", () => {
    const src = "**bold** not **`code`**";
    const { protected: p, boldCodeMap } = protectBoldWrappedInlineCode(src);
    expect(boldCodeMap).toEqual(["**`code`**"]);
    expect(p).toContain("**bold**");
    expect(restoreBoldWrappedInlineCode(p, boldCodeMap)).toBe(src);
  });

  it("ignores **...** inside a code span", () => {
    const src = "In code: `**not replaced**` then **`yes`**";
    const { protected: p, boldCodeMap } = protectBoldWrappedInlineCode(src);
    expect(boldCodeMap).toEqual(["**`yes`**"]);
    expect(p).toContain("`**not replaced**`");
    expect(restoreBoldWrappedInlineCode(p, boldCodeMap)).toBe(src);
  });

  it("PlaceholderHandler chains bold-code before emphasis", () => {
    const h = new PlaceholderHandler();
    const src = "Korean **`텍스트`** and **plain**.";
    const st = h.protectForTranslation(src);
    expect(st.text).toContain("{{BLD_0}}");
    expect(st.text).toContain("{{SE}}");
    expect(st.boldCodeMap).toEqual(["**`텍스트`**"]);
    const back = h.restoreAfterTranslation(st.text, st);
    expect(back).toBe(src);
  });

  describe("CJK right-flanking delimiter fix", () => {
    it("inserts a space when Korean particle follows the placeholder", () => {
      const boldCodeMap = ["**`features.translateSVG`**"];
      const translated = "번역은 {{BLD_0}}이 true일 때만 실행됩니다";
      const result = restoreBoldWrappedInlineCode(translated, boldCodeMap);
      expect(result).toBe("번역은 **`features.translateSVG`** 이 true일 때만 실행됩니다");
    });

    it("inserts a space when Japanese hiragana follows the placeholder", () => {
      const boldCodeMap = ["**`config`**"];
      const translated = "{{BLD_0}}を設定する";
      const result = restoreBoldWrappedInlineCode(translated, boldCodeMap);
      expect(result).toBe("**`config`** を設定する");
    });

    it("inserts a space when Chinese character follows the placeholder", () => {
      const boldCodeMap = ["**`sync`**"];
      const translated = "运行{{BLD_0}}命令";
      const result = restoreBoldWrappedInlineCode(translated, boldCodeMap);
      expect(result).toBe("运行**`sync`** 命令");
    });

    it("does not insert a space when space already follows", () => {
      const boldCodeMap = ["**`code`**"];
      const translated = "See {{BLD_0}} for details.";
      const result = restoreBoldWrappedInlineCode(translated, boldCodeMap);
      expect(result).toBe("See **`code`** for details.");
    });

    it("does not insert a space when punctuation follows", () => {
      const boldCodeMap = ["**`code`**"];
      const translated = "See {{BLD_0}}.";
      const result = restoreBoldWrappedInlineCode(translated, boldCodeMap);
      expect(result).toBe("See **`code`**.");
    });

    it("does not insert a space at end of string", () => {
      const boldCodeMap = ["**`code`**"];
      const translated = "See {{BLD_0}}";
      const result = restoreBoldWrappedInlineCode(translated, boldCodeMap);
      expect(result).toBe("See **`code`**");
    });

    it("handles multiple placeholders with mixed contexts", () => {
      const boldCodeMap = ["**`a`**", "**`b`**"];
      const translated = "{{BLD_0}}이고 {{BLD_1}} end.";
      const result = restoreBoldWrappedInlineCode(translated, boldCodeMap);
      expect(result).toBe("**`a`** 이고 **`b`** end.");
    });
  });
});
