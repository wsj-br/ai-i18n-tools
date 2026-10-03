import path from "path";
import type { Segment, SegmentTranslationMapValue } from "../core/types.js";
import { segmentTranslationText } from "../core/types.js";
import { getTextDirection } from "../runtime/i18next-helpers.js";
import { protectHtmlTags, restoreHtmlTags } from "../processors/html-tag-placeholders.js";
import { BaseExtractor } from "./base-extractor.js";
import { type HtmlToken, htmlMatchingCloseIndex, tokenizeHtml } from "./html-i18n-marks.js";

const INLINE = new Set([
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "br",
  "cite",
  "code",
  "em",
  "i",
  "img",
  "kbd",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
  "var",
  "wbr",
]);

const VOID = new Set([
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

/** Elements whose entire subtree is copied through unchanged. */
const PROTECTED_ELEMENTS = new Set(["script", "style", "textarea", "pre", "code"]);

const TEXT_ATTRS = new Set(["alt", "title", "aria-label", "placeholder"]);

export interface HtmlReassembleContext {
  /** When set, `<html lang>` and `dir` are updated for this locale. */
  locale?: string;
  dir?: "ltr" | "rtl";
}

type Draft = Omit<Segment, "id" | "hash"> & { tagMap?: string[] };

/**
 * Extract translatable text and attributes from an HTML document and reassemble
 * a locale copy. With no locale context and identity translations, output matches
 * the source byte for byte.
 */
export class HtmlTemplateExtractor extends BaseExtractor {
  readonly name = "html";

  canHandle(filepath: string): boolean {
    const ext = path.extname(filepath).toLowerCase();
    return ext === ".html" || ext === ".htm";
  }

  private tagMaps = new Map<string, string[]>();
  private context: HtmlReassembleContext = {};
  /** Non-UTF-8 charset declarations seen during the last {@link extract}. */
  charsetWarnings: string[] = [];

  setReassembleContext(ctx: HtmlReassembleContext): void {
    this.context = ctx;
  }

  extract(content: string, filepath: string): Segment[] {
    void filepath;
    this.tagMaps.clear();
    this.charsetWarnings = charsetWarnings(content);
    const tokens = tokenizeHtml(content);
    const drafts: Draft[] = [];
    let i = 0;
    while (i < tokens.length) {
      const tok = tokens[i]!;
      if (tok.kind === "tag" && !tok.isClose && PROTECTED_ELEMENTS.has(tok.name)) {
        const closeIdx = htmlMatchingCloseIndex(tokens, i);
        const endTok = tokens[closeIdx] ?? tok;
        pushRaw(drafts, content.slice(tok.start, endTok.end), lineAt(content, tok.start));
        i = closeIdx + 1;
        continue;
      }
      if (
        tok.kind === "tag" &&
        !tok.isClose &&
        !tok.isSelfClose &&
        !VOID.has(tok.name) &&
        isInlineContainer(tokens, i)
      ) {
        const closeIdx = htmlMatchingCloseIndex(tokens, i);
        const close = tokens[closeIdx];
        pushTag(drafts, content, tok, lineAt(content, tok.start));
        if (close && close.kind === "tag" && close.start > tok.end) {
          pushInner(drafts, content.slice(tok.end, close.start), lineAt(content, tok.end));
          pushRaw(drafts, content.slice(close.start, close.end), lineAt(content, close.start));
        }
        i = closeIdx + 1;
        continue;
      }
      if (tok.kind === "tag" && !tok.isClose) {
        pushTag(drafts, content, tok, lineAt(content, tok.start));
      } else if (tok.kind === "text") {
        pushText(drafts, tok.text, lineAt(content, tok.start));
      } else {
        pushRaw(drafts, content.slice(tok.start, tok.end), lineAt(content, tok.start));
      }
      i++;
    }

    let segmentIndex = 0;
    return mergeRaw(drafts).map((draft) => {
      const id = `seg-${segmentIndex++}`;
      if (draft.tagMap) this.tagMaps.set(id, draft.tagMap);
      return {
        id,
        type: draft.type,
        content: draft.content,
        translatable: draft.translatable,
        startLine: draft.startLine,
        hash: this.computeHash(draft.content),
      };
    });
  }

  reassemble(segments: Segment[], translations: Map<string, SegmentTranslationMapValue>): string {
    let out = "";
    for (const seg of segments) {
      if (!seg.translatable) {
        out += seg.content;
        continue;
      }
      const translated = segmentTranslationText(translations.get(seg.hash)) ?? seg.content;
      const map = this.tagMaps.get(seg.id);
      out += map && map.length > 0 ? restoreHtmlTags(translated, map) : translated;
    }
    if (this.context.locale) {
      const dir = this.context.dir ?? getTextDirection(this.context.locale);
      out = applyHtmlLocale(out, this.context.locale, dir);
    }
    return out;
  }
}

function lineAt(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content[i] === "\n") line++;
  }
  return line;
}

