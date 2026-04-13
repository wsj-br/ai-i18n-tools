import type {
  ContentExtractor,
  Segment,
  SegmentTranslationMapValue,
} from "../core/types.js";
import { segmentTranslationText } from "../core/types.js";
import { computeSegmentHash } from "../utils/hash.js";

/**
 * Shared helpers for content extractors (doc hash = SHA-256 prefix, same as {@link TranslationCache}).
 */
export abstract class BaseExtractor implements ContentExtractor {
  abstract readonly name: string;
  abstract canHandle(filepath: string): boolean;
  abstract extract(content: string, filepath: string): Segment[];
  abstract reassemble(segments: Segment[], translations: Map<string, SegmentTranslationMapValue>): string;

  protected computeHash(content: string): string {
    return computeSegmentHash(content);
  }

  protected normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  /** Apply translations by segment hash; non-translatable segments keep original content. */
  protected mergeTranslations(
    segments: Segment[],
    translations: Map<string, SegmentTranslationMapValue>
  ): Segment[] {
    return segments.map((s) => ({
      ...s,
      content: s.translatable
        ? (segmentTranslationText(translations.get(s.hash)) ?? s.content)
        : s.content,
    }));
  }
}
