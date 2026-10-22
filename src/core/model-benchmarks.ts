/**
 * Disk cache for languagebench ChrF, Arena Score, and models.dev prices.
 * Aggregates are stored; the raw languagebench dump is not.
 * Fetches are skipped when `VITEST` is set unless the caller passes `fetchImpl`.
 */

import fs from "fs";
import path from "path";
import { parquetReadObjects } from "hyparquet";
import type { AsyncBuffer } from "hyparquet";
import { normalizeMatchKey } from "./model-match.js";

export const BENCHMARK_CACHE_VERSION = 1;
export const BENCHMARK_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const BENCHMARK_CACHE_FILENAME = "benchmark-scores.json";

export const LANGUAGEBENCH_RESULTS_URL =
  "https://huggingface.co/spaces/fair-forward/languagebench/resolve/main/results/results.json";
export const LANGUAGEBENCH_MODELS_URL =
  "https://huggingface.co/spaces/fair-forward/languagebench/resolve/main/results/models.json";
export const ARENA_DATASET_URL = "https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset";
export const MODELS_DEV_URL = "https://models.dev/api.json";

const ARENA_TREE_URL =
  "https://huggingface.co/api/datasets/lmarena-ai/leaderboard-dataset/tree/main/text";
const ARENA_RESOLVE_BASE =
  "https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/main";

export interface ChrFBucket {
  sum: number;
  n: number;
}

export interface ModelsDevRate {
  input: number | null;
  output: number | null;
}

export interface ArenaModelRow {
  model: string;
  vendor: string;
  score: number;
  publishDate: string | null;
}

export interface BenchmarkSourceMeta {
  url: string;
  license: string;
  attribution: string;
  fetchedAt: string | null;
  error: string | null;
}

export interface LanguagebenchModelAggregate {
  chrfByBcp47: Record<string, ChrFBucket>;
  cost: number | null;
}

export interface BenchmarkCacheFile {
  cacheVersion: number;
  sources: {
    languagebench: BenchmarkSourceMeta;
    arena: BenchmarkSourceMeta;
    modelsDev: BenchmarkSourceMeta;
  };
  languagebench: { models: Record<string, LanguagebenchModelAggregate> };
  arena: { models: ArenaModelRow[] };
  modelsDev: { pricing: Record<string, ModelsDevRate> };
}

export interface BenchmarkFetchImpl {
  json: (url: string, timeoutMs: number) => Promise<unknown>;
  buffer: (url: string, timeoutMs: number) => Promise<ArrayBuffer>;
}

export class BenchmarkUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BenchmarkUnavailableError";
  }
}

const inflight = new Map<string, Promise<BenchmarkCacheFile>>();

export function benchmarkCachePath(projectRoot: string, cacheDir: string): string {
  const dir = path.isAbsolute(cacheDir) ? cacheDir : path.join(projectRoot, cacheDir);
  return path.join(dir, BENCHMARK_CACHE_FILENAME);
}

function sourceMeta(
  url: string,
  license: string,
  attribution: string,
  fetchedAt: string | null,
  error: string | null
): BenchmarkSourceMeta {
  return { url, license, attribution, fetchedAt, error };
}

export function emptyBenchmarkCache(): BenchmarkCacheFile {
  return {
    cacheVersion: BENCHMARK_CACHE_VERSION,
    sources: {
      languagebench: sourceMeta(
        LANGUAGEBENCH_RESULTS_URL,
        "CC-BY-SA-4.0",
        "languagebench (Fair Forward / GIZ)",
        null,
        null
      ),
      arena: sourceMeta(
        ARENA_DATASET_URL,
        "CC-BY-4.0",
        "LMArena Arena Score (text / overall)",
        null,
        null
      ),
      modelsDev: sourceMeta(MODELS_DEV_URL, "MIT", "models.dev", null, null),
    },
    languagebench: { models: {} },
    arena: { models: [] },
    modelsDev: { pricing: {} },
  };
}

function isFresh(meta: BenchmarkSourceMeta | undefined, now: number): boolean {
  if (!meta?.fetchedAt || meta.error) {
    return false;
  }
  const parsed = Date.parse(meta.fetchedAt);
  if (Number.isNaN(parsed)) {
    return false;
  }
  return now - parsed < BENCHMARK_CACHE_TTL_MS;
}

