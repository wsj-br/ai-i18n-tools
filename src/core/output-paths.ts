import path from "path";
import type { FumadocsLinkNormalizeContext } from "../processors/fumadocs-link-normalize.js";
import type { NextraLinkNormalizeContext } from "../processors/nextra-link-normalize.js";
import type { VitepressLinkNormalizeContext } from "../processors/vitepress-link-normalize.js";
import { matchesDocsOutputStylePreset } from "./docs-output-normalize.js";
import { isFumadocsDirParser, isFumadocsDotParser } from "./fumadocs-parser.js";
import { localePathPlaceholders } from "./locale-utils.js";
import type { I18nDocTranslateConfig } from "./types.js";
import { DOCUSAURUS_LOCALE_SUBPATH } from "./types.js";

export type DocArtifactKind = "markdown" | "json";

/** @deprecated Use {@link DOCUSAURUS_LOCALE_SUBPATH} */
const DOCUSAURUS_PLUGIN = DOCUSAURUS_LOCALE_SUBPATH;

/** Normalize to forward slashes for template keys and comparisons. */
export function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function templateForKind(
  config: I18nDocTranslateConfig,
  kind: DocArtifactKind
): string | undefined {
  const mo = config.doc.docsOutput;
  if (kind === "markdown") {
    return mo.pathTemplate?.trim();
  }
  return mo.jsonPathTemplate?.trim();
}

export interface PathTemplateContext {
  outputDir: string;
  locale: string;
  relPath: string;
  docsRoot: string;
}

/**
 * Expand `{outputDir}`, `{locale}`, `{LOCALE}`, `{llocale}`, `{relPath}`, `{stem}`, `{basename}`,
 * `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
 */
