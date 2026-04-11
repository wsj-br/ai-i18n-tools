import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Parser } from "i18next-scanner";
import type { UIStringExtractorConfig } from "../core/types.js";

export type UiStringLocation = { file: string; line: number };

/** MD5 first 8 hex - must match {@link UIStringExtractor} / strings.json keys. */
export function uiStringHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex").slice(0, 8);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Same core pattern as i18next-scanner `parseFuncFromString` (lib/parser.js) so
 * location hashes align with extracted strings.
 */
function buildParseFuncRegExp(funcNames: string[]): RegExp {
  const matchFuncs = funcNames.map((func) => `(?:${escapeRegExp(func)})`).join("|");
  const matchSpecialCharacters = "[\\r\\n\\s]*";
  const stringPart =
    "`(?:[^`\\\\]|\\\\(?:.|$))*`" +
    "|" +
    '"(?:[^"\\\\]|\\\\(?:.|$))*"' +
    "|" +
    "'(?:[^'\\\\]|\\\\(?:.|$))*'";
  const stringGroup = `${matchSpecialCharacters}(${stringPart})${matchSpecialCharacters}`;
  const stringNoGroup = `${matchSpecialCharacters}(?:${stringPart})${matchSpecialCharacters}`;
  const keys = `(${stringNoGroup}|\\[${stringNoGroup}(?:[,]${stringNoGroup})?\\])`;
  const pattern = `(?:(?:^\\s*)|[^a-zA-Z0-9_])(?:${matchFuncs})\\(${keys}(?:[,]${stringGroup})?[,\\)]`;
  return new RegExp(pattern, "gim");
}

/**
 * Collect per-hash source locations from one file's content (JS/TS).
 */
export function collectUiStringLocationsFromSource(
  content: string,
  relPath: string,
  funcNames: string[]
): Map<string, UiStringLocation[]> {
  const out = new Map<string, UiStringLocation[]>();
  const parser = new Parser({
    func: { list: funcNames, extensions: [".ts"] },
    nsSeparator: false,
    keySeparator: false,
  });
  const fixKeys = (parser as unknown as { fixStringAfterRegExpAsArray: (s: string) => string[] })
    .fixStringAfterRegExpAsArray.bind(parser);

  const re = buildParseFuncRegExp(funcNames);
  const relNorm = relPath.replace(/\\/g, "/");
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(content)) !== null) {
    const idx = m.index;
    const line = 1 + (content.slice(0, idx).match(/\n/g) ?? []).length;
    let keyParts: string[];
    try {
      keyParts = fixKeys(m[1] ?? "");
    } catch {
      continue;
    }
    for (const raw of keyParts) {
      const str = String(raw).trim();
      if (!str) continue;
      const h = uiStringHash(str);
      const loc: UiStringLocation = { file: relNorm, line };
      const dedupeKey = `${h}:${relNorm}:${line}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      const list = out.get(h) ?? [];
      list.push(loc);
      out.set(h, list);
    }
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
export function packageJsonDescriptionLocation(packageJsonPath: string, cwd: string): UiStringLocation {
  const rel = path.relative(cwd, packageJsonPath) || "package.json";
  const relNorm = rel.replace(/\\/g, "/");
  let line = 1;
  try {
    const text = fs.readFileSync(packageJsonPath, "utf8");
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*"description"\s*:/.test(lines[i])) {
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
