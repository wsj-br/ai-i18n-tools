import fs from "fs";
import os from "os";
import path from "path";
import { parquetReadObjects } from "hyparquet";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  aggregateLanguagebench,
  arenaRowsFromParquetObjects,
  benchmarkCachePath,
  BenchmarkUnavailableError,
  BENCHMARK_CACHE_FILENAME,
  buildModelsDevPricing,
  emptyBenchmarkCache,
  ensureBenchmarkCache,
  ensureModelsDevPricing,
  pickLatestParquetPath,
  readBenchmarkCache,
  type BenchmarkCacheFile,
  type BenchmarkFetchImpl,
} from "../../src/core/model-benchmarks.js";

vi.mock("hyparquet", () => ({
  parquetReadObjects: vi.fn(),
}));

type ParquetFile = {
  byteLength: number;
  slice: (start: number, end?: number) => ArrayBuffer;
};

/** Throw a non-Error so catch sites that stringify unknown failures are exercised. */
function raiseNonError(value: string): never {
  throw value as unknown as Error;
}

function tempCachePath(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-cases-"));
  return path.join(dir, BENCHMARK_CACHE_FILENAME);
}

function writeCache(cachePath: string, cache: BenchmarkCacheFile): void {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, `${JSON.stringify(cache)}\n`);
}

function populatedCache(ageMs = 0): BenchmarkCacheFile {
  const cache = emptyBenchmarkCache();
  const fetchedAt = new Date(Date.now() - ageMs).toISOString();
  cache.sources.languagebench.fetchedAt = fetchedAt;
  cache.sources.arena.fetchedAt = fetchedAt;
  cache.sources.modelsDev.fetchedAt = fetchedAt;
  cache.languagebench.models = {
    keep: { chrfByBcp47: { en: { sum: 0.5, n: 1 } }, cost: 1 },
  };
  cache.arena.models = [{ model: "keep", vendor: "v", score: 10, publishDate: "2026-01-01" }];
  cache.modelsDev.pricing = { keep: { input: 1, output: 2 } };
  return cache;
}

const STALE_MS = 8 * 24 * 60 * 60 * 1000;

function tinyBuffer(): ArrayBuffer {
  const buffer = new ArrayBuffer(4);
  new Uint8Array(buffer).set([1, 2, 3, 4]);
  return buffer;
}

function successHandlers(): Record<string, () => unknown> {
  return {
    "results.json": () => [
      { model: "fresh", bcp_47: "en", task: "translation_to", metric: "chrf", score: 0.4 },
    ],
    "models.json": () => [{ id: "fresh", cost: 1 }],
    "models.dev": () => ({
      openai: { models: { fresh: { cost: { input: 0.1, output: 0.2 } } } },
    }),
    "/tree/": () => [{ path: "text/latest-1-of-1.parquet" }],
  };
}

function scriptedFetch(handlers: Record<string, () => unknown>): BenchmarkFetchImpl {
  return {
    json: async (url: string) => {
      const key = Object.keys(handlers).find((part) => url.includes(part));
      if (!key) {
        throw new Error(`unexpected ${url}`);
      }
      return handlers[key]!();
    },
    buffer: async () => tinyBuffer(),
  };
}

describe("benchmark cache paths and reads", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("joins a relative cache dir and uses an absolute one as-is", () => {
    expect(benchmarkCachePath("/proj", "cache")).toBe(
      path.join("/proj", "cache", BENCHMARK_CACHE_FILENAME)
    );
    const abs = fs.mkdtempSync(path.join(os.tmpdir(), "bench-abs-"));
    expect(benchmarkCachePath("/ignored", abs)).toBe(path.join(abs, BENCHMARK_CACHE_FILENAME));
  });

  it("returns null for a missing file, a stale version, or a partial document", () => {
    const cachePath = tempCachePath();
    expect(readBenchmarkCache(cachePath)).toBeNull();

    writeCache(cachePath, populatedCache());
    const wrongVersion = JSON.parse(fs.readFileSync(cachePath, "utf8")) as { cacheVersion: number };
    wrongVersion.cacheVersion = 99;
    fs.writeFileSync(cachePath, JSON.stringify(wrongVersion));
    expect(readBenchmarkCache(cachePath)).toBeNull();

    fs.writeFileSync(cachePath, JSON.stringify({ cacheVersion: 1, languagebench: { models: {} } }));
    expect(readBenchmarkCache(cachePath)).toBeNull();
  });

  it("throws when the cache file is not JSON, including a non-Error failure", () => {
    const cachePath = tempCachePath();
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, "{");
    expect(() => readBenchmarkCache(cachePath)).toThrow(/Could not read benchmark cache/);

    vi.spyOn(fs, "readFileSync").mockImplementation(() => {
      raiseNonError("disk");
    });
    expect(() => readBenchmarkCache(cachePath)).toThrow(/disk/);
  });
});

