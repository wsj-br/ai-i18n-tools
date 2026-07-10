import fs from "fs";
import path from "path";
import type { I18nDocTranslateConfig } from "../core/types.js";
import { dictionaryFileTrackingKey } from "../core/doc-file-tracking.js";
import { localePathPlaceholders } from "../core/locale-utils.js";
import { TranslationCache } from "../core/cache.js";
import { Glossary } from "../glossary/glossary.js";
import { LlmClient } from "../api/llm-client.js";
import type { TranslateRunOptions, TranslateTotals } from "./doc-translate.js";
import { translateTsObjectLiteralFile } from "./doc-shell-ts-translate.js";

const DEFAULT_DICTIONARY_OUTPUT_TEMPLATE = "{dir}/{locale}.ts";

function expandDictionaryOutputPath(
  template: string,
  projectRoot: string,
  locale: string,
  dictionaryRelPath: string
): string {
  const posixRel = dictionaryRelPath.replace(/\\/g, "/");
  const dir = path.posix.dirname(posixRel);
  const localeVars = localePathPlaceholders(locale);
  const vars: Record<string, string> = {
    ...localeVars,
    dir,
  };
  let out = template;
  for (const [key, val] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(val);
  }
  return path.isAbsolute(out) ? out : path.join(projectRoot, out);
}

export function resolveNextraDictionarySource(config: I18nDocTranslateConfig): string | null {
  const p = config.doc.nextraDictionaryPath?.trim();
  return p || null;
}

export async function translateNextraDictionary(
  config: I18nDocTranslateConfig,
  locale: string,
  projectRoot: string,
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

  const relSource = resolveNextraDictionarySource(config);
  if (!relSource) {
    return totals;
  }

  const absSource = path.resolve(projectRoot, relSource);
  if (!fs.existsSync(absSource)) {
    throw new Error(`nextraDictionaryPath not found: ${relSource}`);
  }

  const template =
    config.doc.nextraDictionaryOutputTemplate?.trim() || DEFAULT_DICTIONARY_OUTPUT_TEMPLATE;
  const outPath = expandDictionaryOutputPath(template, projectRoot, locale, relSource);
  const blockIdx = opts.documentationBlockIndex ?? 0;
  const fileTrackingKey = dictionaryFileTrackingKey(blockIdx, relSource);

  const { totals: fileTotals } = await translateTsObjectLiteralFile({
    absSource,
    relPathFromCwd: relSource,
    locale,
    config,
    cache,
    client,
    glossary,
    opts,
    fileTrackingKey,
    outPath,
    policy: "dictionary",
    contentTypeLabel: "nextra-dictionary",
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

  return totals;
}
