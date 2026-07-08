import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { t } from "../i18n/index.js";
import { LlmClient } from "../api/llm-client.js";
import { normalizeLocale, resolveAllConfiguredModelIds, resolveTranslationModels } from "../core/config.js";
import { resolveActiveProvider, resolveProviderSettings } from "../core/llm-providers.js";
import { getDocumentationTargetLocaleCodes } from "../core/ui-languages.js";
import { renderTable } from "../utils/table.js";
import { runMapWithConcurrency } from "../utils/concurrency.js";
import { printModelsTryInOrder } from "./format.js";

/** Parallel model benchmarks when the config does not set `concurrency`. */
const DEFAULT_BENCH_CONCURRENCY = 4;

export interface RunBenchModelsResult {
  exitCode: number;
}

export interface RunBenchModelsOptions {
  /** Comma-separated model ids override (default: union of translationModels, uiModels, and localeModels). */
  models?: string[];
  /** Inline sample text to translate (wins over `file`). */
  text?: string;
  /** Path to a file whose contents are used as the sample text. */
  file?: string;
  /** Source locale override (default: config sourceLocale). */
  source?: string;
  /** Target locale override (default: first configured documentation target locale). */
  target?: string;
}

/**
 * Built-in English markdown sample translated by every model when neither `--text` nor `--file`
 * is supplied. A few short paragraphs of mixed register exercise prompt/output tokens realistically.
 */
const BENCH_DEFAULT_SAMPLE = [
  "We are waiting for the updated financial report so we can move the project forward on the agreed schedule.",
  "",
  "Hey, how's it going? Let's grab a coffee one of these days — but for real this time, no flaking out!",
  "",
  "We need to run the migration script in the staging environment to validate that deploying the microservice will not overload the production database.",
].join("\n");

interface BenchRow {
  modelId: string;
  ok: boolean;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  costUsd: number | undefined;
  error?: string;
}

/** Format a wall-clock duration as `MM:SS.mmm` (minutes, seconds, milliseconds). */
function formatDurationMs(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const millis = safe % 1000;
  const pad = (n: number, digits: number): string => String(n).padStart(digits, "0");
  return `${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millis, 3)}`;
}

/** Format a USD cost, or `—` when the provider does not report cost. */
function formatCost(cost: number | undefined): string {
  if (cost === undefined || !Number.isFinite(cost)) {
    return "—";
  }
  return `$${cost.toFixed(6)}`;
}

/**
 * Benchmark each configured model id in isolation (`translationModels`, `uiModels`, and every
 * `localeModels` entry, deduplicated): translate the same sample through a single-model
 * {@link LlmClient} (no fallback chain) and report wall-clock time, input/output tokens, and USD cost.
 */
