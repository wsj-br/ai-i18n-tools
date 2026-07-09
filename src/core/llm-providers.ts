import type { I18nConfig, LlmProviderConfig } from "./types.js";
import { ConfigValidationError } from "./errors.js";
import { normalizeLocale } from "./locale-utils.js";

/** Global LLM defaults applied when a provider block (and its preset) do not specify them. */
export const DEFAULT_LLM_MAX_TOKENS = 8192;
export const DEFAULT_LLM_TEMPERATURE = 0.2;
export const DEFAULT_LLM_REQUEST_TIMEOUT_MS = 45_000;

/** Provider key used for OpenRouter-specific behaviour (routing field, catalog/pricing). */
export const OPENROUTER_PROVIDER_KEY = "openrouter";

/** Provider key for Anthropic, whose `GET /models` uses native auth instead of `Authorization: Bearer`. */
export const ANTHROPIC_PROVIDER_KEY = "anthropic";

/** Version header required by Anthropic's native REST API (incl. `GET /v1/models`). */
const ANTHROPIC_VERSION = "2023-06-01";

/** A built-in, ready-to-use OpenAI-compatible provider. */
export interface LlmProviderPreset {
  /** OpenAI-compatible base URL; `/chat/completions` is appended by the client. */
  baseUrl: string;
  /** Environment variable that holds the API key (omitted for keyless providers like Ollama). */
  apiKeyEnv?: string;
  /** When false, no API key is required (e.g. local Ollama). Defaults to true when `apiKeyEnv` is set. */
  requiresApiKey?: boolean;
}

/**
 * Built-in provider presets. A provider listed here works by setting its API key env var and adding
 * `providers.<name>.translationModels` to the config — `baseUrl`/`apiKeyEnv` are inherited from here
 * (and can be overridden per provider in config).
 */
export const PROVIDER_PRESETS: Readonly<Record<string, LlmProviderPreset>> = {
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", apiKeyEnv: "OPENROUTER_API_KEY" },
  openai: { baseUrl: "https://api.openai.com/v1", apiKeyEnv: "OPENAI_API_KEY" },
  anthropic: { baseUrl: "https://api.anthropic.com/v1", apiKeyEnv: "ANTHROPIC_API_KEY" },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKeyEnv: "GOOGLE_API_KEY",
  },
  deepseek: { baseUrl: "https://api.deepseek.com", apiKeyEnv: "DEEPSEEK_API_KEY" },
  cerebras: { baseUrl: "https://api.cerebras.ai/v1", apiKeyEnv: "CEREBRAS_API_KEY" },
  groq: { baseUrl: "https://api.groq.com/openai/v1", apiKeyEnv: "GROQ_API_KEY" },
  mistral: { baseUrl: "https://api.mistral.ai/v1", apiKeyEnv: "MISTRAL_API_KEY" },
  xai: { baseUrl: "https://api.x.ai/v1", apiKeyEnv: "XAI_API_KEY" },
  nvidia: { baseUrl: "https://integrate.api.nvidia.com/v1", apiKeyEnv: "NVIDIA_API_KEY" },
  alibaba: {
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    apiKeyEnv: "ALIBABA_API_KEY",
  },
  apifun: { baseUrl: "https://api.apikey.fun/v1", apiKeyEnv: "APIFUN_API_KEY" },
  ollama: { baseUrl: "http://localhost:11434/v1", requiresApiKey: false },
} as const;

/** True when `name` ships as a built-in preset. */
export function isPresetProvider(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(PROVIDER_PRESETS, name);
}

/** Fully-resolved transport settings for the active provider (preset merged with config overrides). */
export interface ResolvedProviderSettings {
  provider: string;
  baseUrl: string;
  apiKeyEnv?: string;
  requiresApiKey: boolean;
  headers: Record<string, string>;
  maxTokens: number;
  temperature: number;
  requestTimeoutMs: number;
}

type ProviderSelectionConfig = Pick<I18nConfig, "provider" | "providers">;

/**
 * The active provider key: explicit `provider`, or the single configured provider when only one
 * exists. Throws a {@link ConfigValidationError} when ambiguous or missing.
 */
export function resolveActiveProvider(config: ProviderSelectionConfig): string {
  const providers = config.providers ?? {};
  const keys = Object.keys(providers);
  const explicit = config.provider?.trim();
  if (explicit) {
    if (!Object.prototype.hasOwnProperty.call(providers, explicit)) {
      throw new ConfigValidationError(
        `provider "${explicit}" is not defined in providers (${keys.length > 0 ? keys.join(", ") : "none configured"})`
      );
    }
    return explicit;
  }
  if (keys.length === 1) {
    return keys[0]!;
  }
  if (keys.length === 0) {
    throw new ConfigValidationError(
      "No LLM providers configured: add at least one entry under `providers` (e.g. providers.openrouter.translationModels)"
    );
  }
  throw new ConfigValidationError(
    `Multiple providers configured (${keys.join(", ")}); set a top-level "provider" to choose the active one`
  );
}

/**
 * Like {@link resolveActiveProvider} but returns `undefined` instead of throwing when the active
 * provider is missing or ambiguous. Useful for display-only contexts (e.g. dry runs without a client).
 */
export function safeResolveActiveProvider(config: ProviderSelectionConfig): string | undefined {
  try {
    return resolveActiveProvider(config);
  } catch {
    return undefined;
  }
}

function providerEntry(config: ProviderSelectionConfig, name: string): LlmProviderConfig {
  return (config.providers ?? {})[name] ?? {};
}

/**
 * Merge a provider's config block with its built-in preset and the global LLM defaults.
 * Throws when a provider has neither a preset nor a configured `baseUrl`.
 */
