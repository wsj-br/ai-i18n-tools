import { describe, expect, it } from "vitest";
import {
  applyEmphasisCloserSpacing,
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

  describe("CJK / RTL right-flanking delimiter fix", () => {
    // ── Asterisk bold/italic: letter**letter is already right-flanking → no space needed ──────
    it("** closer before Korean: no space needed (letter**letter is right-flanking)", () => {
      // **bold**이 parses as strong=1 without a space; parity tracking prevents false-positive.
      expect(restoreMarkdownEmphasis("{{SE}}bold{{SE}}이 뒤에")).toBe("**bold**이 뒤에");
    });

    it("inserts space when ** closer follows ellipsis/punctuation and is followed by CJK", () => {
      // **Rephrase…**을(를): `…` before closer + `을` after → not right-flanking in CommonMark.
      expect(restoreMarkdownEmphasis("{{SE}}Rephrase…{{SE}}을(를) click")).toBe(
        "**Rephrase…** 을(를) click"
      );
      expect(restoreMarkdownEmphasis("{{SE}}다시 작성…{{SE}}은(는) disabled")).toBe(
        "**다시 작성…** 은(는) disabled"
      );
    });

    it("** opener preceded by Korean particle is NOT treated as closer (parity tracking)", () => {
      // から{{SE}} is opener #1, not a closer — must not receive a trailing space.
      expect(restoreMarkdownEmphasis("から{{SE}}インターフェース言語{{SE}}を")).toBe(
        "から**インターフェース言語**を"
      );
    });

    it("** closer before Arabic letter: no space needed", () => {
      // **نص**كلمة parses as strong=1 — letter prevChar is right-flanking for *.
      expect(restoreMarkdownEmphasis("{{SE}}نص عريض{{SE}}كلمة")).toBe("**نص عريض**كلمة");
    });

    it("** closer before Hebrew letter: no space needed", () => {
      expect(restoreMarkdownEmphasis("{{SE}}מודגש{{SE}}המשך")).toBe("**מודגש**המשך");
    });

    // ── Underscore bold/italic: letter__letter is BOTH flanking → cannot close → space needed ─
    it("__ closer before Korean: space required (underscore strict closing rule)", () => {
      expect(restoreMarkdownEmphasis("{{SU}}bold{{SU}}이 뒤에")).toBe("__bold__ 이 뒤에");
    });

    it("_ closer before CJK: space required", () => {
      expect(restoreMarkdownEmphasis("{{IU}}italic{{IU}}を設定")).toBe("_italic_ を設定");
    });

    it("inserts leading space before {{IU}} opener glued after CJK letter", () => {
      expect(restoreMarkdownEmphasis("データを{{IU}}処理{{IU}}することで")).toBe(
        "データを _処理_ することで"
      );
    });

    it("inserts leading space before {{SU}} opener glued after CJK letter", () => {
      expect(restoreMarkdownEmphasis("テキストを{{SU}}強調{{SU}}する")).toBe(
        "テキストを __強調__ する"
      );
    });

    it("does not insert leading space before {{SE}}/{{IT}} openers after CJK (asterisk left-flanking)", () => {
      expect(restoreMarkdownEmphasis("を{{SE}}同期{{SE}}呼び出し")).toBe("を**同期**呼び出し");
      expect(restoreMarkdownEmphasis("混在{{IT}}インライン{{IT}}書式")).toBe(
        "混在*インライン*書式"
      );
    });

    // ── Strikethrough: closes correctly before Unicode letters → no space ─────────────────────
    it("~~ closer before CJK: no space needed (GFM strikethrough closes fine)", () => {
      expect(restoreMarkdownEmphasis("{{ST}}struck{{ST}}이 있다")).toBe("~~struck~~이 있다");
    });

    // ── Closing ** after link ) or ] — NOT right-flanking → space required ────────────────────
    it("inserts space when closing ** is preceded by ) from a link and followed by CJK", () => {
      // )**を: `)` is punctuation + `を` is letter → left-flanking, not right-flanking → needs space.
      const translated = "参照：{{SE}}[ユーザーガイド]({{URL_0}}){{SE}}を確認";
      expect(restoreMarkdownEmphasis(translated)).toBe(
        "参照：**[ユーザーガイド]({{URL_0}})** を確認"
      );
    });

    it("inserts space when closing ** is preceded by ) and followed by Arabic letter", () => {
      expect(restoreMarkdownEmphasis("{{SE}}[رابط]({{URL_0}}){{SE}}يرجى")).toBe(
        "**[رابط]({{URL_0}})** يرجى"
      );
    });

    it("inserts space when closing ** is preceded by ] and followed by CJK", () => {
      expect(restoreMarkdownEmphasis("{{SE}}[text]{{SE}}を確認")).toBe("**[text]** を確認");
    });

    // ── Closing ** after } placeholder — needs space only when it is a closer ─────────────────
    it("handles closing ** after {{ILC_0}} placeholder followed by CJK (} prevChar = closer)", () => {
      // The {{SE}} count is 1 (closer) here → } prevChar triggers space.
      expect(restoreMarkdownEmphasis("{{SE}}text {{ILC_0}}{{SE}}이 끝")).toBe(
        "**text {{ILC_0}}** 이 끝"
      );
    });

    it("opener {{SE}} immediately after {{HTM_N}} is NOT modified (parity: count=0 = opener)", () => {
      expect(restoreMarkdownEmphasis("{{HTM_0}}{{SE}}他の言語で読む:{{SE}} {{HTM_1}}")).toBe(
        "{{HTM_0}}**他の言語で読む:** {{HTM_1}}"
      );
    });

    // ── Misc edge cases ───────────────────────────────────────────────────────────────────────
    it("does not insert space for opener preceded by HTML entity semicolon", () => {
      expect(restoreMarkdownEmphasis("&lt;br&gt;&lt;br&gt;{{SE}}Nota:{{SE}} Si editas")).toBe(
        "&lt;br&gt;&lt;br&gt;**Nota:** Si editas"
      );
    });

    it("does not insert space for opener preceded by punctuation", () => {
      expect(restoreMarkdownEmphasis("({{SE}}bold{{SE}}) end")).toBe("(**bold**) end");
    });

    it("does not insert space for opener at start of string before CJK", () => {
      // {{SE}} count=0 → opener → no space. Then count=1 → closer → prevChar=`d`, no space needed.
      expect(restoreMarkdownEmphasis("{{SE}}bold{{SE}}이")).toBe("**bold**이");
    });

    it("does not insert space when followed by punctuation", () => {
      expect(restoreMarkdownEmphasis("{{SE}}bold{{SE}}.")).toBe("**bold**.");
    });

    it("does not insert space when followed by whitespace", () => {
      expect(restoreMarkdownEmphasis("{{SE}}bold{{SE}} next")).toBe("**bold** next");
    });

    it("does not insert space for opening delimiter before content", () => {
      expect(restoreMarkdownEmphasis("텍스트 {{SE}}bold{{SE}} end")).toBe("텍스트 **bold** end");
    });
  });

  describe("applyEmphasisCloserSpacing (real delimiters, no placeholders)", () => {
    it("** closer before Korean: no space needed (letter**letter is right-flanking)", () => {
      // **bold**이 = strong:1 — asterisk closing rule is just right-flanking, letter prev qualifies.
      expect(applyEmphasisCloserSpacing("**bold**이 뒤에")).toBe("**bold**이 뒤에");
    });

    it("__ closer before Korean: space required (underscore strict closing rule)", () => {
      expect(applyEmphasisCloserSpacing("__bold__이")).toBe("__bold__ 이");
    });

    it("_ closer before Japanese: space required", () => {
      expect(applyEmphasisCloserSpacing("_italic_を設定")).toBe("_italic_ を設定");
    });

    it("inserts leading space before _ opener glued after CJK letter", () => {
      expect(applyEmphasisCloserSpacing("データを_処理_することで")).toBe(
        "データを _処理_ することで"
      );
    });

    it("does not insert leading space before ** opener after CJK letter", () => {
      expect(applyEmphasisCloserSpacing("を**同期**呼び出し")).toBe("を**同期**呼び出し");
    });

    it("~~ closer before Korean: no space needed (GFM strikethrough closes fine)", () => {
      expect(applyEmphasisCloserSpacing("~~struck~~이 있다")).toBe("~~struck~~이 있다");
    });

    it("does not insert before Latin word when already separated", () => {
      expect(applyEmphasisCloserSpacing("**bold** end")).toBe("**bold** end");
    });

    it("does not insert when followed by punctuation", () => {
      expect(applyEmphasisCloserSpacing("**bold**.")).toBe("**bold**.");
    });

    it("is idempotent once spacing is correct", () => {
      expect(applyEmphasisCloserSpacing("__bold__ 이")).toBe("__bold__ 이");
    });

    it("inserts space when closing ** is preceded by ) and followed by CJK", () => {
      expect(applyEmphasisCloserSpacing("**[ユーザーガイド](USER-GUIDE.md)**を参照")).toBe(
        "**[ユーザーガイド](USER-GUIDE.md)** を参照"
      );
    });

    it("inserts space when closing ** is preceded by ) and followed by Arabic", () => {
      expect(applyEmphasisCloserSpacing("**[رابط](url)**يرجى")).toBe("**[رابط](url)** يرجى");
    });

    it("leaves ASCII intraword underscores (identifiers) untouched", () => {
      // Identifiers are never emphasis in CommonMark; relaxing the underscore rule here would
      // inject spaces (my _config_ value) and fabricate an `_config_` emphasis span.
      expect(applyEmphasisCloserSpacing("Set the my_config_value option and run_the_thing.")).toBe(
        "Set the my_config_value option and run_the_thing."
      );
    });

    it("does not corrupt underscored identifiers inside link text or destinations", () => {
      expect(
        applyEmphasisCloserSpacing(
          "source [translation_demo_svg.svg](../images/translation_demo_svg.svg)"
        )
      ).toBe("source [translation_demo_svg.svg](../images/translation_demo_svg.svg)");
    });

    it("still spaces a genuine underscore emphasis glued before a CJK letter", () => {
      // Regression guard: the ASCII fix must not disable the CJK gluing relaxation.
      expect(applyEmphasisCloserSpacing("_italic_を")).toBe("_italic_ を");
    });

    it("does not add spurious spaces in consecutive CJK bold/italic spans", () => {
      // ** closer before CJK letter: letter**letter is right-flanking → no space.
      // ** opener before CJK: must NOT get a space (would break opening).
      const s =
        "**地球儀アイコン + 言語コード**は、メニューやボタンなどのアプリのインターフェース言語を変更します。**翻訳**で使用される翻訳言語を変更するものでは**ありません**。";
      const result = applyEmphasisCloserSpacing(s);
      expect(result).not.toContain("** ありません");
      expect(result).toBe(s); // no changes — all ** already parse correctly
    });
  });
});
