const ITALIC_ASTERISK_PLACEHOLDER = "{{IT}}";
const ITALIC_UNDERSCORE_PLACEHOLDER = "{{IU}}";
const STRONG_ASTERISK_PLACEHOLDER = "{{SE}}";
const STRONG_UNDERSCORE_PLACEHOLDER = "{{SU}}";
const STRIKETHROUGH_PLACEHOLDER = "{{ST}}";

interface DelimiterRun {
  marker: "*" | "_" | "~";
  start: number;
  count: number;
  canOpen: boolean;
  canClose: boolean;
  openerUsed: number;
  closerUsed: number;
}

interface Replacement {
  start: number;
  end: number;
  placeholder: string;
}

export interface ProtectedEmphasisResult {
  protected: string;
}

function isWhiteSpace(ch: string): boolean {
  return ch === "" || /\s/u.test(ch);
}

function isPunctuation(ch: string): boolean {
  return ch !== "" && /[^\p{L}\p{N}\s]/u.test(ch);
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

function scanDelimiters(
  text: string,
  start: number,
  marker: "*" | "_" | "~"
): Pick<DelimiterRun, "count" | "canOpen" | "canClose"> {
  const count = readRun(text, start, marker);
  const prevChar = start > 0 ? text[start - 1] : "\n";
  const nextIndex = start + count;
  const nextChar = nextIndex < text.length ? text[nextIndex] : "\n";

  const prevWhite = isWhiteSpace(prevChar);
  const nextWhite = isWhiteSpace(nextChar);
  const prevPunct = isPunctuation(prevChar);
  const nextPunct = isPunctuation(nextChar);

  const leftFlanking = !nextWhite && (!nextPunct || prevWhite || prevPunct);
  const rightFlanking = !prevWhite && (!prevPunct || nextWhite || nextPunct);

  if (marker === "_") {
    return {
      count,
      canOpen: leftFlanking && (!rightFlanking || prevPunct),
      canClose: rightFlanking && (!leftFlanking || nextPunct),
    };
  }

  if (marker === "~") {
    return {
      count,
      canOpen: leftFlanking && count >= 2,
      canClose: rightFlanking && count >= 2,
    };
  }

  return {
    count,
    canOpen: leftFlanking,
    canClose: rightFlanking,
  };
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

function findCodeSpanEnd(text: string, tickStart: number, tickCount: number): number {
  let i = tickStart + tickCount;
  while (i < text.length) {
    if (text[i] !== "`") {
      i++;
      continue;
    }
    const run = readRun(text, i, "`");
    if (run === tickCount) {
      return i + tickCount;
    }
    i += run;
  }
  return -1;
}

function collectDelimiterRuns(text: string): DelimiterRun[] {
  const runs: DelimiterRun[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    if (ch === "{" && text[i + 1] === "{") {
      const end = findPlaceholderEnd(text, i);
      if (end !== -1) {
        i = end;
        continue;
      }
    }

    if (ch === "`") {
      const tickCount = readRun(text, i, "`");
      const end = findCodeSpanEnd(text, i, tickCount);
      if (end !== -1) {
        i = end;
      } else {
        i += tickCount;
      }
      continue;
    }

    if ((ch === "*" || ch === "_" || ch === "~") && !isEscaped(text, i)) {
      const marker = ch as "*" | "_" | "~";
      const scan = scanDelimiters(text, i, marker);
      if (scan.count > 0 && (scan.canOpen || scan.canClose)) {
        runs.push({
          marker,
          start: i,
          count: scan.count,
          canOpen: scan.canOpen,
          canClose: scan.canClose,
          openerUsed: 0,
          closerUsed: 0,
        });
      }
      i += scan.count || 1;
      continue;
    }

    i++;
  }
  return runs;
}

/** For post-translation spacing: underscore closers before CJK are often not `canClose` in strict CommonMark. */
const UNICODE_LETTER_FOR_SCAN = /\p{L}/u;

function scanDelimitersForSpacing(
  text: string,
  start: number,
  marker: "*" | "_" | "~"
): Pick<DelimiterRun, "count" | "canOpen" | "canClose"> {
  const base = scanDelimiters(text, start, marker);
  if (marker !== "_") {
    return base;
  }
  const count = readRun(text, start, marker);
  const prevChar = start > 0 ? text[start - 1]! : "\n";
  const nextIndex = start + count;
  const nextChar = nextIndex < text.length ? text[nextIndex]! : "\n";
  const prevWhite = isWhiteSpace(prevChar);
  const nextWhite = isWhiteSpace(nextChar);
  const prevPunct = isPunctuation(prevChar);
  const nextPunct = isPunctuation(nextChar);
  const leftFlanking = !nextWhite && (!nextPunct || prevWhite || prevPunct);
  const rightFlanking = !prevWhite && (!prevPunct || nextWhite || nextPunct);
  return {
    count,
    canOpen: leftFlanking && (!rightFlanking || prevPunct),
    canClose:
      base.canClose ||
      (rightFlanking && leftFlanking && UNICODE_LETTER_FOR_SCAN.test(nextChar)),
  };
}

function collectDelimiterRunsForSpacing(text: string): DelimiterRun[] {
  const runs: DelimiterRun[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    if (ch === "{" && text[i + 1] === "{") {
      const end = findPlaceholderEnd(text, i);
      if (end !== -1) {
        i = end;
        continue;
      }
    }

    if (ch === "`") {
      const tickCount = readRun(text, i, "`");
      const end = findCodeSpanEnd(text, i, tickCount);
      if (end !== -1) {
        i = end;
      } else {
        i += tickCount;
      }
      continue;
    }

    if ((ch === "*" || ch === "_" || ch === "~") && !isEscaped(text, i)) {
      const marker = ch as "*" | "_" | "~";
      const scan = scanDelimitersForSpacing(text, i, marker);
      if (scan.count > 0 && (scan.canOpen || scan.canClose)) {
        runs.push({
          marker,
          start: i,
          count: scan.count,
          canOpen: scan.canOpen,
          canClose: scan.canClose,
          openerUsed: 0,
          closerUsed: 0,
        });
      }
      i += scan.count || 1;
      continue;
    }

    i++;
  }
  return runs;
}

function nextUseLength(openRun: DelimiterRun, closeRun: DelimiterRun): number {
  if (openRun.marker === "~" || closeRun.marker === "~") {
    return 2;
  }
  const openAvail = openRun.count - openRun.openerUsed;
  const closeAvail = closeRun.count - closeRun.closerUsed;
  return openAvail >= 2 && closeAvail >= 2 ? 2 : 1;
}

function placeholderFor(marker: "*" | "_" | "~", markerRunLength: number): string {
  if (marker === "~" && markerRunLength === 2) {
    return STRIKETHROUGH_PLACEHOLDER;
  }
  if (marker === "*" && markerRunLength === 2) {
    return STRONG_ASTERISK_PLACEHOLDER;
  }
  if (marker === "_" && markerRunLength === 2) {
    return STRONG_UNDERSCORE_PLACEHOLDER;
  }
  if (marker === "*") {
    return ITALIC_ASTERISK_PLACEHOLDER;
  }
  return ITALIC_UNDERSCORE_PLACEHOLDER;
}

function buildProtectedText(source: string, replacements: Replacement[]): string {
  if (replacements.length === 0) {
    return source;
  }
  const ordered = [...replacements].sort((a, b) => a.start - b.start);
  const out: string[] = [];
  let cursor = 0;
  for (const r of ordered) {
    if (r.start < cursor) {
      continue;
    }
    out.push(source.slice(cursor, r.start));
    out.push(r.placeholder);
    cursor = r.end;
  }
  out.push(source.slice(cursor));
  return out.join("");
}

/**
 * Same opener/closer pairing as {@link protectMarkdownEmphasis}, returning replacement spans
 * plus each **closing** delimiter span in source order (for post-translation spacing fixes).
 */
function pairEmphasisDelimitersFromRuns(
  text: string,
  runs: DelimiterRun[]
): {
  replacements: Replacement[];
  closerSpans: Array<{ start: number; end: number }>;
} {
  const replacements: Replacement[] = [];
  const closerSpans: Array<{ start: number; end: number }> = [];

  for (let closerIndex = 0; closerIndex < runs.length; closerIndex++) {
    const closer = runs[closerIndex]!;
    if (!closer.canClose) {
      continue;
    }

    for (let openerIndex = closerIndex - 1; openerIndex >= 0; openerIndex--) {
      const opener = runs[openerIndex]!;
      if (opener.marker !== closer.marker || !opener.canOpen) {
        continue;
      }

      while (true) {
        const openerAvail = opener.count - opener.openerUsed - opener.closerUsed;
        const closerAvail = closer.count - closer.closerUsed - closer.openerUsed;
        if (openerAvail <= 0 || closerAvail <= 0) {
          break;
        }
        if (opener.marker === "~" && (openerAvail < 2 || closerAvail < 2)) {
          break;
        }

        const useLen = nextUseLength(opener, closer);
        const openerStart = opener.start + opener.openerUsed;
        const closerStart = closer.start + closer.count - closer.closerUsed - useLen;

        replacements.push({
          start: openerStart,
          end: openerStart + useLen,
          placeholder: placeholderFor(opener.marker, useLen),
        });
        replacements.push({
          start: closerStart,
          end: closerStart + useLen,
          placeholder: placeholderFor(closer.marker, useLen),
        });
        closerSpans.push({ start: closerStart, end: closerStart + useLen });

        opener.openerUsed += useLen;
        closer.closerUsed += useLen;
      }

      if (closer.count - closer.closerUsed <= 0) {
        break;
      }
    }
  }

  return { replacements, closerSpans };
}

function pairEmphasisDelimiters(text: string): {
  replacements: Replacement[];
  closerSpans: Array<{ start: number; end: number }>;
} {
  return pairEmphasisDelimitersFromRuns(text, collectDelimiterRuns(text));
}

export function protectMarkdownEmphasis(text: string): ProtectedEmphasisResult {
  const { replacements } = pairEmphasisDelimiters(text);
  return {
    protected: buildProtectedText(text, replacements),
  };
}

interface PlaceholderRestoreRule {
  placeholder: string;
  marker: string;
}

const RESTORE_RULES: PlaceholderRestoreRule[] = [
  { placeholder: STRONG_ASTERISK_PLACEHOLDER, marker: "**" },
  { placeholder: STRONG_UNDERSCORE_PLACEHOLDER, marker: "__" },
  { placeholder: ITALIC_ASTERISK_PLACEHOLDER, marker: "*" },
  { placeholder: ITALIC_UNDERSCORE_PLACEHOLDER, marker: "_" },
  { placeholder: STRIKETHROUGH_PLACEHOLDER, marker: "~~" },
];

const UNICODE_LETTER = /\p{L}/u;

/**
 * Returns true if a **closing** emphasis delimiter needs a trailing space injected before the
 * next character to remain a valid CommonMark closer.
 *
 * The rules differ by marker type:
 *
 * **Asterisk (`*` / `**`)** — closing rule: must be _right-flanking_.
 *   `letter**letter` is right-flanking (preceded by non-punct) → already valid, no space needed.
 *   `)**letter` is NOT right-flanking (preceded by `)` punctuation + followed by letter) →
 *   the parser treats it as a new opener instead of a closer → space required.
 *   Same for `]**letter` and `}**letter` (from placeholders like `{{ILC_0}}`).
 *
 * **Underscore (`_` / `__`)** — stricter closing rule: must be right-flanking AND NOT left-flanking
 *   (or left-flanking but preceded by punctuation).
 *   `letter__letter` is BOTH right-flanking AND left-flanking → cannot close → needs space.
 *   So a space is always needed when nextChar is a Unicode letter, regardless of prevChar.
 *
 * **Tilde (`~~`)** — GFM strikethrough closes correctly even before a Unicode letter → no space.
 *
 * **RTL scripts:** Markdown is stored in logical (code-unit) order; the space is inserted
 * immediately after the closing delimiter. BiDi rendering positions the gap correctly for RTL.
 *
 * This function is only called for CLOSERS. Callers use parity tracking (even encounter index
 * = opener, odd = closer) to avoid modifying openers.
 */
function closerNeedsTrailingSpace(marker: string, prevChar: string, nextChar: string): boolean {
  if (!UNICODE_LETTER.test(nextChar)) {
    return false;
  }
  if (marker === "_" || marker === "__") {
    // Underscore closing rule: must be right-flanking AND not left-flanking.
    // letter__letter is both → cannot close → always needs space before a Unicode letter.
    return true;
  }
  if (marker === "*" || marker === "**") {
    // Asterisk closing rule: just right-flanking.
    // letter**letter is right-flanking → closes fine, no space needed.
    // )/**letter or ]/**letter or }/**letter: NOT right-flanking → needs space.
    return /[})\]]/u.test(prevChar);
  }
  // ~~ (GFM strikethrough): closes fine before Unicode letters.
  return false;
}

