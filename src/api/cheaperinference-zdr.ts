import { t } from "../i18n/index.js";

/** Account page where Cheaper Inference Data Protection (zero data retention) is switched. */
export const CHEAPERINFERENCE_DATA_PROTECTION_URL =
  "https://platform.cheaperinference.com/dashboard/data-protection";

const ZDR_REFUSAL = /zero-data-retention route|zdr_capacity_unavailable/i;

/** True when a Cheaper Inference error means this model has no zero-data-retention route. */
export function isZeroDataRetentionRefusal(text: string): boolean {
  return ZDR_REFUSAL.test(text);
}

/**
 * User-facing explanation for a zero-data-retention refusal.
 * `zeroDataRetention` is the config flag, which is separate from the account Data Protection setting.
 */
export function explainZeroDataRetentionRefusal(model: string, zeroDataRetention: boolean): string {
  if (zeroDataRetention) {
    return t(
      "{{model}} is not in the Cheaper Inference zero-data-retention catalog. Remove it from providers.cheaperinference.translationModels, or turn zero data retention off at {{url}} if this model must stay.",
      { model, url: CHEAPERINFERENCE_DATA_PROTECTION_URL }
    );
  }
  return t(
    "{{model}} has no zero-data-retention route. Cheaper Inference is enforcing zero data retention on this account. To use only models that support it, set providers.cheaperinference.zeroDataRetention to true and choose a model from that catalog. To keep this model, turn zero data retention off at {{url}}.",
    { model, url: CHEAPERINFERENCE_DATA_PROTECTION_URL }
  );
}

/**
 * Fetch wrapper for Cheaper Inference chat calls.
 * A zero-data-retention refusal is HTTP 503, which the AI SDK retries. Rewriting that response to
 * 400 makes the refusal final so the model fallback chain can move on.
 */
export async function cheaperInferenceFetch(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== 503) {
    return response;
  }
  const body = await response.text();
  if (!isZeroDataRetentionRefusal(body)) {
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }
  return new Response(body, {
    status: 400,
    statusText: "Bad Request",
    headers: response.headers,
  });
}