describe("aggregateLanguagebench", () => {
  it("sums ChrF buckets, skips bad rows, and attaches cost for a model with no scores", () => {
    const aggregated = aggregateLanguagebench(
      [
        null,
        "nope",
        { task: "summarize", metric: "chrf", model: "m", bcp_47: "en", score: 1 },
        { task: "translation_to", metric: "bleu", model: "m", bcp_47: "en", score: 1 },
        { task: "translation_from", metric: "chrf", model: "m", bcp_47: "en", score: "0.2" },
        { task: "translation_to", metric: "chrf", model: "m", bcp_47: "en", score: 0.3 },
        {
          task: "translation_to",
          metric: "chrf",
          model: "m",
          bcp_47: "de",
          score: Number.POSITIVE_INFINITY,
        },
        { task: "translation_to", metric: "chrf", bcp_47: "en", score: 0.1 },
        { task: "translation_to", metric: "chrf", model: "", bcp_47: "en", score: 0.1 },
        { task: "translation_to", metric: "chrf", model: "m", score: 0.1 },
        { task: "translation_to", metric: "chrf", model: "m", bcp_47: "", score: 0.1 },
        { task: "translation_to", metric: "chrf", model: 4, bcp_47: "en", score: 0.5 },
        { task: "translation_to", metric: "chrf", model: "m", bcp_47: 4, score: 0.5 },
      ],
      [
        null,
        { id: "m", cost: "4" },
        { id: "", cost: 1 },
        { id: 9, cost: 1 },
        { id: "no-cost" },
        { id: "bad-cost", cost: Number.NaN },
        { cost: 3 },
        { id: "only-cost", cost: 2 },
      ]
    );
    expect(aggregated.models.m).toEqual({
      chrfByBcp47: { en: { sum: 0.5, n: 2 } },
      cost: 4,
    });
    expect(aggregated.models["only-cost"]).toEqual({ chrfByBcp47: {}, cost: 2 });
  });

  it("throws when a payload is not an array or contains no ChrF rows", () => {
    expect(() => aggregateLanguagebench({}, [])).toThrow(/results.json is not an array/);
    expect(() => aggregateLanguagebench([], {})).toThrow(/models.json is not an array/);
    expect(() => aggregateLanguagebench([null], [null])).toThrow(/no ChrF rows/);
    expect(
      aggregateLanguagebench([], [{ id: "only-cost", cost: 2 }]).models["only-cost"]?.cost
    ).toBe(2);
  });
});

describe("buildModelsDevPricing", () => {
  it("keeps the cheaper blended rate and skips rows with no usable price", () => {
    expect(buildModelsDevPricing(null)).toEqual({});
    expect(buildModelsDevPricing([])).toEqual({});
    const pricing = buildModelsDevPricing({
      skip: null,
      text: "nope",
      noModels: { name: "x" },
      badModels: { models: null },
      openai: {
        models: {
          "---": { cost: { input: 1, output: 1 } },
          plain: { cost: { input: "0.5", output: "1.5" } },
          "plain-preview": { cost: { input: 9, output: 9 } },
          inputOnly: { cost: { input: 0.2 } },
          "inputOnly-preview": { cost: { input: 3, output: 3 } },
          outputOnly: { cost: { output: 0.4 } },
          "outputOnly-preview": { cost: { input: 8, output: 8 } },
          neither: { cost: {} },
          bad: { cost: { input: "nope", output: "nope" } },
          numericCost: { cost: 5 },
          missingCost: {},
          nullModel: null,
        },
      },
      other: {
        models: {
          cheap: { cost: { input: 1, output: 1 } },
        },
      },
      later: {
        models: {
          cheap: { cost: { input: 0.1, output: 0.1 } },
        },
      },
    });
    expect(pricing.plain).toEqual({ input: 0.5, output: 1.5 });
    expect(pricing.inputonly).toEqual({ input: 0.2, output: null });
    expect(pricing.outputonly).toEqual({ input: null, output: 0.4 });
    expect(pricing.cheap).toEqual({ input: 0.1, output: 0.1 });
    expect(pricing["---"]).toBeUndefined();
    expect(pricing.neither).toBeUndefined();
  });
});

