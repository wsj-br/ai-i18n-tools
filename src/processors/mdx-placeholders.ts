/**
 * Protect MDX-only constructs that the existing markdown placeholders miss:
 *
 * - MDX comments (including the recommended Docusaurus heading-id form).
 * - Capitalized JSX tags that do not appear in the
 *   lowercase HTML allowlist used by protectHtmlTags.
 * - MDX brace expressions.
 *
 * Runs after protectDocAnchors (so legacy {id} is captured as placeholder first) but
 * before protectMarkdownUrls, the bold/inline-code scanners, and emphasis pairing.
 */

const PLACEHOLDER_PREFIX = "{{MDX_";
const PLACEHOLDER_SUFFIX = "}}";

/** In-memory placeholder inside a preserved JSX tag string (not sent as standalone MDX braces). */
const JXA_PREFIX = "{{JXA_";
const JXA_SUFFIX = "}}";

function makeJxaPlaceholder(idx: number): string {
  return `${JXA_PREFIX}${idx}${JXA_SUFFIX}`;
}

/** MDX comment: { then optional whitespace then *, content, * then optional whitespace then }. */
const MDX_COMMENT_RE = /\{\s*\/\*[\s\S]*?\*\/\s*\}/g;

/**
 * Capitalized JSX opening or self-closing tag.
 * Mirrors the HTML allowlist regex shape, so attributes that contain a
 * > character are an accepted limitation (same as the lowercase HTML protector).
 */
const JSX_OPEN_OR_SELF_CLOSING_RE = /<[A-Z][A-Za-z0-9.]*(\s[^>]*)?\s*\/?>/g;

/** Capitalized JSX closing tag. */
const JSX_CLOSE_RE = /<\/[A-Z][A-Za-z0-9.]*\s*>/g;

export interface ProtectedMdxResult {
  protected: string;
  mdxMap: string[];
  /** Optional: extracted JSX attribute values that need translation */
  jsxAttributeMap?: string[];
  /**
   * Optional text to append to segment for translation.
   * Format: "||JXA: value1 ||JXA: value2"
   */
  jsxAttributeText?: string;
}

function makePlaceholder(idx: number): string {
  return `${PLACEHOLDER_PREFIX}${idx}${PLACEHOLDER_SUFFIX}`;
}

/** End-exclusive index of an existing placeholder starting at start, or -1. */
function findExistingPlaceholderEnd(text: string, start: number): number {
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

/**
 * End-exclusive index past the } matching text[start] === '{', accounting for nested braces and
 * skipping any placeholders inside.
 * Returns -1 if no balanced match exists.
 */
function findMatchingBraceEnd(text: string, start: number): number {
  let depth = 0;
  let i = start;
  while (i < text.length) {
    if (text[i] === "{" && text[i + 1] === "{") {
      const phEnd = findExistingPlaceholderEnd(text, i);
      if (phEnd !== -1) {
        i = phEnd;
        continue;
      }
    }
    const ch = text[i];
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return i + 1;
      }
    }
    i++;
  }
  return -1;
}

/**
 * Determine if an attribute value should be translated.
 * Skip technical identifiers, numbers, booleans, etc.
 */
function shouldTranslateAttributeValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (trimmed === "true" || trimmed === "false") return false;
  if (trimmed.startsWith("@")) return false;
  if (trimmed.includes("://")) return false;
  // Skip short identifiers that look like technical keys (all lowercase or all uppercase, short)
  if (/^[a-z_][a-z0-9_]*$/.test(trimmed) && trimmed.length <= 3) return false;
  if (/^[A-Z_][A-Z0-9_]*$/.test(trimmed) && trimmed.length <= 3) return false;
  // Allow mixed case strings like "iOS", "eBay", etc.
  return true;
}

/**
 * `TabItem` `value` when there is no `label` — often shown as the tab title. Skip stable
 * lowercase slug keys (`apple`, `my-tab`) so they stay aligned with `defaultValue` and
 * `values={[ { value: 'apple' } ]}`.
 */
function shouldTranslateTabItemValue(value: string): boolean {
  if (!shouldTranslateAttributeValue(value)) {
    return false;
  }
  const t = value.trim();
  if (/^[a-z][a-z0-9_-]*$/.test(t)) {
    return false;
  }
  return true;
}

/**
 * `label: '…'` / `label: "…"` inside `values={[ … ]}` on `<Tabs>` (object literals, not JSX attrs).
 */
