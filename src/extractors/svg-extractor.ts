import type { Segment, SegmentTranslationMapValue } from "../core/types.js";
import { BaseExtractor } from "./base-extractor.js";

type SvgElementName = "text" | "title" | "desc";

interface SvgElementMatch {
  attrs: string;
  inner: string;
  fullMatch: string;
}

/**
 * Match `<tag …>inner</tag>` without treating a same-prefix name (`<textPath>`) as `<text>`,
 * and without pairing a self-closing `<tag … />` with a later `</tag>`.
 */
function matchSvgElements(svg: string, tag: SvgElementName): SvgElementMatch[] {
  const re = new RegExp(
    `<${tag}(?=[\\s>/])((?:[^>"']|"[^"]*"|'[^']*')*?)\\s*(?:/>|>([\\s\\S]*?)</${tag}\\s*>)`,
    "gi"
  );
  const out: SvgElementMatch[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(svg)) !== null) {
    const inner = match[2];
    if (inner === undefined) {
      continue;
    }
    out.push({
      attrs: match[1] ?? "",
      inner,
      fullMatch: match[0],
    });
  }
  return out;
}

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

/**
 * Reverse XML escapes models often echo in translated text (aligned with batch XML response
 * decoding in `prompt-builder`). Applied before {@link escapeXml} so e.g. `&gt;` from the model
 * does not become `&amp;gt;`. Iterates until stable so values like `&amp;gt;` decode fully.
 */
function decodeXmlEntitiesFromModel(text: string): string {
  let s = text;
  for (let round = 0; round < 8; round++) {
    const next = s
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    if (next === s) {
      break;
    }
    s = next;
  }
  return s;
}

function openingTagFor(element: SvgElementName, attrs: string): string {
  switch (element) {
    case "text":
      return `<text${attrs}>`;
    case "title":
    case "desc":
      return (attrs || "").trim();
    default: {
      const _exhaustive: never = element;
      return _exhaustive;
    }
  }
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

    const elements: SvgElementName[] = ["text", "title", "desc"];
    for (const element of elements) {
      for (const found of matchSvgElements(content, element)) {
        const text = extractTextFromXml(found.inner);
        if (!text) {
          continue;
        }
        segments.push({
          id: `svg-${i++}`,
          type: "svg-text",
          content: text,
          hash: this.computeHash(text),
          translatable: true,
          svg: {
            element,
            fullMatch: found.fullMatch,
            openingTag: openingTagFor(element, found.attrs),
          },
        });
      }
    }

    return segments;
  }

  reassemble(segments: Segment[], translations: Map<string, SegmentTranslationMapValue>): string {
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
      out = decodeXmlEntitiesFromModel(out);
      const escaped = escapeXml(out);
      let newContent: string;
      switch (meta.element) {
        case "text":
          newContent = `${meta.openingTag}<tspan>${escaped}</tspan></text>`;
          break;
        case "title": {
          const attrs = meta.openingTag ? ` ${meta.openingTag}` : "";
          newContent = `<title${attrs}>${escaped}</title>`;
          break;
        }
        case "desc": {
          const attrs = meta.openingTag ? ` ${meta.openingTag}` : "";
          newContent = `<desc${attrs}>${escaped}</desc>`;
          break;
        }
        default: {
          const _exhaustive: never = meta.element;
          return _exhaustive;
        }
      }
      result = result.replace(meta.fullMatch, () => newContent);
    }

    return result;
  }
}
