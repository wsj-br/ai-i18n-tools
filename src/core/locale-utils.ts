/**
 * Shared locale normalization and list parsing (used by config, ui-languages, CLI).
 */

/** Placeholder values for `{locale}`, `{LOCALE}`, and `{llocale}` in output path templates. */
export function localePathPlaceholders(locale: string): {
  locale: string;
  LOCALE: string;
  llocale: string;
} {
  return {
    locale,
    LOCALE: locale.toUpperCase(),
    llocale: locale.toLowerCase(),
  };
}

export function normalizeLocale(locale: string): string {
  const normalized = locale.trim();
  if (normalized.includes("-")) {
    const parts = normalized.split("-");
    if (parts.length === 2) {
      const [lang, subtag] = parts;
      // 4-letter subtags are ISO 15924 scripts (Title case, e.g. `Hant`);
      // 2-letter / 3-digit subtags are regions (upper case, e.g. `BR`, `419`).
      const isScript = /^[A-Za-z]{4}$/.test(subtag);
      const canonicalSubtag = isScript
        ? subtag.charAt(0).toUpperCase() + subtag.slice(1).toLowerCase()
        : subtag.toUpperCase();
      return `${lang.toLowerCase()}-${canonicalSubtag}`;
    }
  }
  return normalized.toLowerCase();
}

/** ISO 639-1 (or extlang) primary subtag, lowercased — e.g. `zh-CN` → `zh`, `en-GB` → `en`. */
export function primaryLanguageSubtag(locale: string): string {
  const t = locale.trim();
  if (!t) {
    return "";
  }
  const first = t.split(/[-_]/)[0];
  return first ? first.toLowerCase() : "";
}

/**
 * Canonical key for matching `ui-languages.json` / master catalog `code` values
 * whether they use glibc underscores (`ar_SA`, `be_BY@latin`) or BCP-47 hyphens (`ar-SA`).
 */
export function normalizeManifestLocaleKey(locale: string): string {
  return locale.trim().replace(/-/g, "_").toLowerCase();
}

/**
 * English language name for a BCP-47 tag (e.g. `ko` → `"Korean"`, `en-GB` → `"British English"`).
 * Used for LLM prompts when `localeDisplayNames` is unset. Returns `undefined` if `Intl` cannot resolve a useful label.
 */
export function englishLanguageNameForLocale(localeCode: string): string | undefined {
  const tag = normalizeLocale(localeCode);
  if (!tag) {
    return undefined;
  }
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "language" });
    const name = dn.of(tag);
    if (typeof name !== "string" || !name.trim()) {
      return undefined;
    }
    const t = name.trim();
    if (t.toLowerCase() === tag.toLowerCase()) {
      return undefined;
    }
    return t;
  } catch {
    return undefined;
  }
}

/**
 * ISO 15924 script subtag (Title case) if the tag carries one, else `undefined`.
 * Accepts BCP-47 hyphen or glibc underscore tags: `hi-Latn` / `hi_Latn` → `Latn`,
 * `zh-Hant-HK` → `Hant`, `en-GB` → `undefined` (region, not script).
 */
export function scriptSubtag(locale: string): string | undefined {
  const parts = locale.trim().split(/[-_]/);
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i]!;
    if (/^[A-Za-z]{4}$/.test(p)) {
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    }
  }
  return undefined;
}

/** True when the tag's script subtag is `Latn` (Latin/Roman), e.g. `hi-Latn`, `sr-Latn`. */
export function isLatinScriptLocale(locale: string): boolean {
  return scriptSubtag(locale) === "Latn";
}

/**
 * English name of an ISO 15924 script code (`Latn` → `"Latin"`, `Cyrl` → `"Cyrillic"`).
 * Returns `undefined` when `Intl` cannot resolve a useful label.
 */
export function englishScriptName(scriptCode: string): string | undefined {
  const code = scriptCode.trim();
  if (!code) {
    return undefined;
  }
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "script" });
    const name = dn.of(code.charAt(0).toUpperCase() + code.slice(1).toLowerCase());
    if (typeof name !== "string" || !name.trim()) {
      return undefined;
    }
    const t = name.trim();
    if (t.toLowerCase() === code.toLowerCase()) {
      return undefined;
    }
    return t;
  } catch {
    return undefined;
  }
}

