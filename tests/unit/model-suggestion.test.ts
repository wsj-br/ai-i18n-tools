import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { i18nConfigSchema } from "../../src/core/types.js";
import {
  emptyBenchmarkCache,
  ensureBenchmarkCache,
  type BenchmarkCacheFile,
  type BenchmarkFetchImpl,
} from "../../src/core/model-benchmarks.js";
import {
  rankProviderModels,
  resolveSuggestionWeights,
  DEFAULT_QUALITY_WEIGHTS,
  DEFAULT_PRICE_WEIGHTS,
  type RankedModel,
} from "../../src/core/model-suggestion.js";
import { replaceProviderTranslationModels } from "../../src/core/apply-translation-models.js";
import {
  renderSuggestTable,
  runSuggestModels,
  configuredModelRows,
  dominanceHint,
  selectSuggestRows,
} from "../../src/cli/suggest-models.js";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import {
  estimateCostUsd,
  estimateCostWithModelsDev,
  withEstimatedCosts,
} from "../../src/core/usage-stats.js";
import type { ApiCallStatsResult, I18nConfig } from "../../src/core/types.js";
import type { ProviderModelEntry } from "../../src/api/provider-models-catalog.js";

function sampleCache(): BenchmarkCacheFile {
  const cache = emptyBenchmarkCache();
  cache.languagebench.models = {
    alpha: { chrfByBcp47: { en: { sum: 0.9, n: 1 } }, cost: null },
    beta: { chrfByBcp47: { en: { sum: 0.7, n: 1 }, pt: { sum: 0.4, n: 1 } }, cost: null },
    gamma: { chrfByBcp47: {}, cost: null },
    epsilon: { chrfByBcp47: { en: { sum: 0.85, n: 1 } }, cost: 4 },
    "anthropic/claude-haiku-4.5": {
      chrfByBcp47: { en: { sum: 0.88, n: 1 } },
      cost: null,
    },
  };
  cache.arena.models = [
    { model: "alpha", vendor: "test", score: 1400, publishDate: null },
    { model: "beta", vendor: "test", score: 1000, publishDate: null },
    { model: "gamma", vendor: "test", score: 1500, publishDate: null },
  ];
  cache.modelsDev.pricing = {
    delta: { input: 0.2, output: 0.8 },
  };
  return cache;
}

const catalog: ProviderModelEntry[] = [
  { id: "alpha", pricing: { prompt: "0.000003", completion: "0.000015" } },
  { id: "beta", pricing: { prompt: "0.000001", completion: "0.000002" } },
  { id: "gamma", pricing: { prompt: "0.000002", completion: "0.000002" } },
  { id: "delta", pricing: { prompt: "0", completion: "0" } },
  { id: "epsilon" },
  { id: "text-embedding-3-small" },
  { id: "old", expiration_date: "2000-01-01" },
  { id: "claude-haiku-4-5" },
];

