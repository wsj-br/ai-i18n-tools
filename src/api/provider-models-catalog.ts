import { z } from "zod";

/** A catalog rate: OpenRouter sends decimal strings; Cheaper Inference may send a number. */
const usdRateSchema = z.union([z.string(), z.number(), z.null()]).optional();

const pricingSchema = z
  .object({
    /** OpenRouter: USD per token. */
    prompt: z.string().optional(),
    /** OpenRouter: USD per token. */
    completion: z.string().optional(),
    /** Cheaper Inference: USD per 1M input tokens (already scaled). */
    input_per_million: usdRateSchema,
    /** Cheaper Inference: USD per 1M output tokens (already scaled). */
    output_per_million: usdRateSchema,
  })
  .passthrough();

const modelRowSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    /** Anthropic's `GET /models` returns a human label here instead of `name`. */
    display_name: z.string().optional(),
    pricing: pricingSchema.optional(),
    expiration_date: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();

const modelsListResponseSchema = z.object({
  data: z.array(modelRowSchema),
});

/**
 * A single entry from any provider's OpenAI-compatible `GET /models` response. All fields beyond
 * `id` are optional. OpenRouter fills `pricing.prompt` / `pricing.completion` (USD per token).
 * Cheaper Inference fills `pricing.input_per_million` / `pricing.output_per_million` (USD per 1M tokens).
 */
export type ProviderModelEntry = z.infer<typeof modelRowSchema>;

/** @deprecated Use {@link ProviderModelEntry}. */
export type OpenRouterCatalogModelEntry = ProviderModelEntry;

