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

function nextUseLength(openRun: DelimiterRun, closeRun: DelimiterRun): number {
  if (openRun.marker === "~" || closeRun.marker === "~") {
    return 2;
  }
  const openAvail = openRun.count - openRun.openerUsed;
  const closeAvail = closeRun.count - closeRun.closerUsed;
  return openAvail >= 2 && closeAvail >= 2 ? 2 : 1;
}

function placeholderFor(
  marker: "*" | "_" | "~",
  markerRunLength: number
): string {
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

export function protectMarkdownEmphasis(text: string): ProtectedEmphasisResult {
  const replacements: Replacement[] = [];
  const runs = collectDelimiterRuns(text);

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
        const openerAvail = opener.count - opener.openerUsed;
        const closerAvail = closer.count - closer.closerUsed;
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

        opener.openerUsed += useLen;
        closer.closerUsed += useLen;
      }

      if (closer.count - closer.closerUsed <= 0) {
        break;
      }
    }
  }

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

export function restoreMarkdownEmphasis(text: string): string {
  const out: string[] = [];
  let i = 0;

  while (i < text.length) {
    let matched = false;
    for (const rule of RESTORE_RULES) {
      if (text.startsWith(rule.placeholder, i)) {
        out.push(rule.marker);
        i += rule.placeholder.length;
        matched = true;
        break;
      }
    }

    if (matched) {
      continue;
    }

    out.push(text[i]!);
    i++;
  }

  return out.join("");
}
