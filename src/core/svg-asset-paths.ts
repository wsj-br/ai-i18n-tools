import path from "path";
import type { I18nConfig } from "./types.js";
import { toPosix } from "./output-paths.js";

function assertSvgOutputWithinRoot(absFile: string, rootDir: string): void {
  const abs = path.resolve(absFile);
  const root = path.resolve(rootDir);
  const rel = path.relative(root, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Resolved SVG output path escapes svg.outputDir: ${absFile} (root: ${root})`);
  }
}

export interface SvgPathTemplateContext {
  /** Resolved absolute path of `svg.outputDir`. */
  outputDir: string;
  locale: string;
  /** Path of the source file relative to cwd (posix). */
  relPath: string;
  /** Path under the configured `sourcePath` root (posix), e.g. `icons/a.svg`. */
  relativeToSourceRoot: string;
}

/**
 * Expand `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`,
 * `{relativeToSourceRoot}` (same as path under `svg.sourcePath`).
 */
export function expandSvgPathTemplate(template: string, ctx: SvgPathTemplateContext): string {
  const posixRel = toPosix(ctx.relPath);
  const parsed = path.posix.parse(posixRel);
  const stem = parsed.name;
  const extension = parsed.ext;
  const basename = parsed.base;
  const relSrc = toPosix(ctx.relativeToSourceRoot);

  let out = template;
  const pairs: [string, string][] = [
    ["{outputDir}", ctx.outputDir],
    ["{locale}", ctx.locale],
    ["{LOCALE}", ctx.locale.toUpperCase()],
    ["{relPath}", posixRel],
    ["{stem}", stem],
    ["{basename}", basename],
    ["{extension}", extension],
    ["{relativeToSourceRoot}", relSrc],
  ];
  for (const [key, val] of pairs) {
    out = out.split(key).join(val);
  }
  return out;
}

/**
 * Absolute path for a translated SVG asset (`translate-svg` command).
 *
 * - With `svg.pathTemplate`: expanded path (relative to cwd or absolute), constrained under `svg.outputDir`.
 * - Else `flat`: `{outputDir}/{stem}.{locale}.svg`
 * - Else `nested`: `{outputDir}/{locale}/{relPathFromSourceRoot}`
 */
export function resolveSvgAssetOutputPath(
  config: I18nConfig,
  cwd: string,
  locale: string,
  /** Path relative to cwd (posix), e.g. `images/foo.svg` */
  relPathFromCwd: string,
  /** Path relative to the `sourcePath` root that contained this file (posix), e.g. `foo.svg` or `icons/a.svg` */
  relPathFromSourceRoot: string
): string {
  const svg = config.svg;
  if (!svg) {
    throw new Error("resolveSvgAssetOutputPath: config.svg is required");
  }
  const outRoot = path.resolve(cwd, svg.outputDir);
  const posixRel = toPosix(relPathFromCwd);
  const parsed = path.posix.parse(posixRel);
  const stem = parsed.name;

  const tmpl = svg.pathTemplate?.trim();
  let abs: string;
  if (tmpl && tmpl.length > 0) {
    const expanded = expandSvgPathTemplate(tmpl, {
      outputDir: outRoot,
      locale,
      relPath: relPathFromCwd,
      relativeToSourceRoot: relPathFromSourceRoot,
    });
    abs = path.isAbsolute(expanded) ? path.normalize(expanded) : path.resolve(cwd, expanded);
  } else if (svg.style === "flat") {
    abs = path.join(outRoot, `${stem}.${locale}.svg`);
  } else {
    abs = path.join(outRoot, locale, relPathFromSourceRoot);
  }

  assertSvgOutputWithinRoot(abs, outRoot);
  return abs;
}

/** Stable cache filepath key for standalone SVG assets (avoids collisions with doc paths). */
export function svgAssetCacheFilepath(relPathFromCwdPosix: string): string {
  return `svg-assets/${toPosix(relPathFromCwdPosix)}`;
}

/**
 * Path under a configured `svg.sourcePath` root (posix), for nested output layout.
 * Returns `null` if `fileRelCwd` is not under any root.
 */
export function relPathUnderSvgSource(
  fileRelCwd: string,
  sourceRoots: string[]
): string | null {
  const posix = toPosix(fileRelCwd.replace(/\\/g, "/"));
  const sorted = [...sourceRoots].sort((a, b) => b.length - a.length);
  for (const root of sorted) {
    const r = toPosix(root.replace(/\\/g, "/")).replace(/\/$/, "");
    if (posix === r) {
      return path.posix.basename(posix);
    }
    if (posix.startsWith(`${r}/`)) {
      return posix.slice(r.length + 1);
    }
  }
  return null;
}