export function resolveProviderSettings(
  name: string,
  config: ProviderSelectionConfig
): ResolvedProviderSettings {
  const entry = providerEntry(config, name);
  const preset = PROVIDER_PRESETS[name];
  const baseUrl = (entry.baseUrl ?? preset?.baseUrl)?.trim();
  if (!baseUrl) {
    throw new ConfigValidationError(
      `provider "${name}" has no baseUrl: it is not a built-in provider, so set providers.${name}.baseUrl (and providers.${name}.apiKeyEnv)`
    );
  }
  const apiKeyEnv = entry.apiKeyEnv?.trim() ?? preset?.apiKeyEnv;
  const requiresApiKey = preset?.requiresApiKey === false ? false : Boolean(apiKeyEnv);
  return {
    provider: name,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKeyEnv,
    requiresApiKey,
    headers: entry.headers ?? {},
    maxTokens: entry.maxTokens ?? DEFAULT_LLM_MAX_TOKENS,
    temperature: entry.temperature ?? DEFAULT_LLM_TEMPERATURE,
    requestTimeoutMs: entry.requestTimeoutMs ?? DEFAULT_LLM_REQUEST_TIMEOUT_MS,
  };
}

/**
 * Read the API key for resolved provider settings from the environment.
 * Throws when a key is required but the env var is empty/unset.
 */
export function resolveApiKey(settings: ResolvedProviderSettings): string {
  const fromEnv = settings.apiKeyEnv ? (process.env[settings.apiKeyEnv]?.trim() ?? "") : "";
  if (!fromEnv && settings.requiresApiKey) {
    const envName = settings.apiKeyEnv ?? "<apiKeyEnv>";
    throw new ConfigValidationError(
      `${envName} is required for provider "${settings.provider}" (set it in the environment)`
    );
  }
  return fromEnv;
}

/** Auth material for a provider's `GET /models` request: optional Bearer token plus extra headers. */
export interface ModelsListRequestAuth {
  /** Sent as `Authorization: Bearer`; omitted for providers that authenticate via custom headers. */
  apiKey?: string;
  extraHeaders: Record<string, string>;
}

/**
 * Build the auth/headers for a provider's `GET /models` request.
 *
 * Most providers expose an OpenAI-compatible `/models` endpoint authenticated with `Authorization:
 * Bearer`. Two providers need special handling:
 * - `anthropic`: `/v1/models` is Anthropic's native (non-OpenAI-compat) endpoint and requires
 *   `x-api-key` + `anthropic-version` instead of a Bearer token (its chat endpoint accepts Bearer,
 *   which is why translation works while a Bearer-only `/models` call returns 401).
 * - `openrouter`: also sends the `HTTP-Referer`/`X-Title` attribution headers OpenRouter expects.
 */
export function resolveModelsListRequestAuth(
  provider: string,
  apiKey: string,
  opts?: { xTitle?: string; httpReferer?: string }
): ModelsListRequestAuth {
  if (provider === ANTHROPIC_PROVIDER_KEY) {
    return {
      extraHeaders: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
    };
  }
  if (provider === OPENROUTER_PROVIDER_KEY) {
    return {
      apiKey,
      extraHeaders: {
        "HTTP-Referer": opts?.httpReferer ?? "https://github.com/wsj-br/ai-i18n-tools",
        "X-Title": opts?.xTitle ?? "ai-i18n-tools",
      },
    };
  }
  return { apiKey, extraHeaders: {} };
}

/** Ordered translation-model fallback chain for the active provider. */
export function translationModelsForProvider(
  config: ProviderSelectionConfig,
  name: string
): string[] {
  const list = providerEntry(config, name).translationModels;
  if (!Array.isArray(list)) {
    return [];
  }
  return trimModelIdList(list);
}

/** Ordered UI-only model fallback chain for a provider. */
export function uiModelsForProvider(config: ProviderSelectionConfig, name: string): string[] {
  const list = providerEntry(config, name).uiModels;
  if (!Array.isArray(list)) {
    return [];
  }
  return trimModelIdList(list);
}

/** Per-locale model chains keyed by normalized BCP-47 locale. */
export function localeModelsMapForProvider(
  config: ProviderSelectionConfig,
  name: string
): Map<string, string[]> {
  const rows = providerEntry(config, name).localeModels;
  const map = new Map<string, string[]>();
  if (!Array.isArray(rows)) {
    return map;
  }
  for (const row of rows) {
    const key = normalizeLocale(row.locale);
    map.set(key, trimModelIdList(row.models));
  }
  return map;
}

function trimModelIdList(list: string[]): string[] {
  return list
    .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
    .map((m) => m.trim());
}

/** Merge ordered model lists, keeping first occurrence of each id. */
export function dedupeOrderedModelIds(...lists: string[][]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const id of list) {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  return out;
}

/** Locale-specific models for a provider, or `[]` when unset. */
export function localeModelsForProvider(
  config: ProviderSelectionConfig,
  name: string,
  locale: string
): string[] {
  return localeModelsMapForProvider(config, name).get(normalizeLocale(locale)) ?? [];
}

/** Union of all model ids configured on a provider (for `check-models`). */
export function allConfiguredModelIdsForProvider(
  config: ProviderSelectionConfig,
  name: string
): string[] {
  const entry = providerEntry(config, name);
  const localeRows = entry.localeModels ?? [];
  const localeIds = localeRows.flatMap((row) => trimModelIdList(row.models));
  return dedupeOrderedModelIds(
    trimModelIdList(entry.translationModels ?? []),
    trimModelIdList(entry.uiModels ?? []),
    localeIds
  );
}