describe("rankProviderModels", () => {
  const benchmarks = sampleCache();

  it("ranks quality above price and drops non-chat and expired models", () => {
    const ranked = rankProviderModels({
      provider: "openai",
      catalog,
      benchmarks,
      profile: "quality",
      weights: DEFAULT_QUALITY_WEIGHTS,
      locales: ["en-GB"],
    });
    expect(ranked.map((row) => row.id)).not.toContain("text-embedding-3-small");
    expect(ranked.map((row) => row.id)).not.toContain("old");
    expect(ranked[0]?.id).toBe("alpha");
    expect(ranked.find((row) => row.id === "gamma")?.belowFloor).toBe(true);
    expect(ranked.find((row) => row.id === "gamma")?.chrf).toBeNull();
    const gamma = ranked.findIndex((row) => row.id === "gamma");
    const beta = ranked.findIndex((row) => row.id === "beta");
    expect(gamma).toBeGreaterThan(beta);
  });

  it("lists cheapest Pareto-frontier models first on the price profile", () => {
    const ranked = rankProviderModels({
      provider: "openai",
      catalog,
      benchmarks,
      profile: "price",
      weights: DEFAULT_PRICE_WEIGHTS,
      locales: ["en"],
    });
    expect(ranked[0]?.id).toBe("beta");
    const alpha = ranked.find((row) => row.id === "alpha");
    const beta = ranked.find((row) => row.id === "beta");
    expect(alpha?.index).toBeGreaterThan(beta?.index ?? 0);
    expect(ranked.findIndex((row) => row.id === "alpha")).toBeGreaterThan(
      ranked.findIndex((row) => row.id === "beta")
    );
  });

  it("gives the same index on both profiles and breaks quality ties by blended price", () => {
    const twins: ProviderModelEntry[] = [
      { id: "cheap", pricing: { prompt: "0.000001", completion: "0.000001" } },
      { id: "dear", pricing: { prompt: "0.000010", completion: "0.000010" } },
    ];
    const twinCache = emptyBenchmarkCache();
    twinCache.languagebench.models = {
      cheap: { chrfByBcp47: { en: { sum: 0.8, n: 1 } }, cost: null },
      dear: { chrfByBcp47: { en: { sum: 0.8, n: 1 } }, cost: null },
    };
    twinCache.arena.models = [
      { model: "cheap", vendor: "test", score: 1200, publishDate: null },
      { model: "dear", vendor: "test", score: 1200, publishDate: null },
    ];
    const quality = rankProviderModels({
      provider: "openai",
      catalog: twins,
      benchmarks: twinCache,
      profile: "quality",
      weights: DEFAULT_QUALITY_WEIGHTS,
      locales: ["en"],
    });
    const priced = rankProviderModels({
      provider: "openai",
      catalog: twins,
      benchmarks: twinCache,
      profile: "price",
      weights: DEFAULT_PRICE_WEIGHTS,
      locales: ["en"],
    });
    expect(quality[0]?.id).toBe("cheap");
    expect(quality[1]?.id).toBe("dear");
    expect(quality[0]?.index).toBe(quality[1]?.index);
    expect(priced[0]?.index).toBe(quality[0]?.index);
    expect(priced[1]?.index).toBe(quality[1]?.index);
    expect(quality[0]?.blendedPerMTokens).toBeCloseTo(1);
    expect(quality[1]?.blendedPerMTokens).toBeCloseTo(10);
  });

  it("assigns Pareto layers and dominatedBy on a known staircase", () => {
    const stair: ProviderModelEntry[] = [
      { id: "cheap-ok", pricing: { prompt: "0.0000001", completion: "0.0000001" } },
      { id: "dominated", pricing: { prompt: "0.0000005", completion: "0.0000005" } },
      { id: "mid", pricing: { prompt: "0.000001", completion: "0.000001" } },
      { id: "best", pricing: { prompt: "0.000010", completion: "0.000010" } },
      { id: "unpriced" },
      { id: "weak", pricing: { prompt: "0.00000005", completion: "0.00000005" } },
    ];
    const stairCache = emptyBenchmarkCache();
    stairCache.languagebench.models = {
      "cheap-ok": { chrfByBcp47: { en: { sum: 0.7, n: 1 } }, cost: null },
      dominated: { chrfByBcp47: { en: { sum: 0.7, n: 1 } }, cost: null },
      mid: { chrfByBcp47: { en: { sum: 0.85, n: 1 } }, cost: null },
      best: { chrfByBcp47: { en: { sum: 0.9, n: 1 } }, cost: null },
      unpriced: { chrfByBcp47: { en: { sum: 0.88, n: 1 } }, cost: null },
      weak: { chrfByBcp47: { en: { sum: 0.4, n: 1 } }, cost: null },
    };
    stairCache.arena.models = [
      { model: "cheap-ok", vendor: "test", score: 1000, publishDate: null },
      { model: "dominated", vendor: "test", score: 1000, publishDate: null },
      { model: "mid", vendor: "test", score: 1200, publishDate: null },
      { model: "best", vendor: "test", score: 1400, publishDate: null },
      { model: "unpriced", vendor: "test", score: 1100, publishDate: null },
      { model: "weak", vendor: "test", score: 800, publishDate: null },
    ];
    const priced = rankProviderModels({
      provider: "openai",
      catalog: stair,
      benchmarks: stairCache,
      profile: "price",
      weights: DEFAULT_PRICE_WEIGHTS,
      locales: ["en"],
    });
    expect(priced.map((row) => row.id)).toEqual([
      "cheap-ok",
      "mid",
      "best",
      "dominated",
      "unpriced",
      "weak",
    ]);
    expect(priced.find((row) => row.id === "cheap-ok")?.frontierLayer).toBe(1);
    expect(priced.find((row) => row.id === "mid")?.frontierLayer).toBe(1);
    expect(priced.find((row) => row.id === "best")?.frontierLayer).toBe(1);
    const dominated = priced.find((row) => row.id === "dominated");
    expect(dominated?.frontierLayer).toBe(2);
    expect(dominated?.dominatedBy).toBe("cheap-ok");
    expect(priced.find((row) => row.id === "unpriced")?.frontierLayer).toBeNull();
    expect(priced.find((row) => row.id === "weak")?.belowFloor).toBe(true);
    expect(priced.find((row) => row.id === "weak")?.frontierLayer).toBeNull();
    expect(dominated?.aliasOf).toBeNull();
    const beater = priced.find((row) => row.id === dominated?.dominatedBy);
    expect(beater?.frontierLayer).toBe(1);
  });

  it("treats a dated twin as an alias and does not push the next model down a layer", () => {
    const twins: ProviderModelEntry[] = [
      { id: "gemini-2.5-pro", pricing: { prompt: "0.000003", completion: "0.000003" } },
      {
        id: "gemini-2.5-pro-preview-06-05",
        pricing: { prompt: "0.000003", completion: "0.000003" },
      },
      { id: "opus", pricing: { prompt: "0.000010", completion: "0.000010" } },
    ];
    const twinCache = emptyBenchmarkCache();
    twinCache.languagebench.models = {
      "gemini-2.5-pro": { chrfByBcp47: { en: { sum: 0.9, n: 1 } }, cost: null },
      "gemini-2.5-pro-preview-06-05": {
        chrfByBcp47: { en: { sum: 0.9, n: 1 } },
        cost: null,
      },
      opus: { chrfByBcp47: { en: { sum: 0.8, n: 1 } }, cost: null },
    };
    twinCache.arena.models = [
      { model: "gemini-2.5-pro", vendor: "test", score: 1400, publishDate: null },
      { model: "gemini-2.5-pro-preview-06-05", vendor: "test", score: 1400, publishDate: null },
      { model: "opus", vendor: "test", score: 1300, publishDate: null },
    ];
    const ranked = rankProviderModels({
      provider: "openai",
      catalog: twins,
      benchmarks: twinCache,
      profile: "quality",
      weights: DEFAULT_QUALITY_WEIGHTS,
      locales: ["en"],
    });
    const canonical = ranked.find((row) => row.id === "gemini-2.5-pro");
    const alias = ranked.find((row) => row.id === "gemini-2.5-pro-preview-06-05");
    const opus = ranked.find((row) => row.id === "opus");
    expect(canonical?.aliasOf).toBeNull();
    expect(canonical?.frontierLayer).toBe(1);
    expect(alias?.aliasOf).toBe("gemini-2.5-pro");
    expect(alias?.frontierLayer).toBeNull();
    expect(opus?.frontierLayer).toBe(2);
    expect(opus?.dominatedBy).toBe("gemini-2.5-pro");
    expect(selectSuggestRows(ranked, {}).map((row) => row.id)).toEqual(["gemini-2.5-pro", "opus"]);
    expect(selectSuggestRows(ranked, { keepAliases: true }).map((row) => row.id)).toEqual([
      "gemini-2.5-pro",
      "gemini-2.5-pro-preview-06-05",
      "opus",
    ]);
  });

  it("keeps an exact blended-price and index tie on layer 1", () => {
    const twins: ProviderModelEntry[] = [
      { id: "blend-a", pricing: { prompt: "0.000001", completion: "0.000001" } },
      { id: "blend-b", pricing: { prompt: "0.0000005", completion: "0.0000025" } },
      { id: "dearer", pricing: { prompt: "0.000002", completion: "0.000002" } },
    ];
    const twinCache = emptyBenchmarkCache();
    twinCache.languagebench.models = {
      "blend-a": { chrfByBcp47: { en: { sum: 0.9, n: 1 } }, cost: null },
      "blend-b": { chrfByBcp47: { en: { sum: 0.9, n: 1 } }, cost: null },
      dearer: { chrfByBcp47: { en: { sum: 0.9, n: 1 } }, cost: null },
    };
    twinCache.arena.models = [
      { model: "blend-a", vendor: "test", score: 1400, publishDate: null },
      { model: "blend-b", vendor: "test", score: 1400, publishDate: null },
      { model: "dearer", vendor: "test", score: 1400, publishDate: null },
    ];
    const ranked = rankProviderModels({
      provider: "openai",
      catalog: twins,
      benchmarks: twinCache,
      profile: "quality",
      weights: DEFAULT_QUALITY_WEIGHTS,
      locales: ["en"],
    });
    const blendA = ranked.find((row) => row.id === "blend-a");
    const blendB = ranked.find((row) => row.id === "blend-b");
    const dearer = ranked.find((row) => row.id === "dearer");
    expect(blendA?.index).toBe(blendB?.index);
    expect(blendA?.blendedPerMTokens).toBeCloseTo(blendB?.blendedPerMTokens ?? 0);
    expect(blendA?.aliasOf).toBeNull();
    expect(blendB?.aliasOf).toBeNull();
    expect(blendA?.frontierLayer).toBe(1);
    expect(blendB?.frontierLayer).toBe(1);
    expect(blendA?.dominatedBy).toBeNull();
    expect(blendB?.dominatedBy).toBeNull();
    expect(dearer?.frontierLayer).toBe(2);
    expect(dearer?.dominatedBy).toBe("blend-a");
  });

  it("picks the undated id, then the shorter id, then the alphabetical id", () => {
    const twins: ProviderModelEntry[] = [
      { id: "m-06-05", pricing: { prompt: "0.000001", completion: "0.000001" } },
      { id: "undated-model", pricing: { prompt: "0.000001", completion: "0.000001" } },
      { id: "bb", pricing: { prompt: "0.000002", completion: "0.000002" } },
      { id: "aa", pricing: { prompt: "0.000002", completion: "0.000002" } },
      { id: "long-name", pricing: { prompt: "0.000004", completion: "0.000004" } },
      { id: "short", pricing: { prompt: "0.000004", completion: "0.000004" } },
    ];
    const twinCache = emptyBenchmarkCache();
    const scores: Array<[string, number]> = [
      ["m-06-05", 0.9],
      ["undated-model", 0.9],
      ["bb", 0.85],
      ["aa", 0.85],
      ["long-name", 0.8],
      ["short", 0.8],
    ];
    twinCache.languagebench.models = Object.fromEntries(
      scores.map(([id, chrf]) => [id, { chrfByBcp47: { en: { sum: chrf, n: 1 } }, cost: null }])
    );
    twinCache.arena.models = scores.map(([id, chrf]) => ({
      model: id,
      vendor: "test",
      score: chrf * 1000,
      publishDate: null,
    }));
    const ranked = rankProviderModels({
      provider: "openai",
      catalog: twins,
      benchmarks: twinCache,
      profile: "quality",
      weights: DEFAULT_QUALITY_WEIGHTS,
      locales: ["en"],
    });
    expect(ranked.find((row) => row.id === "m-06-05")?.aliasOf).toBe("undated-model");
    expect(ranked.find((row) => row.id === "undated-model")?.aliasOf).toBeNull();
    expect(ranked.find((row) => row.id === "undated-model")?.frontierLayer).toBe(1);
    expect(ranked.find((row) => row.id === "bb")?.aliasOf).toBe("aa");
    expect(ranked.find((row) => row.id === "bb")?.frontierLayer).toBeNull();
    expect(ranked.find((row) => row.id === "long-name")?.aliasOf).toBe("short");
    expect(ranked.find((row) => row.id === "short")?.aliasOf).toBeNull();
  });

  it("does not alias models that are missing a score or a token price", () => {
    const bare: ProviderModelEntry[] = [{ id: "a" }, { id: "b" }];
    const bareCache = emptyBenchmarkCache();
    bareCache.languagebench.models = {
      a: { chrfByBcp47: { en: { sum: 0.9, n: 1 } }, cost: null },
      b: { chrfByBcp47: { en: { sum: 0.9, n: 1 } }, cost: null },
    };
    bareCache.arena.models = [
      { model: "a", vendor: "test", score: 1400, publishDate: null },
      { model: "b", vendor: "test", score: 1400, publishDate: null },
    ];
    const ranked = rankProviderModels({
      provider: "openai",
      catalog: bare,
      benchmarks: bareCache,
      profile: "quality",
      weights: DEFAULT_QUALITY_WEIGHTS,
      locales: ["en"],
    });
    expect(ranked.find((row) => row.id === "a")?.aliasOf).toBeNull();
    expect(ranked.find((row) => row.id === "b")?.aliasOf).toBeNull();
    expect(selectSuggestRows(ranked, {}).map((row) => row.id)).toEqual(["a", "b"]);
  });

  it("uses models.dev when the catalog price is zero and languagebench cost when both are missing", () => {
    const ranked = rankProviderModels({
      provider: "openai",
      catalog,
      benchmarks,
      profile: "quality",
      weights: DEFAULT_QUALITY_WEIGHTS,
      locales: ["en"],
    });
    const alpha = ranked.find((row) => row.id === "alpha");
    expect(alpha?.blendedPerMTokens).toBeCloseTo(6);
    const delta = ranked.find((row) => row.id === "delta");
    expect(delta?.priceSource).toBe("models.dev");
    expect(delta?.inputPerMTokens).toBeCloseTo(0.2);
    expect(delta?.outputPerMTokens).toBeCloseTo(0.8);
    expect(delta?.blendedPerMTokens).toBeCloseTo(0.35);
    const epsilon = ranked.find((row) => row.id === "epsilon");
    expect(epsilon?.priceSource).toBe("languagebench");
    expect(epsilon?.inputPerMTokens).toBeNull();
    expect(epsilon?.blendedPerMTokens).toBe(4);
    expect(epsilon?.chrf).toBeCloseTo(0.85);
  });

  it("averages ChrF only for the requested locales and applies curated id aliases", () => {
    const portuguese = rankProviderModels({
      provider: "openai",
      catalog,
      benchmarks,
      profile: "quality",
      weights: DEFAULT_QUALITY_WEIGHTS,
      locales: ["pt-BR"],
    });
    expect(portuguese.find((row) => row.id === "alpha")?.chrf).toBeNull();
    expect(portuguese.find((row) => row.id === "beta")?.chrf).toBeCloseTo(0.4);
    const aliased = rankProviderModels({
      provider: "openai",
      catalog,
      benchmarks,
      profile: "quality",
      weights: DEFAULT_QUALITY_WEIGHTS,
      locales: ["en"],
    });
    expect(aliased.find((row) => row.id === "claude-haiku-4-5")?.chrf).toBeCloseTo(0.88);
  });

  it("prints measured ChrF and Arena as an em dash when they are missing", () => {
    const ranked = rankProviderModels({
      provider: "openai",
      catalog,
      benchmarks,
      profile: "quality",
      weights: DEFAULT_QUALITY_WEIGHTS,
      locales: ["en"],
    });
    const gamma = ranked.find((row) => row.id === "gamma");
    expect(gamma).toBeDefined();
    const table = renderSuggestTable(gamma ? [gamma] : []);
    expect(table).toContain("—");
    expect(table).not.toContain("0.350");
    expect(table).not.toContain("0.450");
  });
});