function hasLetter(s: string): boolean {
  return /\p{L}/u.test(s);
}

function pushRaw(drafts: Draft[], text: string, startLine: number): void {
  if (!text) return;
  drafts.push({ type: "other", content: text, translatable: false, startLine });
}

function pushText(drafts: Draft[], text: string, startLine: number): void {
  if (!text) return;
  if (hasLetter(text)) {
    drafts.push({ type: "other", content: text, translatable: true, startLine });
  } else {
    pushRaw(drafts, text, startLine);
  }
}

function pushInner(drafts: Draft[], inner: string, startLine: number): void {
  if (!inner) return;
  if (!hasLetter(inner)) {
    pushRaw(drafts, inner, startLine);
    return;
  }
  const protectedTags = protectMixedInner(inner);
  drafts.push({
    type: "other",
    content: protectedTags.protected,
    translatable: true,
    startLine,
    ...(protectedTags.htmlTagMap.length > 0 ? { tagMap: protectedTags.htmlTagMap } : {}),
  });
}

/** Keep `<code>` / `<kbd>` / void inline tags intact, then placeholder the remaining tags. */
function protectMixedInner(inner: string): { protected: string; htmlTagMap: string[] } {
  const atomic: string[] = [];
  const atomicRe = /<(code|kbd|samp|var)\b[^>]*>[\s\S]*?<\/\1\s*>|<(img|br|wbr)\b[^>]*\/?>/gi;
  const marked = inner.replace(atomicRe, (match) => {
    const placeholder = `{{AT_${atomic.length}}}`;
    atomic.push(match);
    return placeholder;
  });
  const tags = protectHtmlTags(marked);
  const htmlTagMap = [...tags.htmlTagMap];
  const protectedText = tags.protected.replace(/\{\{AT_(\d+)\}\}/g, (_full, index: string) => {
    const placeholder = `{{HTM_${htmlTagMap.length}}}`;
    htmlTagMap.push(atomic[Number(index)] ?? "");
    return placeholder;
  });
  return { protected: protectedText, htmlTagMap };
}

function isInlineContainer(tokens: HtmlToken[], openIdx: number): boolean {
  const open = tokens[openIdx];
  if (!open || open.kind !== "tag") return false;
  const closeIdx = htmlMatchingCloseIndex(tokens, openIdx);
  let hasElement = false;
  let hasText = false;
  for (let j = openIdx + 1; j < closeIdx; j++) {
    const tok = tokens[j]!;
    if (tok.kind === "text") {
      if (hasLetter(tok.text)) hasText = true;
      continue;
    }
    if (tok.kind !== "tag" || tok.isClose) continue;
    if (!INLINE.has(tok.name)) return false;
    hasElement = true;
    if (!tok.isSelfClose && !VOID.has(tok.name)) {
      j = htmlMatchingCloseIndex(tokens, j);
    }
  }
  return hasElement && hasText;
}

