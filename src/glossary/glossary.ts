import fs from "fs";
import { minimatch } from "minimatch";
import type { GlossaryLabelCheckSkip, GlossaryTerm, GlossaryTermHint } from "../core/types.js";
import { USER_EDITED_MODEL } from "../core/user-edited-model.js";
import { parseGlossaryCsv } from "./parse-glossary-csv.js";
import { sanitizePromptSupplementaryText } from "./translation-context.js";

/** One locked UI label whose catalog translation is absent from the segment. */
export interface LockedUiLabelIssue {
  term: string;
  translation: string;
  locale: string;
  message: string;
}

export interface GlossaryLoadOptions {
  labelCheckSkips?: readonly GlossaryLabelCheckSkip[];
}

/** Locales named in `labelCheckSkips` that are not configured targets (`*` is always known). */
export function unknownLabelCheckSkipLocales(
  skips: readonly GlossaryLabelCheckSkip[] | undefined,
  knownLocales: readonly string[]
): string[] {
  const known = new Set(knownLocales.map((locale) => locale.trim().toLowerCase()));
  const unknown = new Set<string>();
  for (const skip of skips ?? []) {
    for (const locale of skip.locales) {
      if (locale === "*") {
        continue;
      }
      if (!known.has(locale.trim().toLowerCase())) {
        unknown.add(locale);
      }
    }
  }
  return [...unknown];
}

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

const MIN_SHARED_PREFIX_TOKENS = 2;
const MIN_SHARED_TRANSLATION_CHARS = 4;
const MIN_LOCKED_LABEL_TOKENS = 2;
const MAX_LOCKED_LABEL_TOKENS = 5;
/** Closed words that may stay lowercase inside a title-case UI label. */
const LABEL_FUNCTION_WORDS = new Set([
  "a",
  "an",
  "the",
  "of",
  "to",
  "in",
  "on",
  "for",
  "and",
  "or",
  "at",
]);

