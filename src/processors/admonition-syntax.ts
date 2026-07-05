/**
 * Shared Docusaurus admonition fence syntax, used by the markdown extractor (segmentation),
 * the placeholder protector (`admonition-placeholders.ts`), and the malformed-admonition
 * diagnostics (`markdown-source-diagnostics.ts`). Keeping these patterns in one place avoids
 * the three consumers drifting apart.
 *
 * `:{3,}` (3+ colons) supports nested admonitions, where parents use more colons than children.
 */
export const ADMONITION_KEYWORD = "(?:note|tip|info|warning|danger|caution|important)";

/**
 * Bracketed-title opener `:::note[Title]` (optionally `]{.attr}`):
 * group 1 indent, group 2 prefix `:::note[`, group 3 inner title, group 4 `]`/attribute remainder.
 */
export const ADMONITION_BRACKETED_TITLE_RE = new RegExp(
  `^(\\s*)(:{3,}${ADMONITION_KEYWORD}\\[)([^\\]]*)(\\][^\\n]*)$`
);

/**
 * Space/no-title opener: group 1 indent, group 2 directive `:::note`, group 3 spacing,
 * group 4 optional title remainder on the line.
 */
export const ADMONITION_DIRECTIVE_WITH_TAIL_RE = new RegExp(
  `^(\\s*)(:{3,}${ADMONITION_KEYWORD})(\\s*)([^\\n]*)$`
);

/**
 * Closing fence used by the placeholder protector: a line of only 3+ colons, indent-tolerant.
 * Group 1 is the colon run (restored verbatim). Leading whitespace is allowed so a restore stays robust.
 */
export const ADMONITION_CLOSING_RE = /^\s*(:::+)\s*$/;

/**
 * Closing fence used by the line scanner / diagnostics: a line of only 3+ colons with no indent.
 * Group 1 is the colon run (so its length can be compared against the opener).
 */
export const ADMONITION_CLOSING_NOINDENT_RE = /^(:{3,})\s*$/;

/** Generic opener detector (no indent): group 1 is the leading colon run, followed by a word char. */
export const ADMONITION_OPENER_COLONS_RE = /^(:{3,})\w/;

/** GitHub-style alert opener line `> [!NOTE]`. */
export const GITHUB_ALERT_LINE_RE =
  /^\s*>\s*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i;

/**
 * A bracketed-title opener whose `[` is never closed on the same line
 * (e.g. `:::note[Title` with no `]`). Used to flag malformed titles.
 */
export const ADMONITION_UNTERMINATED_TITLE_RE = new RegExp(
  `^(\\s*)(:{3,}${ADMONITION_KEYWORD})\\[[^\\]]*$`
);
