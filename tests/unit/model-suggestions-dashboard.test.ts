import fs from "fs";
import os from "os";
import path from "path";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TranslationCache } from "../../src/core/cache.js";
import { createTranslationDashboardApp } from "../../src/server/translation-dashboard.js";
import { emptyBenchmarkCache } from "../../src/core/model-benchmarks.js";
import type { I18nConfig } from "../../src/core/types.js";

async function withHttpServer(
  app: ReturnType<typeof createTranslationDashboardApp>,
  fn: (baseUrl: string) => Promise<void>
): Promise<void> {
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });
  const addr = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${addr.port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

describe("dashboard model suggestions", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
  });

  it("lists ranked columns and apply writes only translationModels", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dash-models-"));
    const configPath = path.join(dir, "ai-i18n-tools.config.json");
    const config = {
      sourceLocale: "en",
      targetLocales: ["de"],
      cacheDir: ".translation-cache",
      provider: "openai",
      providers: { openai: { translationModels: ["old"], uiModels: ["keep-ui"] } },
    } as unknown as I18nConfig;
    fs.mkdirSync(path.join(dir, ".translation-cache"), { recursive: true });
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    const cacheFile = emptyBenchmarkCache();
    const now = new Date().toISOString();
    cacheFile.sources.languagebench.fetchedAt = now;
    cacheFile.sources.arena.fetchedAt = now;
    cacheFile.sources.modelsDev.fetchedAt = now;
    cacheFile.languagebench.models = {
      "chat-a": { chrfByBcp47: { en: { sum: 0.8, n: 1 }, de: { sum: 0.7, n: 1 } }, cost: null },
      "chat-b": { chrfByBcp47: { en: { sum: 0.6, n: 1 }, de: { sum: 0.55, n: 1 } }, cost: null },
    };
    cacheFile.arena.models = [
      { model: "chat-a", vendor: "test", score: 1200, publishDate: null },
      { model: "chat-b", vendor: "test", score: 900, publishDate: null },
    ];
    cacheFile.modelsDev.pricing = { "chat-b": { input: 0.1, output: 0.2 } };
    fs.writeFileSync(
      path.join(dir, ".translation-cache", "benchmark-scores.json"),
      `${JSON.stringify(cacheFile)}\n`
    );

    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        if (url.includes("api.openai.com")) {
          return new Response(
            JSON.stringify({
              data: [
                { id: "chat-a", pricing: { prompt: "0.000003", completion: "0.000012" } },
                { id: "chat-b" },
                { id: "text-embedding-3-small" },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return originalFetch(input, init);
      }
    );

    const cache = new TranslationCache(":memory:");
    try {
      const app = createTranslationDashboardApp(cache, {
        cwd: dir,
        sourceLocale: "en",
        targetLocales: ["de"],
        suggestion: {
          config,
          projectRoot: dir,
          configPath,
          activeProvider: "openai",
          providerNames: ["openai"],
        },
      });
      await withHttpServer(app, async (base) => {
        const listed = await originalFetch(`${base}/api/model-suggestions?priority=quality`);
        expect(listed.status).toBe(200);
        const body = (await listed.json()) as {
          models: Array<{
            id: string;
            chrf: number | null;
            arenaScore: number | null;
            index: number;
          }>;
        };
        const ids = body.models.map((row) => row.id);
        expect(ids).toContain("chat-a");
        expect(ids).not.toContain("text-embedding-3-small");
        const chatB = body.models.find((row) => row.id === "chat-b");
        expect(chatB?.chrf).toBeGreaterThan(0);
        expect(chatB?.arenaScore).toBe(900);
        expect(chatB?.index).toBeGreaterThan(0);

        const capped = await originalFetch(`${base}/api/model-suggestions?maxOutputPrice=1`);
        expect(capped.status).toBe(200);
        const cappedBody = (await capped.json()) as { models: Array<{ id: string }> };
        expect(cappedBody.models.map((row) => row.id)).toEqual(["chat-b"]);

        const gapped = await originalFetch(`${base}/api/model-suggestions?minDelta=1000`);
        expect(gapped.status).toBe(200);
        const gappedBody = (await gapped.json()) as { models: Array<{ id: string; rank: number }> };
        expect(gappedBody.models).toHaveLength(1);
        expect(gappedBody.models[0]?.rank).toBe(1);

        const invalid = await originalFetch(`${base}/api/model-suggestions?minDelta=-1`);
        expect(invalid.status).toBe(400);

        const applied = await originalFetch(`${base}/api/model-suggestions/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "openai", models: ["chat-b", "chat-a"] }),
        });
        expect(applied.status).toBe(200);
        const written = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
          providers: { openai: { translationModels: string[]; uiModels: string[] } };
        };
        expect(written.providers.openai.translationModels).toEqual(["chat-b", "chat-a"]);
        expect(written.providers.openai.uiModels).toEqual(["keep-ui"]);

        cache.recordApiCall({
          provider: "openai",
          model: "chat-b",
          operation: "translate-ui",
          locale: "de",
          outcome: "accepted",
          inputTokens: 1_000_000,
          outputTokens: 1_000_000,
          totalTokens: 2_000_000,
        });
        const usage = await originalFetch(`${base}/api/usage`);
        const usageBody = (await usage.json()) as {
          byModel: Array<{ model: string; estimatedCostUsd?: number }>;
        };
        const row = usageBody.byModel.find((item) => item.model === "chat-b");
        expect(row?.estimatedCostUsd).toBeCloseTo(0.3);
      });
    } finally {
      cache.close();
    }
  });
});