describe("Arena parquet selection", () => {
  it("picks the last sorted latest parquet and prefixes a bare name", () => {
    expect(
      pickLatestParquetPath([
        { path: "text/old.parquet" },
        null,
        "nope",
        { path: 12 },
        { nope: true },
        { path: "text/latest-1-of-3.parquet" },
        { path: "text/latest-3-of-3.parquet" },
        { path: "text/latest-2-of-3.parquet" },
      ])
    ).toBe("text/latest-3-of-3.parquet");
    expect(pickLatestParquetPath([{ path: "latest-1-of-1.parquet" }])).toBe(
      "text/latest-1-of-1.parquet"
    );
    expect(pickLatestParquetPath([{ path: "TEXT/latest-4-of-4.PARQUET" }])).toBe(
      "TEXT/latest-4-of-4.PARQUET"
    );
    expect(() => pickLatestParquetPath(null)).toThrow(/no latest-.*parquet/);
    expect(() => pickLatestParquetPath([])).toThrow(/no latest-.*parquet/);
  });

  it("keeps overall rows and normalizes the publish date", () => {
    expect(
      arenaRowsFromParquetObjects([
        {
          category: "Overall",
          model_name: " Alpha ",
          organization: " Vendor ",
          rating: 1400,
          leaderboard_publish_date: "2026-01-02T00:00:00Z",
        },
        { category: "chat", model_name: "skip", organization: "v", rating: 1 },
        { model_name: "missing-category", organization: "v", rating: 1 },
        { category: "overall", organization: "v", rating: 1 },
        { category: "overall", model_name: "   ", organization: "v", rating: 1 },
        { category: "overall", model_name: "beta", organization: "v", rating: "not-a-number" },
        {
          category: "overall",
          model_name: "gamma",
          rating: "1100",
          leaderboard_publish_date: "   ",
        },
        {
          category: "overall",
          model_name: "delta",
          organization: "v",
          rating: 1000,
          leaderboard_publish_date: 20260101,
        },
      ])
    ).toEqual([
      { model: "Alpha", vendor: "Vendor", score: 1400, publishDate: "2026-01-02" },
      { model: "gamma", vendor: "", score: 1100, publishDate: null },
      { model: "delta", vendor: "v", score: 1000, publishDate: null },
    ]);
  });
});

