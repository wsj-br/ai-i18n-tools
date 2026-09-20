/**
 * Insert heading anchors for `write-heading-ids`: HTML `<a id="…"></a>` lines, or
 * Docusaurus MDX comment suffixes (doctoc-compatible slug modes).
 */

import emojiRegex from "emoji-regex";
import matter from "@11ty/gray-matter";
const matterStringify = matter.stringify;
import removeMarkdown from "remove-markdown";

/** Slug algorithms / output modes aligned with doctoc / anchor-markdown-header / Docusaurus. */
export type SlugStyle =
  "github" | "bitbucket" | "gitlab" | "pymdown" | "azure-devops" | "mdx-comment";

export interface PymdownSlugOptions {
  case: "lower" | "title" | "none";
  normalize: "nfc" | "nfd" | "none";
  percentEncode: boolean;
}

export const ATX_HEADING_RE = /^(#{1,6})\s+(.+)$/;
/** Classic Docusaurus / CommonMark heading id: `{#my-id}` at end of title. */
const CLASSIC_HEADING_ID_RE = /\s*\{#([^}]+)\}\s*$/;
/**
 * Docusaurus MDX-comment heading id at end of title (brace + slash-star + `#id` + star-slash + brace).
 * Id token matches Docusaurus (`\S+`); trailing whitespace before the closing comment allowed.
 */
const MDX_COMMENT_HEADING_ID_RE = /\s*\{\/\*\s*#(\S+)\s*\*\/\}\s*$/;
const HTML_ANCHOR_LINE_RE = /^\s*<a\s+id\s*=\s*(["'])([^"']*)\1[^>]*>\s*<\/a>\s*$/i;
/** Classic `{#id}` anywhere in a heading title (including mid-line after translation). */
const CLASSIC_HEADING_ID_ANYWHERE_RE = /\s*\{#[^}]+\}/g;
/** MDX heading-id comment (brace + slash-star + `#id` + star-slash + brace) anywhere in a title. */
const MDX_COMMENT_HEADING_ID_ANYWHERE_RE = /\s*\{\/\*\s*#\S+\s*\*\/\}/g;

function asciiOnlyToLowerCase(input: string): string {
  let result = "";
  for (let i = 0; i < input.length; ++i) {
    const c = input[i]!;
    if (c >= "A" && c <= "Z") {
      result += c.toLowerCase();
    } else {
      result += c;
    }
  }
  return result;
}

function githubEncodeURI(uri: string): string {
  return encodeURI(uri).replace(/%E2%80%8D/g, "\u200D");
}

function basicGithubId(text: string): string {
  return text
    .replace(/ /g, "-")
    .replace(/%([abcdef]|\d){2}/gi, "")
    .replace(/[/\\?!%:[\]`.,()*"';{}+=<>~$|#@&–—]/g, "")
    .replace(/[。？！，、；：“”【】（）〔〕［］﹃﹄""''﹁﹂—…－～《》〈〉「」]/g, "")
    .replace(/[¡¢£¤¥¦§¨©«¬®¯°±²³´¶·¸¹»¼½¾¿]/g, "");
}

function getGithubId(text: string, repetition: number): string {
  let out = basicGithubId(text);
  if (repetition) {
    out += "-" + repetition;
  }
  out = out.replace(emojiRegex(), "");
  out = removeMarkdown(out);
  return out;
}

function getBitbucketId(text: string, repetition: number): string {
  let out = "markdown-header-" + basicGithubId(text);
  out = out.replace(/-+/g, "-");
  if (repetition) {
    out += "_" + repetition;
  }
  return out;
}

function getGitlabId(text: string, repetition: number): string {
  let out = text
    .replace(/<(.*)>(.*)<\/\1>/g, "$2")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[(.*)\]\(.*\)/, "$1")
    .replace(/\s+/g, "-")
    .replace(/[/?!:[\]`.,()*"';{}+=<>~$|#@]/g, "")
    .replace(/[。？！，、；：“”【】（）〔〕［］﹃﹄""''﹁﹂—…－～《》〈〉「」]/g, "")
    .replace(/[¹²³]/g, "")
    .replace(/[-]+/g, "-")
    .replace(/^-/, "")
    .replace(/-$/, "");
  if (repetition) {
    out += "-" + repetition;
  }
  return out;
}

const PYM_TAGS = /<[^>]*>/g;
const PYM_INVALID = /[^\p{L}\p{N}_\- ]/gu;

function titleCaseWord(s: string): string {
  if (s.length === 0) return s;
  return s[0]!.toUpperCase() + s.slice(1).toLowerCase();
}

/** PyMdown `_uslugify`-style slug (sep = `-`). */
export function slugPymdown(title: string, repetition: number, opts: PymdownSlugOptions): string {
  const sep = "-";
  let slug = title.replace(PYM_TAGS, "").trim();
  if (opts.normalize !== "none") {
    slug = slug.normalize(opts.normalize.toUpperCase() as "NFC" | "NFD");
  }
  if (opts.case === "lower") {
    slug = slug.toLowerCase();
  } else if (opts.case === "title") {
    slug = slug.split(/\s+/).filter(Boolean).map(titleCaseWord).join(" ");
  }
  slug = slug.replace(PYM_INVALID, "");
  slug = slug.replace(/ +/g, sep);
  if (repetition) {
    slug += `${sep}${repetition}`;
  }
  if (opts.percentEncode) {
    const enc = new TextEncoder().encode(slug);
    return Array.from(enc)
      .map((b) => `%${b.toString(16).toUpperCase().padStart(2, "0")}`)
      .join("");
  }
  return slug;
}

const AZURE_ZS = /\p{Zs}/gu;
/** Unreserved + hyphen for fragment-style ids after normalization. */
function azurePercentEncode(s: string): string {
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (
      (cp >= 0x41 && cp <= 0x5a) ||
      (cp >= 0x61 && cp <= 0x7a) ||
      (cp >= 0x30 && cp <= 0x39) ||
      ch === "-" ||
      ch === "." ||
      ch === "_" ||
      ch === "~"
    ) {
      out += ch;
    } else {
      out += encodeURIComponent(ch);
    }
  }
  return out;
}

export function slugAzureDevOps(title: string, repetition: number): string {
  let s = title.normalize("NFC").trim().toLowerCase();
  s = s.replace(AZURE_ZS, "-");
  s = s.replace(/-+/g, "-").replace(/^-/, "").replace(/-$/, "");
  s = azurePercentEncode(s);
  if (repetition) {
    s += "-" + repetition;
  }
  return s;
}

export interface SlugContext {
  style: SlugStyle;
  pymdown?: PymdownSlugOptions;
  /** Map base heading title key → occurrence count (for anchor-markdown-header repetition). */
  counts: Map<string, number>;
}

export type ExplicitHeadingIdKind = "classic" | "mdx-comment";

export interface ParsedHeadingTitle {
  /** Visible heading text with any trailing id suffix removed. */
  text: string;
  id?: string;
  kind?: ExplicitHeadingIdKind;
}

/** Parse classic `{#id}` or MDX comment (`mdx-comment`) suffix at the end of an ATX title part. */
export function parseExplicitHeadingId(titlePart: string): ParsedHeadingTitle {
  const classic = titlePart.match(CLASSIC_HEADING_ID_RE);
  if (classic) {
    return {
      text: titlePart.slice(0, classic.index).trimEnd(),
      id: classic[1]!.trim(),
      kind: "classic",
    };
  }
  const mdx = titlePart.match(MDX_COMMENT_HEADING_ID_RE);
  if (mdx) {
    return {
      text: titlePart.slice(0, mdx.index).trimEnd(),
      id: mdx[1]!.trim(),
      kind: "mdx-comment",
    };
  }
  return { text: titlePart.trim() };
}

function headingTitleKey(trimmedHeadingLine: string): string {
  const m = trimmedHeadingLine.match(ATX_HEADING_RE);
  if (!m) return trimmedHeadingLine;
  return parseExplicitHeadingId(m[2]!).text;
}

function stripHeadingSuffixForSlug(titlePart: string): string {
  return parseExplicitHeadingId(titlePart).text;
}

function computeRawSlug(titlePart: string, repetition: number, ctx: SlugContext): string {
  const trimmed = stripHeadingSuffixForSlug(titlePart);
  // mdx-comment uses the github / doctoc algorithm; only the written suffix differs.
  const styleForSlug: Exclude<SlugStyle, "mdx-comment"> =
    ctx.style === "mdx-comment" ? "github" : ctx.style;
  switch (styleForSlug) {
    case "github": {
      const lower = trimmed.toLowerCase();
      return getGithubId(lower, repetition);
    }
    case "bitbucket": {
      const cased = asciiOnlyToLowerCase(trimmed);
      return getBitbucketId(cased, repetition);
    }
    case "gitlab": {
      const cased = asciiOnlyToLowerCase(trimmed);
      return getGitlabId(cased, repetition);
    }
    case "pymdown":
      return slugPymdown(trimmed, repetition, ctx.pymdown!);
    case "azure-devops":
      return slugAzureDevOps(trimmed, repetition);
    default: {
      const exhaustive: never = styleForSlug;
      throw new Error(`Unsupported slug style: ${String(exhaustive)}`);
    }
  }
}

function finalizeFragmentForId(rawSlug: string, style: SlugStyle): string {
  if (style === "github" || style === "mdx-comment") {
    return githubEncodeURI(rawSlug);
  }
  return rawSlug;
}

function escapeAttrValue(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function nextHeadingRepetition(line: string, ctx: SlugContext): number {
  const key = headingTitleKey(line);
  const prevCount = ctx.counts.get(key) ?? 0;
  ctx.counts.set(key, prevCount + 1);
  return prevCount;
}

function computeAnchorIdForHeading(fullTitle: string, line: string, ctx: SlugContext): string {
  const repetition = nextHeadingRepetition(line, ctx);
  const raw = computeRawSlug(fullTitle, repetition, ctx);
  return finalizeFragmentForId(raw, ctx.style);
}

function formatHtmlAnchorLine(id: string): string {
  return `<a id="${escapeAttrValue(id)}"></a>`;
}

function formatMdxCommentSuffix(id: string): string {
  return `{/* #${id} */}`;
}

function formatHeadingWithMdxComment(hashes: string, visibleTitle: string, id: string): string {
  return `${hashes} ${visibleTitle} ${formatMdxCommentSuffix(id)}`;
}

function formatCleanHeading(hashes: string, visibleTitle: string): string {
  return `${hashes} ${visibleTitle}`;
}

function precedingLineIsHtmlAnchor(lines: string[], headingIndex: number): boolean {
  return headingIndex > 0 && HTML_ANCHOR_LINE_RE.test(lines[headingIndex - 1]!);
}

/**
 * Remove classic `{#id}` / MDX heading-id comment tokens anywhere in a heading title
 * (trailing suffix or mid-line after translation reordering).
 */
function stripEmbeddedHeadingIdTokens(titlePart: string): string {
  const next = titlePart
    .replace(MDX_COMMENT_HEADING_ID_ANYWHERE_RE, "")
    .replace(CLASSIC_HEADING_ID_ANYWHERE_RE, "");
  if (next === titlePart) {
    return titlePart;
  }
  return next.trim();
}

/**
 * Fence-aware walk of ATX headings; returns each heading's explicit id (or `undefined`
 * when the title has no end-of-line `{#id}` or MDX heading-id comment suffix).
 */
export function extractHeadingIds(markdownBody: string): (string | undefined)[] {
  const ids: (string | undefined)[] = [];
  const lines = markdownBody.split("\n");
  let fence: "`" | "~" | null = null;

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (fence) {
      if (trimmed.startsWith(fence + fence + fence)) {
        fence = null;
      }
      continue;
    }

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      fence = trimmed.startsWith("```") ? "`" : "~";
      continue;
    }

    const hm = line.match(ATX_HEADING_RE);
    if (hm) {
      ids.push(parseExplicitHeadingId(hm[2]!).id);
    }
  }

  return ids;
}

/**
 * Write known English heading ids onto translated ATX headings in document order.
 * Strips any embedded classic / MDX heading-id token (including mid-line) and a
 * preceding HTML anchor, then writes the known id in `style`. Headings with no
 * corresponding known id are left untouched.
 */
export function applyKnownHeadingIds(
  markdownBody: string,
  ids: (string | undefined)[],
  style: SlugStyle
): string {
  const lines = markdownBody.split("\n");
  let fence: "`" | "~" | null = null;
  let i = 0;
  let headingIndex = 0;
  const htmlStyle = style !== "mdx-comment";

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trimStart();

    if (fence) {
      if (trimmed.startsWith(fence + fence + fence)) {
        fence = null;
      }
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      fence = trimmed.startsWith("```") ? "`" : "~";
      i += 1;
      continue;
    }

    const hm = line.match(ATX_HEADING_RE);
    if (hm) {
      const knownId = ids[headingIndex];
      headingIndex += 1;
      if (knownId === undefined) {
        i += 1;
        continue;
      }

      const hashes = hm[1]!;
      const visibleTitle = stripEmbeddedHeadingIdTokens(hm[2]!);

      if (htmlStyle) {
        const clean = formatCleanHeading(hashes, visibleTitle);
        if (precedingLineIsHtmlAnchor(lines, i)) {
          lines[i - 1] = formatHtmlAnchorLine(knownId);
          lines[i] = clean;
          i += 1;
          continue;
        }
        lines[i] = clean;
        lines.splice(i, 0, formatHtmlAnchorLine(knownId));
        i += 2;
        continue;
      }

      if (precedingLineIsHtmlAnchor(lines, i)) {
        lines.splice(i - 1, 1);
        i -= 1;
      }
      lines[i] = formatHeadingWithMdxComment(hashes, visibleTitle, knownId);
      i += 1;
      continue;
    }

    i += 1;
  }

  return lines.join("\n");
}

/**
 * Strip HTML heading-anchor lines and classic / MDX heading-id tokens anywhere in
 * ATX titles (including mid-line), outside fenced code. Used for `--remove` on
 * translated files where a suffix may no longer sit at end of line.
 */
export function stripHeadingIdsAnywhere(markdownBody: string): string {
  const lines = markdownBody.split("\n");
  let fence: "`" | "~" | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trimStart();

    if (fence) {
      if (trimmed.startsWith(fence + fence + fence)) {
        fence = null;
      }
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      fence = trimmed.startsWith("```") ? "`" : "~";
      i += 1;
      continue;
    }

    if (HTML_ANCHOR_LINE_RE.test(line)) {
      lines.splice(i, 1);
      continue;
    }

    const hm = line.match(ATX_HEADING_RE);
    if (hm) {
      const stripped = stripEmbeddedHeadingIdTokens(hm[2]!);
      if (stripped !== hm[2]!) {
        lines[i] = formatCleanHeading(hm[1]!, stripped);
      }
    }

    i += 1;
  }

  return lines.join("\n");
}

/**
 * Strip empty HTML heading-anchor lines and classic / MDX heading-id suffixes (outside fenced code).
 */
export function stripHeadingIds(markdownBody: string): string {
  const lines = markdownBody.split("\n");
  let fence: "`" | "~" | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trimStart();

    if (fence) {
      if (trimmed.startsWith(fence + fence + fence)) {
        fence = null;
      }
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      fence = trimmed.startsWith("```") ? "`" : "~";
      i += 1;
      continue;
    }

    if (HTML_ANCHOR_LINE_RE.test(line)) {
      lines.splice(i, 1);
      continue;
    }

    const hm = line.match(ATX_HEADING_RE);
    if (hm) {
      const parsed = parseExplicitHeadingId(hm[2]!);
      if (parsed.kind) {
        lines[i] = formatCleanHeading(hm[1]!, parsed.text);
      }
    }

    i += 1;
  }

  return lines.join("\n");
}

/**
 * Rewrites ATX headings (outside fenced code) to the selected slug style, replacing any existing
 * HTML `<a id>` line, classic `{#id}` suffix, or MDX comment id. HTML styles write
 * `<a id="slug"></a>` on the line above a suffix-free heading; `mdx-comment` writes the id on the
 * heading line and drops a preceding HTML anchor when present. Slugs always come from visible
 * heading text (existing custom ids are not kept).
 */
export function injectHtmlHeadingAnchors(markdownBody: string, ctx: SlugContext): string {
  const lines = markdownBody.split("\n");
  let fence: "`" | "~" | null = null;
  let i = 0;
  const htmlStyle = ctx.style !== "mdx-comment";

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trimStart();

    if (fence) {
      if (trimmed.startsWith(fence + fence + fence)) {
        fence = null;
      }
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      fence = trimmed.startsWith("```") ? "`" : "~";
      i += 1;
      continue;
    }

    const hm = line.match(ATX_HEADING_RE);
    if (hm) {
      const hashes = hm[1]!;
      const parsed = parseExplicitHeadingId(hm[2]!);
      const expectedId = computeAnchorIdForHeading(parsed.text, line, ctx);

      if (htmlStyle) {
        const clean = formatCleanHeading(hashes, parsed.text);
        if (precedingLineIsHtmlAnchor(lines, i)) {
          lines[i - 1] = formatHtmlAnchorLine(expectedId);
          lines[i] = clean;
          i += 1;
          continue;
        }
        lines[i] = clean;
        lines.splice(i, 0, formatHtmlAnchorLine(expectedId));
        i += 2;
        continue;
      }

      if (precedingLineIsHtmlAnchor(lines, i)) {
        lines.splice(i - 1, 1);
        i -= 1;
      }
      lines[i] = formatHeadingWithMdxComment(hashes, parsed.text, expectedId);
      i += 1;
      continue;
    }

    i += 1;
  }

  return lines.join("\n");
}

export function defaultPymdownOptions(): PymdownSlugOptions {
  return {
    case: "lower",
    normalize: "nfc",
    percentEncode: true,
  };
}

export function applyHeadingAnchorsToMarkdown(
  markdown: string,
  style: SlugStyle,
  pymdown?: PymdownSlugOptions,
  remove = false
): string {
  const parsed = matter(markdown);
  const content = typeof parsed.content === "string" ? parsed.content : String(parsed.content);
  const nextBody = remove
    ? stripHeadingIds(content)
    : injectHtmlHeadingAnchors(content, {
        style,
        pymdown: style === "pymdown" ? (pymdown ?? defaultPymdownOptions()) : undefined,
        counts: new Map(),
      });
  if (nextBody === content) {
    return markdown;
  }
  return matterStringify(nextBody, parsed.data);
}
