/**
 * Insert heading anchors for `write-heading-ids`: HTML `<a id="…"></a>` lines, or
 * Docusaurus MDX comment suffixes (doctoc-compatible slug modes).
 */

import emojiRegex from "emoji-regex";
import matter from "@11ty/gray-matter";
const matterStringify = matter.stringify;
import removeMarkdown from "remove-markdown";
import {
  isCodeFenceClose,
  matchCodeFenceOpen,
  type OpenCodeFence,
} from "../processors/code-fence.js";

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

function htmlAnchorId(line: string): string | undefined {
  return line.match(HTML_ANCHOR_LINE_RE)?.[2];
}

function isBlankLine(line: string): boolean {
  return line.trim() === "";
}

interface PrecedingAnchorBlock {
  /** First `<a id>` line of the run directly above the heading. */
  start: number;
  ids: string[];
}

/**
 * `<a id>` lines above a heading. Blank lines between those anchors, and between
 * the run and the heading, stay inside the block. Any other line ends the walk,
 * so anchors that sit above a paragraph or a table are not heading anchors.
 */
function precedingHtmlAnchorBlock(
  lines: string[],
  headingIndex: number
): PrecedingAnchorBlock | null {
  let i = headingIndex - 1;
  let start = -1;
  const idsRev: string[] = [];
  while (i >= 0) {
    const line = lines[i]!;
    if (isBlankLine(line)) {
      i -= 1;
      continue;
    }
    const id = htmlAnchorId(line);
    if (id === undefined) {
      break;
    }
    idsRev.push(id);
    start = i;
    i -= 1;
  }
  if (start < 0) {
    return null;
  }
  return { start, ids: idsRev.reverse() };
}

/**
 * Replace the heading's HTML-anchor block with `replacement` (`null` drops it).
 * Returns the heading's index after the edit and the ids that were not kept.
 */
function collapsePrecedingHtmlAnchors(
  lines: string[],
  headingIndex: number,
  replacement: string | null,
  keptId: string
): { headingIndex: number; removedIds: string[] } {
  const block = precedingHtmlAnchorBlock(lines, headingIndex);
  if (!block) {
    if (replacement === null) {
      return { headingIndex, removedIds: [] };
    }
    lines.splice(headingIndex, 0, replacement);
    return { headingIndex: headingIndex + 1, removedIds: [] };
  }

  const removedIds = block.ids.filter((id) => id !== keptId);
  const alreadyOne =
    replacement !== null &&
    block.ids.length === 1 &&
    block.ids[0] === keptId &&
    block.start === headingIndex - 1 &&
    lines[block.start] === replacement;
  if (alreadyOne) {
    return { headingIndex, removedIds: [] };
  }

  const insert = replacement === null ? [] : [replacement];
  lines.splice(block.start, headingIndex - block.start, ...insert);
  return { headingIndex: block.start + insert.length, removedIds };
}

function noteHeadingRedirect(
  redirects: Map<string, string>,
  conflicts: Set<string>,
  removed: string,
  kept: string
): void {
  if (removed === kept || conflicts.has(removed)) {
    return;
  }
  const prev = redirects.get(removed);
  if (prev === undefined) {
    redirects.set(removed, kept);
    return;
  }
  if (prev !== kept) {
    redirects.delete(removed);
    conflicts.add(removed);
  }
}

function collectHtmlAnchorIds(lines: string[]): Set<string> {
  const ids = new Set<string>();
  let fence: OpenCodeFence | null = null;
  for (const line of lines) {
    if (fence) {
      if (isCodeFenceClose(line, fence)) {
        fence = null;
      }
      continue;
    }
    const fenceOpen = matchCodeFenceOpen(line);
    if (fenceOpen) {
      fence = fenceOpen;
      continue;
    }
    const id = htmlAnchorId(line);
    if (id !== undefined) {
      ids.add(id);
    }
  }
  return ids;
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
 * Fence-aware walk of ATX headings. An explicit `{#id}` or MDX comment suffix wins.
 * Otherwise the id is the HTML anchor in the block directly above the heading, or
 * `undefined` when that heading has neither.
 */
export function extractHeadingIds(markdownBody: string): (string | undefined)[] {
  const ids: (string | undefined)[] = [];
  const lines = markdownBody.split("\n");
  let fence: OpenCodeFence | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (fence) {
      if (isCodeFenceClose(line, fence)) {
        fence = null;
      }
      continue;
    }

    const fenceOpen = matchCodeFenceOpen(line);
    if (fenceOpen) {
      fence = fenceOpen;
      continue;
    }

    const hm = line.match(ATX_HEADING_RE);
    if (!hm) {
      continue;
    }
    const explicit = parseExplicitHeadingId(hm[2]!).id;
    if (explicit !== undefined) {
      ids.push(explicit);
      continue;
    }
    const block = precedingHtmlAnchorBlock(lines, i);
    ids.push(block && block.ids.length > 0 ? block.ids[block.ids.length - 1] : undefined);
  }

  return ids;
}

