/**
 * Replace each inline code span `` `...` `` with {{ILC_N}} before translation; restore injects the original span.
 * Runs after bold-wrapped code (`**`...`**` → {{BLD_N}}) so remaining backticks are standalone code only.
 */

const PLACEHOLDER_PREFIX = "{{ILC_";
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

export interface ProtectedInlineCodeResult {
  protected: string;
  ilcMap: string[];
}

export function protectInlineCodeSpans(text: string): ProtectedInlineCodeResult {
  const ilcMap: string[] = [];
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
        const original = text.slice(i, end);
        const ph = `${PLACEHOLDER_PREFIX}${ilcMap.length}${PLACEHOLDER_SUFFIX}`;
        ilcMap.push(original);
        out.push(ph);
        i = end;
      } else {
        out.push(text.slice(i, i + tickCount));
        i += tickCount;
      }
      continue;
    }

    out.push(text[i]!);
    i++;
  }

  return { protected: out.join(""), ilcMap };
}

export function restoreInlineCodeSpans(text: string, ilcMap: string[]): string {
  if (ilcMap.length === 0) {
    return text;
  }
  let restored = text;
  for (let j = 0; j < ilcMap.length; j++) {
    const placeholder = `${PLACEHOLDER_PREFIX}${j}${PLACEHOLDER_SUFFIX}`;
    restored = restored.split(placeholder).join(ilcMap[j]);
  }
  return restored;
}
