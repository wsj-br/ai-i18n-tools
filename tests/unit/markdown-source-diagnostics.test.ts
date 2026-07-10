import { describe, expect, it } from "vitest";
import {
  collectMalformedAdmonitionIssues,
  collectMalformedAdmonitionRows,
  collectMarkdownIssuesForSegment,
  collectMarkdownSourceIssues,
  MARKDOWN_SOURCE_ISSUE_CODES,
  shouldDiagnoseMarkdownSegment,
} from "../../src/processors/markdown-source-diagnostics.js";
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

describe("collectMarkdownSourceIssues", () => {
  it("flags unpaired ** pattern like Translate**", () => {
    const md = `- Translate** - convert text.\n- **Rewrite** - rephrase.`;
    const issues = collectMarkdownSourceIssues(md, { segmentStartLine: 10 });
    const unpaired = issues.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.UNPAIRED_EMPHASIS);
    expect(unpaired.length).toBeGreaterThan(0);
    expect(unpaired.some((i) => i.line1 >= 10)).toBe(true);
  });

  it("passes balanced strong", () => {
    const issues = collectMarkdownSourceIssues("Use **bold** here.", { segmentStartLine: 1 });
    expect(issues.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.UNPAIRED_EMPHASIS)).toEqual(
      []
    );
  });

  it("detects unclosed inline code", () => {
    const issues = collectMarkdownSourceIssues("broken `span", { segmentStartLine: 5 });
    const u = issues.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.UNCLOSED_INLINE_CODE);
    expect(u.length).toBeGreaterThan(0);
    expect(u[0]?.line1).toBe(5);
  });

  it("does not flag **Bare** `code` **more** as a structural issue", () => {
    const issues = collectMarkdownSourceIssues(
      "**Bare** `ai-i18n-tools` **in the terminal** — more text.",
      { segmentStartLine: 83 }
    );
    expect(issues).toEqual([]);
  });

  it("flags ** around a markdown link, not bold only inside link text", () => {
    const bad = collectMarkdownSourceIssues("See **[home](https://example.com)**.", {
      segmentStartLine: 1,
    });
    expect(bad.some((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_LINK)).toBe(true);

    const ok = collectMarkdownSourceIssues("See [**home**](https://example.com).", {
      segmentStartLine: 1,
    });
    expect(ok.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_LINK)).toEqual(
      []
    );
  });

  it("parses link destination with nested parentheses", () => {
    const issues = collectMarkdownSourceIssues("**[a](https://example.com/path(1)ok)** tail", {
      segmentStartLine: 1,
    });
    expect(issues.some((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_LINK)).toBe(
      true
    );
  });

  it("does not treat * inside MDX `{/* … */}` comments as markdown emphasis", () => {
    const md = `{/*
  Fixture * asterisk
*/}`;
    const issues = collectMarkdownSourceIssues(md);
    expect(issues.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.UNPAIRED_EMPHASIS)).toEqual(
      []
    );
  });

  it("does not treat `/*` `*/` on a heading line as emphasis when used for MDX heading ids", () => {
    const md = "### MDX heading {/* #my-explicit-id */}";
    const issues = collectMarkdownSourceIssues(md);
    expect(issues.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.UNPAIRED_EMPHASIS)).toEqual(
      []
    );
  });

  it("does not treat * inside HTML comments as emphasis", () => {
    const md = "See <!-- * not emphasis --> after.";
    const issues = collectMarkdownSourceIssues(md);
    expect(issues.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.UNPAIRED_EMPHASIS)).toEqual(
      []
    );
  });

  it("does not treat _ inside HTML id anchors as emphasis", () => {
    const md = '<a id="sidebar-labels-_metats"></a>\n## Sidebar labels (`_meta.ts`)';
    const issues = collectMarkdownSourceIssues(md, { segmentStartLine: 76 });
    expect(issues.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.UNPAIRED_EMPHASIS)).toEqual(
      []
    );
  });

  it("still flags unpaired _ in prose after HTML id anchors are neutralized", () => {
    const md = '<a id="ok"></a> broken _emphasis';
    const issues = collectMarkdownSourceIssues(md);
    expect(
      issues.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.UNPAIRED_EMPHASIS).length
    ).toBe(1);
  });

  it("skips closed {{placeholder}} spans before scanning for strong-outside-link", () => {
    const issues = collectMarkdownSourceIssues("{{TOKEN}} **[link](https://x.test)**", {
      segmentStartLine: 1,
    });
    expect(issues.some((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_LINK)).toBe(
      true
    );
  });

  it("does not treat escaped link openers as links", () => {
    const issues = collectMarkdownSourceIssues(String.raw`\**[not a link](https://x.test)**`, {
      segmentStartLine: 1,
    });
    expect(
      issues.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_LINK)
    ).toEqual([]);
  });
});

