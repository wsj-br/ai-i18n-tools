/**
 * Removes bold (`**`) wrappers around Markdown inline code (`…`), e.g. **`x`** → `x`.
 * Closing delimiter: first run of N backticks (matching opening) immediately followed by `**`.
 */

function findClosingTickBeforeBold(s: string, tickStart: number, tickLen: number): number {
  const contentStart = tickStart + tickLen;
  let j = contentStart;
  while (j < s.length) {
    let k = 0;
    while (k < tickLen && j + k < s.length && s[j + k] === "`") {
      k++;
    }
    if (
      k === tickLen &&
      j + tickLen + 2 <= s.length &&
      s[j + tickLen] === "*" &&
      s[j + tickLen + 1] === "*"
    ) {
      return j;
    }
    j++;
  }
  return -1;
}

export function stripBoldAroundInlineCode(md: string): string {
  let out = "";
  let i = 0;
  while (i < md.length) {
    const pre = i > 0 ? md[i - 1]! : "";
    if (
      pre !== "`" &&
      i + 2 < md.length &&
      md[i] === "*" &&
      md[i + 1] === "*" &&
      md[i + 2] === "`"
    ) {
      const tickStart = i + 2;
      let tickLen = 0;
      while (tickStart + tickLen < md.length && md[tickStart + tickLen] === "`") {
        tickLen++;
      }
      if (tickLen > 0) {
        const closeStart = findClosingTickBeforeBold(md, tickStart, tickLen);
        if (closeStart !== -1) {
          out += md.slice(tickStart, closeStart + tickLen);
          i = closeStart + tickLen + 2;
          continue;
        }
      }
    }
    out += md[i]!;
    i++;
  }
  return out;
}
