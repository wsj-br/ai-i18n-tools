import path from "path";
import type { I18nConfig } from "./types.js";

export type DocArtifactKind = "markdown" | "json" | "svg";

const DOCUSAURUS_PLUGIN = "docusaurus-plugin-content-docs/current";

/** Normalize to forward slashes for template keys and comparisons. */
export function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function templateForKind(config: I18nConfig, kind: DocArtifactKind): string | undefined {
  const mo = config.documentation.markdownOutput;
  if (kind === "markdown") {
    return mo.pathTemplate?.trim();
  }
  if (kind === "json") {
    return mo.jsonPathTemplate?.trim();
  }
  return mo.svgPathTemplate?.trim();
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
    throw new Error(`Resolved output path escapes documentation.outputDir: ${absFile} (root: ${root})`);
  }
}

function resolveByStyle(
  config: I18nConfig,
  cwd: string,
  locale: string,
  relPath: string,
  kind: DocArtifactKind
): string {
  const doc = config.documentation;
  const outBase = path.resolve(cwd, doc.outputDir);
  const mo = doc.markdownOutput;
  const posixRel = toPosix(relPath);
  const docsRootRaw = mo.docsRoot?.trim() || "docs";
  const docsRootPosix = toPosix(path.normalize(docsRootRaw)).replace(/\/$/, "");

  if (kind !== "markdown") {
    return path.join(outBase, locale, relPath);
  }

  switch (mo.style) {
    case "nested":
      return path.join(outBase, locale, relPath);
    case "docusaurus": {
      const under =
        posixRel === docsRootPosix ||
        posixRel.startsWith(`${docsRootPosix}/`) ||
        posixRel.startsWith(`${docsRootPosix}\\`);
      if (!under) {
        return path.join(outBase, locale, relPath);
      }
      const rest =
        posixRel === docsRootPosix ? "" : posixRel.slice(docsRootPosix.length + 1);
      return path.join(outBase, locale, DOCUSAURUS_PLUGIN, rest);
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
  config: I18nConfig,
  cwd: string,
  locale: string,
  relPath: string,
  kind: DocArtifactKind
): string {
  const doc = config.documentation;
  const outBaseResolved = path.resolve(cwd, doc.outputDir);
  const mo = doc.markdownOutput;
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

/** Whether to run Transrewrt-style relative link rewriting for flat markdown outputs. */
export function shouldRewriteFlatMarkdownLinks(config: I18nConfig): boolean {
  const mo = config.documentation.markdownOutput;
  if (mo.rewriteRelativeLinksForFlat !== undefined) {
    return mo.rewriteRelativeLinksForFlat;
  }
  if (mo.pathTemplate?.trim()) {
    return false;
  }
  return mo.style === "flat";
}
