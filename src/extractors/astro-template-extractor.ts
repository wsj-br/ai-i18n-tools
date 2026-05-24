import path from "path";
import type { Segment, SegmentTranslationMapValue } from "../core/types.js";
import { segmentTranslationText } from "../core/types.js";
import {
  type ExpressionProtectionContext,
  type ExpressionProtectionOptions,
  isProtectedAttributeName,
  isProtectedObjectKeyName,
  mergeExpressionProtectionContext,
  TRANSLATABLE_HTML_ATTRS,
} from "../processors/expression-attribute-protection.js";
import { BaseExtractor } from "./base-extractor.js";

const TRANSLATABLE_ATTR_RE = new RegExp(
  `\\b(${TRANSLATABLE_HTML_ATTRS.join("|")})\\s*=\\s*("([^"]*)"|'([^']*)')`,
  "gi"
);

export type AstroExtractOptions = ExpressionProtectionOptions;
export type AstroProtectionContext = ExpressionProtectionContext;
export const mergeAstroProtectionContext = mergeExpressionProtectionContext;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Extra `../` segments to prepend to relative imports in frontmatter when output is deeper. */
export type AstroReassembleContext = {
  importDepthDelta: number;
};

/**
 * Extract translatable text nodes and attribute values from `.astro` templates;
 * reassemble into locale-specific copies (parse-and-replace, no `t()` required).
 */
export class AstroTemplateExtractor extends BaseExtractor {
  readonly name = "astro";

  private reassembleContext: AstroReassembleContext = { importDepthDelta: 0 };
  private protectionContext: ExpressionProtectionContext = mergeExpressionProtectionContext();

  canHandle(filepath: string): boolean {
    return path.extname(filepath).toLowerCase() === ".astro";
  }

  /** Call before {@link reassemble} when the output path is deeper than the source (e.g. locale folder). */
  setReassembleContext(ctx: AstroReassembleContext): void {
    this.reassembleContext = ctx;
  }

  /** Call before {@link extract} to merge config-driven protected attribute/key lists. */
  setExtractOptions(options: AstroExtractOptions): void {
    this.protectionContext = mergeExpressionProtectionContext(options);
  }

  extract(content: string, filepath: string): Segment[] {
    void filepath;
    const segments: Omit<Segment, "id" | "hash">[] = [];
    let segmentIndex = 0;
    const fm = content.match(FRONTMATTER_RE);
    let templateStart = 0;
    let line = 1;

    if (fm) {
      segments.push({
        type: "other",
        content: fm[0]!,
        translatable: false,
        startLine: 1,
      });
      templateStart = fm[0]!.length;
      line = countLines(fm[0]!) + 1;
    }

    segments.push(
      ...parseAstroTemplate(content.slice(templateStart), line, this.protectionContext)
    );

    return segments.map((seg) => ({
      id: `seg-${segmentIndex++}`,
      ...seg,
      hash: this.computeHash(seg.content),
    }));
  }

  reassemble(segments: Segment[], translations: Map<string, SegmentTranslationMapValue>): string {
    const merged = escapeExpressionStringTranslations(segments, translations);
    const delta = this.reassembleContext.importDepthDelta;
    let out = "";
    for (const seg of merged) {
      let chunk = seg.content;
      if (delta > 0 && seg.type === "other" && /^\s*---/.test(chunk)) {
        chunk = adjustRelativeImportsInFrontmatter(chunk, delta);
      }
      out += chunk;
    }
    return out;
  }
}

function countLines(text: string): number {
  if (text.length === 0) {
    return 0;
  }
  return (text.match(/\n/g)?.length ?? 0) + 1;
}

function lineAt(text: string, index: number): number {
  return countLines(text.slice(0, index));
}

