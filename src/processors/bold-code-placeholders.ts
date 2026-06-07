/**
 * Replace **`...`** (bold wrapping inline code) with a single opaque placeholder per occurrence.
 * The whole span is non-translatable markup; isolating it avoids models breaking ** / ` pairing (e.g. CJK).
 */

const PLACEHOLDER_PREFIX = "{{BLD_";
const PLACEHOLDER_SUFFIX = "}}";

function readRun(text: string, start: number, marker: string): number {
  let i = start;
  while (i < text.length && text[i] === marker) {
    i++;
  }
  return i - start;
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

export interface ProtectedBoldCodeResult {
  protected: string;
  boldCodeMap: string[];
}

/**
 * After URLs/anchors: each **`inner`** becomes one placeholder; inner backticks and ** are stored for restore.
 */
export function protectBoldWrappedInlineCode(text: string): ProtectedBoldCodeResult {
  const boldCodeMap: string[] = [];
  const out: string[] = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === "{" && text[i + 1] === "{") {
      const end = findPlaceholderEnd(text, i);
      if (end !== -1) {
        out.push(text.slice(i, end));
        i = end;
        continue;
      }
    }

    if (text[i] === "`") {
      const tickCount = readRun(text, i, "`");
      const end = findCodeSpanEnd(text, i, tickCount);
      if (end !== -1) {
        out.push(text.slice(i, end));
        i = end;
      } else {
        out.push(text.slice(i, i + tickCount));
        i += tickCount;
      }
      continue;
    }

    if (text[i] === "*" && text[i + 1] === "*" && i + 2 < text.length && text[i + 2] === "`") {
      const tickStart = i + 2;
      const tickCount = readRun(text, tickStart, "`");
      const codeEnd = findCodeSpanEnd(text, tickStart, tickCount);
      if (
        codeEnd !== -1 &&
        codeEnd + 2 <= text.length &&
        text[codeEnd] === "*" &&
        text[codeEnd + 1] === "*"
      ) {
        const original = text.slice(i, codeEnd + 2);
        const ph = `${PLACEHOLDER_PREFIX}${boldCodeMap.length}${PLACEHOLDER_SUFFIX}`;
        boldCodeMap.push(original);
        out.push(ph);
        i = codeEnd + 2;
        continue;
      }
    }

    out.push(text[i]!);
    i++;
  }

  return { protected: out.join(""), boldCodeMap };
}

/**
 * CommonMark flanking rules for `**` around inline code:
 *
 * - **Closing**: must be right-flanking. CJK particles glue after the span, so
 *   `**`code`**이` needs a trailing space before the particle.
 * - **Opening**: when preceded by a Unicode letter and immediately followed by `` ` ``,
 *   `letter**`code`**` cannot open (backtick is punctuation that blocks left-flanking).
 *   Insert a leading space: `letter **`code`**`.
 */
function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function restoreBoldWrappedInlineCode(text: string, boldCodeMap: string[]): string {
  if (boldCodeMap.length === 0) {
    return text;
  }
  let restored = text;
  for (let j = 0; j < boldCodeMap.length; j++) {
    const placeholder = `${PLACEHOLDER_PREFIX}${j}${PLACEHOLDER_SUFFIX}`;
    const original = boldCodeMap[j]!;
    const escaped = escapeForRegex(placeholder);
    restored = restored.replace(
      new RegExp(`(?<=\\p{L})${escaped}(?=\\p{L})`, "gu"),
      ` ${original} `
    );
    restored = restored.replace(new RegExp(`(?<=\\p{L})${escaped}`, "gu"), ` ${original}`);
    restored = restored.replace(new RegExp(`${escaped}(?=\\p{L})`, "gu"), `${original} `);
    restored = restored.split(placeholder).join(original);
  }
  return restored;
}
