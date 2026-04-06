import { MarkdownExtractor } from "../../src/extractors/markdown-extractor";

describe("MarkdownExtractor", () => {
  const ex = new MarkdownExtractor();

  it("splits frontmatter and body", () => {
    const md = `---
title: Hello
---
# Hi

Paragraph one.
`;
    const segs = ex.extract(md, "x.md");
    expect(segs.some((s) => s.type === "frontmatter")).toBe(true);
    expect(segs.some((s) => s.type === "heading")).toBe(true);
    expect(segs.some((s) => s.type === "paragraph")).toBe(true);
  });

  it("reassembles with translations map", () => {
    const md = "# Title\n\nBody.";
    const segs = ex.extract(md, "x.md");
    const map = new Map<string, string>();
    for (const s of segs) {
      if (s.translatable) {
        map.set(s.hash, s.content + "!");
      }
    }
    const out = ex.reassemble(segs, map);
    expect(out).toContain("Title!");
    expect(out).toContain("Body.!");
  });
});
