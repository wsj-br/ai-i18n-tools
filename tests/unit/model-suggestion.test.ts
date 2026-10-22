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

  it("lets a cheaper model that clears the floor win on the price profile", () => {
    const ranked = rankProviderModels({
      provider: "openai",
      catalog,
      benchmarks,
      profile: "price",
      weights: DEFAULT_PRICE_WEIGHTS,
      locales: ["en"],
    });
    expect(ranked[0]?.id).toBe("beta");
    expect(ranked.find((row) => row.id === "alpha")?.index).toBeLessThan(ranked[0]?.index ?? 0);
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
    const delta = ranked.find((row) => row.id === "delta");
    expect(delta?.priceSource).toBe("models.dev");
    expect(delta?.inputPerMTokens).toBeCloseTo(0.2);
    expect(delta?.outputPerMTokens).toBeCloseTo(0.8);
    const epsilon = ranked.find((row) => row.id === "epsilon");
    expect(epsilon?.priceSource).toBe("languagebench");
    expect(epsilon?.inputPerMTokens).toBeNull();
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
    const weights = resolveSuggestionWeights(
      { modelSuggestion: { quality: { chrf: 45, arena: 35, price: 15 } } },
      "quality"
    );
    expect(weights.chrf).toBeCloseTo(DEFAULT_QUALITY_WEIGHTS.chrf);
    expect(weights.arena).toBeCloseTo(DEFAULT_QUALITY_WEIGHTS.arena);
    expect(weights.price).toBeCloseTo(DEFAULT_QUALITY_WEIGHTS.price);
    expect(weights.qualityFloor).toBe(0.7);
  });

  it("rejects a weight triple that sums to zero", () => {
    const parsed = i18nConfigSchema.safeParse({
      sourceLocale: "en",
      modelSuggestion: { price: { chrf: 0, arena: 0, price: 0 } },
    });
    expect(parsed.success).toBe(false);
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
  it("replaces only translationModels", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "apply-models-"));
    const configPath = path.join(dir, "ai-i18n-tools.config.json");
    fs.writeFileSync(
      configPath,
      `${JSON.stringify(
        {
          sourceLocale: "en",
          providers: {
            openai: {
              translationModels: ["old"],
              uiModels: ["keep-ui"],
              localeModels: [{ locale: "de", models: ["keep-locale"] }],
            },
          },
        },
        null,
        2
      )}\n`
    );
    replaceProviderTranslationModels(configPath, "openai", ["alpha", "beta"]);
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

  it("rejects a negative --max-output-price and a negative --min-delta", async () => {
    expect(
      (await runSuggestModels(config, process.cwd(), "unused.json", { maxOutputPrice: -1 }))
        .exitCode
    ).toBe(1);
    expect(
      (await runSuggestModels(config, process.cwd(), "unused.json", { minDelta: Number.NaN }))
        .exitCode
    ).toBe(1);
  });
});

describe("selectSuggestRows", () => {
  function row(rank: number, index: number, output: number | null): RankedModel {
    return {
      id: `m${rank}`,
      name: `m${rank}`,
      rank,
      index,
      chrf: null,
      arenaScore: null,
      inputPerMTokens: null,
      outputPerMTokens: output,
      belowFloor: false,
      priceSource: output === null ? null : "catalog",
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

  it("drops models above the output price cap, including an unknown price", () => {
    const rows = [row(1, 90, 2), row(2, 80, 2.5), row(3, 70, null), row(4, 60, 1)];
    expect(selectSuggestRows(rows, { maxOutputPrice: 2 }).map((item) => item.rank)).toEqual([1, 4]);
  });

  it("applies the price cap before the index gap", () => {
    const rows = [row(1, 98.5, 12), row(2, 96.2, 30), row(3, 94, 0.95)];
    expect(
      selectSuggestRows(rows, { maxOutputPrice: 1, minDelta: 2 }).map((item) => item.rank)
    ).toEqual([3]);
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