function parseAstroTemplate(
  template: string,
  startLine: number,
  protection: ExpressionProtectionContext
): Omit<Segment, "id" | "hash">[] {
  const segments: Omit<Segment, "id" | "hash">[] = [];
  let i = 0;
  let line = startLine;
  let pendingNonTranslatable = "";

  const flushPending = () => {
    if (pendingNonTranslatable.length > 0) {
      segments.push({
        type: "other",
        content: pendingNonTranslatable,
        translatable: false,
        startLine: line,
      });
      pendingNonTranslatable = "";
    }
  };

  while (i < template.length) {
    const rest = template.slice(i);

    const blockOpen = rest.match(/^<(style|script)\b/i);
    if (blockOpen && isTagOpenAt(template, i)) {
      flushPending();
      const name = blockOpen[1]!.toLowerCase();
      const end = findClosingTag(template, i, name);
      const block = template.slice(i, end);
      segments.push({
        type: "code",
        content: block,
        translatable: false,
        startLine: line,
      });
      i = end;
      line = lineAt(template, i) + startLine;
      continue;
    }

    if (template[i] === "{") {
      flushPending();
      const end = findMatchingBrace(template, i);
      segments.push(...parseExpressionBlock(template.slice(i, end), line, protection));
      i = end;
      line = lineAt(template, i) + startLine;
      continue;
    }

    if (rest.startsWith("<!--")) {
      flushPending();
      const end = template.indexOf("-->", i);
      const close = end === -1 ? template.length : end + 3;
      segments.push({
        type: "other",
        content: template.slice(i, close),
        translatable: false,
        startLine: line,
      });
      i = close;
      line = lineAt(template, i) + startLine;
      continue;
    }

    if (template[i] === "<") {
      flushPending();
      const tagEnd = findTagEnd(template, i);
      const tag = template.slice(i, tagEnd);
      segments.push(...parseHtmlTag(tag, line, protection));
      i = tagEnd;
      line = lineAt(template, i) + startLine;
      continue;
    }

    const textEnd = findTextEnd(template, i);
    if (textEnd > i) {
      flushPending();
      const text = template.slice(i, textEnd);
      const classified = classifyTextNode(text, line);
      if (classified) {
        segments.push(classified);
      } else if (text.length > 0) {
        pendingNonTranslatable += text;
      }
      i = textEnd;
      line = lineAt(template, i) + startLine;
      continue;
    }

    pendingNonTranslatable += template[i]!;
    i++;
  }

  flushPending();
  return segments;
}

function isTagOpenAt(text: string, index: number): boolean {
  return text[index] === "<";
}

function findTextEnd(text: string, start: number): number {
  let i = start;
  while (i < text.length && text[i] !== "<" && text[i] !== "{") {
    i++;
  }
  return i;
}

function findTagEnd(text: string, start: number): number {
  let i = start + 1;
  let quote: '"' | "'" | null = null;
  while (i < text.length) {
    const c = text[i]!;
    if (quote) {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === quote) {
        quote = null;
      }
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      i++;
      continue;
    }
    if (c === ">") {
      return i + 1;
    }
    i++;
  }
  return text.length;
}

function findClosingTag(text: string, start: number, tagName: string): number {
  const re = new RegExp(`</${tagName}\\s*>`, "i");
  const slice = text.slice(start);
  const m = re.exec(slice);
  if (!m || m.index === undefined) {
    return text.length;
  }
  return start + m.index + m[0].length;
}

/** Balanced `{ … }` for Astro/JSX expressions (strings and line comments skipped). */
export function findMatchingBrace(text: string, start: number): number {
  if (text[start] !== "{") {
    return start + 1;
  }
  let depth = 0;
  let i = start;
  let quote: '"' | "'" | "`" | null = null;
  let lineComment = false;
  let blockComment = false;

  while (i < text.length) {
    const c = text[i]!;
    const next = text[i + 1];

    if (lineComment) {
      if (c === "\n") {
        lineComment = false;
      }
      i++;
      continue;
    }
    if (blockComment) {
      if (c === "*" && next === "/") {
        blockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (quote) {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (quote === "`" && c === "$" && next === "{") {
        i += 2;
        const innerEnd = findMatchingBrace(text, i - 1);
        i = innerEnd;
        continue;
      }
      if (c === quote) {
        quote = null;
      }
      i++;
      continue;
    }
    if (c === "/" && next === "/") {
      lineComment = true;
      i += 2;
      continue;
    }
    if (c === "/" && next === "*") {
      blockComment = true;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      i++;
      continue;
    }
    if (c === "{") {
      depth++;
      i++;
      continue;
    }
    if (c === "}") {
      depth--;
      i++;
      if (depth === 0) {
        return i;
      }
      continue;
    }
    i++;
  }
  return text.length;
}

function parseHtmlTag(
  tag: string,
  startLine: number,
  protection: ExpressionProtectionContext
): Omit<Segment, "id" | "hash">[] {
  const segments: Omit<Segment, "id" | "hash">[] = [];
  let lastIndex = 0;
  TRANSLATABLE_ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TRANSLATABLE_ATTR_RE.exec(tag)) !== null) {
    const attrName = (m[1] ?? "").toLowerCase();
    if (m.index > lastIndex) {
      segments.push({
        type: "other",
        content: tag.slice(lastIndex, m.index),
        translatable: false,
        startLine: startLine,
      });
    }
    const attrChunk = m[0]!;
    if (isProtectedAttributeName(attrName, protection)) {
      segments.push({
        type: "other",
        content: attrChunk,
        translatable: false,
        startLine: startLine,
      });
      lastIndex = m.index + attrChunk.length;
      continue;
    }
    const value = m[3] ?? m[4] ?? "";
    const valueStart = attrChunk.indexOf(value);
    const beforeValue = attrChunk.slice(0, valueStart);
    const afterValue = attrChunk.slice(valueStart + value.length);
    segments.push({
      type: "other",
      content: beforeValue,
      translatable: false,
      startLine: startLine,
    });
    if (isTranslatablePlainText(value)) {
      segments.push({
        type: "paragraph",
        content: value,
        translatable: true,
        startLine: startLine,
      });
    } else {
      segments.push({
        type: "other",
        content: value,
        translatable: false,
        startLine: startLine,
      });
    }
    segments.push({
      type: "other",
      content: afterValue,
      translatable: false,
      startLine: startLine,
    });
    lastIndex = m.index + attrChunk.length;
  }
  if (lastIndex < tag.length) {
    segments.push({
      type: "other",
      content: tag.slice(lastIndex),
      translatable: false,
      startLine: startLine,
    });
  }
  if (segments.length === 0) {
    segments.push({
      type: "other",
      content: tag,
      translatable: false,
      startLine: startLine,
    });
  }
  return segments;
}

