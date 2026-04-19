import { describe, expect, it } from "vitest";
import {
  parseLintSourceBatchResponse,
  LintSourceJsonParseError,
} from "../../src/core/prompt-builder.js";
import {
  collectLintSourceUnits,
  extractUiPlaceholderTokens,
  formatLintSourceHumanLogText,
  lintSuggestionPreservesPlaceholders,
  type LintSourceReport,
} from "../../src/cli/lint-source.js";
import type { StringsJsonEntry } from "../../src/core/types.js";

describe("parseLintSourceBatchResponse", () => {
  it("parses valid array with issues per slot", () => {
    const raw = `[
      { "issues": [{ "severity": "error", "message": "Typo", "suggestedText": "Hello" }] },
      { "issues": [] }
    ]`;
    const { slots, lengthWarning } = parseLintSourceBatchResponse(raw, 2);
    expect(lengthWarning).toBeNull();
    expect(slots).toHaveLength(2);
    expect(slots[0]!.issues).toHaveLength(1);
    expect(slots[0]!.issues[0]!.message).toBe("Typo");
    expect(slots[1]!.issues).toHaveLength(0);
  });

  it("pads short arrays with empty issues", () => {
    const raw = `[{ "issues": [] }]`;
    const { slots, lengthWarning } = parseLintSourceBatchResponse(raw, 3);
    expect(lengthWarning).toContain("expected 3");
    expect(slots).toHaveLength(3);
    expect(slots[1]!.issues).toEqual([]);
    expect(slots[2]!.issues).toEqual([]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseLintSourceBatchResponse("not json", 1)).toThrow(LintSourceJsonParseError);
  });
});

describe("collectLintSourceUnits", () => {
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
    const units = collectLintSourceUnits(catalog);
    expect(units).toHaveLength(2);
    expect(units.map((u) => u.segmentId).sort()).toEqual(["a1", "b2"]);
    expect(units.find((u) => u.segmentId === "a1")?.text).toBe("Hello world");
    expect(units.find((u) => u.segmentId === "b2")?.text).toBe("{{count}} items");
  });
});

describe("formatLintSourceHumanLogText", () => {
  it("writes summary, issues, and OK sections as plain text", () => {
    const report: LintSourceReport = {
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
        issueCount: 1,
        totalCostUsd: 0,
      },
    };
    const text = formatLintSourceHumanLogText(report, "/proj");
    expect(text).toContain("Summary:");
    expect(text).toContain("totalStrings: 2");
    expect(text).toContain("ok: 1");
    expect(text).toContain("totalCostUsd:");
    expect(text).toContain("[warning]");
    expect(text).toContain("  /proj/src/x.tsx:1");
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

  it("lintSuggestionPreservesPlaceholders rejects broken suggestions", () => {
    expect(lintSuggestionPreservesPlaceholders("Save {{count}}", "Save {count}")).toBe(false);
    expect(lintSuggestionPreservesPlaceholders("Save {{count}}", "Save {{count}}")).toBe(true);
  });
});
