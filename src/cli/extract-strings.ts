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
  type UiStringLocation,
} from "../extractors/ui-string-locations.js";
import {
  collectHtmlI18nLocations,
  collectHtmlI18nStrings,
  HTML_I18N_MARKERS,
} from "../extractors/html-i18n-marks.js";
import {
  extractUiCallsFromFileContent,
  pluralMultiPlaceholderMissingCount,
} from "../extractors/ui-string-babel.js";
import { getUiExtractorConfig } from "../core/ui-extractor-config.js";
import { collectFilesByExtension } from "./file-utils.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";
import { timestamp } from "./format.js";
import {
  logGenerateUiLanguagesWarnings,
  resolveDefaultUiLanguagesMasterPath,
  runGenerateUiLanguages,
} from "./generate-ui-languages.js";
import { t } from "../i18n/index.js";

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
  if (config.ui.sourceRoots.length === 0) {
    throw new Error(t("ui.sourceRoots must be non-empty to extract UI strings"));
  }

  console.log(chalk.cyan(t("🔍 {{time}} - Extracting UI strings…", { time: timestamp() })));

  const uiExtractor = getUiExtractorConfig(config.ui);
  const rx = new UIStringExtractor(uiExtractor, { cwd });
  const list = uiExtractor?.extensions ?? [".js", ".jsx", ".ts", ".tsx"];
  const files = collectFilesByExtension(config.ui.sourceRoots, list, cwd);
  const packageJsonPath = path.resolve(cwd, uiExtractor?.packageJsonPath ?? "package.json");
  const funcNames = defaultFuncNamesFromConfig(uiExtractor);

  // HTML files use marker attributes (not Babel `t()` calls); keep them out of the AST passes.
  const htmlExtensions = new Set([".html", ".htm"]);
  const htmlFiles = files.filter((rel) => htmlExtensions.has(path.extname(rel).toLowerCase()));
  const codeFiles = files.filter((rel) => !htmlExtensions.has(path.extname(rel).toLowerCase()));
  const htmlMarkers = uiExtractor?.htmlI18nAttributes ?? [...HTML_I18N_MARKERS];

  const validationErrors: string[] = [];
  for (const rel of codeFiles) {
    const abs = path.join(cwd, rel);
    const content = fs.readFileSync(abs, "utf8");
    const calls = extractUiCallsFromFileContent(content, rel, funcNames);
    for (const call of calls) {
      if (call.plurals && pluralMultiPlaceholderMissingCount(call.literal)) {
        validationErrors.push(
          t(
            "[extract] plurals: string with multiple interpolations must include {{count}} for the plural axis."
          ) +
            "\n" +
            t("  String: {{value}}", { value: JSON.stringify(call.literal) }) +
            "\n" +
            t("  File: {{file}}", { file: rel }) +
            "\n" +
            t("  Line: {{line}}", { line: call.line })
        );
      }
    }
  }
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join("\n\n"));
  }

  const locByHash = aggregateUiStringLocations(
    codeFiles,
    (rel) => fs.readFileSync(path.join(cwd, rel), "utf8"),
    funcNames,
    {
      cwd,
      packageJsonPath,
      includePackageDescription: uiExtractor?.includePackageDescription ?? true,
    }
  );

  const byHash = new Map<string, ScannedRow>();
  let found = 0;

  for (const rel of codeFiles) {
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

  // HTML marker strings (data-i18n / data-i18n-*) feed the same catalog, keyed by English source text.
  for (const rel of htmlFiles) {
    const abs = path.join(cwd, rel);
    const content = fs.readFileSync(abs, "utf8");
    for (const s of collectHtmlI18nStrings(content, htmlMarkers)) {
      const h = uiStringHash(s.value);
      if (!byHash.has(h)) {
        byHash.set(h, { source: s.value });
        found++;
      }
    }
    const htmlLocs = collectHtmlI18nLocations(content, rel, htmlMarkers);
    for (const [h, locs] of htmlLocs) {
      const cur: UiStringLocation[] = locByHash.get(h) ?? [];
      const seen = new Set(cur.map((l) => `${l.file}:${l.line}`));
      for (const l of locs) {
        const key = `${l.file}:${l.line}`;
        if (!seen.has(key)) {
          seen.add(key);
          cur.push(l);
        }
      }
      locByHash.set(h, cur);
    }
  }

  for (const s of rx.packageDescriptionSegments()) {
    if (!byHash.has(s.hash)) {
      byHash.set(s.hash, { source: s.content });
      found++;
    }
  }

  if (uiExtractor?.includeUiLanguageEnglishNames) {
    const masterPath = resolveDefaultUiLanguagesMasterPath();
    if (!fs.existsSync(masterPath)) {
      console.warn(
        chalk.yellow(
          t(
            "⚠️  {{time}} - includeUiLanguageEnglishNames is enabled but bundled ui-languages master was not found; skipping englishName merge.",
            { time: timestamp() }
          )
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
            t("⚠️  {{time}} - Could not merge englishName hints from master catalog: {{error}}", {
              time: timestamp(),
              error: err instanceof Error ? err.message : String(err),
            })
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
          t(
            "⚠️  {{time}} - Entry {{hash}}: plain/plural shape changed; clearing stored translations for this key.",
            { time: timestamp(), hash: h }
          )
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
          t("⚠️  {{time}} - Could not write ui-languages.json: {{error}}", {
            time: timestamp(),
            error: e instanceof Error ? e.message : String(e),
          })
        )
      );
    }
  } else {
    console.warn(
      chalk.yellow(
        t(
          "⚠️  {{time}} - Bundled ui-languages master not found at {{path}}; skipping ui-languages.json generation.",
          { time: timestamp(), path: masterPath }
        )
      )
    );
  }

  return { found, added, updated, outPath, uiLanguagesOutPath };
}
