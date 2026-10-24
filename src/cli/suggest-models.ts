import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { t } from "../i18n/index.js";
import { replaceProviderTranslationModels } from "../core/apply-translation-models.js";
import { resolveActiveProvider, translationModelsForProvider } from "../core/llm-providers.js";
import {
  suggestProviderModels,
  type SuggestProviderModelsResult,
} from "../core/suggest-provider-models.js";
import type { RankedModel } from "../core/model-suggestion.js";

export interface RunSuggestModelsOptions {
  quality?: boolean;
  price?: boolean;
  top?: number;
  json?: boolean;
  apply?: boolean;
  refresh?: boolean;
  /** Print the configured `translationModels` instead of the top suggestions. */
  list?: boolean;
  /** Keep models whose output USD per 1M tokens is at most this value. */
  maxOutputPrice?: number;
  /** Minimum index drop from the previous kept model. */
  minDelta?: number;
}

export interface RunSuggestModelsResult {
  exitCode: number;
}

function formatMeasure(value: number | null, digits: number): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(digits);
}

function formatUsd(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }
  return `$${value.toFixed(3)}`;
}

export function renderSuggestTable(models: readonly RankedModel[]): string {
  const headers = ["#", "model", "index", "ChrF", "Arena", "input", "output"];
  const rows = models.map((model) => [
    model.rank > 0 ? String(model.rank) : "—",
    model.id,
    Number.isFinite(model.index) ? model.index.toFixed(1) : "—",
    formatMeasure(model.chrf, 3),
    formatMeasure(model.arenaScore, 1),
    formatUsd(model.inputPerMTokens),
    formatUsd(model.outputPerMTokens),
  ]);
  const widths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => (row[i] ?? "").length))
  );
  const line = (cols: string[]): string =>
    cols.map((col, i) => col.padEnd(widths[i] ?? 0)).join("  ");
  return [line(headers), ...rows.map((row) => line(row))].join("\n");
}

function attributionLine(result: SuggestProviderModelsResult): string {
  return t(
    "Scores: languagebench ChrF ({{lbLicense}}, {{lbUrl}}); Arena Score ({{arenaLicense}}, {{arenaUrl}}); prices: models.dev ({{mdLicense}}, {{mdUrl}}).",
    {
      lbLicense: result.attribution.languagebench.license,
      lbUrl: result.attribution.languagebench.url,
      arenaLicense: result.attribution.arena.license,
      arenaUrl: result.attribution.arena.url,
      mdLicense: result.attribution.modelsDev.license,
      mdUrl: result.attribution.modelsDev.url,
    }
  );
}

function translationModelsJson(ids: readonly string[]): string {
  return `${JSON.stringify({ translationModels: ids }, null, 2)}\n`;
}

export interface SelectSuggestRowsOpts {
  maxOutputPrice?: number;
  minDelta?: number;
}

/**
 * Drop models above an output-price cap, then keep a model only when its index
 * is at least `minDelta` points below the previous kept model. Rank numbers stay
 * as they were in the full list.
 */
export function selectSuggestRows(
  models: readonly RankedModel[],
  opts: SelectSuggestRowsOpts
): RankedModel[] {
  let rows = [...models];
  if (opts.maxOutputPrice !== undefined) {
    const cap = opts.maxOutputPrice;
    rows = rows.filter((row) => row.outputPerMTokens !== null && row.outputPerMTokens <= cap);
  }
  if (opts.minDelta !== undefined && opts.minDelta > 0) {
    const kept: RankedModel[] = [];
    let lastIndex: number | null = null;
    for (const row of rows) {
      if (!Number.isFinite(row.index)) {
        continue;
      }
      if (lastIndex === null) {
        kept.push(row);
        lastIndex = row.index;
        continue;
      }
      const ceiling = Math.round((lastIndex - opts.minDelta) * 10) / 10;
      if (row.index <= ceiling) {
        kept.push(row);
        lastIndex = row.index;
      }
    }
    rows = kept;
  }
  return rows;
}

/**
 * Rows for the configured fallback chain, in that order.
 * An id that is missing from the ranked catalog still appears, with empty scores.
 */
export function configuredModelRows(
  ranked: readonly RankedModel[],
  configuredIds: readonly string[]
): RankedModel[] {
  const byId = new Map(ranked.map((row) => [row.id, row]));
  return configuredIds.map((id) => {
    const found = byId.get(id);
    if (found) {
      return found;
    }
    return {
      id,
      name: id,
      rank: 0,
      index: Number.NaN,
      chrf: null,
      arenaScore: null,
      inputPerMTokens: null,
      outputPerMTokens: null,
      belowFloor: true,
      priceSource: null,
    };
  });
}

