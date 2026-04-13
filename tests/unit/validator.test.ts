import {
  validateTranslation,
  validateDocTranslatePair,
  compareMarkdownAST,
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
    const src = [S({ type: "paragraph", content: "hi", hash: "h", translatable: true })];
    const tr = [S({ type: "paragraph", content: "x".repeat(100), hash: "h", translatable: true })];
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
    const src = S({ type: "paragraph", content: "short", hash: "h" });
    const r = await validateDocTranslatePair(src, "x".repeat(500));
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("length ratio"))).toBe(true);
  });

  it("fails on leaked internal placeholders", async () => {
    const src = S({ type: "paragraph", content: "Hi", hash: "h" });
    const r = await validateDocTranslatePair(src, "Hola {{DOC_HEADING_ID_0}}");
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
