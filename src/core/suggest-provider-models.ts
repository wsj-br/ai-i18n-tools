/**
 * Fetch one provider's catalog, load benchmark scores, and rank chat models.
 * Shared by `suggest-models` and the dashboard Models tab.
 */

import {
  fetchProviderModelsCatalog,
  type ProviderModelEntry,
} from "../api/provider-models-catalog.js";
import {
  providerModelsCatalogQuery,
  resolveModelsListRequestAuth,
  resolveProviderSettings,
} from "./llm-providers.js";
import {
  benchmarkCachePath,
  ensureBenchmarkCache,
  type BenchmarkCacheFile,
} from "./model-benchmarks.js";
import {
  rankProviderModels,
  resolveSuggestionWeights,
  type RankedModel,
  type SuggestionProfile,
  type SuggestionWeights,
} from "./model-suggestion.js";
import type { I18nConfig } from "./types.js";

export interface SuggestProviderModelsResult {
  provider: string;
  profile: SuggestionProfile;
  weights: SuggestionWeights;
  models: RankedModel[];
  warnings: string[];
  attribution: {
    languagebench: { license: string; url: string };
    arena: { license: string; url: string };
    modelsDev: { license: string; url: string };
  };
}

export async function suggestProviderModels(opts: {
  config: I18nConfig;
  projectRoot: string;
  provider: string;
  profile: SuggestionProfile;
  refresh?: boolean;
}): Promise<SuggestProviderModelsResult> {
  const settings = resolveProviderSettings(opts.provider, opts.config);
  const apiKey = settings.apiKeyEnv ? (process.env[settings.apiKeyEnv]?.trim() ?? "") : "";
  if (!apiKey && settings.requiresApiKey) {
    throw new Error(`${settings.apiKeyEnv ?? "API key"} is required`);
  }
  const auth = resolveModelsListRequestAuth(opts.provider, apiKey, {
    xTitle: "ai-i18n-tools suggest-models",
  });
  const catalog: Map<string, ProviderModelEntry> = await fetchProviderModelsCatalog({
    baseUrl: settings.baseUrl,
    apiKey: auth.apiKey,
    providerLabel: opts.provider,
    requestTimeoutMs: settings.requestTimeoutMs,
    extraHeaders: auth.extraHeaders,
    query: providerModelsCatalogQuery(settings),
  });
  const cachePath = benchmarkCachePath(opts.projectRoot, opts.config.cacheDir);
  const benchmarks: BenchmarkCacheFile = await ensureBenchmarkCache(cachePath, {
    refresh: opts.refresh === true,
  });
  const warnings: string[] = [];
  if (benchmarks.sources.languagebench.error) {
    warnings.push(`languagebench: ${benchmarks.sources.languagebench.error}`);
  }
  if (benchmarks.sources.arena.error) {
    warnings.push(`Arena: ${benchmarks.sources.arena.error}`);
  }
  if (benchmarks.sources.modelsDev.error) {
    warnings.push(`models.dev: ${benchmarks.sources.modelsDev.error}`);
  }
  const weights = resolveSuggestionWeights(opts.config, opts.profile);
  const locales = [opts.config.sourceLocale, ...opts.config.targetLocales];
  const models = rankProviderModels({
    provider: opts.provider,
    catalog: [...catalog.values()],
    benchmarks,
    profile: opts.profile,
    weights,
    locales,
  });
  return {
    provider: opts.provider,
    profile: opts.profile,
    weights,
    models,
    warnings,
    attribution: {
      languagebench: {
        license: benchmarks.sources.languagebench.license,
        url: benchmarks.sources.languagebench.url,
      },
      arena: {
        license: benchmarks.sources.arena.license,
        url: benchmarks.sources.arena.url,
      },
      modelsDev: {
        license: benchmarks.sources.modelsDev.license,
        url: benchmarks.sources.modelsDev.url,
      },
    },
  };
}
