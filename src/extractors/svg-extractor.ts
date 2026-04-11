import type { Segment } from "../core/types.js";
import { BaseExtractor } from "./base-extractor.js";

const TEXT_TAG_RE = /<text([\s\S]*?)>([\s\S]*?)<\/text>/gi;
const TITLE_TAG_RE = /<title([\s\S]*?)>([\s\S]*?)<\/title>/gi;
const DESC_TAG_RE = /<desc([\s\S]*?)>([\s\S]*?)<\/desc>/gi;

function extractTextFromXml(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface SvgExtractorOptions {
  forceLowercase?: boolean;
}

/**
 * SVG `<text>` / `<title>` / `<desc>` extraction (regex-based).
 * `reassemble` uses the SVG from the last `extract` call on this instance.
 */
export class SvgExtractor extends BaseExtractor {
  readonly name = "svg";

  private lastSvg = "";

  constructor(private readonly options: SvgExtractorOptions = {}) {
    super();
  }

  canHandle(filepath: string): boolean {
    return filepath.toLowerCase().endsWith(".svg");
  }

  extract(content: string, filepath: string): Segment[] {
    void filepath;
    this.lastSvg = content;
    const segments: Segment[] = [];
    let i = 0;

    let match: RegExpExecArray | null;
    TEXT_TAG_RE.lastIndex = 0;
    while ((match = TEXT_TAG_RE.exec(content)) !== null) {
      const attrs = match[1] ?? "";
      const innerContent = match[2] ?? "";
      const text = extractTextFromXml(innerContent);
      if (!text) {
        continue;
      }
      const fullMatch = match[0];
      const openingTag = `<text${attrs}>`;
      segments.push({
        id: `svg-${i++}`,
        type: "svg-text",
        content: text,
        hash: this.computeHash(text),
        translatable: true,
        svg: { element: "text", fullMatch, openingTag },
      });
    }

    TITLE_TAG_RE.lastIndex = 0;
    while ((match = TITLE_TAG_RE.exec(content)) !== null) {
      const attrs = match[1] ?? "";
      const innerContent = match[2] ?? "";
      const text = extractTextFromXml(innerContent);
      if (!text) {
        continue;
      }
      const fullMatch = match[0];
      const openingTag = (attrs || "").trim();
      segments.push({
        id: `svg-${i++}`,
        type: "svg-text",
        content: text,
        hash: this.computeHash(text),
        translatable: true,
        svg: { element: "title", fullMatch, openingTag },
      });
    }

    DESC_TAG_RE.lastIndex = 0;
    while ((match = DESC_TAG_RE.exec(content)) !== null) {
      const attrs = match[1] ?? "";
      const innerContent = match[2] ?? "";
      const text = extractTextFromXml(innerContent);
      if (!text) {
        continue;
      }
      const fullMatch = match[0];
      const openingTag = (attrs || "").trim();
      segments.push({
        id: `svg-${i++}`,
        type: "svg-text",
        content: text,
        hash: this.computeHash(text),
        translatable: true,
        svg: { element: "desc", fullMatch, openingTag },
      });
    }

    return segments;
  }

  reassemble(segments: Segment[], translations: Map<string, string>): string {
    if (!this.lastSvg) {
      throw new Error("SvgExtractor.reassemble: call extract() first");
    }
    let result = this.lastSvg;
    const merged = this.mergeTranslations(segments, translations);

    for (const segment of merged) {
      const meta = segment.svg;
      if (!meta) {
        continue;
      }
      let out = segment.content;
      if (this.options.forceLowercase) {
        out = out.toLowerCase();
      }
      const escaped = escapeXml(out);
      if (meta.element === "text") {
        const newContent = `${meta.openingTag}<tspan>${escaped}</tspan></text>`;
        result = result.replace(meta.fullMatch, newContent);
      } else if (meta.element === "title") {
        const attrs = meta.openingTag ? ` ${meta.openingTag}` : "";
        const newContent = `<title${attrs}>${escaped}</title>`;
        result = result.replace(meta.fullMatch, newContent);
      } else {
        const attrs = meta.openingTag ? ` ${meta.openingTag}` : "";
        const newContent = `<desc${attrs}>${escaped}</desc>`;
        result = result.replace(meta.fullMatch, newContent);
      }
    }

    return result;
  }
}
