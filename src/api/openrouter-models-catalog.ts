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
    pricing: pricingSchema.optional(),
    expiration_date: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();

const modelsListResponseSchema = z.object({
  data: z.array(modelRowSchema),
});

export type OpenRouterCatalogModelEntry = z.infer<typeof modelRowSchema>;

export function parseModelsListResponse(json: unknown): Map<string, OpenRouterCatalogModelEntry> {
  const parsed = modelsListResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`OpenRouter models response: invalid JSON shape (${parsed.error.message})`);
  }
  const map = new Map<string, OpenRouterCatalogModelEntry>();
  for (const row of parsed.data.data) {
    map.set(row.id, row);
  }
  return map;
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

export interface FetchOpenRouterModelsCatalogOpts {
  baseUrl: string;
  apiKey: string;
  httpReferer?: string;
  xTitle?: string;
  /** Per-request timeout; defaults to 30s when omitted (matches `openrouter.requestTimeoutMs`). */
  requestTimeoutMs?: number;
}

/**
 * GET `{baseUrl}/models` (after stripping trailing slash from baseUrl).
 */
export async function fetchOpenRouterModelsCatalog(
  opts: FetchOpenRouterModelsCatalogOpts
): Promise<Map<string, OpenRouterCatalogModelEntry>> {
  const base = opts.baseUrl.replace(/\/$/, "");
  const url = `${base}/models`;
  const requestTimeoutMs = opts.requestTimeoutMs ?? 30_000;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "HTTP-Referer": opts.httpReferer ?? "https://github.com/wsj-br/ai-i18n-tools",
      "X-Title": opts.xTitle ?? "ai-i18n-tools check-models",
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    const snippet = rawBody.length > 500 ? `${rawBody.slice(0, 500)}…` : rawBody;
    throw new Error(`OpenRouter models API error: ${response.status} - ${snippet}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`OpenRouter models API: invalid JSON (${msg})`);
  }

  return parseModelsListResponse(json);
}
