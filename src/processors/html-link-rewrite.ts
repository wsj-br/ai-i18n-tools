import fs from "fs";
import path from "path";
import type { I18nDocTranslateConfig } from "../core/types.js";
import { matchGlob } from "../cli/file-utils.js";
import { resolveDocumentationOutputPath, toPosix } from "../core/output-paths.js";
import { computePerFileDepthPrefix } from "./flat-link-rewrite.js";

export interface LocalizedAssetsConfig {
  include: string[];
  pattern: string;
  onlyIfExists: boolean;
  assetRoot?: string;
}

export interface HtmlLinkRewriteContext {
  cwd: string;
  config: I18nDocTranslateConfig;
  locale: string;
  sourceRelPath: string;
  translatedHtmlRelPaths: ReadonlySet<string>;
  localizedAssets?: LocalizedAssetsConfig;
}

/**
 * Rewrite page links to locale outputs, depth-prefix relative assets, and
 * optionally rename assets whose locale-specific file exists.
 */
export function rewriteHtmlLinks(html: string, ctx: HtmlLinkRewriteContext): string {
  const depth = computePerFileDepthPrefix(
    ctx.cwd,
    ctx.config,
    ctx.locale,
    ctx.sourceRelPath,
    "html"
  );
  return html.replace(/<[^>]+>/g, (tag) => rewriteTag(tag, ctx, depth));
}

