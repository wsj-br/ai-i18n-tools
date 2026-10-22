import fs from "fs";
import path from "path";
import chalk from "chalk";
import {
  buildUiLanguageRowsFromMaster,
  loadUiLanguagesMaster,
} from "../core/ui-languages-catalog.js";
import type { I18nConfig, I18nUiTranslateConfig, StringsJsonPluralEntry } from "../core/types.js";
import { isPluralStringsEntry } from "../core/types.js";
import { UIStringExtractor } from "../extractors/ui-string-extractor.js";
import {
  aggregateUiStringLocations,
  defaultFuncNamesFromConfig,
  uiCatalogHash,
  uiStringHash,
  type UiStringLocation,
} from "../extractors/ui-string-locations.js";
import { extractTemplateI18nCalls } from "../extractors/template-i18n-extractor.js";
import { isGeneratedI18nPy } from "../extractors/python-string-extractor.js";
import { readPyprojectDescription } from "../extractors/pyproject-toml.js";
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
import {
  effectiveUiManifestRel,
  effectiveUiTargetLocales,
  formatUiBlockLabel,
  selectUiBlocks,
  toUiTranslateConfig,
} from "../core/ui-blocks.js";
import { collectFilesByExtension } from "./file-utils.js";
import {
  filterGeneratedHtmlOutputs,
  htmlOutputLocales,
  overlappingHtmlSources,
} from "../core/html-source-filter.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";
import { timestamp } from "./format.js";
import {
  logGenerateUiLanguagesWarnings,
  resolveDefaultUiLanguagesMasterPath,
  runGenerateUiLanguages,
} from "./generate-ui-languages.js";
import { t } from "../i18n/index.js";
import { USER_EDITED_MODEL } from "../core/user-edited-model.js";
import { bundledMasterAvailable } from "../core/sea-assets.js";
import { ingestPoTranslations, listExistingPoFiles, parsePo } from "../core/gettext-codec.js";

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
  pluralSource?: string;
  context?: string;
};

/**
 * Scan each selected UI block and write its `strings.json` plus manifest.
 */
