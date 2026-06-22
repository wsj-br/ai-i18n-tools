/**
 * Resolve which locale the tool's OWN user interface (CLI logs, help text, dashboard) should use.
 *
 * This is independent of the translation pipeline: `sourceLocale` / `targetLocales` in a consumer's
 * config describe THEIR project, whereas the tool ships a fixed set of UI bundles. The resolver maps
 * a requested locale (from `--ui-lang`, `AI_I18N_LANG`, config `uiLanguage`, or the host OS) to one of
 * the available shipped locales, using closest-language matching and falling back to the source locale.
 */
import { normalizeLocale, primaryLanguageSubtag, scriptSubtag } from "./locale-utils.js";

/** How the requested locale was matched against the available set. */
export type UiLocaleMatchKind = "exact" | "primary" | "fallback";

export interface ResolveUiLocaleInput {
  /** Value from the global `--ui-lang` CLI option (highest priority). */
  cliOption?: string | null;
  /** Value from the `AI_I18N_LANG` environment variable. */
  env?: string | null;
  /** Value from the config `uiLanguage` key. */
  configOption?: string | null;
  /** Host OS locale (default `detectHostLocale()`); pass explicitly for testing. */
  hostLocale?: string | null;
  /** Available shipped UI locale codes (BCP-47), e.g. `["en-GB", "de", "pt-BR", ...]`. */
  available: string[];
  /** Source locale to fall back to when nothing matches (e.g. `en-GB`). */
  sourceLocale: string;
}

export interface ResolveUiLocaleResult {
  /** Chosen available locale code (preserves the casing from `available`). */
  locale: string;
  /** How `locale` was selected. */
  matched: UiLocaleMatchKind;
  /** The first non-empty requested value considered (before normalization), if any. */
  requested?: string;
}

/** Host OS locale via the platform `Intl` data (Windows/Linux/macOS); `undefined` when unavailable. */
export function detectHostLocale(): string | undefined {
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale;
    return typeof loc === "string" && loc.trim() ? loc.trim() : undefined;
  } catch {
    return undefined;
  }
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) {
      return v.trim();
    }
  }
  return undefined;
}

/**
 * Map a requested locale to one of `available`, using:
 *  1. exact match (normalized),
 *  2. closest variation by primary language subtag (preferring an exact script match,
 *     else the first available with that primary subtag), e.g. `pt-PT` -> `pt-BR`, `en-US` -> `en-GB`,
 *  3. fall back to `sourceLocale`.
 *
 * Candidate precedence (high -> low): `cliOption` > `env` > `configOption` > host OS locale.
 */
export function resolveUiLocale(input: ResolveUiLocaleInput): ResolveUiLocaleResult {
  const { available, sourceLocale } = input;
  const hostLocale = input.hostLocale !== undefined ? input.hostLocale : detectHostLocale();
  const requested = firstNonEmpty(input.cliOption, input.env, input.configOption, hostLocale);

  const fallback: ResolveUiLocaleResult = {
    locale: sourceLocale,
    matched: "fallback",
    requested,
  };

  if (!requested) {
    return fallback;
  }

  const normalizedRequested = normalizeLocale(requested);

  // Preserve order; first occurrence wins for a given normalized key.
  const byNormalized = new Map<string, string>();
  for (const code of available) {
    const key = normalizeLocale(code);
    if (!byNormalized.has(key)) {
      byNormalized.set(key, code);
    }
  }

  const exact = byNormalized.get(normalizedRequested);
  if (exact) {
    return { locale: exact, matched: "exact", requested };
  }

  const requestedPrimary = primaryLanguageSubtag(normalizedRequested);
  if (requestedPrimary) {
    const requestedScript = scriptSubtag(normalizedRequested);
    const sameLanguage = available.filter(
      (code) => primaryLanguageSubtag(code) === requestedPrimary
    );
    if (sameLanguage.length > 0) {
      if (requestedScript) {
        const scriptMatch = sameLanguage.find((code) => scriptSubtag(code) === requestedScript);
        if (scriptMatch) {
          return { locale: scriptMatch, matched: "primary", requested };
        }
      }
      return { locale: sameLanguage[0]!, matched: "primary", requested };
    }
  }

  return fallback;
}