function substituteObjectLiteralLabels(tag: string, jsxAttributeMap: string[]): string {
  const re = /\blabel\s*:\s*(["'])((?:\\.|(?!\1).)*)\1/g;
  return tag.replace(re, (full, q: string, inner: string) => {
    const decoded = inner.replace(/\\(.)/g, "$1");
    if (!shouldTranslateAttributeValue(decoded)) {
      return full;
    }
    const idx = jsxAttributeMap.length;
    jsxAttributeMap.push(decoded);
    return `label: ${q}${makeJxaPlaceholder(idx)}${q}`;
  });
}

const TAB_ITEM_OPENER_RE = /^<[Tt]ab[Ii]tem\b/;

/**
 * Replace translatable string attributes on a JSX opener with `{{JXA_N}}` placeholders and
 * record originals in order (parallel indices).
 */
function substituteTranslatableJsxAttributes(jsxTag: string, jsxAttributeMap: string[]): string {
  let tag = jsxTag;
  const attrNames = ["label", "tooltip", "aria-label"] as const;
  for (const attr of attrNames) {
    const escaped = attr.replace(/-/g, "\\-");
    const re = new RegExp(`(\\s${escaped}\\s*=\\s*)(["'])([^"']*)\\2`, "gi");
    tag = tag.replace(re, (full, pre: string, q: string, val: string) => {
      if (!shouldTranslateAttributeValue(val)) {
        return full;
      }
      const idx = jsxAttributeMap.length;
      jsxAttributeMap.push(val);
      return `${pre}${q}${makeJxaPlaceholder(idx)}${q}`;
    });
  }

  tag = substituteObjectLiteralLabels(tag, jsxAttributeMap);

  if (TAB_ITEM_OPENER_RE.test(jsxTag) && !/\slabel\s*=/i.test(tag)) {
    const re = /(\svalue\s*=\s*)(["'])([^"']*)\2/gi;
    tag = tag.replace(re, (full, pre: string, q: string, val: string) => {
      if (!shouldTranslateTabItemValue(val)) {
        return full;
      }
      const idx = jsxAttributeMap.length;
      jsxAttributeMap.push(val);
      return `${pre}${q}${makeJxaPlaceholder(idx)}${q}`;
    });
  }

  return tag;
}

/**
 * Protect MDX comments, capitalized JSX tags, and top-level brace expressions in text.
 * Also extracts translatable JSX bits: `label` / `tooltip` / `aria-label` attrs; `label:` inside
 * `values={[…]}` objects; and `TabItem` `value` when that opener has no `label` attr (skips lowercase slug keys).
 * so they can be appended to the segment text for translation.
 */
export function protectMdx(text: string): ProtectedMdxResult {
  const mdxMap: string[] = [];
  const jsxAttributeMap: string[] = [];

  // Step 1: Protect MDX comments
  let s = text.replace(MDX_COMMENT_RE, (m) => {
    const ph = makePlaceholder(mdxMap.length);
    mdxMap.push(m);
    return ph;
  });

  // Step 2: Protect JSX opening/self-closing tags (rewrite translatable attrs to {{JXA_N}})
  s = s.replace(JSX_OPEN_OR_SELF_CLOSING_RE, (m) => {
    const rewritten = substituteTranslatableJsxAttributes(m, jsxAttributeMap);
    const ph = makePlaceholder(mdxMap.length);
    mdxMap.push(rewritten);
    return ph;
  });

  // Step 3: Protect JSX closing tags
  s = s.replace(JSX_CLOSE_RE, (m) => {
    const ph = makePlaceholder(mdxMap.length);
    mdxMap.push(m);
    return ph;
  });

  // Step 4: Protect brace expressions
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === "{" && s[i + 1] === "{") {
      const phEnd = findExistingPlaceholderEnd(s, i);
      if (phEnd !== -1) {
        out.push(s.slice(i, phEnd));
        i = phEnd;
        continue;
      }
    }
    if (s[i] === "{") {
      const end = findMatchingBraceEnd(s, i);
      if (end !== -1) {
        const original = s.slice(i, end);
        const ph = makePlaceholder(mdxMap.length);
        mdxMap.push(original);
        out.push(ph);
        i = end;
        continue;
      }
    }
    out.push(s[i]!);
    i++;
  }

  // Create the JSX attribute text to append to segment
  let jsxAttributeText: string | undefined;
  if (jsxAttributeMap.length > 0) {
    jsxAttributeText = jsxAttributeMap.map((val, idx) => `||JXA${idx}: ${val}||`).join(" ");
  }

  return {
    protected: out.join(""),
    mdxMap,
    jsxAttributeMap: jsxAttributeMap.length > 0 ? jsxAttributeMap : undefined,
    jsxAttributeText,
  };
}

/**
 * Inverse of protectMdx. Accepts the canonical form and a lenient variant
 * (matches the hyphen-drift recovery for sloppy LLM output).
 * Also restores JSX attributes from `||JXA_N: …||` appendix segments and substitutes into `{{JXA_N}}`
 * inside preserved JSX fragments.
 */
export function restoreMdx(text: string, mdxMap: string[], jsxAttributeMap?: string[]): string {
  if (mdxMap.length === 0 && !jsxAttributeMap?.length) {
    return text;
  }

  let translatedText = text;
  const translatedByIndex = new Map<number, string>();

  if (jsxAttributeMap && jsxAttributeMap.length > 0) {
    const jxaPattern = /\|\|JXA(\d+):\s*(.*?)\|\|/gs;
    let match: RegExpExecArray | null;
    while ((match = jxaPattern.exec(translatedText)) !== null) {
      const idx = Number.parseInt(match[1]!, 10);
      translatedByIndex.set(idx, match[2]!.trim());
    }
    translatedText = translatedText.replace(/\s*\|\|JXA\d+:\s*.*?\|\|/gs, "");
  }

  const resolvedMap = mdxMap.map((entry) => {
    if (!jsxAttributeMap?.length) {
      return entry;
    }
    return entry.replace(/\{\{JXA_(\d+)\}\}/g, (_, digits: string) => {
      const i = Number.parseInt(digits, 10);
      const t = translatedByIndex.get(i);
      if (t !== undefined) {
        return t;
      }
      return jsxAttributeMap[i] ?? "";
    });
  });

  let restored = translatedText;
  for (let j = resolvedMap.length - 1; j >= 0; j--) {
    const flexible = new RegExp(`\\{\\{\\s*MDX[-_]${j}\\s*\\}\\}`, "g");
    restored = restored.replace(flexible, () => resolvedMap[j]!);
  }

  return restored;
}
