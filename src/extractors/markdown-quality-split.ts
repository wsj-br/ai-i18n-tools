import type { SegmentType } from "../core/types.js";
import { segmentSplittingSchema, type SegmentSplittingConfig } from "../core/types.js";
import {
  isCodeFenceClose,
  matchCodeFenceOpen,
  type OpenCodeFence,
} from "../processors/code-fence.js";
import {
  isMarkdownListBlock,
  splitIntoTopLevelListItems,
  splitMarkdownSegmentPiece,
} from "./markdown-segment-split.js";

const MIN_SPLITTABLE_CHARS = 80;

const SPLITTABLE_SEGMENT_TYPES = new Set<SegmentType>(["paragraph", "heading", "admonition"]);

function countNonEmptyLines(content: string): number {
  return content.split("\n").filter((l) => l.trim().length > 0).length;
}

function canSplitFurther(content: string, depth: number, maxDepth: number): boolean {
  if (depth >= maxDepth) {
    return false;
  }
  const trimmed = content.trim();
  if (!trimmed) {
    return false;
  }
  const nonEmptyLines = countNonEmptyLines(trimmed);
  if (nonEmptyLines <= 1 && trimmed.length <= MIN_SPLITTABLE_CHARS) {
    return false;
  }
  return true;
}

function buildSplitOptsForDepth(content: string, depth: number): SegmentSplittingConfig {
  const lines = content.split("\n");
  const nonEmptyLineCount = countNonEmptyLines(content);
  const listItems = splitIntoTopLevelListItems(lines);
  const isList = isMarkdownListBlock(lines);

  if (depth === 0) {
    if (isList && listItems.length > 1) {
      return segmentSplittingSchema.parse({
        enabled: true,
        splitLongLists: true,
        maxListItemsPerChunk: Math.max(1, Math.ceil(listItems.length / 2)),
        splitDenseParagraphs: true,
        maxCharsPerSegment: Math.max(200, Math.ceil(content.length / 2)),
        splitPipeTables: true,
      });
    }
    return segmentSplittingSchema.parse({
      enabled: true,
      splitDenseParagraphs: true,
      maxCharsPerSegment: Math.max(200, Math.ceil(content.length / 2)),
      splitLongLists: false,
      splitPipeTables: true,
    });
  }

  if (depth === 1) {
    if (isList) {
      return segmentSplittingSchema.parse({
        enabled: true,
        splitLongLists: true,
        maxListItemsPerChunk: 1,
        splitDenseParagraphs: true,
        maxCharsPerSegment: Math.max(200, Math.ceil(content.length / 4)),
        maxLinesPerParagraphChunk: Math.max(1, Math.ceil(nonEmptyLineCount / 2)),
        splitPipeTables: true,
      });
    }
    return segmentSplittingSchema.parse({
      enabled: true,
      splitDenseParagraphs: true,
      maxCharsPerSegment: Math.max(200, Math.ceil(content.length / 4)),
      maxLinesPerParagraphChunk: Math.max(1, Math.ceil(nonEmptyLineCount / 2)),
      splitLongLists: false,
      splitPipeTables: true,
    });
  }

  return segmentSplittingSchema.parse({
    enabled: true,
    splitDenseParagraphs: true,
    maxCharsPerSegment: Math.max(100, Math.ceil(content.length / 2)),
    maxLinesPerParagraphChunk: 1,
    splitLongLists: true,
    maxListItemsPerChunk: 1,
    splitPipeTables: true,
  });
}

/**
 * Move a line split that lands inside a fenced code block to a fence boundary.
 * The sample stays in one part so a quality retry cannot tear it open.
 */
function snapLineSplitOutOfCodeFence(lines: readonly string[], splitAt: number): number {
  let open: OpenCodeFence | null = null;
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (open) {
      if (isCodeFenceClose(line, open)) {
        if (splitAt > start && splitAt <= i) {
          const after = i + 1;
          if (after < lines.length && lines.slice(after).some((l) => l.trim())) {
            return after;
          }
          if (start > 0) {
            return start;
          }
        }
        open = null;
      }
      continue;
    }
    const fence = matchCodeFenceOpen(line);
    if (fence) {
      open = fence;
      start = i;
    }
  }
  if (open && splitAt > start && start > 0) {
    return start;
  }
  return splitAt;
}

