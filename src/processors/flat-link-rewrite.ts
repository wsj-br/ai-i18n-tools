import path from "path";
import type { I18nDocTranslateConfig } from "../core/types.js";
import { resolveDocumentationOutputPath, toPosix } from "../core/output-paths.js";

/**
 * Normalized posix cwd-relative path for markdown source files (for set membership and comparisons).
 * Treats backslashes as separators so Windows-style paths match on any OS.
 */
export function normalizeMarkdownRelPath(relPath: string): string {
  const withSlash = toPosix(relPath).replace(/\\/g, "/");
  return path.posix.normalize(withSlash);
}

/**
 * Context for rewriting relative links in flat markdown outputs using resolved source paths
 * and {@link resolveDocumentationOutputPath} as the layout source of truth.
 */
export interface FlatLinkRewriteContext {
  cwd: string;
  config: I18nDocTranslateConfig;
  /** Normalized posix cwd-relative path of the file being translated */
  currentSourceRelPath: string;
  /** Normalized posix paths of all markdown sources in this documentation batch */
  translatedMarkdownRelPaths: ReadonlySet<string>;
}

function resolveRelativeMarkdownTarget(
  normalizedCurrentSourceRelPath: string,
  pathTrim: string
): string {
  return path.posix.normalize(
    path.posix.join(path.posix.dirname(normalizedCurrentSourceRelPath), pathTrim)
  );
}

/**
 * Rewrite one relative URL for flat markdown output (used by tests and {@link rewriteDocLinksForFlatOutput}).
 */
export function rewriteOneRelativePathForFlatOutput(
  pathOnly: string,
  query: string,
  fragment: string,
  locale: string,
  i18nPrefix: string,
  depthPrefix: string,
  ctx: FlatLinkRewriteContext
): string {
  const pathTrim = pathOnly.replace(/^\.\//u, "").trim();
  if (!pathTrim) return `${pathOnly}${query}${fragment}`;

  let rest = pathTrim;
  const prefixWithSlash = i18nPrefix ? `${i18nPrefix}/` : "";
  if (prefixWithSlash && rest.startsWith(prefixWithSlash)) {
    rest = rest.slice(prefixWithSlash.length);
    return `${rest}${query}${fragment}`;
  }

  const normalizedCurrent = normalizeMarkdownRelPath(ctx.currentSourceRelPath);
  const resolved = resolveRelativeMarkdownTarget(normalizedCurrent, rest);

  if (resolved === normalizedCurrent) {
    const base = path.posix.basename(rest);
    return `${depthPrefix}${base}${query}${fragment}`;
  }

  if (ctx.translatedMarkdownRelPaths.has(resolved)) {
    const fromAbs = resolveDocumentationOutputPath(
      ctx.config,
      ctx.cwd,
      locale,
      normalizedCurrent,
      "markdown"
    );
    const toAbs = resolveDocumentationOutputPath(ctx.config, ctx.cwd, locale, resolved, "markdown");
    const rel = toPosix(path.relative(path.dirname(fromAbs), toAbs));
    return `${rel}${query}${fragment}`;
  }

  return `${depthPrefix}${rest}${query}${fragment}`;
}

/**
 * Rewrite `](url)` and `src="..."` in translated markdown for flat doc outputs.
 */
export function rewriteDocLinksForFlatOutput(
  body: string,
  locale: string,
  i18nPrefix: string,
  depthPrefix: string,
  ctx: FlatLinkRewriteContext
): string {
  const rewriteUrl = (trimmed: string): string => {
    if (!trimmed) return trimmed;
    if (/^#/u.test(trimmed)) return trimmed;
    if (/^(?:https?:|mailto:)/iu.test(trimmed)) return trimmed;
    if (trimmed.startsWith("//")) return trimmed;

    const hashIdx = trimmed.indexOf("#");
    const pathQuery = hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed;
    const fragment = hashIdx >= 0 ? trimmed.slice(hashIdx) : "";

    const qIdx = pathQuery.indexOf("?");
    const pathOnly = qIdx >= 0 ? pathQuery.slice(0, qIdx) : pathQuery;
    const query = qIdx >= 0 ? pathQuery.slice(qIdx) : "";

    if (!pathOnly) return trimmed;
    if (/^[a-zA-Z]:[\\/]/u.test(pathOnly)) return trimmed;

    const newPath = rewriteOneRelativePathForFlatOutput(
      pathOnly,
      query,
      fragment,
      locale,
      i18nPrefix,
      depthPrefix,
      ctx
    );
    return newPath;
  };

  let out = body.replace(/\[[^\]]*\]\(([^)]+)\)/g, (full) => {
    const sep = full.indexOf("](");
    if (sep === -1) return full;
    const textPart = full.slice(0, sep + 1);
    const rawUrl = full.slice(sep + 2, -1);
    return `${textPart}(${rewriteUrl(rawUrl.trim())})`;
  });

  out = out.replace(/src="([^"]*)"/g, (_full, url: string) => {
    return `src="${rewriteUrl(url.trim())}"`;
  });

  return out;
}

/** Compute `i18nPrefix` (POSIX) and `depthPrefix` from cwd-relative roots. */
export function computeFlatLinkRewritePrefixes(
  cwd: string,
  linkRewriteDocsRoot: string,
  documentationOutputDir: string
): { i18nPrefix: string; depthPrefix: string } {
  const docsAbs = path.resolve(cwd, linkRewriteDocsRoot);
  const outAbs = path.resolve(cwd, documentationOutputDir);
  const i18nRel = path.relative(docsAbs, outAbs);
  const i18nPrefix = i18nRel.split(path.sep).join("/");
  const depth = i18nPrefix === "" ? 0 : i18nPrefix.split("/").filter(Boolean).length;
  const depthPrefix = "../".repeat(depth);
  return { i18nPrefix, depthPrefix };
}

/**
 * Compute the per-file depth prefix for a specific source file.
 *
 * Unlike the global `depthPrefix` from {@link computeFlatLinkRewritePrefixes} — which is uniform
 * for the whole batch — this prefix is relative to the *actual output file's directory*, so it
 * correctly handles `flatPreserveRelativeDir: true` where different source files land at different
 * depths inside `outputDir`.
 *
 * The prefix is the POSIX relative path from the output file's directory back to the source file's
 * directory, with a trailing `/`. For a source at the repo root and output one level deep (`"../"`),
 * the result equals the global depth prefix. For a source in a subdirectory (e.g. `docs/`) whose
 * output ends up two levels deep (`translated-docs/docs/`), the result is `"../../docs/"` —
 * ensuring that an asset URL like `figure.png` resolves to `../../docs/figure.png`, i.e. the same
 * directory as the source.
 */
export function computePerFileDepthPrefix(
  cwd: string,
  config: I18nDocTranslateConfig,
  locale: string,
  sourceRelPath: string
): string {
  const normSource = normalizeMarkdownRelPath(sourceRelPath);
  const outputFilePath = resolveDocumentationOutputPath(
    config,
    cwd,
    locale,
    normSource,
    "markdown"
  );
  const outputDirAbs = path.dirname(path.resolve(outputFilePath));
  const sourceDirAbs = path.resolve(cwd, path.posix.dirname(normSource));
  const rel = toPosix(path.relative(outputDirAbs, sourceDirAbs));
  return rel ? `${rel}/` : "";
}
