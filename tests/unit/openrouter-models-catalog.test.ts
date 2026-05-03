import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchOpenRouterModelsCatalog,
  formatUsdPerMillionTokens,
  isExpirationDatePast,
  parseModelsListResponse,
} from "../../src/api/openrouter-models-catalog.js";

describe("parseModelsListResponse", () => {
  it("builds a map keyed by model id", () => {
    const map = parseModelsListResponse({
      data: [
        {
          id: "a/b",
          pricing: { prompt: "1", completion: "2" },
        },
        {
          id: "c/d",
          name: "CD",
          expiration_date: null,
        },
      ],
    });
    expect(map.size).toBe(2);
    expect(map.get("a/b")?.pricing?.prompt).toBe("1");
    expect(map.get("c/d")?.name).toBe("CD");
  });

  it("throws on invalid shape", () => {
    expect(() => parseModelsListResponse({})).toThrow(/invalid JSON shape/);
    expect(() => parseModelsListResponse({ data: "x" })).toThrow(/invalid JSON shape/);
  });
});

describe("isExpirationDatePast", () => {
  it("returns false for missing or invalid", () => {
    expect(isExpirationDatePast(undefined)).toBe(false);
    expect(isExpirationDatePast(null)).toBe(false);
    expect(isExpirationDatePast("")).toBe(false);
    expect(isExpirationDatePast("not-a-date")).toBe(false);
  });

  it("compares YYYY-MM-DD to UTC today", () => {
    const farPast = "1999-01-01";
    expect(isExpirationDatePast(farPast)).toBe(true);
    const farFuture = "2099-12-31";
    expect(isExpirationDatePast(farFuture)).toBe(false);
  });
});

describe("formatUsdPerMillionTokens", () => {
  it("converts OpenRouter per-token strings to USD per 1M tokens (3 decimals)", () => {
    expect(formatUsdPerMillionTokens("0.000000071")).toBe("$0.071");
    expect(formatUsdPerMillionTokens("0.0000001")).toBe("$0.100");
    expect(formatUsdPerMillionTokens("0")).toBe("$0.000");
    expect(formatUsdPerMillionTokens(undefined)).toBe("—");
    expect(formatUsdPerMillionTokens("")).toBe("—");
  });
});

describe("fetchOpenRouterModelsCatalog", () => {
  let prevFetch: typeof fetch;

  beforeEach(() => {
    prevFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = prevFetch;
    vi.restoreAllMocks();
  });

  it("GETs baseUrl/models and parses data", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [{ id: "openai/gpt-4o-mini", pricing: { prompt: "0.5", completion: "1.5" } }],
        }),
    }) as unknown as typeof fetch;

    const map = await fetchOpenRouterModelsCatalog({
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: "sk-test",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/models",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
        }),
        signal: expect.any(AbortSignal),
      })
    );
    expect(map.get("openai/gpt-4o-mini")?.pricing?.completion).toBe("1.5");
  });

  it("throws on HTTP error with body snippet", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"error":{"message":"bad"}}',
    }) as unknown as typeof fetch;

    await expect(
      fetchOpenRouterModelsCatalog({
        baseUrl: "https://openrouter.ai/api/v1/",
        apiKey: "x",
      })
    ).rejects.toThrow(/401/);
  });

  it("throws on invalid JSON body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "not-json",
    }) as unknown as typeof fetch;

    await expect(
      fetchOpenRouterModelsCatalog({
        baseUrl: "https://openrouter.ai/api/v1",
        apiKey: "x",
      })
    ).rejects.toThrow(/invalid JSON/);
  });
});
