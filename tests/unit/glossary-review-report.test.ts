import { describe, expect, it } from "vitest";
import {
  GlossaryWarningCollector,
  glossaryWarningSummaryLines,
  renderGlossaryReviewPrompt,
  type GlossaryReviewItem,
} from "../../src/glossary/glossary-review-report.js";
import type { LockedUiLabelIssue } from "../../src/glossary/glossary.js";

function issue(term: string, locale = "uk", translation = `${term}-tr`): LockedUiLabelIssue {
  return {
    term,
    translation,
    locale,
    message: `Glossary label missing: "${term}" should include "${translation}"`,
  };
}

function item(overrides: Partial<GlossaryReviewItem> = {}): GlossaryReviewItem {
  return {
    locale: "uk",
    relPath: "docs/a.md",
    sourceText: "source",
    chosenModel: "model-a",
    chosenText: "chosen",
    issues: [issue("Term")],
    candidates: [],
    ...overrides,
  };
}

describe("glossaryWarningSummaryLines", () => {
  it("returns no lines when there are no warnings", () => {
    expect(glossaryWarningSummaryLines([])).toEqual([]);
  });

  it("counts repeated locale and term pairs as one group", () => {
    const lines = glossaryWarningSummaryLines([
      item({ issues: [issue("Term")] }),
      item({ issues: [issue("Term")] }),
      item({ issues: [issue("Term", "de")] }),
    ]);
    expect(lines[0]).toContain("3");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("uk");
    expect(lines[1]).toContain("2");
    expect(lines[2]).toContain("de");
    expect(lines[2]).toContain("1");
  });

  it("counts several issues from one item separately", () => {
    const lines = glossaryWarningSummaryLines([item({ issues: [issue("Alpha"), issue("Beta")] })]);
    expect(lines).toHaveLength(3);
  });

  it("sorts by count, then locale, then term", () => {
    const lines = glossaryWarningSummaryLines([
      item({ issues: [issue("Zeta", "uk")] }),
      item({ issues: [issue("Alpha", "uk")] }),
      item({ issues: [issue("Alpha", "de")] }),
      item({ issues: [issue("Frequent", "uk")] }),
      item({ issues: [issue("Frequent", "uk")] }),
    ]);
    const groups = lines.slice(1);
    expect(groups[0]).toContain("Frequent");
    expect(groups[1]).toContain("de");
    expect(groups[1]).toContain("Alpha");
    expect(groups[2]).toContain("uk");
    expect(groups[2]).toContain("Alpha");
    expect(groups[3]).toContain("Zeta");
  });

  it("handles items without issues", () => {
    const lines = glossaryWarningSummaryLines([item({ issues: [] })]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("1");
  });

  it("lists at most 20 groups and reports the remainder", () => {
    const items = Array.from({ length: 23 }, (_, i) =>
      item({ issues: [issue(`Term${String(i).padStart(2, "0")}`)] })
    );
    const lines = glossaryWarningSummaryLines(items);
    expect(lines).toHaveLength(1 + 20 + 1);
    expect(lines[lines.length - 1]).toContain("3");
    expect(lines.some((line) => line.includes("Term22"))).toBe(false);
  });

  it("does not add a remainder line at exactly 20 groups", () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      item({ issues: [issue(`Term${String(i).padStart(2, "0")}`)] })
    );
    const lines = glossaryWarningSummaryLines(items);
    expect(lines).toHaveLength(1 + 20);
  });
});

