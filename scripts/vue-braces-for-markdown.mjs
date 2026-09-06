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

  const source = restoreVPreToSource(text);
  const parts = [];
  let i = 0;
  while (i < source.length) {
    if (source.startsWith("```", i)) {
      const end = source.indexOf("```", i + 3);
      const sliceEnd = end === -1 ? source.length : end + 3;
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
    const nextFence = source.indexOf("```", i);
    const nextTick = source.indexOf("`", i);
    let nextSpecial = source.length;
    if (nextFence >= 0) nextSpecial = Math.min(nextSpecial, nextFence);
    if (nextTick >= 0) nextSpecial = Math.min(nextSpecial, nextTick);
    parts.push(escapeProse(source.slice(i, nextSpecial)));
    i = nextSpecial;
  }
  return parts.join("");
}
