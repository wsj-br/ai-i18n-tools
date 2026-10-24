/**
 * Deterministic quality / price ranking of one provider's chat models.
 * Weights default to the plan; `modelSuggestion` in config overrides a profile.
 */

import type { ProviderModelEntry } from "../api/provider-models-catalog.js";
import { isExpirationDatePast, modelDisplayName } from "../api/provider-models-catalog.js";
import type { BenchmarkCacheFile, ModelsDevRate } from "./model-benchmarks.js";
import {
  bcp47ForLocales,
  curatedCatalogKeys,
  isChatWorkflowModel,
  keysForArenaModel,
  keysForBenchmarkId,
  keysForCatalogModel,
} from "./model-match.js";
import type { I18nConfig, LlmModelPricing } from "./types.js";

export type SuggestionProfile = "quality" | "price";

export interface SuggestionWeights {
  chrf: number;
  arena: number;
  price: number;
  qualityFloor: number;
}

export const DEFAULT_QUALITY_WEIGHTS: SuggestionWeights = {
  chrf: 0.45,
  arena: 0.35,
  price: 0.20,
  qualityFloor: 0.7,
};

export const DEFAULT_PRICE_WEIGHTS: SuggestionWeights = {
  chrf: 0.35,
  arena: 0.20,
  price: 0.45,
  qualityFloor: 0.6,
};

export type PriceSource = "catalog" | "models.dev" | "languagebench";

export interface RankedModel {
  id: string;
  name: string;
  rank: number;
  /** Weighted score × 100, one decimal. */
  index: number;
  /** Measured languagebench ChrF mean, or null when unmatched. */
  chrf: number | null;
  /** Measured Arena Score, or null when unmatched. */
  arenaScore: number | null;
  inputPerMTokens: number | null;
  outputPerMTokens: number | null;
  belowFloor: boolean;
  priceSource: PriceSource | null;
}

export interface RankProviderModelsOpts {
  provider: string;
  catalog: readonly ProviderModelEntry[];
  benchmarks: BenchmarkCacheFile;
  profile: SuggestionProfile;
  weights?: SuggestionWeights;
  locales: readonly string[];
}

const MISSING_CHRF_STAND_IN = 0.35;
const MISSING_ARENA_STAND_IN = 0.45;

