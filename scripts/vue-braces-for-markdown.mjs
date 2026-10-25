/**
 * Escape {{ }} in VitePress markdown outside fenced code blocks.
 * Inline code and prose placeholders become <code v-pre>…</code> so Vue does not
 * treat mustache syntax as interpolation, while readers still see {{name}}.
 *
 * Inline code follows CommonMark: a run of N backticks opens a span closed by
 * the next run of exactly N backticks (so `` `code` `` is handled correctly).
 */
export function escapeVueBracesInMarkdown(text) {
  function restoreVPreToSource(input) {
    let prev = "";
    let cur = input;
    while (cur !== prev) {
      prev = cur;
      cur = cur.replace(/<code v-pre>([\s\S]*?)<\/code>/g, (_, inner) => `\`${inner}\``);
    }
    return cur.replaceAll("\\{\\{", "{{").replaceAll("\\}\\}", "}}");
  }

  function toVPreCode(inner) {
    return `<code v-pre>${inner}</code>`;
  }

  function escapeProse(segment) {
    if (segment.includes("<code v-pre>")) return segment;
    return segment.replace(/\{\{([^{}]+)\}\}/g, (_, inner) => toVPreCode(`{{${inner}}}`));
  }

  function countBackticks(s, from) {
    let n = 0;
    while (from + n < s.length && s[from + n] === "`") n += 1;
    return n;
  }

  /** Index of the closing backtick run of length `tickCount`, or -1 if none. */
  function findInlineCodeClose(s, contentStart, tickCount) {
    let i = contentStart;
    while (i < s.length) {
      if (s[i] !== "`") {
        i += 1;
        continue;
      }
      const n = countBackticks(s, i);
      if (n === tickCount) return i;
      i += n;
    }
    return -1;
  }

  /**
   * CommonMark fence at the start of a line: 3+ backticks or tildes.
   * A longer opener (````markdown) stays open across inner ``` fences.
   */
  function fenceOpenerAt(index) {
    if (index !== 0 && source[index - 1] !== "\n") return null;
    const lineEnd = source.indexOf("\n", index);
    const line = source.slice(index, lineEnd === -1 ? source.length : lineEnd);
    const match = /^( {0,3})([`~]+)/.exec(line);
    if (!match || match[2].length < 3) return null;
    const char = match[2][0];
    if ([...match[2]].some((c) => c !== char)) return null;
    const info = line.slice(match[1].length + match[2].length);
    if (char === "`" && info.includes("`")) return null;
    return { char, count: match[2].length, lineEnd: lineEnd === -1 ? source.length : lineEnd };
  }

  function isFenceClose(index, open) {
    if (source[index - 1] !== "\n") return false;
    const lineEnd = source.indexOf("\n", index);
    const line = source.slice(index, lineEnd === -1 ? source.length : lineEnd);
    const match = /^( {0,3})([`~]+)\s*$/.exec(line);
    if (!match || match[2].length < open.count) return false;
    const char = match[2][0];
    if (char !== open.char) return false;
    if ([...match[2]].some((c) => c !== char)) return false;
    return lineEnd === -1 ? source.length : lineEnd;
  }

  function nextTildeFence(from) {
    let index = from;
    while (index < source.length) {
      const atLine = index === 0 || source[index - 1] === "\n";
      if (atLine) {
        const open = fenceOpenerAt(index);
        if (open?.char === "~") return index;
      }
      const nl = source.indexOf("\n", index);
      if (nl === -1) return -1;
      index = nl + 1;
    }
    return -1;
  }

  const source = restoreVPreToSource(text);
  const parts = [];
  let i = 0;
  while (i < source.length) {
    const open = fenceOpenerAt(i);
    if (open) {
      let pos = open.lineEnd < source.length ? open.lineEnd + 1 : source.length;
      let closedAt = -1;
      while (pos < source.length) {
        const closeEnd = isFenceClose(pos, open);
        if (closeEnd !== false) {
          closedAt = closeEnd;
          break;
        }
        const nl = source.indexOf("\n", pos);
        if (nl === -1) break;
        pos = nl + 1;
      }
      const sliceEnd = closedAt === -1 ? source.length : closedAt;
      parts.push(source.slice(i, sliceEnd));
      i = sliceEnd;
      continue;
    }
    if (source[i] === "`") {
      const tickCount = countBackticks(source, i);
      const contentStart = i + tickCount;
      const closeStart = findInlineCodeClose(source, contentStart, tickCount);
      if (closeStart === -1) {
        // Unmatched backticks are literal text (CommonMark).
        parts.push(source.slice(i, contentStart));
        i = contentStart;
        continue;
      }
      const inner = source.slice(contentStart, closeStart);
      const sliceEnd = closeStart + tickCount;
      parts.push(inner.includes("{{") ? toVPreCode(inner) : source.slice(i, sliceEnd));
      i = sliceEnd;
      continue;
    }
    const nextTick = source.indexOf("`", i);
    const nextTilde = nextTildeFence(i);
    let nextSpecial = source.length;
    if (nextTick >= 0) nextSpecial = Math.min(nextSpecial, nextTick);
    if (nextTilde >= 0) nextSpecial = Math.min(nextSpecial, nextTilde);
    parts.push(escapeProse(source.slice(i, nextSpecial)));
    i = nextSpecial;
  }
  return parts.join("");
}
