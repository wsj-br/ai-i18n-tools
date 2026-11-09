import { isCodeFenceClose, matchCodeFenceOpen, type OpenCodeFence } from "./code-fence.js";

/**
 * Shared admonition fence syntax for title masking, MkDocs markers, and prose detection.
 * Open and close ranges for `:::` containers live in `colon-container-parser.ts` so the
 * extractor, diagnostics, and placeholder protector use one VitePress-compatible match.
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
 * A closing fence with no list or blockquote marker. The colon container parser masks
 * `> :::` and other structured closers first; this is the indented fallback.
 */
export const ADMONITION_CLOSING_RE = /^\s*(:::+)\s*$/;

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

/** Drop leading blockquote markers and one list marker so a fence can be read after them. */
function stripBlockMarkerPrefix(line: string): string {
  let rest = line;
  for (let depth = 0; depth < 8; depth++) {
    const quote = /^[ \t]{0,3}>[ \t]?/.exec(rest);
    if (!quote) {
      break;
    }
    rest = rest.slice(quote[0].length);
  }
  const list = /^[ \t]{0,3}(?:[-+*]|\d{1,9}[.)])[ \t]+/.exec(rest);
  if (list) {
    rest = rest.slice(list[0].length);
  }
  return rest;
}

/**
 * True when `line` opens a bracketed admonition title that never reaches `]`.
 * List and blockquote markers are ignored so `> :::note[Title` is included.
 */
export function lineOpensUnterminatedAdmonitionTitle(line: string): boolean {
  if (ADMONITION_UNTERMINATED_TITLE_RE.test(line)) {
    return true;
  }
  const stripped = stripBlockMarkerPrefix(line);
  return stripped !== line && ADMONITION_UNTERMINATED_TITLE_RE.test(stripped);
}

/**
 * Title text on a container opener, `""` for a bare opener or closer, or `null` when `line`
 * is ordinary prose. Custom containers (`::: code-group`) count as bare when they have no title.
 * A closer may be indented up to three spaces, or sit after a list or blockquote marker.
 */
function containerBoundaryTitle(line: string): string | null {
  const rest = stripBlockMarkerPrefix(line);
  if (/^[ \t]{0,3}:{3,}[ \t]*$/.test(rest)) {
    return "";
  }
  const bracketed = rest.match(ADMONITION_BRACKETED_TITLE_RE);
  if (bracketed) {
    return bracketed[3] ?? "";
  }
  const fencedDiv = rest.match(ADMONITION_FENCED_DIV_RE);
  if (fencedDiv) {
    return fencedDiv[4] ?? "";
  }
  const directive = rest.match(ADMONITION_DIRECTIVE_WITH_TAIL_RE);
  if (directive) {
    return directive[4] ?? "";
  }
  const mkdocs = rest.match(MKDOCS_ADMONITION_OPENER_RE);
  if (mkdocs) {
    return mkdocs[5] ?? "";
  }
  const custom = /^[ \t]{0,3}:{3,}[ \t]*\S+(?:[ \t]+(.*))?$/.exec(rest);
  if (custom) {
    return custom[1] ?? "";
  }
  return null;
}

/**
 * True when a container has a title or body prose the model should translate.
 * Fenced code, including VitePress tab labels on the info string, is not prose.
 * A container whose body is only fences (such as `::: code-group`) is copied through unchanged.
 */
export function containerHasTranslatableProse(content: string): boolean {
  const lines = content.split("\n");
  let fence: OpenCodeFence | null = null;
  for (const line of lines) {
    if (fence) {
      if (isCodeFenceClose(line, fence)) {
        fence = null;
      }
      continue;
    }
    const opened = matchCodeFenceOpen(line);
    if (opened) {
      fence = opened;
      continue;
    }
    if (line.trim() === "") {
      continue;
    }
    const title = containerBoundaryTitle(line);
    if (title === null || title.trim().length > 0) {
      return true;
    }
  }
  return false;
}

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