describe("resolveSuggestionWeights", () => {
  it("uses built-in weights when a profile is omitted and normalizes overrides", () => {
    expect(resolveSuggestionWeights(undefined, "price")).toEqual(DEFAULT_PRICE_WEIGHTS);
    expect(DEFAULT_QUALITY_WEIGHTS.chrf).toBeCloseTo(DEFAULT_PRICE_WEIGHTS.chrf);
    expect(DEFAULT_QUALITY_WEIGHTS.arena).toBeCloseTo(DEFAULT_PRICE_WEIGHTS.arena);
    const weights = resolveSuggestionWeights(
      { modelSuggestion: { quality: { chrf: 55, arena: 45 } } },
      "quality"
    );
    expect(weights.chrf).toBeCloseTo(DEFAULT_QUALITY_WEIGHTS.chrf);
    expect(weights.arena).toBeCloseTo(DEFAULT_QUALITY_WEIGHTS.arena);
    expect(weights.qualityFloor).toBe(0.7);
  });

  it("strips a legacy price weight and drops a profile with no remaining score weight", () => {
    const kept = i18nConfigSchema.safeParse({
      sourceLocale: "en",
      modelSuggestion: { quality: { chrf: 0.55, arena: 0.45, price: 0.2 } },
    });
    expect(kept.success).toBe(true);
    if (kept.success) {
      expect(kept.data.modelSuggestion?.quality).toEqual({ chrf: 0.55, arena: 0.45 });
    }
    const dropped = i18nConfigSchema.safeParse({
      sourceLocale: "en",
      modelSuggestion: { price: { chrf: 0, arena: 0, price: 1 } },
    });
    expect(dropped.success).toBe(true);
    if (dropped.success) {
      expect(dropped.data.modelSuggestion).toBeUndefined();
    }
  });
});