function classifyTextNode(text: string, startLine: number): Omit<Segment, "id" | "hash"> | null {
  if (!isTranslatablePlainText(text)) {
    return null;
  }
  return {
    type: "paragraph",
    content: text,
    translatable: true,
    startLine,
  };
}

/** Split a `{ … }` expression into segments, extracting translatable string literals inline. */
function parseExpressionBlock(
  block: string,
  startLine: number,
  protection: ExpressionProtectionContext
): Omit<Segment, "id" | "hash">[] {
  const inner = parseExpressionStringLiterals(block, protection);
  if (!inner.some((s) => s.translatable)) {
    return [{ type: "other", content: block, translatable: false, startLine }];
  }
  return inner.map((s) => ({ ...s, startLine }));
}

/** Walk an expression block and mark quoted string values as translatable segments. */
function parseExpressionStringLiterals(
  block: string,
  protection: ExpressionProtectionContext
): Omit<Segment, "id" | "hash" | "startLine">[] {
  const segments: Omit<Segment, "id" | "hash" | "startLine">[] = [];
  let i = 0;
  let pending = "";

  const flushPending = () => {
    if (pending.length > 0) {
      segments.push({ type: "other", content: pending, translatable: false });
      pending = "";
    }
  };

  while (i < block.length) {
    const c = block[i]!;
    const next = block[i + 1];

    if (c === "/" && next === "/") {
      const nl = block.indexOf("\n", i);
      const end = nl === -1 ? block.length : nl;
      pending += block.slice(i, end);
      i = end;
      continue;
    }
    if (c === "/" && next === "*") {
      const end = block.indexOf("*/", i + 2);
      const close = end === -1 ? block.length : end + 2;
      pending += block.slice(i, close);
      i = close;
      continue;
    }

    if (c === "'" || c === '"') {
      const quote = c;
      const literalEnd = findStringLiteralEnd(block, i);
      const raw = block.slice(i, literalEnd);
      const inner = unescapeJsString(raw.slice(1, -1), quote);
      const before = pending;

      if (isTranslatableExpressionString(inner, before, protection)) {
        flushPending();
        pending = quote;
        flushPending();
        segments.push({ type: "paragraph", content: inner, translatable: true });
        pending = quote;
      } else {
        pending += raw;
      }
      i = literalEnd;
      continue;
    }

    if (c === "`") {
      const literalEnd = findTemplateLiteralEnd(block, i);
      pending += block.slice(i, literalEnd);
      i = literalEnd;
      continue;
    }

    pending += c;
    i++;
  }

  flushPending();
  return segments;
}

function findStringLiteralEnd(text: string, start: number): number {
  const quote = text[start]!;
  let i = start + 1;
  while (i < text.length) {
    const c = text[i]!;
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === quote) {
      return i + 1;
    }
    i++;
  }
  return text.length;
}

function findTemplateLiteralEnd(text: string, start: number): number {
  let i = start + 1;
  while (i < text.length) {
    const c = text[i]!;
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === "$" && text[i + 1] === "{") {
      i += 2;
      const innerEnd = findMatchingBrace(text, i - 1);
      i = innerEnd;
      continue;
    }
    if (c === "`") {
      return i + 1;
    }
    i++;
  }
  return text.length;
}