function rewriteTag(tag: string, ctx: HtmlLinkRewriteContext, depth: string): string {
  if (!tag.startsWith("<") || tag.startsWith("</") || tag.startsWith("<!")) return tag;
  const isIcon = /^<link\b/i.test(tag) && /\brel\s*=\s*["'][^"']*icon/i.test(tag);
  let out = rewriteAttr(tag, "href", (url) =>
    isIcon ? rewriteAsset(url, ctx, depth) : rewriteHref(url, ctx, depth)
  );
  out = rewriteAttr(out, "src", (url) => rewriteAsset(url, ctx, depth));
  out = rewriteAttr(out, "poster", (url) => rewriteAsset(url, ctx, depth));
  out = rewriteSrcset(out, ctx, depth);
  if (
    /^<meta\b/i.test(out) &&
    /\b(?:property|name)\s*=\s*["'](?:og:image|twitter:image)["']/i.test(out)
  ) {
    out = rewriteAttr(out, "content", (url) => rewriteAsset(url, ctx, depth));
  }
  return out;
}

function rewriteHref(url: string, ctx: HtmlLinkRewriteContext, depth: string): string {
  const page = rewriteTranslatedPage(url, ctx);
  if (page !== null) return page;
  return rewriteAsset(url, ctx, depth);
}

function rewriteAsset(url: string, ctx: HtmlLinkRewriteContext, depth: string): string {
  if (!url || isUntouchedUrl(url)) return url;
  const { pathOnly, query, fragment } = splitUrl(url);
  if (!pathOnly || isUntouchedUrl(pathOnly)) return url;
  const localized = localizeAssetPath(pathOnly, ctx);
  const prefixed = pathOnly.startsWith("/")
    ? localized
    : `${depth}${localized.replace(/^\.\//, "")}`;
  return `${prefixed}${query}${fragment}`;
}

function rewriteTranslatedPage(url: string, ctx: HtmlLinkRewriteContext): string | null {
  if (!url || isUntouchedUrl(url)) return null;
  const { pathOnly, query, fragment } = splitUrl(url);
  if (!pathOnly || isUntouchedUrl(pathOnly) || pathOnly.startsWith("/")) return null;
  if (!/\.html?$/i.test(pathOnly.split("/").pop() ?? "")) return null;
  const sourceDir = path.posix.dirname(toPosix(ctx.sourceRelPath));
  const resolved = path.posix.normalize(
    path.posix.join(sourceDir === "." ? "" : sourceDir, pathOnly)
  );
  if (!ctx.translatedHtmlRelPaths.has(resolved)) return null;
  const fromAbs = resolveDocumentationOutputPath(
    ctx.config,
    ctx.cwd,
    ctx.locale,
    ctx.sourceRelPath,
    "html"
  );
  const toAbs = resolveDocumentationOutputPath(ctx.config, ctx.cwd, ctx.locale, resolved, "html");
  let rel = toPosix(path.relative(path.dirname(fromAbs), toAbs));
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return `${rel}${query}${fragment}`;
}

function localizeAssetPath(pathOnly: string, ctx: HtmlLinkRewriteContext): string {
  const assets = ctx.localizedAssets;
  if (!assets) return pathOnly;
  const clean = pathOnly.replace(/^\.\//, "");
  const matched = assets.include.some(
    (pattern) => safeMatch(clean, pattern) || safeMatch(clean.replace(/^\//, ""), pattern)
  );
  if (!matched && assets.include.length > 0) {
    const base = path.posix.basename(clean);
    if (!assets.include.some((pattern) => safeMatch(base, pattern) || safeMatch(clean, pattern))) {
      return pathOnly;
    }
  }
  const parsed = path.posix.parse(clean.startsWith("/") ? clean.slice(1) : clean);
  const nextName = applyPattern(assets.pattern, {
    "{stem}": parsed.name,
    "{ext}": parsed.ext,
    "{basename}": parsed.base,
    "{locale}": ctx.locale,
    "{llocale}": ctx.locale.toLowerCase(),
    "{LOCALE}": ctx.locale.toUpperCase(),
  });
  const nextRel = path.posix.join(parsed.dir, nextName);
  const rooted = clean.startsWith("/") ? `/${nextRel}` : nextRel;
  if (!assets.onlyIfExists) return rooted;
  const abs = resolveAssetAbs(pathOnly, nextRel, ctx);
  if (abs && fs.existsSync(abs)) return rooted;
  return pathOnly;
}

function applyPattern(pattern: string, values: Record<string, string>): string {
  let out = pattern;
  for (const [token, value] of Object.entries(values)) {
    out = out.split(token).join(value);
  }
  return out;
}

function resolveAssetAbs(
  originalPath: string,
  nextRel: string,
  ctx: HtmlLinkRewriteContext
): string | null {
  const assetRoot = ctx.localizedAssets?.assetRoot;
  const root = assetRoot
    ? path.resolve(ctx.cwd, assetRoot)
    : path.resolve(ctx.cwd, path.posix.dirname(toPosix(ctx.sourceRelPath)));
  const rel = originalPath.startsWith("/") ? nextRel.replace(/^\//, "") : nextRel;
  if (!originalPath.startsWith("/") && !assetRoot) {
    return path.resolve(ctx.cwd, path.posix.dirname(toPosix(ctx.sourceRelPath)), rel);
  }
  return path.resolve(root, rel);
}

function rewriteSrcset(tag: string, ctx: HtmlLinkRewriteContext, depth: string): string {
  return tag.replace(
    /\bsrcset\s*=\s*("([^"]*)"|'([^']*)')/i,
    (full, _quoted, dq: string | undefined, sq: string | undefined) => {
      const quote = dq !== undefined ? '"' : "'";
      const value = dq ?? sq ?? "";
      const next = value
        .split(",")
        .map((part) => {
          const trimmed = part.trim();
          if (!trimmed) return part;
          const bits = trimmed.split(/\s+/);
          const url = bits[0] ?? "";
          bits[0] = rewriteAsset(url, ctx, depth);
          return bits.join(" ");
        })
        .join(", ");
      return full.startsWith("srcset") || full.startsWith("SRCSET")
        ? `srcset=${quote}${next}${quote}`
        : full.replace(value, next);
    }
  );
}

function rewriteAttr(tag: string, name: string, rewrite: (url: string) => string): string {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");
  return tag.replace(re, (full, _quoted, dq: string | undefined, sq: string | undefined) => {
    const quote = dq !== undefined ? '"' : "'";
    const url = dq ?? sq ?? "";
    return `${name}=${quote}${rewrite(url)}${quote}`;
  });
}

function splitUrl(url: string): { pathOnly: string; query: string; fragment: string } {
  const hash = url.indexOf("#");
  const fragment = hash >= 0 ? url.slice(hash) : "";
  const pathQuery = hash >= 0 ? url.slice(0, hash) : url;
  const q = pathQuery.indexOf("?");
  return {
    pathOnly: q >= 0 ? pathQuery.slice(0, q) : pathQuery,
    query: q >= 0 ? pathQuery.slice(q) : "",
    fragment,
  };
}

function isUntouchedUrl(url: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url) || url.startsWith("data:");
}

function safeMatch(filePath: string, pattern: string): boolean {
  try {
    if (pattern.includes("**")) {
      const body = pattern.replace(/^\*\*\//, "").replace(/\*\*/g, "");
      return filePath.endsWith(body) || matchGlob(filePath, pattern.replace("**/", ""));
    }
    return matchGlob(filePath, pattern) || matchGlob(path.posix.basename(filePath), pattern);
  } catch {
    return false;
  }
}
