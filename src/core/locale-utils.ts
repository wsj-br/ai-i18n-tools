/**
 * Shared locale normalization and list parsing (used by config, ui-languages, CLI).
 */

export function normalizeLocale(locale: string): string {
  const normalized = locale.trim();
  if (normalized.includes("-")) {
    const parts = normalized.split("-");
    if (parts.length === 2) {
      return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
    }
  }
  return normalized.toLowerCase();
}

/** Split CLI/config locale lists (commas and/or ASCII whitespace). Dedupes, preserves order. */
export function parseLocaleList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const parts = raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const part of parts) {
    const n = normalizeLocale(part);
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

/**
 * Normalize JSON config `targetLocales`: either a single manifest path string or an array of locale codes.
 */
export function coerceTargetLocalesField(value: unknown): string[] {
  if (typeof value === "string") {
    const t = value.trim();
    return t ? [t] : [];
  }
  if (Array.isArray(value)) {
    return value
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
  }
  return [];
}

/** Mutate raw config input so `targetLocales` is always `string[]` (string → one-element array). */
export function assignCoercedTargetLocales(raw: { targetLocales?: unknown }): void {
  Object.assign(raw, { targetLocales: coerceTargetLocalesField(raw.targetLocales) });
}