export async function runBenchModels(
  config: I18nConfig,
  projectRoot: string,
  opts: RunBenchModelsOptions
): Promise<RunBenchModelsResult> {
  let activeProvider: string;
  try {
    activeProvider = resolveActiveProvider(config);
  } catch (e) {
    console.error(chalk.red(e instanceof Error ? e.message : String(e)));
    return { exitCode: 1 };
  }

  const settings = resolveProviderSettings(activeProvider, config);
  const apiKey = settings.apiKeyEnv ? (process.env[settings.apiKeyEnv]?.trim() ?? "") : "";
  if (!apiKey && settings.requiresApiKey) {
    console.error(
      chalk.red(t("{{keyName}} is required", { keyName: settings.apiKeyEnv ?? "API key" }))
    );
    return { exitCode: 1 };
  }

  const overrideModels = (opts.models ?? [])
    .map((m) => m.trim())
    .filter((m) => m.length > 0);
  const translationModels = resolveTranslationModels(config);
  if (overrideModels.length === 0 && translationModels.length === 0) {
    console.error(
      chalk.red(
        t("No models configured (set {{configKey}}).", {
          configKey: `providers.${activeProvider}.translationModels`,
        })
      )
    );
    return { exitCode: 1 };
  }

  const models =
    overrideModels.length > 0 ? overrideModels : resolveAllConfiguredModelIds(config);
  if (models.length === 0) {
    console.error(
      chalk.red(
        t("No models configured (set {{configKey}}).", {
          configKey: `providers.${activeProvider}.translationModels`,
        })
      )
    );
    return { exitCode: 1 };
  }

  let sampleText: string;
  if (opts.text !== undefined && opts.text.trim().length > 0) {
    sampleText = opts.text;
  } else if (opts.file !== undefined && opts.file.trim().length > 0) {
    const filePath = path.isAbsolute(opts.file)
      ? opts.file
      : path.resolve(projectRoot, opts.file);
    try {
      sampleText = fs.readFileSync(filePath, "utf8");
    } catch (e) {
      console.error(
        chalk.red(
          t("Failed to read sample file {{path}}: {{error}}", {
            path: filePath,
            error: e instanceof Error ? e.message : String(e),
          })
        )
      );
      return { exitCode: 1 };
    }
  } else {
    sampleText = BENCH_DEFAULT_SAMPLE;
  }
  if (sampleText.trim().length === 0) {
    console.error(chalk.red(t("Sample text is empty.")));
    return { exitCode: 1 };
  }

  const sourceLocale = opts.source?.trim()
    ? normalizeLocale(opts.source.trim())
    : normalizeLocale(config.sourceLocale);

  let targetLocale: string;
  if (opts.target?.trim()) {
    targetLocale = normalizeLocale(opts.target.trim());
  } else {
    // Prefer a documentation target locale, then fall back to the top-level `targetLocales`
    // (configs that only translate UI/JSON, e.g. ai-i18n-self.config.json, have `docs: []`).
    const docTargets = getDocumentationTargetLocaleCodes(config);
    const fallbackTargets = (config.targetLocales ?? [])
      .map((l) => normalizeLocale(l))
      .filter((l) => l !== sourceLocale);
    const defaultTarget = docTargets[0] ?? fallbackTargets[0];
    if (!defaultTarget) {
      console.error(
        chalk.red(
          t(
            "No target locale found. Pass --target <locale> or configure targetLocales / docs[].targetLocales."
          )
        )
      );
      return { exitCode: 1 };
    }
    targetLocale = defaultTarget;
  }

  const effectiveConfig: I18nConfig =
    sourceLocale === normalizeLocale(config.sourceLocale)
      ? config
      : { ...config, sourceLocale };

  console.log(
    chalk.bold(
      t(
        'bench-models: provider "{{provider}}" — benchmarking {{count}} model(s) ({{source}} → {{target}}).',
        {
          provider: activeProvider,
          count: models.length,
          source: sourceLocale,
          target: targetLocale,
        }
      )
    )
  );
  printModelsTryInOrder(models, activeProvider);
  console.log();

  const concurrency = Math.max(1, Math.floor(config.concurrency ?? DEFAULT_BENCH_CONCURRENCY));
  console.log(
    chalk.gray(
      t("Running {{count}} model(s), up to {{concurrency}} in parallel…", {
        count: models.length,
        concurrency: Math.min(concurrency, models.length),
      })
    )
  );
  console.log();

  // Each model is benchmarked through its own single-model client so timings/usage map to exactly
  // one model; `runMapWithConcurrency` preserves input order so `rows` matches `models`.
  const benchmarkModel = async (modelId: string): Promise<BenchRow> => {
    let client: LlmClient;
    try {
      client = new LlmClient({ config: effectiveConfig, apiKey, translationModels: [modelId] });
    } catch (e) {
      return {
        modelId,
        ok: false,
        inputTokens: 0,
        outputTokens: 0,
        durationMs: 0,
        costUsd: undefined,
        error: e instanceof Error ? e.message : String(e),
      };
    }

    const start = Date.now();
    try {
      const res = await client.translateDocumentSegment(sampleText, targetLocale, []);
      const durationMs = Date.now() - start;
      console.log(
        chalk.gray(
          t("✔ {{model}} ({{time}})", { model: modelId, time: formatDurationMs(durationMs) })
        )
      );
      return {
        modelId,
        ok: true,
        inputTokens: res.usage.inputTokens,
        outputTokens: res.usage.outputTokens,
        durationMs,
        costUsd: res.cost,
      };
    } catch (e) {
      console.log(chalk.red(t("✗ {{model}} (failed)", { model: modelId })));
      return {
        modelId,
        ok: false,
        inputTokens: 0,
        outputTokens: 0,
        durationMs: Date.now() - start,
        costUsd: undefined,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  };

  const rows = await runMapWithConcurrency(models, concurrency, benchmarkModel);

  console.log();

  const okRows = rows.filter((r) => r.ok);
  const failedRows = rows.filter((r) => !r.ok);
  const totalInput = okRows.reduce((acc, r) => acc + r.inputTokens, 0);
  const totalOutput = okRows.reduce((acc, r) => acc + r.outputTokens, 0);
  const costKnownRows = okRows.filter((r) => r.costUsd !== undefined);
  const totalCost = costKnownRows.reduce((acc, r) => acc + (r.costUsd ?? 0), 0);
  const someCostUnknown = okRows.some((r) => r.costUsd === undefined);

  const headers = [
    t("Model"),
    t("Input"),
    t("Output"),
    t("Time"),
    t("Cost (USD)"),
  ];
  const tableRows: string[][] = rows.map((r) =>
    r.ok
      ? [
          r.modelId,
          String(r.inputTokens),
          String(r.outputTokens),
          formatDurationMs(r.durationMs),
          formatCost(r.costUsd),
        ]
      : [r.modelId, "—", "—", t("FAILED"), "—"]
  );
  if (okRows.length > 0) {
    tableRows.push([
      t("TOTAL"),
      String(totalInput),
      String(totalOutput),
      "",
      costKnownRows.length > 0 ? formatCost(totalCost) : "—",
    ]);
  }

  const totalRowIndex = okRows.length > 0 ? tableRows.length - 1 : undefined;
  const lines = renderTable({
    headers,
    rows: tableRows,
    align: ["left", "right", "right", "right", "right"],
    separatorBeforeRows: totalRowIndex !== undefined ? [totalRowIndex] : undefined,
  });
  for (const line of lines) {
    console.log(line);
  }
  console.log();

  if (someCostUnknown) {
    console.log(
      chalk.gray(
        t("Note: cost is reported only by providers that return it (e.g. OpenRouter); shown as — otherwise.")
      )
    );
    console.log();
  }

  if (failedRows.length > 0) {
    console.log(chalk.red.bold(t("Failed models")));
    for (const r of failedRows) {
      console.log(chalk.red(`  • ${r.modelId}`));
      if (r.error) {
        console.log(chalk.gray(`    ${r.error}`));
      }
    }
    console.log();
  }

  return { exitCode: okRows.length === 0 ? 1 : 0 };
}
