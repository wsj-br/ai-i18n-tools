import { describe, expect, it } from "vitest";
import { mergeSegmentSplittingOpts, segmentSplittingSchema } from "../../src/core/types.js";
import {
  expandSegmentsWithSplitting,
  splitMarkdownSegmentPiece,
} from "../../src/extractors/markdown-segment-split.js";

const enabled = segmentSplittingSchema.parse({
  enabled: true,
  maxCharsPerSegment: 80,
  maxListItemsPerChunk: 2,
});

describe("segmentSplittingSchema defaults", () => {
  it("enables splitting by default", () => {
    expect(segmentSplittingSchema.parse({}).enabled).toBe(true);
    expect(mergeSegmentSplittingOpts(undefined).enabled).toBe(true);
  });
});

describe("splitMarkdownSegmentPiece", () => {
  it("splits pipe tables: first chunk is header, separator, and first data row", () => {
    const seg = {
      type: "paragraph" as const,
      content: "| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |",
      translatable: true,
      startLine: 10,
    };
    const parts = splitMarkdownSegmentPiece(seg, enabled);
    expect(parts).toHaveLength(2);
    expect(parts[0]!.content).toContain("| 1 | 2 |");
    expect(parts[0]!.content).not.toContain("| 3 | 4 |");
    expect(parts[1]!.content.trim()).toBe("| 3 | 4 |");
    expect(parts[1]!.tightJoinPrevious).toBe(true);
  });

  it("does not split a two-row pipe table (header + sep only)", () => {
    const seg = {
      type: "paragraph" as const,
      content: "| A | B |\n|---|---|",
      translatable: true,
      startLine: 1,
    };
    const parts = splitMarkdownSegmentPiece(seg, enabled);
    expect(parts).toHaveLength(1);
  });

  it("splits long top-level lists into chunks with tight joins", () => {
    const seg = {
      type: "paragraph" as const,
      content: "- a\n- b\n- c\n- d",
      translatable: true,
      startLine: 1,
    };
    const parts = splitMarkdownSegmentPiece(seg, enabled);
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0]!.tightJoinPrevious).toBeFalsy();
    for (let i = 1; i < parts.length; i++) {
      expect(parts[i]!.tightJoinPrevious).toBe(true);
    }
  });

  it("splits dense paragraphs by maxCharsPerSegment", () => {
    const line = "word ";
    const body = Array.from({ length: 40 }, () => line).join("\n");
    const seg = {
      type: "paragraph" as const,
      content: body.trimEnd(),
      translatable: true,
      startLine: 1,
    };
    const parts = splitMarkdownSegmentPiece(seg, enabled);
    expect(parts.length).toBeGreaterThan(1);
  });
});

describe("expandSegmentsWithSplitting", () => {
  it("is a no-op when disabled", () => {
    const cfg = segmentSplittingSchema.parse({ enabled: false });
    const coarse = [
      {
        type: "paragraph" as const,
        content: "| A |\n|-|\n|x|\n|y|",
        translatable: true,
        startLine: 1,
      },
    ];
    expect(expandSegmentsWithSplitting(coarse, cfg)).toBe(coarse);
  });
});

describe("splitMarkdownSegmentPiece edge options", () => {
  it("does not split non-translatable segments", () => {
    const parts = splitMarkdownSegmentPiece(
      {
        type: "paragraph",
        content: "| A |\n|---|\n| 1 |\n| 2 |",
        translatable: false,
        startLine: 1,
      },
      enabled
    );
    expect(parts).toHaveLength(1);
  });

  it("honors splitDenseParagraphs false (skips char splitting)", () => {
    const cfg = segmentSplittingSchema.parse({
      enabled: true,
      splitPipeTables: false,
      splitLongLists: false,
      splitDenseParagraphs: false,
    });
    const longBody = Array.from({ length: 80 }, () => "hello").join("\n");
    const parts = splitMarkdownSegmentPiece(
      {
        type: "paragraph",
        content: longBody,
        translatable: true,
        startLine: 1,
      },
      cfg
    );
    expect(parts).toHaveLength(1);
  });

  it("honors maxLinesPerParagraphChunk", () => {
    const cfg = segmentSplittingSchema.parse({
      enabled: true,
      splitPipeTables: false,
      splitLongLists: false,
      maxLinesPerParagraphChunk: 2,
      maxCharsPerSegment: 100_000,
    });
    const parts = splitMarkdownSegmentPiece(
      {
        type: "paragraph",
        content: "a\nb\nc\nd",
        translatable: true,
        startLine: 1,
      },
      cfg
    );
    expect(parts.length).toBeGreaterThan(1);
  });

  it("falls through when pipe tables disabled and body is not a list", () => {
    const cfg = segmentSplittingSchema.parse({
      enabled: true,
      splitPipeTables: false,
      splitLongLists: false,
      maxCharsPerSegment: 4,
    });
    const parts = splitMarkdownSegmentPiece(
      {
        type: "paragraph",
        content: "| A |\n|---|\n| 1 |\n| 2 |",
        translatable: true,
        startLine: 1,
      },
      cfg
    );
    expect(parts.length).toBeGreaterThan(1);
  });
});