describe("shouldDiagnoseMarkdownSegment", () => {
  it("returns true for paragraph", () => {
    expect(shouldDiagnoseMarkdownSegment(S({ type: "paragraph", content: "x", hash: "h" }))).toBe(
      true
    );
  });

  it("returns false for code", () => {
    expect(
      shouldDiagnoseMarkdownSegment(
        S({ type: "code", content: "```\nx\n```", hash: "c", translatable: false })
      )
    ).toBe(false);
  });

  it("returns true for heading and admonition segments", () => {
    expect(shouldDiagnoseMarkdownSegment(S({ type: "heading", content: "# T", hash: "h" }))).toBe(
      true
    );
    expect(
      shouldDiagnoseMarkdownSegment(
        S({ type: "admonition", content: ":::note\nx\n:::", hash: "a" })
      )
    ).toBe(true);
  });

  it("returns false when translatable is false", () => {
    expect(
      shouldDiagnoseMarkdownSegment(
        S({ type: "paragraph", content: "x", hash: "p", translatable: false })
      )
    ).toBe(false);
  });
});

describe("collectMarkdownIssuesForSegment", () => {
  it("maps issues to cache rows for translatable markdown segments", () => {
    const seg = S({
      type: "paragraph",
      content: "broken `code",
      hash: "hash-1",
      startLine: 20,
    });
    const rows = collectMarkdownIssuesForSegment(seg, "doc-block:0:guide.md");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toMatchObject({
      filepath: "doc-block:0:guide.md",
      sourceHash: "hash-1",
      issueCode: MARKDOWN_SOURCE_ISSUE_CODES.UNCLOSED_INLINE_CODE,
      startLine: 20,
    });
    expect(rows[0]?.detail).toMatch(/Unclosed inline code/);
  });

  it("returns no rows for non-markdown segment types", () => {
    const seg = S({
      type: "code",
      content: "broken `code",
      hash: "hash-2",
      translatable: false,
    });
    expect(collectMarkdownIssuesForSegment(seg, "x.md")).toEqual([]);
  });
});

describe("collectMalformedAdmonitionIssues", () => {
  it("flags an unclosed admonition opener at the opener line", () => {
    const md = "Intro.\n\n:::note\nBody without a closing fence.";
    const issues = collectMalformedAdmonitionIssues(md);
    expect(issues).toEqual([
      expect.objectContaining({
        code: MARKDOWN_SOURCE_ISSUE_CODES.ADMONITION_UNCLOSED,
        line1: 3,
      }),
    ]);
  });

  it("flags a stray closing fence with no matching opener", () => {
    const md = "Some text.\n\n:::";
    const issues = collectMalformedAdmonitionIssues(md);
    expect(issues).toEqual([
      expect.objectContaining({
        code: MARKDOWN_SOURCE_ISSUE_CODES.ADMONITION_UNEXPECTED_CLOSE,
        line1: 3,
      }),
    ]);
  });

  it("flags an unterminated bracketed title", () => {
    const md = ":::note[Title without closing bracket\n\nBody\n\n:::";
    const issues = collectMalformedAdmonitionIssues(md);
    expect(
      issues.some((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.ADMONITION_UNTERMINATED_TITLE)
    ).toBe(true);
    // The opener still counts toward balance, so it should NOT also report UNCLOSED.
    expect(issues.some((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.ADMONITION_UNCLOSED)).toBe(
      false
    );
  });

  it("passes a well-formed nested admonition block", () => {
    const md = [
      ":::::info[Parent]",
      "",
      "Parent body.",
      "",
      "::::danger[Child]",
      "",
      "Child body.",
      "",
      ":::tip[Deep Child]",
      "",
      "Deep body.",
      "",
      ":::",
      "",
      "::::",
      "",
      ":::::",
    ].join("\n");
    expect(collectMalformedAdmonitionIssues(md)).toEqual([]);
  });

  it("does not flag :::-like lines inside a fenced code block", () => {
    const md = "```md\n:::note\nNot a real admonition\n:::\n```\n\nReal prose.";
    expect(collectMalformedAdmonitionIssues(md)).toEqual([]);
  });

  it("ignores admonition-like content inside YAML frontmatter", () => {
    const md = "---\ntitle: x\n---\n\nBody.";
    expect(collectMalformedAdmonitionIssues(md)).toEqual([]);
  });
});

describe("collectMalformedAdmonitionRows", () => {
  it("maps file-level issues to cache rows with a deterministic synthetic hash", () => {
    const md = ":::note\nNo close.";
    const rows = collectMalformedAdmonitionRows(md, "doc-block:0:guide.md");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      filepath: "doc-block:0:guide.md",
      issueCode: MARKDOWN_SOURCE_ISSUE_CODES.ADMONITION_UNCLOSED,
      startLine: 1,
    });
    expect(rows[0]?.sourceHash).toMatch(/^admonition:/);
    // Stable across runs.
    expect(collectMalformedAdmonitionRows(md, "doc-block:0:guide.md")[0]?.sourceHash).toBe(
      rows[0]?.sourceHash
    );
  });
});