export function readBenchmarkCache(cachePath: string): BenchmarkCacheFile | null {
  try {
    if (!fs.existsSync(cachePath)) {
      return null;
    }
    const parsed = JSON.parse(fs.readFileSync(cachePath, "utf8")) as BenchmarkCacheFile;
    if (parsed?.cacheVersion !== BENCHMARK_CACHE_VERSION) {
      return null;
    }
    if (!parsed.languagebench || !parsed.arena || !parsed.modelsDev || !parsed.sources) {
      return null;
    }
    return parsed;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Could not read benchmark cache ${cachePath}: ${msg}`);
  }
}

function writeBenchmarkCache(cachePath: string, payload: BenchmarkCacheFile): void {
  const dir = path.dirname(cachePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${cachePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload)}\n`, "utf8");
  fs.renameSync(tmp, cachePath);
}

async function defaultJson(url: string, timeoutMs: number): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} for ${url}: ${body.slice(0, 200)}`);
  }
  return response.json() as Promise<unknown>;
}

async function defaultBuffer(url: string, timeoutMs: number): Promise<ArrayBuffer> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} for ${url}: ${body.slice(0, 200)}`);
  }
  return response.arrayBuffer();
}

function networkFetchAllowed(fetchImpl: BenchmarkFetchImpl | undefined): boolean {
  return fetchImpl !== undefined || process.env.VITEST !== "true";
}

function resolveFetch(fetchImpl: BenchmarkFetchImpl | undefined): BenchmarkFetchImpl | null {
  if (fetchImpl) {
    return fetchImpl;
  }
  if (!networkFetchAllowed(undefined)) {
    return null;
  }
  return { json: defaultJson, buffer: defaultBuffer };
}

function finiteNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function aggregateLanguagebench(
  results: unknown,
  models: unknown
): { models: Record<string, LanguagebenchModelAggregate> } {
  if (!Array.isArray(results)) {
    throw new Error("languagebench results.json is not an array");
  }
  if (!Array.isArray(models)) {
    throw new Error("languagebench models.json is not an array");
  }
  const byModel = new Map<string, LanguagebenchModelAggregate>();
  for (const row of results) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const rec = row as Record<string, unknown>;
    if (rec.task !== "translation_from" && rec.task !== "translation_to") {
      continue;
    }
    if (rec.metric !== "chrf") {
      continue;
    }
    const score = finiteNumber(rec.score);
    const model = typeof rec.model === "string" ? rec.model : "";
    const bcp = typeof rec.bcp_47 === "string" ? rec.bcp_47 : "";
    if (score === null || !model || !bcp) {
      continue;
    }
    let agg = byModel.get(model);
    if (!agg) {
      agg = { chrfByBcp47: {}, cost: null };
      byModel.set(model, agg);
    }
    const bucket = agg.chrfByBcp47[bcp] ?? { sum: 0, n: 0 };
    bucket.sum += score;
    bucket.n += 1;
    agg.chrfByBcp47[bcp] = bucket;
  }
  for (const row of models) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const rec = row as Record<string, unknown>;
    const id = typeof rec.id === "string" ? rec.id : "";
    const cost = finiteNumber(rec.cost);
    if (!id || cost === null) {
      continue;
    }
    const agg = byModel.get(id) ?? { chrfByBcp47: {}, cost: null };
    agg.cost = cost;
    byModel.set(id, agg);
  }
  if (byModel.size === 0) {
    throw new Error("languagebench returned no ChrF rows");
  }
  return { models: Object.fromEntries(byModel) };
}

export function buildModelsDevPricing(apiJson: unknown): Record<string, ModelsDevRate> {
  const out: Record<string, ModelsDevRate> = {};
  if (!apiJson || typeof apiJson !== "object") {
    return out;
  }
  for (const provider of Object.values(apiJson as Record<string, unknown>)) {
    if (!provider || typeof provider !== "object") {
      continue;
    }
    const models = (provider as { models?: unknown }).models;
    if (!models || typeof models !== "object") {
      continue;
    }
    for (const [id, model] of Object.entries(models as Record<string, unknown>)) {
      const cost =
        model && typeof model === "object" ? (model as { cost?: unknown }).cost : undefined;
      const input = finiteNumber(
        cost && typeof cost === "object" ? (cost as { input?: unknown }).input : undefined
      );
      const output = finiteNumber(
        cost && typeof cost === "object" ? (cost as { output?: unknown }).output : undefined
      );
      if (input === null && output === null) {
        continue;
      }
      const key = normalizeMatchKey(id);
      if (!key) {
        continue;
      }
      const entry = { input, output };
      const prev = out[key];
      const blended = (3 * (entry.input ?? 0) + (entry.output ?? 0)) / 4;
      const prevBlended = prev ? (3 * (prev.input ?? 0) + (prev.output ?? 0)) / 4 : Infinity;
      if (!prev || blended < prevBlended) {
        out[key] = entry;
      }
    }
  }
  return out;
}

