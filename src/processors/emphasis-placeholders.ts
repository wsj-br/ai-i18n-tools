const ITALIC_ASTERISK_PLACEHOLDER = "{{IT}}";
const ITALIC_UNDERSCORE_PLACEHOLDER = "{{IU}}";
const STRONG_ASTERISK_PLACEHOLDER = "{{SE}}";
const STRONG_UNDERSCORE_PLACEHOLDER = "{{SU}}";
const STRIKETHROUGH_PLACEHOLDER = "{{ST}}";

/** Delimiter run for CommonMark-style `*` / `_` / `~` pairing (used by emphasis protection and markdown diagnostics). */
export interface MarkdownDelimiterRun {
  marker: "*" | "_" | "~";
  start: number;
  count: number;
  canOpen: boolean;
  canClose: boolean;
  openerUsed: number;
  closerUsed: number;
}

type DelimiterRun = MarkdownDelimiterRun;

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

export function findCodeSpanEnd(text: string, tickStart: number, tickCount: number): number {
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

/** 1-based start indices of inline code openings whose closing backticks never appear (same rules as delimiter scan). */
export function findUnclosedInlineCodeLine1Starts(text: string): number[] {
  const lines: number[] = [];
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
      if (end === -1) {
        lines.push(1 + (text.slice(0, i).match(/\n/g)?.length ?? 0));
        i += tickCount;
      } else {
        i = end;
      }
      continue;
    }

    i++;
  }
  return lines;
}

export function collectMarkdownDelimiterRuns(text: string): MarkdownDelimiterRun[] {
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
const ASCII_LETTER_FOR_SCAN = /[A-Za-z]/;

/**
 * A Unicode letter that is NOT a basic Latin (ASCII) letter — i.e. a character from a script that
 * typically writes words without spaces (CJK, etc.).
 *
 * The underscore spacing relaxation below exists for those scripts: `_italic_を` / `データを_処理_`
 * have emphasis delimiters glued to letters that strict CommonMark refuses to open/close. We must
 * NOT relax for plain ASCII intraword underscores (`translation_demo_svg`, `my_config_value`),
 * which are legitimate identifiers, never emphasis — relaxing there injects spaces and even
 * fabricates an emphasis span (`_demo_`), corrupting output and tripping AST quality checks.
 */
function isTightScriptLetter(ch: string): boolean {
  return UNICODE_LETTER_FOR_SCAN.test(ch) && !ASCII_LETTER_FOR_SCAN.test(ch);
}

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
  // Only relax for the no-space-script (CJK etc.) gluing case the relaxation was built for.
  // Pure ASCII intraword underscores stay non-emphasis so identifiers are left untouched.
  const gluedToTightScript = isTightScriptLetter(prevChar) || isTightScriptLetter(nextChar);
  return {
    count,
    canOpen:
      base.canOpen ||
      (leftFlanking &&
        rightFlanking &&
        gluedToTightScript &&
        UNICODE_LETTER_FOR_SCAN.test(prevChar) &&
        UNICODE_LETTER_FOR_SCAN.test(nextChar)),
    canClose:
      base.canClose ||
      (rightFlanking &&
        leftFlanking &&
        gluedToTightScript &&
        UNICODE_LETTER_FOR_SCAN.test(nextChar)),
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
 * Mutates `runs` (openerUsed / closerUsed); pass a **deep copy** if you need to preserve the original.
 */
export function pairMarkdownEmphasisDelimitersFromRuns(
  text: string,
  runs: MarkdownDelimiterRun[]
): {
  replacements: Replacement[];
  openerSpans: Array<{ start: number; end: number }>;
  closerSpans: Array<{ start: number; end: number }>;
} {
  const replacements: Replacement[] = [];
  const openerSpans: Array<{ start: number; end: number }> = [];
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
        openerSpans.push({ start: openerStart, end: openerStart + useLen });
        closerSpans.push({ start: closerStart, end: closerStart + useLen });

        opener.openerUsed += useLen;
        closer.closerUsed += useLen;
      }

      if (closer.count - closer.closerUsed <= 0) {
        break;
      }
    }
  }

  return { replacements, openerSpans, closerSpans };
}

