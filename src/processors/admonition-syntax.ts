/**
 * Shared admonition fence syntax, used by the markdown extractor (segmentation),
 * the placeholder protector (`admonition-placeholders.ts`), and the malformed-admonition
 * diagnostics (`markdown-source-diagnostics.ts`). Keeping these patterns in one place avoids
 * the three consumers drifting apart.
 *
 * Docusaurus writes the type flush against the colons (`:::note`, `:::tip[Title]`).
 * VitePress containers put a space before the type (`::: tip`, `::: tip Title`, `::: details`).
 * Pandoc fenced divs and MyST use a brace opener (`::: {.note}`, `:::{note} Title`).
 * MkDocs Material uses `!!! note`, collapsible `??? note`, and expanded `???+ note`, with an
 * optional `"title"` and a body indented at least four spaces. There is no closing fence.
 * `:{3,}` (3+ colons) supports nested admonitions, where parents use more colons than children.
 *
 * `important` is listed before `info` so `:::important` is not parsed as `:::info` + `rtant`.
 */
export const ADMONITION_KEYWORD = "(?:important|note|tip|info|warning|danger|caution|details)";

/**
 * Bracketed-title opener `:::note[Title]` or `::: note[Title]` (optionally `]{.attr}`):
 * group 1 indent, group 2 prefix `:::note[`, group 3 inner title, group 4 `]`/attribute remainder.
 */
export const ADMONITION_BRACKETED_TITLE_RE = new RegExp(
  `^(\\s*)(:{3,}\\s*${ADMONITION_KEYWORD}\\[)([^\\]]*)(\\][^\\n]*)$`
);

/**
 * Space/no-title opener: group 1 indent, group 2 directive `:::note` or `::: tip`, group 3 spacing,
 * group 4 optional title remainder on the line.
 */
export const ADMONITION_DIRECTIVE_WITH_TAIL_RE = new RegExp(
  `^(\\s*)(:{3,}\\s*${ADMONITION_KEYWORD}(?:\\{[^}]*\\})?)(\\s*)([^\\n]*)$`
);

/**
 * Pandoc / MyST brace opener: group 1 indent, group 2 `::: {.note}` or `:::{note}`,
 * group 3 spacing, group 4 optional title after the closing `}`.
 */
export const ADMONITION_FENCED_DIV_RE = /^(\s*)(:{3,}\s*\{[^}]*\})(\s*)([^\n]*)$/;

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

/**
 * Generic opener detector (no indent): group 1 is the leading colon run.
 * Followed by optional space and a word (`::: tip`) or a `{` brace opener (`::: {.note}`, `:::{note}`).
 */
export const ADMONITION_OPENER_COLONS_RE = /^(:{3,})(?:\s*\w|\s*\{)/;

/**
 * GitHub / Obsidian callout marker. Group 1 is `> [!NOTE]` (optional Obsidian fold `+` / `-`),
 * group 2 is the spacing before a custom title, group 3 is that title.
 * Official GitHub alerts use an empty title. Any `[!type]` is kept so Obsidian types
 * (`info`, `danger`, custom names) are not rewritten by the model.
 */
export const GITHUB_ALERT_LINE_RE = /^(\s*>\s*\[![A-Za-z][\w-]*\][+-]?)(\s*)(.*)$/;

/**
 * A bracketed-title opener whose `[` is never closed on the same line
 * (e.g. `:::note[Title` with no `]`). Used to flag malformed titles.
 */
export const ADMONITION_UNTERMINATED_TITLE_RE = new RegExp(
  `^(\\s*)(:{3,}\\s*${ADMONITION_KEYWORD})\\[[^\\]]*$`
);

/** `!!!`, `???`, or `???+` (MkDocs Material / pymdownx). */
export const MKDOCS_ADMONITION_MARKER = "(?:!!!|\\?{3}\\+?)";

/**
 * Well-formed MkDocs opener.
 * Group 1 indent, group 2 marker, group 3 type and optional classes (leading space included),
 * group 4 spacing plus opening `"`, group 5 title, group 6 closing `"`.
 * Groups 4–6 are absent when there is no quoted title.
 */
export const MKDOCS_ADMONITION_OPENER_RE = new RegExp(
  `^(\\s*)(${MKDOCS_ADMONITION_MARKER})([ \\t]+[A-Za-z][\\w-]*(?:[ \\t]+[\\w-]+)*)(?:([ \\t]+")([^"]*)("))?[ \\t]*$`
);

/** Marker plus type plus an opening `"` that is not a well-formed quoted title. */
export const MKDOCS_ADMONITION_TITLE_START_RE = new RegExp(
  `^\\s*${MKDOCS_ADMONITION_MARKER}[ \\t]+[A-Za-z][\\w-]*(?:[ \\t]+[\\w-]+)*[ \\t]+"`
);

/** Bare `!!!` / `???` / `???+` with no type. */
export const MKDOCS_ADMONITION_MISSING_TYPE_RE = /^\s*(?:!!!|\?{3}\+?)[ \t]*$/;

/** Body lines must be indented at least this many columns past the marker. */
export const MKDOCS_ADMONITION_BODY_INDENT = 4;

function leadingWhitespaceWidth(line: string): number {
  const match = /^[ \t]*/.exec(line);
  return match ? match[0].length : 0;
}

/**
 * Inclusive end index of a MkDocs admonition that starts at `startIndex`.
 * The body is every following line indented at least four columns past the marker.
 * Blank lines stay inside only when the next non-blank line is still indented.
 * Trailing blank lines stay outside the block.
 */
export function mkdocsAdmonitionEndIndex(lines: readonly string[], startIndex: number): number {
  const minIndent = leadingWhitespaceWidth(lines[startIndex] ?? "") + MKDOCS_ADMONITION_BODY_INDENT;
  let end = startIndex;
  let i = startIndex + 1;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.trim() === "") {
      let j = i + 1;
      while (j < lines.length && (lines[j] ?? "").trim() === "") {
        j++;
      }
      if (j >= lines.length || leadingWhitespaceWidth(lines[j] ?? "") < minIndent) {
        break;
      }
      end = j - 1;
      i = j;
      continue;
    }
    if (leadingWhitespaceWidth(line) < minIndent) {
      break;
    }
    end = i;
    i++;
  }
  return end;
}
