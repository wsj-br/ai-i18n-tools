/**
 * Display-width-aware console table rendering.
 *
 * Translated strings (CJK, romanized scripts, emoji) occupy a different number of terminal columns
 * than their character count, which breaks `String.padEnd`-based alignment. These helpers measure
 * real terminal columns via `get-east-asian-width` (mirrors `scripts/list-selected-languages.mjs`)
 * so localized headers and cell values stay vertically aligned in the console and `--write-logs` tees.
 */
import { eastAsianWidth } from "get-east-asian-width";

/** Heuristic: emoji code points that terminals render as 2 columns. */
function isEmojiWide(cp: number): boolean {
  return (
    (cp >= 0x1f300 && cp <= 0x1faff) || // Misc Symbols, Emoticons, Transport, Supplemental
    (cp >= 0x2600 && cp <= 0x26ff) || // Misc Symbols (☀ ☁ ⛵ …)
    (cp >= 0x2700 && cp <= 0x27bf) || // Dingbats
    (cp >= 0xfe00 && cp <= 0xfe0f) || // Variation selectors
    (cp >= 0x1f1e0 && cp <= 0x1f1ff) // Regional indicator letters (flag sequences)
  );
}

/** Number of terminal columns a single code point occupies. */
function cpWidth(cp: number): number {
  if (cp === 0x200d) return 0; // Zero-width joiner (ZWJ) — contributes nothing
  if (cp >= 0xfe00 && cp <= 0xfe0f) return 0; // Variation selectors — no extra width
  if (isEmojiWide(cp)) return 2;
  return eastAsianWidth(cp);
}

/** Number of terminal columns a string occupies (multi-column CJK / emoji aware). */
export function displayWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    width += cpWidth(char.codePointAt(0) ?? 0);
  }
  return width;
}

/** Like `String.padEnd`, but pads to a target number of display columns. */
export function padEndDisplay(str: string, targetWidth: number): string {
  const current = displayWidth(str);
  const needed = Math.max(0, targetWidth - current);
  return str + " ".repeat(needed);
}

/** Like `String.padStart`, but pads to a target number of display columns. */
export function padStartDisplay(str: string, targetWidth: number): string {
  const current = displayWidth(str);
  const needed = Math.max(0, targetWidth - current);
  return " ".repeat(needed) + str;
}

export interface RenderTableOptions {
  /** Column header cells. */
  headers: string[];
  /** Row cells; each row should have the same length as `headers`. */
  rows: string[][];
  /** Leading indent applied to every line (default two spaces). */
  indent?: string;
  /** Gap between columns (default two spaces). */
  gap?: string;
  /** Per-column alignment; defaults to left for every column. */
  align?: Array<"left" | "right">;
  /** When true (default), include a header separator rule line. */
  rule?: boolean;
}

/**
 * Render a simple fixed-width table as an array of lines, with display-width-aware column padding.
 * Column widths are computed from the widest header/cell in each column. The last left-aligned
 * column is not padded (avoids trailing whitespace).
 */
export function renderTable(options: RenderTableOptions): string[] {
  const { headers, rows } = options;
  const indent = options.indent ?? "  ";
  const gap = options.gap ?? "  ";
  const showRule = options.rule ?? true;
  const columnCount = headers.length;

  const widths: number[] = headers.map((h, col) => {
    let w = displayWidth(h);
    for (const row of rows) {
      const cell = row[col] ?? "";
      w = Math.max(w, displayWidth(cell));
    }
    return w;
  });

  const alignOf = (col: number): "left" | "right" => options.align?.[col] ?? "left";

  const formatRow = (cells: string[]): string => {
    const parts: string[] = [];
    for (let col = 0; col < columnCount; col++) {
      const cell = cells[col] ?? "";
      const isLast = col === columnCount - 1;
      if (alignOf(col) === "right") {
        parts.push(padStartDisplay(cell, widths[col]!));
      } else if (isLast) {
        // Avoid trailing padding on the final left-aligned column.
        parts.push(cell);
      } else {
        parts.push(padEndDisplay(cell, widths[col]!));
      }
    }
    return indent + parts.join(gap);
  };

  const lines: string[] = [formatRow(headers)];
  if (showRule) {
    lines.push(indent + widths.map((w) => "-".repeat(w)).join(gap));
  }
  for (const row of rows) {
    lines.push(formatRow(row));
  }
  return lines;
}