export function runExtract(config: I18nConfig, cwd: string, selector?: string): ExtractSummary {
  let selected;
  try {
    selected = selectUiBlocks(config, selector);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
  if (selected.length === 0) {
    throw new Error(t("ui.sourceRoots must be non-empty to extract UI strings"));
  }
  const blocks = selected.map((item) => {
    const locales = effectiveUiTargetLocales(config, item.block);
    const view = toUiTranslateConfig({ ...config, targetLocales: locales }, item.block);
    if (selected.length > 1 || item.block.description?.trim()) {
      console.log(chalk.cyan(formatUiBlockLabel(item.index, item.block)));
    }
    return runExtractBlock(view, cwd, item.index, config);
  });
  return combineExtractSummaries(blocks);
}

function combineExtractSummaries(blocks: ExtractSummary[]): ExtractSummary {
  const first = blocks[0];
  if (!first) {
    throw new Error(t("ui.sourceRoots must be non-empty to extract UI strings"));
  }
  if (blocks.length === 1) {
    return first;
  }
  return {
    found: blocks.reduce((sum, block) => sum + block.found, 0),
    added: blocks.reduce((sum, block) => sum + block.added, 0),
    updated: blocks.reduce((sum, block) => sum + block.updated, 0),
    outPath: blocks.map((block) => block.outPath).join(", "),
    uiLanguagesOutPath: blocks
      .map((block) => block.uiLanguagesOutPath)
      .filter((item): item is string => Boolean(item))
      .join(", "),
  };
}

/**
 * Scan one UI block's `sourceRoots` and write its merged `strings.json`.
 */
function runExtractBlock(
  config: I18nUiTranslateConfig,
  cwd: string,
  blockIndex: number,
  root: I18nConfig
): ExtractSummary {
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
  const htmlLocales = htmlOutputLocales(config.sourceLocale, config.targetLocales);
  const htmlOutputDirs = (config.docs ?? []).map((block) => block.outputDir);
  const htmlFiles = filterGeneratedHtmlOutputs(
    files.filter((rel) => htmlExtensions.has(path.extname(rel).toLowerCase())),
    htmlOutputDirs,
    htmlLocales
  );
  const docHtml = (config.docs ?? []).flatMap((block) =>
    filterGeneratedHtmlOutputs(
      collectFilesByExtension(block.contentPaths, [".html", ".htm"], cwd),
      htmlOutputDirs,
      htmlLocales
    )
  );
  for (const rel of overlappingHtmlSources(htmlFiles, docHtml)) {
    console.warn(
      chalk.yellow(
        t(
          "⚠️  {{path}} is both a UI HTML source and a documentation HTML page. Catalog markers and document translation will both apply.",
          { path: rel }
        )
      )
    );
  }
  const codeFiles = files.filter((rel) => {
    if (htmlExtensions.has(path.extname(rel).toLowerCase())) {
      return false;
    }
    const base = rel.split("/").pop();
    if (base !== "i18n.py") {
      return true;
    }
    try {
      return !isGeneratedI18nPy(fs.readFileSync(path.join(cwd, rel), "utf8"));
    } catch {
      return true;
    }
  });
  const htmlMarkers = uiExtractor?.htmlI18nAttributes ?? [...HTML_I18N_MARKERS];

  const validationErrors: string[] = [];
  for (const rel of codeFiles) {
    const abs = path.join(cwd, rel);
    const content = fs.readFileSync(abs, "utf8");
    const calls = extractUiCallsFromFileContent(content, rel, funcNames);
    for (const call of calls) {
      if (call.unsafe) {
        console.warn(
          chalk.yellow(
            t(
              "⚠️  {{file}}:{{line}} pre-evaluated translation {{value}} cannot be looked up. Run migrate-python-i18n.",
              { file: rel, line: call.line, value: JSON.stringify(call.literal) }
            )
          )
        );
      }
      if (call.plurals && !call.pluralSource && pluralMultiPlaceholderMissingCount(call.literal)) {
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
          ...(s.pluralSource ? { pluralSource: s.pluralSource } : {}),
          ...(s.context ? { context: s.context } : {}),
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
    for (const call of extractTemplateI18nCalls(content, rel, funcNames)) {
      const text = call.literal.trim();
      if (!text) {
        continue;
      }
      const h = uiCatalogHash(text, call.context);
      if (!byHash.has(h)) {
        byHash.set(h, {
          source: text,
          ...(call.plurals === true ? { plurals: true } : {}),
          ...(call.pluralSource ? { pluralSource: call.pluralSource } : {}),
          ...(call.context ? { context: call.context } : {}),
        });
        found++;
      }
      const cur: UiStringLocation[] = locByHash.get(h) ?? [];
      const key = `${rel}:${call.line}`;
      if (!cur.some((l) => `${l.file}:${l.line}` === key)) {
        cur.push({ file: rel, line: call.line });
        locByHash.set(h, cur);
      }
    }
  }

  const pyprojectRel = uiExtractor?.pyprojectTomlPath ?? "pyproject.toml";
  if (uiExtractor?.includePackageDescription !== false) {
    const pyprojectPath = path.resolve(cwd, pyprojectRel);
    if (fs.existsSync(pyprojectPath)) {
      const parsed = readPyprojectDescription(fs.readFileSync(pyprojectPath, "utf8"));
      if (parsed.ok === false && parsed.reason === "unsupported") {
        console.warn(
          chalk.yellow(
            t(
              "⚠️  {{file}}:{{line}} pyproject.toml description is not a basic or triple-quoted string; skipping it.",
              { file: pyprojectRel, line: parsed.line }
            )
          )
        );
      } else if (parsed.ok && parsed.value.description) {
        const text = parsed.value.description;
        const h = uiCatalogHash(text);
        if (!byHash.has(h)) {
          byHash.set(h, { source: text });
          found++;
        }
        const rel = path.relative(cwd, pyprojectPath).split(path.sep).join("/");
        const cur = locByHash.get(h) ?? [];
        if (!cur.some((l) => l.file === rel && l.line === parsed.value.line)) {
          cur.push({ file: rel, line: parsed.value.line });
          locByHash.set(h, cur);
        }
      }
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
    if (!bundledMasterAvailable(masterPath)) {
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

  const outPath = resolveStringsJsonPath(config.ui, cwd);
  let existing: Record<string, unknown> = {};
  if (fs.existsSync(outPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outPath, "utf8")) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }

  const ingested = new Map<
    string,
    Array<{
      locale: string;
      translation: string | Record<string, string>;
      plural: boolean;
    }>
  >();
  if (config.ui.gettext?.ingestExistingPo !== false && config.ui.gettext) {
    const gettext = config.ui.gettext;
    for (const file of listExistingPoFiles(
      cwd,
      gettext.outputDir,
      gettext.domain,
      gettext.potPath
    )) {
      let text: string;
      try {
        text = fs.readFileSync(file.file, "utf8");
      } catch {
        continue;
      }
      if (!file.locale) {
        for (const entry of parsePo(text).entries) {
          if (entry.obsolete || entry.msgid === "") {
            continue;
          }
          const h = uiCatalogHash(entry.msgid, entry.context);
          if (!byHash.has(h)) {
            byHash.set(h, {
              source: entry.msgid,
              ...(entry.msgidPlural ? { plurals: true, pluralSource: entry.msgidPlural } : {}),
              ...(entry.context ? { context: entry.context } : {}),
            });
            found++;
          }
        }
        continue;
      }
      for (const row of ingestPoTranslations(text, file.locale)) {
        if (!byHash.has(row.hash)) {
          byHash.set(row.hash, {
            source: row.source,
            ...(row.plural ? { plurals: true } : {}),
            ...(row.pluralSource ? { pluralSource: row.pluralSource } : {}),
            ...(row.context ? { context: row.context } : {}),
          });
          found++;
        }
        const list = ingested.get(row.hash) ?? [];
        list.push({ locale: row.locale, translation: row.translation, plural: row.plural });
        ingested.set(row.hash, list);
        if (row.references.length > 0) {
          const cur = locByHash.get(row.hash) ?? [];
          for (const ref of row.references) {
            if (!cur.some((item) => item.file === ref.file && item.line === ref.line)) {
              cur.push(ref);
            }
          }
          locByHash.set(row.hash, cur);
        }
      }
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
      applyIngestedTranslations(h, true, mergedTranslated, mergedModels);
      output[h] = {
        plural: true,
        source: next.source,
        ...(next.pluralSource ? { pluralSource: next.pluralSource } : {}),
        ...(next.context ? { context: next.context } : {}),
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
      applyIngestedTranslations(h, false, mergedTranslated, mergedModels);
      output[h] = {
        source: next.source,
        ...(next.context ? { context: next.context } : {}),
        translated: mergedTranslated,
        ...(Object.keys(mergedModels).length > 0 ? { models: mergedModels } : {}),
        ...(locs && locs.length > 0 ? { locations: locs } : {}),
      };
    }
  }

  writeAtomicUtf8(outPath, `${JSON.stringify(output, null, 2)}\n`);

  function applyIngestedTranslations(
    hash: string,
    plural: boolean,
    translated: Record<string, unknown>,
    models: Record<string, string>
  ): void {
    for (const row of ingested.get(hash) ?? []) {
      if (row.plural !== plural || models[row.locale] === USER_EDITED_MODEL) {
        continue;
      }
      const current = translated[row.locale];
      if (typeof current === "string" && current.trim()) {
        continue;
      }
      if (current && typeof current === "object" && Object.keys(current).length > 0) {
        continue;
      }
      translated[row.locale] = row.translation;
    }
  }

  let uiLanguagesOutPath: string | undefined;
  const masterPath = resolveDefaultUiLanguagesMasterPath();
  if (bundledMasterAvailable(masterPath)) {
    try {
      const gen = runGenerateUiLanguages(
        {
          ...root,
          targetLocales: config.targetLocales,
          languagesManifestPath: effectiveUiManifestRel(root, config.ui, blockIndex),
        },
        cwd,
        { masterPath, dryRun: false }
      );
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
