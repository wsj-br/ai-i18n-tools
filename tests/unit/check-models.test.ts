import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCheckModels } from "../../src/cli/check-models.js";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import type { I18nConfig } from "../../src/core/types.js";

function minimalConfig(translationModels: string[], provider = "openrouter"): I18nConfig {
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
      provider,
      providers: {
        [provider]: {
          translationModels,
          maxTokens: 100,
          temperature: 0,
          requestTimeoutMs: 30_000,
        },
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
    const cfg = minimalConfig(["a"]);
    cfg.providers.openrouter!.translationModels = [];
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

  it("exitCode 1 when a model from uiModels is missing from catalog", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [{ id: "base-model", pricing: { prompt: "0", completion: "0" } }],
        }),
    }) as unknown as typeof fetch;

    const cfg = minimalConfig(["base-model"]);
    cfg.providers.openrouter!.uiModels = ["ui-only-model"];
    const r = await runCheckModels(cfg);
    expect(r.exitCode).toBe(1);
  });

  it("exitCode 1 when a model from localeModels is missing from catalog", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [{ id: "base-model", pricing: { prompt: "0", completion: "0" } }],
        }),
    }) as unknown as typeof fetch;

    const cfg = minimalConfig(["base-model"]);
    cfg.providers.openrouter!.localeModels = [{ locale: "de", models: ["locale-only-model"] }];
    const r = await runCheckModels(cfg);
    expect(r.exitCode).toBe(1);
  });

  it("exitCode 0 when translationModels, uiModels, and localeModels ids all exist", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [
            { id: "base-model", pricing: { prompt: "0", completion: "0" } },
            { id: "ui-only-model", pricing: { prompt: "0", completion: "0" } },
            { id: "locale-only-model", pricing: { prompt: "0", completion: "0" } },
          ],
        }),
    }) as unknown as typeof fetch;

    const cfg = minimalConfig(["base-model"]);
    cfg.providers.openrouter!.uiModels = ["ui-only-model"];
    cfg.providers.openrouter!.localeModels = [{ locale: "de", models: ["locale-only-model"] }];
    const r = await runCheckModels(cfg);
    expect(r.exitCode).toBe(0);
  });

  it("validates configured models against a non-OpenRouter provider's models list", async () => {
    const prevOpenAi = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "sk-openai";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          object: "list",
          data: [{ id: "gpt-4o-mini" }, { id: "gpt-4o" }],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      const okRes = await runCheckModels(minimalConfig(["gpt-4o-mini"], "openai"));
      expect(okRes.exitCode).toBe(0);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.openai.com/v1/models",
        expect.objectContaining({ method: "GET" })
      );

      const missRes = await runCheckModels(minimalConfig(["does-not-exist"], "openai"));
      expect(missRes.exitCode).toBe(1);
    } finally {
      if (prevOpenAi === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = prevOpenAi;
      }
    }
  });

  it("uses Anthropic's native auth headers (x-api-key + anthropic-version), not Bearer", async () => {
    const prevAnthropic = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "sk-ant";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [{ type: "model", id: "claude-opus-4-8", display_name: "Claude Opus 4.8" }],
        }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      const r = await runCheckModels(minimalConfig(["claude-opus-4-8"], "anthropic"));
      expect(r.exitCode).toBe(0);
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.anthropic.com/v1/models");
      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers["x-api-key"]).toBe("sk-ant");
      expect(headers["anthropic-version"]).toBe("2023-06-01");
      expect(headers).not.toHaveProperty("Authorization");
    } finally {
      if (prevAnthropic === undefined) {
        delete process.env.ANTHROPIC_API_KEY;
      } else {
        process.env.ANTHROPIC_API_KEY = prevAnthropic;
      }
    }
  });

  it("checks a keyless provider (ollama) without requiring an API key", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: [{ id: "llama3.1" }] }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const r = await runCheckModels(minimalConfig(["llama3.1"], "ollama"));
    expect(r.exitCode).toBe(0);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).headers).not.toHaveProperty("Authorization");
  });
});
