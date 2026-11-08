import { t } from "../i18n/index.js";
import type { LockedUiLabelIssue } from "./glossary.js";

/** One model attempt kept while cycling after a locked-label miss. */
export interface GlossaryReviewCandidate {
  model: string;
  text: string;
  issues: LockedUiLabelIssue[];
}

/** A segment written despite a locked UI-label warning. */
export interface GlossaryReviewItem {
  locale: string;
  relPath: string;
  sourceText: string;
  chosenModel: string;
  chosenText: string;
  issues: LockedUiLabelIssue[];
  candidates: GlossaryReviewCandidate[];
}

/** Warnings collected for one translate-docs run. */
export class GlossaryWarningCollector {
  readonly items: GlossaryReviewItem[] = [];

  add(item: GlossaryReviewItem): void {
    this.items.push(item);
  }
}

/** Short lines for the end-of-run summary. Empty when there are no warnings. */
export function glossaryWarningSummaryLines(items: readonly GlossaryReviewItem[]): string[] {
  if (items.length === 0) {
    return [];
  }
  const lines = [t("   Glossary label warnings: {{count}}", { count: items.length })];
  const groups = new Map<string, { locale: string; term: string; count: number }>();
  for (const item of items) {
    for (const issue of item.issues) {
      const key = `${issue.locale}\0${issue.term}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count++;
      } else {
        groups.set(key, { locale: issue.locale, term: issue.term, count: 1 });
      }
    }
  }
  const sorted = [...groups.values()].sort(
    (a, b) => b.count - a.count || a.locale.localeCompare(b.locale) || a.term.localeCompare(b.term)
  );
  for (const group of sorted.slice(0, 20)) {
    lines.push(
      t('   - {{locale}} "{{term}}": {{count}} segment(s)', {
        locale: group.locale,
        term: group.term,
        count: group.count,
      })
    );
  }
  if (sorted.length > 20) {
    lines.push(t("   - … {{count}} more term(s)", { count: sorted.length - 20 }));
  }
  return lines;
}

function fence(text: string): string {
  return text.replace(/```/g, "'''");
}

/**
 * English prompt for a later review of glossary-label warnings.
 * The wording stays in English so a reviewer model sees a stable instruction.
 */
export function renderGlossaryReviewPrompt(items: readonly GlossaryReviewItem[]): string {
  const blocks: string[] = [
    "# Glossary label check review",
    "",
    "You are reviewing translations that failed a locked UI-label check in ai-i18n-tools.",
    "The document was still written. Decide whether each failure is a false positive.",
    "",
    "## How the check works",
    "",
    "- The glossary translation must appear in the translated segment as a case-insensitive substring.",
    "- The check runs only when the English source cites the term as a UI label: an ATX heading that contains the term, a bold or inline-code span whose text is exactly that term (trailing punctuation such as `:` is ignored), or a line that is only that label.",
    "- A longer bold phrase that merely contains the term is not a citation.",
    "- The match is literal. Grammatical inflection (for example Ukrainian accusative `цільову мову` instead of nominative `цільова мова`) fails the check even when the translation is correct.",
    "- Capitalization differences do not fail the check.",
    "",
    "## What to return",
    "",
    "For each item, give one verdict: `FALSE_POSITIVE`, `TRUE_POSITIVE`, or `UNSURE`.",
    "Justify the verdict in one or two sentences about grammar or terminology. Do not rewrite the whole document.",
    "",
    "Then give two outputs:",
    "",
    "1. A JSON array of `glossary.labelCheckSkips` entries for the false positives only. Each entry has `term`, `locales` (the item locale), optional `files` (the document path), and optional `note`.",
    "2. For each true positive, the glossary translation or source change that would make the check pass. Do not invent a skip for those.",
    "",
    "```json",
    '{ "labelCheckSkips": [ { "term": "Target language", "locales": ["uk"], "files": ["docs/transform.md"], "note": "Inflected inside a sentence" } ] }',
    "```",
    "",
    `Items: ${items.length}`,
    "",
  ];

  items.forEach((item, index) => {
    const issues = item.issues
      .map((issue) => `- "${issue.term}" should include "${issue.translation}"`)
      .join("\n");
    blocks.push(`## Item ${index + 1}`);
    blocks.push("");
    blocks.push(`- Locale: ${item.locale}`);
    blocks.push(`- Document: ${item.relPath || "(unknown)"}`);
    blocks.push(`- Chosen model: ${item.chosenModel}`);
    blocks.push("- Missing labels:");
    blocks.push(issues || "- (none)");
    blocks.push("");
    blocks.push("### Source");
    blocks.push("");
    blocks.push("```");
    blocks.push(fence(item.sourceText));
    blocks.push("```");
    blocks.push("");
    blocks.push("### Chosen translation");
    blocks.push("");
    blocks.push("```");
    blocks.push(fence(item.chosenText));
    blocks.push("```");
    blocks.push("");
    if (item.candidates.length > 0) {
      blocks.push("### Other model attempts");
      blocks.push("");
      for (const candidate of item.candidates) {
        if (candidate.model === item.chosenModel && candidate.text === item.chosenText) {
          continue;
        }
        const missing = candidate.issues.map((issue) => issue.term).join(", ");
        blocks.push(`#### ${candidate.model}`);
        blocks.push("");
        blocks.push(missing ? `Missing: ${missing}` : "Missing: (none recorded)");
        blocks.push("");
        blocks.push("```");
        blocks.push(fence(candidate.text));
        blocks.push("```");
        blocks.push("");
      }
    }
  });

  return `${blocks.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}
