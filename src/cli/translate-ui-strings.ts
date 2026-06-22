import fs from "fs";
import path from "path";
import chalk from "chalk";
import type {
  CldrPluralForm,
  I18nConfig,
  StringsJsonEntry,
  StringsJsonPluralEntry,
} from "../core/types.js";
import { isPluralStringsEntry } from "../core/types.js";
import { LlmClient } from "../api/llm-client.js";
import {
  englishLanguageNameForLocale,
  normalizeLocale,
  resolveUITranslationModels,
} from "../core/config.js";
import {
  filterTranslationModelsAgainstOpenRouterCatalog,
  MODELS_ALL_UNKNOWN_AFTER_FILTER,
  warnIgnoredUnknownOpenRouterModels,
} from "./openrouter-catalog-model-filter.js";
import { buildPluralPassBPrompt, buildPluralStep0Prompt } from "../core/prompt-builder.js";
import {
  compactIdenticalPluralForms,
  expandPluralFormsForFlatOutput,
  pluralTranslatedLocaleHasContent,
  requiredCldrPluralForms,
} from "../core/plural-forms.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";
import { timestamp, formatElapsedMmSs, printModelsTryInOrder } from "./format.js";
import { runMapWithConcurrency } from "../utils/concurrency.js";
import {
  bindRunInterruptScope,
  isRunInterruptedError,
  interruptErrorFromSignal,
} from "../utils/run-interrupt.js";
import { Glossary } from "../glossary/glossary.js";
import { parseGlossaryCsv } from "../glossary/parse-glossary-csv.js";
import {
  protectGlossaryForcedTerms,
  restoreGlossaryForcedTerms,
} from "../processors/glossary-force-placeholders.js";
import { USER_EDITED_MODEL } from "../core/user-edited-model.js";
import { safeResolveActiveProvider } from "../core/llm-providers.js";
import { t } from "../i18n/index.js";
const UI_CHUNK = 50;

const RULE = "-".repeat(100);

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
  force: boolean;
  dryRun: boolean;
  verbose: boolean;
  /** Path to the active log file (printed in the header block). */
  logPath?: string;
  /**
   * Max parallel target locales (CLI `-j`). Effective default when omitted: `config.concurrency ?? 4`.
   */
  concurrency?: number;
  /** When aborted (Ctrl+C), cooperative workers stop claiming new work. */
  abortSignal?: AbortSignal;
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
function localeLabelForPrompt(config: I18nConfig, localeCode: string): string {
  const n = normalizeLocale(localeCode);
  const configured = config.localeDisplayNames?.[n];
  const display =
    configured && configured.trim().length > 0
      ? configured.trim()
      : englishLanguageNameForLocale(n);
  if (display && display.length > 0) {
    return `${n}: ${display}`;
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
        flat[src] = tx;
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
    return await runTranslateUIBody(config, opts);
  } finally {
    interruptScope.dispose();
  }
}

function printTranslateUiSummary(
  wallElapsedMs: number,
  stringsUpdated: number,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
  outcome: "success" | "interrupted"
): void {
  if (outcome === "success") {
    console.log(chalk.bold.green(`\n${t("✅ UI translation complete!")}\n`));
  } else {
    console.log(
      chalk.bold.yellow(
        `\n${t(
          "⚠️  UI translation interrupted — partial summary (tokens and cost reflect API work completed before interrupt)."
        )}\n`
      )
    );
  }
  console.log(chalk.bold(t("📊 Summary:")));
  console.log(
    `   ${t("Total elapsed time:    {{time}}", { time: formatElapsedMmSs(wallElapsedMs) })}`
  );
  console.log(`   ${t("Strings updated:       {{count}}", { count: stringsUpdated })}`);
  console.log(
    `   ${t("Tokens used:           {{total}} (in: {{tokensIn}} / out: {{tokensOut}})", {
      total: (inputTokens + outputTokens).toLocaleString(),
      tokensIn: inputTokens.toLocaleString(),
      tokensOut: outputTokens.toLocaleString(),
    })}`
  );
  if (costUsd > 0) {
    console.log(
      chalk.green(`   ${t("💵 Total cost:          ${{cost}}", { cost: costUsd.toFixed(6) })}`)
    );
  } else {
    console.log(`   ${t("Total cost:            $0.00 (all up to date or dry-run)")}`);
  }
  console.log("");
}

