import { describe, expect, it } from "vitest";
import {
  validateTranslation,
  validateDocTranslatePair,
  compareMarkdownAST,
  isAcceptableLengthRatio,
  lengthRatioMin,
} from "../../src/processors/validator.js";
import type { Segment } from "../../src/core/types.js";

function S(partial: Partial<Segment> & Pick<Segment, "content" | "type" | "hash">): Segment {
  return {
    ...partial,
    id: partial.id ?? "1",
    type: partial.type,
    content: partial.content,
    hash: partial.hash,
    translatable: partial.translatable ?? true,
  };
}

describe("compareMarkdownAST", () => {
  it("detects dropped link", async () => {
    const e = await compareMarkdownAST("[a](http://x)", "no link");
    expect(e.some((x) => x.includes("AST mismatch: link"))).toBe(true);
  });

  it("detects heading depth change", async () => {
    const e = await compareMarkdownAST("## Two", "# One");
    expect(e.some((x) => x.includes("Heading depth"))).toBe(true);
  });

  it("detects list count change", async () => {
    const e = await compareMarkdownAST("- a\n- b", "- a");
    expect(e.some((x) => x.includes("AST mismatch: listItem") || x.includes("list"))).toBe(true);
  });
});

describe("lengthRatioMin", () => {
  it("uses a lower floor for short labels that compress in CJK", () => {
    expect(lengthRatioMin(12)).toBe(0.08);
    expect(isAcceptableLengthRatio(12, 2)).toBe(true);
    expect(isAcceptableLengthRatio(11, 2)).toBe(true);
  });

  it("still flags extreme expansion on longer source text", () => {
    expect(isAcceptableLengthRatio(60, 300)).toBe(false);
  });
});

describe("validateTranslation", () => {
  it("flags code change as error", async () => {
    const src = [S({ type: "code", content: "```\na\n```", hash: "1", translatable: false })];
    const tr = [S({ type: "code", content: "```\nb\n```", hash: "1", translatable: false })];
    const v = await validateTranslation(src, tr);
    expect(v.valid).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
  });

  it("passes identical segments", async () => {
    const s = [S({ type: "paragraph", content: "Hi", hash: "h" })];
    const v = await validateTranslation(s, s);
    expect(v.valid).toBe(true);
  });

  it("errors on segment count mismatch", async () => {
    const a = [S({ type: "paragraph", content: "a", hash: "1" })];
    const b = [
      S({ type: "paragraph", content: "a", hash: "1" }),
      S({ type: "paragraph", content: "b", hash: "2" }),
    ];
    const v = await validateTranslation(a, b);
    expect(v.valid).toBe(false);
    expect(v.errors.some((e) => e.includes("Segment count mismatch"))).toBe(true);
  });

  it("errors when frontmatter key lines change", async () => {
    const src = [S({ type: "frontmatter", content: "title: x\n", hash: "f" })];
    const tr = [S({ type: "frontmatter", content: "title: x\nextra: y\n", hash: "f" })];
    const v = await validateTranslation(src, tr);
    expect(v.valid).toBe(false);
    expect(v.errors.some((e) => e.includes("Front matter"))).toBe(true);
  });

  it("warns on unusual length ratio", async () => {
    const src = [
      S({
        type: "paragraph",
        content: "This is a longer source sentence for ratio validation.",
        hash: "h",
        translatable: true,
      }),
    ];
    const tr = [
      S({
        type: "paragraph",
        content: "x".repeat(300),
        hash: "h",
        translatable: true,
      }),
    ];
    const v = await validateTranslation(src, tr);
    expect(v.warnings.some((w) => w.includes("length ratio"))).toBe(true);
  });

  it("warns on AST strong mismatch when ** is unbalanced", async () => {
    const src = [S({ type: "paragraph", content: "Line with **bold** text.", hash: "a" })];
    const tr = [S({ type: "paragraph", content: "Línea con **negrita texto.", hash: "a" })];
    const v = await validateTranslation(src, tr);
    expect(v.warnings.some((w) => w.includes("AST mismatch: strong"))).toBe(true);
  });
});

