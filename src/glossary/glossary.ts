import fs from "fs";
import type { GlossaryTerm, GlossaryTermHint } from "../core/types.js";
import { parseGlossaryCsv } from "./parse-glossary-csv.js";
import { sanitizePromptSupplementaryText } from "./translation-context.js";

function looksLikeStringsJson(filepath: string): boolean {
  if (filepath.toLowerCase().endsWith(".json")) {
    return true;
  }
  try {
    const head = fs.readFileSync(filepath, "utf8").trimStart().slice(0, 1);
    return head === "{";
  } catch {
    return false;
  }
}

function normalizeRow(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.trim().toLowerCase()] = v;
  }
  return out;
}

function pickEnglish(row: Record<string, string>): string | undefined {
  const n = normalizeRow(row);
  return (
    n["original language string"]?.trim() || n["en"]?.trim() || n["english"]?.trim() || undefined
  );
}

function pickLocale(row: Record<string, string>): string | undefined {
  const n = normalizeRow(row);
  return n["locale"]?.trim();
}

function pickTranslation(row: Record<string, string>): string | undefined {
  const n = normalizeRow(row);
  return n["translation"]?.trim();
}

function pickForce(row: Record<string, string>): boolean {
  const n = normalizeRow(row);
  const v = n["force"]?.trim().toLowerCase();
  return v === "true" || v === "yes" || v === "1";
}

function pickContext(row: Record<string, string>): string {
  const n = normalizeRow(row);
  return n["context"]?.trim() || n["notes"]?.trim() || "";
}

function ensureContextMap(term: GlossaryTerm): Record<string, string> {
  if (!term.contextByLocale) {
    term.contextByLocale = {};
  }
  return term.contextByLocale;
}

/**
 * Compact UI-label abbreviations (e.g. `Size` → `Tam`, `Storage` → `Alm.`) used to
 * fit column headers. Document prompts must not receive these as terminology hints —
 * models may wrap them as invented `{{TAM}}`-style tokens and break MDX.
 */
export function isUiLabelAbbreviation(english: string, translation: string): boolean {
  const en = english.trim();
  const tr = translation.trim();
  if (!en || !tr) {
    return false;
  }
  // Single-token trailing abbrev marker: "Tam.", "Últ.", "Alm."
  if (!/\s/.test(tr) && /.\.$/u.test(tr)) {
    return true;
  }
  const enParts = en.split(/\s+/);
  const trCore = tr.replace(/\.$/u, "");
  const trParts = trCore.split(/\s+/);
  if (enParts.length !== 1 || trParts.length !== 1) {
    return false;
  }
  if (trCore.toLowerCase() === en.toLowerCase()) {
    return false;
  }
  const enLen = en.length;
  const trLen = trCore.length;
  // Short compressed label without a trailing dot: Size→Tam
  return enLen >= 4 && trLen <= 4 && trLen < enLen;
}

/**
 * Terminology for doc translation: `strings.json` and/or CSV, with user overrides.
 */
export class Glossary {
  private readonly terms = new Map<string, GlossaryTerm>();
  /** Term count after loading UI strings / UI CSV (before user glossary merge). */
  private readonly _uiStringsTermCount: number;
  /** Terms whose key was first added when merging the user glossary CSV. */
  private readonly _userGlossaryTermCount: number;

  constructor(
    glossaryUiPath: string | undefined,
    glossaryUserPath: string | undefined,
    targetLocales: string[] = []
  ) {
    if (glossaryUiPath && fs.existsSync(glossaryUiPath)) {
      if (looksLikeStringsJson(glossaryUiPath)) {
        this.loadFromStringsJson(glossaryUiPath);
      } else {
        this.loadUiCsv(glossaryUiPath);
      }
    } else if (glossaryUiPath) {
      /* optional: missing file */
    }

    this._uiStringsTermCount = this.terms.size;

    const sizeBeforeUser = this.terms.size;
    if (glossaryUserPath && fs.existsSync(glossaryUserPath)) {
      this.loadUserCsv(glossaryUserPath, targetLocales);
    }
    this._userGlossaryTermCount = this.terms.size - sizeBeforeUser;
  }

  /** Terms from `strings.json` / UI glossary file (before user CSV merge). */
  get uiStringsTermCount(): number {
    return this._uiStringsTermCount;
  }

