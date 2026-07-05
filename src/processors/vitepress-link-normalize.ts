import { toPosix } from "../core/output-paths.js";

/** Options for {@link normalizeVitepressDocLinks}. */
export interface VitepressLinkNormalizeContext {
  /** Source or output file path relative to the project root (POSIX). */
  relPath: string;
  /** VitePress content root from `docsOutput.docsRoot` (e.g. `docs`). */
  docsRoot: string;
}

const EXAMPLE_DIR_NAMES =
  "console-app|nextjs-app|astro-website|astro-docs|vitepress-docs|multi-provider|test-markdown";

function stripTrailingSlash(path: string): string {
  return path.replace(/\/+$/u, "");
}

function stripMdExtension(path: string): string {
  return path.replace(/\.md$/iu, "");
}

/** Map a docs-root-relative path to a VitePress site route (`/guide/...`). */
export function docsPathToVitepressRoute(docsRoot: string, subpath: string): string {
  const posix = toPosix(subpath);
  const wantsTrailingSlash =
    posix.endsWith("/") || /\/index(?:\.md)?$/iu.test(posix);

  const root = stripTrailingSlash(toPosix(docsRoot));
  let clean = stripMdExtension(stripTrailingSlash(posix));
  if (/\/index$/iu.test(clean)) {
    clean = clean.replace(/\/index$/iu, "");
  }

  const prefix = `${root}/`;
  const rest = clean.startsWith(prefix) ? clean.slice(prefix.length) : clean;
  const route = rest ? `/${rest}` : "/";
  return wantsTrailingSlash && route !== "/" ? `${route}/` : route;
}

function isDocsHomeIndex(relPath: string, docsRoot: string): boolean {
  const posix = toPosix(relPath);
  const root = stripTrailingSlash(toPosix(docsRoot));
  if (posix === `${root}/index.md`) return true;
  const localeIndex = new RegExp(`^${root}/[\\w-]+/index\\.md$`, "u");
  return localeIndex.test(posix);
}

function isExamplesPage(relPath: string): boolean {
  const posix = toPosix(relPath);
  return /\/examples(?:\/index)?\.md$/u.test(posix);
}

function exampleSubpageToAnchor(subpath: string): string | null {
  const base = stripMdExtension(subpath.replace(/\/+$/u, ""));
  const name = base.split("/").pop() ?? "";
  if (new RegExp(`^(${EXAMPLE_DIR_NAMES})$`, "u").test(name)) {
    return `#${name}`;
  }
  return null;
}

function splitHref(href: string): { path: string; fragment: string } {
  const hashIdx = href.indexOf("#");
  if (hashIdx === -1) return { path: href, fragment: "" };
  return { path: href.slice(0, hashIdx), fragment: href.slice(hashIdx) };
}

/**
 * Normalize one markdown URL for VitePress doc-system output.
 * Returns the original href when no rule applies.
 */
export function normalizeOneVitepressLink(
  href: string,
  ctx: VitepressLinkNormalizeContext
): string {
  const trimmed = href.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("#")) return trimmed;
  if (/^(?:https?:|mailto:)/iu.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return trimmed;

  const { path, fragment } = splitHref(trimmed);
  if (!path) return trimmed;

  const docsRoot = stripTrailingSlash(toPosix(ctx.docsRoot));
  const docsRootPrefix = `${docsRoot}/`;

  if (path.startsWith("/")) {
    if (path === "/examples/" || path === "/examples") {
      return `/examples${fragment}`;
    }
    const legacyExample = path.match(new RegExp(`^/examples/(${EXAMPLE_DIR_NAMES})/?$`, "u"));
    if (legacyExample) {
      return `/examples#${legacyExample[1]}${fragment}`;
    }
    return `${path}${fragment}`;
  }

  if (path === "./README.md" && isDocsHomeIndex(ctx.relPath, docsRoot)) {
    return `/${fragment}`;
  }

  if (path.startsWith("docs/guide/") || path.startsWith(`${docsRootPrefix}guide/`)) {
    const rest = path.startsWith("docs/guide/")
      ? path.slice("docs/guide/".length)
      : path.slice(`${docsRootPrefix}guide/`.length);
    return `${docsPathToVitepressRoute(docsRoot, `guide/${rest}`)}${fragment}`;
  }

  if (path.startsWith("docs/reference/") || path.startsWith(`${docsRootPrefix}reference/`)) {
    const rest = path.startsWith("docs/reference/")
      ? path.slice("docs/reference/".length)
      : path.slice(`${docsRootPrefix}reference/`.length);
    return `${docsPathToVitepressRoute(docsRoot, `reference/${rest}`)}${fragment}`;
  }

  if (path === "docs/examples.md" || path === `${docsRootPrefix}examples.md`) {
    return `/examples${fragment}`;
  }

  if (
    (path.startsWith("docs/examples/") || path.startsWith(`${docsRootPrefix}examples/`)) &&
    !path.endsWith("/index.md")
  ) {
    const rest = path.startsWith("docs/examples/")
      ? path.slice("docs/examples/".length)
      : path.slice(`${docsRootPrefix}examples/`.length);
    const anchor = exampleSubpageToAnchor(rest);
    if (anchor) {
      return `/examples${anchor}${fragment}`;
    }
    return `${docsPathToVitepressRoute(docsRoot, `examples/${rest}`)}${fragment}`;
  }

  if (path === "../examples/README.md") {
    return `/examples${fragment}`;
  }

  if (path === "../docs/translation-dashboard.png") {
    return `/translation-dashboard.png${fragment}`;
  }

  if (path === "../docs/GETTING_STARTED.md" || path.startsWith("../docs/GETTING_STARTED.md#")) {
    const frag = fragment || "";
    return `/guide/translation-dashboard${frag}`;
  }

  if (path.startsWith("../guide/")) {
    const rest = stripMdExtension(path.slice("../guide/".length));
    return `${docsPathToVitepressRoute(docsRoot, `guide/${rest}`)}${fragment}`;
  }

  if (path === "./programmatic-api") {
    return `${docsPathToVitepressRoute(docsRoot, "reference/programmatic-api")}${fragment}`;
  }

  if (isExamplesPage(ctx.relPath)) {
    if (path === "../README.md") {
      return `/${fragment}`;
    }
    const exampleTrailingSlash = path.match(
      new RegExp(`^\\./(${EXAMPLE_DIR_NAMES})/$`, "u")
    );
    if (exampleTrailingSlash) {
      return `#${exampleTrailingSlash[1]}${fragment}`;
    }
  }

  return `${path}${fragment}`;
}

function rewriteUrlsInMarkdown(body: string, ctx: VitepressLinkNormalizeContext): string {
  const rewrite = (url: string) => normalizeOneVitepressLink(url, ctx);

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

/** Rewrite markdown link targets for VitePress doc-system / vitepress layout output. */
export function normalizeVitepressDocLinks(
  body: string,
  ctx: VitepressLinkNormalizeContext
): string {
  return rewriteUrlsInMarkdown(body, {
    ...ctx,
    relPath: toPosix(ctx.relPath),
    docsRoot: toPosix(ctx.docsRoot),
  });
}
