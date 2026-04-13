import {
  protectMarkdownEmphasis,
  restoreMarkdownEmphasis,
} from "../../src/processors/emphasis-placeholders.js";

describe("emphasis placeholders", () => {
  it("round-trips emphasis, strong, combined emphasis, and strikethrough", () => {
    const src = [
      "Use *asterisks* or _underscores_.",
      "Strong: **asterisks** and __underscores__.",
      "Combined: **asterisks and _underscores_**.",
      "Strike: ~~Scratch this.~~",
    ].join("\n");

    const protectedState = protectMarkdownEmphasis(src);
    expect(protectedState.protected).toContain("{{IT}}");
    expect(protectedState.protected).toContain("{{IU}}");
    expect(protectedState.protected).toContain("{{SE}}");
    expect(protectedState.protected).toContain("{{SU}}");
    expect(protectedState.protected).toContain("{{ST}}");

    const restored = restoreMarkdownEmphasis(protectedState.protected);
    expect(restored).toBe(src);
  });

  it("does not replace markers inside code spans", () => {
    const src = "Code: `**not bold** _not italic_ ~~not strike~~` and *yes italic*.";
    const protectedState = protectMarkdownEmphasis(src);
    expect(protectedState.protected).toContain("`**not bold** _not italic_ ~~not strike~~`");

    const restored = restoreMarkdownEmphasis(protectedState.protected);
    expect(restored).toBe(src);
  });

  it("ignores escaped delimiter markers", () => {
    const src = String.raw`Escaped: \*no italic\* and \~~no strike\~~ and **yes bold**.`;
    const protectedState = protectMarkdownEmphasis(src);

    const restored = restoreMarkdownEmphasis(protectedState.protected);
    expect(restored).toBe(src);
  });

  describe("CJK right-flanking delimiter fix", () => {
    it("inserts space when closing ** is followed by Korean particle", () => {
      const translated = "{{SE}}bold{{SE}}이 뒤에";
      const result = restoreMarkdownEmphasis(translated);
      expect(result).toBe("**bold** 이 뒤에");
    });

    it("inserts space when closing __ is followed by Korean particle", () => {
      const translated = "{{SU}}bold{{SU}}이 뒤에";
      const result = restoreMarkdownEmphasis(translated);
      expect(result).toBe("__bold__ 이 뒤에");
    });

    it("inserts space when closing _ is followed by CJK character", () => {
      const translated = "{{IU}}italic{{IU}}を設定";
      const result = restoreMarkdownEmphasis(translated);
      expect(result).toBe("_italic_ を設定");
    });

    it("inserts space when closing ~~ is followed by CJK character", () => {
      const translated = "{{ST}}struck{{ST}}이 있다";
      const result = restoreMarkdownEmphasis(translated);
      expect(result).toBe("~~struck~~ 이 있다");
    });

    it("does not insert space for opening delimiter before content", () => {
      const translated = "텍스트 {{SE}}bold{{SE}} end";
      const result = restoreMarkdownEmphasis(translated);
      expect(result).toBe("텍스트 **bold** end");
    });

    it("does not insert space when followed by punctuation", () => {
      const translated = "{{SE}}bold{{SE}}.";
      const result = restoreMarkdownEmphasis(translated);
      expect(result).toBe("**bold**.");
    });

    it("does not insert space when followed by whitespace", () => {
      const translated = "{{SE}}bold{{SE}} next";
      const result = restoreMarkdownEmphasis(translated);
      expect(result).toBe("**bold** next");
    });

    it("handles closing ** after placeholder (e.g. ILC) followed by CJK", () => {
      const translated = "{{SE}}text {{ILC_0}}{{SE}}이 끝";
      const result = restoreMarkdownEmphasis(translated);
      expect(result).toBe("**text {{ILC_0}}** 이 끝");
    });

    it("does not insert space for opener preceded by HTML entity semicolon", () => {
      const translated = "&lt;br&gt;&lt;br&gt;{{SE}}Nota:{{SE}} Si editas";
      const result = restoreMarkdownEmphasis(translated);
      expect(result).toBe("&lt;br&gt;&lt;br&gt;**Nota:** Si editas");
    });

    it("does not insert space for opener preceded by punctuation", () => {
      const translated = "({{SE}}bold{{SE}}) end";
      const result = restoreMarkdownEmphasis(translated);
      expect(result).toBe("(**bold**) end");
    });

    it("does not insert space for opener at start of string", () => {
      const translated = "{{SE}}bold{{SE}}이";
      const result = restoreMarkdownEmphasis(translated);
      expect(result).toBe("**bold** 이");
    });
  });
});