describe("renderGlossaryReviewPrompt", () => {
  it("renders only the instructions when there are no items", () => {
    const prompt = renderGlossaryReviewPrompt([]);
    expect(prompt).toContain("Items: 0");
    expect(prompt).not.toContain("## Item 1");
    expect(prompt.endsWith("\n")).toBe(true);
  });

  it("falls back for an unknown document and missing labels", () => {
    const prompt = renderGlossaryReviewPrompt([item({ relPath: "", issues: [] })]);
    expect(prompt).toContain("- Document: (unknown)");
    expect(prompt).toContain("- Missing labels:\n- (none)");
    expect(prompt).not.toContain("### Other model attempts");
  });

  it("lists missing labels with their expected translations", () => {
    const prompt = renderGlossaryReviewPrompt([
      item({ issues: [issue("Alpha", "uk", "Альфа"), issue("Beta", "uk", "Бета")] }),
    ]);
    expect(prompt).toContain('- "Alpha" should include "Альфа"');
    expect(prompt).toContain('- "Beta" should include "Бета"');
  });

  it("replaces code fences in source and translation text", () => {
    const prompt = renderGlossaryReviewPrompt([
      item({ sourceText: "a ```code``` b", chosenText: "x ``` y" }),
    ]);
    expect(prompt).toContain("a '''code''' b");
    expect(prompt).toContain("x ''' y");
    expect(prompt).not.toContain("```code```");
  });

  it("numbers several items", () => {
    const prompt = renderGlossaryReviewPrompt([item(), item({ relPath: "docs/b.md" })]);
    expect(prompt).toContain("Items: 2");
    expect(prompt).toContain("## Item 1");
    expect(prompt).toContain("## Item 2");
    expect(prompt).toContain("docs/b.md");
  });

  it("skips the candidate that matches the chosen attempt", () => {
    const prompt = renderGlossaryReviewPrompt([
      item({
        candidates: [{ model: "model-a", text: "chosen", issues: [issue("Term")] }],
      }),
    ]);
    expect(prompt).toContain("### Other model attempts");
    expect(prompt).not.toContain("#### model-a");
  });

  it("keeps candidates that share the model or the text but not both", () => {
    const prompt = renderGlossaryReviewPrompt([
      item({
        candidates: [
          { model: "model-a", text: "different text", issues: [issue("Term")] },
          { model: "model-b", text: "chosen", issues: [issue("Term")] },
        ],
      }),
    ]);
    expect(prompt).toContain("#### model-a");
    expect(prompt).toContain("different text");
    expect(prompt).toContain("#### model-b");
  });

  it("lists missing terms for other attempts, or notes that none were recorded", () => {
    const prompt = renderGlossaryReviewPrompt([
      item({
        candidates: [
          {
            model: "model-b",
            text: "second ``` try",
            issues: [issue("Alpha"), issue("Beta")],
          },
          { model: "model-c", text: "third try", issues: [] },
        ],
      }),
    ]);
    expect(prompt).toContain("Missing: Alpha, Beta");
    expect(prompt).toContain("Missing: (none recorded)");
    expect(prompt).toContain("second ''' try");
  });

  it("collapses runs of blank lines", () => {
    const prompt = renderGlossaryReviewPrompt([item({ sourceText: "a\n\n\n\nb" })]);
    expect(prompt).not.toMatch(/\n{3,}/);
  });
});

describe("GlossaryWarningCollector", () => {
  it("starts empty and keeps items in insertion order", () => {
    const collector = new GlossaryWarningCollector();
    expect(collector.items).toEqual([]);
    const first = item({ relPath: "first.md" });
    const second = item({ relPath: "second.md" });
    collector.add(first);
    collector.add(second);
    expect(collector.items).toEqual([first, second]);
  });
});

describe("glossary review report", () => {
  it("groups warnings and writes a review prompt with skip instructions", () => {
    const collector = new GlossaryWarningCollector();
    collector.add({
      locale: "uk",
      relPath: "docs/transform.md",
      sourceText: "- **Ask for target language** — adds a selector",
      chosenModel: "google/gemini-2.5-flash",
      chosenText: "- **Запитати цільову мову** — додає селектор",
      issues: [
        {
          term: "Target language",
          translation: "Цільова мова",
          locale: "uk",
          message: 'Glossary label missing: "Target language" should include "Цільова мова"',
        },
      ],
      candidates: [
        {
          model: "google/gemini-2.5-flash",
          text: "- **Запитати цільову мову** — додає селектор",
          issues: [
            {
              term: "Target language",
              translation: "Цільова мова",
              locale: "uk",
              message: 'Glossary label missing: "Target language" should include "Цільова мова"',
            },
          ],
        },
      ],
    });
    const lines = glossaryWarningSummaryLines(collector.items);
    expect(lines[0]).toContain("1");
    expect(lines.some((line) => line.includes("uk") && line.includes("Target language"))).toBe(
      true
    );
    const prompt = renderGlossaryReviewPrompt(collector.items);
    expect(prompt).toContain("FALSE_POSITIVE");
    expect(prompt).toContain("labelCheckSkips");
    expect(prompt).toContain("docs/transform.md");
    expect(prompt).toContain("Запитати цільову мову");
    expect(prompt).toContain("case-insensitive");
  });
});