/**
 * When emphasis was not replaced by placeholders (non-`--emphasis-placeholders` path), scan the
 * translated text for closing emphasis delimiters that would fail to close before a Unicode letter
 * and insert a space so the CommonMark parser can recognize them as closers.
 *
 * Uses {@link closerNeedsTrailingSpace} for marker-aware logic:
 *  - `__bold__이` / `_italic_を` → closing `_`/`__` needs space (strict underscore closing rule).
 *  - `**[link](url)**を` → closing `)**` needs space (not right-flanking); handled by the
 *    separate {@link insertSpacesAfterClosingConstructDelimiters} scan.
 *  - `**bold**이` → no space needed (asterisk closer is right-flanking before letters).
 *
 * `collectDelimiterRunsForSpacing` relaxes the `_` `canClose` check so that `d__이` is
 * included in `closerSpans` even though strict CommonMark marks it `canClose=false`.
 */
export function applyEmphasisCloserSpacing(text: string): string {
  const { closerSpans } = pairEmphasisDelimitersFromRuns(text, collectDelimiterRunsForSpacing(text));
  const sorted = [...closerSpans].sort((a, b) => b.end - a.end);
  let out = text;
  for (const { start, end } of sorted) {
    // Determine the marker character from the original text (positions stay valid in reverse order).
    const markerChar = text[start]!;
    const delimLen = end - start;
    const marker = delimLen >= 2 ? markerChar + markerChar : markerChar;
    const prevChar = start > 0 ? out[start - 1]! : "";
    const nextChar = end < out.length ? out[end]! : "";
    if (closerNeedsTrailingSpace(marker, prevChar, nextChar)) {
      out = out.slice(0, end) + " " + out.slice(end);
    }
  }
  out = insertSpacesAfterClosingConstructDelimiters(out);
  return out;
}

