/**
 * Shared locale normalization and list parsing (used by config, ui-languages, CLI).
 */

import { SIMPLIFIED_ONLY, TRADITIONAL_ONLY } from "./han-variant-data.js";

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
 *
 * Does **not** apply language-default scripts — use {@link effectiveScriptSubtag} for
 * prompt directives and wrong-script validation (e.g. bare `hi` → Devanagari).
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

/**
 * Default ISO 15924 script when a language tag omits an explicit script subtag.
 * Explicit scripts always win (`hi-Latn` stays Latin). Used so bare `hi` (and `hi-IN`)
 * get Devanagari prompt directives and wrong-script validation like `sd-Deva`.
 */
const DEFAULT_SCRIPT_BY_PRIMARY: Readonly<Record<string, string>> = {
  hi: "Deva",
};

/**
 * Script to enforce for prompts and validation: the tag's explicit ISO 15924 subtag
 * when present, otherwise the language's default script from {@link DEFAULT_SCRIPT_BY_PRIMARY}
 * (e.g. `hi` / `hi-IN` → `Deva`). Returns `undefined` when neither applies.
 */
export function effectiveScriptSubtag(locale: string): string | undefined {
  const explicit = scriptSubtag(locale);
  if (explicit) {
    return explicit;
  }
  const primary = primaryLanguageSubtag(locale);
  return primary ? DEFAULT_SCRIPT_BY_PRIMARY[primary] : undefined;
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
 *   case is handled by the prompt directive instead.
 * - Unsupported/composite script codes (e.g. `Jpan`, `Kore`) report nothing (no enforcement).
 *
 * Returns at most `limit` unique characters, in first-seen order.
 *
 * NOTE: This per-character sampler is retained for back-compat and tooling. Output-script
 * *validation* uses the statistical {@link scriptValidationIssue} instead, which tolerates
 * stray foreign letters and letter-like symbols (e.g. `ℹ`) and discriminates Hans vs Hant.
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

/**
 * Minimum share of meaningful (non-Latin, non-symbol) letters that must belong to the
 * expected script for an output to pass validation. An output is flagged only when the
 * expected script's share is at or below this threshold (i.e. it must be > 60% to pass),
 * so stray foreign-language quotes and letter-like symbols never trip the check.
 */
export const EXPECTED_SCRIPT_MIN_SHARE = 0.6;

/**
 * Minimum number of variant-distinct (Simplified-only vs Traditional-only) characters required
 * before a `zh-Hans` / `zh-Hant` mismatch is judged. Most Chinese characters are shared between
 * the two writing systems, so a short segment yields very few variant-distinct characters; judging
 * the whole segment from one or two of them (or a single mislabeled glyph) is unreliable, so below
 * this count the variant check is skipped.
 */
export const VARIANT_MIN_SAMPLE = 4;

const LETTER_RE = /\p{L}/u;
const LATIN_LETTER_RE = /\p{Script=Latin}/u;
/** Common (punctuation, digits, letter-like symbols such as `ℹ`) and Inherited (combining marks). */
const COMMON_OR_INHERITED_RE = /[\p{Script=Common}\p{Script=Inherited}]/u;

/** Distinct Unicode script property values we can attribute letters to (excludes Latin). */
const NON_LATIN_SCRIPT_PROPERTIES: readonly string[] = Array.from(
  new Set(Object.values(UNICODE_SCRIPT_PROPERTY_BY_SUBTAG))
).filter((p) => p !== "Latin");

const SCRIPT_PROPERTY_RE_CACHE = new Map<string, RegExp>();
function scriptPropertyRe(property: string): RegExp {
  let re = SCRIPT_PROPERTY_RE_CACHE.get(property);
  if (!re) {
    re = new RegExp(`\\p{Script=${property}}`, "u");
    SCRIPT_PROPERTY_RE_CACHE.set(property, re);
  }
  return re;
}

/** Per-script letter tallies for a string, used by {@link scriptValidationIssue}. */
export interface ScriptLetterCounts {
  /** Count of Latin-script letters (code, URLs, brand names — always allowed). */
  latin: number;
  /** Count of letters that are non-Latin and not Common/Inherited (the meaningful signal). */
  nonLatinTotal: number;
  /** Non-Latin script property → letter count (a catch-all `"Other"` bucket may appear). */
  byScript: Map<string, number>;
  /** Non-Latin script property → up to 5 sample letters, first-seen order. */
  samples: Map<string, string[]>;
}

/**
 * Tally letters in `text` by Unicode script. Latin letters are counted separately (always
 * allowed); Common/Inherited characters (digits, punctuation, symbols, combining marks, and
 * letter-like symbols such as `ℹ`/`→`) are ignored entirely so they cannot skew the result.
 * Every remaining letter is bucketed under its Unicode script property, or `"Other"`.
 */
export function scriptLetterCounts(text: string): ScriptLetterCounts {
  const byScript = new Map<string, number>();
  const samples = new Map<string, string[]>();
  let latin = 0;
  let nonLatinTotal = 0;
  for (const ch of text) {
    if (!LETTER_RE.test(ch)) {
      continue;
    }
    if (LATIN_LETTER_RE.test(ch)) {
      latin++;
      continue;
    }
    if (COMMON_OR_INHERITED_RE.test(ch)) {
      continue;
    }
    let property = "Other";
    for (const candidate of NON_LATIN_SCRIPT_PROPERTIES) {
      if (scriptPropertyRe(candidate).test(ch)) {
        property = candidate;
        break;
      }
    }
    nonLatinTotal++;
    byScript.set(property, (byScript.get(property) ?? 0) + 1);
    const sample = samples.get(property) ?? [];
    if (sample.length < 5 && !sample.includes(ch)) {
      sample.push(ch);
      samples.set(property, sample);
    }
  }
  return { latin, nonLatinTotal, byScript, samples };
}

/** Counts of variant-distinct (Simplified-only vs Traditional-only) Han characters. */
export interface HanVariantCounts {
  simplified: number;
  traditional: number;
  simplifiedSamples: string[];
  traditionalSamples: string[];
}

/**
 * Count characters that are exclusive to Simplified or Traditional Chinese. Characters shared
 * by both writing systems (the majority of any text) are ignored, so a string built only from
 * shared characters yields `{ simplified: 0, traditional: 0 }` and cannot be classified.
 */
export function hanVariantCounts(text: string): HanVariantCounts {
  let simplified = 0;
  let traditional = 0;
  const simplifiedSamples: string[] = [];
  const traditionalSamples: string[] = [];
  for (const ch of text) {
    const isS = SIMPLIFIED_ONLY.has(ch);
    const isT = TRADITIONAL_ONLY.has(ch);
    // Characters listed under both lists are ambiguous → treat as shared.
    if (isS === isT) {
      continue;
    }
    if (isS) {
      simplified++;
      if (simplifiedSamples.length < 5) {
        simplifiedSamples.push(ch);
      }
    } else {
      traditional++;
      if (traditionalSamples.length < 5) {
        traditionalSamples.push(ch);
      }
    }
  }
  return { simplified, traditional, simplifiedSamples, traditionalSamples };
}

/** A statistical script-validation failure: a human-readable reason plus offending samples. */
export interface ScriptValidationIssue {
  /** Reason clause (no locale prefix), e.g. `is predominantly Cyrillic rather than the …`. */
  message: string;
  /** Up to a few representative offending characters, for logs. */
  sample: string[];
}

function dominantNonLatinScript(counts: ScriptLetterCounts): string | undefined {
  let best: string | undefined;
  let bestCount = 0;
  for (const [property, count] of counts.byScript) {
    if (count > bestCount) {
      best = property;
      bestCount = count;
    }
  }
  return best;
}

function scriptName(property: string): string {
  return property === "Other" ? "another script" : property;
}

/**
 * Statistical check that a model response is written in the locale's expected script
 * ({@link scriptSubtag}). Returns `null` when the output is acceptable, or a
 * {@link ScriptValidationIssue} describing the dominant wrong script otherwise.
 *
 * - No script subtag, or a composite/unsupported script (`Jpan`, `Kore`) → `null` (no enforcement).
 * - `*-Latn` (romanized) targets: Latin letters must make up more than {@link EXPECTED_SCRIPT_MIN_SHARE}
 *   of all letters; otherwise the dominant non-Latin script is reported.
 * - Other scripts: Latin letters are ignored (code/URLs/brands), and the expected script must
 *   account for more than {@link EXPECTED_SCRIPT_MIN_SHARE} of the remaining letters. A lone foreign
 *   quote or a letter-like symbol (e.g. `ℹ`) therefore does not trip the check.
 * - `zh-Hans` / `zh-Hant`: when the Han check passes, variant-distinct characters are tallied; the
 *   mismatch is reported only when there are at least {@link VARIANT_MIN_SAMPLE} such characters AND
 *   the wrong variant is a clear majority (> {@link EXPECTED_SCRIPT_MIN_SHARE}), so a tie or a lone
 *   ambiguous glyph never trips it.
 */
export function scriptValidationIssue(
  text: string,
  scriptCode: string
): ScriptValidationIssue | null {
  const property = unicodeScriptPropertyForSubtag(scriptCode);
  if (!property) {
    return null;
  }
  const counts = scriptLetterCounts(text);

  if (property === "Latin") {
    const total = counts.latin + counts.nonLatinTotal;
    if (total === 0) {
      return null;
    }
    if (counts.latin / total > EXPECTED_SCRIPT_MIN_SHARE) {
      return null;
    }
    const dominant = dominantNonLatinScript(counts);
    return {
      message: `is predominantly ${scriptName(dominant ?? "Other")} rather than the expected romanized Latin (Latn) script`,
      sample: dominant ? (counts.samples.get(dominant) ?? []) : [],
    };
  }

  if (counts.nonLatinTotal === 0) {
    return null;
  }
  const expectedCount = counts.byScript.get(property) ?? 0;
  if (expectedCount / counts.nonLatinTotal <= EXPECTED_SCRIPT_MIN_SHARE) {
    const dominant = dominantNonLatinScript(counts) ?? "Other";
    const expectedName = englishScriptName(scriptCode) ?? property;
    return {
      message: `is predominantly ${scriptName(dominant)} rather than the expected ${expectedName} (${scriptCode}) script`,
      sample: counts.samples.get(dominant) ?? [],
    };
  }

  if (scriptCode === "Hans" || scriptCode === "Hant") {
    const variant = hanVariantCounts(text);
    const exclusiveTotal = variant.simplified + variant.traditional;
    // Too few variant-distinct characters to judge confidently (e.g. a 1-vs-1 tie).
    if (exclusiveTotal < VARIANT_MIN_SAMPLE) {
      return null;
    }
    const wantSimplified = scriptCode === "Hans";
    const expectedVariant = wantSimplified ? variant.simplified : variant.traditional;
    // Flag only when the wrong variant is a clear majority (> 60%), never on a tie or a thin margin.
    if (expectedVariant / exclusiveTotal < 1 - EXPECTED_SCRIPT_MIN_SHARE) {
      const expectedLabel = wantSimplified ? "Simplified (Hans)" : "Traditional (Hant)";
      const actualLabel = wantSimplified ? "Traditional" : "Simplified";
      const pct = Math.round(((exclusiveTotal - expectedVariant) / exclusiveTotal) * 100);
      return {
        message: `is predominantly ${actualLabel} Chinese (${pct}% of ${exclusiveTotal} variant-distinct characters) where ${expectedLabel} was expected`,
        sample: wantSimplified ? variant.traditionalSamples : variant.simplifiedSamples,
      };
    }
  }

  return null;
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
