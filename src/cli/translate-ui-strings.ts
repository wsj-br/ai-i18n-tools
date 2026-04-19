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
import { OpenRouterClient } from "../api/openrouter.js";
import {
  englishLanguageNameForLocale,
  normalizeLocale,
  resolveUITranslationModels,
} from "../core/config.js";
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
import { Glossary } from "../glossary/glossary.js";
import {
  protectGlossaryForcedTerms,
  restoreGlossaryForcedTerms,
} from "../processors/glossary-force-placeholders.js";
import { USER_EDITED_MODEL } from "../core/user-edited-model.js";
import { parse as parseCsv } from "csv-parse/sync";

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
    return `string ${a}/${totalMissing}`;
  }
  return `strings ${a}–${b}/${totalMissing}`;
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
}

export interface TranslateUISummary {
  stringsUpdated: number;
  localesTouched: string[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

type StringsFile = Record<string, StringsJsonEntry>;

/** Same shape as {@link OpenRouterClient} private `languageLabelForPrompt` for LLM instructions. */
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
    throw new Error("Enable features.translateUIStrings in config");
  }

  const stringsPath = resolveStringsJsonPath(config, opts.cwd);
  const stringsRel = stringsCatalogRelForLog(opts.cwd, stringsPath);
  if (!fs.existsSync(stringsPath)) {
    throw new Error(`strings.json not found: ${stringsPath} (run extract first)`);
  }

  let strings: StringsFile;
  try {
    strings = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as StringsFile;
  } catch (e) {
    throw new Error(`Invalid strings.json: ${e instanceof Error ? e.message : String(e)}`);
  }

  let entries = Object.entries(strings);
  const outDir = path.join(opts.cwd, config.ui.flatOutputDir);
  fs.mkdirSync(outDir, { recursive: true });

  const srcNorm = normalizeLocale(config.sourceLocale);
  const targets = opts.locales.map((l) => normalizeLocale(l)).filter((l) => l !== srcNorm);

  if (targets.length === 0) {
    throw new Error("No target locales after excluding sourceLocale");
  }

  const glossaryUser = config.glossary?.userGlossary
    ? path.join(opts.cwd, config.glossary.userGlossary)
    : undefined;

  if (config.glossary?.autoAddUserEditedToGlossary !== false && glossaryUser && !opts.dryRun) {
    const headers = ["Original language string", "locale", "Translation", "Force"];
    let csvRows: string[][] = [];

    if (fs.existsSync(glossaryUser)) {
      const raw = fs.readFileSync(glossaryUser, "utf8");
      const records = parseCsv(raw, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];
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
      console.log(
        chalk.green(
          `[user-glossary] Added ${addedToGlossary} user-edited entr${addedToGlossary === 1 ? "y" : "ies"} to ${config.glossary.userGlossary}`
        )
      );
    }
  }

  const glossary = new Glossary(undefined, glossaryUser, targets);

