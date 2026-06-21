import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  PROVIDER_PRESETS,
  isPresetProvider,
  resolveActiveProvider,
  resolveApiKey,
  resolveProviderSettings,
  translationModelsForProvider,
  DEFAULT_LLM_MAX_TOKENS,
  DEFAULT_LLM_TEMPERATURE,
  DEFAULT_LLM_REQUEST_TIMEOUT_MS,
} from "../../src/core/llm-providers.js";
import { ConfigValidationError } from "../../src/core/errors.js";

describe("resolveActiveProvider", () => {
  it("returns the explicit provider when set", () => {
    expect(
      resolveActiveProvider({
        provider: "groq",
        providers: { groq: {}, openrouter: {} },
      })
    ).toBe("groq");
  });

  it("returns the single provider when no selector is set", () => {
    expect(resolveActiveProvider({ providers: { openai: {} } })).toBe("openai");
  });

  it("throws when no providers are configured", () => {
    expect(() => resolveActiveProvider({ providers: {} })).toThrow(ConfigValidationError);
  });

  it("throws when multiple providers exist without a selector", () => {
    expect(() => resolveActiveProvider({ providers: { openai: {}, groq: {} } })).toThrow(
      /set a top-level "provider"/
    );
  });

  it("throws when the selector points to an undefined provider", () => {
    expect(() => resolveActiveProvider({ provider: "mistral", providers: { openai: {} } })).toThrow(
      /not defined in providers/
    );
  });
});

describe("resolveProviderSettings", () => {
  it("inherits baseUrl and apiKeyEnv from a built-in preset", () => {
    const s = resolveProviderSettings("groq", { providers: { groq: {} } });
    expect(s.baseUrl).toBe(PROVIDER_PRESETS.groq!.baseUrl);
    expect(s.apiKeyEnv).toBe("GROQ_API_KEY");
    expect(s.requiresApiKey).toBe(true);
    expect(s.maxTokens).toBe(DEFAULT_LLM_MAX_TOKENS);
    expect(s.temperature).toBe(DEFAULT_LLM_TEMPERATURE);
    expect(s.requestTimeoutMs).toBe(DEFAULT_LLM_REQUEST_TIMEOUT_MS);
  });

  it("applies per-provider overrides and strips a trailing slash from baseUrl", () => {
    const s = resolveProviderSettings("openai", {
      providers: {
        openai: {
          baseUrl: "https://proxy.example.com/v1/",
          apiKeyEnv: "MY_KEY",
          maxTokens: 4096,
          temperature: 0.5,
          requestTimeoutMs: 1000,
          headers: { "X-Test": "1" },
        },
      },
    });
    expect(s.baseUrl).toBe("https://proxy.example.com/v1");
    expect(s.apiKeyEnv).toBe("MY_KEY");
    expect(s.maxTokens).toBe(4096);
    expect(s.temperature).toBe(0.5);
    expect(s.requestTimeoutMs).toBe(1000);
    expect(s.headers).toEqual({ "X-Test": "1" });
  });

  it("treats ollama as keyless", () => {
    const s = resolveProviderSettings("ollama", { providers: { ollama: {} } });
    expect(s.requiresApiKey).toBe(false);
    expect(s.apiKeyEnv).toBeUndefined();
  });

  it("throws for a non-preset provider without baseUrl", () => {
    expect(() => resolveProviderSettings("myco", { providers: { myco: {} } })).toThrow(
      /has no baseUrl/
    );
  });

  it("supports fully custom OpenAI-compatible providers", () => {
    const s = resolveProviderSettings("myco", {
      providers: { myco: { baseUrl: "https://api.myco.com/v1", apiKeyEnv: "MYCO_API_KEY" } },
    });
    expect(s.baseUrl).toBe("https://api.myco.com/v1");
    expect(s.apiKeyEnv).toBe("MYCO_API_KEY");
    expect(s.requiresApiKey).toBe(true);
  });
});

describe("resolveApiKey", () => {
  const KEY = "TEST_LLM_PROVIDER_KEY";
  let prev: string | undefined;
  beforeEach(() => {
    prev = process.env[KEY];
  });
  afterEach(() => {
    if (prev === undefined) {
      delete process.env[KEY];
    } else {
      process.env[KEY] = prev;
    }
  });

  it("reads the key from the configured env var", () => {
    process.env[KEY] = "secret";
    const s = resolveProviderSettings("openai", {
      providers: { openai: { apiKeyEnv: KEY } },
    });
    expect(resolveApiKey(s)).toBe("secret");
  });

  it("throws when a required key is missing", () => {
    delete process.env[KEY];
    const s = resolveProviderSettings("openai", {
      providers: { openai: { apiKeyEnv: KEY } },
    });
    expect(() => resolveApiKey(s)).toThrow(new RegExp(`${KEY} is required`));
  });

  it("returns empty string for keyless providers", () => {
    const s = resolveProviderSettings("ollama", { providers: { ollama: {} } });
    expect(resolveApiKey(s)).toBe("");
  });
});

describe("translationModelsForProvider / presets", () => {
  it("trims and filters configured models", () => {
    expect(
      translationModelsForProvider(
        { providers: { groq: { translationModels: [" a ", "", "b"] } } },
        "groq"
      )
    ).toEqual(["a", "b"]);
  });

  it("includes the expected built-in providers", () => {
    for (const name of [
      "openrouter",
      "openai",
      "anthropic",
      "gemini",
      "deepseek",
      "cerebras",
      "groq",
      "mistral",
      "xai",
      "nvidia",
      "alibaba",
      "apifun",
      "ollama",
    ]) {
      expect(isPresetProvider(name)).toBe(true);
    }
    expect(isPresetProvider("myco")).toBe(false);
  });
});