async function runTranslateUIBody(
  config: I18nConfig,
  opts: TranslateUIOptions
): Promise<TranslateUISummary> {
  const stringsPath = resolveStringsJsonPath(config, opts.cwd);
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

  let entries = Object.entries(strings);
  const outDir = path.join(opts.cwd, config.ui.flatOutputDir);
  fs.mkdirSync(outDir, { recursive: true });

  const srcNorm = normalizeLocale(config.sourceLocale);
  const targets = opts.locales.map((l) => normalizeLocale(l)).filter((l) => l !== srcNorm);

  if (targets.length === 0) {
    throw new Error(t("No target locales after excluding sourceLocale"));
  }

  const glossaryUser = config.glossary?.userGlossary
    ? path.join(opts.cwd, config.glossary.userGlossary)
    : undefined;

  if (config.glossary?.autoAddUserEditedToGlossary !== false && glossaryUser && !opts.dryRun) {
    const headers = ["Original language string", "locale", "Translation", "Force"];
    let csvRows: string[][] = [];

    if (fs.existsSync(glossaryUser)) {
      const raw = fs.readFileSync(glossaryUser, "utf8");
      const records = parseGlossaryCsv(glossaryUser, raw);
      csvRows = records.map((r) => [
        r["Original language string"] ?? r["en"] ?? "",
        r["locale"] ?? "",
        r["Translation"] ?? r["translation"] ?? "",
        r["Force"] ?? r["force"] ?? "",
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
              csvRows.push([entry.source, target, translation, ""]);
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

  const glossary = new Glossary(undefined, glossaryUser, targets);

  let client: LlmClient | null = null;
  if (!opts.dryRun) {
    const resolvedUi = resolveUITranslationModels(config);
    let translationModelsForClient: string[] | undefined = undefined;
    if (resolvedUi.length > 0) {
      const filtered = await filterTranslationModelsAgainstOpenRouterCatalog(resolvedUi, config);
      warnIgnoredUnknownOpenRouterModels(filtered.unknownIds);
      if (filtered.models.length === 0) {
        throw new Error(MODELS_ALL_UNKNOWN_AFTER_FILTER);
      }
      translationModelsForClient = filtered.models;
    }
    try {
      client = new LlmClient({
        config,
        ...(translationModelsForClient ? { translationModels: translationModelsForClient } : {}),
      });
    } catch (e) {
      throw new Error(
        t("LLM provider API key required for UI translation: {{error}}", {
          error: e instanceof Error ? e.message : String(e),
        })
      );
    }
  }

  const models = client?.getConfiguredModels() ?? [];

  const parallelLimit = Math.max(1, Math.floor(opts.concurrency ?? config.concurrency ?? 4));

  // Header block
  console.log(
    chalk.gray(
      "\n\n___UI Translation________________________________________________________________________________________\n\n"
    ) +
      chalk.bold(
        `${t("🌐 Translating UI strings to {{count}} locale(s)", { count: targets.length })}\n`
      )
  );
  printModelsTryInOrder(models, client?.getProvider() ?? safeResolveActiveProvider(config));
  console.log(
    chalk.cyan(`${t("Strings:")} `) +
      chalk.magenta(t("{{count}} total entries", { count: entries.length }))
  );
  console.log(chalk.cyan(`${t("Glossary terms:")} `) + chalk.magenta(`${glossary.size}`));
  console.log(chalk.cyan(`${t("Output dir:")} `) + chalk.magenta(outDir));
  if (opts.logPath) {
    console.log(chalk.cyan(`${t("Output log:")} `) + chalk.magenta(opts.logPath));
  }
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

  const wallStart = Date.now();

  const langProgress = { completed: 0, total: targets.length };

  try {
    // ── Step 0: fill source-locale cardinal forms for plural entries ─────────
    if (!opts.dryRun && client) {
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
            (opts.force || !pluralTranslatedLocaleHasContent(entry.translated?.[srcNorm], srcNorm))
          );
        }
      );
      const step0Total = step0Targets.length;
      for (let si = 0; si < step0Targets.length; si++) {
        if (opts.abortSignal?.aborted) {
          throw interruptErrorFromSignal(opts.abortSignal);
        }
        const [h, entry] = step0Targets[si]!;
        const req = requiredCldrPluralForms(srcNorm);
        const g0 = protectGlossaryForcedTerms(entry.source, glossary, srcNorm);
        const hints = glossary.findTermsInText(g0.text, srcNorm);
        const msgs = buildPluralStep0Prompt({
          sourceLanguageLabel: localeLabelForPrompt(config, srcNorm),
          originalLiteral: entry.source,
          requiredForms: req,
          zeroDigit: entry.zeroDigit === true,
          glossaryHints: hints,
          intlPluralLocaleTag: srcNorm,
        });
        const batch = await client.translatePluralCardinalBatch(req, msgs);
        const forms = compactIdenticalPluralForms(batch.forms, srcNorm) as Record<
          CldrPluralForm,
          string
        >;
        console.log(
          chalk.green(
            t(
              "✔️  {{locale}} {{path}}: plural Step 0 {{index}}/{{total}} ({{id}}) (1 plural group in batch, {{tokens}} tokens)",
              {
                locale: srcNorm,
                path: stringsRel,
                index: si + 1,
                total: step0Total,
                id: h,
                tokens: batch.usage.totalTokens,
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
        step0Count++;
      }
      if (step0Count > 0) {
        writeAtomicUtf8(stringsPath, `${JSON.stringify(strings, null, 2)}\n`);
        console.log(
          chalk.green(
            `   ${t("Step 0 completed: {{count}} plural group(s) updated.", { count: step0Count })}\n`
          )
        );
      }
      entries = Object.entries(strings);
    }

    const translateOneTargetLocale = async (locale: string): Promise<void> => {
      const localeStart = Date.now();

      // Pass A — plain (non-plural) rows
      const missingPlain = entries.filter(([_hash, entry]) => {
        if (isPluralStringsEntry(entry)) {
          return false;
        }
        const src = entry.source ?? "";
        if (!src.trim()) {
          return false;
        }
        if (opts.force) {
          return true;
        }
        const t = entry.translated?.[locale];
        return t === undefined || String(t).trim() === "";
      });

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

        for (let i = 0; i < missingPlain.length; i += UI_CHUNK) {
          const chunk = missingPlain.slice(i, i + UI_CHUNK);
          const sources = chunk.map(([, v]) => v.source ?? "");
          const chunkNum = Math.floor(i / UI_CHUNK) + 1;
          const chunkTotal = Math.ceil(missingPlain.length / UI_CHUNK);

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
            continue;
          }

          const protectedSources: string[] = [];
          const glossaryReplacementsPerString: string[][] = [];
          for (const src of sources) {
            const g = protectGlossaryForcedTerms(src, glossary, locale);
            protectedSources.push(g.text);
            glossaryReplacementsPerString.push(g.replacements);
          }
          const hints = glossary.findTermsInText(protectedSources.join("\n"), locale);
          const uiBatch = await client.translateUIBatch(protectedSources, locale, {
            glossaryHints: hints,
          });
          inputTokens += uiBatch.usage.inputTokens;
          outputTokens += uiBatch.usage.outputTokens;
          costUsd += uiBatch.cost ?? 0;

          const rangeLabel = plainMissingBatchRangeLabel(i, chunk.length, missingPlain.length);
          const n = chunk.length;
          const batchMsg =
            n === 1
              ? t(
                  "✔️  {{locale}} {{path}}: {{range}} ({{count}} string in batch, {{tokens}} tokens)",
                  {
                    locale,
                    path: stringsRel,
                    range: rangeLabel,
                    count: n,
                    tokens: uiBatch.usage.totalTokens,
                  }
                )
              : t(
                  "✔️  {{locale}} {{path}}: {{range}} ({{count}} strings in batch, {{tokens}} tokens)",
                  {
                    locale,
                    path: stringsRel,
                    range: rangeLabel,
                    count: n,
                    tokens: uiBatch.usage.totalTokens,
                  }
                );
          console.log(chalk.green(batchMsg));

          chunk.forEach(([h], idx) => {
            let tr = uiBatch.translations[idx];
            if (tr !== undefined) {
              tr = restoreGlossaryForcedTerms(tr, glossaryReplacementsPerString[idx] ?? []);
            }
            if (tr !== undefined && strings[h]) {
              const ent = strings[h];
              if (isPluralStringsEntry(ent)) {
                return;
              }
              ent.translated = ent.translated ?? {};
              ent.translated[locale] = tr;
              ent.models = ent.models ?? {};
              ent.models[locale] = uiBatch.model;
              stringsUpdated++;
            }
          });
        }
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

      // Pass B — plural rows for this locale
      const pluralTargets = entries.filter(([, entry]) => {
        if (!isPluralStringsEntry(entry)) {
          return false;
        }
        if (!opts.force && pluralTranslatedLocaleHasContent(entry.translated?.[locale], locale)) {
          return false;
        }
        return true;
      });

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

      if (!opts.dryRun && client) {
        for (let pi = 0; pi < pluralTargets.length; pi++) {
          const [h, entry] = pluralTargets[pi]!;
          if (!isPluralStringsEntry(entry)) {
            continue;
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
            continue;
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
            glossaryHints: hints,
            intlPluralLocaleTag: locale,
            targetLocale: locale,
          });
          const batch = await client.translatePluralCardinalBatch(reqTarget, msgs, {
            targetLocale: locale,
          });
          console.log(
            chalk.green(
              t(
                "✔️  {{locale}} {{path}}: plural {{index}}/{{total}} ({{id}}) (1 plural group in batch, {{tokens}} tokens)",
                {
                  locale,
                  path: stringsRel,
                  index: pi + 1,
                  total: pluralTargets.length,
                  id: h,
                  tokens: batch.usage.totalTokens,
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
            continue;
          }
          ent.translated = ent.translated ?? {};
          ent.translated[locale] = formsOut;
          ent.models = ent.models ?? {};
          ent.models[locale] = batch.model;
          inputTokens += batch.usage.inputTokens;
          outputTokens += batch.usage.outputTokens;
          costUsd += batch.cost ?? 0;
          stringsUpdated++;
        }
      }

      const flat = buildFlatJsonForLocale(strings, locale);
      const localePath = path.join(outDir, `${locale}.json`);
      if (!opts.dryRun) {
        writeAtomicUtf8(localePath, `${JSON.stringify(flat, null, 2)}\n`);
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
            ` ${t("🚀 Running in parallel:    {{langList}}   {{completed}}/{{total}}", {
              langList,
              completed: langProgress.completed,
              total: langProgress.total,
            })}`
          )
        );
        console.log(chalk.yellow(RULE));
        await runMapWithConcurrency(
          batch,
          batch.length,
          async (locale) => {
            await translateOneTargetLocale(locale);
            return locale;
          },
          opts.abortSignal
        );
        if (!opts.dryRun) {
          console.log(chalk.blue(t("💾 Writing strings.json")));
          writeAtomicUtf8(stringsPath, `${JSON.stringify(strings, null, 2)}\n`);
        }
      }
    }

    // Source locale bundle: plural keys only (for i18next suffix resolution)
    const srcFlat = buildPluralOnlyFlatForSourceLocale(strings, srcNorm);
    if (!opts.dryRun && Object.keys(srcFlat).length > 0) {
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

    printTranslateUiSummary(
      wallElapsed,
      stringsUpdated,
      inputTokens,
      outputTokens,
      costUsd,
      "success"
    );

    return {
      stringsUpdated,
      localesTouched: targets,
      inputTokens,
      outputTokens,
      costUsd,
    };
  } catch (e) {
    if (isRunInterruptedError(e) || opts.abortSignal?.aborted) {
      printTranslateUiSummary(
        Date.now() - wallStart,
        stringsUpdated,
        inputTokens,
        outputTokens,
        costUsd,
        "interrupted"
      );
      throw isRunInterruptedError(e) ? e : interruptErrorFromSignal(opts.abortSignal!);
    }
    throw e;
  }
}