export function parseModelsListResponse(json: unknown): Map<string, ProviderModelEntry> {
  const parsed = modelsListResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Provider models response: invalid JSON shape (${parsed.error.message})`);
  }
  const map = new Map<string, ProviderModelEntry>();
  for (const row of parsed.data.data) {
    map.set(row.id, row);
  }
  return map;
}

/** Human label for a model row: `name` (OpenRouter) or `display_name` (Anthropic), else empty. */
export function modelDisplayName(entry: ProviderModelEntry): string {
  const candidate = entry.name ?? entry.display_name;
  return typeof candidate === "string" ? candidate.trim() : "";
}

/** Compare YYYY-MM-DD (or ISO prefix) to today's UTC calendar date. */
export function isExpirationDatePast(expirationDate: string | null | undefined): boolean {
  if (expirationDate === null || expirationDate === undefined || expirationDate === "") {
    return false;
  }
  const day = expirationDate.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return false;
  }
  const todayUtc = new Date().toISOString().slice(0, 10);
  return day < todayUtc;
}

/** OpenRouter `/models` returns `pricing.prompt` / `pricing.completion` as USD per token (decimal strings). */
const TOKENS_PER_MILLION = 1_000_000;

/**
 * Format API per-token USD strings as **USD per 1M tokens**, matching https://openrouter.ai/models (three fractional digits).
 */
export function formatUsdPerMillionTokens(apiUsdPerToken: string | undefined): string {
  if (apiUsdPerToken === undefined || apiUsdPerToken === "") {
    return "—";
  }
  const perToken = Number(apiUsdPerToken);
  if (!Number.isFinite(perToken)) {
    return apiUsdPerToken;
  }
  const perMillion = perToken * TOKENS_PER_MILLION;
  return `$${perMillion.toFixed(3)}`;
}

/** Format a catalog rate that is already USD per 1M tokens (do not multiply by 1e6). */
export function formatListedUsdPerMillion(apiUsdPerMillion: string | number | undefined): string {
  if (apiUsdPerMillion === undefined || apiUsdPerMillion === "") {
    return "—";
  }
  if (typeof apiUsdPerMillion === "number") {
    return Number.isFinite(apiUsdPerMillion) ? `$${apiUsdPerMillion.toFixed(3)}` : "—";
  }
  const perMillion = Number(apiUsdPerMillion);
  if (!Number.isFinite(perMillion)) {
    return apiUsdPerMillion;
  }
  return `$${perMillion.toFixed(3)}`;
}

function listedPerMillionRate(
  value: string | number | null | undefined
): string | number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return undefined;
}

/**
 * USD per 1M tokens for `list-models` / `check-models`.
 * OpenRouter per-token `prompt` / `completion` win when present. Otherwise Cheaper Inference's
 * already-per-million `input_per_million` / `output_per_million` are formatted as-is.
 * Returns `undefined` when the row has neither shape.
 */
export function catalogUsdPerMillionDisplay(
  entry: ProviderModelEntry
): { input: string; output: string } | undefined {
  const pricing = entry.pricing;
  if (!pricing) {
    return undefined;
  }
  const hasPerToken =
    (typeof pricing.prompt === "string" && pricing.prompt !== "") ||
    (typeof pricing.completion === "string" && pricing.completion !== "");
  if (hasPerToken) {
    return {
      input: formatUsdPerMillionTokens(pricing.prompt),
      output: formatUsdPerMillionTokens(pricing.completion),
    };
  }
  const input = listedPerMillionRate(pricing.input_per_million);
  const output = listedPerMillionRate(pricing.output_per_million);
  if (input === undefined && output === undefined) {
    return undefined;
  }
  return {
    input: formatListedUsdPerMillion(input),
    output: formatListedUsdPerMillion(output),
  };
}

export interface FetchProviderModelsCatalogOpts {
  baseUrl: string;
  /** Bearer token; omit (or empty) for keyless providers such as local Ollama. */
  apiKey?: string;
  /** Extra request headers (e.g. OpenRouter's `HTTP-Referer`/`X-Title`). */
  extraHeaders?: Record<string, string>;
  /** Human-readable provider name used in error messages (e.g. `OpenRouter`, `openai`). */
  providerLabel?: string;
  /** Per-request timeout; defaults to 30s when omitted. */
  requestTimeoutMs?: number;
}

/**
 * GET `{baseUrl}/models` for any OpenAI-compatible provider (after stripping a trailing slash from
 * `baseUrl`), returning a map keyed by model id. The `Authorization: Bearer` header is added only
 * when an `apiKey` is supplied so keyless providers (e.g. Ollama) work too.
 */
export async function fetchProviderModelsCatalog(
  opts: FetchProviderModelsCatalogOpts
): Promise<Map<string, ProviderModelEntry>> {
  const base = opts.baseUrl.replace(/\/$/, "");
  const url = `${base}/models`;
  const requestTimeoutMs = opts.requestTimeoutMs ?? 30_000;
  const label = opts.providerLabel ?? "Provider";
  const headers: Record<string, string> = { ...(opts.extraHeaders ?? {}) };
  if (opts.apiKey) {
    headers.Authorization = `Bearer ${opts.apiKey}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    const snippet = rawBody.length > 500 ? `${rawBody.slice(0, 500)}…` : rawBody;
    throw new Error(`${label} models API error: ${response.status} - ${snippet}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`${label} models API: invalid JSON (${msg})`);
  }

  return parseModelsListResponse(json);
}

export interface FetchOpenRouterModelsCatalogOpts {
  baseUrl: string;
  apiKey: string;
  httpReferer?: string;
  xTitle?: string;
  /** Per-request timeout; defaults to 30s when omitted (matches `openrouter.requestTimeoutMs`). */
  requestTimeoutMs?: number;
}

/**
 * OpenRouter-specific wrapper over {@link fetchProviderModelsCatalog} that always sends the
 * `HTTP-Referer`/`X-Title` attribution headers OpenRouter expects.
 */
export async function fetchOpenRouterModelsCatalog(
  opts: FetchOpenRouterModelsCatalogOpts
): Promise<Map<string, ProviderModelEntry>> {
  return fetchProviderModelsCatalog({
    baseUrl: opts.baseUrl,
    apiKey: opts.apiKey,
    providerLabel: "OpenRouter",
    requestTimeoutMs: opts.requestTimeoutMs,
    extraHeaders: {
      "HTTP-Referer": opts.httpReferer ?? "https://github.com/wsj-br/ai-i18n-tools",
      "X-Title": opts.xTitle ?? "ai-i18n-tools check-models",
    },
  });
}