/** Whitespace, punctuation, or a backtick. Backtick is a symbol, not `\p{P}`, but it wraps inline code. */
function isGlossaryBoundaryChar(ch: string): boolean {
  return /[\s\p{P}`]/u.test(ch);
}

function isGlossaryWordBoundary(textLower: string, index: number, termLength: number): boolean {
  const beforeChar = index > 0 ? textLower[index - 1]! : " ";
  const afterChar = textLower[index + termLength] || " ";
  return isGlossaryBoundaryChar(beforeChar) && isGlossaryBoundaryChar(afterChar);
}

function sourceTokenCount(english: string): number {
  return english
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0).length;
}

function tokenPrefixes(english: string): string[] {
  const tokens = english
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  const prefixes: string[] = [];
  for (let count = MIN_SHARED_PREFIX_TOKENS; count < tokens.length; count++) {
    prefixes.push(tokens.slice(0, count).join(" "));
  }
  return prefixes;
}

function isWordBoundaryPrefix(parent: string, prefix: string): boolean {
  if (parent.length <= prefix.length) {
    return false;
  }
  if (!parent.toLowerCase().startsWith(prefix.toLowerCase())) {
    return false;
  }
  return /[\s\p{P}]/u.test(parent.charAt(prefix.length));
}

function lastWordBoundaryIndex(value: string): number {
  for (let i = value.length - 1; i >= 0; i--) {
    if (/[\s\p{P}]/u.test(value.charAt(i))) {
      return i;
    }
  }
  return -1;
}

/** Longest common prefix of `texts`, cut back to a word boundary when the cut lands mid-token. */
function sharedTranslationPrefix(texts: readonly string[]): string {
  if (texts.length < 2) {
    return "";
  }
  let prefix = texts[0] ?? "";
  for (let i = 1; i < texts.length; i++) {
    const text = texts[i] ?? "";
    const max = Math.min(prefix.length, text.length);
    let n = 0;
    while (n < max && prefix.charCodeAt(n) === text.charCodeAt(n)) {
      n++;
    }
    prefix = prefix.slice(0, n);
    if (!prefix) {
      return "";
    }
  }
  const endsOnBoundary = texts.every((text) => {
    if (text.length < prefix.length) {
      return false;
    }
    if (text.length === prefix.length) {
      return true;
    }
    return /[\s\p{P}]/u.test(text.charAt(prefix.length));
  });
  if (!endsOnBoundary) {
    const boundary = lastWordBoundaryIndex(prefix);
    if (boundary <= 0) {
      return "";
    }
    prefix = prefix.slice(0, boundary);
  }
  return prefix.replace(/[\s\p{P}]+$/u, "").trim();
}

function bareToken(token: string): string {
  return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function isCapitalizedToken(token: string): boolean {
  const bare = bareToken(token);
  if (!bare) {
    return false;
  }
  const first = bare.charAt(0);
  return first.toUpperCase() !== first.toLowerCase() && first === first.toUpperCase();
}

/**
 * Title-case label such as "Cursor Models", not a sentence stem ("Could not", "Sign in to").
 * At least two words are capitalized content words. Function words may be lowercase.
 */
function isLabelShapedEnglishPrefix(english: string): boolean {
  if (english.includes("{")) {
    return false;
  }
  const tokens = english
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  if (tokens.length < MIN_SHARED_PREFIX_TOKENS) {
    return false;
  }
  const first = tokens[0];
  if (!first || !isCapitalizedToken(first)) {
    return false;
  }
  let contentWords = 0;
  for (const token of tokens) {
    const bare = bareToken(token);
    if (!bare) {
      return false;
    }
    if (LABEL_FUNCTION_WORDS.has(bare.toLowerCase())) {
      continue;
    }
    if (!isCapitalizedToken(token)) {
      return false;
    }
    contentWords++;
  }
  return contentWords >= 2;
}

/** Shared translation is a short label, not a clause or a placeholder cut mid-token. */
function isSafeSharedTranslation(englishPrefix: string, shared: string): boolean {
  if (shared.includes("{") || shared.length < MIN_SHARED_TRANSLATION_CHARS) {
    return false;
  }
  return sourceTokenCount(shared) <= sourceTokenCount(englishPrefix) + 1;
}

function includesFold(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

/** Content words, ignoring closed function words such as "in" and "to". */
function contentWordCount(english: string): number {
  let count = 0;
  for (const token of english.trim().split(/\s+/)) {
    const bare = bareToken(token);
    if (!bare || LABEL_FUNCTION_WORDS.has(bare.toLowerCase())) {
      continue;
    }
    count++;
  }
  return count;
}

type LabelSpan = { start: number; end: number };

/** Bold and inline-code interiors. Markers themselves are outside the span. */
function scanMarkdownLabelSpans(source: string): { bold: LabelSpan[]; code: LabelSpan[] } {
  const bold: LabelSpan[] = [];
  const code: LabelSpan[] = [];
  let i = 0;
  let boldStart: number | null = null;
  while (i < source.length) {
    if (source[i] === "`") {
      let j = i;
      while (j < source.length && source[j] === "`") {
        j++;
      }
      const fence = "`".repeat(j - i);
      const close = source.indexOf(fence, j);
      if (close === -1) {
        i = j;
        continue;
      }
      code.push({ start: j, end: close });
      i = close + fence.length;
      continue;
    }
    if (source.startsWith("**", i)) {
      if (boldStart === null) {
        boldStart = i + 2;
      } else {
        bold.push({ start: boldStart, end: i });
        boldStart = null;
      }
      i += 2;
      continue;
    }
    i++;
  }
  return { bold, code };
}

/** Visible span text, without edge whitespace or trailing punctuation (`Target language:`). */
function labelSpanCore(source: string, span: LabelSpan): string {
  return source
    .slice(span.start, span.end)
    .trim()
    .replace(/[\p{P}]+$/u, "")
    .trim();
}

/**
 * The glossary term is the whole bold or inline-code span, not a word inside a longer phrase.
 * `**Ask for target language**` does not cite `Target language`.
 */
function spanIsExactLabel(
  spans: readonly LabelSpan[],
  source: string,
  index: number,
  english: string
): boolean {
  const end = index + english.length;
  const wanted = english.trim().toLowerCase();
  return spans.some((span) => {
    if (index < span.start || end > span.end) {
      return false;
    }
    return labelSpanCore(source, span).toLowerCase() === wanted;
  });
}

