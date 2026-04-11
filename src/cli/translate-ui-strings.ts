import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { OpenRouterClient } from "../api/openrouter.js";
import { normalizeLocale } from "../core/config.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";
import { timestamp, formatElapsedMmSs } from "./format.js";
import { runMapWithConcurrency } from "../utils/concurrency.js";
import { Glossary } from "../glossary/glossary.js";

const UI_CHUNK = 50;

const RULE = "-".repeat(108);

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

type StringsFile = Record<string, { source?: string; translated?: Record<string, string> }>;

function localeEnglishLabel(config: I18nConfig, locale: string): string {
  const n = normalizeLocale(locale);
  return config.localeDisplayNames?.[n] ?? n;
}

/**
 * Read `strings.json`, translate missing per-locale entries via OpenRouter (ordered models),
 * write merged `strings.json` and flat `{locale}.json` maps (source → translation) under `ui.flatOutputDir`.
 */
export async function runTranslateUI(
  config: I18nConfig,
  opts: TranslateUIOptions
): Promise<TranslateUISummary> {
  if (!config.features.translateUIStrings) {
    throw new Error("Enable features.translateUIStrings in config");
  }

  const stringsPath = resolveStringsJsonPath(config, opts.cwd);
  if (!fs.existsSync(stringsPath)) {
    throw new Error(`strings.json not found: ${stringsPath} (run extract first)`);
  }

  let strings: StringsFile;
  try {
    strings = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as StringsFile;
  } catch (e) {
    throw new Error(`Invalid strings.json: ${e instanceof Error ? e.message : String(e)}`);
  }

  const entries = Object.entries(strings);
  const outDir = path.join(opts.cwd, config.ui.flatOutputDir);
  fs.mkdirSync(outDir, { recursive: true });

  const srcNorm = normalizeLocale(config.sourceLocale);
  const targets = opts.locales
    .map((l) => normalizeLocale(l))
    .filter((l) => l !== srcNorm);

  if (targets.length === 0) {
    throw new Error("No target locales after excluding sourceLocale");
  }

  const glossaryUi = config.glossary?.uiGlossary
    ? path.join(opts.cwd, config.glossary.uiGlossary)
    : undefined;
  const glossaryUser = config.glossary?.userGlossary
    ? path.join(opts.cwd, config.glossary.userGlossary)
    : undefined;
  const glossary = new Glossary(glossaryUi, glossaryUser, targets);

  let client: OpenRouterClient | null = null;
  if (!opts.dryRun) {
    try {
      client = new OpenRouterClient({ config });
    } catch (e) {
      throw new Error(
        `OPENROUTER_API_KEY required for UI translation: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  const models = client?.getConfiguredModels() ?? [];

  const parallelLimit = Math.max(
    1,
    Math.floor(opts.concurrency ?? config.concurrency ?? 4)
  );

  // Header block
  console.log(
    chalk.gray("\n\n___UI Translation______________________________________________________________________________\n\n") +
    chalk.bold(`🌐 Translating UI strings to ${targets.length} locale(s)\n`)
  );
  if (models.length > 0) {
    console.log(
      chalk.cyan(`Models (try in order): `) + chalk.magenta(models.join(", "))
    );
  }
  console.log(
    chalk.cyan(`Strings: `) + chalk.magenta(`${entries.length} total entries`)
  );
  console.log(chalk.cyan(`Glossary terms: `) + chalk.magenta(`${glossary.size}`));
  console.log(chalk.cyan(`Output dir: `) + chalk.magenta(outDir));
  if (opts.logPath) {
    console.log(chalk.cyan(`Output log: `) + chalk.magenta(opts.logPath));
  }
  if (targets.length > 1) {
    console.log(
      chalk.cyan(`Parallel translations: `) + chalk.magenta(`up to ${Math.min(parallelLimit, targets.length)}`) 
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

  const runSingleLocaleSequential = async (locale: string): Promise<void> => {
    const localeStart = Date.now();
    const missing = entries.filter(([_hash, entry]) => {
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

    if (missing.length === 0) {
      console.log(chalk.gray(`⏭️  ${timestamp()} - ${locale}: up to date`));
    } else {
      console.log(
        chalk.yellow(
          `🔃 ${timestamp()} - ${locale}: ${missing.length} string(s) to translate`
        )
      );

      for (let i = 0; i < missing.length; i += UI_CHUNK) {
        const chunk = missing.slice(i, i + UI_CHUNK);
        const sources = chunk.map(([, v]) => v.source ?? "");
        const chunkNum = Math.floor(i / UI_CHUNK) + 1;
        const chunkTotal = Math.ceil(missing.length / UI_CHUNK);

        if (opts.dryRun || !client) {
          if (opts.verbose) {
            console.log(
              chalk.yellow(
                `  ${timestamp()} - [dry-run] chunk ${chunkNum}/${chunkTotal} (${chunk.length} strings)`
              )
            );
          }
          continue;
        }

        if (opts.verbose) {
          console.log(
            chalk.gray(
              `  ${timestamp()} - Chunk ${chunkNum}/${chunkTotal} (${chunk.length} strings)`
            )
          );
        }

        const hints = glossary.findTermsInText(sources.join("\n"), locale);
        const uiBatch = await client.translateUIBatch(sources, locale, { glossaryHints: hints });
        inputTokens += uiBatch.usage.inputTokens;
        outputTokens += uiBatch.usage.outputTokens;
        costUsd += uiBatch.cost ?? 0;

        chunk.forEach(([h], idx) => {
          const tr = uiBatch.translations[idx];
          if (tr !== undefined && strings[h]) {
            if (!strings[h].translated) {
              strings[h].translated = {};
            }
            strings[h].translated![locale] = tr;
            stringsUpdated++;
          }
        });
      }

      if (!opts.dryRun && missing.length > 0) {
        writeAtomicUtf8(stringsPath, `${JSON.stringify(strings, null, 2)}\n`);
      }
    }

    const flat: Record<string, string> = {};
    for (const entry of Object.values(strings)) {
      const src = entry.source ?? "";
      const tx = entry.translated?.[locale];
      if (src && tx) {
        flat[src] = tx;
      }
    }
    const localePath = path.join(outDir, `${locale}.json`);
    if (!opts.dryRun) {
      writeAtomicUtf8(localePath, `${JSON.stringify(flat, null, 2)}\n`);
      if (opts.verbose) {
        console.log(
          chalk.gray(
            `   ${timestamp()} - wrote ${Object.keys(flat).length} keys → ${localePath}`
          )
        );
      }
    }

    const localeElapsed = Date.now() - localeStart;
    if (localeElapsed > 0) {
      console.log(
        chalk.gray(`   [${locale}] Time: ${formatElapsedMmSs(localeElapsed)}`)
      );
    }
    langProgress.completed += 1;
  };

  const translateLocaleParallelWave = async (locale: string): Promise<void> => {
    const localeStart = Date.now();
    const missing = entries.filter(([_hash, entry]) => {
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

    if (missing.length === 0) {
      console.log(chalk.gray(`⏭️  ${timestamp()} - ${locale}: up to date`));
    } else {
      console.log(
        chalk.yellow(
          `🔃 ${timestamp()} - ${locale}: ${missing.length} string(s) to translate`
        )
      );

      for (let i = 0; i < missing.length; i += UI_CHUNK) {
        const chunk = missing.slice(i, i + UI_CHUNK);
        const sources = chunk.map(([, v]) => v.source ?? "");
        const chunkNum = Math.floor(i / UI_CHUNK) + 1;
        const chunkTotal = Math.ceil(missing.length / UI_CHUNK);

        if (opts.dryRun || !client) {
          if (opts.verbose) {
            console.log(
              chalk.yellow(
                `  ${timestamp()} - [dry-run] chunk ${chunkNum}/${chunkTotal} (${chunk.length} strings)`
              )
            );
          }
          continue;
        }

        if (opts.verbose) {
          console.log(
            chalk.gray(
              `  ${timestamp()} - Chunk ${chunkNum}/${chunkTotal} (${chunk.length} strings)`
            )
          );
        }

        const hints = glossary.findTermsInText(sources.join("\n"), locale);
        const uiBatch = await client.translateUIBatch(sources, locale, { glossaryHints: hints });
        inputTokens += uiBatch.usage.inputTokens;
        outputTokens += uiBatch.usage.outputTokens;
        costUsd += uiBatch.cost ?? 0;

        chunk.forEach(([h], idx) => {
          const tr = uiBatch.translations[idx];
          if (tr !== undefined && strings[h]) {
            if (!strings[h].translated) {
              strings[h].translated = {};
            }
            strings[h].translated![locale] = tr;
            stringsUpdated++;
          }
        });
      }
    }

    const flat: Record<string, string> = {};
    for (const entry of Object.values(strings)) {
      const src = entry.source ?? "";
      const tx = entry.translated?.[locale];
      if (src && tx) {
        flat[src] = tx;
      }
    }
    const localePath = path.join(outDir, `${locale}.json`);
    if (!opts.dryRun) {
      writeAtomicUtf8(localePath, `${JSON.stringify(flat, null, 2)}\n`);
      if (opts.verbose) {
        console.log(
          chalk.gray(
            `   ${timestamp()} - wrote ${Object.keys(flat).length} keys → ${localePath}`
          )
        );
      }
    }

    const localeElapsed = Date.now() - localeStart;
    if (localeElapsed > 0) {
      console.log(
        chalk.gray(`   [${locale}] Time: ${formatElapsedMmSs(localeElapsed)}`)
      );
    }
    langProgress.completed += 1;
  };

  if (targets.length <= 1) {
    await runSingleLocaleSequential(targets[0]!);
  } else {
    for (let i = 0; i < targets.length; i += parallelLimit) {
      const batch = targets.slice(i, i + parallelLimit);
      const langList = batch
        .map((loc) => `${localeEnglishLabel(config, loc)} (${loc})`)
        .join(" • ");
      console.log(chalk.yellow(RULE));
      console.log(
        chalk.yellow(
          ` 🚀 Running in parallel:    ${langList}   ${langProgress.completed}/${langProgress.total}`
        )
      );
      console.log(chalk.yellow(RULE));
      await runMapWithConcurrency(batch, batch.length, async (locale) => {
        await translateLocaleParallelWave(locale);
        return locale;
      });
      if (!opts.dryRun) {
        console.log(chalk.blue(`💾 Writing strings.json`));
        writeAtomicUtf8(stringsPath, `${JSON.stringify(strings, null, 2)}\n`);
      }
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
