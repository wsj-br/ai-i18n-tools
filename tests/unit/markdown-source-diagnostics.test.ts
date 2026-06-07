import { describe, expect, it } from "vitest";
import {
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
