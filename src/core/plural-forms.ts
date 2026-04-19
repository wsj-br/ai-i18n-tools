import type { CldrPluralForm } from "./types.js";
import { normalizeLocale } from "./locale-utils.js";

const FORM_ORDER: readonly CldrPluralForm[] = ["zero", "one", "two", "few", "many", "other"];

const CLDR_FORM_KEY_SET = new Set<string>(FORM_ORDER);

/** True if `key` is a known CLDR cardinal plural category (editor / JSON validation). */
export function isKnownCldrPluralFormKey(key: string): key is CldrPluralForm {
  return CLDR_FORM_KEY_SET.has(key);
}

/**
 * Integers probed with `Intl.PluralRules.select` to discover which cardinal categories
 * exist for a locale (covers practical CLDR sets including Arabic).
 */
function sampleIntegersForPluralDiscovery(): number[] {
  const out: number[] = [];
  for (let i = 0; i <= 200; i++) {
    out.push(i);
  }
  out.push(1000, 1_000_000);
  return out;
}

/**
 * Cardinal plural forms required for `locale` per `Intl.PluralRules` (subset of CLDR).
 */
export function requiredCldrPluralForms(locale: string): CldrPluralForm[] {
  const tag = normalizeLocale(locale);
  let pr: Intl.PluralRules;
  try {
    pr = new Intl.PluralRules(tag);
  } catch {
    pr = new Intl.PluralRules("en");
  }
  const seen = new Set<string>();
  for (const n of sampleIntegersForPluralDiscovery()) {
    seen.add(pr.select(n));
  }
  return FORM_ORDER.filter((f) => seen.has(f));
}

/**
 * When resolving a missing plural category for flat locale bundles, try these sources in order.
 * `other` first — it usually carries the generic counted phrase; compaction often keeps only `other`
 * when duplicates were merged in `strings.json`.
 */
const FALLBACK_SOURCES_FOR_MISSING_FORM: readonly CldrPluralForm[] = [
  "zero",
  "one",
  "two",
  "few",
  "many",
  "other",
];

/** Prefer `other` when filling `many` / `few` / `two` so compaction drops align with generic counted phrasing (see tests). */
function fallbackCandidatesForMissing(target: CldrPluralForm): CldrPluralForm[] {
  const all = FALLBACK_SOURCES_FOR_MISSING_FORM.filter((c) => c !== target);
  if (target === "many" || target === "few" || target === "two") {
    const withoutOther = all.filter((c) => c !== "other");
    return ["other", ...withoutOther];
  }
  return all;
}

function trimmedNonEmpty(
  forms: Partial<Record<CldrPluralForm, string>>,
  key: CldrPluralForm
): string | undefined {
  const raw = forms[key];
  if (typeof raw !== "string") {
    return undefined;
  }
  return raw.trim() !== "" ? raw : undefined;
}

/**
 * Ensures each category returned by {@link requiredCldrPluralForms} for `locale` has a string,
 * copying from sibling categories when the catalog omitted a key (e.g. after
 * {@link compactIdenticalPluralForms} dropped `many` because it matched `other`).
 *
 * Used when writing flat `*.json` for i18next suffix resolution only; `strings.json` may stay compact.
 */
export function expandPluralFormsForFlatOutput(
  forms: Partial<Record<CldrPluralForm, string>> | undefined,
  locale: string
): Partial<Record<CldrPluralForm, string>> {
  const raw = forms ?? {};
  const required = requiredCldrPluralForms(locale);
  const out: Partial<Record<CldrPluralForm, string>> = {};

  for (const target of required) {
    let chosen = trimmedNonEmpty(raw, target);
    if (chosen === undefined) {
      for (const cand of fallbackCandidatesForMissing(target)) {
        chosen = trimmedNonEmpty(raw, cand);
        if (chosen !== undefined) {
          break;
        }
      }
    }
    if (chosen !== undefined) {
      out[target] = chosen;
    }
  }

  return out;
}

/**
 * One-line hint for LLM prompts: first sample integer per cardinal category for `locale`
 * (same probing range as {@link requiredCldrPluralForms}).
 */
