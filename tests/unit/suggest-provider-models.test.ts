import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyBenchmarkCache, type BenchmarkCacheFile } from "../../src/core/model-benchmarks.js";
import { DEFAULT_PRICE_WEIGHTS } from "../../src/core/model-suggestion.js";
import { suggestProviderModels } from "../../src/core/suggest-provider-models.js";
import type { I18nConfig } from "../../src/core/types.js";

function freshCache(mutate?: (cache: BenchmarkCacheFile) => void): BenchmarkCacheFile {
  const cache = emptyBenchmarkCache();
  const now = new Date().toISOString();
  cache.sources.languagebench.fetchedAt = now;
  cache.sources.arena.fetchedAt = now;
  cache.sources.modelsDev.fetchedAt = now;
  cache.languagebench.models = {
    "chat-a": { chrfByBcp47: { en: { sum: 0.9, n: 1 }, de: { sum: 0.4, n: 1 } }, cost: null },
    "chat-b": { chrfByBcp47: { en: { sum: 0.5, n: 1 }, de: { sum: 0.8, n: 1 } }, cost: null },
  };
  cache.arena.models = [
    { model: "chat-a", vendor: "test", score: 1400, publishDate: null },
    { model: "chat-b", vendor: "test", score: 1000, publishDate: null },
  ];
  cache.modelsDev.pricing = { "chat-b": { input: 0.1, output: 0.2 } };
  mutate?.(cache);
  return cache;
}

function project(cache: BenchmarkCacheFile): { dir: string; config: I18nConfig } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "suggest-provider-"));
  const cacheDir = path.join(dir, ".translation-cache");
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(path.join(cacheDir, "benchmark-scores.json"), `${JSON.stringify(cache)}\n`);
  const config = {
    sourceLocale: "de",
    targetLocales: [],
    cacheDir: ".translation-cache",
    provider: "openai",
    providers: { openai: { translationModels: ["chat-a"] } },
  } as I18nConfig;
  return { dir, config };
}

const catalogBody = JSON.stringify({
  data: [
    { id: "chat-a", name: "Chat A", pricing: { prompt: "0.000003", completion: "0.000012" } },
    { id: "chat-b", name: "Chat B" },
  ],
});

describe("suggestProviderModels", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  it("rejects a missing or blank API key before calling the catalog", async () => {
    const { dir, config } = project(freshCache());
    delete process.env.OPENAI_API_KEY;
    await expect(
      suggestProviderModels({ config, projectRoot: dir, provider: "openai", profile: "quality" })
    ).rejects.toThrow("OPENAI_API_KEY is required");

    process.env.OPENAI_API_KEY = "   ";
    await expect(
      suggestProviderModels({ config, projectRoot: dir, provider: "openai", profile: "quality" })
    ).rejects.toThrow("OPENAI_API_KEY is required");
  });

  it("ranks a keyless provider and trims a bearer token", async () => {
    const { dir, config } = project(freshCache());
    const headers: Record<string, string>[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      headers.push({ ...(init?.headers as Record<string, string>) });
      const url = String(input);
      expect(url.includes("api.openai.com") || url.includes("11434")).toBe(true);
      return new Response(catalogBody, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    process.env.OPENAI_API_KEY = "  sk-test  ";
    const priced = await suggestProviderModels({
      config,
      projectRoot: dir,
      provider: "openai",
      profile: "price",
    });
    expect(priced.profile).toBe("price");
    expect(priced.weights).toEqual(DEFAULT_PRICE_WEIGHTS);
    expect(priced.warnings).toEqual([]);
    expect(priced.models.find((row) => row.id === "chat-a")?.chrf).toBeCloseTo(0.4);
    expect(priced.models.find((row) => row.id === "chat-b")?.chrf).toBeCloseTo(0.8);
    expect(priced.attribution.languagebench.license).toBe("CC-BY-SA-4.0");
    expect(priced.attribution.arena.license).toBe("CC-BY-4.0");
    expect(priced.attribution.modelsDev.license).toBe("MIT");
    expect(priced.attribution.modelsDev.url).toContain("models.dev");
    expect(headers[0]?.Authorization).toBe("Bearer sk-test");

    const ollama = await suggestProviderModels({
      config: {
        ...config,
        provider: "ollama",
        providers: { ollama: { translationModels: ["chat-a"] } },
      } as I18nConfig,
      projectRoot: dir,
      provider: "ollama",
      profile: "quality",
      refresh: true,
    });
    expect(ollama.provider).toBe("ollama");
    expect(ollama.models.map((row) => row.id)).toEqual(
      expect.arrayContaining(["chat-a", "chat-b"])
    );
    expect(headers.at(-1)?.Authorization).toBeUndefined();
  });

  it("sends OpenRouter attribution and surfaces benchmark source errors", async () => {
    const cache = freshCache((next) => {
      next.sources.languagebench.error = "lb down";
      next.sources.arena.error = "arena down";
      next.sources.modelsDev.error = "dev down";
    });
    const { dir, config } = project(cache);
    process.env.OPENROUTER_API_KEY = "sk-or";
    let seen: Record<string, string> = {};
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      seen = { ...(init?.headers as Record<string, string>) };
      expect(String(input)).toContain("openrouter.ai");
      return new Response(catalogBody, { status: 200 });
    });

    const result = await suggestProviderModels({
      config: {
        ...config,
        provider: "openrouter",
        providers: { openrouter: { translationModels: ["chat-a"] } },
      } as I18nConfig,
      projectRoot: dir,
      provider: "openrouter",
      profile: "quality",
    });
    expect(result.warnings).toEqual([
      "languagebench: lb down",
      "Arena: arena down",
      "models.dev: dev down",
    ]);
    expect(seen.Authorization).toBe("Bearer sk-or");
    expect(seen["X-Title"]).toBe("ai-i18n-tools suggest-models");
    expect(seen["HTTP-Referer"]).toContain("github.com/wsj-br/ai-i18n-tools");
  });
});