describe("ensureBenchmarkCache", () => {
  it("refetches on --refresh and does not keep a source that failed", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-cache-"));
    const cachePath = path.join(dir, "benchmark-scores.json");
    const previous = emptyBenchmarkCache();
    const fetchedAt = new Date().toISOString();
    previous.sources.languagebench.fetchedAt = fetchedAt;
    previous.sources.arena.fetchedAt = fetchedAt;
    previous.sources.modelsDev.fetchedAt = fetchedAt;
    previous.languagebench.models = {
      keep: { chrfByBcp47: { en: { sum: 0.5, n: 1 } }, cost: null },
    };
    previous.arena.models = [{ model: "keep", vendor: "v", score: 10, publishDate: null }];
    previous.modelsDev.pricing = { keep: { input: 1, output: 2 } };
    fs.writeFileSync(cachePath, `${JSON.stringify(previous)}\n`);

    const fetchImpl: BenchmarkFetchImpl = {
      json: async (url) => {
        if (url.includes("results.json")) {
          return [
            { model: "fresh", bcp_47: "en", task: "translation_to", metric: "chrf", score: 0.4 },
          ];
        }
        if (url.includes("models.json")) {
          return [{ id: "fresh", cost: 1 }];
        }
        if (url.includes("models.dev")) {
          return { openai: { models: { fresh: { cost: { input: 0.1, output: 0.2 } } } } };
        }
        throw new Error("arena down");
      },
      buffer: async () => {
        throw new Error("arena buffer should not be fetched");
      },
    };

    const next = await ensureBenchmarkCache(cachePath, { refresh: true, fetchImpl });
    expect(next.arena.models).toEqual([]);
    expect(next.sources.arena.error).toContain("arena down");
    expect(next.languagebench.models.fresh).toBeDefined();
    expect(next.languagebench.models.keep).toBeUndefined();
    expect(next.modelsDev.pricing.fresh?.input).toBeCloseTo(0.1);
  });

  it("reuses a stale slice when a download fails and refresh is off", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-cache-stale-"));
    const cachePath = path.join(dir, "benchmark-scores.json");
    const previous = emptyBenchmarkCache();
    const stale = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    previous.sources.languagebench.fetchedAt = stale;
    previous.sources.arena.fetchedAt = new Date().toISOString();
    previous.sources.modelsDev.fetchedAt = new Date().toISOString();
    previous.languagebench.models = {
      keep: { chrfByBcp47: { en: { sum: 0.5, n: 1 } }, cost: null },
    };
    previous.arena.models = [{ model: "keep", vendor: "v", score: 10, publishDate: null }];
    previous.modelsDev.pricing = { keep: { input: 1, output: 2 } };
    fs.writeFileSync(cachePath, `${JSON.stringify(previous)}\n`);

    const fetchImpl: BenchmarkFetchImpl = {
      json: async () => {
        throw new Error("languagebench down");
      },
      buffer: async () => {
        throw new Error("unused");
      },
    };
    const next = await ensureBenchmarkCache(cachePath, { fetchImpl });
    expect(next.languagebench.models.keep).toBeDefined();
    expect(next.sources.languagebench.error).toContain("languagebench down");
  });
});

