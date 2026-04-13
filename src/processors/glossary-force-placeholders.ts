import type { Glossary } from "../glossary/glossary.js";

const PLACEHOLDER_PREFIX = "{{GLOSSARY_FORCE_";
const PLACEHOLDER_SUFFIX = "}}";

export function glossaryForcePlaceholderToken(index: number): string {
  return `${PLACEHOLDER_PREFIX}${index}${PLACEHOLDER_SUFFIX}`;
}

/**
 * Replace forced glossary source terms with opaque placeholders before translation; restore injects target wording.
 * Uses the same word-boundary and longest-first non-overlap rules as glossary hints.
 */
export function protectGlossaryForcedTerms(
  text: string,
  glossary: Glossary,
  locale: string
): { text: string; replacements: string[] } {
  const entries = glossary.getForcedTermEntriesForLocale(locale);
  if (entries.length === 0) {
    return { text, replacements: [] };
  }

  const textLower = text.toLowerCase();
  const matches: Array<{ start: number; end: number; replacement: string }> = [];
  const matchedPositions = new Set<number>();

  for (const { termLower, replacement } of entries) {
    let index = 0;
    while ((index = textLower.indexOf(termLower, index)) !== -1) {
      const beforeChar = index > 0 ? textLower[index - 1]! : " ";
      const afterChar = textLower[index + termLower.length] || " ";
      const isWordBoundary = /[\s\p{P}]/u.test(beforeChar) && /[\s\p{P}]/u.test(afterChar);

      if (!isWordBoundary) {
        index++;
        continue;
      }

      const positions = Array.from({ length: termLower.length }, (_, i) => index + i);
      const hasOverlap = positions.some((pos) => matchedPositions.has(pos));

      if (!hasOverlap) {
        matches.push({ start: index, end: index + termLower.length, replacement });
        positions.forEach((pos) => matchedPositions.add(pos));
      }
      index++;
    }
  }

  matches.sort((a, b) => a.start - b.start);
  const replacements = matches.map((m) => m.replacement);

  let out = text;
  for (let j = matches.length - 1; j >= 0; j--) {
    const m = matches[j]!;
    const ph = glossaryForcePlaceholderToken(j);
    out = out.slice(0, m.start) + ph + out.slice(m.end);
  }

  return { text: out, replacements };
}

export function restoreGlossaryForcedTerms(text: string, replacements: string[]): string {
  if (replacements.length === 0) {
    return text;
  }
  let out = text;
  for (let j = 0; j < replacements.length; j++) {
    const token = glossaryForcePlaceholderToken(j);
    out = out.split(token).join(replacements[j]!);
  }
  return out;
}
