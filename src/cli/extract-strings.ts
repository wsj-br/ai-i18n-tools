import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { UIStringExtractor } from "../extractors/ui-string-extractor.js";
import {
  aggregateUiStringLocations,
  defaultFuncNamesFromConfig,
} from "../extractors/ui-string-locations.js";
import { collectFilesByExtension } from "./file-utils.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";
import { timestamp } from "./format.js";

export interface ExtractSummary {
  found: number;
  added: number;
  updated: number;
  outPath: string;
}

/**
 * Scan `ui.sourceRoots` for UI strings and write merged `strings.json`.
 */
export function runExtract(config: I18nConfig, cwd: string): ExtractSummary {
  if (!config.features.extractUIStrings) {
    throw new Error("features.extractUIStrings is disabled in config");
  }

  console.log(chalk.cyan(`🔍 ${timestamp()} - Extracting UI strings…`));

  const rx = new UIStringExtractor(config.ui.reactExtractor, { cwd });
  const list = config.ui.reactExtractor?.extensions ?? [".js", ".jsx", ".ts", ".tsx"];
  const files = collectFilesByExtension(config.ui.sourceRoots, list, cwd);
  const packageJsonPath = path.resolve(cwd, config.ui.reactExtractor?.packageJsonPath ?? "package.json");
  const funcNames = defaultFuncNamesFromConfig(config.ui.reactExtractor);

  const locByHash = aggregateUiStringLocations(
    files,
    (rel) => fs.readFileSync(path.join(cwd, rel), "utf8"),
    funcNames,
    {
      cwd,
      packageJsonPath,
      includePackageDescription: config.ui.reactExtractor?.includePackageDescription ?? true,
    }
  );

  const byHash = new Map<string, { source: string; translated: Record<string, string> }>();
  let found = 0;

  for (const rel of files) {
    const abs = path.join(cwd, rel);
    const content = fs.readFileSync(abs, "utf8");
    const segs = rx.extract(content, rel);
    for (const s of segs) {
      if (!byHash.has(s.hash)) {
        byHash.set(s.hash, { source: s.content, translated: {} });
        found++;
      }
    }
  }

  for (const s of rx.packageDescriptionSegments()) {
    if (!byHash.has(s.hash)) {
      byHash.set(s.hash, { source: s.content, translated: {} });
      found++;
    }
  }

  const outPath = resolveStringsJsonPath(config, cwd);
  let existing: Record<
    string,
    { source?: string; translated?: Record<string, string>; locations?: Array<{ file: string; line: number }> }
  > = {};
  if (fs.existsSync(outPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outPath, "utf8")) as typeof existing;
    } catch {
      /* ignore */
    }
  }

  let added = 0;
  let updated = 0;
  const output: Record<
    string,
    {
      source: string;
      translated: Record<string, string>;
      locations?: Array<{ file: string; line: number }>;
    }
  > = {};

  for (const [h, next] of byHash) {
    const prev = existing[h];
    if (!prev) {
      added++;
    } else if (prev.source !== next.source) {
      updated++;
    }
    const mergedTranslated =
      prev && typeof prev.translated === "object" && prev.translated ? { ...prev.translated } : {};
    const locs = locByHash.get(h);
    output[h] = {
      source: next.source,
      translated: mergedTranslated,
      ...(locs && locs.length > 0 ? { locations: locs } : {}),
    };
  }

  writeAtomicUtf8(outPath, `${JSON.stringify(output, null, 2)}\n`);

  return { found, added, updated, outPath };
}
