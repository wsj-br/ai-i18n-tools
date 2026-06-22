/*
 * HTML i18n marker support (catalog model, no per-locale HTML files).
 *
 * Markers (bare = boolean attribute, valued = explicit key):
 *   - `data-i18n`             -> source key = element textContent
 *   - `data-i18n-<attr>`      -> source key = the element's `<attr>` value (e.g. `data-i18n-title` -> `title`)
 *   - valued marker `data-i18n="Save"` -> the value is the key (escape hatch for mixed content / non-text keys)
 *   - `data-i18n-ignore`      -> skip the element when auto-marking
 *
 * The same source key must be produced by the browser runtime (`applyStaticI18n` in
 * `src/dashboard-app/app.js`), so `normalizeI18nText` is mirrored there verbatim.
 */
import type { UiStringLocation } from "./ui-string-locations.js";
import { uiStringHash } from "./ui-string-locations.js";

/** Default marker attributes. `data-i18n` => textContent; `data-i18n-<attr>` => that attribute's value. */
export const HTML_I18N_MARKERS = ["data-i18n", "data-i18n-title", "data-i18n-placeholder"] as const;

/** Attribute that opts an element out of auto-marking (`mark-html`). */
export const HTML_I18N_IGNORE_ATTR = "data-i18n-ignore";

const TEXT_MARKER = "data-i18n";
const ATTR_MARKER_PREFIX = "data-i18n-";

/** Raw-text / RCDATA elements whose contents must not be parsed as markup or marked for translation. */
const RAW_TEXT_ELEMENTS = new Set(["script", "style", "textarea"]);

/** Code-like elements that `mark-html` never auto-marks (snippets/commands are not translatable copy). */
const CODE_LIKE_ELEMENTS = new Set(["code", "pre", "kbd", "samp", "var"]);

/** HTML void elements (no closing tag / no text content). */
const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/**
 * Collapse insignificant whitespace so a multi-line / indented source text node produces the same key
 * as the browser's `el.textContent`. MUST stay identical to the copy mirrored in `app.js`.
 */
export function normalizeI18nText(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/** Decode the small entity set that appears in attribute/text source so keys match runtime values. */
export function decodeBasicHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&amp;/g, "&");
}

interface TextToken {
  kind: "text";
  text: string;
  start: number;
  end: number;
}

interface TagToken {
  kind: "tag";
  raw: string;
  name: string;
  isClose: boolean;
  isSelfClose: boolean;
  attrs: Map<string, string | null>;
  start: number;
  end: number;
}

interface OtherToken {
  kind: "other";
  start: number;
  end: number;
}

type Token = TextToken | TagToken | OtherToken;

const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function parseAttrs(s: string): Map<string, string | null> {
  const out = new Map<string, string | null>();
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(s)) !== null) {
    if (!m[1]) {
      ATTR_RE.lastIndex++;
      continue;
    }
    const name = m[1].toLowerCase();
    const value = m[2] === undefined ? null : (m[4] ?? m[5] ?? m[6] ?? "");
    if (!out.has(name)) {
      out.set(name, value);
    }
  }
  return out;
}

/** Index just past the `>` that closes the tag opening at `start`, honoring quoted attribute values. */
function findTagEnd(content: string, start: number): number {
  const n = content.length;
  let quote: string | null = null;
  for (let i = start + 1; i < n; i++) {
    const c = content[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      return i + 1;
    }
  }
  return n;
}

function parseTag(raw: string, start: number, end: number): TagToken {
  let body = raw.replace(/^</, "").replace(/>$/, "").trim();
  let isClose = false;
  if (body.startsWith("/")) {
    isClose = true;
    body = body.slice(1).trim();
  }
  let isSelfClose = false;
  if (body.endsWith("/")) {
    isSelfClose = true;
    body = body.slice(0, -1);
  }
  const nameMatch = body.match(/^([a-zA-Z][a-zA-Z0-9:-]*)/);
  const name = nameMatch ? nameMatch[1]!.toLowerCase() : "";
  const attrsStr = nameMatch ? body.slice(nameMatch[0].length) : "";
  return {
    kind: "tag",
    raw,
    name,
    isClose,
    isSelfClose,
    attrs: parseAttrs(attrsStr),
    start,
    end,
  };
}

