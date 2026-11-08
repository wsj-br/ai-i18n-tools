import fs from "fs";
import path from "path";
import chalk from "chalk";
import type {
  CldrPluralForm,
  I18nConfig,
  I18nUiTranslateConfig,
  StringsJsonEntry,
  StringsJsonPluralEntry,
} from "../core/types.js";
import { isPluralStringsEntry } from "../core/types.js";
import { flatMessageKey } from "../extractors/ui-string-locations.js";
import {
  buildPoCatalog,
  compileMo,
  moMessagesFromCatalog,
  poEntriesFromCatalog,
  serializePo,
  toGettextLocale,
  writeAtomicBuffer,
} from "../core/gettext-codec.js";
import { catalogEntriesToResx, serializeResx } from "../core/resx-codec.js";
import { LlmClient } from "../api/llm-client.js";
import {
  dedupeOrderedModelIds,
  englishLanguageNameForLocale,
  normalizeLocale,
  resolveUITranslationModels,
  translationScriptIssue,
} from "../core/config.js";
import { createFilteredLlmClient } from "./llm-client-factory.js";
import { buildPluralPassBPrompt, buildPluralStep0Prompt } from "../core/prompt-builder.js";
import {
  compactIdenticalPluralForms,
  expandPluralFormsForFlatOutput,
  pluralTranslatedLocaleHasContent,
  requiredCldrPluralForms,
} from "../core/plural-forms.js";
import { uiBlockFileTrackingKey } from "../core/doc-file-tracking.js";
import {
  effectiveUiTargetLocales,
  formatUiBlockLabel,
  resolveLocalesForUiBlock,
  selectUiBlocks,
  toUiTranslateConfig,
} from "../core/ui-blocks.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";
import { llmClientDebugFailedOpts } from "./translation-failure-log.js";
import {
  timestamp,
  formatElapsedMmSs,
  printTranslationModelSummary,
  localeModelRowsForRun,
} from "./format.js";
import type { TranslateTotals } from "./doc-translate.js";
import { printTranslationRunSummary, UI_STRING_SUMMARY_LABELS } from "./translate-summary.js";
import { runMapWithConcurrency } from "../utils/concurrency.js";
import {
  bindRunInterruptScope,
  isRunInterruptedError,
  interruptErrorFromSignal,
} from "../utils/run-interrupt.js";
import { Glossary } from "../glossary/glossary.js";
import { GLOSSARY_USER_HEADERS, parseGlossaryCsv } from "../glossary/parse-glossary-csv.js";
import {
  computeGuidanceFingerprint,
  loadTranslationContextFromConfig,
  translationContextClientOpts,
} from "../glossary/translation-context.js";
import {
  protectGlossaryForcedTerms,
  restoreGlossaryForcedTerms,
} from "../processors/glossary-force-placeholders.js";
import { USER_EDITED_MODEL } from "../core/user-edited-model.js";
import {
  plainPlaceholderIssues,
  pluralReferenceFormsFromRow,
  translationValuePlaceholderMessages,
} from "../core/ui-placeholder-audit.js";
import { isPlaceholderOnlyUiString } from "../core/ui-placeholders.js";
import { TranslationCache } from "../core/cache.js";
import { usageRecorderForCache } from "../core/usage-recorder.js";
import {
  safeResolveActiveProvider,
  localeModelsMapForProvider,
  uiModelsForProvider,
} from "../core/llm-providers.js";
import { t } from "../i18n/index.js";
const UI_CHUNK = 50;

/** Model id stored when a placeholder-only string is copied instead of sent to a model. */
const PLACEHOLDER_COPY_MODEL = "placeholder-copy";

const RULE = "⋯".repeat(30);

/** Project-relative path to the strings catalog for logs (parity with translate-docs `relativePath`). */
function stringsCatalogRelForLog(cwd: string, stringsPath: string): string {
  const rel = path.relative(cwd, stringsPath);
  return rel && rel.length > 0 ? rel : path.basename(stringsPath);
}

/**
 * 1-based range label for a contiguous plain-string batch within the missing-plain list
 * (same idea as `segRangeLabel` in doc-translate).
 */
function plainMissingBatchRangeLabel(
  startIndex0: number,
  batchLen: number,
  totalMissing: number
): string {
  const a = startIndex0 + 1;
  const b = startIndex0 + batchLen;
  if (batchLen === 1 || a === b) {
    return t("string {{a}}/{{total}}", { a, total: totalMissing });
  }
  return t("strings {{a}}–{{b}}/{{total}}", { a, b, total: totalMissing });
}

export interface TranslateUIOptions {
  cwd: string;
  locales: string[];
  /** Re-translate every entry of the target {@link locales}; does not touch source-locale plural forms. */
  force: boolean;
  /**
   * Re-run plural Step 0 for `sourceLocale` even when its forms already have content.
   * Separate from {@link force} because Pass B translates every target locale *from* these forms,
   * so refreshing them changes the source of truth for locales outside {@link locales}.
   */
  forceSourcePlurals?: boolean;
  dryRun: boolean;
  verbose: boolean;
  /** Path to the active log file (printed in the header block). */
  logPath?: string;
  /**
   * Max parallel target locales (CLI `-j`). Effective default when omitted: `config.concurrency ?? 4`.
   */
  concurrency?: number;
  /**
   * Max parallel LLM batch requests per locale (plain chunks of 50 and plural groups).
   * Effective default when omitted: `config.uiBatchConcurrency ?? 2`.
   */
  uiBatchConcurrency?: number;
  /** When aborted (Ctrl+C), cooperative workers stop claiming new work. */
  abortSignal?: AbortSignal;
  /**
   * When true, write per-failure debug logs (`*-FAILED-TRANSLATION_*.log`) under cacheDir.
   * Default: off.
   */
  debugFailed?: boolean;
  /** Raw `-l` / `--locale` value. Resolved per UI block against that block's locales. */
  localeFilter?: string;
  /** Limits the run to one block (index, description, or stringsJson path). */
  uiBlock?: string;
  /** Skip the per-block completion summary so the caller can print one aggregate. */
  suppressRunSummary?: boolean;
}

