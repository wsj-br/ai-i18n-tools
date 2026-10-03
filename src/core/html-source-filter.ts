import path from "path";
import { toPosix } from "./output-paths.js";

/**
 * True when `relPath` is a generated HTML locale output: a locale directory under
 * `outputDir`, or a flat `name.<locale>.html` file inside `outputDir`.
 * English sources that share `outputDir` (no locale segment) stay included.
 */
export function isGeneratedHtmlOutput(
  relPath: string,
  outputDir: string,
  locales: readonly string[]
): boolean {
  const rel = toPosix(relPath).replace(/^\.\//, "");
  const out = toPosix(outputDir).replace(/^\.\//, "").replace(/\/$/, "");
  if (!rel || !out || out === ".") {
    return false;
  }
  if (rel !== out && !rel.startsWith(`${out}/`)) {
    return false;
  }
  const rest = rel === out ? "" : rel.slice(out.length + 1);
  if (!rest) return false;
  const localeKeys = new Set(locales.map((locale) => locale.toLowerCase()));
  const first = rest.split("/")[0]?.toLowerCase() ?? "";
  if (localeKeys.has(first)) return true;
  const base = rest.split("/").pop()?.toLowerCase() ?? "";
  for (const locale of localeKeys) {
    if (base.includes(`.${locale}.`) || base.endsWith(`.${locale}.html`) || base.endsWith(`.${locale}.htm`)) {
      return true;
    }
  }
  return false;
}

export function filterGeneratedHtmlOutputs(
  files: readonly string[],
  outputDirs: readonly string[],
  locales: readonly string[]
): string[] {
  return files.filter(
    (rel) => !outputDirs.some((outputDir) => isGeneratedHtmlOutput(rel, outputDir, locales))
  );
}

/** Project-relative HTML paths covered by both a UI source root and a docs content path. */
export function overlappingHtmlSources(
  uiHtmlFiles: readonly string[],
  docHtmlFiles: readonly string[]
): string[] {
  const docs = new Set(docHtmlFiles.map((rel) => toPosix(rel)));
  return uiHtmlFiles.filter((rel) => docs.has(toPosix(rel)));
}

export function htmlOutputLocales(sourceLocale: string, targetLocales: readonly string[]): string[] {
  return [...new Set([sourceLocale, ...targetLocales].filter((locale) => locale.trim() !== ""))];
}

export function normalizeHtmlRel(relPath: string): string {
  return toPosix(path.normalize(relPath));
}
