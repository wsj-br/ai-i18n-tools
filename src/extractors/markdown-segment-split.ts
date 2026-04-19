import type { Segment, SegmentSplittingConfig } from "../core/types.js";

/** Lines that form a GFM-style pipe table (header + separator + optional data rows). */
function isPipeTableLines(lines: string[]): boolean {
  if (lines.length < 2) {
    return false;
  }
  const row0 = lines[0]?.trim() ?? "";
  const row1 = lines[1]?.trim() ?? "";
  if (!row0.includes("|") || !row1.includes("|")) {
    return false;
  }
  return isLikelyPipeTableSeparatorRow(row1);
}

/** Separator row: only pipes, dashes, colons, spaces. */
function isLikelyPipeTableSeparatorRow(line: string): boolean {
  const t = line.trim();
  if (!t.includes("|")) {
    return false;
  }
  return /^[\s|:-]+$/.test(t);
}

function splitPipeTableSegment(
  seg: Omit<Segment, "id" | "hash">,
  lines: string[]
): Array<Omit<Segment, "id" | "hash">> {
  if (lines.length <= 3) {
    return [{ ...seg }];
  }
  const header = lines[0] ?? "";
  const sep = lines[1] ?? "";
  const firstData = lines[2] ?? "";
  const out: Array<Omit<Segment, "id" | "hash">> = [];
  out.push({
    ...seg,
    content: [header, sep, firstData].join("\n"),
    startLine: seg.startLine,
  });
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i] ?? "";
    out.push({
      ...seg,
      content: line,
      tightJoinPrevious: true,
      startLine: seg.startLine !== undefined ? seg.startLine + i : undefined,
    });
  }
  return out;
}

/** Top-level markdown list items (CommonMark-ish): bullet or ordered at indent ≤3. */
function splitIntoTopLevelListItems(lines: string[]): string[][] {
  const items: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    const isTop = line.trim().length > 0 && /^\s{0,3}(?:[-*+]|\d+\.)\s/.test(line);
    if (isTop && current.length > 0) {
      items.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    items.push(current);
  }
  return items;
}

function isMarkdownListBlock(lines: string[]): boolean {
  const nonEmpty = lines.filter((l) => l.trim());
  if (nonEmpty.length < 2) {
    return false;
  }
  let listLines = 0;
  for (const l of nonEmpty) {
    if (/^\s{0,3}(?:[-*+]|\d+\.)\s/.test(l)) {
      listLines++;
    }
  }
  return listLines >= 2 && listLines >= Math.ceil(nonEmpty.length * 0.5);
}

function splitListSegment(
  seg: Omit<Segment, "id" | "hash">,
  lines: string[],
  opts: SegmentSplittingConfig
): Array<Omit<Segment, "id" | "hash">> {
  const maxItems = opts.maxListItemsPerChunk ?? 12;
  const items = splitIntoTopLevelListItems(lines);
  if (items.length <= maxItems) {
    return [{ ...seg }];
  }
  const out: Array<Omit<Segment, "id" | "hash">> = [];
  for (let i = 0; i < items.length; i += maxItems) {
    const chunk = items.slice(i, i + maxItems);
    const content = chunk.map((g) => g.join("\n")).join("\n");
    const isFirst = out.length === 0;
    out.push({
      ...seg,
      content,
      ...(isFirst ? {} : { tightJoinPrevious: true }),
      startLine: seg.startLine,
    });
  }
  return out;
}

function splitDenseParagraph(
  seg: Omit<Segment, "id" | "hash">,
  lines: string[],
  opts: SegmentSplittingConfig
): Array<Omit<Segment, "id" | "hash">> {
  const maxChars = opts.maxCharsPerSegment ?? 4000;
  const maxLines = opts.maxLinesPerParagraphChunk;
  if (seg.content.length <= maxChars && (!maxLines || lines.length <= maxLines)) {
    return [{ ...seg }];
  }
  const chunks: string[] = [];
  let buf: string[] = [];
  let bufChars = 0;

  const flushBuf = () => {
    if (buf.length > 0) {
      chunks.push(buf.join("\n"));
      buf = [];
      bufChars = 0;
    }
  };

  for (const line of lines) {
    const lineLen = line.length + (buf.length > 0 ? 1 : 0);
    const wouldExceedChars = buf.length > 0 && bufChars + line.length + 1 > maxChars;
    const wouldExceedLines = maxLines !== undefined && buf.length > 0 && buf.length >= maxLines;
    if (wouldExceedChars || wouldExceedLines) {
      flushBuf();
      buf = [line];
      bufChars = line.length;
    } else {
      buf.push(line);
      bufChars += lineLen;
    }
  }
  flushBuf();

  if (chunks.length <= 1) {
    return [{ ...seg }];
  }

  return chunks.map((c, i) => ({
    ...seg,
    content: c,
    ...(i > 0 ? { tightJoinPrevious: true } : {}),
    startLine: seg.startLine,
  }));
}

/**
 * Split one coarse body segment into smaller translatable chunks when enabled.
 * Sub-segments after the first set {@link Segment.tightJoinPrevious} so reassembly uses single `\n` between them.
 */
export function splitMarkdownSegmentPiece(
  seg: Omit<Segment, "id" | "hash">,
  opts: SegmentSplittingConfig
): Array<Omit<Segment, "id" | "hash">> {
  if (!opts.enabled || !seg.translatable) {
    return [seg];
  }

  const lines = seg.content.split("\n");

  if (opts.splitPipeTables !== false && isPipeTableLines(lines)) {
    return splitPipeTableSegment(seg, lines);
  }

  if (opts.splitLongLists !== false && isMarkdownListBlock(lines)) {
    const listPieces = splitListSegment(seg, lines, opts);
    if (listPieces.length > 1) {
      return listPieces;
    }
  }

  if (opts.splitDenseParagraphs !== false && (seg.type === "paragraph" || seg.type === "heading")) {
    return splitDenseParagraph(seg, lines, opts);
  }

  return [seg];
}

/** Apply segment splitting to each coarse segment from {@link MarkdownExtractor.splitBody}. */
export function expandSegmentsWithSplitting(
  segments: Omit<Segment, "id" | "hash">[],
  opts: SegmentSplittingConfig
): Omit<Segment, "id" | "hash">[] {
  if (!opts.enabled) {
    return segments;
  }
  const out: Omit<Segment, "id" | "hash">[] = [];
  for (const seg of segments) {
    out.push(...splitMarkdownSegmentPiece(seg, opts));
  }
  return out;
}
