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
  /** Keep models whose blended USD per 1M tokens is at most this value. */
  maxPrice?: number;
  /** Minimum absolute index gap from the previous kept model. */
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

function formatFrontier(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }
  return String(value);
}

export function renderSuggestTable(models: readonly RankedModel[]): string {
  const headers = [
    "#",
    "model",
    "index",
    "ChrF",
    "Arena",
    "input",
    "output",
    "blended",
    "frontier",
  ];
  const rows = models.map((model) => [
    model.rank > 0 ? String(model.rank) : "—",
    model.id,
    Number.isFinite(model.index) ? model.index.toFixed(1) : "—",
    formatMeasure(model.chrf, 3),
    formatMeasure(model.arenaScore, 1),
    formatUsd(model.inputPerMTokens),
    formatUsd(model.outputPerMTokens),
    formatUsd(model.blendedPerMTokens),
    formatFrontier(model.frontierLayer),
  ]);
  const widths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => (row[i] ?? "").length))
  );
  const line = (cols: string[]): string =>
    cols.map((col, i) => col.padEnd(widths[i] ?? 0)).join("  ");
  return [chalk.bold.cyanBright(line(headers)), ...rows.map((row) => line(row))].join("\n");
}

function attributionLine(result: SuggestProviderModelsResult): string {
  return t(
    "Scores: languagebench ChrF ({{lbLicense}}, {{lbUrl}}); Arena Score ({{arenaLicense}}, {{arenaUrl}}); prices: provider catalog or models.dev ({{mdLicense}}, {{mdUrl}}).",
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
  maxPrice?: number;
  minDelta?: number;
  /** Keep rows that repeat another model's scores and prices. `--list` sets this. */
  keepAliases?: boolean;
}

function uniqueInOrder(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    unique.push(id);
  }
  return unique;
}

function joinEnglishList(ids: readonly string[]): string {
  if (ids.length <= 1) {
    return ids[0] ?? "";
  }
  if (ids.length === 2) {
    return `${ids[0]} and ${ids[1]}`;
  }
  return `${ids.slice(0, -1).join(", ")}, and ${ids[ids.length - 1]}`;
}

/**
 * One line naming the layer-1 models that beat dominated rows, or null when
 * every shown row is undominated.
 */
export function dominanceHint(models: readonly RankedModel[]): string | null {
  const dominated = models.filter(
    (row) => row.frontierLayer !== null && row.frontierLayer > 1 && row.dominatedBy !== null
  );
  if (dominated.length === 0) {
    return null;
  }
  const better = joinEnglishList(
    uniqueInOrder(dominated.flatMap((row) => (row.dominatedBy === null ? [] : [row.dominatedBy])))
  );
  if (dominated.length === 1) {
    return t("{{model}} is beaten on price and quality by {{better}}.", {
      model: dominated[0]?.id ?? "",
      better,
    });
  }
  return t("{{models}} are beaten on price and quality by {{better}}.", {
    models: joinEnglishList(dominated.map((row) => row.id)),
    better,
  });
}

/**
 * Drop alias rows, then models above a blended-price cap, then keep a model
 * only when its index differs from the previous kept model by at least
 * `minDelta` points. Rank numbers stay as they were in the full list.
 */
export function selectSuggestRows(
  models: readonly RankedModel[],
  opts: SelectSuggestRowsOpts
): RankedModel[] {
  let rows = [...models];
  if (opts.keepAliases !== true) {
    rows = rows.filter((row) => row.aliasOf === null);
  }
  if (opts.maxPrice !== undefined) {
    const cap = opts.maxPrice;
    rows = rows.filter((row) => row.blendedPerMTokens !== null && row.blendedPerMTokens <= cap);
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
      const gap = Math.round(Math.abs(row.index - lastIndex) * 10) / 10;
      if (gap >= opts.minDelta) {
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
      blendedPerMTokens: null,
      frontierLayer: null,
      dominatedBy: null,
      aliasOf: null,
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
  if (opts.maxPrice !== undefined && (!Number.isFinite(opts.maxPrice) || opts.maxPrice < 0)) {
    console.error(chalk.red(t("--max-price must be a number >= 0.")));
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
    ...(opts.maxPrice !== undefined ? { maxPrice: opts.maxPrice } : {}),
    ...(opts.minDelta !== undefined ? { minDelta: opts.minDelta } : {}),
    ...(opts.list === true ? { keepAliases: true } : {}),
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
    const hint = dominanceHint(chosen);
    if (hint !== null) {
      out("");
      out(hint);
    }
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
