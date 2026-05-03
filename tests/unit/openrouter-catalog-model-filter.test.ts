import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  filterTranslationModelsAgainstOpenRouterCatalog,
  warnIgnoredUnknownOpenRouterModels,
} from "../../src/cli/openrouter-catalog-model-filter.js";
import type { I18nConfig } from "../../src/core/types.js";

function tinyConfig(): Pick<I18nConfig, "openrouter"> {
  return {
    openrouter: {
      baseUrl: "https://openrouter.ai/api/v1",
      translationModels: ["a"],
      maxTokens: 1,
      temperature: 0,
      requestTimeoutMs: 30_000,
    },
  };
}

describe("filterTranslationModelsAgainstOpenRouterCatalog", () => {
  let prevKey: string | undefined;
  let prevFetch: typeof fetch;

  beforeEach(() => {
    prevKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "k";
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

  it("returns inputs unchanged when OPENROUTER_API_KEY is unset", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const r = await filterTranslationModelsAgainstOpenRouterCatalog(["x", "y"], tinyConfig());
    expect(r).toEqual({ models: ["x", "y"], unknownIds: [] });
  });

  it("filters ids missing from catalog response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [{ id: "good", pricing: { prompt: "0", completion: "0" } }],
        }),
    }) as unknown as typeof fetch;

    const r = await filterTranslationModelsAgainstOpenRouterCatalog(["good", "bad"], tinyConfig());
    expect(r.models).toEqual(["good"]);
    expect(r.unknownIds).toEqual(["bad"]);
  });
});

describe("warnIgnoredUnknownOpenRouterModels", () => {
  it("logs when unknown ids present", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIgnoredUnknownOpenRouterModels(["m1"]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("no-op when empty", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIgnoredUnknownOpenRouterModels([]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
