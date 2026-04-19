import fs from "fs";
import path from "path";
import chalk from "chalk";
import {
  buildUiLanguageRowsFromMaster,
  loadUiLanguagesMaster,
} from "../core/ui-languages-catalog.js";
import type { I18nConfig, StringsJsonPluralEntry } from "../core/types.js";
import { isPluralStringsEntry } from "../core/types.js";
import { UIStringExtractor } from "../extractors/ui-string-extractor.js";
import {
  aggregateUiStringLocations,
  defaultFuncNamesFromConfig,
  uiStringHash,
} from "../extractors/ui-string-locations.js";
import {
  extractUiCallsFromSource,
  pluralMultiPlaceholderMissingCount,
} from "../extractors/ui-string-babel.js";
import { collectFilesByExtension } from "./file-utils.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";
import { timestamp } from "./format.js";
import {
  logGenerateUiLanguagesWarnings,
  resolveDefaultUiLanguagesMasterPath,
  runGenerateUiLanguages,
} from "./generate-ui-languages.js";

export interface ExtractSummary {
  found: number;
  added: number;
  updated: number;
  outPath: string;
  /** Set when `ui-languages.json` was written alongside extract. */
  uiLanguagesOutPath?: string;
}

type ScannedRow = {
  source: string;
  plurals?: boolean;
  zeroDigit?: boolean;
};

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
  const packageJsonPath = path.resolve(
    cwd,
    config.ui.reactExtractor?.packageJsonPath ?? "package.json"
  );
  const funcNames = defaultFuncNamesFromConfig(config.ui.reactExtractor);

  const validationErrors: string[] = [];
  for (const rel of files) {
    const abs = path.join(cwd, rel);
    const content = fs.readFileSync(abs, "utf8");
    const calls = extractUiCallsFromSource(content, rel, funcNames);
    for (const call of calls) {
      if (call.plurals && pluralMultiPlaceholderMissingCount(call.literal)) {
        validationErrors.push(
          `[extract] plurals: string with multiple interpolations must include {{count}} for the plural axis.\n` +
            `  String: ${JSON.stringify(call.literal)}\n` +
            `  File: ${rel}\n` +
            `  Line: ${call.line}`
        );
      }
    }
  }
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join("\n\n"));
  }

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

  const byHash = new Map<string, ScannedRow>();
  let found = 0;

  for (const rel of files) {
    const abs = path.join(cwd, rel);
    const content = fs.readFileSync(abs, "utf8");
    const segs = rx.extract(content, rel);
    for (const s of segs) {
      if (!byHash.has(s.hash)) {
        byHash.set(s.hash, {
          source: s.content,
          ...(s.plurals === true ? { plurals: true } : {}),
          ...(s.zeroDigit === true ? { zeroDigit: true } : {}),
        });
        found++;
      }
    }
  }

  for (const s of rx.packageDescriptionSegments()) {
    if (!byHash.has(s.hash)) {
      byHash.set(s.hash, { source: s.content });
      found++;
    }
  }

  if (config.ui.reactExtractor?.includeUiLanguageEnglishNames) {
    const masterPath = resolveDefaultUiLanguagesMasterPath();
    if (!fs.existsSync(masterPath)) {
      console.warn(
        chalk.yellow(
          `⚠️  ${timestamp()} - includeUiLanguageEnglishNames is enabled but bundled ui-languages master was not found; skipping englishName merge.`
        )
      );
    } else {
      try {
        const master = loadUiLanguagesMaster(masterPath);
        const { rows } = buildUiLanguageRowsFromMaster(config, master);
        for (const row of rows) {
          const text = row.englishName.trim();
          if (!text) {
            continue;
          }
          const h = uiStringHash(text);
          if (!byHash.has(h)) {
            byHash.set(h, { source: text });
            found++;
          }
        }
      } catch (err) {
        console.warn(
          chalk.yellow(
            `⚠️  ${timestamp()} - Could not merge englishName hints from master catalog: ${err instanceof Error ? err.message : String(err)}`
          )
        );
      }
    }
  }

  const outPath = resolveStringsJsonPath(config, cwd);
  let existing: Record<string, unknown> = {};
  if (fs.existsSync(outPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outPath, "utf8")) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }

  let added = 0;
  let updated = 0;
  const output: Record<string, unknown> = {};

  for (const [h, next] of byHash) {
    const prev = existing[h] as Record<string, unknown> | undefined;
    if (!prev) {
      added++;
    } else if ((prev.source as string | undefined) !== next.source) {
      updated++;
    }

    const prevWasPlural = prev ? isPluralStringsEntry(prev as never) : false;
    const nextIsPlural = next.plurals === true;
    const shapeChange = !!prev && prevWasPlural !== nextIsPlural;

    if (shapeChange) {
      console.warn(
        chalk.yellow(
          `⚠️  ${timestamp()} - Entry ${h}: plain/plural shape changed; clearing stored translations for this key.`
        )
      );
    }

    const mergedModels =
      prev && typeof prev.models === "object" && prev.models
        ? { ...(prev.models as Record<string, string>) }
        : {};
    const locs = locByHash.get(h);

    if (nextIsPlural) {
      const mergedTranslated: StringsJsonPluralEntry["translated"] =
        !shapeChange && prevWasPlural && prev && isPluralStringsEntry(prev as never)
          ? {
              ...((prev as unknown as StringsJsonPluralEntry).translated ?? {}),
            }
          : {};
      output[h] = {
        plural: true,
        source: next.source,
        ...(next.zeroDigit ? { zeroDigit: true } : {}),
        translated: mergedTranslated,
        ...(Object.keys(mergedModels).length > 0 ? { models: mergedModels } : {}),
        ...(locs && locs.length > 0 ? { locations: locs } : {}),
      };
    } else {
      const mergedTranslated: Record<string, string> =
        !shapeChange && prev && !isPluralStringsEntry(prev as never) && prev.translated
          ? { ...(prev.translated as Record<string, string>) }
          : {};
      output[h] = {
        source: next.source,
        translated: mergedTranslated,
        ...(Object.keys(mergedModels).length > 0 ? { models: mergedModels } : {}),
        ...(locs && locs.length > 0 ? { locations: locs } : {}),
      };
    }
  }

  writeAtomicUtf8(outPath, `${JSON.stringify(output, null, 2)}\n`);

  let uiLanguagesOutPath: string | undefined;
  const masterPath = resolveDefaultUiLanguagesMasterPath();
  if (fs.existsSync(masterPath)) {
    try {
      const gen = runGenerateUiLanguages(config, cwd, { masterPath, dryRun: false });
      logGenerateUiLanguagesWarnings(gen.warnings);
      uiLanguagesOutPath = gen.outPath;
    } catch (e) {
      console.warn(
        chalk.yellow(
          `⚠️  ${timestamp()} - Could not write ui-languages.json: ${e instanceof Error ? e.message : String(e)}`
        )
      );
    }
  } else {
    console.warn(
      chalk.yellow(
        `⚠️  ${timestamp()} - Bundled ui-languages master not found at ${masterPath}; skipping ui-languages.json generation.`
      )
    );
  }

  return { found, added, updated, outPath, uiLanguagesOutPath };
}