function pushTag(
  drafts: Draft[],
  content: string,
  tok: Extract<HtmlToken, { kind: "tag" }>,
  startLine: number
): void {
  const raw = content.slice(tok.start, tok.end);
  const spans = attrValueSpans(raw, tok);
  if (spans.length === 0) {
    pushRaw(drafts, raw, startLine);
    return;
  }
  let cursor = 0;
  for (const span of spans) {
    pushRaw(drafts, raw.slice(cursor, span.start), startLine);
    drafts.push({
      type: "other",
      content: raw.slice(span.start, span.end),
      translatable: true,
      startLine,
    });
    cursor = span.end;
  }
  pushRaw(drafts, raw.slice(cursor), startLine);
}

interface AttrSpan {
  start: number;
  end: number;
}

function attrValueSpans(raw: string, tok: Extract<HtmlToken, { kind: "tag" }>): AttrSpan[] {
  const spans: AttrSpan[] = [];
  const names = translatableAttrNames(tok);
  for (const name of names) {
    const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");
    const match = re.exec(raw);
    if (!match || match.index === undefined) continue;
    const quoted = match[1] ?? "";
    const value = match[2] ?? match[3] ?? "";
    if (!hasLetter(value)) continue;
    const valueStart = match.index + match[0].length - quoted.length + 1;
    spans.push({ start: valueStart, end: valueStart + value.length });
  }
  spans.sort((a, b) => a.start - b.start);
  return spans;
}

function translatableAttrNames(tok: Extract<HtmlToken, { kind: "tag" }>): string[] {
  const names: string[] = [];
  for (const name of TEXT_ATTRS) {
    if (tok.attrs.has(name)) names.push(name);
  }
  if (tok.name === "input") {
    const type = (tok.attrs.get("type") ?? "").toLowerCase();
    if ((type === "submit" || type === "button") && tok.attrs.has("value")) names.push("value");
  }
  if (tok.name === "meta" && tok.attrs.has("content") && metaContentIsTranslatable(tok)) {
    names.push("content");
  }
  return names;
}

function metaContentIsTranslatable(tok: Extract<HtmlToken, { kind: "tag" }>): boolean {
  const name = (tok.attrs.get("name") ?? "").toLowerCase();
  const property = (tok.attrs.get("property") ?? "").toLowerCase();
  return name === "description" || property === "og:title" || property === "og:description";
}

function mergeRaw(drafts: Draft[]): Draft[] {
  const out: Draft[] = [];
  for (const draft of drafts) {
    const prev = out[out.length - 1];
    if (
      prev &&
      !prev.translatable &&
      !draft.translatable &&
      !prev.tagMap &&
      !draft.tagMap &&
      prev.type === "other" &&
      draft.type === "other"
    ) {
      prev.content += draft.content;
      continue;
    }
    out.push({ ...draft });
  }
  return out;
}

function charsetWarnings(content: string): string[] {
  const warnings: string[] = [];
  const re = /<meta\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const tag = match[0];
    const charset = /\bcharset\s*=\s*["']?\s*([^"'\s/>]+)/i.exec(tag);
    if (charset?.[1] && charset[1].toLowerCase() !== "utf-8") {
      warnings.push(`<meta charset> is ${charset[1]}, expected utf-8`);
    }
  }
  return warnings;
}

/** Set or insert `lang` and `dir` on the first `<html>` tag. */
export function applyHtmlLocale(html: string, locale: string, dir: "ltr" | "rtl"): string {
  const re = /<html\b([^>]*)>/i;
  const match = re.exec(html);
  if (!match || match.index === undefined) return html;
  let attrs = match[1] ?? "";
  attrs = upsertAttr(attrs, "lang", locale);
  attrs = upsertAttr(attrs, "dir", dir);
  const next = `<html${attrs}>`;
  return html.slice(0, match.index) + next + html.slice(match.index + match[0].length);
}

function upsertAttr(attrs: string, name: string, value: string): string {
  const re = new RegExp(`\\s${name}\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)`, "i");
  if (re.test(attrs)) {
    return attrs.replace(re, ` ${name}="${value}"`);
  }
  return `${attrs} ${name}="${value}"`;
}

export function htmlOutputExtension(filepath: string): boolean {
  const ext = path.extname(filepath).toLowerCase();
  return ext === ".html" || ext === ".htm";
}