function pairEmphasisDelimiters(text: string): {
  replacements: Replacement[];
  openerSpans: Array<{ start: number; end: number }>;
  closerSpans: Array<{ start: number; end: number }>;
} {
  return pairMarkdownEmphasisDelimitersFromRuns(text, collectMarkdownDelimiterRuns(text));
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
    if (/[})\]]/u.test(prevChar)) {
      return true;
    }
    // punctuation**letter (e.g. **Rephrase…**을(를)): prev punct blocks right-flanking when
    // the next character is a Unicode letter — CommonMark leaves ** as literal stars.
    if (prevChar !== "" && isPunctuation(prevChar)) {
      return true;
    }
    return false;
  }
  // ~~ (GFM strikethrough): closes fine before Unicode letters.
  return false;
}

/**
 * Returns true if an emphasis **opener** needs a leading space injected so CommonMark can parse it.
 *
 * Underscore (`_` / `__`) is strict: `letter_word` is both left- and right-flanking, so `_` cannot
 * open (`データを_処理_` → literal underscores). Asterisk and strikethrough openers only require
 * left-flanking, so `letter**word` is already valid — no leading space.
 *
 * Applies to restored `{{IU}}`/`{{SU}}` markers and to raw `_`/`__` in {@link applyEmphasisCloserSpacing}.
 */
function openerNeedsLeadingSpace(marker: string, prevChar: string, nextChar: string): boolean {
  if (prevChar === "" || isWhiteSpace(prevChar)) {
    return false;
  }
  const markerChar = marker[0];
  if (markerChar !== "_") {
    return false;
  }
  const prevWhite = isWhiteSpace(prevChar);
  const nextWhite = isWhiteSpace(nextChar);
  const prevPunct = isPunctuation(prevChar);
  const nextPunct = isPunctuation(nextChar);
  const leftFlanking = !nextWhite && (!nextPunct || prevWhite || prevPunct);
  const rightFlanking = !prevWhite && (!prevPunct || nextWhite || nextPunct);
  const canOpen = leftFlanking && (!rightFlanking || prevPunct);
  if (canOpen) {
    return false;
  }
  return UNICODE_LETTER.test(prevChar);
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
  const { openerSpans, closerSpans } = pairMarkdownEmphasisDelimitersFromRuns(
    text,
    collectDelimiterRunsForSpacing(text)
  );
  const insertions: Array<{ index: number; after: boolean }> = [];

  for (const { start, end } of openerSpans) {
    const markerChar = text[start]!;
    const marker = end - start >= 2 ? markerChar + markerChar : markerChar;
    const prevChar = start > 0 ? text[start - 1]! : "";
    const nextChar = end < text.length ? text[end]! : "";
    if (openerNeedsLeadingSpace(marker, prevChar, nextChar)) {
      insertions.push({ index: start, after: false });
    }
  }

  for (const { start, end } of closerSpans) {
    const markerChar = text[start]!;
    const marker = end - start >= 2 ? markerChar + markerChar : markerChar;
    const prevChar = start > 0 ? text[start - 1]! : "";
    const nextChar = end < text.length ? text[end]! : "";
    if (closerNeedsTrailingSpace(marker, prevChar, nextChar)) {
      insertions.push({ index: end, after: true });
    }
  }

  insertions.sort((a, b) => b.index - a.index || Number(b.after) - Number(a.after));
  let out = text;
  for (const { index } of insertions) {
    out = out.slice(0, index) + " " + out.slice(index);
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
    const j = i + 1;
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
 * Openers receive a leading space when {@link openerNeedsLeadingSpace} applies (underscore
 * after a Unicode letter). Closers receive a trailing space when {@link closerNeedsTrailingSpace} applies.
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
        const prevCharBefore = out.length > 0 ? out[out.length - 1]! : "";
        const nextCharAfter = text[i + rule.placeholder.length] ?? "";

        if (isOpener && openerNeedsLeadingSpace(rule.marker, prevCharBefore, nextCharAfter)) {
          out.push(" ");
        }

        out.push(rule.marker);

        if (!isOpener) {
          const prevChar = out.length > 1 ? out[out.length - 2]! : "";
          if (closerNeedsTrailingSpace(rule.marker, prevChar, nextCharAfter)) {
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
