/**
 * Catalog-level placeholder audit shared by translate-ui, status, doctor, and the dashboard.
 * Plural rows reuse {@link pluralFormPlaceholderIssues}; plain rows use
 * {@link uiTranslationPlaceholderIssues}.
 */

import type { CldrPluralForm } from "./types.js";
import { pluralFormPlaceholderIssues } from "./plural-placeholders.js";
import {
  uiTranslationPlaceholderIssues,
  type UiPlaceholderStyle,
  type UiTranslationPlaceholderIssue,
} from "./ui-placeholders.js";

/** Messages for one source/translation pair. Empty when the placeholders match. */
export function translationValuePlaceholderMessages(
  source: string,
  translated: unknown,
  style: UiPlaceholderStyle = "default",
  zeroDigit = false
): string[] {
  if (typeof translated === "string") {
    if (translated.trim() === "") {
      return [];
    }
    return uiTranslationPlaceholderIssues(source, translated, style).map((issue) => issue.message);
  }
  if (translated && typeof translated === "object" && !Array.isArray(translated)) {
    const forms: Partial<Record<CldrPluralForm, string>> = {};
    for (const [key, value] of Object.entries(translated)) {
      if (typeof value === "string" && value.trim() !== "") {
        forms[key as CldrPluralForm] = value;
      }
    }
    if (Object.keys(forms).length === 0) {
      return [];
    }
    return pluralFormPlaceholderIssues(source, forms, {
      placeholderStyle: style,
      zeroDigit,
    }).map((issue) => `${issue.form}: ${issue.detail}`);
  }
  return [];
}

export interface CatalogPlaceholderHit {
  id: string;
  locale: string;
  source: string;
  messages: string[];
}

/**
 * Walk a `strings.json` document and return rows whose stored translation
 * renames, drops, invents, or retargets a placeholder.
 */
export function catalogPlaceholderHits(
  doc: Record<string, unknown>,
  locales: readonly string[],
  style: UiPlaceholderStyle = "default"
): CatalogPlaceholderHit[] {
  const hits: CatalogPlaceholderHit[] = [];
  for (const [id, row] of Object.entries(doc)) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      continue;
    }
    const record = row as Record<string, unknown>;
    const source = typeof record.source === "string" ? record.source : "";
    const translated = record.translated;
    if (!translated || typeof translated !== "object" || Array.isArray(translated)) {
      continue;
    }
    const zeroDigit = record.zeroDigit === true;
    for (const locale of locales) {
      const value = (translated as Record<string, unknown>)[locale];
      const messages = translationValuePlaceholderMessages(source, value, style, zeroDigit);
      if (messages.length === 0) {
        continue;
      }
      hits.push({ id, locale, source, messages });
    }
  }
  return hits;
}

/** Structured plain-string issues, for callers that branch on kind. */
export function plainPlaceholderIssues(
  source: string,
  translated: string,
  style: UiPlaceholderStyle = "default"
): UiTranslationPlaceholderIssue[] {
  return uiTranslationPlaceholderIssues(source, translated, style);
}
