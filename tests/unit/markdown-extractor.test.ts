import { describe, expect, it } from "vitest";
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

  it("does not translate YAML front matter when translateFrontmatterFields is false", () => {
    const md = `---
title: Hello
---
Body.
`;
    const fm = ex
      .extract(md, "x.md", { translateFrontmatterFields: false })
      .find((s) => s.type === "frontmatter");
    expect(fm?.translatable).toBe(false);
    expect(fm?.content).toContain("title: Hello");
  });

  it("extracts translatable front matter fields as separate segments", () => {
    const md = `---
title: Translation Feature Showcase
description: A reference document.
sidebar:
  order: 1
---
Body.
`;
    const segs = ex.extract(md, "x.mdx");
    const shell = segs.find((s) => s.type === "frontmatter");
    expect(shell?.content.startsWith("__I18N_FM_SHELL__")).toBe(true);
    const titleField = segs.find((s) => s.frontmatterPath === "title");
    const descField = segs.find((s) => s.frontmatterPath === "description");
    expect(titleField?.translatable).toBe(true);
    expect(titleField?.content).toBe("Translation Feature Showcase");
    expect(descField?.translatable).toBe(true);
    expect(segs.find((s) => s.frontmatterPath === "sidebar.order")).toBeUndefined();
  });

  it("reassembles translated front matter fields into YAML", () => {
    const md = `---
title: Quick Start
description: Short summary.
sidebar:
  order: 2
---
Paragraph.
`;
    const segs = ex.extract(md, "quick-start.md");
    const map = new Map<string, string>();
    for (const s of segs) {
      if (s.frontmatterPath === "title") {
        map.set(s.hash, "Schnellstart");
      } else if (s.frontmatterPath === "description") {
        map.set(s.hash, "Kurze Zusammenfassung.");
      }
    }
    const out = ex.reassemble(segs, map);
    expect(out).toMatch(/^---\n/);
    expect(out).toContain("title: Schnellstart");
    expect(out).toContain("Kurze Zusammenfassung.");
    expect(out).toContain("order: 2");
    expect(out).toContain("Paragraph.");
  });

  it("extracts fenced code and admonition segments", () => {
    const md = "```ts\nconst x = 1;\n```\n\n:::note\nN\n:::\n\nPara.";
    const segs = ex.extract(md, "doc.md");
    expect(segs.some((s) => s.type === "code")).toBe(true);
    expect(segs.some((s) => s.type === "admonition")).toBe(true);
    expect(segs.some((s) => s.type === "paragraph")).toBe(true);
  });

  it("captures a nested admonition as one segment and reassembles it exactly", () => {
    const block = [
      ":::::info[Parent]",
      "",
      "Parent content.",
      "",
      "::::danger[Child]",
      "",
      "Child content.",
      "",
      ":::tip[Deep Child]",
      "",
      "Deep child content.",
      "",
      ":::",
      "",
      "::::",
      "",
      ":::::",
    ].join("\n");
    const md = `${block}\n\nTrailing paragraph.`;
    const segs = ex.extract(md, "doc.md");
    const adm = segs.filter((s) => s.type === "admonition");
    expect(adm).toHaveLength(1);
    expect(adm[0]!.content).toBe(block);
    expect(segs.some((s) => s.type === "paragraph" && s.content === "Trailing paragraph.")).toBe(
      true
    );
    const map = new Map<string, string>();
    for (const s of segs) {
      if (s.translatable) {
        map.set(s.hash, s.content);
      }
    }
    const out = ex.reassemble(segs, map);
    expect(out).toContain(":::::info[Parent]");
    expect(out).toContain("::::danger[Child]");
  });

  it("treats top-level MDX `import` and `export` blocks as non-translatable code", () => {
    const md = `import Foo from '@site/src/components/Foo';

export const Highlight = ({children, color}) => (
  <span style={{backgroundColor: color}}>
    {children}
  </span>
);

Body paragraph.`;
    const segs = ex.extract(md, "x.mdx");
    const importSeg = segs.find((s) => s.content.startsWith("import "));
    expect(importSeg?.type).toBe("other");
    expect(importSeg?.translatable).toBe(false);
    const exportSeg = segs.find((s) => s.content.startsWith("export "));
    expect(exportSeg?.type).toBe("other");
    expect(exportSeg?.translatable).toBe(false);
    const para = segs.find((s) => s.type === "paragraph");
    expect(para?.content).toBe("Body paragraph.");
  });

  it("treats multi-line MDX blocks that start with a capital JSX tag as translatable paragraphs", () => {
    const md = `<Tabs>
<TabItem value="a" label="First tab label">
Tab panel prose with {frontMatter.title} reference.
</TabItem>
</Tabs>`;
    const seg = ex.extract(md, "fixture.mdx").find((s) => s.content.includes("<Tabs>"));
    expect(seg?.type).toBe("paragraph");
    expect(seg?.translatable).toBe(true);
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
        label: "english",
      },
    });
    const langSeg = segs.find((s) => s.type === "other" && s.content.includes("**LANGS_START**"));
    expect(langSeg).toBeDefined();
    expect(langSeg!.translatable).toBe(false);
    const para = segs.find((s) => s.type === "paragraph" && s.content.includes("Paragraph after"));
    expect(para?.translatable).toBe(true);
  });

  it("joins language-list block to the preceding line with a single newline when adjacent", () => {
    const md = `<small>**Read in other languages:** </small>
<small id="lang-list">[en](a.md)</small>

Next para.`;
    const segs = ex.extract(md, "x.md", {
      languageListBlock: {
        start: '<small id="lang-list">',
        end: "</small>",
        separator: " · ",
        label: "english",
      },
    });
    const langSeg = segs.find((s) => s.content.includes("lang-list"));
    expect(langSeg?.tightJoinPrevious).toBe(true);
    const map = new Map<string, string>();
    for (const s of segs) {
      if (s.translatable) {
        map.set(s.hash, s.content);
      }
    }
    const out = ex.reassemble(segs, map);
    expect(out).toMatch(/<\/small>\n<small id="lang-list">/);
    expect(out).not.toMatch(/<\/small>\n\n<small id="lang-list">/);
  });

  it("does not set tightJoinPrevious when the language-list line is the first body line", () => {
    const md = `<small id="lang-list">[en](a.md)</small>`;
    const segs = ex.extract(md, "x.md", {
      languageListBlock: {
        start: '<small id="lang-list">',
        end: "</small>",
        separator: " · ",
        label: "english",
      },
    });
    expect(segs).toHaveLength(1);
    expect(segs[0]!.tightJoinPrevious).toBeFalsy();
    const out = ex.reassemble(segs, new Map());
    expect(out.trim()).toContain("lang-list");
  });
});
