import path from "path";
import { describe, expect, it } from "vitest";
import {
  parseProofreadUIBatchResponse,
  ProofreadUIJsonParseError,
} from "../../src/core/prompt-builder.js";
import {
  collectProofreadUIUnits,
  extractUiPlaceholderTokens,
  formatProofreadUIHumanLogText,
  proofreadSuggestionPreservesPlaceholders,
  suggestionRewritesSource,
  type ProofreadUIReport,
} from "../../src/cli/proofread-ui.js";
import type { StringsJsonEntry } from "../../src/core/types.js";

describe("parseProofreadUIBatchResponse", () => {
  it("parses valid array with issues per slot", () => {
    const raw = `[
      { "issues": [{ "severity": "error", "message": "Typo", "suggestedText": "Hello" }] },
      { "issues": [] }
    ]`;
    const { slots, lengthWarning } = parseProofreadUIBatchResponse(raw, 2);
    expect(lengthWarning).toBeNull();
    expect(slots).toHaveLength(2);
    expect(slots[0]!.issues).toHaveLength(1);
    expect(slots[0]!.issues[0]!.message).toBe("Typo");
    expect(slots[1]!.issues).toHaveLength(0);
  });

  it("does not pad a short array that has no indexes", () => {
    const raw = `[{ "issues": [{ "severity": "warning", "message": "Typo", "suggestedText": "Hello" }] }]`;
    const { slots, lengthWarning, reviewed } = parseProofreadUIBatchResponse(raw, 3);
    expect(lengthWarning).toContain("could not be aligned");
    expect(slots).toHaveLength(3);
    expect(reviewed).toEqual([false, false, false]);
    expect(slots.every((slot) => slot.issues.length === 0)).toBe(true);
  });

  it("applies a short array by index and leaves missing slots unreviewed", () => {
    const raw = `[
      { "index": 2, "issues": [{ "severity": "error", "message": "Typo", "suggestedText": "Hello" }] },
      { "index": 0, "issues": [] }
    ]`;
    const { slots, lengthWarning, reviewed } = parseProofreadUIBatchResponse(raw, 3);
    expect(lengthWarning).toContain("applied by index");
    expect(reviewed).toEqual([true, false, true]);
    expect(slots[0]!.issues).toEqual([]);
    expect(slots[1]!.issues).toEqual([]);
    expect(slots[2]!.issues[0]!.suggestedText).toBe("Hello");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseProofreadUIBatchResponse("not json", 1)).toThrow(ProofreadUIJsonParseError);
  });
});

describe("collectProofreadUIUnits", () => {
  it("collects source only for plain and plural rows", () => {
    const catalog: Record<string, StringsJsonEntry> = {
      a1: {
        source: "Hello world",
        translated: {},
        locations: [{ file: "src/App.tsx", line: 2 }],
      },
      b2: {
        plural: true,
        source: "{{count}} items",
        translated: { "en-GB": { one: "One", other: "Many" } },
      },
    };
    const units = collectProofreadUIUnits(catalog);
    expect(units).toHaveLength(2);
    expect(units.map((u) => u.segmentId).sort()).toEqual(["a1", "b2"]);
    expect(units.find((u) => u.segmentId === "a1")?.text).toBe("Hello world");
    expect(units.find((u) => u.segmentId === "b2")?.text).toBe("{{count}} items");
  });
});

describe("formatProofreadUIHumanLogText", () => {
  it("writes summary, issues, and OK sections as plain text", () => {
    const report: ProofreadUIReport = {
      schemaVersion: 1,
      sourceLocale: "en-GB",
      stringsPath: "/proj/strings.json",
      projectRoot: "/proj",
      units: [
        {
          segmentId: "a",
          field: "source",
          originalText: "Bad speling",
          locations: [{ file: "src/x.tsx", line: 1 }],
          issues: [{ severity: "warning", message: "Typo", suggestedText: "Bad spelling" }],
        },
        {
          segmentId: "b",
          field: "source",
          originalText: "Fine",
          locations: [],
          issues: [],
        },
      ],
      batchErrors: [],
      summary: {
        totalUnits: 2,
        unitsWithIssues: 1,
        unitsOk: 1,
        unitsNotReviewed: 0,
        issueCount: 1,
        totalCostUsd: 0,
      },
    };
    const text = formatProofreadUIHumanLogText(report, "/proj");
    expect(text).toContain("Summary:");
    expect(text).toContain("totalStrings: 2");
    expect(text).toContain("ok: 1");
    expect(text).toContain("notReviewed: 0");
    expect(text).toContain("totalCostUsd:");
    expect(text).toContain("[warning]");
    expect(text).toContain(`  ${path.normalize(path.join("/proj", "src/x.tsx"))}:1`);
    expect(text).toContain("OK (1):");
    expect(text).toContain('[ok] b "Fine"');
    expect(text).not.toContain("schemaVersion");
  });
});

describe("placeholder preservation", () => {
  it("extracts {{ }} and positional tokens", () => {
    const t = extractUiPlaceholderTokens("Hi {{name}} and {0} and %s");
    expect(t).toContain("{{name}}");
    expect(t).toContain("{0}");
    expect(t).toContain("%s");
  });

  it("proofreadSuggestionPreservesPlaceholders rejects broken suggestions", () => {
    expect(proofreadSuggestionPreservesPlaceholders("Save {{count}}", "Save {count}")).toBe(false);
    expect(proofreadSuggestionPreservesPlaceholders("Save {{count}}", "Save {{count}}")).toBe(true);
    expect(
      proofreadSuggestionPreservesPlaceholders("Save {{count}} and {{count}}", "Save {{count}}")
    ).toBe(false);
  });

  it("suggestionRewritesSource rejects a suggestion that belongs to a different string", () => {
    expect(suggestionRewritesSource("All status", "All statuses")).toBe(true);
    expect(
      suggestionRewritesSource("Output log:", "⚠️  Dry-run mode - no changes will be made")
    ).toBe(false);
    expect(suggestionRewritesSource("Logged to server console", "Loading...")).toBe(false);
  });
});
