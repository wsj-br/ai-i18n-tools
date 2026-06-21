import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runListModels } from "../../src/cli/list-models.js";
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

describe("runListModels", () => {
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
    const r = await runListModels(minimalConfig(["a"]));
    expect(r.exitCode).toBe(1);
  });

  it("lists every model returned by the active provider", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [
            {
              id: "m2",
              name: "Two",
              pricing: { prompt: "1", completion: "2" },
            },
            {
              id: "m1",
              name: "One",
              pricing: { prompt: "0.1", completion: "0.2" },
              expiration_date: null,
            },
          ],
        }),
    }) as unknown as typeof fetch;

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const r = await runListModels(minimalConfig(["m1"]));
    expect(r.exitCode).toBe(0);
    const output = logSpy.mock.calls.map((c) => String(c[0] ?? "")).join("\n");
    expect(output).toContain("2 model(s) available");
    expect(output).toContain("m1");
    expect(output).toContain("m2");
  });

  it("lists models for a non-OpenRouter provider via its models endpoint", async () => {
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
      vi.spyOn(console, "log").mockImplementation(() => {});
      const r = await runListModels(minimalConfig(["gpt-4o-mini"], "openai"));
      expect(r.exitCode).toBe(0);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.openai.com/v1/models",
        expect.objectContaining({ method: "GET" })
      );
    } finally {
      if (prevOpenAi === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = prevOpenAi;
      }
    }
  });

  it("lists models for a keyless provider (ollama) without requiring an API key", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: [{ id: "llama3.1" }] }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    vi.spyOn(console, "log").mockImplementation(() => {});
    const r = await runListModels(minimalConfig(["llama3.1"], "ollama"));
    expect(r.exitCode).toBe(0);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).headers).not.toHaveProperty("Authorization");
  });

  it("exitCode 1 when the provider models request fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "server error",
    }) as unknown as typeof fetch;

    const r = await runListModels(minimalConfig(["m1"]));
    expect(r.exitCode).toBe(1);
  });
});