function tokenizeHtml(content: string): Token[] {
  const tokens: Token[] = [];
  const n = content.length;
  let i = 0;
  while (i < n) {
    const lt = content.indexOf("<", i);
    if (lt === -1) {
      tokens.push({ kind: "text", text: content.slice(i), start: i, end: n });
      break;
    }
    if (lt > i) {
      tokens.push({ kind: "text", text: content.slice(i, lt), start: i, end: lt });
    }
    if (content.startsWith("<!--", lt)) {
      const close = content.indexOf("-->", lt + 4);
      const end = close === -1 ? n : close + 3;
      tokens.push({ kind: "other", start: lt, end });
      i = end;
      continue;
    }
    if (content[lt + 1] === "!" || content[lt + 1] === "?") {
      const gt = content.indexOf(">", lt);
      const end = gt === -1 ? n : gt + 1;
      tokens.push({ kind: "other", start: lt, end });
      i = end;
      continue;
    }
    const tagEnd = findTagEnd(content, lt);
    const tag = parseTag(content.slice(lt, tagEnd), lt, tagEnd);
    tokens.push(tag);
    i = tagEnd;
    // Raw-text elements (script/style/textarea): consume content verbatim so embedded `<` is not parsed.
    if (!tag.isClose && !tag.isSelfClose && RAW_TEXT_ELEMENTS.has(tag.name)) {
      const closeRe = new RegExp(`</${tag.name}\\s*>`, "i");
      closeRe.lastIndex = 0;
      const m = closeRe.exec(content.slice(tagEnd));
      const rawEnd = m ? tagEnd + m.index : n;
      if (rawEnd > tagEnd) {
        tokens.push({ kind: "other", start: tagEnd, end: rawEnd });
      }
      i = rawEnd;
    }
  }
  return tokens;
}

/** Token index of the close tag matching the open tag at `openIdx` (or last token when unbalanced). */
function matchingCloseIndex(tokens: Token[], openIdx: number): number {
  const open = tokens[openIdx];
  if (!open || open.kind !== "tag" || open.isSelfClose || VOID_ELEMENTS.has(open.name)) {
    return openIdx;
  }
  let depth = 1;
  for (let j = openIdx + 1; j < tokens.length; j++) {
    const tok = tokens[j]!;
    if (tok.kind !== "tag") {
      continue;
    }
    if (tok.isClose) {
      depth--;
      if (depth === 0) {
        return j;
      }
      continue;
    }
    if (!tok.isSelfClose && !VOID_ELEMENTS.has(tok.name)) {
      depth++;
    }
  }
  return tokens.length - 1;
}

/** 1-based line number of `index` in `content`. */
function lineAt(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content[i] === "\n") {
      line++;
    }
  }
  return line;
}

interface ElementContentInfo {
  /** Concatenated descendant text (raw, undecoded) — matches the browser `el.textContent`. */
  text: string;
  /** Concatenated DIRECT (immediate) child text only — used to decide leaf vs mixed content. */
  directText: string;
  /** True when the element has an immediate child element (mixed content when `directText` has letters). */
  hasChildElements: boolean;
}

/** Walk from an opening tag token to its matching close, collecting textContent and direct-child info. */
function elementContentInfo(tokens: Token[], openIdx: number): ElementContentInfo {
  let depth = 1;
  let text = "";
  let directText = "";
  let hasChildElements = false;
  for (let j = openIdx + 1; j < tokens.length && depth > 0; j++) {
    const tok = tokens[j]!;
    if (tok.kind === "text") {
      text += tok.text;
      if (depth === 1) {
        directText += tok.text;
      }
      continue;
    }
    if (tok.kind === "other") {
      continue;
    }
    if (tok.isClose) {
      depth--;
      continue;
    }
    if (depth === 1) {
      hasChildElements = true;
    }
    if (!tok.isSelfClose && !VOID_ELEMENTS.has(tok.name)) {
      depth++;
    }
  }
  return { text, directText, hasChildElements };
}

function markerSourceFor(tok: TagToken, marker: string, tokens: Token[], idx: number): string {
  const markerVal = tok.attrs.get(marker);
  if (markerVal !== null && markerVal !== undefined && markerVal !== "") {
    return normalizeI18nText(decodeBasicHtmlEntities(markerVal));
  }
  if (marker === TEXT_MARKER) {
    const info = elementContentInfo(tokens, idx);
    return normalizeI18nText(decodeBasicHtmlEntities(info.text));
  }
  if (marker.startsWith(ATTR_MARKER_PREFIX)) {
    const targetAttr = marker.slice(ATTR_MARKER_PREFIX.length);
    const attrVal = tok.attrs.get(targetAttr);
    return attrVal ? normalizeI18nText(decodeBasicHtmlEntities(attrVal)) : "";
  }
  return "";
}

export interface HtmlI18nString {
  /** Normalized, entity-decoded English source string (the catalog key). */
  value: string;
  /** 1-based line of the element. */
  line: number;
}