export function pickLatestParquetPath(listing: unknown): string {
  const files = Array.isArray(listing) ? listing : [];
  const latest = files
    .map((row) => {
      if (!row || typeof row !== "object") {
        return "";
      }
      return String((row as { path?: unknown }).path ?? "");
    })
    .filter(
      (p) => /\/latest-\d+-of-\d+\.parquet$/i.test(p) || /^latest-\d+-of-\d+\.parquet$/i.test(p)
    );
  if (latest.length === 0) {
    throw new Error("no latest-*.parquet under text/ in the Arena dataset");
  }
  latest.sort();
  const chosen = latest[latest.length - 1] ?? "";
  return chosen.includes("/") ? chosen : `text/${chosen}`;
}

export function arenaRowsFromParquetObjects(
  rows: readonly Record<string, unknown>[]
): ArenaModelRow[] {
  const models: ArenaModelRow[] = [];
  for (const row of rows) {
    if (String(row.category ?? "").toLowerCase() !== "overall") {
      continue;
    }
    const model = String(row.model_name ?? "").trim();
    const vendor = String(row.organization ?? "").trim();
    const score = finiteNumber(row.rating);
    if (!model || score === null) {
      continue;
    }
    const rawDate = row.leaderboard_publish_date;
    const publishDate =
      typeof rawDate === "string" && rawDate.trim() ? rawDate.trim().slice(0, 10) : null;
    models.push({ model, vendor, score, publishDate });
  }
  return models;
}

function bufferAsAsync(buf: ArrayBuffer): AsyncBuffer {
  return {
    byteLength: buf.byteLength,
    slice: (start: number, end?: number) => buf.slice(start, end ?? buf.byteLength),
  };
}

async function fetchArena(fetchImpl: BenchmarkFetchImpl): Promise<ArenaModelRow[]> {
  const listing = await fetchImpl.json(ARENA_TREE_URL, 30_000);
  const parquetPath = pickLatestParquetPath(listing);
  const buf = await fetchImpl.buffer(`${ARENA_RESOLVE_BASE}/${parquetPath}`, 120_000);
  const rows = await parquetReadObjects({
    file: bufferAsAsync(buf),
    columns: ["model_name", "organization", "rating", "category", "leaderboard_publish_date"],
  });
  const models = arenaRowsFromParquetObjects(rows as Record<string, unknown>[]);
  if (models.length === 0) {
    throw new Error("Arena snapshot contained no overall scores");
  }
  return models;
}

function hasLanguagebench(cache: BenchmarkCacheFile): boolean {
  return Object.keys(cache.languagebench.models).length > 0;
}

function hasArena(cache: BenchmarkCacheFile): boolean {
  return cache.arena.models.length > 0;
}

function assertScoresAvailable(cache: BenchmarkCacheFile): void {
  if (!hasLanguagebench(cache) && !hasArena(cache)) {
    const lb = cache.sources.languagebench.error ?? "no ChrF rows";
    const arena = cache.sources.arena.error ?? "no Arena scores";
    throw new BenchmarkUnavailableError(
      `Cannot rank models: languagebench (${lb}) and Arena (${arena}) are both unavailable.`
    );
  }
}