/**
 * Sample of distinct non-Latin **letter** characters in `text` (Devanagari, Cyrillic, Han, etc.).
 * Used to detect when a `*-Latn` (romanized) translation wrongly came back in a native script.
 * Latin letters (including accented forms like `é`, `ñ`), digits, punctuation, whitespace, symbols,
 * and emoji are never reported. Returns at most `limit` unique characters, in first-seen order.
 */
export function nonLatinLettersIn(text: string, limit = 5): string[] {
  return collectMatches(text, /(?!\p{Script=Latin})\p{L}/gu, limit);
}

/**
 * ISO 15924 script code → ECMAScript `\p{Script=…}` property value (Unicode script long name).
 * Codes that Unicode does not encode as a single script property (composite scripts such as
 * `Jpan` = Han+Kana, `Kore` = Hangul+Han) are intentionally absent → script enforcement is skipped.
 * Simplified/Traditional Han (`Hans`/`Hant`) both map to `Han` (Unicode has no Simplified/Traditional
 * script property), so the validator can catch a *different* script but not Simplified vs Traditional.
 */
const UNICODE_SCRIPT_PROPERTY_BY_SUBTAG: Record<string, string> = {
  Latn: "Latin",
  Cyrl: "Cyrillic",
  Arab: "Arabic",
  Deva: "Devanagari",
  Mong: "Mongolian",
  Hani: "Han",
  Hans: "Han",
  Hant: "Han",
  Hebr: "Hebrew",
  Grek: "Greek",
  Thai: "Thai",
  Hang: "Hangul",
  Hira: "Hiragana",
  Kana: "Katakana",
  Beng: "Bengali",
  Gujr: "Gujarati",
  Guru: "Gurmukhi",
  Taml: "Tamil",
  Telu: "Telugu",
  Knda: "Kannada",
  Mlym: "Malayalam",
  Orya: "Oriya",
  Sinh: "Sinhala",
  Thaa: "Thaana",
  Geor: "Georgian",
  Armn: "Armenian",
  Ethi: "Ethiopic",
  Khmr: "Khmer",
  Laoo: "Lao",
  Mymr: "Myanmar",
  Tibt: "Tibetan",
  Syrc: "Syriac",
};

/** ECMAScript `\p{Script=…}` property value for an ISO 15924 subtag, or `undefined` when unsupported. */
export function unicodeScriptPropertyForSubtag(scriptCode: string): string | undefined {
  const code = scriptCode.trim();
  if (!code) {
    return undefined;
  }
  const canonical = code.charAt(0).toUpperCase() + code.slice(1).toLowerCase();
  return UNICODE_SCRIPT_PROPERTY_BY_SUBTAG[canonical];
}

const DISALLOWED_SCRIPT_RE_CACHE = new Map<string, RegExp>();

/**
 * Sample of distinct **letter** characters in `text` that are not allowed for the target's script
 * subtag, used to detect that a translation came back in the wrong writing system.
 *
 * - `Latn` (romanized targets): every non-Latin letter is reported (output must be pure Latin).
 * - Any other supported script (`Cyrl`, `Arab`, `Deva`, `Mong`, `Han`, …): letters from a *different*
 *   non-Latin script are reported, but Latin letters are always allowed (code, URLs, brand names,
 *   placeholders legitimately appear), so native-script→Latin fallback is **not** flagged here — that
 *   case is handled by the prompt directive instead. This keeps the check free of false positives.
 * - Unsupported/composite script codes (e.g. `Jpan`, `Kore`) report nothing (no enforcement).
 *
 * Returns at most `limit` unique characters, in first-seen order.
 */
export function disallowedScriptLetters(text: string, scriptCode: string, limit = 5): string[] {
  const property = unicodeScriptPropertyForSubtag(scriptCode);
  if (!property) {
    return [];
  }
  if (property === "Latin") {
    return nonLatinLettersIn(text, limit);
  }
  let re = DISALLOWED_SCRIPT_RE_CACHE.get(property);
  if (!re) {
    re = new RegExp(`(?!\\p{Script=Latin})(?!\\p{Script=${property}})\\p{L}`, "gu");
    DISALLOWED_SCRIPT_RE_CACHE.set(property, re);
  }
  re.lastIndex = 0;
  return collectMatches(text, re, limit);
}

/** Collect up to `limit` distinct matches of a global regex, in first-seen order. */
function collectMatches(text: string, re: RegExp, limit: number): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(re)) {
    const ch = m[0];
    if (!found.includes(ch)) {
      found.push(ch);
      if (found.length >= limit) {
        break;
      }
    }
  }
  return found;
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