  let client: OpenRouterClient | null = null;
  if (!opts.dryRun) {
    try {
      client = new OpenRouterClient({
        config,
        translationModels: resolveUITranslationModels(config),
      });
    } catch (e) {
      throw new Error(
        `OPENROUTER_API_KEY required for UI translation: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  const models = client?.getConfiguredModels() ?? [];

  const parallelLimit = Math.max(1, Math.floor(opts.concurrency ?? config.concurrency ?? 4));

  // Header block
  console.log(
    chalk.gray(
      "\n\n___UI Translation________________________________________________________________________________________\n\n"
    ) + chalk.bold(`🌐 Translating UI strings to ${targets.length} locale(s)\n`)
  );
  printModelsTryInOrder(models);
  console.log(chalk.cyan(`Strings: `) + chalk.magenta(`${entries.length} total entries`));
  console.log(chalk.cyan(`Glossary terms: `) + chalk.magenta(`${glossary.size}`));
  console.log(chalk.cyan(`Output dir: `) + chalk.magenta(outDir));
  if (opts.logPath) {
    console.log(chalk.cyan(`Output log: `) + chalk.magenta(opts.logPath));
  }
  if (targets.length > 1) {
    console.log(
      chalk.cyan(`Parallel translations: `) +
        chalk.magenta(`up to ${Math.min(parallelLimit, targets.length)}`)
    );
  }
  if (opts.dryRun) {
    console.log(chalk.yellow(`\n⚠️  Dry run mode - no changes will be made`));
  }
  console.log("");

  let stringsUpdated = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;

  const wallStart = Date.now();

  const langProgress = { completed: 0, total: targets.length };

  // ── Step 0: fill source-locale cardinal forms for plural entries ─────────
  if (!opts.dryRun && client) {
    console.log(chalk.cyan(`\n📌 Step 0 — source-locale (${srcNorm}) plural forms\n`));
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
      const forms = compactIdenticalPluralForms(batch.forms) as Record<CldrPluralForm, string>;
      console.log(
        chalk.green(
          `✔️  ${srcNorm} ${stringsRel}: plural Step 0 ${si + 1}/${step0Total} (${h}) (1 plural group in batch, ${batch.usage.totalTokens} tokens)`
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
      console.log(chalk.green(`   Step 0 completed: ${step0Count} plural group(s) updated.\n`));
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
          `📄 ${timestamp()} - ${locale} [plain]: ${missingPlain.length} string(s) to translate`
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
                `  ${timestamp()} - [dry-run] plain chunk ${chunkNum}/${chunkTotal} (${chunk.length} strings)`
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
        console.log(
          chalk.green(
            `✔️  ${locale} ${stringsRel}: ${rangeLabel} (${n} string${n === 1 ? "" : "s"} in batch, ${uiBatch.usage.totalTokens} tokens)`
          )
        );

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
      console.log(chalk.gray(`⏭️  ${timestamp()} - ${locale} [plain]: up to date`));
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
          `📄 ${timestamp()} - ${locale} [plural]: ${pluralTargets.length} group(s) to translate`
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
              `   ⚠️  Skip plural ${h}: missing non-empty plural forms for source locale ${srcNorm} (fill Step 0 or entries in strings.json, then run translate-ui again).`
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
        });
        const batch = await client.translatePluralCardinalBatch(reqTarget, msgs);
        console.log(
          chalk.green(
            `✔️  ${locale} ${stringsRel}: plural ${pi + 1}/${pluralTargets.length} (${h}) (1 plural group in batch, ${batch.usage.totalTokens} tokens)`
          )
        );
        const allReplacements = protectedParts.flatMap((p) => p.replacements);
        let formsOut = batch.forms;
        for (const k of reqTarget) {
          if (formsOut[k] !== undefined) {
            formsOut[k] = restoreGlossaryForcedTerms(formsOut[k] ?? "", allReplacements);
          }
        }
        formsOut = compactIdenticalPluralForms(formsOut) as Record<CldrPluralForm, string>;
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

    if (!opts.dryRun && (missingPlain.length > 0 || pluralTargets.length > 0)) {
      writeAtomicUtf8(stringsPath, `${JSON.stringify(strings, null, 2)}\n`);
    }

    const flat = buildFlatJsonForLocale(strings, locale);
    const localePath = path.join(outDir, `${locale}.json`);
    if (!opts.dryRun) {
      writeAtomicUtf8(localePath, `${JSON.stringify(flat, null, 2)}\n`);
      if (opts.verbose) {
        console.log(
          chalk.gray(`   ${timestamp()} - wrote ${Object.keys(flat).length} keys → ${localePath}`)
        );
      }
    }

    const localeElapsed = Date.now() - localeStart;
    if (localeElapsed > 0) {
      console.log(chalk.gray(`   [${locale}] Time: ${formatElapsedMmSs(localeElapsed)}`));
    }
    langProgress.completed += 1;
  };

  if (targets.length <= 1) {
    await translateOneTargetLocale(targets[0]!);
  } else {
    for (let i = 0; i < targets.length; i += parallelLimit) {
      const batch = targets.slice(i, i + parallelLimit);
      const langList = batch
        .map((loc) => `${localeLabelForPrompt(config, loc)} (${loc})`)
        .join(" • ");
      console.log(chalk.yellow(RULE));
      console.log(
        chalk.yellow(
          ` 🚀 Running in parallel:    ${langList}   ${langProgress.completed}/${langProgress.total}`
        )
      );
      console.log(chalk.yellow(RULE));
      await runMapWithConcurrency(batch, batch.length, async (locale) => {
        await translateOneTargetLocale(locale);
        return locale;
      });
      if (!opts.dryRun) {
        console.log(chalk.blue(`💾 Writing strings.json`));
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
          `   ${timestamp()} - wrote ${Object.keys(srcFlat).length} plural keys → ${srcPath} (${srcNorm})`
        )
      );
    }
  }

  const wallElapsed = Date.now() - wallStart;

  // Summary block
  console.log(chalk.bold.green("\n✅ UI translation complete!\n"));
  console.log(chalk.bold("📊 Summary:"));
  console.log(`   Total elapsed time:    ${formatElapsedMmSs(wallElapsed)}`);
  console.log(`   Strings updated:       ${stringsUpdated}`);
  console.log(
    `   Tokens used:           ${(inputTokens + outputTokens).toLocaleString()} (in: ${inputTokens.toLocaleString()} / out: ${outputTokens.toLocaleString()})`
  );
  if (costUsd > 0) {
    console.log(chalk.green(`   💵 Total cost:          $${costUsd.toFixed(6)}`));
  } else {
    console.log(`   Total cost:            $0.00 (all up to date or dry-run)`);
  }
  console.log("");

  return {
    stringsUpdated,
    localesTouched: targets,
    inputTokens,
    outputTokens,
    costUsd,
  };
}
