import { LlmClient, type LlmClientOptions } from "../api/llm-client.js";
import { resolveTranslationModelsForLocale } from "../core/config.js";
import type { I18nConfig, I18nDocTranslateConfig } from "../core/types.js";
import {
  filterTranslationModelsAgainstOpenRouterCatalog,
  MODELS_ALL_UNKNOWN_AFTER_FILTER,
  warnIgnoredUnknownOpenRouterModels,
} from "./openrouter-catalog-model-filter.js";

export type CreateFilteredLlmClientConfig = I18nConfig | I18nDocTranslateConfig;

export type CreateFilteredLlmClientOptions = {
  ui?: boolean;
} & Omit<LlmClientOptions, "config" | "translationModels">;

/**
 * Resolve locale-aware models, filter against the OpenRouter catalog when applicable, and construct
 * an {@link LlmClient} with the resulting fallback chain.
 */
export async function createFilteredLlmClient(
  config: CreateFilteredLlmClientConfig,
  locale: string,
  opts: CreateFilteredLlmClientOptions = {}
): Promise<LlmClient> {
  const { ui, ...clientOpts } = opts;
  const resolved = resolveTranslationModelsForLocale(config, locale, { ui });
  if (resolved.length === 0) {
    throw new Error(MODELS_ALL_UNKNOWN_AFTER_FILTER);
  }
  const filtered = await filterTranslationModelsAgainstOpenRouterCatalog(resolved, config);
  warnIgnoredUnknownOpenRouterModels(filtered.unknownIds);
  if (filtered.models.length === 0) {
    throw new Error(MODELS_ALL_UNKNOWN_AFTER_FILTER);
  }
  return new LlmClient({
    config: config as I18nConfig,
    ...clientOpts,
    translationModels: filtered.models,
  });
}