describe("ensureBenchmarkCache", () => {
  const originalVitest = process.env.VITEST;

  beforeEach(() => {
    vi.mocked(parquetReadObjects).mockImplementation(async (args: unknown) => {
      const file = (args as { file: ParquetFile }).file;
      expect(file.byteLength).toBe(4);
      expect(file.slice(0, 1).byteLength).toBe(1);
      expect(file.slice(0).byteLength).toBe(4);
      return [
        {
          category: "overall",
          model_name: "arena-model",
          organization: "org",
          rating: 1200,
          leaderboard_publish_date: "2026-04-01",
        },
      ];
    });
  });

  afterEach(() => {
    if (originalVitest === undefined) {
      delete process.env.VITEST;
    } else {
      process.env.VITEST = originalVitest;
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns a fresh cache without calling the fetcher", async () => {
    const cachePath = tempCachePath();
    writeCache(cachePath, populatedCache());
    const fetchImpl = scriptedFetch({
      "results.json": () => {
        throw new Error("should not fetch");
      },
    });
    const next = await ensureBenchmarkCache(cachePath, { fetchImpl });
    expect(next.languagebench.models.keep?.cost).toBe(1);
  });

  it("refetches only a stale source when the others are still fresh", async () => {
    const cachePath = tempCachePath();
    const previous = populatedCache();
    previous.sources.arena.fetchedAt = new Date(Date.now() - STALE_MS).toISOString();
    writeCache(cachePath, previous);
    const urls: string[] = [];
    const fetchImpl = scriptedFetch(successHandlers());
    const wrapped: BenchmarkFetchImpl = {
      json: async (url) => {
        urls.push(url);
        return fetchImpl.json(url, 1);
      },
      buffer: (url) => fetchImpl.buffer(url, 1),
    };
    const next = await ensureBenchmarkCache(cachePath, { fetchImpl: wrapped });
    expect(next.languagebench.models.keep).toBeDefined();
    expect(next.arena.models[0]?.model).toBe("arena-model");
    expect(urls.some((url) => url.includes("results.json"))).toBe(false);
    expect(urls.some((url) => url.includes("models.dev"))).toBe(false);
    expect(urls.some((url) => url.includes("/tree/"))).toBe(true);
  });

  it("refetches sources whose timestamps are missing, invalid, or marked failed", async () => {
    const cachePath = tempCachePath();
    const previous = populatedCache();
    previous.sources.languagebench.fetchedAt = null;
    previous.sources.arena.fetchedAt = "not-a-date";
    previous.sources.modelsDev.fetchedAt = new Date().toISOString();
    previous.sources.modelsDev.error = "old failure";
    writeCache(cachePath, previous);
    const next = await ensureBenchmarkCache(cachePath, {
      fetchImpl: scriptedFetch(successHandlers()),
    });
    expect(next.languagebench.models.fresh).toBeDefined();
    expect(next.languagebench.models.keep).toBeUndefined();
    expect(next.arena.models[0]?.model).toBe("arena-model");
    expect(next.modelsDev.pricing.fresh?.input).toBeCloseTo(0.1);
    expect(next.sources.languagebench.error).toBeNull();
  });

  it("keeps a populated cache when downloads are skipped and throws when nothing is stored", async () => {
    const stalePath = tempCachePath();
    writeCache(stalePath, populatedCache(STALE_MS));
    const kept = await ensureBenchmarkCache(stalePath);
    expect(kept.languagebench.models.keep).toBeDefined();
    expect(kept.sources.languagebench.error).toBeNull();
    expect(kept.arena.models).toHaveLength(1);
    expect(kept.modelsDev.pricing.keep?.input).toBe(1);

    const emptyPath = tempCachePath();
    await expect(ensureBenchmarkCache(emptyPath, { refresh: true })).rejects.toBeInstanceOf(
      BenchmarkUnavailableError
    );
    await expect(ensureBenchmarkCache(emptyPath, { refresh: true })).rejects.toThrow(
      /benchmark download skipped/
    );
  });

  it("records string failures and clears those sources on refresh", async () => {
    const cachePath = tempCachePath();
    writeCache(cachePath, populatedCache());
    const fetchImpl = scriptedFetch({
      ...successHandlers(),
      "results.json": () => raiseNonError("lb-string"),
      "models.dev": () => raiseNonError("dev-string"),
    });
    const next = await ensureBenchmarkCache(cachePath, { refresh: true, fetchImpl });
    expect(next.sources.languagebench.error).toBe("lb-string");
    expect(next.languagebench.models).toEqual({});
    expect(next.arena.models[0]?.model).toBe("arena-model");
    expect(next.sources.arena.error).toBeNull();
    expect(next.sources.modelsDev.error).toBe("dev-string");
    expect(next.modelsDev.pricing).toEqual({});
  });

  it("records a non-Error failure from the Arena download", async () => {
    const cachePath = tempCachePath();
    writeCache(cachePath, populatedCache());
    const fetchImpl = scriptedFetch({
      ...successHandlers(),
      "/tree/": () => raiseNonError("arena-string"),
    });
    const next = await ensureBenchmarkCache(cachePath, { refresh: true, fetchImpl });
    expect(next.languagebench.models.fresh).toBeDefined();
    expect(next.sources.arena.error).toBe("arena-string");
    expect(next.arena.models).toEqual([]);
  });

  it("stores an error when the Arena snapshot has no overall scores", async () => {
    const cachePath = tempCachePath();
    writeCache(cachePath, populatedCache());
    vi.mocked(parquetReadObjects).mockResolvedValue([
      { category: "style", model_name: "x", organization: "o", rating: 1 },
    ]);
    const next = await ensureBenchmarkCache(cachePath, {
      refresh: true,
      fetchImpl: scriptedFetch(successHandlers()),
    });
    expect(next.languagebench.models.fresh).toBeDefined();
    expect(next.sources.arena.error).toContain("no overall scores");
    expect(next.arena.models).toEqual([]);
  });

  it("keeps the previous price list when models.dev returns no prices unless refresh is set", async () => {
    const cachePath = tempCachePath();
    writeCache(cachePath, populatedCache(STALE_MS));
    const fetchImpl = scriptedFetch({
      ...successHandlers(),
      "models.dev": () => ({ openai: { models: { x: { cost: { input: "nope" } } } } }),
    });
    const kept = await ensureBenchmarkCache(cachePath, { fetchImpl });
    expect(kept.modelsDev.pricing.keep?.input).toBe(1);
    expect(kept.sources.modelsDev.error).toContain("no prices");

    const cleared = await ensureBenchmarkCache(cachePath, { refresh: true, fetchImpl });
    expect(cleared.modelsDev.pricing).toEqual({});
    expect(cleared.sources.modelsDev.error).toContain("no prices");
  });

  it("shares one in-flight download for the same cache path", async () => {
    const cachePath = tempCachePath();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let resultsCalls = 0;
    const handlers = successHandlers();
    const fetchImpl: BenchmarkFetchImpl = {
      json: async (url) => {
        if (url.includes("results.json")) {
          resultsCalls += 1;
          await gate;
        }
        return scriptedFetch(handlers).json(url, 1);
      },
      buffer: () => scriptedFetch(handlers).buffer("parquet", 1),
    };
    try {
      const first = ensureBenchmarkCache(cachePath, { fetchImpl });
      const second = ensureBenchmarkCache(cachePath, { fetchImpl });
      expect(resultsCalls).toBe(1);
      release();
      const [a, b] = await Promise.all([first, second]);
      expect(a).toBe(b);
      expect(a.languagebench.models.fresh).toBeDefined();
    } finally {
      release();
    }
  });

  it("uses global fetch when tests are allowed to download", async () => {
    const cachePath = tempCachePath();
    delete process.env.VITEST;
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("results.json")) {
        return new Response(
          JSON.stringify([
            { model: "fresh", bcp_47: "en", task: "translation_to", metric: "chrf", score: 0.4 },
          ]),
          { status: 200 }
        );
      }
      if (url.includes("models.json")) {
        return new Response(JSON.stringify([{ id: "fresh", cost: 1 }]), { status: 200 });
      }
      if (url.includes("/tree/")) {
        return new Response(JSON.stringify([{ path: "text/latest-1-of-1.parquet" }]), {
          status: 200,
        });
      }
      if (url.includes(".parquet")) {
        return new Response(new Uint8Array(tinyBuffer()), { status: 200 });
      }
      if (url.includes("models.dev")) {
        return new Response(
          JSON.stringify({
            openai: { models: { fresh: { cost: { input: 0.1, output: 0.2 } } } },
          }),
          { status: 200 }
        );
      }
      return new Response("missing", { status: 404 });
    });
    const next = await ensureBenchmarkCache(cachePath);
    expect(next.languagebench.models.fresh?.cost).toBe(1);
    expect(next.arena.models[0]?.model).toBe("arena-model");
    expect(next.modelsDev.pricing.fresh?.output).toBeCloseTo(0.2);
  });

  it("records HTTP error bodies from the default downloader", async () => {
    const cachePath = tempCachePath();
    delete process.env.VITEST;
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("results.json")) {
        return new Response("lb-down-body", { status: 502 });
      }
      if (url.includes("models.json")) {
        return new Response("[]", { status: 200 });
      }
      if (url.includes("/tree/")) {
        return new Response(JSON.stringify([{ path: "text/latest-1-of-1.parquet" }]), {
          status: 200,
        });
      }
      if (url.includes(".parquet")) {
        return {
          ok: false,
          status: 500,
          text: () => Promise.reject(new Error("unreadable")),
          arrayBuffer: async () => new ArrayBuffer(0),
        } as Response;
      }
      if (url.includes("models.dev")) {
        return new Response(
          JSON.stringify({ openai: { models: { fresh: { cost: { input: 1, output: 2 } } } } }),
          { status: 200 }
        );
      }
      return new Response("missing", { status: 404 });
    });
    await expect(ensureBenchmarkCache(cachePath)).rejects.toThrow(/lb-down-body/);
    await expect(ensureBenchmarkCache(cachePath)).rejects.toThrow(/HTTP 500/);
  });

  it("uses an empty body when an error response cannot be read", async () => {
    const cachePath = tempCachePath();
    delete process.env.VITEST;
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("results.json") || url.includes("models.json")) {
        return {
          ok: false,
          status: 503,
          text: () => Promise.reject(new Error("no body")),
          json: async () => ({}),
        } as Response;
      }
      if (url.includes("/tree/")) {
        return new Response(JSON.stringify([{ path: "latest-1-of-1.parquet" }]), { status: 200 });
      }
      if (url.includes(".parquet")) {
        return new Response("arena-body", { status: 500 });
      }
      return new Response(
        JSON.stringify({ openai: { models: { fresh: { cost: { input: 1, output: 1 } } } } }),
        { status: 200 }
      );
    });
    await expect(ensureBenchmarkCache(cachePath)).rejects.toThrow(/HTTP 503/);
    await expect(ensureBenchmarkCache(cachePath)).rejects.toThrow(/arena-body/);
  });
});

