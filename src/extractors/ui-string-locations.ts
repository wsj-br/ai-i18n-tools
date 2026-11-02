import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { UIStringExtractorConfig } from "../core/types.js";
import { extractUiCallsFromFileContent } from "./ui-string-babel.js";

export type UiStringLocation = { file: string; line: number };

/** GNU Gettext context separator. Contextual catalog ids hash `context + SEP + source`. */
export const GETTEXT_CONTEXT_SEPARATOR = "\u0004";

/** MD5 first 8 hex - must match {@link UIStringExtractor} / strings.json keys. */
export function uiStringHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex").slice(0, 8);
}

/**
 * Catalog text for one call. JavaScript, TypeScript, and Python look the literal up
 * as written, including a leading or trailing space. C# and XAML keep the trimmed
 * key because `I18n.T` trims for lookup and puts that whitespace back on the result.
 * A whitespace-only literal is not a catalog entry.
 */
export function catalogUiLiteral(relPath: string, literal: string): string {
  if (!literal.trim()) {
    return "";
  }
  const ext = relPath.toLowerCase();
  const dotnet =
    ext.endsWith(".cs") ||
    ext.endsWith(".razor") ||
    ext.endsWith(".cshtml") ||
    ext.endsWith(".xaml") ||
    ext.endsWith(".axaml");
  return dotnet ? literal.trim() : literal;
}

/**
 * Catalog id for a UI string. Context-free rows stay `MD5-8(source)`.
 * Contextual rows (`pgettext`, Qt comment, `msgctxt`) use
 * `MD5-8(trimmed context + "\\u0004" + source)` so identical English
 * strings in different contexts do not collide. `source` is the catalog text
 * from {@link catalogUiLiteral}, not a second trim.
 */
export function uiCatalogHash(source: string, context?: string): string {
  const ctx = context?.trim();
  if (!ctx) {
    return uiStringHash(source);
  }
  return uiStringHash(`${ctx}${GETTEXT_CONTEXT_SEPARATOR}${source}`);
}

/** Flat JSON key. Contextual rows use `context + "\\u0004" + English source`. */
export function flatMessageKey(source: string, context?: string): string {
  const ctx = context?.trim();
  if (!ctx) {
    return source;
  }
  return `${ctx}${GETTEXT_CONTEXT_SEPARATOR}${source}`;
}

/**
 * Collect per-hash source locations from one file's content (JS/TS) via Babel AST.
 */
export function collectUiStringLocationsFromSource(
  content: string,
  relPath: string,
  funcNames: string[]
): Map<string, UiStringLocation[]> {
  const calls = extractUiCallsFromFileContent(content, relPath, funcNames);
  const out = new Map<string, UiStringLocation[]>();
  const seen = new Set<string>();
  const relNorm = relPath.replace(/\\/g, "/");
  for (const call of calls) {
    if (call.skipCatalog) {
      continue;
    }
    const str = catalogUiLiteral(relPath, call.literal);
    if (!str) {
      continue;
    }
    const h = uiCatalogHash(str, call.context);
    const dedupeKey = `${h}:${relNorm}:${call.line}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    const loc: UiStringLocation = { file: relNorm, line: call.line };
    const list = out.get(h) ?? [];
    list.push(loc);
    out.set(h, list);
  }
  return out;
}

function mergeLocationMaps(
  into: Map<string, UiStringLocation[]>,
  from: Map<string, UiStringLocation[]>
): void {
  for (const [h, locs] of from) {
    const cur = into.get(h) ?? [];
    const seen = new Set(cur.map((l) => `${l.file}:${l.line}`));
    for (const l of locs) {
      const k = `${l.file}:${l.line}`;
      if (!seen.has(k)) {
        seen.add(k);
        cur.push(l);
      }
    }
    into.set(h, cur);
  }
}

/** Line of `"description"` in package.json, or 1. */
export function packageJsonDescriptionLocation(
  packageJsonPath: string,
  cwd: string
): UiStringLocation {
  const rel = path.relative(cwd, packageJsonPath) || "package.json";
  const relNorm = rel.replace(/\\/g, "/");
  let line = 1;
  try {
    const text = fs.readFileSync(packageJsonPath, "utf8");
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*"description"\s*:/.test(lines[i]!)) {
        line = i + 1;
        break;
      }
    }
  } catch {
    /* keep line 1 */
  }
  return { file: relNorm, line };
}

/**
 * Merge location maps from all scanned files and optional package.json description.
 */
export function aggregateUiStringLocations(
  files: string[],
  readFile: (rel: string) => string,
  funcNames: string[],
  options: {
    packageJsonPath?: string;
    cwd: string;
    includePackageDescription?: boolean;
  }
): Map<string, UiStringLocation[]> {
  const merged = new Map<string, UiStringLocation[]>();
  for (const rel of files) {
    const content = readFile(rel);
    const map = collectUiStringLocationsFromSource(content, rel, funcNames);
    mergeLocationMaps(merged, map);
  }
  if (options.includePackageDescription !== false && options.packageJsonPath) {
    const pkgPath = options.packageJsonPath;
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { description?: unknown };
        const desc = typeof pkg.description === "string" ? pkg.description.trim() : "";
        if (desc) {
          const h = uiStringHash(desc);
          const loc = packageJsonDescriptionLocation(pkgPath, options.cwd);
          mergeLocationMaps(merged, new Map([[h, [loc]]]));
        }
      } catch {
        /* ignore */
      }
    }
  }
  return merged;
}

export function defaultFuncNamesFromConfig(config?: Partial<UIStringExtractorConfig>): string[] {
  return config?.funcNames ?? ["t", "i18n.t"];
}
