/** An open CommonMark fenced code block: the fence character and the opener's run length. */
export interface OpenCodeFence {
  char: "`" | "~";
  length: number;
}

const FENCE_OPEN_RE = /^\s*(`{3,}|~{3,})/;

/** Returns the fence opened by `line`, or null when the line does not start a fenced block. */
export function matchCodeFenceOpen(line: string): OpenCodeFence | null {
  const m = FENCE_OPEN_RE.exec(line);
  if (!m) {
    return null;
  }
  const run = m[1]!;
  return { char: run[0] as "`" | "~", length: run.length };
}

/**
 * True when `line` closes `open`: same fence character, at least as many characters as the opener,
 * and nothing but whitespace after it (CommonMark forbids an info string on a closing fence). This
 * keeps a nested ```` ```python ```` example inside a ```` ```` ```` block from ending the outer fence.
 */
export function isCodeFenceClose(line: string, open: OpenCodeFence): boolean {
  const m = FENCE_OPEN_RE.exec(line);
  if (!m) {
    return false;
  }
  const run = m[1]!;
  if (run[0] !== open.char || run.length < open.length) {
    return false;
  }
  return line.slice(m[0].length).trim() === "";
}