function splitAtLineMidpoint(content: string): string[] | null {
  const lines = content.split("\n");
  const nonEmptyIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if ((lines[i] ?? "").trim()) {
      nonEmptyIndices.push(i);
    }
  }
  if (nonEmptyIndices.length <= 1) {
    return null;
  }
  const midIdx = Math.floor(nonEmptyIndices.length / 2);
  const splitAt = snapLineSplitOutOfCodeFence(lines, nonEmptyIndices[midIdx]!);
  const first = lines.slice(0, splitAt).join("\n").trimEnd();
  const second = lines.slice(splitAt).join("\n").trimStart();
  if (!first || !second) {
    return null;
  }
  return [first, second];
}

/** Move a character split that lands inside a closed fence to the nearer fence boundary. */
function snapCharSplitOutOfCodeFence(content: string, splitAt: number): number {
  const lines = content.split("\n");
  let offset = 0;
  let open: OpenCodeFence | null = null;
  let fenceStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineEnd = offset + line.length;
    if (open) {
      if (isCodeFenceClose(line, open)) {
        if (splitAt > fenceStart && splitAt < lineEnd) {
          const after = i + 1 < lines.length ? lineEnd + 1 : lineEnd;
          const candidates = [fenceStart, after].filter((c) => c > 0 && c < content.length);
          candidates.sort((a, b) => Math.abs(a - splitAt) - Math.abs(b - splitAt));
          return candidates[0] ?? splitAt;
        }
        open = null;
      }
    } else {
      const fence = matchCodeFenceOpen(line);
      if (fence) {
        open = fence;
        fenceStart = offset;
      }
    }
    offset = lineEnd + 1;
  }
  return splitAt;
}

function splitAtCharMidpoint(content: string): string[] | null {
  if (content.length <= MIN_SPLITTABLE_CHARS * 2) {
    return null;
  }
  const mid = Math.floor(content.length / 2);
  let splitAt = mid;
  const windowStart = Math.max(1, mid - 40);
  const windowEnd = Math.min(content.length - 1, mid + 40);
  for (let i = mid; i >= windowStart; i--) {
    const ch = content[i];
    if (ch === " " || ch === "\n" || ch === "—" || ch === "-") {
      splitAt = i + 1;
      break;
    }
  }
  if (splitAt === mid) {
    for (let i = mid; i < windowEnd; i++) {
      const ch = content[i];
      if (ch === " " || ch === "\n" || ch === "—" || ch === "-") {
        splitAt = i + 1;
        break;
      }
    }
  }
  splitAt = snapCharSplitOutOfCodeFence(content, splitAt);
  const first = content.slice(0, splitAt).trimEnd();
  const second = content.slice(splitAt).trimStart();
  if (!first || !second) {
    return null;
  }
  if (first.length < 20 || second.length < 20) {
    return null;
  }
  return [first, second];
}

/**
 * Split markdown segment content for progressive quality-retry fallback.
 * Returns two or more non-empty parts, or `null` when splitting is not possible.
 */
export function splitSegmentForQualityRetry(
  content: string,
  segmentType: SegmentType,
  depth: number,
  maxDepth: number
): string[] | null {
  if (!SPLITTABLE_SEGMENT_TYPES.has(segmentType)) {
    return null;
  }
  if (!canSplitFurther(content, depth, maxDepth)) {
    return null;
  }

  const opts = buildSplitOptsForDepth(content, depth);
  const parts = splitMarkdownSegmentPiece({ type: segmentType, content, translatable: true }, opts);

  if (parts.length > 1) {
    return parts.map((p) => p.content);
  }

  const lineSplit = splitAtLineMidpoint(content);
  if (lineSplit) {
    return lineSplit;
  }

  return splitAtCharMidpoint(content);
}
