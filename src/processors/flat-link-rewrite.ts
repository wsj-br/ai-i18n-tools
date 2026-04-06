import path from "path";

/**
 * Transrewrt-style: adjust relative markdown links for locale-suffixed outputs in a flat folder.
 * @param i18nPrefix — POSIX relative path from `linkRewriteDocsRoot` to output dir (e.g. `translated-docs`)
 * @param depthPrefix — e.g. `../` when output lives one level below cwd-relative anchor
 */
export function rewriteOneRelativePathForFlatOutput(
  pathOnly: string,
  query: string,
  fragment: string,
  locale: string,
  i18nPrefix: string,
  depthPrefix: string,
  sourceFileBasenames: string[],
  currentSourceBasename: string
): string {
  const pathTrim = pathOnly.replace(/^\.\//u, "").trim();
  if (!pathTrim) return `${pathOnly}${query}${fragment}`;

  let rest = pathTrim;
  const prefixWithSlash = i18nPrefix ? `${i18nPrefix}/` : "";
  if (prefixWithSlash && rest.startsWith(prefixWithSlash)) {
    rest = rest.slice(prefixWithSlash.length);
    return `${rest}${query}${fragment}`;
  }

  const base = path.posix.basename(rest);
  if (base === currentSourceBasename) {
    return `${depthPrefix}${base}${query}${fragment}`;
  }
  if (sourceFileBasenames.includes(base) && base !== currentSourceBasename) {
    const ext = path.extname(base);
    const stem = ext ? path.basename(base, ext) : base;
    return `${stem}.${locale}${ext}${query}${fragment}`;
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
  sourceFileBasenames: string[],
  currentSourceBasename: string
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
      sourceFileBasenames,
      currentSourceBasename
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

/** Compute Transrewrt-style `i18nPrefix` (POSIX) and `depthPrefix` from cwd-relative roots. */
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