describe("replaceProviderTranslationModels", () => {
  const sample = {
    sourceLocale: "en",
    providers: {
      openai: {
        translationModels: ["old"],
        uiModels: ["keep-ui"],
        localeModels: [{ locale: "de", models: ["keep-locale"] }],
      },
    },
  };

  it("replaces only translationModels and keeps a timestamped backup of the previous file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "apply-models-"));
    const configPath = path.join(dir, "ai-i18n-tools.config.json");
    const before = `${JSON.stringify(sample, null, 2)}\n`;
    fs.writeFileSync(configPath, before);
    const now = new Date("2026-10-23T00:20:00.123Z");
    const backupPath = replaceProviderTranslationModels(
      configPath,
      "openai",
      ["alpha", "beta"],
      now
    );
    expect(path.basename(backupPath)).toBe(
      "ai-i18n-tools.config.2026-10-23T00-20-00-123Z.backup.json"
    );
    expect(fs.readFileSync(backupPath, "utf8")).toBe(before);
    const written = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
      providers: {
        openai: { translationModels: string[]; uiModels: string[]; localeModels: unknown[] };
      };
    };
    expect(written.providers.openai.translationModels).toEqual(["alpha", "beta"]);
    expect(written.providers.openai.uiModels).toEqual(["keep-ui"]);
    expect(written.providers.openai.localeModels).toEqual([
      { locale: "de", models: ["keep-locale"] },
    ]);

    const second = replaceProviderTranslationModels(configPath, "openai", ["gamma"], now);
    expect(path.basename(second)).toBe(
      "ai-i18n-tools.config.2026-10-23T00-20-00-123Z-2.backup.json"
    );
    const customPath = path.join(dir, "custom.json");
    fs.writeFileSync(customPath, before);
    const customBackup = replaceProviderTranslationModels(customPath, "openai", ["alpha"], now);
    expect(path.basename(customBackup)).toBe("custom.2026-10-23T00-20-00-123Z.backup.json");
    expect(fs.readFileSync(customBackup, "utf8")).toBe(before);
  });
});