/**
 * Rank the active provider's models and optionally print JSON or rewrite `translationModels`.
 */
export async function runSuggestModels(
  config: I18nConfig,
  projectRoot: string,
  configPath: string,
  opts: RunSuggestModelsOptions
): Promise<RunSuggestModelsResult> {
  const out = opts.json === true ? console.error.bind(console) : console.log.bind(console);
  if (opts.quality === true && opts.price === true) {
    console.error(chalk.red(t("Pass only one of --quality or --price.")));
    return { exitCode: 1 };
  }
  if (opts.list === true && opts.apply === true) {
    console.error(
      chalk.red(t("--list prints the configured models and cannot be combined with --apply."))
    );
    return { exitCode: 1 };
  }
  const top = opts.top ?? 8;
  if (opts.list !== true && (!Number.isInteger(top) || top < 1)) {
    console.error(chalk.red(t("--top must be an integer >= 1.")));
    return { exitCode: 1 };
  }
  if (
    opts.maxOutputPrice !== undefined &&
    (!Number.isFinite(opts.maxOutputPrice) || opts.maxOutputPrice < 0)
  ) {
    console.error(chalk.red(t("--max-output-price must be a number >= 0.")));
    return { exitCode: 1 };
  }
  if (opts.minDelta !== undefined && (!Number.isFinite(opts.minDelta) || opts.minDelta < 0)) {
    console.error(chalk.red(t("--min-delta must be a number >= 0.")));
    return { exitCode: 1 };
  }
  const profile = opts.price === true ? "price" : "quality";

  let activeProvider: string;
  try {
    activeProvider = resolveActiveProvider(config);
  } catch (e) {
    console.error(chalk.red(e instanceof Error ? e.message : String(e)));
    return { exitCode: 1 };
  }

  let result: SuggestProviderModelsResult;
  try {
    result = await suggestProviderModels({
      config,
      projectRoot,
      provider: activeProvider,
      profile,
      refresh: opts.refresh === true,
    });
  } catch (e) {
    console.error(chalk.red(e instanceof Error ? e.message : String(e)));
    return { exitCode: 1 };
  }

  const pool =
    opts.list === true
      ? configuredModelRows(result.models, translationModelsForProvider(config, result.provider))
      : result.models;
  const filtered = selectSuggestRows(pool, {
    ...(opts.maxOutputPrice !== undefined ? { maxOutputPrice: opts.maxOutputPrice } : {}),
    ...(opts.minDelta !== undefined ? { minDelta: opts.minDelta } : {}),
  });
  const chosen = opts.list === true ? filtered : filtered.slice(0, top);
  for (const warning of result.warnings) {
    out(chalk.yellow(warning));
  }
  out(
    chalk.bold(
      opts.list === true
        ? t(
            'suggest-models: provider "{{provider}}" — {{profile}} — {{count}} configured model(s).',
            {
              provider: result.provider,
              profile,
              count: chosen.length,
            }
          )
        : t('suggest-models: provider "{{provider}}" — {{profile}} — top {{count}} of {{total}}.', {
            provider: result.provider,
            profile,
            count: chosen.length,
            total: filtered.length,
          })
    )
  );
  out("");
  if (chosen.length === 0) {
    out(
      chalk.yellow(
        opts.list === true
          ? t('No translation models are configured for provider "{{provider}}".', {
              provider: result.provider,
            })
          : t("No chat models to suggest.")
      )
    );
  } else {
    out(renderSuggestTable(chosen));
  }
  out("");
  out(chalk.gray(attributionLine(result)));

  const ids = chosen.map((model) => model.id);
  if (opts.apply === true) {
    let backupPath: string;
    try {
      backupPath = replaceProviderTranslationModels(configPath, result.provider, ids);
    } catch (e) {
      console.error(chalk.red(e instanceof Error ? e.message : String(e)));
      return { exitCode: 1 };
    }
    out(
      chalk.green(
        t("Updated providers.{{provider}}.translationModels in {{path}}.", {
          provider: result.provider,
          path: configPath,
        })
      )
    );
    out(chalk.green(t("Config backup → {{path}}.", { path: backupPath })));
  }

  if (opts.json === true) {
    process.stdout.write(translationModelsJson(ids));
  }
  return { exitCode: 0 };
}
