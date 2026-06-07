import type { MarkdownSourceIssueInsert, Segment } from "../core/types.js";
import {
  collectMarkdownDelimiterRuns,
  findCodeSpanEnd,
  findUnclosedInlineCodeLine1Starts,
  pairMarkdownEmphasisDelimitersFromRuns,
} from "./emphasis-placeholders.js";

export const MARKDOWN_SOURCE_ISSUE_CODES = {
  UNPAIRED_EMPHASIS: "UNPAIRED_EMPHASIS",
  UNCLOSED_INLINE_CODE: "UNCLOSED_INLINE_CODE",
  /** `**` / `__` wrapping a `[text](url)` link (put emphasis inside the link text only). */
  STRONG_OUTSIDE_LINK: "STRONG_OUTSIDE_LINK",
} as const;

export type MarkdownSourceIssueCode =
  (typeof MARKDOWN_SOURCE_ISSUE_CODES)[keyof typeof MARKDOWN_SOURCE_ISSUE_CODES];

export interface MarkdownSourceIssue {
  code: MarkdownSourceIssueCode;
  message: string;
  /** 1-based line in the source file (uses segment `startLine` when provided). */
  line1: number;
}

function line1FromOffset(text: string, offset: number): number {
  return 1 + (text.slice(0, offset).match(/\n/g)?.length ?? 0);
}

function readRun(text: string, start: number, marker: string): number {
  let i = start;
  while (i < text.length && text[i] === marker) {
    i++;
  }
  return i - start;
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  for (let i = index - 1; i >= 0 && text[i] === "\\"; i--) {
    slashCount++;
  }
  return slashCount % 2 === 1;
}

function findPlaceholderEnd(text: string, start: number): number {
  if (text[start] !== "{" || text[start + 1] !== "{") {
    return -1;
  }
  let i = start + 2;
  while (i < text.length - 1) {
    if (text[i] === "}" && text[i + 1] === "}") {
      return i + 2;
    }
    i++;
  }
  return -1;
}

/** Strong run touching the given index from the right (only whitespace between). */
function strongEmphasisRunTouchingAfter(
  text: string,
  index: number
): { start: number; endExclusive: number; marker: "*" | "_" } | null {
  let j = index;
  while (j < text.length && /\s/u.test(text[j]!)) {
    j++;
  }
  if (j >= text.length) {
    return null;
  }
  const marker = text[j]!;
  if (marker !== "*" && marker !== "_") {
    return null;
  }
  const start = j;
  while (j < text.length && text[j] === marker) {
    j++;
  }
  const len = j - start;
  if (len < 2) {
    return null;
  }
  return { start, endExclusive: j, marker: marker as "*" | "_" };
}

/**
 * Exclusive end index past `)` for an inline `[...](...)` link starting at `bracketStart`, or null.
 */
function findInlineLinkEndExclusive(text: string, bracketStart: number): number | null {
  if (text[bracketStart] !== "[") {
    return null;
  }
  let i = bracketStart + 1;
  while (i < text.length - 1) {
    if (text[i] === "\\") {
      i += 2;
      continue;
    }
    if (text[i] === "]" && text[i + 1] === "(") {
      const closeParen = findClosingParenOfInlineLinkDestination(text, i + 1);
      if (closeParen === -1) {
        return null;
      }
      return closeParen + 1;
    }
    i++;
  }
  return null;
}

/** `openParenIdx` is the index of `(` in `](`. */
function findClosingParenOfInlineLinkDestination(text: string, openParenIdx: number): number {
  if (text[openParenIdx] !== "(") {
    return -1;
  }
  let j = openParenIdx + 1;
  let depth = 1;
  let inString: '"' | "'" | null = null;
  while (j < text.length) {
    const c = text[j]!;
    if (inString) {
      if (c === "\\") {
        j += 2;
        continue;
      }
      if (c === inString) {
        inString = null;
      }
      j++;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = c;
      j++;
      continue;
    }
    if (c === "(") {
      depth++;
    } else if (c === ")") {
      depth--;
      if (depth === 0) {
        return j;
      }
    }
    j++;
  }
  return -1;
}