/** The match is the whole segment or the whole line, so it is a label rather than a sentence. */
function isStandaloneLabel(source: string, index: number, length: number): boolean {
  const end = index + length;
  const sourceStart = source.length - source.trimStart().length;
  if (index === sourceStart && end === source.trimEnd().length) {
    return true;
  }
  const lineStart = source.lastIndexOf("\n", index - 1) + 1;
  const newline = source.indexOf("\n", index);
  const lineEnd = newline === -1 ? source.length : newline;
  const line = source.slice(lineStart, lineEnd);
  const lineStartTrim = lineStart + (line.length - line.trimStart().length);
  const lineEndTrim = lineStart + line.trimEnd().length;
  return index === lineStartTrim && end === lineEndTrim;
}

function isAtxHeadingSpan(source: string, index: number, length: number): boolean {
  const lineStart = source.lastIndexOf("\n", index - 1) + 1;
  const newline = source.indexOf("\n", index);
  const lineEnd = newline === -1 ? source.length : newline;
  if (index + length > lineEnd) {
    return false;
  }
  const line = source.slice(lineStart, lineEnd);
  const match = /^(?:\s{0,3})#{1,6}[ \t]+(.*)$/.exec(line);
  const content = match?.[1];
  if (!match || content === undefined) {
    return false;
  }
  const contentStart = lineStart + line.length - content.length;
  return index >= contentStart && index + length <= lineEnd;
}

/**
 * The match cites a UI label: a heading, a bold or inline-code span whose text is that
 * label, or a line that is only the label. A longer bold phrase that contains the term
 * is prose. Title case inside a sentence is prose. Hindi and similar languages inflect it
 * (`Cursor account` → `कर्सर खाते`), so that occurrence stays a hint.
 * `index` is into `source` only when `source.toLowerCase()` has the same length.
 */
function isLabelCitation(
  source: string,
  index: number,
  english: string,
  spans: { bold: LabelSpan[]; code: LabelSpan[] }
): boolean {
  const span = source.slice(index, index + english.length);
  if (span.toLowerCase() !== english.toLowerCase()) {
    return false;
  }
  return (
    isAtxHeadingSpan(source, index, english.length) ||
    spanIsExactLabel(spans.bold, source, index, english) ||
    spanIsExactLabel(spans.code, source, index, english) ||
    isStandaloneLabel(source, index, english.length)
  );
}