describe("runSuggestModels flags", () => {
  const config = {
    sourceLocale: "en",
    targetLocales: [],
    cacheDir: ".translation-cache",
  } as I18nConfig;

  it("rejects --quality together with --price", async () => {
    const result = await runSuggestModels(config, process.cwd(), "unused.json", {
      quality: true,
      price: true,
    });
    expect(result.exitCode).toBe(1);
  });

  it("rejects --list together with --apply", async () => {
    const result = await runSuggestModels(config, process.cwd(), "unused.json", {
      list: true,
      apply: true,
    });
    expect(result.exitCode).toBe(1);
  });

  it("rejects a non-positive --top", async () => {
    const result = await runSuggestModels(config, process.cwd(), "unused.json", { top: 0 });
    expect(result.exitCode).toBe(1);
  });

  it("rejects a negative --max-price and a negative --min-delta", async () => {
    expect(
      (await runSuggestModels(config, process.cwd(), "unused.json", { maxPrice: -1 })).exitCode
    ).toBe(1);
    expect(
      (await runSuggestModels(config, process.cwd(), "unused.json", { minDelta: Number.NaN }))
        .exitCode
    ).toBe(1);
  });
});

describe("selectSuggestRows", () => {
  function row(
    rank: number,
    index: number,
    blended: number | null,
    extra?: Partial<RankedModel>
  ): RankedModel {
    return {
      id: extra?.id ?? `m${rank}`,
      name: extra?.name ?? extra?.id ?? `m${rank}`,
      rank,
      index,
      chrf: null,
      arenaScore: null,
      inputPerMTokens: extra?.inputPerMTokens ?? null,
      outputPerMTokens: extra?.outputPerMTokens ?? null,
      blendedPerMTokens: blended,
      frontierLayer: extra?.frontierLayer ?? null,
      dominatedBy: extra?.dominatedBy ?? null,
      aliasOf: extra?.aliasOf ?? null,
      belowFloor: false,
      priceSource: blended === null ? null : (extra?.priceSource ?? "catalog"),
    };
  }

  const ranked = [
    98.5, 97.6, 97.6, 96.8, 96.7, 96.2, 96.1, 96.0, 96.0, 95.6, 95.2, 95.1, 95.0, 94.3, 94.0, 93.8,
    92.6, 92.2, 91.7, 90.5,
  ].map((index, i) => row(i + 1, index, i === 0 ? 12 : 1));

  it("keeps a model only when its index drops by at least min-delta", () => {
    expect(selectSuggestRows(ranked, { minDelta: 2 }).map((item) => item.rank)).toEqual([
      1, 6, 15, 19,
    ]);
  });

  it("keeps a later model on a rising index when the gap is at least min-delta", () => {
    const rising = [row(1, 70, 0.2), row(2, 71, 1), row(3, 80, 5)];
    expect(selectSuggestRows(rising, { minDelta: 2 }).map((item) => item.rank)).toEqual([1, 3]);
  });

  it("drops models above the blended price cap, including an unknown price", () => {
    const rows = [row(1, 90, 2), row(2, 80, 2.5), row(3, 70, null), row(4, 60, 1)];
    expect(selectSuggestRows(rows, { maxPrice: 2 }).map((item) => item.rank)).toEqual([1, 4]);
  });

  it("drops a model whose blended price is above the cap even when output is cheap", () => {
    const rows = [
      row(1, 90, (3 * 10 + 0.5) / 4, { inputPerMTokens: 10, outputPerMTokens: 0.5 }),
      row(2, 80, 0.2, { inputPerMTokens: 0.1, outputPerMTokens: 0.5 }),
    ];
    expect(selectSuggestRows(rows, { maxPrice: 1 }).map((item) => item.rank)).toEqual([2]);
  });

  it("keeps a languagebench-only blended price that is at or under the cap", () => {
    const rows = [
      row(1, 90, 4, { priceSource: "languagebench" }),
      row(2, 80, 6, { priceSource: "languagebench" }),
    ];
    expect(selectSuggestRows(rows, { maxPrice: 5 }).map((item) => item.rank)).toEqual([1]);
  });

  it("applies the price cap before the index gap", () => {
    const rows = [row(1, 98.5, 12), row(2, 96.2, 30), row(3, 94, 0.95)];
    expect(selectSuggestRows(rows, { maxPrice: 1, minDelta: 2 }).map((item) => item.rank)).toEqual([
      3,
    ]);
  });

  it("drops alias rows before the price cap, and keeps them when asked", () => {
    const rows = [
      row(1, 97, 2),
      row(2, 97, 2, { aliasOf: "m1" }),
      row(3, 90, 4, { aliasOf: "m1" }),
    ];
    expect(selectSuggestRows(rows, { maxPrice: 3 }).map((item) => item.rank)).toEqual([1]);
    expect(selectSuggestRows(rows, { keepAliases: true }).map((item) => item.rank)).toEqual([
      1, 2, 3,
    ]);
  });
});