export function pluralCategoryExamplesHint(locale: string): string {
  const tag = normalizeLocale(locale);
  let pr: Intl.PluralRules;
  try {
    pr = new Intl.PluralRules(tag);
  } catch {
    pr = new Intl.PluralRules("en");
  }
  const firstNByCategory = new Map<string, number>();
  for (const n of sampleIntegersForPluralDiscovery()) {
    const cat = pr.select(n);
    if (!firstNByCategory.has(cat)) {
      firstNByCategory.set(cat, n);
    }
  }
  const parts: string[] = [];
  for (const f of FORM_ORDER) {
    const n = firstNByCategory.get(f);
    if (n !== undefined) {
      parts.push(`${f}: n=${n}`);
    }
  }
  return `Intl.PluralRules reference for locale ${tag}: ${parts.join("; ")}.`;
}

/**
 * Drop redundant duplicate strings, keeping the most general surviving key (`other` preferred).
 */
export function compactIdenticalPluralForms(
  forms: Partial<Record<CldrPluralForm, string>>
): Partial<Record<CldrPluralForm, string>> {
  const byValue = new Map<string, CldrPluralForm[]>();
  for (const k of FORM_ORDER) {
    const v = forms[k];
    if (v === undefined || v === "") {
      continue;
    }
    const list = byValue.get(v) ?? [];
    list.push(k);
    byValue.set(v, list);
  }
  const result: Partial<Record<CldrPluralForm, string>> = { ...forms };
  for (const keys of byValue.values()) {
    if (keys.length <= 1) {
      continue;
    }
    const keep = keys.includes("other") ? "other" : keys[keys.length - 1]!;
    for (const k of keys) {
      if (k !== keep) {
        delete result[k];
      }
    }
  }
  return result;
}

export function formsCompleteForLocale(
  forms: Partial<Record<CldrPluralForm, string>> | undefined,
  locale: string
): boolean {
  const required = requiredCldrPluralForms(locale);
  if (!forms) {
    return false;
  }
  for (const f of required) {
    const t = forms[f];
    if (t === undefined || String(t).trim() === "") {
      return false;
    }
  }
  return true;
}

/**
 * True when the per-locale plural map is minimally useful for UI work:
 * non-empty **`other`**, and non-empty **`one`** when {@link requiredCldrPluralForms} includes
 * `one` for this locale (locales such as Chinese may only use `other`).
 *
 * Does **not** require every CLDR category (`many`, `few`, …), so **`status`** / **`translate-ui`**
 * stay idempotent without `-`-force churn when ICU adds categories.
 */
/**
 * Cardinal categories surfaced as “required” in translate-ui / editor completeness and modal ordering:
 * {@link other} always, plus {@link one} when {@link requiredCldrPluralForms} exposes `one`.
 * Matches {@link pluralTranslatedLocaleHasContent}; stricter than full {@link requiredCldrPluralForms}
 * (which can include `many`, `few`, … from {@link Intl.PluralRules} sampling).
 */
export function pluralFormsRequiredForTranslateUi(locale: string): CldrPluralForm[] {
  const cats = requiredCldrPluralForms(locale);
  const out: CldrPluralForm[] = [];
  if (cats.includes("one")) {
    out.push("one");
  }
  out.push("other");
  return out;
}

export function pluralTranslatedLocaleHasContent(
  forms: Partial<Record<CldrPluralForm, string>> | Record<string, unknown> | undefined,
  locale: string
): boolean {
  if (forms === undefined || forms === null || typeof forms !== "object" || Array.isArray(forms)) {
    return false;
  }
  const otherRaw = forms["other"];
  const other = typeof otherRaw === "string" ? otherRaw.trim() : "";
  if (other === "") {
    return false;
  }
  const needsOne = requiredCldrPluralForms(locale).includes("one");
  if (needsOne) {
    const oneRaw = forms["one"];
    const one = typeof oneRaw === "string" ? oneRaw.trim() : "";
    if (one === "") {
      return false;
    }
  }
  return true;
}