function isLockedUiLabel(term: GlossaryTerm, translation: string): boolean {
  if (term.origin !== "ui" && term.origin !== "prefix") {
    return false;
  }
  const tokens = sourceTokenCount(term.english);
  if (tokens < MIN_LOCKED_LABEL_TOKENS || tokens > MAX_LOCKED_LABEL_TOKENS) {
    return false;
  }
  // "Sign in" is a verb plus a function word. It inflects, so it stays a hint.
  if (contentWordCount(term.english) < 2) {
    return false;
  }
  if (isUiLabelAbbreviation(term.english, translation)) {
    return false;
  }
  return translation.trim().toLowerCase() !== term.english.trim().toLowerCase();
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
  private readonly labelCheckSkips: readonly GlossaryLabelCheckSkip[];

  constructor(
    glossaryUiPath: string | string[] | undefined,
    glossaryUserPath: string | undefined,
    targetLocales: string[] = [],
    options?: GlossaryLoadOptions
  ) {
    this.labelCheckSkips = options?.labelCheckSkips ?? [];
    const uiPaths = (Array.isArray(glossaryUiPath) ? glossaryUiPath : [glossaryUiPath]).filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );
    for (const uiPath of uiPaths) {
      if (!fs.existsSync(uiPath)) {
        continue;
      }
      if (looksLikeStringsJson(uiPath)) {
        this.loadFromStringsJson(uiPath);
      } else {
        this.loadUiCsv(uiPath);
      }
    }

    this._uiStringsTermCount = this.terms.size;
    this.seedSharedUiPrefixes();

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

  /**
   * True when `glossary.labelCheckSkips` turns off the locked-label check for this term.
   * A skip with `files` applies only when `relPath` matches one of those globs.
   */
  labelCheckSkipped(termEnglish: string, locale: string, relPath?: string): boolean {
    const termKey = termEnglish.trim().toLowerCase();
    const localeKey = locale.trim().toLowerCase();
    const normalizedPath = relPath?.replace(/\\/g, "/");
    for (const skip of this.labelCheckSkips) {
      if (skip.term.trim().toLowerCase() !== termKey) {
        continue;
      }
      const locales = skip.locales.length > 0 ? skip.locales : ["*"];
      const localeOk = locales.some(
        (entry) => entry === "*" || entry.trim().toLowerCase() === localeKey
      );
      if (!localeOk) {
        continue;
      }
      if (!skip.files || skip.files.length === 0) {
        return true;
      }
      if (!normalizedPath) {
        continue;
      }
      const fileOk = skip.files.some((pattern) =>
        minimatch(normalizedPath, pattern.replace(/\\/g, "/"), { dot: true, matchBase: true })
      );
      if (fileOk) {
        return true;
      }
    }
    return false;
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
      const key = source.toLowerCase();
      const existing = this.terms.get(key);
      if (existing) {
        for (const [locale, text] of Object.entries(translations)) {
          if (!existing.translations[locale]) {
            existing.translations[locale] = text;
          }
        }
        continue;
      }
      this.terms.set(key, {
        english: source,
        translations,
        partOfSpeech: "unknown",
        origin: "ui",
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
        origin: "ui",
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
        term = { english, translations: {}, partOfSpeech: "unknown", origin: "user" };
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
        term = { english, translations: {}, partOfSpeech: "unknown", origin: "user" };
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

  /**
   * A label-shaped catalog prefix shared by two or more UI keys becomes its own term
   * when those translations share a short word-boundary prefix. Sentence stems and
   * placeholder fragments are not seeded. User CSV rows loaded afterwards still win.
   */
  private seedSharedUiPrefixes(): void {
    const catalog = Array.from(this.terms.values()).filter((term) => term.origin === "ui");
    const existingKeys = new Set(this.terms.keys());
    const candidates = new Map<string, { english: string; parents: GlossaryTerm[] }>();

    for (const term of catalog) {
      for (const prefix of tokenPrefixes(term.english)) {
        if (!isLabelShapedEnglishPrefix(prefix) || !isWordBoundaryPrefix(term.english, prefix)) {
          continue;
        }
        const key = prefix.toLowerCase();
        if (existingKeys.has(key)) {
          continue;
        }
        let bucket = candidates.get(key);
        if (!bucket) {
          bucket = { english: prefix, parents: [] };
          candidates.set(key, bucket);
        }
        bucket.parents.push(term);
      }
    }

    for (const [key, bucket] of candidates) {
      if (existingKeys.has(key) || bucket.parents.length < 2) {
        continue;
      }
      const locales = new Set<string>();
      for (const parent of bucket.parents) {
        for (const locale of Object.keys(parent.translations)) {
          locales.add(locale);
        }
      }
      const translations: Record<string, string> = {};
      for (const locale of locales) {
        const texts = bucket.parents
          .map((parent) => parent.translations[locale]?.trim() ?? "")
          .filter((text) => text.length > 0);
        if (texts.length < 2) {
          continue;
        }
        const shared = sharedTranslationPrefix(texts);
        if (!isSafeSharedTranslation(bucket.english, shared)) {
          continue;
        }
        translations[locale] = shared;
      }
      if (Object.keys(translations).length === 0) {
        continue;
      }
      this.terms.set(key, {
        english: bucket.english,
        translations,
        partOfSpeech: "unknown",
        origin: "prefix",
      });
      existingKeys.add(key);
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
        if (!isGlossaryWordBoundary(textLower, index, termLower.length)) {
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

  /**
   * Cited UI labels (catalog or seeded prefix, 2–5 words) whose translation is
   * absent from `translated`, ignoring capitalization. A citation is a heading, a
   * bold or inline-code span whose text is that label, or a line that is only that
   * label. A longer bold phrase that contains the term is prose. Title case inside a
   * sentence is prose and may inflect. A single-content-word label such as "Sign in"
   * is not locked. Single-word hints and user-CSV-only rows are not locked.
   * `relPath` selects file-scoped `labelCheckSkips`.
   */
  missingLockedUiLabels(
    source: string,
    translated: string,
    locale: string,
    relPath?: string
  ): LockedUiLabelIssue[] {
    const errors: LockedUiLabelIssue[] = [];
    const textLower = source.toLowerCase();
    const caseStable = textLower.length === source.length;
    const spans = caseStable ? scanMarkdownLabelSpans(source) : { bold: [], code: [] };
    const sortedTerms = Array.from(this.terms.entries()).sort((a, b) => b[0].length - a[0].length);
    const matchedPositions = new Set<number>();

    for (const [termLower, term] of sortedTerms) {
      const translation = term.translations[locale];
      if (!translation) {
        continue;
      }
      if (isUiLabelAbbreviation(term.english, translation)) {
        continue;
      }
      if (!isLockedUiLabel(term, translation)) {
        continue;
      }
      if (this.labelCheckSkipped(term.english, locale, relPath)) {
        continue;
      }
      let cited = false;
      let index = 0;
      const haystack = caseStable ? textLower : source;
      const needle = caseStable ? termLower : term.english;
      while ((index = haystack.indexOf(needle, index)) !== -1) {
        if (!isGlossaryWordBoundary(haystack, index, needle.length)) {
          index++;
          continue;
        }
        const positions = Array.from({ length: needle.length }, (_, i) => index + i);
        if (positions.some((pos) => matchedPositions.has(pos))) {
          index++;
          continue;
        }
        positions.forEach((pos) => matchedPositions.add(pos));
        if (
          caseStable
            ? isLabelCitation(source, index, term.english, spans)
            : source.slice(index, index + term.english.length) === term.english
        ) {
          cited = true;
        }
        index += needle.length;
      }
      if (cited && !includesFold(translated, translation)) {
        errors.push({
          term: term.english,
          translation,
          locale,
          message: `Glossary label missing: "${term.english}" should include "${translation}"`,
        });
      }
    }
    return errors;
  }

  /**
   * Forced terms that occur in `source` whose current translation is absent from `translated`.
   * Longest forced term wins, same word boundaries as placeholder protection.
   */
  missingForcedTranslations(source: string, translated: string, locale: string): string[] {
    const errors: string[] = [];
    for (const entry of this.matchedForcedTerms(source, locale)) {
      if (!translated.includes(entry.replacement)) {
        errors.push(
          `Forced glossary term missing: "${entry.english}" should include "${entry.replacement}"`
        );
      }
    }
    return errors;
  }

  /** True when `source` contains at least one forced term for `locale`. */
  sourceHasForcedTerm(source: string, locale: string): boolean {
    return this.matchedForcedTerms(source, locale).length > 0;
  }

  private matchedForcedTerms(
    source: string,
    locale: string
  ): Array<{ english: string; termLower: string; replacement: string }> {
    const textLower = source.toLowerCase();
    const matchedPositions = new Set<number>();
    const matched: Array<{ english: string; termLower: string; replacement: string }> = [];
    for (const entry of this.getForcedTermEntriesForLocale(locale)) {
      let found = false;
      let index = 0;
      while ((index = textLower.indexOf(entry.termLower, index)) !== -1) {
        if (!isGlossaryWordBoundary(textLower, index, entry.termLower.length)) {
          index++;
          continue;
        }
        const positions = Array.from({ length: entry.termLower.length }, (_, i) => index + i);
        if (positions.some((pos) => matchedPositions.has(pos))) {
          index++;
          continue;
        }
        positions.forEach((pos) => matchedPositions.add(pos));
        found = true;
        index++;
      }
      if (found) {
        matched.push(entry);
      }
    }
    return matched;
  }

  get size(): number {
    return this.terms.size;
  }
}

/**
 * Dashboard edits stay. Other cached rows miss when a forced term in the source
 * is not already present as its current translation, and markdown rows also miss
 * when a locked UI label was dropped.
 */
export function glossaryCacheMissErrors(
  glossary: Glossary,
  locale: string,
  source: string,
  cachedText: string,
  model: string | null,
  checkLockedLabels: boolean,
  relPath?: string
): string[] {
  if (model === USER_EDITED_MODEL) {
    return [];
  }
  const errors = glossary.missingForcedTranslations(source, cachedText, locale);
  if (checkLockedLabels) {
    errors.push(
      ...glossary
        .missingLockedUiLabels(source, cachedText, locale, relPath)
        .map((issue) => issue.message)
    );
  }
  return errors;
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
