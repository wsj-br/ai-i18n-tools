import path from "path";
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
 * Expand `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`,
 * `{docsRoot}`, `{relativeToDocsRoot}`.
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

  let out = template;
  const pairs: [string, string][] = [
    ["{outputDir}", ctx.outputDir],
    ["{locale}", ctx.locale],
    ["{LOCALE}", ctx.locale.toUpperCase()],
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

/** Starlight locale folders use lowercase keys (e.g. `pt-BR` → `pt-br`). */
function docSystemLocaleDir(locale: string, localeSubpath: string | undefined): string {
  if ((localeSubpath?.trim() ?? "") === "") {
    return locale.toLowerCase();
  }
  return locale;
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
  const posixRel = toPosix(relPath);
  const docsRootRaw = mo.docsRoot?.trim() || "docs";
  const docsRootPosix = toPosix(path.normalize(docsRootRaw)).replace(/\/$/, "");

  if (kind !== "markdown") {
    return path.join(outBase, locale, relPath);
  }

  switch (mo.style) {
    case "nested":
      return path.join(outBase, locale, relPath);
    case "doc-system":
    case "docusaurus":
    case "astro-starlight": {
      const under =
        posixRel === docsRootPosix ||
        posixRel.startsWith(`${docsRootPosix}/`) ||
        posixRel.startsWith(`${docsRootPosix}\\`);
      if (!under) {
        return path.join(outBase, locale, relPath);
      }
      const rest = posixRel === docsRootPosix ? "" : posixRel.slice(docsRootPosix.length + 1);
      let subpath: string;
      if (mo.style === "docusaurus") {
        subpath = mo.localeSubpath?.trim() ?? DOCUSAURUS_PLUGIN;
      } else if (mo.style === "astro-starlight") {
        subpath = mo.localeSubpath?.trim() ?? "";
      } else {
        subpath = mo.localeSubpath?.trim() ?? DOCUSAURUS_PLUGIN;
      }
      const localeDir =
        mo.style === "doc-system" || mo.style === "astro-starlight"
          ? docSystemLocaleDir(locale, subpath)
          : locale;
      if (!subpath || subpath === ".") {
        return path.join(outBase, localeDir, rest);
      }
      return path.join(outBase, localeDir, subpath, rest);
    }
    case "flat": {
      const parsed = path.posix.parse(posixRel);
      const stem = parsed.name;
      const ext = parsed.ext;
      if (mo.flatPreserveRelativeDir) {
        const dir = parsed.dir;
        if (dir && dir !== ".") {
          return path.join(outBase, dir, `${stem}.${locale}${ext}`);
        }
      }
      return path.join(outBase, `${stem}.${locale}${ext}`);
    }
    default:
      return path.join(outBase, locale, relPath);
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