/** Collect English source strings declared by i18n markers in an HTML document. */
export function collectHtmlI18nStrings(
  content: string,
  markers: readonly string[] = HTML_I18N_MARKERS
): HtmlI18nString[] {
  const tokens = tokenizeHtml(content);
  const out: HtmlI18nString[] = [];
  for (let idx = 0; idx < tokens.length; idx++) {
    const tok = tokens[idx]!;
    if (tok.kind !== "tag" || tok.isClose) {
      continue;
    }
    if (tok.attrs.has(HTML_I18N_IGNORE_ATTR)) {
      idx = matchingCloseIndex(tokens, idx);
      continue;
    }
    const line = lineAt(content, tok.start);
    for (const marker of markers) {
      if (!tok.attrs.has(marker)) {
        continue;
      }
      const source = markerSourceFor(tok, marker, tokens, idx);
      if (source) {
        out.push({ value: source, line });
      }
    }
  }
  return out;
}

/** Collect per-hash source locations from one HTML file (merges into the shared location-map shape). */
export function collectHtmlI18nLocations(
  content: string,
  relPath: string,
  markers: readonly string[] = HTML_I18N_MARKERS
): Map<string, UiStringLocation[]> {
  const relNorm = relPath.replace(/\\/g, "/");
  const out = new Map<string, UiStringLocation[]>();
  const seen = new Set<string>();
  for (const s of collectHtmlI18nStrings(content, markers)) {
    const h = uiStringHash(s.value);
    const dedupeKey = `${h}:${relNorm}:${s.line}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    const list = out.get(h) ?? [];
    list.push({ file: relNorm, line: s.line });
    out.set(h, list);
  }
  return out;
}

export interface MarkHtmlSkipped {
  /** 1-based line of the element. */
  line: number;
  /** Tag name (e.g. `p`). */
  tag: string;
  /** Normalized text content that was NOT auto-marked. */
  text: string;
  /** Why the element was skipped for the text marker. */
  reason: "mixed-content";
}

export interface MarkHtmlResult {
  /** HTML with bare markers inserted. */
  output: string;
  /** Number of markers added. */
  added: number;
  /** Elements with translatable text + child elements that need manual `<span data-i18n>` handling. */
  skipped: MarkHtmlSkipped[];
}

function hasLetter(s: string): boolean {
  return /\p{L}/u.test(s);
}

/**
 * Insert bare i18n markers where missing. Adds `data-i18n` to leaf elements with non-empty, letter-bearing
 * text; `data-i18n-title` / `data-i18n-placeholder` to elements that carry those attributes. Skips empty
 * elements, `data-i18n-ignore` subtrees, already-marked attributes, and reports mixed-content elements.
 * Idempotent and bare-only (never emits a valued marker).
 */
export function markHtmlContent(content: string): MarkHtmlResult {
  const tokens = tokenizeHtml(content);
  const insertions: { index: number; text: string }[] = [];
  const skipped: MarkHtmlSkipped[] = [];
  let added = 0;

  for (let idx = 0; idx < tokens.length; idx++) {
    const tok = tokens[idx]!;
    if (tok.kind !== "tag" || tok.isClose) {
      continue;
    }
    if (tok.attrs.has(HTML_I18N_IGNORE_ATTR)) {
      idx = matchingCloseIndex(tokens, idx);
      continue;
    }

    const toAdd: string[] = [];

    const isLeafCandidate =
      !tok.isSelfClose && !VOID_ELEMENTS.has(tok.name) && !CODE_LIKE_ELEMENTS.has(tok.name);
    if (isLeafCandidate && !tok.attrs.has(TEXT_MARKER)) {
      const info = elementContentInfo(tokens, idx);
      // Decide on the element's OWN (direct) text so containers whose text lives in children are ignored.
      const directNorm = normalizeI18nText(decodeBasicHtmlEntities(info.directText));
      if (directNorm !== "" && hasLetter(directNorm)) {
        if (info.hasChildElements) {
          skipped.push({
            line: lineAt(content, tok.start),
            tag: tok.name,
            text: directNorm,
            reason: "mixed-content",
          });
        } else {
          toAdd.push(TEXT_MARKER);
        }
      }
    }

    for (const attr of ["title", "placeholder"]) {
      const marker = `${ATTR_MARKER_PREFIX}${attr}`;
      const v = tok.attrs.get(attr);
      if (typeof v === "string" && v.trim() !== "" && !tok.attrs.has(marker)) {
        toAdd.push(marker);
      }
    }

    if (toAdd.length > 0) {
      // Insert right after the last attribute char, before any trailing whitespace / self-close slash.
      let j = tok.end - 2; // char before '>'
      if (content[j] === "/") {
        j--;
      }
      while (j > tok.start && /\s/.test(content[j] ?? "")) {
        j--;
      }
      insertions.push({ index: j + 1, text: ` ${toAdd.join(" ")}` });
      added += toAdd.length;
    }
  }

  insertions.sort((a, b) => b.index - a.index);
  let output = content;
  for (const ins of insertions) {
    output = output.slice(0, ins.index) + ins.text + output.slice(ins.index);
  }

  return { output, added, skipped };
}