export interface TranslateUISummary {
  stringsUpdated: number;
  localesTouched: string[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

type StringsFile = Record<string, StringsJsonEntry>;

/** Same shape as {@link LlmClient} private `languageLabelForPrompt` for LLM instructions. */
function localeLabelForPrompt(
  config: Pick<I18nConfig, "localeDisplayNames">,
  localeCode: string
): string {
  const n = normalizeLocale(localeCode);
  const configured = config.localeDisplayNames?.[n];
  const display =
    configured && configured.trim().length > 0
      ? configured.trim()
      : englishLanguageNameForLocale(n);
  if (display && display.length > 0) {
    return `${display}`;
  }
  return localeCode;
}

function buildFlatJsonForLocale(strings: StringsFile, locale: string): Record<string, string> {
  const loc = normalizeLocale(locale);
  const flat: Record<string, string> = {};
  for (const [id, entry] of Object.entries(strings)) {
    const src = entry.source ?? "";
    if (!src.trim()) {
      continue;
    }
    if (isPluralStringsEntry(entry)) {
      const forms = entry.translated?.[loc];
      if (!forms || typeof forms !== "object") {
        continue;
      }
      const expanded = expandPluralFormsForFlatOutput(
        forms as Partial<Record<CldrPluralForm, string>>,
        loc
      );
      flat[`${id}_original`] = src;
      for (const form of requiredCldrPluralForms(loc)) {
        const text = expanded[form];
        if (text !== undefined && String(text).trim() !== "") {
          flat[`${id}_${form}`] = String(text);
        }
      }
    } else {
      const tx = entry.translated?.[loc];
      if (tx !== undefined && String(tx).trim() !== "") {
        flat[flatMessageKey(src, entry.context)] = tx;
      }
    }
  }
  return flat;
}

function buildPluralOnlyFlatForSourceLocale(
  strings: StringsFile,
  sourceLocale: string
): Record<string, string> {
  const loc = normalizeLocale(sourceLocale);
  const flat: Record<string, string> = {};
  for (const [id, entry] of Object.entries(strings)) {
    if (!isPluralStringsEntry(entry)) {
      continue;
    }
    const src = entry.source ?? "";
    if (!src.trim()) {
      continue;
    }
    const forms = entry.translated?.[loc];
    if (!forms || typeof forms !== "object") {
      continue;
    }
    const expanded = expandPluralFormsForFlatOutput(
      forms as Partial<Record<CldrPluralForm, string>>,
      loc
    );
    flat[`${id}_original`] = src;
    for (const form of requiredCldrPluralForms(loc)) {
      const text = expanded[form];
      if (text !== undefined && String(text).trim() !== "") {
        flat[`${id}_${form}`] = String(text);
      }
    }
  }
  return flat;
}

/**
 * Read `strings.json`, translate missing per-locale entries via OpenRouter (ordered models),
 * write merged `strings.json` and flat `{locale}.json` maps under `ui.flatOutputDir`.
 */
export async function runTranslateUI(
  config: I18nConfig,
  opts: TranslateUIOptions
): Promise<TranslateUISummary> {
  if (!config.features.translateUIStrings) {
    throw new Error(t("Enable features.translateUIStrings in config"));
  }

  const { opts: boundOpts, scope: interruptScope } = bindRunInterruptScope(opts);
  opts = boundOpts;

  try {
    const selected = selectUiBlocks(config, opts.uiBlock);
    if (selected.length === 0) {
      throw new Error(t("ui.sourceRoots must be non-empty to extract UI strings"));
    }
    const summaries: TranslateUISummary[] = [];
    for (const item of selected) {
      const locales = resolveLocalesForUiBlock(config, item.block, opts.cwd, opts.localeFilter);
      const requested = opts.localeFilter
        ? locales
        : opts.locales
            .map((locale) => normalizeLocale(locale))
            .filter((locale) => locales.includes(locale));
      if (requested.length === 0) {
        console.log(
          chalk.yellow(
            t("{{label}}: no target locales match this block; skipping.", {
              label: formatUiBlockLabel(item.index, item.block),
            })
          )
        );
        continue;
      }
      console.log(chalk.cyan(formatUiBlockLabel(item.index, item.block)));
      const view = toUiTranslateConfig(
        { ...config, targetLocales: effectiveUiTargetLocales(config, item.block) },
        item.block
      );
      summaries.push(
        await runTranslateUIBody(view, {
          ...opts,
          locales: requested,
          suppressRunSummary: selected.length > 1,
        })
      );
    }
    if (summaries.length === 0) {
      throw new Error(t("No target locales after excluding sourceLocale"));
    }
    if (summaries.length === 1) {
      return summaries[0]!;
    }
    return summaries.reduce(
      (sum, item) => ({
        stringsUpdated: sum.stringsUpdated + item.stringsUpdated,
        localesTouched: [...new Set([...sum.localesTouched, ...item.localesTouched])],
        inputTokens: sum.inputTokens + item.inputTokens,
        outputTokens: sum.outputTokens + item.outputTokens,
        costUsd: sum.costUsd + item.costUsd,
      }),
      {
        stringsUpdated: 0,
        localesTouched: [] as string[],
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      }
    );
  } finally {
    interruptScope.dispose();
  }
}

function printTranslateUiRunSummary(
  opts: Pick<TranslateUIOptions, "dryRun">,
  sum: TranslateTotals,
  wallElapsedMs: number,
  outcome: "success" | "interrupted" | "failure"
): void {
  printTranslationRunSummary(
    opts,
    sum,
    wallElapsedMs,
    outcome,
    {
      success: t("✅ UI translation complete!"),
      interrupted: t(
        "⚠️  UI translation interrupted — partial summary (tokens and cost reflect API work completed before the interrupt)."
      ),
      failure: t(
        "⚠️  UI translation failed — partial summary (tokens and cost reflect API work completed before the error)."
      ),
    },
    {
      labels: UI_STRING_SUMMARY_LABELS,
      allFromCacheCostNote: "   Total cost:            $0.0000 (all strings from cache)",
    }
  );
}

function writeResxCatalogs(
  config: I18nUiTranslateConfig,
  opts: TranslateUIOptions,
  strings: StringsFile,
  sourceLocale: string
): void {
  const resx = config.ui.resx;
  if (!resx) {
    return;
  }
  const dir = path.resolve(opts.cwd, resx.outputDir);
  fs.mkdirSync(dir, { recursive: true });
  if (resx.writeNeutral !== false) {
    const neutralPath = path.join(dir, `${resx.baseName}.resx`);
    writeAtomicUtf8(
      neutralPath,
      serializeResx(catalogEntriesToResx(strings, sourceLocale, { neutral: true }))
    );
    console.log(
      chalk.gray(
        t("   wrote Resx neutral catalog → {{path}}", {
          path: neutralPath,
        })
      )
    );
  }
  for (const locale of config.targetLocales) {
    const norm = normalizeLocale(locale);
    if (norm === normalizeLocale(sourceLocale)) {
      continue;
    }
    const culture = toGettextLocale(norm, resx.localeFormat);
    const satellitePath = path.join(dir, `${resx.baseName}.${culture}.resx`);
    writeAtomicUtf8(
      satellitePath,
      serializeResx(catalogEntriesToResx(strings, norm, { neutral: false }))
    );
    console.log(
      chalk.gray(
        t("   wrote Resx catalog {{locale}} → {{path}}", {
          locale: culture,
          path: satellitePath,
        })
      )
    );
  }
}

function writeGettextCatalogs(
  config: I18nUiTranslateConfig,
  opts: TranslateUIOptions,
  strings: StringsFile,
  sourceLocale: string
): void {
  const gettext = config.ui.gettext;
  if (!gettext) {
    return;
  }
  if (gettext.potPath) {
    const potAbs = path.resolve(opts.cwd, gettext.potPath);
    const previous = fs.existsSync(potAbs) ? fs.readFileSync(potAbs, "utf8") : null;
    const entries = poEntriesFromCatalog(strings, sourceLocale).map((entry) => ({
      ...entry,
      msgstr: entry.msgstr.map(() => ""),
    }));
    writeAtomicUtf8(
      potAbs,
      serializePo(
        buildPoCatalog({
          locale: sourceLocale,
          domain: gettext.domain,
          entries,
          previous,
        })
      )
    );
  }
  for (const locale of config.targetLocales) {
    const norm = normalizeLocale(locale);
    if (norm === normalizeLocale(sourceLocale)) {
      continue;
    }
    const dirLocale = toGettextLocale(norm, gettext.localeFormat);
    const poPath = path.resolve(
      opts.cwd,
      gettext.outputDir,
      dirLocale,
      "LC_MESSAGES",
      `${gettext.domain}.po`
    );
    const previous = fs.existsSync(poPath) ? fs.readFileSync(poPath, "utf8") : null;
    writeAtomicUtf8(
      poPath,
      serializePo(
        buildPoCatalog({
          locale: norm,
          domain: gettext.domain,
          entries: poEntriesFromCatalog(strings, norm),
          previous,
        })
      )
    );
    if (gettext.compileMo !== false) {
      writeAtomicBuffer(
        poPath.replace(/\.po$/, ".mo"),
        compileMo(moMessagesFromCatalog(strings, norm))
      );
    }
    console.log(
      chalk.gray(
        t("   wrote Gettext catalog {{locale}} → {{path}}", {
          locale: dirLocale,
          path: poPath,
        })
      )
    );
  }
}

async function runTranslateUIBody(
  config: I18nUiTranslateConfig,
  opts: TranslateUIOptions
): Promise<TranslateUISummary> {
  const stringsPath = resolveStringsJsonPath(config.ui, opts.cwd);
  const guidanceKey = uiBlockFileTrackingKey(
    path.relative(opts.cwd, stringsPath).split("\\").join("/") || config.ui.stringsJson
  );
  const stringsRel = stringsCatalogRelForLog(opts.cwd, stringsPath);
  if (!fs.existsSync(stringsPath)) {
    throw new Error(
      t("strings.json not found: {{path}} (run extract first)", { path: stringsPath })
    );
  }

  let strings: StringsFile;
  try {
    strings = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as StringsFile;
  } catch (e) {
    throw new Error(
      t("Invalid strings.json: {{error}}", { error: e instanceof Error ? e.message : String(e) })
    );
  }

  const placeholderStyle = config.ui.uiExtractor?.placeholderStyle ?? "default";
  let entries = Object.entries(strings);
  const writeFlat = config.ui.flatOutput !== false;
  const outDir = path.join(opts.cwd, config.ui.flatOutputDir);
  if (writeFlat && !opts.dryRun) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const srcNorm = normalizeLocale(config.sourceLocale);
  const targets = opts.locales.map((l) => normalizeLocale(l)).filter((l) => l !== srcNorm);

  if (targets.length === 0) {
    throw new Error(t("No target locales after excluding sourceLocale"));
  }

  const glossaryUser = config.glossary?.userGlossary
    ? path.join(opts.cwd, config.glossary.userGlossary)
    : undefined;

  if (config.glossary?.autoAddUserEditedToGlossary !== false && glossaryUser && !opts.dryRun) {
    const headers = [...GLOSSARY_USER_HEADERS];
    let csvRows: string[][] = [];

    if (fs.existsSync(glossaryUser)) {
      const raw = fs.readFileSync(glossaryUser, "utf8");
      const records = parseGlossaryCsv(glossaryUser, raw);
      csvRows = records.map((r) => [
        r["Original language string"] ?? r["en"] ?? "",
        r["locale"] ?? "",
        r["Translation"] ?? r["translation"] ?? "",
        r["Force"] ?? r["force"] ?? "",
        r["Context"] ?? r["context"] ?? r["Notes"] ?? r["notes"] ?? "",
      ]);
    }

    const existingPairs = new Set(csvRows.map((r) => `${r[0]}\0${r[1]}`));
    let addedToGlossary = 0;

    for (const [, entry] of entries) {
      if (isPluralStringsEntry(entry)) {
        continue;
      }
      if (!entry.source || !entry.models || !entry.translated) continue;
      for (const target of targets) {
        if (entry.models[target] === USER_EDITED_MODEL) {
          const translation = entry.translated[target];
          if (translation && typeof translation === "string" && translation.trim() !== "") {
            const pairKey = `${entry.source}\0${target}`;
            const starKey = `${entry.source}\0*`;
            if (!existingPairs.has(pairKey) && !existingPairs.has(starKey)) {
              csvRows.push([entry.source, target, translation, "", ""]);
              existingPairs.add(pairKey);
              addedToGlossary++;
            }
          }
        }
      }
    }

    if (addedToGlossary > 0) {
      const csvEscapeCell = (s: string): string => {
        if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const lines = [
        headers.map(csvEscapeCell).join(","),
        ...csvRows.map((r) => r.map(csvEscapeCell).join(",")),
      ];
      writeAtomicUtf8(glossaryUser, `${lines.join("\n")}\n`);
      const glossaryMsg =
        addedToGlossary === 1
          ? t("[user-glossary] Added {{count}} user-edited entry to {{path}}", {
              count: addedToGlossary,
              path: glossaryUser,
            })
          : t("[user-glossary] Added {{count}} user-edited entries to {{path}}", {
              count: addedToGlossary,
              path: glossaryUser,
            });
      console.log(chalk.green(glossaryMsg));
    }
  }

  const glossary = new Glossary(undefined, glossaryUser, targets, {
    labelCheckSkips: config.glossary?.labelCheckSkips,
  });
  const translationContext = loadTranslationContextFromConfig(config, opts.cwd);
  if (translationContext.truncated) {
    console.warn(
      chalk.yellow(
        t(
          "⚠️  Translation context truncated to {{max}} characters ({{files}} file(s)). Shorten glossary.contextFiles or raise glossary.contextMaxChars.",
          {
            max: config.glossary?.contextMaxChars ?? 12_000,
            files: translationContext.loadedPaths.length,
          }
        )
      )
    );
  }

  const allLocalesForModels = dedupeOrderedModelIds(
    [srcNorm],
    targets.map((loc) => normalizeLocale(loc))
  );
  const displayModels = dedupeOrderedModelIds(
    ...allLocalesForModels.map((loc) => resolveUITranslationModels(config, loc))
  );

  const parallelLimit = Math.max(1, Math.floor(opts.concurrency ?? config.concurrency ?? 4));
  const uiBatchLimit = Math.max(
    1,
    Math.floor(opts.uiBatchConcurrency ?? config.uiBatchConcurrency ?? 2)
  );

  // Header block
  console.log(
    chalk.gray(
      "\n\n___UI Translation________________________________________________________________________________________\n\n"
    ) +
      chalk.bold(
        `${t("🌐 Translating UI strings to {{count}} locale(s)", { count: targets.length })}\n`
      )
  );
  const provider = safeResolveActiveProvider(config);
  printTranslationModelSummary({
    resolvedModels: displayModels,
    provider,
    uiModels: provider !== undefined ? uiModelsForProvider(config, provider) : undefined,
    localeModels:
      provider !== undefined
        ? localeModelRowsForRun(
            localeModelsMapForProvider(config, provider),
            targets.map((loc) => normalizeLocale(loc))
          )
        : undefined,
  });
  console.log(
    chalk.cyan(`${t("Strings:")} `) +
      chalk.magenta(t("{{count}} total entries", { count: entries.length }))
  );
  console.log(chalk.cyan(`${t("Glossary terms:")} `) + chalk.magenta(`${glossary.size}`));
  console.log(chalk.cyan(`${t("Output directory:")} `) + chalk.magenta(outDir));
  if (opts.logPath) {
    console.log(chalk.cyan(`${t("Output log:")} `) + chalk.magenta(opts.logPath));
  }
  console.log(
    chalk.cyan(`${t("Parallel UI batches per locale:")} `) + chalk.magenta(`${uiBatchLimit}`)
  );
  if (targets.length > 1) {
    console.log(
      chalk.cyan(`${t("Parallel translations:")} `) +
        chalk.magenta(t("up to {{count}}", { count: Math.min(parallelLimit, targets.length) }))
    );
  }
  if (opts.dryRun) {
    console.log(chalk.yellow(`\n${t("⚠️  Dry run mode - no changes will be made")}`));
  }
  console.log("");

  let stringsUpdated = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;
  let stringsCached = 0;
  let stringsTranslated = 0;
  let localesProcessed = 0;
  let localesSkipped = 0;
  let segmentValidationFailures = 0;

  const wallStart = Date.now();

  const langProgress = { completed: 0, total: targets.length };

  const usageCache = opts.dryRun
    ? null
    : new TranslationCache(path.join(opts.cwd, config.cacheDir));

  try {
    // ── Step 0: fill source-locale cardinal forms for plural entries ─────────
    if (!opts.dryRun) {
      let step0Client: LlmClient;
      try {
        step0Client = await createFilteredLlmClient(config, srcNorm, {
          ui: true,
          ...llmClientDebugFailedOpts(opts, config.cacheDir),
          ...translationContextClientOpts(translationContext.text),
          debugFailedRelativePath: stringsRel,
          onApiCall: usageRecorderForCache(usageCache, "translate-ui", srcNorm),
          onValidationFailure: (count) => {
            segmentValidationFailures += count;
          },
        });
      } catch (e) {
        throw new Error(
          t("LLM provider API key required for UI translation: {{error}}", {
            error: e instanceof Error ? e.message : String(e),
          })
        );
      }
      console.log(
        chalk.cyan(
          `\n${t("📌 Step 0 — source-locale ({{locale}}) plural forms", { locale: srcNorm })}\n`
        )
      );
      let step0Count = 0;
      const step0Targets = Object.entries(strings).filter(
        (tuple): tuple is [string, StringsJsonPluralEntry] => {
          const [, entry] = tuple;
          return (
            isPluralStringsEntry(entry) &&
            (opts.forceSourcePlurals === true ||
              !pluralTranslatedLocaleHasContent(entry.translated?.[srcNorm], srcNorm))
          );
        }
      );
      const step0Total = step0Targets.length;
      let step0Error: Error | undefined;
      try {
        for (let si = 0; si < step0Targets.length; si++) {
          if (opts.abortSignal?.aborted) {
            throw interruptErrorFromSignal(opts.abortSignal);
          }
          const [h, entry] = step0Targets[si]!;
          if (
            entry.pluralSource &&
            entry.pluralSource.trim() !== "" &&
            /^en(?:-|$)/i.test(srcNorm) &&
            entry.zeroDigit !== true
          ) {
            const ent = strings[h];
            if (ent && isPluralStringsEntry(ent)) {
              ent.translated = ent.translated ?? {};
              ent.translated[srcNorm] = { one: entry.source, other: entry.pluralSource };
              ent.models = ent.models ?? {};
              ent.models[srcNorm] = "plural-source";
              stringsUpdated++;
              step0Count++;
              console.log(
                chalk.green(
                  t(
                    "✔️  {{locale}} {{path}}: plural Step 0 {{index}}/{{total}} ({{id}}) seeded from pluralSource",
                    {
                      locale: srcNorm,
                      path: stringsRel,
                      index: si + 1,
                      total: step0Total,
                      id: h,
                    }
                  )
                )
              );
            }
            continue;
          }
          const req = requiredCldrPluralForms(srcNorm);
          const g0 = protectGlossaryForcedTerms(entry.source, glossary, srcNorm);
          const hints = glossary.findTermsInText(g0.text, srcNorm);
          const msgs = buildPluralStep0Prompt({
            sourceLanguageLabel: localeLabelForPrompt(config, srcNorm),
            originalLiteral: entry.source,
            requiredForms: req,
            zeroDigit: entry.zeroDigit === true,
            placeholderStyle,
            glossaryHints: hints,
            intlPluralLocaleTag: srcNorm,
            sourceLocale: srcNorm,
            translationContext: translationContext.text || undefined,
          });
          const batch = await step0Client.translatePluralCardinalBatch(req, msgs, {
            originalLiteral: entry.source,
            zeroDigit: entry.zeroDigit === true,
            targetLocale: srcNorm,
            placeholderStyle,
            segmentsLabel: t("plural Step 0 {{index}}/{{total}} ({{id}})", {
              index: si + 1,
              total: step0Total,
              id: h,
            }),
            segmentKeys: [h],
          });
          const forms = compactIdenticalPluralForms(batch.forms, srcNorm) as Record<
            CldrPluralForm,
            string
          >;
          console.log(
            chalk.green(
              t(
                "✔️  {{locale}} {{path}}: plural Step 0 {{index}}/{{total}} ({{id}}) (1 plural group in batch, {{tokens}} tokens, model: {{model}})",
                {
                  locale: srcNorm,
                  path: stringsRel,
                  index: si + 1,
                  total: step0Total,
                  id: h,
                  tokens: batch.usage.totalTokens,
                  model: batch.model,
                }
              )
            )
          );
          if (!strings[h]) {
            continue;
          }
          const ent = strings[h];
          if (!isPluralStringsEntry(ent)) {
            continue;
          }
          ent.translated = ent.translated ?? {};
          ent.translated[srcNorm] = forms;
          ent.models = ent.models ?? {};
          ent.models[srcNorm] = batch.model;
          inputTokens += batch.usage.inputTokens;
          outputTokens += batch.usage.outputTokens;
          costUsd += batch.cost ?? 0;
          stringsUpdated++;
          stringsTranslated++;
          step0Count++;
        }
      } catch (e) {
        step0Error = e instanceof Error ? e : new Error(String(e));
      } finally {
        if (step0Count > 0) {
          console.log(chalk.blue(t("💾 Writing strings.json")));
          writeAtomicUtf8(stringsPath, `${JSON.stringify(strings, null, 2)}\n`);
          if (writeFlat) {
            const srcFlat = buildPluralOnlyFlatForSourceLocale(strings, srcNorm);
            if (Object.keys(srcFlat).length > 0) {
              writeAtomicUtf8(
                path.join(outDir, `${srcNorm}.json`),
                `${JSON.stringify(srcFlat, null, 2)}\n`
              );
            }
          }
          if (step0Error === undefined) {
            console.log(
              chalk.green(
                `   ${t("Step 0 completed: {{count}} plural group(s) updated.", { count: step0Count })}\n`
              )
            );
          }
        }
      }
      if (step0Error !== undefined) {
        throw step0Error;
      }
      entries = Object.entries(strings);
    }

    const translateOneTargetLocale = async (locale: string): Promise<void> => {
      const localeStart = Date.now();
      let localeClient: LlmClient | null = null;
      if (!opts.dryRun) {
        try {
          localeClient = await createFilteredLlmClient(config, locale, {
            ui: true,
            ...llmClientDebugFailedOpts(opts, config.cacheDir),
            ...translationContextClientOpts(translationContext.text),
            debugFailedRelativePath: stringsRel,
            onApiCall: usageRecorderForCache(usageCache, "translate-ui", locale),
            onValidationFailure: (count) => {
              segmentValidationFailures += count;
            },
          });
        } catch (e) {
          throw new Error(
            t("LLM provider API key required for UI translation: {{error}}", {
              error: e instanceof Error ? e.message : String(e),
            })
          );
        }
      }

      const promptContextHash = computeGuidanceFingerprint(
        glossary,
        locale,
        translationContext.fingerprint
      );
      const storedGuidance = usageCache?.getFileTrackingHashes(guidanceKey, locale);
      const guidanceChanged =
        storedGuidance !== null &&
        storedGuidance !== undefined &&
        storedGuidance.promptContextHash !== promptContextHash;

      const persistCompletedPhase = (updatedBefore: number): void => {
        if (opts.dryRun || stringsUpdated === updatedBefore) {
          return;
        }
        console.log(chalk.blue(t("💾 Writing strings.json")));
        writeAtomicUtf8(stringsPath, `${JSON.stringify(strings, null, 2)}\n`);
        if (writeFlat) {
          writeAtomicUtf8(
            path.join(outDir, `${locale}.json`),
            `${JSON.stringify(buildFlatJsonForLocale(strings, locale), null, 2)}\n`
          );
        }
      };

      // Pass A — plain (non-plural) rows
      const userEditedPlaceholderWarnings: Array<{ source: string; message: string }> = [];
      let placeholderHealCount = 0;
      const missingPlain = entries.filter(([_hash, entry]) => {
        if (isPluralStringsEntry(entry)) {
          return false;
        }
        const src = entry.source ?? "";
        if (!src.trim()) {
          return false;
        }
        const translatedValue = entry.translated?.[locale];
        const placeholderIssues =
          typeof translatedValue === "string" && translatedValue.trim() !== ""
            ? plainPlaceholderIssues(src, translatedValue, placeholderStyle)
            : [];
        if (opts.force) {
          return true;
        }
        if (entry.models?.[locale] === USER_EDITED_MODEL) {
          if (placeholderIssues.length > 0) {
            userEditedPlaceholderWarnings.push({
              source: src,
              message: placeholderIssues[0]!.message,
            });
          }
          return false;
        }
        if (translatedValue === undefined || String(translatedValue).trim() === "") {
          return true;
        }
        if (guidanceChanged) {
          return true;
        }
        if (translationScriptIssue(String(translatedValue), locale, src) !== null) {
          return true;
        }
        if (placeholderIssues.length > 0) {
          placeholderHealCount++;
          return true;
        }
        return false;
      });

      if (placeholderHealCount > 0) {
        console.log(
          chalk.yellow(
            t(
              "{{locale}}: {{count}} string(s) will be re-translated because a placeholder was renamed, dropped, invented, or its format spec changed.",
              { locale, count: placeholderHealCount }
            )
          )
        );
      }
      for (const warning of userEditedPlaceholderWarnings) {
        const preview =
          warning.source.length > 80 ? `${warning.source.slice(0, 77)}...` : warning.source;
        console.warn(
          chalk.yellow(
            t(
              "{{locale}}: user-edited string keeps a placeholder problem ({{issue}}): {{source}}",
              { locale, issue: warning.message, source: preview }
            )
          )
        );
      }

      const plainEligible = entries.filter(([, entry]) => {
        if (isPluralStringsEntry(entry)) {
          return false;
        }
        return Boolean((entry.source ?? "").trim());
      }).length;
      stringsCached += plainEligible - missingPlain.length;

      const plainUpdatedBefore = stringsUpdated;
      try {
        if (missingPlain.length > 0) {
          console.log(
            chalk.yellow(
              t("📄 {{timestamp}} - {{locale}} [plain]: {{count}} string(s) to translate", {
                timestamp: timestamp(),
                locale,
                count: missingPlain.length,
              })
            )
          );

          const plainChunks: Array<{ startIndex: number; chunk: typeof missingPlain }> = [];
          for (let i = 0; i < missingPlain.length; i += UI_CHUNK) {
            plainChunks.push({
              startIndex: i,
              chunk: missingPlain.slice(i, i + UI_CHUNK),
            });
          }
          const chunkTotal = plainChunks.length;
          const plainConc = opts.dryRun || !localeClient ? 1 : uiBatchLimit;
          await runMapWithConcurrency(
            plainChunks,
            plainConc,
            async ({ startIndex, chunk }) => {
              const sources = chunk.map(([, v]) => v.source ?? "");
              const chunkNum = Math.floor(startIndex / UI_CHUNK) + 1;
              const client = localeClient;

              if (opts.dryRun || !client) {
                if (opts.verbose) {
                  console.log(
                    chalk.yellow(
                      `  ${t(
                        "{{timestamp}} - [dry-run] plain chunk {{num}}/{{total}} ({{count}} strings)",
                        {
                          timestamp: timestamp(),
                          num: chunkNum,
                          total: chunkTotal,
                          count: chunk.length,
                        }
                      )}`
                    )
                  );
                }
                return;
              }

              const copyIndexes = new Set<number>();
              sources.forEach((src, index) => {
                if (isPlaceholderOnlyUiString(src, placeholderStyle)) {
                  copyIndexes.add(index);
                }
              });
              const writeCopied = (index: number): void => {
                const [hash] = chunk[index]!;
                const ent = strings[hash];
                if (!ent || isPluralStringsEntry(ent)) {
                  return;
                }
                ent.translated = ent.translated ?? {};
                ent.translated[locale] = sources[index] ?? "";
                ent.models = ent.models ?? {};
                ent.models[locale] = PLACEHOLDER_COPY_MODEL;
                stringsUpdated++;
                stringsTranslated++;
              };
              if (copyIndexes.size > 0) {
                console.log(
                  chalk.gray(
                    t(
                      "{{locale}} {{path}}: copied {{count}} placeholder-only string(s) without calling a model.",
                      { locale, path: stringsRel, count: copyIndexes.size }
                    )
                  )
                );
              }
              for (const index of copyIndexes) {
                writeCopied(index);
              }

              const translateIndexes = sources
                .map((_, index) => index)
                .filter((index) => !copyIndexes.has(index));
              if (translateIndexes.length === 0) {
                return;
              }

              const protectedSources: string[] = [];
              const glossaryReplacementsPerString: string[][] = [];
              for (const index of translateIndexes) {
                const g = protectGlossaryForcedTerms(sources[index] ?? "", glossary, locale);
                protectedSources.push(g.text);
                glossaryReplacementsPerString.push(g.replacements);
              }
              const hints = glossary.findTermsInText(protectedSources.join("\n"), locale);
              const rangeLabel = plainMissingBatchRangeLabel(
                startIndex,
                chunk.length,
                missingPlain.length
              );
              const uiBatch = await client.translateUIBatch(protectedSources, locale, {
                glossaryHints: hints,
                placeholderStyle,
                segmentsLabel: rangeLabel,
                segmentKeys: translateIndexes.map((index) => chunk[index]![0]),
              });
              inputTokens += uiBatch.usage.inputTokens;
              outputTokens += uiBatch.usage.outputTokens;
              costUsd += uiBatch.cost ?? 0;
              const n = translateIndexes.length;
              const batchMsg =
                n === 1
                  ? t(
                      "✔️  {{locale}} {{path}}: {{range}} ({{count}} string in batch, {{tokens}} tokens, model: {{model}})",
                      {
                        locale,
                        path: stringsRel,
                        range: rangeLabel,
                        count: n,
                        tokens: uiBatch.usage.totalTokens,
                        model: uiBatch.model,
                      }
                    )
                  : t(
                      "✔️  {{locale}} {{path}}: {{range}} ({{count}} strings in batch, {{tokens}} tokens, model: {{model}})",
                      {
                        locale,
                        path: stringsRel,
                        range: rangeLabel,
                        count: n,
                        tokens: uiBatch.usage.totalTokens,
                        model: uiBatch.model,
                      }
                    );
              console.log(chalk.green(batchMsg));

              translateIndexes.forEach((chunkIndex, batchIndex) => {
                const [hash] = chunk[chunkIndex]!;
                let tr = uiBatch.translations[batchIndex];
                if (tr !== undefined) {
                  tr = restoreGlossaryForcedTerms(
                    tr,
                    glossaryReplacementsPerString[batchIndex] ?? []
                  );
                }
                if (tr !== undefined && strings[hash]) {
                  const ent = strings[hash];
                  if (isPluralStringsEntry(ent)) {
                    return;
                  }
                  ent.translated = ent.translated ?? {};
                  ent.translated[locale] = tr;
                  ent.models = ent.models ?? {};
                  ent.models[locale] = uiBatch.model;
                  stringsUpdated++;
                  stringsTranslated++;
                }
              });
            },
            opts.abortSignal
          );
        } else {
          console.log(
            chalk.gray(
              t("⏭️  {{timestamp}} - {{locale}} [plain]: up to date", {
                timestamp: timestamp(),
                locale,
              })
            )
          );
        }
      } finally {
        persistCompletedPhase(plainUpdatedBefore);
      }

      // Pass B — plural rows for this locale
      let pluralPlaceholderHealCount = 0;
      const pluralTargets = entries.filter(([, entry]) => {
        if (!isPluralStringsEntry(entry)) {
          return false;
        }
        const forms = entry.translated?.[locale];
        const sourcePluralForms = pluralTranslatedLocaleHasContent(
          entry.translated?.[srcNorm],
          srcNorm
        )
          ? entry.translated?.[srcNorm]
          : pluralReferenceFormsFromRow(entry.source, entry.pluralSource);
        const pluralIssues = translationValuePlaceholderMessages(
          entry.source,
          forms,
          placeholderStyle,
          entry.zeroDigit === true,
          sourcePluralForms
        );
        if (opts.force) {
          return true;
        }
        if (entry.models?.[locale] === USER_EDITED_MODEL) {
          if (pluralIssues.length > 0) {
            const preview =
              entry.source.length > 80 ? `${entry.source.slice(0, 77)}...` : entry.source;
            console.warn(
              chalk.yellow(
                t(
                  "{{locale}}: user-edited string keeps a placeholder problem ({{issue}}): {{source}}",
                  { locale, issue: pluralIssues[0]!, source: preview }
                )
              )
            );
          }
          return false;
        }
        if (guidanceChanged) {
          return true;
        }
        if (!pluralTranslatedLocaleHasContent(forms, locale)) {
          return true;
        }
        if (!forms || typeof forms !== "object") {
          return true;
        }
        if (
          Object.values(forms).some(
            (v) => typeof v === "string" && translationScriptIssue(v, locale, entry.source) !== null
          )
        ) {
          return true;
        }
        if (pluralIssues.length > 0) {
          pluralPlaceholderHealCount++;
          return true;
        }
        return false;
      });

      if (pluralPlaceholderHealCount > 0) {
        console.log(
          chalk.yellow(
            t(
              "{{locale}}: {{count}} plural group(s) will be re-translated because a placeholder was renamed, dropped, invented, or its format spec changed.",
              { locale, count: pluralPlaceholderHealCount }
            )
          )
        );
      }

      const pluralEligible = entries.filter(([, entry]) => isPluralStringsEntry(entry)).length;
      stringsCached += pluralEligible - pluralTargets.length;

      if (pluralTargets.length > 0) {
        console.log(
          chalk.yellow(
            t("📄 {{timestamp}} - {{locale}} [plural]: {{count}} group(s) to translate", {
              timestamp: timestamp(),
              locale,
              count: pluralTargets.length,
            })
          )
        );
      }

      const pluralUpdatedBefore = stringsUpdated;
      try {
        if (!opts.dryRun && localeClient) {
          const client = localeClient;
          await runMapWithConcurrency(
            pluralTargets,
            uiBatchLimit,
            async ([h, entry], pi) => {
              if (!isPluralStringsEntry(entry)) {
                return;
              }
              const srcForms = entry.translated?.[srcNorm];
              if (!pluralTranslatedLocaleHasContent(srcForms, srcNorm)) {
                console.warn(
                  chalk.yellow(
                    `   ${t(
                      "⚠️  Skip plural {{id}}: missing non-empty plural forms for source locale {{locale}} (fill Step 0 or entries in strings.json, then run translate-ui again).",
                      { id: h, locale: srcNorm }
                    )}`
                  )
                );
                return;
              }
              const reqTarget = requiredCldrPluralForms(locale);
              const srcReq = requiredCldrPluralForms(srcNorm);
              const protectedParts: {
                key: CldrPluralForm;
                text: string;
                replacements: string[];
              }[] = [];
              for (const form of srcReq) {
                const raw = srcForms?.[form] ?? "";
                const g = protectGlossaryForcedTerms(raw, glossary, locale);
                protectedParts.push({ key: form, text: g.text, replacements: g.replacements });
              }
              const hints = glossary.findTermsInText(
                protectedParts.map((p) => p.text).join("\n"),
                locale
              );
              const sourceFormsProtected: Partial<Record<CldrPluralForm, string>> = {};
              for (const p of protectedParts) {
                sourceFormsProtected[p.key] = p.text;
              }
              const msgs = buildPluralPassBPrompt({
                sourceLanguageLabel: localeLabelForPrompt(config, srcNorm),
                targetLanguageLabel: localeLabelForPrompt(config, locale),
                sourceForms: sourceFormsProtected,
                requiredTargetForms: reqTarget,
                originalLiteral: entry.source,
                placeholderStyle,
                glossaryHints: hints,
                intlPluralLocaleTag: locale,
                targetLocale: locale,
                translationContext: translationContext.text || undefined,
              });
              const batch = await client.translatePluralCardinalBatch(reqTarget, msgs, {
                targetLocale: locale,
                originalLiteral: entry.source,
                sourceForms: sourceFormsProtected,
                zeroDigit: entry.zeroDigit === true,
                placeholderStyle,
                segmentsLabel: t("plural {{index}}/{{total}} ({{id}})", {
                  index: pi + 1,
                  total: pluralTargets.length,
                  id: h,
                }),
                segmentKeys: [h],
              });
              console.log(
                chalk.green(
                  t(
                    "✔️  {{locale}} {{path}}: plural {{index}}/{{total}} ({{id}}) (1 plural group in batch, {{tokens}} tokens, model: {{model}})",
                    {
                      locale,
                      path: stringsRel,
                      index: pi + 1,
                      total: pluralTargets.length,
                      id: h,
                      tokens: batch.usage.totalTokens,
                      model: batch.model,
                    }
                  )
                )
              );
              const allReplacements = protectedParts.flatMap((p) => p.replacements);
              let formsOut = batch.forms;
              for (const k of reqTarget) {
                if (formsOut[k] !== undefined) {
                  formsOut[k] = restoreGlossaryForcedTerms(formsOut[k] ?? "", allReplacements);
                }
              }
              formsOut = compactIdenticalPluralForms(formsOut, locale) as Record<
                CldrPluralForm,
                string
              >;
              const ent = strings[h];
              if (!ent || !isPluralStringsEntry(ent)) {
                return;
              }
              ent.translated = ent.translated ?? {};
              ent.translated[locale] = formsOut;
              ent.models = ent.models ?? {};
              ent.models[locale] = batch.model;
              inputTokens += batch.usage.inputTokens;
              outputTokens += batch.usage.outputTokens;
              costUsd += batch.cost ?? 0;
              stringsUpdated++;
              stringsTranslated++;
            },
            opts.abortSignal
          );
        }
      } finally {
        persistCompletedPhase(pluralUpdatedBefore);
      }

      if (missingPlain.length === 0 && pluralTargets.length === 0) {
        localesSkipped++;
      } else {
        localesProcessed++;
      }

      const flat = buildFlatJsonForLocale(strings, locale);
      const localePath = path.join(outDir, `${locale}.json`);
      if (!opts.dryRun && writeFlat) {
        writeAtomicUtf8(localePath, `${JSON.stringify(flat, null, 2)}\n`);
        usageCache?.setFileStatus(guidanceKey, locale, "", promptContextHash);
        if (opts.verbose) {
          console.log(
            chalk.gray(
              `   ${t("{{timestamp}} - wrote {{count}} keys → {{path}}", {
                timestamp: timestamp(),
                count: Object.keys(flat).length,
                path: localePath,
              })}`
            )
          );
        }
      }

      const localeElapsed = Date.now() - localeStart;
      if (localeElapsed > 0) {
        console.log(
          chalk.gray(
            `   ${t("[{{locale}}] Time: {{time}}", {
              locale,
              time: formatElapsedMmSs(localeElapsed),
            })}`
          )
        );
      }
      langProgress.completed += 1;
    };

    if (targets.length <= 1) {
      if (opts.abortSignal?.aborted) {
        throw interruptErrorFromSignal(opts.abortSignal);
      }
      await translateOneTargetLocale(targets[0]!);
      if (!opts.dryRun) {
        console.log(chalk.blue(t("💾 Writing strings.json")));
        writeAtomicUtf8(stringsPath, `${JSON.stringify(strings, null, 2)}\n`);
      }
    } else {
      for (let i = 0; i < targets.length; i += parallelLimit) {
        const batch = targets.slice(i, i + parallelLimit);
        const langList = batch
          .map((loc) => `${localeLabelForPrompt(config, loc)} (${loc})`)
          .join(" • ");
        console.log(chalk.yellow(RULE));
        console.log(
          chalk.yellow(
            ` ${t("🚀 Running in parallel: {{completed}}/{{total}} - {{langList}}   ", {
              langList,
              completed: langProgress.completed,
              total: langProgress.total,
            })}`
          )
        );
        console.log(chalk.yellow(RULE));
        const waveErrors: Error[] = [];
        await runMapWithConcurrency(
          batch,
          batch.length,
          async (locale) => {
            try {
              await translateOneTargetLocale(locale);
            } catch (e) {
              if (isRunInterruptedError(e) || opts.abortSignal?.aborted) {
                throw e;
              }
              waveErrors.push(e instanceof Error ? e : new Error(String(e)));
            }
            return locale;
          },
          opts.abortSignal
        );
        if (!opts.dryRun) {
          console.log(chalk.blue(t("💾 Writing strings.json")));
          writeAtomicUtf8(stringsPath, `${JSON.stringify(strings, null, 2)}\n`);
        }
        const waveError = waveErrors[0];
        if (waveError !== undefined) {
          throw waveError;
        }
      }
    }

    // Source locale bundle: plural keys only (for i18next suffix resolution)
    if (!opts.dryRun && config.ui.gettext) {
      writeGettextCatalogs(config, opts, strings, srcNorm);
    }
    if (!opts.dryRun && config.ui.resx) {
      writeResxCatalogs(config, opts, strings, srcNorm);
    }

    const srcFlat = buildPluralOnlyFlatForSourceLocale(strings, srcNorm);
    if (!opts.dryRun && writeFlat && Object.keys(srcFlat).length > 0) {
      const srcPath = path.join(outDir, `${srcNorm}.json`);
      writeAtomicUtf8(srcPath, `${JSON.stringify(srcFlat, null, 2)}\n`);
      if (opts.verbose) {
        console.log(
          chalk.gray(
            `   ${t("{{timestamp}} - wrote {{count}} plural keys → {{path}} ({{locale}})", {
              timestamp: timestamp(),
              count: Object.keys(srcFlat).length,
              path: srcPath,
              locale: srcNorm,
            })}`
          )
        );
      }
    }

    const wallElapsed = Date.now() - wallStart;
    let filesWritten = 0;
    if (!opts.dryRun) {
      filesWritten = writeFlat ? targets.length : 0;
      if (stringsUpdated > 0) {
        filesWritten++;
      }
      if (
        writeFlat &&
        Object.keys(buildPluralOnlyFlatForSourceLocale(strings, srcNorm)).length > 0
      ) {
        filesWritten++;
      }
    }
    const sum: TranslateTotals = {
      filesWritten,
      filesSkipped: localesSkipped,
      filesProcessed: localesProcessed,
      inputTokens,
      outputTokens,
      costUsd,
      segmentsCached: stringsCached,
      segmentsTranslated: stringsTranslated,
      segmentValidationFailures,
    };

    if (!opts.suppressRunSummary) {
      printTranslateUiRunSummary(opts, sum, wallElapsed, "success");
    }

    return {
      stringsUpdated,
      localesTouched: targets,
      inputTokens,
      outputTokens,
      costUsd,
    };
  } catch (e) {
    if (isRunInterruptedError(e) || opts.abortSignal?.aborted) {
      let filesWritten = 0;
      if (!opts.dryRun) {
        filesWritten = targets.length;
        if (stringsUpdated > 0) {
          filesWritten++;
        }
      }
      const sum: TranslateTotals = {
        filesWritten,
        filesSkipped: localesSkipped,
        filesProcessed: localesProcessed,
        inputTokens,
        outputTokens,
        costUsd,
        segmentsCached: stringsCached,
        segmentsTranslated: stringsTranslated,
        segmentValidationFailures,
      };
      if (!opts.suppressRunSummary) {
        printTranslateUiRunSummary(opts, sum, Date.now() - wallStart, "interrupted");
      }
      throw isRunInterruptedError(e) ? e : interruptErrorFromSignal(opts.abortSignal!);
    }
    let filesWritten = 0;
    if (!opts.dryRun) {
      filesWritten = targets.length;
      if (stringsUpdated > 0) {
        filesWritten++;
      }
    }
    const failureSum: TranslateTotals = {
      filesWritten,
      filesSkipped: localesSkipped,
      filesProcessed: localesProcessed,
      inputTokens,
      outputTokens,
      costUsd,
      segmentsCached: stringsCached,
      segmentsTranslated: stringsTranslated,
      segmentValidationFailures,
    };
    const started =
      segmentValidationFailures > 0 ||
      stringsTranslated > 0 ||
      stringsUpdated > 0 ||
      inputTokens + outputTokens > 0 ||
      localesProcessed > 0;
    if (!opts.suppressRunSummary && started) {
      printTranslateUiRunSummary(opts, failureSum, Date.now() - wallStart, "failure");
    }
    throw e;
  } finally {
    usageCache?.close();
  }
}
