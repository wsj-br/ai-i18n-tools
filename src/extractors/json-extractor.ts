import type { Segment, SegmentTranslationMapValue } from "../core/types.js";
import { BaseExtractor } from "./base-extractor.js";

interface I18nEntry {
  message: string;
  description?: string;
}

/**
 * Docusaurus-style JSON: `{ "key": { "message": "...", "description": "..." } }`.
 * `reassemble` uses the content from the last `extract` call on this instance (one file per instance per pipeline).
 */
export class JsonExtractor extends BaseExtractor {
  readonly name = "json";

  /** Last `extract` input; used by {@link reassemble}. */
  private lastOriginalContent = "";

  canHandle(filepath: string): boolean {
    return filepath.toLowerCase().endsWith(".json");
  }

  extract(content: string, filepath: string): Segment[] {
    this.lastOriginalContent = content;
    const segments: Segment[] = [];
    let segmentIndex = 0;
    const lines = content.split("\n");

    let json: unknown;
    try {
      json = JSON.parse(content) as unknown;
    } catch (e) {
      throw new Error(
        `Failed to parse JSON file ${filepath}: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    const findLineNumber = (message: string, key: string): number => {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? "";
        const keyPattern = new RegExp(`"${this.escapeRegex(key)}"\\s*:`);
        if (keyPattern.test(line)) {
          return i + 1;
        }
      }
      for (let i = 0; i < lines.length; i++) {
        if ((lines[i] ?? "").includes(`"${message}"`)) {
          return i + 1;
        }
      }
      return 1;
    };

    const walk = (obj: unknown, keyPrefix: string): void => {
      if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
        return;
      }

      for (const [key, value] of Object.entries(obj)) {
        const fullKey = keyPrefix ? `${keyPrefix}.${key}` : key;

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          const entry = value as I18nEntry;
          if (Object.prototype.hasOwnProperty.call(entry, "message")) {
            const message = entry.message;
            const description = entry.description;
            if (typeof message === "string") {
              const hash = this.computeHash(message);
              const startLine = findLineNumber(message, key);
              segments.push({
                id: `json-${segmentIndex++}`,
                type: "json",
                content: message,
                hash,
                translatable: true,
                startLine,
                jsonKey: fullKey,
                jsonDescription: description,
              });
            }
          } else {
            walk(value, fullKey);
          }
        }
      }
    };

    walk(json, "");
    return segments;
  }

  reassemble(segments: Segment[], translations: Map<string, SegmentTranslationMapValue>): string {
    const originalContent = this.lastOriginalContent;
    if (!originalContent) {
      throw new Error("JsonExtractor.reassemble: call extract() first");
    }
    const originalJson = JSON.parse(originalContent) as unknown;
    const segmentMap = new Map<string, Segment>();
    const merged = this.mergeTranslations(segments, translations);
    for (const seg of merged) {
      if (seg.jsonKey) {
        segmentMap.set(seg.jsonKey, seg);
      }
    }

    const walk = (src: unknown, keyPrefix: string): unknown => {
      if (typeof src !== "object" || src === null) {
        return src;
      }

      if (Array.isArray(src)) {
        return src.map((item) => walk(item, keyPrefix));
      }

      const result: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(src)) {
        const fullKey = keyPrefix ? `${keyPrefix}.${key}` : key;

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          const entry = value as I18nEntry;
          if (Object.prototype.hasOwnProperty.call(entry, "message")) {
            const seg = segmentMap.get(fullKey);
            const translatedMessage = seg ? seg.content : entry.message;
            const next: I18nEntry = { message: translatedMessage };
            if (Object.prototype.hasOwnProperty.call(entry, "description")) {
              next.description = entry.description;
            }
            result[key] = next;
          } else {
            result[key] = walk(value, fullKey);
          }
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return JSON.stringify(walk(originalJson, ""), null, 2) + "\n";
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
