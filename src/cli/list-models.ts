import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { t } from "../i18n/index.js";
import {
  OPENROUTER_PROVIDER_KEY,
  providerModelsCatalogQuery,
  resolveActiveProvider,
  resolveModelsListRequestAuth,
  resolveProviderSettings,
} from "../core/llm-providers.js";
import {
  catalogUsdPerMillionDisplay,
  fetchProviderModelsCatalog,
  isExpirationDatePast,
  modelDisplayName,
  providerModelsCatalogUrl,
  type ProviderModelEntry,
} from "../api/provider-models-catalog.js";

export interface RunListModelsResult {
  exitCode: number;
}

/**
 * List every model the active provider advertises via its OpenAI-compatible `GET /models` endpoint.
 * The active provider follows the resolved config `provider` key, which the global `-P` / `--provider`
 * flag overrides for a single run. Pricing (USD per 1M tokens) is shown only when the provider returns
 * it (OpenRouter per-token rates, or Cheaper Inference catalog rates). Keyless providers like Ollama
 * need no API key.
 */
export async function runListModels(config: I18nConfig): Promise<RunListModelsResult> {
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

  const isOpenRouter = activeProvider === OPENROUTER_PROVIDER_KEY;
  const auth = resolveModelsListRequestAuth(activeProvider, apiKey, {
    xTitle: "ai-i18n-tools list-models",
  });
  const catalogQuery = providerModelsCatalogQuery(settings);
  const catalogUrl = providerModelsCatalogUrl(settings.baseUrl, catalogQuery);

  let catalog: Map<string, ProviderModelEntry>;
  try {
    catalog = await fetchProviderModelsCatalog({
      baseUrl: settings.baseUrl,
      apiKey: auth.apiKey,
      providerLabel: activeProvider,
      requestTimeoutMs: settings.requestTimeoutMs,
      extraHeaders: auth.extraHeaders,
      query: catalogQuery,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(chalk.red(msg));
    return { exitCode: 1 };
  }

  const entries = [...catalog.values()].sort((a, b) => a.id.localeCompare(b.id));

  console.log(
    chalk.bold(
      t('list-models: provider "{{provider}}" — {{count}} model(s) available.', {
        provider: activeProvider,
        count: entries.length,
      })
    )
  );
  console.log();
  if (settings.zeroDataRetention) {
    console.log(chalk.gray(t("Zero-data-retention catalog (GET /models?zdr=true).")));
    console.log();
  }

  if (entries.length === 0) {
    console.log(chalk.yellow(t("No models returned by the provider.")));
    console.log();
    return { exitCode: 0 };
  }

  const showPricing = entries.some((entry) => catalogUsdPerMillionDisplay(entry) !== undefined);
  if (showPricing) {
    console.log(chalk.green.bold(t("Available models — pricing USD per 1M tokens")));
  } else {
    console.log(chalk.green.bold(t("Available models")));
  }

  const idW = Math.max(8, ...entries.map((e) => e.id.length));
  for (const entry of entries) {
    const expired =
      typeof entry.expiration_date === "string" && isExpirationDatePast(entry.expiration_date);
    const label = modelDisplayName(entry);
    const name = label.length > 0 ? chalk.gray(` (${label})`) : "";
    const expiredTag = expired ? chalk.red(t(" [expired]")) : "";
    if (showPricing) {
      const rates = catalogUsdPerMillionDisplay(entry);
      const input = rates?.input ?? "—";
      const output = rates?.output ?? "—";
      console.log(
        `  ${entry.id.padEnd(idW)}   input: ${input.padStart(8)}   output: ${output.padStart(8)}  ${name}${expiredTag}`
      );
    } else {
      console.log(`  ${entry.id.padEnd(idW)}${name}${expiredTag}`);
    }
  }
  console.log();

  if (isOpenRouter) {
    console.log(
      chalk.gray(t("Source: OpenRouter models directory @ ")) +
        chalk.cyan("https://openrouter.ai/models\n")
    );
  } else {
    console.log(chalk.gray(t("Source: {{catalogUrl}}\n", { catalogUrl })));
  }

  return { exitCode: 0 };
}
