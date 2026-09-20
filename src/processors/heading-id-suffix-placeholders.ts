/**
 * Peel Docusaurus explicit heading-id suffixes off ATX headings before translation
 * and pin them back to the end of the translated heading line.
 *
 * Classic `{#id}` and MDX heading-id comments are structural (Docusaurus only honours
 * them at end of line) and must never be sent to the LLM as reorderable content tokens.
 */

import { ATX_HEADING_RE, parseExplicitHeadingId } from "../markdown/write-heading-ids-core.js";

export interface HeadingIdSuffixProtectResult {
  text: string;
  headingIdSuffixes: string[];
}

/**
 * For each ATX heading whose title ends with a classic `{#id}` or MDX heading-id
 * comment suffix, record the exact suffix text and rewrite the line as
 * `${hashes} ${title}`. Mid-heading comments (not at end of line) are left untouched.
 */
export function stripHeadingIdSuffixes(text: string): HeadingIdSuffixProtectResult {
  const headingIdSuffixes: string[] = [];
  const lines = text.split("\n");
  const next = lines.map((line) => {
    const hm = line.match(ATX_HEADING_RE);
    if (!hm) {
      return line;
    }
    const titlePart = hm[2]!;
    const parsed = parseExplicitHeadingId(titlePart);
    if (!parsed.kind) {
      return line;
    }
    const suffix = titlePart.slice(parsed.text.length).trim();
    if (!suffix) {
      return line;
    }
    headingIdSuffixes.push(suffix);
    return `${hm[1]} ${parsed.text}`;
  });
  return { text: next.join("\n"), headingIdSuffixes };
}

/**
 * Append recorded suffixes to ATX heading lines in document order (always at end
 * of line). Extra headings get no suffix; leftover suffixes are dropped.
 */
export function reattachHeadingIdSuffixes(text: string, headingIdSuffixes: string[]): string {
  if (headingIdSuffixes.length === 0) {
    return text;
  }
  let idx = 0;
  const lines = text.split("\n");
  const next = lines.map((line) => {
    if (idx >= headingIdSuffixes.length) {
      return line;
    }
    if (!ATX_HEADING_RE.test(line)) {
      return line;
    }
    const suffix = headingIdSuffixes[idx]!;
    idx += 1;
    return `${line.trimEnd()} ${suffix}`;
  });
  return next.join("\n");
}
