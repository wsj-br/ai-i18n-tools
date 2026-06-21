import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { fetchOpenRouterModelsCatalog } from "../api/provider-models-catalog.js";
import {
  OPENROUTER_PROVIDER_KEY,
  resolveActiveProvider,
  resolveProviderSettings,
} from "../core/llm-providers.js";

export interface FilterTranslationModelsResult {
  /** Ids to pass to `LlmClient` (`translationModels`), order preserved. */
  models: string[];
  /** Configured ids not returned by OpenRouter `GET /models`. */
  unknownIds: string[];
}

/**
 * Drops model ids that do not appear in OpenRouter’s catalog so the client never targets removed/unknown slugs.
 *
 * Only runs when the active provider is OpenRouter (the catalog is OpenRouter-specific). When the
 * active provider is anything else, the API key is unset, or `models` is empty, returns inputs
 * unchanged (no network). On fetch failure, logs once and returns inputs unchanged.
 */
export async function filterTranslationModelsAgainstOpenRouterCatalog(
  models: string[],
  config: Pick<I18nConfig, "provider" | "providers">
): Promise<FilterTranslationModelsResult> {
  if (models.length === 0) {
    return { models, unknownIds: [] };
  }
  let activeProvider: string;
  try {
    activeProvider = resolveActiveProvider(config);
  } catch {
    return { models, unknownIds: [] };
  }
  if (activeProvider !== OPENROUTER_PROVIDER_KEY) {
    return { models, unknownIds: [] };
  }
  const settings = resolveProviderSettings(activeProvider, config);
  const apiKey = settings.apiKeyEnv ? (process.env[settings.apiKeyEnv]?.trim() ?? "") : "";
  if (!apiKey) {
    return { models, unknownIds: [] };
  }

  try {
    const catalog = await fetchOpenRouterModelsCatalog({
      baseUrl: settings.baseUrl,
      apiKey,
      requestTimeoutMs: settings.requestTimeoutMs,
    });
    const unknownIds = models.filter((id) => !catalog.has(id));
    const known = models.filter((id) => catalog.has(id));
    return { models: known, unknownIds };
  } catch {
    console.warn(
      chalk.yellow(
        "[models] Could not load OpenRouter model catalog; using configured model ids unchanged."
      )
    );
    return { models, unknownIds: [] };
  }
}

/** Warn about ids removed by {@link filterTranslationModelsAgainstOpenRouterCatalog}. */
export function warnIgnoredUnknownOpenRouterModels(unknownIds: string[]): void {
  if (unknownIds.length === 0) {
    return;
  }
  console.warn(
    chalk.yellow(
      `[models] Ignoring ${unknownIds.length} model id(s) not listed by OpenRouter (removed or unknown slug):`
    )
  );
  for (const id of unknownIds) {
    console.warn(chalk.yellow(`  • ${id}`));
  }
  console.warn(
    chalk.yellow(
      "[models] Edit `openrouter.translationModels` in your config, then run `ai-i18n-tools check-models`."
    )
  );
}

export const MODELS_ALL_UNKNOWN_AFTER_FILTER =
  "[models] No translation models left after removing unknown OpenRouter ids. Update `openrouter.translationModels` and run `ai-i18n-tools check-models`.";