  /** Terms first introduced by the user glossary CSV (new keys not present after UI load). */
  get userGlossaryTermCount(): number {
    return this._userGlossaryTermCount;
  }

  private loadFromStringsJson(filepath: string): void {
    const raw = JSON.parse(fs.readFileSync(filepath, "utf8")) as Record<string, unknown>;
    let count = 0;
    for (const value of Object.values(raw)) {
      if (!value || typeof value !== "object") {
        continue;
      }
      const rec = value as { source?: unknown; translated?: unknown };
      const source = typeof rec.source === "string" ? rec.source.trim() : "";
      if (!source) {
        continue;
      }
      const translations: Record<string, string> = {};
      if (rec.translated && typeof rec.translated === "object") {
        for (const [loc, text] of Object.entries(rec.translated as Record<string, unknown>)) {
          if (typeof text === "string" && text.trim()) {
            translations[loc] = text.trim();
          }
        }
      }
      if (Object.keys(translations).length === 0) {
        continue;
      }
      this.terms.set(source.toLowerCase(), {
        english: source,
        translations,
        partOfSpeech: "unknown",
      });
      count++;
    }
    console.log(`✓ Loaded ${count} glossary terms from strings.json (UI)`);
  }

  private loadUiCsv(filepath: string): void {
    const content = fs.readFileSync(filepath, "utf8");
    const rows = parseGlossaryCsv(filepath, content);

    for (const row of rows) {
      const english = row["en"]?.trim() || pickEnglish(row);
      if (!english) {
        continue;
      }
      const term: GlossaryTerm = {
        english,
        translations: {},
        partOfSpeech: "unknown",
      };
      for (const [col, val] of Object.entries(row)) {
        const c = col.trim();
        const cl = c.toLowerCase();
        if (cl === "en" || cl === "original language string" || cl === "english" || !val?.trim()) {
          continue;
        }
        if (cl === "locale" || cl === "translation") {
          continue;
        }
        term.translations[c] = val.trim();
      }
      this.terms.set(english.toLowerCase(), term);
    }
    console.log(`✓ Loaded ${this.terms.size} glossary terms from UI CSV`);
  }

  /**
   * User CSV: `Original language string` / `en`, `locale`, `Translation` / `translation`.
   * Optional `Context` / `Notes` is source-language usage guidance.
   * `locale` `*` applies to all `targetLocales`. Exact locale wins over `*` (applied first * then overwrite).
   */
  private loadUserCsv(filepath: string, targetLocales: string[]): void {
    const content = fs.readFileSync(filepath, "utf8");
    const rows = parseGlossaryCsv(filepath, content);

    const starRows: Array<{
      english: string;
      translation: string;
      force: boolean;
      context: string;
    }> = [];
    const exactRows: Array<{
      english: string;
      locale: string;
      translation: string;
      force: boolean;
      context: string;
    }> = [];

    for (const row of rows) {
      const english = pickEnglish(row);
      const locale = pickLocale(row);
      const translation = pickTranslation(row);
      if (!english || !locale || !translation) {
        continue;
      }
      const force = pickForce(row);
      const context = pickContext(row);
      if (locale === "*") {
        starRows.push({ english, translation, force, context });
      } else {
        exactRows.push({ english, locale, translation, force, context });
      }
    }

    let userOverrideRowCount = 0;

    const ensureForced = (term: GlossaryTerm): Record<string, boolean> => {
      if (!term.forcedByLocale) {
        term.forcedByLocale = {};
      }
      return term.forcedByLocale;
    };

    for (const { english, translation, force, context } of starRows) {
      if (targetLocales.length === 0) {
        continue;
      }
      const key = english.toLowerCase();
      let term = this.terms.get(key);
      if (!term) {
        term = { english, translations: {}, partOfSpeech: "unknown" };
        this.terms.set(key, term);
      }
      const fm = ensureForced(term);
      const cm = ensureContextMap(term);
      for (const loc of targetLocales) {
        if (!term.translations[loc]) {
          term.translations[loc] = translation;
          fm[loc] = force;
        }
        if (context && !cm[loc]) {
          cm[loc] = context;
        }
      }
      userOverrideRowCount++;
    }

    for (const { english, locale, translation, force, context } of exactRows) {
      const key = english.toLowerCase();
      let term = this.terms.get(key);
      if (!term) {
        term = { english, translations: {}, partOfSpeech: "unknown" };
        this.terms.set(key, term);
      }
      term.translations[locale] = translation;
      ensureForced(term)[locale] = force;
      if (context) {
        ensureContextMap(term)[locale] = context;
      }
      userOverrideRowCount++;
    }

    if (userOverrideRowCount > 0) {
      console.log(`✓ Loaded ${userOverrideRowCount} user glossary overrides`);
    }
  }

