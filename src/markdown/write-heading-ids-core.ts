/**
 * Insert `<a id="…"></a>` immediately before flat ATX headings (doctoc-compatible slug modes).
 */

import emojiRegex from "emoji-regex";
import matter from "gray-matter";
const matterStringify = matter.stringify;
import removeMarkdown from "remove-markdown";

/** Slug algorithms aligned with doctoc / anchor-markdown-header modes. */
export type SlugStyle = "github" | "bitbucket" | "gitlab" | "pymdown" | "azure-devops";

export interface PymdownSlugOptions {
  case: "lower" | "title" | "none";
  normalize: "nfc" | "nfd" | "none";
  percentEncode: boolean;
}

const ATX_HEADING_RE = /^(#{1,6})\s+(.+)$/;
const EXISTING_HEADING_ID_RE = /\{#[^}]+\}/;
const HTML_ANCHOR_LINE_RE = /^\s*<a\s+id\s*=\s*(["'])([^"']*)\1[^>]*>\s*<\/a>\s*$/i;

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

function headingTitleKey(trimmedHeadingLine: string): string {
  const m = trimmedHeadingLine.match(ATX_HEADING_RE);
  return m ? m[2]!.trim() : trimmedHeadingLine;
}

function stripHeadingSuffixForSlug(titlePart: string): string {
  return titlePart.replace(EXISTING_HEADING_ID_RE, "").trim();
}

function computeRawSlug(titlePart: string, repetition: number, ctx: SlugContext): string {
  const trimmed = stripHeadingSuffixForSlug(titlePart);
  switch (ctx.style) {
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
      const exhaustive: never = ctx.style;
      throw new Error(`Unsupported slug style: ${String(exhaustive)}`);
    }
  }
}

function finalizeFragmentForId(rawSlug: string, style: SlugStyle): string {
  if (style === "github") {
    return githubEncodeURI(rawSlug);
  }
  return rawSlug;
}

function escapeAttrValue(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * Inserts `<a id="slug"></a>` on the line directly above each ATX heading (outside fenced code).
 * Skips headings that already have `{#…}` on the line or an `<a id=…>` on the immediately preceding line.
 */
export function injectHtmlHeadingAnchors(markdownBody: string, ctx: SlugContext): string {
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

    const hm = line.match(ATX_HEADING_RE);
    if (hm) {
      const fullTitle = hm[2]!;
      if (EXISTING_HEADING_ID_RE.test(fullTitle)) {
        i += 1;
        continue;
      }
      if (i > 0) {
        const prev = lines[i - 1]!;
        if (HTML_ANCHOR_LINE_RE.test(prev)) {
          i += 1;
          continue;
        }
      }

      const key = headingTitleKey(line);
      const prevCount = ctx.counts.get(key) ?? 0;
      ctx.counts.set(key, prevCount + 1);
      const repetition = prevCount;

      const raw = computeRawSlug(fullTitle, repetition, ctx);
      const fragment = finalizeFragmentForId(raw, ctx.style);
      const idAttr = escapeAttrValue(fragment);
      const anchorLine = `<a id="${idAttr}"></a>`;
      lines.splice(i, 0, anchorLine);
      i += 2;
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
  pymdown?: PymdownSlugOptions
): string {
  const parsed = matter(markdown);
  const content = typeof parsed.content === "string" ? parsed.content : String(parsed.content);
  const ctx: SlugContext = {
    style,
    pymdown: style === "pymdown" ? (pymdown ?? defaultPymdownOptions()) : undefined,
    counts: new Map(),
  };
  const nextBody = injectHtmlHeadingAnchors(content, ctx);
  if (nextBody === content) {
    return markdown;
  }
  return matterStringify(nextBody, parsed.data);
}
