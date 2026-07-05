import { describe, expect, it, vi } from "vitest";
import { printTranslationRunSummary } from "../../src/cli/translate-summary.js";
import { formatSegmentCacheHitSuffix } from "../../src/cli/format.js";

describe("formatSegmentCacheHitSuffix", () => {
  it("returns empty string when no segments", () => {
    expect(formatSegmentCacheHitSuffix(undefined, undefined)).toBe("");
    expect(formatSegmentCacheHitSuffix(0, 0)).toBe("");
  });

  it("formats cache hit percentage", () => {
    expect(formatSegmentCacheHitSuffix(85, 15)).toBe(" (85.0% cache hit)");
  });
});

describe("printTranslationRunSummary", () => {
  it("prints segment metrics and token totals", () => {
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg: string) => {
      logs.push(msg);
    });

    printTranslationRunSummary(
      { dryRun: false },
      {
        filesWritten: 3,
        filesSkipped: 1,
        filesProcessed: 3,
        inputTokens: 1000,
        outputTokens: 500,
        costUsd: 0.12,
        segmentsCached: 80,
        segmentsTranslated: 20,
        segmentValidationFailures: 2,
        individualSegmentTranslations: 2,
        segmentQualitySplitRetries: 0,
      },
      90_000,
      "success",
      { success: "Done!", interrupted: "Interrupted" }
    );

    const text = logs.join("\n");
    expect(text).toContain("Done!");
    expect(text).toContain("Summary:");
    expect(text).toContain("Total files processed:");
    expect(text).toContain("Segments from cache:");
    expect(text).toContain("80.0% cache hit");
    expect(text).toContain("Segments translated:");
    expect(text).toContain("Total tokens used:");
    expect(text).toContain("1,500");
    expect(text).toContain("Total cost:");
    expect(text).toContain("0.120000");

    vi.restoreAllMocks();
  });
});
