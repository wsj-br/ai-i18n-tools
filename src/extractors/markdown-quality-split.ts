import type { SegmentType } from "../core/types.js";
import { segmentSplittingSchema, type SegmentSplittingConfig } from "../core/types.js";
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
  const splitAt = nonEmptyIndices[midIdx]!;
  const first = lines.slice(0, splitAt).join("\n").trimEnd();
  const second = lines.slice(splitAt).join("\n").trimStart();
  if (!first || !second) {
    return null;
  }
  return [first, second];
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