export function expandPathTemplate(template: string, ctx: PathTemplateContext): string {
  const posixRel = toPosix(ctx.relPath);
  const parsed = path.posix.parse(posixRel);
  const stem = parsed.name;
  const extension = parsed.ext;
  const basename = parsed.base;
  let relativeToDocsRoot = posixRel;
  const dr = toPosix(ctx.docsRoot).replace(/\/$/, "");
  if (dr && (posixRel === dr || posixRel.startsWith(`${dr}/`))) {
    relativeToDocsRoot = posixRel.slice(dr.length).replace(/^\//, "");
  }

  const localeVars = localePathPlaceholders(ctx.locale);
  let out = template;
  const pairs: [string, string][] = [
    ["{outputDir}", ctx.outputDir],
    ["{locale}", localeVars.locale],
    ["{LOCALE}", localeVars.LOCALE],
    ["{llocale}", localeVars.llocale],
    ["{relPath}", posixRel],
    ["{stem}", stem],
    ["{basename}", basename],
    ["{extension}", extension],
    ["{docsRoot}", ctx.docsRoot],
    ["{relativeToDocsRoot}", relativeToDocsRoot],
  ];
  for (const [key, val] of pairs) {
    out = out.split(key).join(val);
  }
  return out;
}

function assertOutputWithinRoot(absFile: string, rootDir: string): void {
  const abs = path.resolve(absFile);
  const root = path.resolve(rootDir);
  const rel = path.relative(root, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(
      `Resolved output path escapes the documentation block outputDir: ${absFile} (root: ${root})`
    );
  }
}

function effectiveLocaleForPath(locale: string, localePathLowercase: boolean): string {
  return localePathLowercase ? locale.toLowerCase() : locale;
}

function resolveByStyle(
  config: I18nDocTranslateConfig,
  cwd: string,
  locale: string,
  relPath: string,
  kind: DocArtifactKind
): string {
  const doc = config.doc;
  const outBase = path.resolve(cwd, doc.outputDir);
  const mo = doc.docsOutput;
  const localeSeg = effectiveLocaleForPath(locale, mo.localePathLowercase ?? false);
  const posixRel = toPosix(relPath);
  const docsRootRaw = mo.docsRoot?.trim() || "docs";
  const docsRootPosix = toPosix(path.normalize(docsRootRaw)).replace(/\/$/, "");

  if (kind !== "markdown") {
    return path.join(outBase, localeSeg, relPath);
  }

  if (isFumadocsDotParser(mo)) {
    let relForDot = posixRel;
    const underDocsRoot =
      posixRel === docsRootPosix || posixRel.startsWith(`${docsRootPosix}/`);
    if (underDocsRoot) {
      relForDot = posixRel === docsRootPosix ? "" : posixRel.slice(docsRootPosix.length + 1);
    }
    const parsed = path.posix.parse(relForDot || path.posix.basename(posixRel));
    const stem = parsed.name;
    const ext = parsed.ext;
    const dir = parsed.dir;
    if (dir && dir !== ".") {
      return path.join(outBase, dir, `${stem}.${localeSeg}${ext}`);
    }
    return path.join(outBase, `${stem}.${localeSeg}${ext}`);
  }

  switch (mo.style) {
    case "nested":
      return path.join(outBase, localeSeg, relPath);
    case "doc-system":
    case "docusaurus":
    case "astro-starlight":
    case "vitepress":
    case "nextra":
    case "fumadocs": {
      const under =
        posixRel === docsRootPosix ||
        posixRel.startsWith(`${docsRootPosix}/`) ||
        posixRel.startsWith(`${docsRootPosix}\\`);
      if (!under) {
        return path.join(outBase, localeSeg, relPath);
      }
      const rest = posixRel === docsRootPosix ? "" : posixRel.slice(docsRootPosix.length + 1);
      let subpath: string;
      if (mo.style === "docusaurus") {
        subpath = mo.localeSubpath?.trim() ?? DOCUSAURUS_PLUGIN;
      } else if (
        mo.style === "astro-starlight" ||
        mo.style === "vitepress" ||
        mo.style === "nextra" ||
        mo.style === "fumadocs" ||
        isFumadocsDirParser(mo)
      ) {
        subpath = mo.localeSubpath?.trim() ?? "";
      } else {
        subpath = mo.localeSubpath?.trim() ?? DOCUSAURUS_PLUGIN;
      }
      if (!subpath || subpath === ".") {
        return path.join(outBase, localeSeg, rest);
      }
      return path.join(outBase, localeSeg, subpath, rest);
    }
    case "flat": {
      const parsed = path.posix.parse(posixRel);
      const stem = parsed.name;
      const ext = parsed.ext;
      if (mo.flatPreserveRelativeDir) {
        const dir = parsed.dir;
        if (dir && dir !== ".") {
          return path.join(outBase, dir, `${stem}.${localeSeg}${ext}`);
        }
      }
      return path.join(outBase, `${stem}.${localeSeg}${ext}`);
    }
    default:
      return path.join(outBase, localeSeg, relPath);
  }
}

/**
 * Resolve absolute output path for a translated documentation artifact.
 */
export function resolveDocumentationOutputPath(
  config: I18nDocTranslateConfig,
  cwd: string,
  locale: string,
  relPath: string,
  kind: DocArtifactKind
): string {
  const doc = config.doc;
  const outBaseResolved = path.resolve(cwd, doc.outputDir);
  const mo = doc.docsOutput;
  const docsRootRaw = mo.docsRoot?.trim() || "docs";
  const docsRootResolved = path.resolve(cwd, docsRootRaw);

  const tmpl = templateForKind(config, kind);
  let abs: string;
  if (tmpl && tmpl.length > 0) {
    const expanded = expandPathTemplate(tmpl, {
      outputDir: outBaseResolved,
      locale,
      relPath,
      docsRoot: docsRootResolved,
    });
    abs = path.isAbsolute(expanded) ? path.normalize(expanded) : path.resolve(cwd, expanded);
  } else {
    abs = resolveByStyle(config, cwd, locale, relPath, kind);
  }

  assertOutputWithinRoot(abs, outBaseResolved);
  return abs;
}

/** Whether to run relative link rewriting for flat markdown outputs. */
export function shouldRewriteFlatMarkdownLinks(config: I18nDocTranslateConfig): boolean {
  const mo = config.doc.docsOutput;
  if (mo.rewriteRelativeLinks !== undefined) {
    return mo.rewriteRelativeLinks;
  }
  if (mo.pathTemplate?.trim()) {
    return false;
  }
  return mo.style === "flat";
}

/** Whether to normalize markdown links for VitePress doc-system output. */
export function shouldRewriteVitepressLinks(config: I18nDocTranslateConfig): boolean {
  const mo = config.doc.docsOutput;
  if (mo.rewriteVitepressLinks === false) {
    return false;
  }
  if (mo.rewriteVitepressLinks === true) {
    return true;
  }
  return matchesDocsOutputStylePreset(mo, "vitepress");
}

/** Whether to normalize markdown links for Nextra doc-system output. */
export function shouldRewriteNextraLinks(config: I18nDocTranslateConfig): boolean {
  const mo = config.doc.docsOutput;
  if (mo.rewriteNextraLinks === false) {
    return false;
  }
  if (mo.rewriteNextraLinks === true) {
    return true;
  }
  return matchesDocsOutputStylePreset(mo, "nextra");
}

/** Whether to normalize markdown links for Fumadocs doc-system output. */
export function shouldRewriteFumadocsLinks(config: I18nDocTranslateConfig): boolean {
  const mo = config.doc.docsOutput;
  if (mo.rewriteFumadocsLinks === false) {
    return false;
  }
  if (mo.rewriteFumadocsLinks === true) {
    return true;
  }
  return matchesDocsOutputStylePreset(mo, "fumadocs");
}

/** Build context for VitePress link normalization from a doc translate config. */
export function vitepressLinkNormalizeContext(
  config: I18nDocTranslateConfig,
  relPath: string
): VitepressLinkNormalizeContext {
  const mo = config.doc.docsOutput;
  return {
    relPath,
    docsRoot: mo.docsRoot?.trim() || "docs",
  };
}

/** Build context for Nextra link normalization from a doc translate config. */
export function nextraLinkNormalizeContext(
  config: I18nDocTranslateConfig,
  relPath: string
): NextraLinkNormalizeContext {
  const mo = config.doc.docsOutput;
  return {
    relPath,
    docsRoot: mo.docsRoot?.trim() || "content/en",
  };
}

/** Build context for Fumadocs link normalization from a doc translate config. */
export function fumadocsLinkNormalizeContext(
  config: I18nDocTranslateConfig,
  relPath: string
): FumadocsLinkNormalizeContext {
  const mo = config.doc.docsOutput;
  return {
    relPath,
    docsRoot: mo.docsRoot?.trim() || "content/docs",
  };
}