async function refreshCache(
  cachePath: string,
  previous: BenchmarkCacheFile | null,
  refresh: boolean,
  which: "all" | "modelsDev",
  fetchImpl: BenchmarkFetchImpl | null
): Promise<BenchmarkCacheFile> {
  const next: BenchmarkCacheFile = previous ? structuredClone(previous) : emptyBenchmarkCache();
  const nowIso = new Date().toISOString();
  const now = Date.now();
  const fetcher = fetchImpl;

  const fail = (slot: BenchmarkSourceMeta, error: string, clear: () => void): void => {
    slot.error = error;
    if (refresh) {
      slot.fetchedAt = null;
      clear();
    }
  };

  const skipped = "benchmark download skipped";

  if (which === "all") {
    const needLb = refresh || !isFresh(next.sources.languagebench, now) || !hasLanguagebench(next);
    const needArena = refresh || !isFresh(next.sources.arena, now) || !hasArena(next);
    if (needLb) {
      if (!fetcher) {
        if (!hasLanguagebench(next)) {
          fail(next.sources.languagebench, skipped, () => {
            next.languagebench = { models: {} };
          });
        }
      } else {
        try {
          const [results, models] = await Promise.all([
            fetcher.json(LANGUAGEBENCH_RESULTS_URL, 180_000),
            fetcher.json(LANGUAGEBENCH_MODELS_URL, 60_000),
          ]);
          next.languagebench = aggregateLanguagebench(results, models);
          next.sources.languagebench.fetchedAt = nowIso;
          next.sources.languagebench.error = null;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          fail(next.sources.languagebench, msg, () => {
            next.languagebench = { models: {} };
          });
        }
      }
    }
    if (needArena) {
      if (!fetcher) {
        if (!hasArena(next)) {
          fail(next.sources.arena, skipped, () => {
            next.arena = { models: [] };
          });
        }
      } else {
        try {
          next.arena = { models: await fetchArena(fetcher) };
          next.sources.arena.fetchedAt = nowIso;
          next.sources.arena.error = null;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          fail(next.sources.arena, msg, () => {
            next.arena = { models: [] };
          });
        }
      }
    }
  }

  const needDev =
    which === "modelsDev" || which === "all"
      ? refresh ||
        !isFresh(next.sources.modelsDev, now) ||
        Object.keys(next.modelsDev.pricing).length === 0
      : false;
  if (needDev) {
    if (!fetcher) {
      if (Object.keys(next.modelsDev.pricing).length === 0) {
        fail(next.sources.modelsDev, skipped, () => {
          next.modelsDev = { pricing: {} };
        });
      }
    } else {
      try {
        const apiJson = await fetcher.json(MODELS_DEV_URL, 60_000);
        const pricing = buildModelsDevPricing(apiJson);
        if (Object.keys(pricing).length === 0) {
          throw new Error("models.dev returned no prices");
        }
        next.modelsDev = { pricing };
        next.sources.modelsDev.fetchedAt = nowIso;
        next.sources.modelsDev.error = null;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        fail(next.sources.modelsDev, msg, () => {
          next.modelsDev = { pricing: {} };
        });
      }
    }
  }

  if (which === "all") {
    assertScoresAvailable(next);
  }
  writeBenchmarkCache(cachePath, next);
  return next;
}

export interface EnsureBenchmarkCacheOpts {
  /** Ignore TTL and refetch languagebench, Arena, and models.dev. Failed sources are not filled from the previous file. */
  refresh?: boolean;
  fetchImpl?: BenchmarkFetchImpl;
}

/**
 * Load the benchmark cache, refreshing stale sources. A failed download reuses the
 * previous slice unless `refresh` is set.
 */
export async function ensureBenchmarkCache(
  cachePath: string,
  opts: EnsureBenchmarkCacheOpts = {}
): Promise<BenchmarkCacheFile> {
  const refresh = opts.refresh === true;
  const existing = inflight.get(cachePath);
  if (existing && !refresh) {
    return existing;
  }
  const run = (async () => {
    const previous = readBenchmarkCache(cachePath);
    const now = Date.now();
    const allFresh =
      !refresh &&
      previous !== null &&
      isFresh(previous.sources.languagebench, now) &&
      isFresh(previous.sources.arena, now) &&
      isFresh(previous.sources.modelsDev, now) &&
      hasLanguagebench(previous) &&
      hasArena(previous);
    if (allFresh && previous) {
      return previous;
    }
    const fetcher = resolveFetch(opts.fetchImpl);
    return refreshCache(cachePath, previous, refresh, "all", fetcher);
  })();
  inflight.set(cachePath, run);
  try {
    return await run;
  } finally {
    inflight.delete(cachePath);
  }
}

/** Refresh only the models.dev slice. Does not download languagebench or Arena. */
export async function ensureModelsDevPricing(
  cachePath: string,
  opts: EnsureBenchmarkCacheOpts = {}
): Promise<Record<string, ModelsDevRate>> {
  const previous = readBenchmarkCache(cachePath);
  const now = Date.now();
  if (
    opts.refresh !== true &&
    previous &&
    isFresh(previous.sources.modelsDev, now) &&
    Object.keys(previous.modelsDev.pricing).length > 0
  ) {
    return previous.modelsDev.pricing;
  }
  const fetcher = resolveFetch(opts.fetchImpl);
  if (!fetcher) {
    return previous?.modelsDev.pricing ?? {};
  }
  try {
    const next = await refreshCache(
      cachePath,
      previous,
      opts.refresh === true,
      "modelsDev",
      fetcher
    );
    return next.modelsDev.pricing;
  } catch (e) {
    if (previous && Object.keys(previous.modelsDev.pricing).length > 0 && opts.refresh !== true) {
      return previous.modelsDev.pricing;
    }
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`models.dev pricing unavailable: ${msg}`);
  }
}