describe("dominanceHint", () => {
  function hintRow(id: string, layer: number | null, dominatedBy: string | null): RankedModel {
    return {
      id,
      name: id,
      rank: 1,
      index: 90,
      chrf: null,
      arenaScore: null,
      inputPerMTokens: null,
      outputPerMTokens: null,
      blendedPerMTokens: 1,
      frontierLayer: layer,
      dominatedBy,
      aliasOf: null,
      belowFloor: false,
      priceSource: "catalog",
    };
  }

  it("names the layer-1 models that beat dominated rows, and stays quiet otherwise", () => {
    expect(dominanceHint([hintRow("gemini-2.5-pro", 1, null)])).toBeNull();
    expect(dominanceHint([hintRow("unpriced", null, null)])).toBeNull();
    expect(dominanceHint([hintRow("orphan", 2, null)])).toBeNull();
    expect(
      dominanceHint([hintRow("gemini-2.5-pro", 1, null), hintRow("gpt-5", 3, "gemini-2.5-pro")])
    ).toBe("gpt-5 is beaten on price and quality by gemini-2.5-pro.");
    expect(
      dominanceHint([
        hintRow("gpt-5", 3, "gemini-2.5-pro"),
        hintRow("gpt-5-mini", 2, "deepseek-v4-flash"),
      ])
    ).toBe(
      "gpt-5 and gpt-5-mini are beaten on price and quality by gemini-2.5-pro and deepseek-v4-flash."
    );
    expect(
      dominanceHint([
        hintRow("gpt-5", 3, "gemini-2.5-pro"),
        hintRow("gpt-5-mini", 2, "deepseek-v4-flash"),
        hintRow("glm-4.5-air", 2, "deepseek-v4-flash"),
      ])
    ).toBe(
      "gpt-5, gpt-5-mini, and glm-4.5-air are beaten on price and quality by gemini-2.5-pro and deepseek-v4-flash."
    );
  });
});