/**
 * Linear scan that inserts a space between a closing-construct character (`)` or `]`) and a
 * following emphasis delimiter (`*`, `**`, `_`, `__`, `~~`) when the character after the
 * delimiter is a Unicode letter.
 *
 * This covers the case `)**letter` / `]**letter` which {@link pairEmphasisDelimiters} marks
 * `canClose=false` (the delimiter is left-flanking there, not right-flanking) and therefore
 * never appears in `closerSpans`. We cannot use `pairEmphasisDelimiters` output for these
 * positions, but the pattern is unambiguous from local context alone: `)` or `]` is always
 * a span-closing character, not content, so the immediately following delimiter must be a
 * closer regardless of what the pairing algorithm says about flanking.
 *
 * At this call-site, inline-code spans are still encoded as `{{ILC_N}}` placeholders, so
 * there are no raw backtick spans in the string that could produce false matches.
 */
function insertSpacesAfterClosingConstructDelimiters(text: string): string {
  const buf: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch !== ")" && ch !== "]") {
      buf.push(ch);
      i++;
      continue;
    }
    // Peek ahead: is there a delimiter run (* / ** / _ / __ / ~~) followed by a Unicode letter?
    let j = i + 1;
    const delim = text[j];
    if (delim === "*" || delim === "_" || delim === "~") {
      const delimChar = delim;
      const maxRun = delimChar === "~" ? 2 : delimChar === "_" ? 2 : 2; // ~~, __, **
      let runLen = 0;
      while (j + runLen < text.length && text[j + runLen] === delimChar && runLen < maxRun) {
        runLen++;
      }
      if (runLen > 0 && runLen <= maxRun) {
        const afterDelim = text[j + runLen] ?? "";
        if (UNICODE_LETTER.test(afterDelim)) {
          // Emit: closing-construct char + delimiter run + injected space
          buf.push(ch, text.slice(j, j + runLen), " ");
          i = j + runLen;
          continue;
        }
      }
    }
    buf.push(ch);
    i++;
  }
  return buf.join("");
}

