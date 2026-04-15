/**
 * Protect HTML comments/tags before translation and restore them afterward.
 * Uses an allowlist of HTML tag names to avoid matching prose like `< max and y >`.
 */
const PLACEHOLDER_PREFIX = "{{HTM_";
const PLACEHOLDER_SUFFIX = "}}";

const KNOWN_HTML_TAGS = [
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "audio",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "mark",
  "menu",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "section",
  "select",
  "slot",
  "small",
  "source",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
] as const;

const TAG_NAMES = KNOWN_HTML_TAGS.join("|");
const COMMENT_RE = /<!--[\s\S]*?-->/g;
const CLOSE_TAG_RE = new RegExp(`<\\/(?:${TAG_NAMES})\\s*>`, "gi");
const OPEN_OR_SELF_CLOSING_TAG_RE = new RegExp(
  `<(?:${TAG_NAMES})(?:\\s[^>]*)?\\s*\\/?>`,
  "gi"
);
const HTML_TAG_OR_COMMENT_RE = new RegExp(
  `${COMMENT_RE.source}|${CLOSE_TAG_RE.source}|${OPEN_OR_SELF_CLOSING_TAG_RE.source}`,
  "gi"
);

export interface ProtectedHtmlTagsResult {
  protected: string;
  htmlTagMap: string[];
}

export function protectHtmlTags(text: string): ProtectedHtmlTagsResult {
  const htmlTagMap: string[] = [];
  const protectedText = text.replace(HTML_TAG_OR_COMMENT_RE, (m) => {
    const ph = `${PLACEHOLDER_PREFIX}${htmlTagMap.length}${PLACEHOLDER_SUFFIX}`;
    htmlTagMap.push(m);
    return ph;
  });
  return { protected: protectedText, htmlTagMap };
}

export function restoreHtmlTags(text: string, htmlTagMap: string[]): string {
  if (htmlTagMap.length === 0) {
    return text;
  }
  let restored = text;
  for (let i = 0; i < htmlTagMap.length; i++) {
    const placeholder = `${PLACEHOLDER_PREFIX}${i}${PLACEHOLDER_SUFFIX}`;
    restored = restored.split(placeholder).join(htmlTagMap[i]!);
  }
  return restored;
}
