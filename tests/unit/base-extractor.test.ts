import { describe, expect, it } from "vitest";
import { TranslationCache } from "../../src/core/cache.js";
import type { Segment } from "../../src/core/types.js";
import type { SegmentTranslationMapValue } from "../../src/core/types.js";
import { BaseExtractor } from "../../src/extractors/base-extractor.js";

/** Minimal concrete extractor to exercise {@link BaseExtractor} protected helpers. */
class HarnessExtractor extends BaseExtractor {
  readonly name = "harness";

  canHandle(_filepath: string): boolean {
    return true;
  }

  extract(): Segment[] {
    return [];
  }

  reassemble(): string {
    return "";
  }

  exposeComputeHash(content: string): string {
    return this.computeHash(content);
  }

  exposeNormalizeWhitespace(text: string): string {
    return this.normalizeWhitespace(text);
  }

  exposeMergeTranslations(
    segments: Segment[],
    translations: Map<string, SegmentTranslationMapValue>
  ): Segment[] {
    return this.mergeTranslations(segments, translations);
  }
}

function seg(partial: Partial<Segment> & Pick<Segment, "id" | "hash" | "content" | "translatable">): Segment {
  return {
    type: "paragraph",
    ...partial,
  };
}

describe("BaseExtractor", () => {
  const harness = new HarnessExtractor();

  it("computeHash matches TranslationCache.computeHash", () => {
    const text = "same segment bytes";
    expect(harness.exposeComputeHash(text)).toBe(TranslationCache.computeHash(text));
  });

  it("normalizeWhitespace collapses runs and trims", () => {
    expect(harness.exposeNormalizeWhitespace("  a \n\t b   c  ")).toBe("a b c");
    expect(harness.exposeNormalizeWhitespace("plain")).toBe("plain");
    expect(harness.exposeNormalizeWhitespace("")).toBe("");
  });

  it("mergeTranslations replaces content for translatable segments when a translation exists", () => {
    const segments: Segment[] = [
      seg({
        id: "1",
        hash: "h1",
        content: "orig",
        translatable: true,
      }),
    ];
    const map = new Map<string, SegmentTranslationMapValue>([["h1", "translated"]]);
    const out = harness.exposeMergeTranslations(segments, map);
    expect(out).toHaveLength(1);
    expect(out[0]?.content).toBe("translated");
    expect(out[0]?.id).toBe("1");
  });

  it("mergeTranslations uses DocSegmentTranslation.text when value is an object", () => {
    const segments: Segment[] = [
      seg({
        id: "1",
        hash: "h1",
        content: "orig",
        translatable: true,
      }),
    ];
    const map = new Map<string, SegmentTranslationMapValue>([
      ["h1", { text: "from model", modelUsed: "openrouter/x" }],
    ]);
    const out = harness.exposeMergeTranslations(segments, map);
    expect(out[0]?.content).toBe("from model");
  });

  it("mergeTranslations keeps original content when translation is missing", () => {
    const segments: Segment[] = [
      seg({
        id: "1",
        hash: "missing-key",
        content: "fallback",
        translatable: true,
      }),
    ];
    const map = new Map<string, SegmentTranslationMapValue>();
    const out = harness.exposeMergeTranslations(segments, map);
    expect(out[0]?.content).toBe("fallback");
  });

  it("mergeTranslations keeps original content when segment is not translatable", () => {
    const segments: Segment[] = [
      seg({
        id: "f",
        hash: "frozen",
        content: "verbatim",
        translatable: false,
      }),
    ];
    const map = new Map<string, SegmentTranslationMapValue>([["frozen", "ignored"]]);
    const out = harness.exposeMergeTranslations(segments, map);
    expect(out[0]?.content).toBe("verbatim");
  });
});