describe("suggest-models --list", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  it("keeps configured order and leaves an unmatched id blank", () => {
    const ranked = rankProviderModels({
      provider: "openai",
      catalog,
      benchmarks: sampleCache(),
      profile: "quality",
      weights: DEFAULT_QUALITY_WEIGHTS,
      locales: ["en"],
    });
    const rows = configuredModelRows(ranked, ["beta", "missing-id", "alpha"]);
    expect(rows.map((row) => row.id)).toEqual(["beta", "missing-id", "alpha"]);
    const lines = renderSuggestTable(rows).split("\n");
    expect(lines[1]).toContain("beta");
    expect(lines[2]?.startsWith("—")).toBe(true);
    expect(lines[2]).toContain("missing-id");
    expect(lines[3]).toContain("alpha");
    expect(lines.join("\n")).not.toContain("gamma");
  });

  it("prints the configured models and ignores --top", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "suggest-list-"));
    fs.mkdirSync(path.join(dir, ".translation-cache"), { recursive: true });
    const cacheFile = sampleCache();
    const now = new Date().toISOString();
    cacheFile.sources.languagebench.fetchedAt = now;
    cacheFile.sources.arena.fetchedAt = now;
    cacheFile.sources.modelsDev.fetchedAt = now;
    fs.writeFileSync(
      path.join(dir, ".translation-cache", "benchmark-scores.json"),
      `${JSON.stringify(cacheFile)}\n`
    );
    const config = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["de"],
        cacheDir: ".translation-cache",
        provider: "openai",
        providers: {
          openai: { translationModels: ["beta", "missing-id", "alpha"] },
        },
      })
    );
    const originalFetch = globalThis.fetch;
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        if (url.includes("api.openai.com")) {
          return new Response(JSON.stringify({ data: catalog }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return originalFetch(input, init);
      }
    );
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg?: unknown) => {
      lines.push(String(msg ?? ""));
    });

    const result = await runSuggestModels(config, dir, path.join(dir, "unused.json"), {
      list: true,
      top: 1,
    });

    expect(result.exitCode).toBe(0);
    const table = lines.join("\n");
    const betaAt = table.indexOf("beta");
    const missingAt = table.indexOf("missing-id");
    const alphaAt = table.indexOf("alpha");
    expect(betaAt).toBeGreaterThan(-1);
    expect(missingAt).toBeGreaterThan(betaAt);
    expect(alphaAt).toBeGreaterThan(missingAt);
    expect(table).not.toContain("gamma");
    expect(table).toContain("3 configured model(s)");
  });
});

describe("estimateCostWithModelsDev", () => {
  it("prefers config rates and otherwise uses models.dev split rates", () => {
    const pricing = {
      openai: {
        default: { inputPerMTokens: 1, outputPerMTokens: 2 },
        models: { "gpt-4o": { inputPerMTokens: 3, outputPerMTokens: 4 } },
      },
    };
    const modelsDev = { "gpt-4o-mini": { input: 0.15, output: 0.6 } };
    expect(estimateCostUsd("openai", "gpt-4o", 1_000_000, 0, pricing)).toBeCloseTo(3);
    expect(
      estimateCostWithModelsDev("openai", "gpt-4o", 1_000_000, 0, pricing, modelsDev)
    ).toBeCloseTo(3);
    expect(
      estimateCostWithModelsDev("openai", "other", 1_000_000, 0, pricing, modelsDev)
    ).toBeCloseTo(1);
    expect(
      estimateCostWithModelsDev("openai", "gpt-4o-mini", 1_000_000, 1_000_000, {}, modelsDev)
    ).toBeCloseTo(0.75);
    expect(
      estimateCostWithModelsDev("openai", "missing", 1_000_000, 0, {}, modelsDev)
    ).toBeUndefined();
  });

  it("prices a historical row that stored tokens and no cost", () => {
    const row: ApiCallStatsResult["summary"] = {
      calls: 1,
      acceptedCalls: 1,
      discardedCalls: 0,
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      totalTokens: 2_000_000,
      actualCostUsd: 0,
      callsWithCost: 0,
      callsWithoutCost: 1,
      inputTokensWithoutCost: 1_000_000,
      outputTokensWithoutCost: 1_000_000,
    };
    const stats: ApiCallStatsResult = {
      summary: row,
      byProvider: [{ provider: "openai", ...row }],
      byModel: [{ provider: "openai", model: "gpt-4o-mini", ...row }],
      byOperation: [],
      byLocale: [],
      byDay: [],
      byMonth: [],
    };
    const withEst = withEstimatedCosts(stats, {}, { "gpt-4o-mini": { input: 0.15, output: 0.6 } });
    expect(withEst.byModel[0]?.estimatedCostUsd).toBeCloseTo(0.75);
  });
});
