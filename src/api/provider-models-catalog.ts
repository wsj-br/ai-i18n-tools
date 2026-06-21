import { z } from "zod";

const pricingSchema = z
  .object({
    prompt: z.string().optional(),
    completion: z.string().optional(),
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
 * `id` are optional: only OpenRouter is guaranteed to populate `pricing`/`expiration_date`/`name`.
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