  findTermHintsInText(
    text: string,
    locale: string,
    opts?: { skipUiAbbreviations?: boolean }
  ): GlossaryTermHint[] {
    const hints: GlossaryTermHint[] = [];
    const textLower = text.toLowerCase();
    const skipUiAbbreviations = opts?.skipUiAbbreviations === true;

    const sortedTerms = Array.from(this.terms.entries()).sort((a, b) => b[0].length - a[0].length);

    const matchedPositions = new Set<number>();

    for (const [termLower, term] of sortedTerms) {
      const translation = term.translations[locale];
      if (!translation) {
        continue;
      }
      if (skipUiAbbreviations && isUiLabelAbbreviation(term.english, translation)) {
        continue;
      }

      let index = 0;
      while ((index = textLower.indexOf(termLower, index)) !== -1) {
        const beforeChar = index > 0 ? textLower[index - 1] : " ";
        const afterChar = textLower[index + termLower.length] || " ";
        const isWordBoundary = /[\s\p{P}]/u.test(beforeChar) && /[\s\p{P}]/u.test(afterChar);

        if (!isWordBoundary) {
          index++;
          continue;
        }

        const positions = Array.from({ length: termLower.length }, (_, i) => index + i);
        const hasOverlap = positions.some((pos) => matchedPositions.has(pos));

        if (!hasOverlap) {
          const context = term.contextByLocale?.[locale]?.trim();
          hints.push({
            english: term.english,
            translation,
            ...(context ? { context } : {}),
          });
          positions.forEach((pos) => matchedPositions.add(pos));
          break;
        }

        index++;
      }
    }

    return hints;
  }

  findTermsInText(
    text: string,
    locale: string,
    opts?: { skipUiAbbreviations?: boolean }
  ): string[] {
    return this.findTermHintsInText(text, locale, opts).map(formatGlossaryHint);
  }

  /**
   * Stable payload of term-level Context notes for `locale` (empty when none).
   * Used by {@link computeGuidanceFingerprint}.
   */
  termContextFingerprintPayload(locale: string): string {
    const lines: string[] = [];
    const sorted = Array.from(this.terms.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [, term] of sorted) {
      const ctx = term.contextByLocale?.[locale]?.trim();
      if (ctx) {
        lines.push(`${term.english}\0${ctx}`);
      }
    }
    return lines.join("\n");
  }

  getContext(englishTerm: string, locale: string): string | undefined {
    const ctx = this.terms.get(englishTerm.toLowerCase())?.contextByLocale?.[locale]?.trim();
    return ctx || undefined;
  }

  getTranslation(englishTerm: string, locale: string): string | undefined {
    return this.terms.get(englishTerm.toLowerCase())?.translations[locale];
  }

  /**
   * User-glossary `force` rows for this locale, longest match first (for placeholder protection).
   */
  getForcedTermEntriesForLocale(locale: string): Array<{
    english: string;
    termLower: string;
    replacement: string;
  }> {
    const out: Array<{ english: string; termLower: string; replacement: string }> = [];
    for (const [termLower, term] of this.terms.entries()) {
      if (!term.forcedByLocale?.[locale]) {
        continue;
      }
      const replacement = term.translations[locale]?.trim();
      if (!replacement) {
        continue;
      }
      out.push({ english: term.english, termLower, replacement });
    }
    out.sort((a, b) => b.termLower.length - a.termLower.length);
    return out;
  }

  get size(): number {
    return this.terms.size;
  }
}

/** Format one matched glossary term for the `<glossary>` prompt block. */
export function formatGlossaryHint(hint: GlossaryTermHint): string {
  const head = `- "${hint.english}" → "${hint.translation}"`;
  const ctx = hint.context?.trim();
  if (!ctx) {
    return head;
  }
  const safe = sanitizePromptSupplementaryText(ctx).replace(/\s+/g, " ").trim();
  if (!safe) {
    return head;
  }
  return `${head}\n  Context: ${safe}`;
}