describe("validateDocTranslatePair", () => {
  it("treats dropped markdown link as failure (AST)", async () => {
    const src = S({ type: "paragraph", content: "[a](http://x)", hash: "h" });
    const r = await validateDocTranslatePair(src, "no links");
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("AST mismatch: link"))).toBe(true);
  });

  it("treats unusual length ratio as failure", async () => {
    const src = S({
      type: "paragraph",
      content: "This is a longer source sentence used to validate length ratio bounds.",
      hash: "h",
    });
    const r = await validateDocTranslatePair(src, "x".repeat(500));
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("length ratio"))).toBe(true);
  });

  it("accepts compact CJK translations of short English labels", async () => {
    const src = S({ type: "paragraph", content: "Installation", hash: "h" });
    const r = await validateDocTranslatePair(src, "安装");
    expect(r.ok).toBe(true);

    const src2 = S({ type: "paragraph", content: "Open Source", hash: "h2" });
    const r2 = await validateDocTranslatePair(src2, "开源");
    expect(r2.ok).toBe(true);
  });

  it("fails on leaked internal placeholders", async () => {
    const src = S({ type: "paragraph", content: "Hi", hash: "h" });
    const r = await validateDocTranslatePair(src, "Hola {{HDG_0}}");
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("placeholder leaked"))).toBe(true);
  });

  it("passes when ** delimiter count matches after translation", async () => {
    const src = S({ type: "paragraph", content: "Use **bold** here.", hash: "h" });
    const r = await validateDocTranslatePair(src, "Usa **negrita** aquí.");
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("fails when closing ** is dropped (AST strong mismatch)", async () => {
    const src = S({ type: "paragraph", content: "Use **bold** here.", hash: "h" });
    const r = await validateDocTranslatePair(src, "Usa **negrita aquí.");
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("AST mismatch: strong"))).toBe(true);
  });

  it("errorsIncludeAstMismatch detects AST mismatch errors", async () => {
    const { errorsIncludeAstMismatch } = await import("../../src/processors/validator.js");
    expect(errorsIncludeAstMismatch(["AST mismatch: strong 2 → 1 (hash abc)"])).toBe(true);
    expect(errorsIncludeAstMismatch(["Unusual length ratio (0.05) (hash abc)"])).toBe(false);
  });

  it("passes AST check for Korean bold after ellipsis when placeholders restore with spacing", async () => {
    const { restoreMarkdownEmphasis } =
      await import("../../src/processors/emphasis-placeholders.js");
    const source =
      "1. **Rephrase…** — click **Rephrase…** above the output to get another full translation of the same input with different wording. You can store up to **five** versions and switch between them in the version dropdown. **Rephrase…** is disabled once you reach five versions.\n" +
      "2. **Word alternatives** — select one or more words in the output (if you select only part of a word, the app expands the selection to full words), then right-click. A short list of alternatives appears at the cursor; click one to replace the selection. If you have fewer than five versions, the edited output is saved as a new version; at five versions, only **version 5** is updated. You must select text before right-clicking; right-click with no selection does nothing. Press **Esc** or click outside the list to cancel without changing the output.\n" +
      "3. **Costs** — each **Rephrase…** click and each word-alternative request uses the model again and may add to usage cost (same as a normal translate run).";
    const rawKo =
      "1. {{SE}}다시 작성…{{SE}} — 위의 출력 결과 상단에 있는 {{SE}}다시 작성…{{SE}}을(를) 클릭하여 동일한 입력에 대해 다른 표현으로 된 전체 번역을 얻을 수 있습니다. 최대 {{SE}}다섯 가지{{SE}} 버전을 저장하고 버전 드롭다운에서 자유롭게 전환할 수 있습니다. {{SE}}다시 작성…{{SE}}은(는) 다섯 번째 버전에 도달하면 비활성화됩니다.\n" +
      "2. {{SE}}단어 대안{{SE}} — 출력 결과에서 하나 이상의 단어를 선택합니다(부분 단어만 선택하면 앱이 자동으로 전체 단어로 선택 범위를 확장함). 그런 다음 마우스 오른쪽 버튼을 클릭합니다. 커서 근처에 짧은 대안 목록이 나타나며, 클릭하면 선택한 텍스트가 해당 단어로 대체됩니다. 버전이 다섯 개 미만인 경우 편집된 출력 결과는 새 버전으로 저장됩니다. 버전이 다섯 개인 경우 {{SE}}버전 5{{SE}}만 업데이트됩니다. 마우스 오른쪽 버튼을 클릭하려면 반드시 텍스트를 먼저 선택해야 하며, 아무것도 선택하지 않은 상태에서 오른쪽 클릭을 해도 아무런 동작도 하지 않습니다. {{SE}}Esc{{SE}} 키를 누르거나 목록 외부를 클릭하면 변경 없이 취소됩니다.\n" +
      "3. {{SE}}비용{{SE}} — {{SE}}다시 작성…{{SE}} 클릭 하나와 각 단어 대안 요청은 모델을 다시 사용하므로 사용 비용이 발생할 수 있으며(일반 번역 실행과 동일함), 비용이 추가될 수 있습니다.";
    const restored = restoreMarkdownEmphasis(rawKo);
    const src = S({ type: "paragraph", content: source, hash: "h" });
    const r = await validateDocTranslatePair(src, restored);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("flags frontmatter key mismatch in pair validation", async () => {
    const src = S({ type: "frontmatter", content: "a: 1\n", hash: "h" });
    const r = await validateDocTranslatePair(src, "a: 1\nb: 2\n");
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("Front matter"))).toBe(true);
  });

  it("skips AST check for code segments", async () => {
    const src = S({
      type: "code",
      content: "const x = `**`;",
      hash: "h",
      translatable: false,
    });
    const r = await validateDocTranslatePair(src, "const x = `**`;");
    expect(r.ok).toBe(true);
  });
});
