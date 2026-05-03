import { describe, expect, it } from "vitest";
import {
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

  it("does not flag **Bare** `code` **more** (closer/opener around code, not a wrap)", () => {
    const issues = collectMarkdownSourceIssues(
      "**Bare** `ai-i18n-tools` **in the terminal** — more text.",
      { segmentStartLine: 83 }
    );
    expect(
      issues.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_INLINE_CODE)
    ).toEqual([]);
  });

  it("flags ** outside inline code, not ** inside a code span", () => {
    const bad = collectMarkdownSourceIssues("Use **`rm`** sparingly.", { segmentStartLine: 1 });
    expect(bad.some((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_INLINE_CODE)).toBe(
      true
    );

    const ok = collectMarkdownSourceIssues("Use `**rm**` sparingly.", { segmentStartLine: 1 });
    expect(
      ok.filter((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_INLINE_CODE)
    ).toEqual([]);
  });

  it("flags __ wrapping inline code", () => {
    const issues = collectMarkdownSourceIssues("__`x`__", { segmentStartLine: 2 });
    expect(
      issues.some((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_INLINE_CODE)
    ).toBe(true);
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

  it("maps STRONG_OUTSIDE_INLINE_CODE line with segment startLine", () => {
    const issues = collectMarkdownSourceIssues("\n\n**`rm`** tail", { segmentStartLine: 10 });
    const strong = issues.filter(
      (i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_INLINE_CODE
    );
    expect(strong).toHaveLength(1);
    expect(strong[0]?.line1).toBe(12);
  });

  it("parses link destination with nested parentheses", () => {
    const issues = collectMarkdownSourceIssues("**[a](https://example.com/path(1)ok)** tail", {
      segmentStartLine: 1,
    });
    expect(issues.some((i) => i.code === MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_LINK)).toBe(
      true
    );
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
});
