/**
 * Escape {{ }} in VitePress markdown outside fenced code blocks.
 * Inline code and prose placeholders become <code v-pre>…</code> so Vue does not
 * treat mustache syntax as interpolation, while readers still see {{name}}.
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
      const end = source.indexOf("`", i + 1);
      const sliceEnd = end === -1 ? source.length : end + 1;
      const inner = source.slice(i + 1, sliceEnd - 1);
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