export function resolveSuggestionWeights(
  config: Pick<I18nConfig, "modelSuggestion"> | undefined,
  profile: SuggestionProfile
): SuggestionWeights {
  const defaults = profile === "quality" ? DEFAULT_QUALITY_WEIGHTS : DEFAULT_PRICE_WEIGHTS;
  const override = config?.modelSuggestion?.[profile];
  if (!override) {
    return { ...defaults };
  }
  const sum = override.chrf + override.arena + override.price;
  return {
    chrf: override.chrf / sum,
    arena: override.arena / sum,
    price: override.price / sum,
    qualityFloor: override.qualityFloor ?? defaults.qualityFloor,
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(1, n));
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

function perTokenToPerMillion(raw: string | undefined): number | null {
  if (raw === undefined || raw === "") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n * 1_000_000 : null;
}

function listedPerMillion(value: string | number | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Catalog USD per 1M tokens. A zero or missing rate is unpriced (`null`). */
export function catalogRatesPerMillion(entry: ProviderModelEntry): {
  input: number | null;
  output: number | null;
} | null {
  const pricing = entry.pricing;
  if (!pricing) {
    return null;
  }
  const perTokenInput = perTokenToPerMillion(pricing.prompt);
  const perTokenOutput = perTokenToPerMillion(pricing.completion);
  const hasPerToken = perTokenInput !== null || perTokenOutput !== null;
  const input = hasPerToken ? perTokenInput : listedPerMillion(pricing.input_per_million);
  const output = hasPerToken ? perTokenOutput : listedPerMillion(pricing.output_per_million);
  if ((input ?? 0) <= 0 && (output ?? 0) <= 0) {
    return null;
  }
  return { input, output };
}

function blendedPerMillion(input: number | null, output: number | null): number | null {
  if (input === null && output === null) {
    return null;
  }
  return (3 * (input ?? 0) + (output ?? 0)) / 4;
}

function meanChrf(
  model: { chrfByBcp47: Record<string, { sum: number; n: number }> } | undefined,
  allow: ReadonlySet<string>
): number | null {
  if (!model) {
    return null;
  }
  let sum = 0;
  let n = 0;
  for (const [code, bucket] of Object.entries(model.chrfByBcp47)) {
    if (!allow.has(code) || bucket.n <= 0) {
      continue;
    }
    sum += bucket.sum;
    n += bucket.n;
  }
  return n > 0 ? sum / n : null;
}

interface PricedCandidate {
  id: string;
  name: string;
  chrf: number | null;
  arenaScore: number | null;
  inputPerMTokens: number | null;
  outputPerMTokens: number | null;
  blended: number | null;
  priceSource: PriceSource | null;
}

function lookupModelsDev(
  pricing: Record<string, ModelsDevRate>,
  keys: readonly string[]
): ModelsDevRate | null {
  for (const key of keys) {
    const rate = pricing[key];
    if (!rate) {
      continue;
    }
    if (finiteOrNull(rate.input) === null && finiteOrNull(rate.output) === null) {
      continue;
    }
    return {
      input: finiteOrNull(rate.input),
      output: finiteOrNull(rate.output),
    };
  }
  return null;
}

/** Split models.dev rates for a model id, using the same id keys as suggestions. */
export function modelsDevRateForModel(
  pricing: Record<string, ModelsDevRate>,
  modelId: string
): LlmModelPricing | undefined {
  const rate = lookupModelsDev(pricing, keysForBenchmarkId(modelId));
  if (!rate || (rate.input === null && rate.output === null)) {
    return undefined;
  }
  const usableInput = rate.input !== null && rate.input > 0 ? rate.input : null;
  const usableOutput = rate.output !== null && rate.output > 0 ? rate.output : null;
  if (usableInput === null && usableOutput === null) {
    return undefined;
  }
  return {
    inputPerMTokens: usableInput ?? 0,
    outputPerMTokens: usableOutput ?? 0,
  };
}

function indexCatalog(
  provider: string,
  models: readonly { id: string; name?: string }[]
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const model of models) {
    for (const key of keysForCatalogModel(provider, model)) {
      const list = index.get(key) ?? [];
      if (!list.includes(model.id)) {
        list.push(model.id);
      }
      index.set(key, list);
    }
  }
  return index;
}

function catalogIdsForBenchmark(benchId: string, index: Map<string, string[]>): string[] {
  const ids = new Set<string>();
  for (const key of [...keysForBenchmarkId(benchId), ...curatedCatalogKeys(benchId)]) {
    for (const id of index.get(key) ?? []) {
      ids.add(id);
    }
  }
  return [...ids];
}

/**
 * Rank chat, non-expired catalog models. Missing ChrF sorts below the quality floor.
 * The returned `chrf` and `arenaScore` are measured values only (never the stand-ins).
 */
export function rankProviderModels(opts: RankProviderModelsOpts): RankedModel[] {
  const weights = opts.weights ?? DEFAULT_QUALITY_WEIGHTS;
  const allow = new Set(bcp47ForLocales(opts.locales));
  const chat = opts.catalog.filter((entry) => {
    if (!entry.id.trim()) {
      return false;
    }
    if (isExpirationDatePast(entry.expiration_date)) {
      return false;
    }
    const name = modelDisplayName(entry);
    return isChatWorkflowModel({ id: entry.id, ...(name ? { name } : {}) });
  });
  const index = indexCatalog(
    opts.provider,
    chat.map((entry) => {
      const name = modelDisplayName(entry);
      return { id: entry.id, ...(name ? { name } : {}) };
    })
  );

  const chrfById = new Map<string, number>();
  const lbCostById = new Map<string, number>();
  for (const [benchId, agg] of Object.entries(opts.benchmarks.languagebench.models)) {
    const chrf = meanChrf(agg, allow);
    for (const catalogId of catalogIdsForBenchmark(benchId, index)) {
      if (chrf !== null) {
        const prev = chrfById.get(catalogId);
        if (prev === undefined || chrf > prev) {
          chrfById.set(catalogId, chrf);
        }
      }
      if (agg.cost !== null && agg.cost > 0 && !lbCostById.has(catalogId)) {
        lbCostById.set(catalogId, agg.cost);
      }
    }
  }

  const arenaByKey = new Map<string, { score: number }>();
  for (const row of opts.benchmarks.arena.models) {
    for (const key of keysForArenaModel(row)) {
      const prev = arenaByKey.get(key);
      if (!prev || row.score > prev.score) {
        arenaByKey.set(key, { score: row.score });
      }
    }
  }

  const candidates: PricedCandidate[] = chat.map((entry) => {
    const name = modelDisplayName(entry);
    const keys = keysForCatalogModel(opts.provider, {
      id: entry.id,
      ...(name ? { name } : {}),
    });
    let arenaScore: number | null = null;
    for (const key of keys) {
      const arena = arenaByKey.get(key);
      if (arena && (arenaScore === null || arena.score > arenaScore)) {
        arenaScore = arena.score;
      }
    }
    const catalog = catalogRatesPerMillion(entry);
    const dev = lookupModelsDev(opts.benchmarks.modelsDev.pricing, keys);
    const devBlended = dev ? blendedPerMillion(dev.input, dev.output) : null;
    const lbCost = lbCostById.get(entry.id) ?? null;
    let input: number | null = null;
    let output: number | null = null;
    let blended: number | null = null;
    let priceSource: PriceSource | null = null;
    if (catalog && ((catalog.input ?? 0) > 0 || (catalog.output ?? 0) > 0)) {
      input = catalog.input;
      output = catalog.output;
      blended = blendedPerMillion(input, output);
      priceSource = "catalog";
    } else if (dev && devBlended !== null && devBlended > 0) {
      input = dev.input;
      output = dev.output;
      blended = devBlended;
      priceSource = "models.dev";
    } else if (lbCost !== null && lbCost > 0) {
      blended = lbCost;
      priceSource = "languagebench";
    }
    return {
      id: entry.id,
      name,
      chrf: chrfById.get(entry.id) ?? null,
      arenaScore,
      inputPerMTokens: input,
      outputPerMTokens: output,
      blended,
      priceSource,
    };
  });

  const chrfVals = candidates.map((row) => row.chrf).filter((v): v is number => v !== null);
  const arenaVals = candidates.map((row) => row.arenaScore).filter((v): v is number => v !== null);
  const priceVals = candidates
    .map((row) => row.blended)
    .filter((v): v is number => v !== null && v >= 0);
  const maxChrF = chrfVals.length > 0 ? Math.max(...chrfVals) : 0;
  const maxArena = arenaVals.length > 0 ? Math.max(...arenaVals) : 0;
  const maxPrice = priceVals.length > 0 ? Math.max(...priceVals) : 0;
  const floor = weights.qualityFloor > 0 && maxChrF > 0 ? maxChrF * weights.qualityFloor : 0;
  const unknownPrice = opts.profile === "price" ? 0 : 0.5;

  const scored = candidates.map((row) => {
    const qualityN =
      row.chrf !== null && maxChrF > 0 ? clamp01(row.chrf / maxChrF) : MISSING_CHRF_STAND_IN;
    const intelN =
      row.arenaScore !== null && maxArena > 0
        ? clamp01(row.arenaScore / maxArena)
        : MISSING_ARENA_STAND_IN;
    let priceN = unknownPrice;
    if (row.blended !== null && maxPrice > 0) {
      priceN = clamp01(1 - row.blended / (maxPrice + 1e-9));
      if (row.blended <= 0) {
        priceN = 1;
      }
    }
    const score = weights.chrf * qualityN + weights.arena * intelN + weights.price * priceN;
    const belowFloor = floor > 0 && (row.chrf === null || row.chrf < floor);
    return { row, score, belowFloor };
  });

  scored.sort((a, b) => {
    if (a.belowFloor !== b.belowFloor) {
      return a.belowFloor ? 1 : -1;
    }
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const pa = a.row.blended ?? Number.POSITIVE_INFINITY;
    const pb = b.row.blended ?? Number.POSITIVE_INFINITY;
    return pa - pb;
  });

  return scored.map((item, i) => ({
    id: item.row.id,
    name: item.row.name,
    rank: i + 1,
    index: Math.round(item.score * 1000) / 10,
    chrf: item.row.chrf,
    arenaScore: item.row.arenaScore,
    inputPerMTokens: item.row.inputPerMTokens,
    outputPerMTokens: item.row.outputPerMTokens,
    belowFloor: item.belowFloor,
    priceSource: item.row.priceSource,
  }));
}