function unescapeJsString(text: string, quote: "'" | '"'): string {
  void quote;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (c !== "\\") {
      out += c;
      continue;
    }
    const esc = text[i + 1];
    if (esc === undefined) {
      out += c;
      continue;
    }
    switch (esc) {
      case "n":
        out += "\n";
        break;
      case "r":
        out += "\r";
        break;
      case "t":
        out += "\t";
        break;
      case "\\":
      case "'":
      case '"':
      case "`":
        out += esc;
        break;
      default:
        out += esc;
        break;
    }
    i++;
  }
  return out;
}

function escapeJsString(text: string, quote: "'" | '"'): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(new RegExp(quote, "g"), `\\${quote}`)
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/** True when a quoted string in an expression is a protected HTML/JSX attribute or object key value. */
export function isProtectedExpressionAttributeValue(
  before: string,
  protection: ExpressionProtectionContext = mergeExpressionProtectionContext()
): boolean {
  const attrMatch = before.match(/(?:^|[\s({[/])([\w:-]+)\s*=\s*$/);
  if (attrMatch) {
    return isProtectedAttributeName(attrMatch[1]!, protection);
  }

  const propMatch = before.match(/(?:^|[\s,{])([\w$]+)\s*:\s*$/);
  if (propMatch) {
    return isProtectedObjectKeyName(propMatch[1]!, protection);
  }

  return false;
}

/** True for user-facing string literals inside `{expression}` blocks (not URLs, code, or `t()` keys). */
export function isTranslatableExpressionString(
  text: string,
  before: string,
  protection: ExpressionProtectionContext = mergeExpressionProtectionContext()
): boolean {
  if (!isTranslatablePlainText(text)) {
    return false;
  }
  if (isProtectedExpressionAttributeValue(before, protection)) {
    return false;
  }
  if (/t\s*\(\s*$/.test(before)) {
    return false;
  }
  if (/^https?:\/\//i.test(text)) {
    return false;
  }
  if (/^#/.test(text)) {
    return false;
  }
  if (/^\d+$/.test(text)) {
    return false;
  }
  if (/^(docker |npm |pnpm |npx |git |OPENROUTER_API_KEY=)/i.test(text)) {
    return false;
  }
  if (/docker run|sk-or-v1-|ghcr\.io/i.test(text)) {
    return false;
  }
  return true;
}

function escapeExpressionStringTranslations(
  segments: Segment[],
  translations: Map<string, SegmentTranslationMapValue>
): Segment[] {
  const merged = segments.map((s) => ({
    ...s,
    content: s.translatable
      ? (segmentTranslationText(translations.get(s.hash)) ?? s.content)
      : s.content,
  }));

  for (let i = 0; i < merged.length; i++) {
    const seg = merged[i]!;
    if (!seg.translatable) {
      continue;
    }
    const prev = merged[i - 1]?.content ?? "";
    const next = merged[i + 1]?.content ?? "";
    const openQuote = prev.endsWith("'") ? "'" : prev.endsWith('"') ? '"' : null;
    const closeQuote = next.startsWith("'") ? "'" : next.startsWith('"') ? '"' : null;
    const quote = openQuote ?? closeQuote;
    if (quote) {
      seg.content = escapeJsString(seg.content, quote);
    }
  }

  return merged;
}

/** True when the chunk contains letters/digits worth sending to the translator. */
export function isTranslatablePlainText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }
  if (/^<br\s*\/?>$/i.test(trimmed)) {
    return false;
  }
  const withoutTags = trimmed.replace(/<[^>]+>/g, "");
  const textOnly = withoutTags
    .replace(/[*_#>-]/g, "")
    .replace(/[()[\]{}]/g, "")
    .trim();
  return /[A-Za-z0-9]/.test(textOnly);
}

/** Prepend `../` segments to relative `from '…'` / `import '…'` paths in frontmatter. */
export function adjustRelativeImportsInFrontmatter(
  frontmatterBlock: string,
  depthDelta: number
): string {
  if (depthDelta <= 0) {
    return frontmatterBlock;
  }
  const extra = "../".repeat(depthDelta);
  return frontmatterBlock.replace(
    /((?:import|export)\s+(?:[\w*{}\s,]+\s+from\s+|type\s+[\w*{}\s,]+\s+from\s+)?['"])(\.\.?\/)/g,
    `$1${extra}$2`
  );
}

/** Depth delta between output and source paths (posix segments minus filename). */
export function computeImportDepthDelta(sourceRelPosix: string, outputRelPosix: string): number {
  const sourceDir = path.posix.dirname(sourceRelPosix);
  const outputDir = path.posix.dirname(outputRelPosix);
  const sourceDepth = sourceDir === "." ? 0 : sourceDir.split("/").filter(Boolean).length;
  const outputDepth = outputDir === "." ? 0 : outputDir.split("/").filter(Boolean).length;
  return Math.max(0, outputDepth - sourceDepth);
}