/**
 * Write known English heading ids onto translated ATX headings in document order.
 * Strips any embedded classic / MDX heading-id token (including mid-line) and the
 * whole HTML-anchor block above the heading, then writes the known id in `style`.
 * Headings with no corresponding known id are left untouched.
 */
export function applyKnownHeadingIds(
  markdownBody: string,
  ids: (string | undefined)[],
  style: SlugStyle
): string {
  const lines = markdownBody.split("\n");
  let fence: OpenCodeFence | null = null;
  let i = 0;
  let headingIndex = 0;
  const htmlStyle = style !== "mdx-comment";

  while (i < lines.length) {
    const line = lines[i]!;
    if (fence) {
      if (isCodeFenceClose(line, fence)) {
        fence = null;
      }
      i += 1;
      continue;
    }

    const fenceOpen = matchCodeFenceOpen(line);
    if (fenceOpen) {
      fence = fenceOpen;
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
        const collapsed = collapsePrecedingHtmlAnchors(
          lines,
          i,
          formatHtmlAnchorLine(knownId),
          knownId
        );
        lines[collapsed.headingIndex] = clean;
        i = collapsed.headingIndex + 1;
        continue;
      }

      const collapsed = collapsePrecedingHtmlAnchors(lines, i, null, knownId);
      lines[collapsed.headingIndex] = formatHeadingWithMdxComment(hashes, visibleTitle, knownId);
      i = collapsed.headingIndex + 1;
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
  let fence: OpenCodeFence | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    if (fence) {
      if (isCodeFenceClose(line, fence)) {
        fence = null;
      }
      i += 1;
      continue;
    }

    const fenceOpen = matchCodeFenceOpen(line);
    if (fenceOpen) {
      fence = fenceOpen;
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
  let fence: OpenCodeFence | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    if (fence) {
      if (isCodeFenceClose(line, fence)) {
        fence = null;
      }
      i += 1;
      continue;
    }

    const fenceOpen = matchCodeFenceOpen(line);
    if (fenceOpen) {
      fence = fenceOpen;
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

export interface HeadingAnchorRewrite {
  body: string;
  /** Removed heading ids that are no longer live, mapped to the id that replaced them. */
  redirects: Map<string, string>;
}

/**
 * Rewrites ATX headings (outside fenced code) to the selected slug style. HTML styles leave
 * one `<a id="slug"></a>` immediately above a suffix-free heading and drop any older anchors
 * stacked in that block. `mdx-comment` writes the id on the heading line and drops the whole
 * preceding HTML-anchor block. Slugs always come from visible heading text.
 * `redirects` maps a removed id to the kept id when that removed id is no longer an anchor.
 */
export function rewriteHeadingAnchors(
  markdownBody: string,
  ctx: SlugContext
): HeadingAnchorRewrite {
  const lines = markdownBody.split("\n");
  let fence: OpenCodeFence | null = null;
  let i = 0;
  const htmlStyle = ctx.style !== "mdx-comment";
  const redirects = new Map<string, string>();
  const conflicts = new Set<string>();
  const live = new Set<string>();

  while (i < lines.length) {
    const line = lines[i]!;
    if (fence) {
      if (isCodeFenceClose(line, fence)) {
        fence = null;
      }
      i += 1;
      continue;
    }

    const fenceOpen = matchCodeFenceOpen(line);
    if (fenceOpen) {
      fence = fenceOpen;
      i += 1;
      continue;
    }

    const hm = line.match(ATX_HEADING_RE);
    if (hm) {
      const hashes = hm[1]!;
      const parsed = parseExplicitHeadingId(hm[2]!);
      const expectedId = computeAnchorIdForHeading(parsed.text, line, ctx);
      live.add(expectedId);
      if (parsed.id && parsed.id !== expectedId) {
        noteHeadingRedirect(redirects, conflicts, parsed.id, expectedId);
      }

      if (htmlStyle) {
        const clean = formatCleanHeading(hashes, parsed.text);
        const collapsed = collapsePrecedingHtmlAnchors(
          lines,
          i,
          formatHtmlAnchorLine(expectedId),
          expectedId
        );
        for (const id of collapsed.removedIds) {
          noteHeadingRedirect(redirects, conflicts, id, expectedId);
        }
        lines[collapsed.headingIndex] = clean;
        i = collapsed.headingIndex + 1;
        continue;
      }

      const collapsed = collapsePrecedingHtmlAnchors(lines, i, null, expectedId);
      for (const id of collapsed.removedIds) {
        noteHeadingRedirect(redirects, conflicts, id, expectedId);
      }
      lines[collapsed.headingIndex] = formatHeadingWithMdxComment(hashes, parsed.text, expectedId);
      i = collapsed.headingIndex + 1;
      continue;
    }

    i += 1;
  }

  for (const id of collectHtmlAnchorIds(lines)) {
    live.add(id);
  }
  for (const id of live) {
    redirects.delete(id);
  }
  for (const id of conflicts) {
    redirects.delete(id);
  }

  return { body: lines.join("\n"), redirects };
}

/**
 * Rewrites ATX headings (outside fenced code) to the selected slug style, replacing any existing
 * HTML `<a id>` line, classic `{#id}` suffix, or MDX comment id. HTML styles write one
 * `<a id="slug"></a>` immediately above a suffix-free heading and drop older anchors stacked
 * above it. `mdx-comment` writes the id on the heading line and drops the preceding HTML-anchor
 * block. Slugs always come from visible heading text (existing custom ids are not kept).
 */
export function injectHtmlHeadingAnchors(markdownBody: string, ctx: SlugContext): string {
  return rewriteHeadingAnchors(markdownBody, ctx).body;
}

const MD_LINK_DEST_RE = /\]\(([^)\s]+)\)/g;

function retargetLinkDests(
  segment: string,
  resolveRedirects: (linkPath: string) => ReadonlyMap<string, string> | undefined
): string {
  return segment.replace(MD_LINK_DEST_RE, (full, dest: string) => {
    if (dest.startsWith("<")) {
      return full;
    }
    const hash = dest.indexOf("#");
    if (hash < 0) {
      return full;
    }
    const linkPath = dest.slice(0, hash);
    const query = linkPath.indexOf("?");
    const pathForResolve = query === -1 ? linkPath : linkPath.slice(0, query);
    const fragment = dest.slice(hash + 1);
    if (fragment.length === 0) {
      return full;
    }
    const map = resolveRedirects(pathForResolve);
    const next = map?.get(fragment);
    if (!next || next === fragment) {
      return full;
    }
    return `](${linkPath}#${next})`;
  });
}

/** Rewrite markdown link fragments on one line, leaving inline code spans unchanged. */
function retargetLineOutsideCodeSpans(
  line: string,
  resolveRedirects: (linkPath: string) => ReadonlyMap<string, string> | undefined
): string {
  let result = "";
  let i = 0;
  while (i < line.length) {
    const tick = line.indexOf("`", i);
    const end = tick === -1 ? line.length : tick;
    result += retargetLinkDests(line.slice(i, end), resolveRedirects);
    if (tick === -1) {
      break;
    }
    const close = line.indexOf("`", tick + 1);
    if (close === -1) {
      result += line.slice(tick);
      break;
    }
    result += line.slice(tick, close + 1);
    i = close + 1;
  }
  return result;
}

/**
 * Outside fenced code, replace a markdown link fragment when `resolveRedirects` maps it.
 * `linkPath` is the URL before `#` (`""` for a same-file `#fragment`). An undefined map
 * leaves that link alone.
 */
export function retargetMarkdownHeadingFragments(
  markdown: string,
  resolveRedirects: (linkPath: string) => ReadonlyMap<string, string> | undefined
): string {
  const lines = markdown.split("\n");
  let fence: OpenCodeFence | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (fence) {
      if (isCodeFenceClose(line, fence)) {
        fence = null;
      }
      continue;
    }
    const fenceOpen = matchCodeFenceOpen(line);
    if (fenceOpen) {
      fence = fenceOpen;
      continue;
    }
    const next = retargetLineOutsideCodeSpans(line, resolveRedirects);
    if (next !== line) {
      lines[i] = next;
    }
  }
  return lines.join("\n");
}

function toPosixPath(p: string): string {
  return p.replace(/\\/g, "/");
}

function normalizePosixPath(p: string): string {
  const parts: string[] = [];
  for (const seg of toPosixPath(p).split("/")) {
    if (seg === "" || seg === ".") {
      continue;
    }
    if (seg === "..") {
      parts.pop();
      continue;
    }
    parts.push(seg);
  }
  return parts.join("/");
}

function matchKnownDocFile(candidate: string, knownFiles: ReadonlySet<string>): string | undefined {
  const noExt = candidate.replace(/\.mdx?$/i, "");
  const options = [
    candidate,
    `${noExt}.md`,
    `${noExt}.mdx`,
    `${noExt}/index.md`,
    `${noExt}/index.mdx`,
  ];
  for (const opt of options) {
    if (knownFiles.has(opt)) {
      return opt;
    }
  }
  return undefined;
}

/**
 * Map a markdown link path to a processed source file. An empty path is the file that
 * contains the link. Site routes (`/guide/foo`) try `docs/` plus the route, after a
 * leading locale prefix is removed. External URLs are not resolved.
 */
export function resolveHeadingFragmentTarget(args: {
  fromRel: string;
  linkPath: string;
  knownFiles: ReadonlySet<string>;
  localePrefixes: readonly string[];
}): string | undefined {
  let linkPath = args.linkPath.trim();
  if (linkPath === "") {
    return args.fromRel;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(linkPath)) {
    return undefined;
  }

  const hash = linkPath.indexOf("#");
  if (hash >= 0) {
    linkPath = linkPath.slice(0, hash);
  }
  const query = linkPath.indexOf("?");
  if (query >= 0) {
    linkPath = linkPath.slice(0, query);
  }
  if (linkPath === "") {
    return args.fromRel;
  }

  linkPath = toPosixPath(linkPath);
  const candidates: string[] = [];
  if (linkPath.startsWith("/")) {
    let route = linkPath.replace(/\/+$/, "");
    const prefixes = [...args.localePrefixes].sort((a, b) => b.length - a.length);
    for (const loc of prefixes) {
      if (route === `/${loc}` || route.startsWith(`/${loc}/`)) {
        route = route.slice(loc.length + 1);
        if (route === "") {
          route = "/";
        }
        break;
      }
    }
    if (route.startsWith("/")) {
      route = route.slice(1);
    }
    route = route.replace(/\/+$/, "");
    if (route === "" || route === "index") {
      candidates.push("index", "docs/index", "README");
    } else {
      candidates.push(route, `docs/${route}`);
    }
  } else {
    const from = toPosixPath(args.fromRel);
    const dir = from.includes("/") ? from.slice(0, from.lastIndexOf("/")) : "";
    candidates.push(normalizePosixPath(dir.length > 0 ? `${dir}/${linkPath}` : linkPath));
  }

  for (const candidate of candidates) {
    const hit = matchKnownDocFile(candidate, args.knownFiles);
    if (hit) {
      return hit;
    }
  }
  return undefined;
}

export function defaultPymdownOptions(): PymdownSlugOptions {
  return {
    case: "lower",
    normalize: "nfc",
    percentEncode: true,
  };
}

export interface HeadingAnchorsMarkdownResult {
  markdown: string;
  redirects: Map<string, string>;
}

/** Same as {@link applyHeadingAnchorsToMarkdown}, plus ids removed by the rewrite. */
export function applyHeadingAnchorsToMarkdownDetailed(
  markdown: string,
  style: SlugStyle,
  pymdown?: PymdownSlugOptions,
  remove = false
): HeadingAnchorsMarkdownResult {
  const parsed = matter(markdown);
  const content = typeof parsed.content === "string" ? parsed.content : String(parsed.content);
  if (remove) {
    const nextBody = stripHeadingIds(content);
    return {
      markdown: nextBody === content ? markdown : matterStringify(nextBody, parsed.data),
      redirects: new Map(),
    };
  }
  const rewritten = rewriteHeadingAnchors(content, {
    style,
    pymdown: style === "pymdown" ? (pymdown ?? defaultPymdownOptions()) : undefined,
    counts: new Map(),
  });
  return {
    markdown: rewritten.body === content ? markdown : matterStringify(rewritten.body, parsed.data),
    redirects: rewritten.redirects,
  };
}

export function applyHeadingAnchorsToMarkdown(
  markdown: string,
  style: SlugStyle,
  pymdown?: PymdownSlugOptions,
  remove = false
): string {
  return applyHeadingAnchorsToMarkdownDetailed(markdown, style, pymdown, remove).markdown;
}
