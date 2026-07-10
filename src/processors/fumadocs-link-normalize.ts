import { toPosix } from "../core/output-paths.js";

/** Options for {@link normalizeFumadocsDocLinks}. */
export interface FumadocsLinkNormalizeContext {
  /** Source or output file path relative to the project root (POSIX). */
  relPath: string;
  /** Fumadocs English content root from `docsOutput.docsRoot` (e.g. `content/docs` or `content/docs/en`). */
  docsRoot: string;
}

function stripTrailingSlash(path: string): string {
  return path.replace(/\/+$/u, "");
}

function stripMdExtension(path: string): string {
  return path.replace(/\.mdx?$/iu, "");
}

/** Map a docs-root-relative path to a Fumadocs site route (`/docs/...`). */
export function docsPathToFumadocsRoute(docsRoot: string, subpath: string): string {
  const posix = toPosix(subpath);
  const wantsTrailingSlash = posix.endsWith("/") || /\/index(?:\.mdx?)?$/iu.test(posix);

  const root = stripTrailingSlash(toPosix(docsRoot));
  let clean = stripMdExtension(stripTrailingSlash(posix));
  if (/\/index$/iu.test(clean)) {
    clean = clean.replace(/\/index$/iu, "");
  }

  const prefix = `${root}/`;
  let rest: string;
  if (clean === root) {
    rest = "";
  } else if (clean.startsWith(prefix)) {
    rest = clean.slice(prefix.length);
  } else {
    rest = clean;
  }
  const route = rest ? `/docs/${rest}` : "/docs";
  return wantsTrailingSlash && route !== "/docs" ? `${route}/` : route;
}

function splitHref(href: string): { path: string; fragment: string } {
  const hashIdx = href.indexOf("#");
  if (hashIdx === -1) return { path: href, fragment: "" };
  return { path: href.slice(0, hashIdx), fragment: href.slice(hashIdx) };
}

function resolveRelativePath(fromDir: string, target: string): string {
  const segments = stripTrailingSlash(toPosix(fromDir)).split("/").filter(Boolean);
  const parts = target.split("/");
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") {
      segments.pop();
      continue;
    }
    segments.push(part);
  }
  return segments.join("/");
}

/**
 * Normalize one markdown URL for Fumadocs doc-system output.
 * Returns the original href when no rule applies.
 */
export function normalizeOneFumadocsLink(href: string, ctx: FumadocsLinkNormalizeContext): string {
  const trimmed = href.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("#")) return trimmed;
  if (/^(?:https?:|mailto:)/iu.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return trimmed;

  const { path, fragment } = splitHref(trimmed);
  if (!path) return trimmed;

  const docsRoot = stripTrailingSlash(toPosix(ctx.docsRoot));
  const docsRootPrefix = `${docsRoot}/`;
  const relDir = toPosix(ctx.relPath).includes("/")
    ? toPosix(ctx.relPath).slice(0, toPosix(ctx.relPath).lastIndexOf("/"))
    : "";

  if (path.startsWith("/")) {
    const withoutExt = stripMdExtension(path);
    if (withoutExt !== path) {
      return `${withoutExt}${fragment}`;
    }
    return `${path}${fragment}`;
  }

  if (path.startsWith(docsRootPrefix) || path === docsRoot) {
    return `${docsPathToFumadocsRoute(docsRoot, path)}${fragment}`;
  }

  if (path.startsWith("content/")) {
    return `${docsPathToFumadocsRoute(docsRoot, path)}${fragment}`;
  }

  if (path.startsWith("./") || path.startsWith("../")) {
    const resolved = resolveRelativePath(relDir, path);
    if (resolved === docsRoot || resolved.startsWith(docsRootPrefix)) {
      return `${docsPathToFumadocsRoute(docsRoot, resolved)}${fragment}`;
    }
  }

  if (/\.mdx?$/iu.test(path)) {
    const withoutExt = stripMdExtension(path);
    if (!withoutExt.includes("/")) {
      return `${docsPathToFumadocsRoute(docsRoot, `${relDir}/${withoutExt}`)}${fragment}`;
    }
    return `${docsPathToFumadocsRoute(docsRoot, withoutExt)}${fragment}`;
  }

  return `${path}${fragment}`;
}

function rewriteUrlsInMarkdown(body: string, ctx: FumadocsLinkNormalizeContext): string {
  const rewrite = (url: string) => normalizeOneFumadocsLink(url, ctx);

  let out = body.replace(/\[[^\]]*\]\(([^)]+)\)/g, (full) => {
    const sep = full.indexOf("](");
    if (sep === -1) return full;
    const textPart = full.slice(0, sep + 1);
    const rawUrl = full.slice(sep + 2, -1);
    return `${textPart}(${rewrite(rawUrl)})`;
  });

  out = out.replace(/src="([^"]*)"/g, (_full, url: string) => {
    return `src="${rewrite(url.trim())}"`;
  });

  return out;
}

/** Rewrite markdown link targets for Fumadocs doc-system / fumadocs layout output. */
export function normalizeFumadocsDocLinks(body: string, ctx: FumadocsLinkNormalizeContext): string {
  return rewriteUrlsInMarkdown(body, {
    ...ctx,
    relPath: toPosix(ctx.relPath),
    docsRoot: toPosix(ctx.docsRoot),
  });
}