function collectStrongOutsideLinkIssues(text: string): MarkdownSourceIssue[] {
  const issues: MarkdownSourceIssue[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === "{" && text[i + 1] === "{") {
      const end = findPlaceholderEnd(text, i);
      if (end !== -1) {
        i = end;
        continue;
      }
    }
    if (text[i] === "`") {
      const tickCount = readRun(text, i, "`");
      const spanEnd = findCodeSpanEnd(text, i, tickCount);
      i = spanEnd === -1 ? i + tickCount : spanEnd;
      continue;
    }
    if (text[i] === "[" && !isEscaped(text, i)) {
      const le = findInlineLinkEndExclusive(text, i);
      if (le !== null) {
        i = le;
        continue;
      }
    }
    const ch = text[i]!;
    if ((ch === "*" || ch === "_") && !isEscaped(text, i)) {
      const runLen = readRun(text, i, ch);
      if (runLen >= 2) {
        let k = i + runLen;
        while (k < text.length && /\s/u.test(text[k]!)) {
          k++;
        }
        if (k < text.length && text[k] === "[") {
          const le = findInlineLinkEndExclusive(text, k);
          if (le !== null) {
            const right = strongEmphasisRunTouchingAfter(text, le);
            if (
              right &&
              right.marker === ch &&
              readRun(text, right.start, ch) >= 2 &&
              right.start >= le
            ) {
              issues.push({
                code: MARKDOWN_SOURCE_ISSUE_CODES.STRONG_OUTSIDE_LINK,
                message:
                  "Do not wrap a markdown link with ** or __ outside the brackets. Use a plain [text](url) link, or put bold inside the link text only.",
                line1: line1FromOffset(text, i),
              });
              i = right.endExclusive;
              continue;
            }
          }
        }
      }
    }
    i++;
  }
  return issues;
}

function toFileLine(segmentStartLine: number | undefined, lineInSegment: number): number {
  const base = segmentStartLine ?? 1;
  return base + (lineInSegment - 1);
}

function markerSample(run: { marker: string; count: number }): string {
  const n = Math.min(run.count, 3);
  return run.marker.repeat(n);
}

/**
 * Replace MDX JSX comments and HTML comments with spaces of equal length so characters inside
 * (`*` in `/*`, `` ` `` in examples, etc.) are not scanned as markdown emphasis or inline code.
 * Offsets and line numbers stay aligned with the original `text`.
 */
function neutralizeCommentsForMarkdownDiagnostics(text: string): string {
  let s = text.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, (m) => " ".repeat(m.length));
  s = s.replace(/<!--[\s\S]*?-->/g, (m) => " ".repeat(m.length));
  return s;
}

/**
 * Detect risky markdown in one segment using the same delimiter pairing as
 * {@link protectMarkdownEmphasis} and the same inline-code scan as translation placeholders.
 */
export function collectMarkdownSourceIssues(
  text: string,
  opts?: { segmentStartLine?: number }
): MarkdownSourceIssue[] {
  const issues: MarkdownSourceIssue[] = [];
  const base = opts?.segmentStartLine;

  const scanText = neutralizeCommentsForMarkdownDiagnostics(text);

  for (const lineInSeg of findUnclosedInlineCodeLine1Starts(scanText)) {
    issues.push({
      code: MARKDOWN_SOURCE_ISSUE_CODES.UNCLOSED_INLINE_CODE,
      message:
        "Unclosed inline code span (backticks). Close with the same number of backticks as the opener.",
      line1: toFileLine(base, lineInSeg),
    });
  }

  const runs = collectMarkdownDelimiterRuns(scanText);
  const cloned = runs.map((r) => ({ ...r }));
  pairMarkdownEmphasisDelimitersFromRuns(scanText, cloned);
  for (const r of cloned) {
    const consumed = r.openerUsed + r.closerUsed;
    if (consumed < r.count) {
      const unused = r.count - consumed;
      const lineInSeg = line1FromOffset(scanText, r.start);
      issues.push({
        code: MARKDOWN_SOURCE_ISSUE_CODES.UNPAIRED_EMPHASIS,
        message: `Unpaired markdown delimiter (${markerSample(r)}…): ${unused} marker character(s) not used as emphasis/strikethrough under the same rules as document translation.`,
        line1: toFileLine(base, lineInSeg),
      });
    }
  }

  for (const issue of collectStrongOutsideLinkIssues(scanText)) {
    issues.push({
      ...issue,
      line1: toFileLine(base, issue.line1),
    });
  }

  return issues;
}

/** Same segments as mdast structure comparison in {@link shouldCompareMarkdownStructure}. */
export function shouldDiagnoseMarkdownSegment(seg: Segment): boolean {
  return (
    seg.translatable &&
    (seg.type === "paragraph" || seg.type === "heading" || seg.type === "admonition")
  );
}

export function collectMarkdownIssuesForSegment(
  seg: Segment,
  filepathForCache: string
): MarkdownSourceIssueInsert[] {
  if (!shouldDiagnoseMarkdownSegment(seg)) {
    return [];
  }
  const issues = collectMarkdownSourceIssues(seg.content, { segmentStartLine: seg.startLine });
  return issues.map((i) => ({
    filepath: filepathForCache,
    sourceHash: seg.hash,
    startLine: i.line1,
    issueCode: i.code,
    detail: i.message,
  }));
}
