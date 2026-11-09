/**
 * Deterministic ranking of one provider's chat models.
 * The index is quality only (ChrF and Arena). `--price` orders by the Pareto frontier.
 * Rows that share ChrF, Arena, and token prices are aliases of the shorter undated id.
 * `modelSuggestion` in config overrides a profile's ChrF/Arena weights and quality floor.
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
  qualityFloor: number;
}

export const DEFAULT_QUALITY_WEIGHTS: SuggestionWeights = {
  chrf: 0.55,
  arena: 0.45,
  qualityFloor: 0.7,
};

export const DEFAULT_PRICE_WEIGHTS: SuggestionWeights = {
  chrf: 0.55,
  arena: 0.45,
  qualityFloor: 0.6,
};

export type PriceSource = "catalog" | "models.dev" | "languagebench";

export interface RankedModel {
  id: string;
  name: string;
  rank: number;
  /** Quality score × 100, one decimal. ChrF and Arena only. */
  index: number;
  /** Measured languagebench ChrF mean, or null when unmatched. */
  chrf: number | null;
  /** Measured Arena Score, or null when unmatched. */
  arenaScore: number | null;
  inputPerMTokens: number | null;
  outputPerMTokens: number | null;
  /** USD per 1M tokens, `(3 × input + output) / 4`; used for ranking and `--max-price`. */
  blendedPerMTokens: number | null;
  /** Pareto layer among priced models that clear the floor; 1 is undominated. */
  frontierLayer: number | null;
  /** Cheapest layer-1 model that dominates this row. */
  dominatedBy: string | null;
  /**
   * Another catalog id with the same ChrF, Arena Score, and token prices.
   * Alias rows stay in the ranked list and are left out of frontier layers.
   */
  aliasOf: string | null;
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
  const sum = override.chrf + override.arena;
  return {
    chrf: override.chrf / sum,
    arena: override.arena / sum,
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

function roundIndex(score: number): number {
  return Math.round(score * 1000) / 10;
}

interface ScoredCandidate {
  row: PricedCandidate;
  index: number;
  belowFloor: boolean;
  frontierLayer: number | null;
  dominatedBy: string | null;
  aliasOf: string | null;
}

/** A calendar date in the id, such as `2024-08-06`, `20241022`, or `preview-06-05`. */
const DATED_MODEL_ID = /(?:^|[^0-9])(?:\d{4}-\d{2}-\d{2}|\d{8}|\d{2}-\d{2})(?:[^0-9]|$)/;

function isDatedModelId(id: string): boolean {
  return DATED_MODEL_ID.test(id);
}

function aliasKey(item: ScoredCandidate): string | null {
  const row = item.row;
  if (
    row.chrf === null ||
    row.arenaScore === null ||
    row.inputPerMTokens === null ||
    row.outputPerMTokens === null
  ) {
    return null;
  }
  return JSON.stringify([row.chrf, row.arenaScore, row.inputPerMTokens, row.outputPerMTokens]);
}

/** Undated, then shorter, then alphabetical. The first id is the one suggestions keep. */
function compareAliasCanonical(a: ScoredCandidate, b: ScoredCandidate): number {
  const aDated = isDatedModelId(a.row.id);
  const bDated = isDatedModelId(b.row.id);
  if (aDated !== bDated) {
    return aDated ? 1 : -1;
  }
  if (a.row.id.length !== b.row.id.length) {
    return a.row.id.length - b.row.id.length;
  }
  return compareById(a, b);
}

/**
 * Mark rows that repeat another row's ChrF, Arena, and token prices.
 * Missing measurements do not count, so unscored models stay separate.
 */
function assignAliases(scored: ScoredCandidate[]): void {
  const groups = new Map<string, ScoredCandidate[]>();
  for (const item of scored) {
    const key = aliasKey(item);
    if (key === null) {
      continue;
    }
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  for (const group of groups.values()) {
    if (group.length < 2) {
      continue;
    }
    group.sort(compareAliasCanonical);
    const canonical = group[0];
    if (!canonical) {
      continue;
    }
    for (const item of group.slice(1)) {
      item.aliasOf = canonical.row.id;
    }
  }
}

function blendedOf(item: ScoredCandidate): number {
  return item.row.blended ?? Number.POSITIVE_INFINITY;
}

function compareById(a: ScoredCandidate, b: ScoredCandidate): number {
  return a.row.id.localeCompare(b.row.id);
}

/**
 * Assign Pareto layers among priced, non-alias models that clear the floor.
 * Walk cheapest to most expensive. A model joins the current front when its
 * rounded index is strictly higher than the best seen so far, or when it
 * matches that index at the same blended price. An exact tie is not dominated.
 * Alias rows are left out and keep a null layer.
 */
function assignFrontier(scored: ScoredCandidate[]): void {
  const remaining = scored.filter(
    (item) =>
      item.aliasOf === null &&
      !item.belowFloor &&
      item.row.blended !== null &&
      item.row.blended >= 0
  );
  const byLayer = new Map<number, ScoredCandidate[]>();
  const leftover = [...remaining];
  let layer = 1;
  while (leftover.length > 0) {
    leftover.sort((a, b) => {
      const priceCmp = blendedOf(a) - blendedOf(b);
      if (priceCmp !== 0) {
        return priceCmp;
      }
      if (b.index !== a.index) {
        return b.index - a.index;
      }
      return compareById(a, b);
    });
    let best = Number.NEGATIVE_INFINITY;
    let bestPrice = Number.NaN;
    const front: ScoredCandidate[] = [];
    for (const item of leftover) {
      const price = blendedOf(item);
      if (item.index > best) {
        front.push(item);
        best = item.index;
        bestPrice = price;
      } else if (item.index === best && price === bestPrice) {
        front.push(item);
      }
    }
    for (const item of front) {
      item.frontierLayer = layer;
    }
    byLayer.set(layer, front);
    const frontIds = new Set(front.map((item) => item.row.id));
    leftover.splice(0, leftover.length, ...leftover.filter((item) => !frontIds.has(item.row.id)));
    layer += 1;
  }

  const layer1 = byLayer.get(1) ?? [];
  for (const item of remaining) {
    if (item.frontierLayer === null || item.frontierLayer <= 1) {
      item.dominatedBy = null;
      continue;
    }
    let best: ScoredCandidate | null = null;
    for (const cand of layer1) {
      if (cand.index < item.index || blendedOf(cand) > blendedOf(item)) {
        continue;
      }
      if (
        best === null ||
        blendedOf(cand) < blendedOf(best) ||
        (blendedOf(cand) === blendedOf(best) && compareById(cand, best) < 0)
      ) {
        best = cand;
      }
    }
    item.dominatedBy = best?.row.id ?? null;
  }
}

function compareQualityOrder(a: ScoredCandidate, b: ScoredCandidate): number {
  if (a.belowFloor !== b.belowFloor) {
    return a.belowFloor ? 1 : -1;
  }
  if (b.index !== a.index) {
    return b.index - a.index;
  }
  const priceCmp = blendedOf(a) - blendedOf(b);
  if (priceCmp !== 0) {
    return priceCmp;
  }
  return compareById(a, b);
}

function comparePriceOrder(a: ScoredCandidate, b: ScoredCandidate): number {
  if (a.belowFloor !== b.belowFloor) {
    return a.belowFloor ? 1 : -1;
  }
  if (!a.belowFloor) {
    const aLayer = a.frontierLayer;
    const bLayer = b.frontierLayer;
    if ((aLayer === null) !== (bLayer === null)) {
      return aLayer === null ? 1 : -1;
    }
    if (aLayer !== null && bLayer !== null) {
      if (aLayer !== bLayer) {
        return aLayer - bLayer;
      }
      const priceCmp = blendedOf(a) - blendedOf(b);
      if (priceCmp !== 0) {
        return priceCmp;
      }
      if (b.index !== a.index) {
        return b.index - a.index;
      }
      return compareById(a, b);
    }
    if (b.index !== a.index) {
      return b.index - a.index;
    }
    return compareById(a, b);
  }
  if (b.index !== a.index) {
    return b.index - a.index;
  }
  const priceCmp = blendedOf(a) - blendedOf(b);
  if (priceCmp !== 0) {
    return priceCmp;
  }
  return compareById(a, b);
}

/**
 * Rank chat, non-expired catalog models. The index is ChrF and Arena only.
 * Missing ChrF sorts below the quality floor. The returned `chrf` and `arenaScore`
 * are measured values only (never the stand-ins).
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
  const maxChrF = chrfVals.length > 0 ? Math.max(...chrfVals) : 0;
  const maxArena = arenaVals.length > 0 ? Math.max(...arenaVals) : 0;
  const floor = weights.qualityFloor > 0 && maxChrF > 0 ? maxChrF * weights.qualityFloor : 0;

  const scored: ScoredCandidate[] = candidates.map((row) => {
    const qualityN =
      row.chrf !== null && maxChrF > 0 ? clamp01(row.chrf / maxChrF) : MISSING_CHRF_STAND_IN;
    const intelN =
      row.arenaScore !== null && maxArena > 0
        ? clamp01(row.arenaScore / maxArena)
        : MISSING_ARENA_STAND_IN;
    const score = weights.chrf * qualityN + weights.arena * intelN;
    const belowFloor = floor > 0 && (row.chrf === null || row.chrf < floor);
    return {
      row,
      index: roundIndex(score),
      belowFloor,
      frontierLayer: null,
      dominatedBy: null,
      aliasOf: null,
    };
  });

  assignAliases(scored);
  assignFrontier(scored);
  scored.sort(opts.profile === "price" ? comparePriceOrder : compareQualityOrder);

  return scored.map((item, i) => ({
    id: item.row.id,
    name: item.row.name,
    rank: i + 1,
    index: item.index,
    chrf: item.row.chrf,
    arenaScore: item.row.arenaScore,
    inputPerMTokens: item.row.inputPerMTokens,
    outputPerMTokens: item.row.outputPerMTokens,
    blendedPerMTokens: item.row.blended,
    frontierLayer: item.frontierLayer,
    dominatedBy: item.dominatedBy,
    aliasOf: item.aliasOf,
    belowFloor: item.belowFloor,
    priceSource: item.row.priceSource,
  }));
}
