import { toPosix } from "../core/output-paths.js";

/** Options for {@link normalizeVitepressDocLinks}. */
export interface VitepressLinkNormalizeContext {
  /** Source or output file path relative to the project root (POSIX). */
  relPath: string;
  /** VitePress content root from `docsOutput.docsRoot` (e.g. `docs`). */
  docsRoot: string;
  /** Locale route prefix for translated output (e.g. `/pt-BR`), or null for root English pages. */
  localeRoutePrefix?: string | null;
}

const EXAMPLE_DIR_NAMES =
  "console-app|nextjs-app|astro-website|astro-docs|vitepress-docs|multi-provider|test-markdown";

const STATIC_ASSET_EXT = /\.(?:svg|png|jpe?g|gif|webp|ico|woff2?|ttf|eot)$/iu;

function stripTrailingSlash(path: string): string {
  return path.replace(/\/+$/u, "");
}

function stripMdExtension(path: string): string {
  return path.replace(/\.md$/iu, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Map a docs-root-relative path to a VitePress site route (`/guide/...`). */
export function docsPathToVitepressRoute(docsRoot: string, subpath: string): string {
  const posix = toPosix(subpath);
  const wantsTrailingSlash = posix.endsWith("/") || /\/index(?:\.md)?$/iu.test(posix);

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

function isVitepressContentRoute(path: string): boolean {
  if (path === "/") {
    return true;
  }
  return /^\/(?:guide|reference|examples)(?:\/|$)/u.test(path);
}

function shouldPrefixVitepressPath(path: string, localeRoutePrefix: string): boolean {
  if (!path.startsWith("/")) {
    return false;
  }
  const prefix = stripTrailingSlash(localeRoutePrefix);
  if (path === prefix || path.startsWith(`${prefix}/`)) {
    return false;
  }
  if (STATIC_ASSET_EXT.test(path)) {
    return false;
  }
  return isVitepressContentRoute(path);
}

/** Prefix internal VitePress content routes for locale output pages. */
export function applyVitepressLocaleRoutePrefix(
  href: string,
  localeRoutePrefix: string | null | undefined
): string {
  if (!localeRoutePrefix) {
    return href;
  }
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return trimmed;
  }
  if (/^(?:https?:|mailto:)/iu.test(trimmed) || trimmed.startsWith("//")) {
    return trimmed;
  }

  const { path, fragment } = splitHref(trimmed);
  if (!shouldPrefixVitepressPath(path, localeRoutePrefix)) {
    return trimmed;
  }
  const prefix = stripTrailingSlash(localeRoutePrefix);
  return `${prefix}${path}${fragment}`;
}

function normalizeOneVitepressLinkCore(
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
    if (path === "/reference/cli-commands") {
      return `/reference/cli-commands/${fragment}`;
    }
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
    if (rest === "cli-commands.md") {
      return `/reference/cli-commands/${fragment}`;
    }
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
    const exampleTrailingSlash = path.match(new RegExp(`^\\./(${EXAMPLE_DIR_NAMES})/$`, "u"));
    if (exampleTrailingSlash) {
      return `#${exampleTrailingSlash[1]}${fragment}`;
    }
  }

  return `${path}${fragment}`;
}

/**
 * Normalize one markdown URL for VitePress doc-system output.
 * Returns the original href when no rule applies.
 */
export function normalizeOneVitepressLink(
  href: string,
  ctx: VitepressLinkNormalizeContext
): string {
  const normalized = normalizeOneVitepressLinkCore(href, ctx);
  return applyVitepressLocaleRoutePrefix(normalized, ctx.localeRoutePrefix);
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

function normalizePrevNextLink(
  data: Record<string, unknown>,
  key: "prev" | "next",
  ctx: VitepressLinkNormalizeContext
): void {
  const value = data[key];
  if (typeof value === "string" && (value.startsWith("/") || value.startsWith("docs/"))) {
    data[key] = normalizeOneVitepressLink(value, ctx);
    return;
  }
  if (isRecord(value) && typeof value.link === "string") {
    value.link = normalizeOneVitepressLink(value.link, ctx);
  }
}

/** Rewrite link fields in VitePress home-page and doc front matter for locale output. */
export function normalizeVitepressFrontmatterLinks(
  data: Record<string, unknown>,
  ctx: VitepressLinkNormalizeContext
): void {
  const hero = data.hero;
  if (isRecord(hero)) {
    if (Array.isArray(hero.actions)) {
      for (const action of hero.actions) {
        if (isRecord(action) && typeof action.link === "string") {
          action.link = normalizeOneVitepressLink(action.link, ctx);
        }
      }
    }
    const image = hero.image;
    if (isRecord(image) && typeof image.src === "string") {
      image.src = normalizeOneVitepressLink(image.src, ctx);
    }
  }

  if (Array.isArray(data.features)) {
    for (const feature of data.features) {
      if (isRecord(feature) && typeof feature.link === "string") {
        feature.link = normalizeOneVitepressLink(feature.link, ctx);
      }
    }
  }

  normalizePrevNextLink(data, "prev", ctx);
  normalizePrevNextLink(data, "next", ctx);
}

/** Nav or sidebar item with optional nested children (VitePress default theme). */
export interface VitepressThemeNavItem {
  link?: string;
  activeMatch?: string;
  items?: VitepressThemeNavItem[];
  [key: string]: unknown;
}

function prefixThemeNavItemLink(
  href: string | undefined,
  localeRoutePrefix: string | null | undefined
): string | undefined {
  if (href === undefined) {
    return undefined;
  }
  return applyVitepressLocaleRoutePrefix(href, localeRoutePrefix);
}

/** Prefix internal routes in a nav or sidebar tree for a locale theme config. */
export function prefixVitepressThemeNavLinks<T extends VitepressThemeNavItem>(
  items: readonly T[],
  localeRoutePrefix: string | null | undefined
): T[] {
  if (!localeRoutePrefix) {
    return [...items];
  }
  return items.map((item) => {
    const next: VitepressThemeNavItem = { ...item };
    if (typeof next.link === "string") {
      next.link = prefixThemeNavItemLink(next.link, localeRoutePrefix);
    }
    if (typeof next.activeMatch === "string") {
      next.activeMatch = prefixThemeNavItemLink(next.activeMatch, localeRoutePrefix);
    }
    if (Array.isArray(next.items)) {
      next.items = prefixVitepressThemeNavLinks(next.items, localeRoutePrefix);
    }
    return next as T;
  });
}

/** Prefix nav and sidebar link targets in a VitePress themeConfig fragment. */
export function prefixVitepressThemeConfigLinks<
  T extends { nav?: readonly VitepressThemeNavItem[]; sidebar?: readonly VitepressThemeNavItem[] },
>(
  themeConfig: T,
  localeRoutePrefix: string | null | undefined
): T {
  if (!localeRoutePrefix) {
    return themeConfig;
  }
  return {
    ...themeConfig,
    ...(Array.isArray(themeConfig.nav)
      ? { nav: prefixVitepressThemeNavLinks(themeConfig.nav, localeRoutePrefix) }
      : {}),
    ...(Array.isArray(themeConfig.sidebar)
      ? { sidebar: prefixVitepressThemeNavLinks(themeConfig.sidebar, localeRoutePrefix) }
      : {}),
  };
}