describe("ensureModelsDevPricing", () => {
  const originalVitest = process.env.VITEST;

  afterEach(() => {
    if (originalVitest === undefined) {
      delete process.env.VITEST;
    } else {
      process.env.VITEST = originalVitest;
    }
    vi.restoreAllMocks();
  });

  it("returns a fresh price list without downloading", async () => {
    const cachePath = tempCachePath();
    writeCache(cachePath, populatedCache());
    const fetchImpl = scriptedFetch({
      "models.dev": () => {
        throw new Error("should not fetch");
      },
    });
    await expect(ensureModelsDevPricing(cachePath, { fetchImpl })).resolves.toMatchObject({
      keep: { input: 1, output: 2 },
    });
  });

  it("updates a stale price list without downloading scores", async () => {
    const cachePath = tempCachePath();
    const previous = populatedCache(STALE_MS);
    writeCache(cachePath, previous);
    const fetchImpl = scriptedFetch({
      "models.dev": () => ({
        openai: { models: { fresh: { cost: { input: 0.3, output: 0.4 } } } },
      }),
      "results.json": () => {
        throw new Error("scores should stay on disk");
      },
    });
    const pricing = await ensureModelsDevPricing(cachePath, { fetchImpl });
    expect(pricing.fresh?.input).toBeCloseTo(0.3);
    const stored = readBenchmarkCache(cachePath);
    expect(stored?.languagebench.models.keep).toBeDefined();
    expect(stored?.arena.models).toHaveLength(1);
  });

  it("fetches when the price list is empty even if the timestamp is fresh", async () => {
    const cachePath = tempCachePath();
    const previous = populatedCache();
    previous.modelsDev.pricing = {};
    writeCache(cachePath, previous);
    const fetchImpl = scriptedFetch({
      "models.dev": () => ({
        openai: { models: { fresh: { cost: { input: 0.5, output: 0.6 } } } },
      }),
    });
    const pricing = await ensureModelsDevPricing(cachePath, { fetchImpl });
    expect(pricing.fresh?.output).toBeCloseTo(0.6);
  });

  it("returns the previous prices or an empty map when download is skipped", async () => {
    expect(await ensureModelsDevPricing(tempCachePath())).toEqual({});
    const cachePath = tempCachePath();
    writeCache(cachePath, populatedCache(STALE_MS));
    expect((await ensureModelsDevPricing(cachePath)).keep?.input).toBe(1);
  });

  it("returns the previous prices when saving the refresh fails and refresh is off", async () => {
    const cachePath = tempCachePath();
    writeCache(cachePath, populatedCache(STALE_MS));
    const fetchImpl = scriptedFetch(successHandlers());
    vi.spyOn(fs, "renameSync").mockImplementation(() => {
      throw new Error("rename failed");
    });
    await expect(ensureModelsDevPricing(cachePath, { fetchImpl })).resolves.toMatchObject({
      keep: { input: 1, output: 2 },
    });
  });

  it("throws when the refresh cannot be saved and there is nothing to reuse", async () => {
    const fetchImpl = scriptedFetch(successHandlers());
    vi.spyOn(fs, "renameSync").mockImplementation(() => {
      throw new Error("rename failed");
    });
    await expect(ensureModelsDevPricing(tempCachePath(), { fetchImpl })).rejects.toThrow(
      /models.dev pricing unavailable: rename failed/
    );

    const emptyPricing = tempCachePath();
    const previous = populatedCache(STALE_MS);
    previous.modelsDev.pricing = {};
    writeCache(emptyPricing, previous);
    await expect(ensureModelsDevPricing(emptyPricing, { fetchImpl })).rejects.toThrow(
      /models.dev pricing unavailable/
    );

    const refreshPath = tempCachePath();
    writeCache(refreshPath, populatedCache(STALE_MS));
    vi.mocked(fs.renameSync).mockImplementation(() => {
      raiseNonError("rename-string");
    });
    await expect(ensureModelsDevPricing(refreshPath, { fetchImpl, refresh: true })).rejects.toThrow(
      /rename-string/
    );
  });
});