/**
 * Restore `{{SE}}`, `{{SU}}`, `{{IT}}`, `{{IU}}`, `{{ST}}` placeholders back to their
 * original delimiter markers (`**`, `__`, `*`, `_`, `~~`).
 *
 * Uses **parity tracking** to distinguish openers from closers: the first encounter of each
 * placeholder type is an opener, the second a closer, the third an opener again, etc.
 * (This matches the left-to-right pairing produced by `protectMarkdownEmphasis`.)
 *
 * Openers are never modified. For closers, {@link closerNeedsTrailingSpace} decides whether
 * to inject a space before the next character to keep the delimiter right-flanking.
 */
export function restoreMarkdownEmphasis(text: string): string {
  const out: string[] = [];
  // Count how many times each placeholder has been seen; even count → opener, odd → closer.
  const seen = new Map<string, number>();
  let i = 0;

  while (i < text.length) {
    let matched = false;
    for (const rule of RESTORE_RULES) {
      if (text.startsWith(rule.placeholder, i)) {
        const count = seen.get(rule.placeholder) ?? 0;
        seen.set(rule.placeholder, count + 1);
        const isOpener = count % 2 === 0;

        out.push(rule.marker);

        if (!isOpener) {
          const prevChar = out.length > 1 ? out[out.length - 2]! : "";
          const nextChar = text[i + rule.placeholder.length] ?? "";
          if (closerNeedsTrailingSpace(rule.marker, prevChar, nextChar)) {
            out.push(" ");
          }
        }

        i += rule.placeholder.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      out.push(text[i]!);
      i++;
    }
  }

  return out.join("");
}
