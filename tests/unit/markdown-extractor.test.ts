import type { DocSegmentTranslation } from "../../src/core/types.js";
import { segmentSplittingSchema } from "../../src/core/types.js";
import { MarkdownExtractor } from "../../src/extractors/markdown-extractor.js";

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

  it("extracts fenced code and admonition segments", () => {
    const md = "```ts\nconst x = 1;\n```\n\n:::note\nN\n:::\n\nPara.";
    const segs = ex.extract(md, "doc.md");
    expect(segs.some((s) => s.type === "code")).toBe(true);
    expect(segs.some((s) => s.type === "admonition")).toBe(true);
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

  it("reassembles with DocSegmentTranslation map (text + modelUsed metadata)", () => {
    const md = "# Title\n\nBody.";
    const segs = ex.extract(md, "x.md");
    const map = new Map<string, DocSegmentTranslation>();
    for (const s of segs) {
      if (s.translatable) {
        map.set(s.hash, { text: `${s.content}!`, modelUsed: "test/model" });
      }
    }
    const out = ex.reassemble(segs, map);
    expect(out).toContain("Title!");
    expect(out).toContain("Body.!");
    expect(out).not.toContain("test/model");
  });

  it("optionally splits pipe tables and reassembles with tight newlines", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |";
    const segs = ex.extract(md, "t.md", {
      segmentSplitting: segmentSplittingSchema.parse({ enabled: true }),
    });
    expect(segs.length).toBe(2);
    const map = new Map<string, string>();
    for (const s of segs) {
      if (s.translatable) {
        map.set(s.hash, s.content);
      }
    }
    const out = ex.reassemble(segs, map);
    expect(out).toContain("| 1 | 2 |");
    expect(out).toContain("| 3 | 4 |");
    expect(out.split("\n").filter((l) => l.includes("| 3 | 4 |"))).toHaveLength(1);
  });

  it("skips configured language-list block like a code fence (not translated)", () => {
    const md = `# Doc

**LANGS_START**[en](a.md) | [de](b.md)**LANGS_END**

Paragraph after.`;
    const segs = ex.extract(md, "x.md", {
      languageListBlock: {
        start: "**LANGS_START**",
        end: "**LANGS_END**",
        separator: " | ",
      },
    });
    const langSeg = segs.find((s) => s.type === "other" && s.content.includes("**LANGS_START**"));
    expect(langSeg).toBeDefined();
    expect(langSeg!.translatable).toBe(false);
    const para = segs.find((s) => s.type === "paragraph" && s.content.includes("Paragraph after"));
    expect(para?.translatable).toBe(true);
  });
});
