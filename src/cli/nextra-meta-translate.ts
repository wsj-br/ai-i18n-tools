import fs from "fs";
import path from "path";
import { minimatch } from "minimatch";
import type { I18nDocTranslateConfig } from "../core/types.js";
import { metaFileTrackingKey } from "../core/doc-file-tracking.js";
import { matchesDocsOutputStylePreset } from "../core/docs-output-normalize.js";
import { resolveTranslatedOutputPath } from "./helpers.js";
import { TranslationCache } from "../core/cache.js";
import { Glossary } from "../glossary/glossary.js";
import { LlmClient } from "../api/llm-client.js";
import type { TranslateRunOptions, TranslateTotals } from "./doc-translate.js";
import { translateTsObjectLiteralFile } from "./doc-shell-ts-translate.js";

const META_FILENAMES = new Set(["_meta.ts", "_meta.tsx", "_meta.js"]);

function walkForMetaFiles(
  dir: string,
  projectRoot: string,
  out: string[],
  matches: (relPath: string, filename: string) => boolean
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkForMetaFiles(full, projectRoot, out, matches);
    } else if (ent.isFile()) {
      const rel = path.relative(projectRoot, full).split(path.sep).join("/");
      if (matches(rel, ent.name)) {
        out.push(rel);
      }
    }
  }
}

export function collectNextraMetaFiles(
  projectRoot: string,
  config: I18nDocTranslateConfig
): string[] {
  if (!matchesDocsOutputStylePreset(config.doc.docsOutput, "nextra")) {
    return [];
  }
  const globCfg = config.doc.nextraMetaGlob;
  const out: string[] = [];
  if (globCfg) {
    const globs = Array.isArray(globCfg) ? globCfg : [globCfg];
    walkForMetaFiles(projectRoot, projectRoot, out, (rel) =>
      globs.some((g) => minimatch(rel, g, { dot: true }))
    );
  } else {
    const docsRoot = config.doc.docsOutput.docsRoot?.trim() || "content/en";
    const absRoot = path.resolve(projectRoot, docsRoot);
    if (!fs.existsSync(absRoot)) {
      return [];
    }
    walkForMetaFiles(absRoot, projectRoot, out, (_rel, filename) =>
      META_FILENAMES.has(filename)
    );
  }
  out.sort();
  return out;
}

export async function translateNextraMetaFiles(
  config: I18nDocTranslateConfig,
  locale: string,
  projectRoot: string,
  metaRelPaths: string[],
  cache: TranslationCache | null,
  client: LlmClient | null,
  glossary: Glossary,
  opts: TranslateRunOptions,
  hitKeys?: Set<string>
): Promise<TranslateTotals> {
  const totals: TranslateTotals = {
    filesWritten: 0,
    filesSkipped: 0,
    filesProcessed: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };
  const blockIdx = opts.documentationBlockIndex ?? 0;

  for (const rel of metaRelPaths) {
    const absSource = path.join(projectRoot, rel);
    const outPath = resolveTranslatedOutputPath(config, projectRoot, locale, rel, "json");
    const fileTrackingKey = metaFileTrackingKey(blockIdx, rel);
    const { totals: fileTotals } = await translateTsObjectLiteralFile({
      absSource,
      relPathFromCwd: rel,
      locale,
      config,
      cache,
      client,
      glossary,
      opts,
      fileTrackingKey,
      outPath,
      policy: "meta",
      metaTranslatableKeys: config.doc.nextraMetaTranslatableKeys,
      contentTypeLabel: "nextra-meta",
      hitKeys,
    });
    totals.filesWritten += fileTotals.filesWritten ?? 0;
    totals.filesSkipped += fileTotals.filesSkipped ?? 0;
    totals.filesProcessed = (totals.filesProcessed ?? 0) + (fileTotals.filesProcessed ?? 0);
    totals.inputTokens += fileTotals.inputTokens ?? 0;
    totals.outputTokens += fileTotals.outputTokens ?? 0;
    totals.costUsd = (totals.costUsd ?? 0) + (fileTotals.costUsd ?? 0);
    totals.segmentsCached = (totals.segmentsCached ?? 0) + (fileTotals.segmentsCached ?? 0);
    totals.segmentsTranslated =
      (totals.segmentsTranslated ?? 0) + (fileTotals.segmentsTranslated ?? 0);
    totals.segmentValidationFailures =
      (totals.segmentValidationFailures ?? 0) + (fileTotals.segmentValidationFailures ?? 0);
    totals.individualSegmentTranslations =
      (totals.individualSegmentTranslations ?? 0) + (fileTotals.individualSegmentTranslations ?? 0);
  }

  return totals;
}
