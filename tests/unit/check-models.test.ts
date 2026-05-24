import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCheckModels } from "../../src/cli/check-models.js";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import type { I18nConfig } from "../../src/core/types.js";

function minimalConfig(translationModels: string[]): I18nConfig {
  return parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en",
      targetLocales: [],
      concurrency: 1,
      batchConcurrency: 1,
      batchSize: 1,
      maxBatchChars: 100,
      cacheDir: ".cache",
      features: {
        translateUIStrings: false,
        translateDocs: false,
        translateJson: false,
        translateSVG: false,
      },
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels,
        maxTokens: 100,
        temperature: 0,
        requestTimeoutMs: 30_000,
      },
    })
  );
}

describe("runCheckModels", () => {
  let prevKey: string | undefined;
  let prevFetch: typeof fetch;

  beforeEach(() => {
    prevKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "sk-test";
    prevFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = prevFetch;
    if (prevKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = prevKey;
    }
    vi.restoreAllMocks();
  });

  it("exitCode 1 when OPENROUTER_API_KEY is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const r = await runCheckModels(minimalConfig(["a"]));
    expect(r.exitCode).toBe(1);
  });

  it("exitCode 1 when translationModels resolve empty", async () => {
    const cfg = minimalConfig([]);
    cfg.openrouter.translationModels = [];
    cfg.openrouter.defaultModel = "";
    cfg.openrouter.fallbackModel = "";
    const r = await runCheckModels(cfg);
    expect(r.exitCode).toBe(1);
  });

  it("exitCode 0 when all configured ids exist and not expired", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [
            {
              id: "m1",
              name: "One",
              pricing: { prompt: "0.1", completion: "0.2" },
              expiration_date: null,
            },
            { id: "m2", pricing: { prompt: "1", completion: "2" } },
          ],
        }),
    }) as unknown as typeof fetch;

    const r = await runCheckModels(minimalConfig(["m1", "m2"]));
    expect(r.exitCode).toBe(0);
  });

  it("exitCode 1 when a model is missing from catalog", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [{ id: "only-this", pricing: { prompt: "0", completion: "0" } }],
        }),
    }) as unknown as typeof fetch;

    const r = await runCheckModels(minimalConfig(["only-this", "missing-id"]));
    expect(r.exitCode).toBe(1);
  });

  it("exitCode 1 when a model is past expiration_date", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [
            {
              id: "old",
              pricing: { prompt: "0", completion: "0" },
              expiration_date: "1999-06-01",
            },
          ],
        }),
    }) as unknown as typeof fetch;

    const r = await runCheckModels(minimalConfig(["old"]));
    expect(r.exitCode).toBe(1);
  });
});
