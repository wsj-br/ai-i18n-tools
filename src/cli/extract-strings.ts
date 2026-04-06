import fs from "fs";
import path from "path";
import type { I18nConfig } from "../core/types.js";
import { ReactExtractor } from "../extractors/react-extractor.js";
import { collectFilesByExtension } from "./file-utils.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";

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

  const rx = new ReactExtractor(config.ui.reactExtractor, { cwd });
  const list = config.ui.reactExtractor?.extensions ?? [".js", ".jsx", ".ts", ".tsx"];
  const files = collectFilesByExtension(config.ui.sourceRoots, list, cwd);

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
  let existing: Record<string, { source?: string; translated?: Record<string, string> }> = {};
  if (fs.existsSync(outPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outPath, "utf8")) as typeof existing;
    } catch {
      /* ignore */
    }
  }

  let added = 0;
  let updated = 0;
  const output: Record<string, { source: string; translated: Record<string, string> }> = {};

  for (const [h, next] of byHash) {
    const prev = existing[h];
    if (!prev) {
      added++;
    } else if (prev.source !== next.source) {
      updated++;
    }
    const mergedTranslated =
      prev && typeof prev.translated === "object" && prev.translated ? { ...prev.translated } : {};
    output[h] = { source: next.source, translated: mergedTranslated };
  }

  writeAtomicUtf8(outPath, `${JSON.stringify(output, null, 2)}\n`);

  return { found, added, updated, outPath };
}
