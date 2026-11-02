/**
 * Shared UI placeholder token extraction for proofread-ui, plural-form validation,
 * and Python `%` / `{field}` / `%{name}` tokens.
 */

export type UiPlaceholderIssueKind = "renamed" | "dropped" | "invented" | "spec-changed";

/** One placeholder mismatch between a source string and its translation. */
export interface UiTranslationPlaceholderIssue {
  kind: UiPlaceholderIssueKind;
  /** Family key from the source when the issue is about a source token. */
  family: string;
  /** Family key from the translation when one was paired or invented. */
  translatedFamily?: string;
  message: string;
  /** Index in the UI batch when the issue was raised by {@link assertUIBatchPlaceholders}. */
  index?: number;
}

/** Thrown when a UI batch translation drops, invents, or rewrites a placeholder. */
export class UiBatchPlaceholderError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string,
    public readonly issues: UiTranslationPlaceholderIssue[] = []
  ) {
    super(message);
    this.name = "UiBatchPlaceholderError";
  }
}

interface ScannedPlaceholder {
  /** Exact substring from the source. */
  raw: string;
  /** Identity used for counts. Format specs and conversions are part of the key. */
  family: string;
  end: number;
}

const PRINTF_CONVERSIONS = "diouxXeEfFgGcrsa";

function isIdentStart(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z_]/.test(ch);
}

function isIdentChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9_]/.test(ch);
}

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && /[0-9]/.test(ch);
}

/** `{0}` / `{ 12 }` → `{0}`; other format fields keep name, conversion, and spec. */
function tryParseBraceField(text: string, start: number): ScannedPlaceholder | null {
  if (text[start] !== "{") {
    return null;
  }
  let j = start + 1;
  while (text[j] === " " || text[j] === "\t") {
    j++;
  }
  if (text[j] === "}") {
    return { raw: text.slice(start, j + 1), family: "{}", end: j + 1 };
  }

  let name = "";
  if (isDigit(text[j])) {
    while (isDigit(text[j])) {
      name += text[j]!;
      j++;
    }
  } else if (isIdentStart(text[j])) {
    while (isIdentChar(text[j])) {
      name += text[j]!;
      j++;
    }
    while (j < text.length) {
      if (text[j] === "." && isIdentStart(text[j + 1])) {
        name += ".";
        j++;
        while (isIdentChar(text[j])) {
          name += text[j]!;
          j++;
        }
        continue;
      }
      if (text[j] === "[") {
        const bracket = readSimpleIndex(text, j);
        if (!bracket) {
          return null;
        }
        name += bracket.text;
        j = bracket.end;
        continue;
      }
      break;
    }
  } else {
    return null;
  }

  const afterName = j;
  while (text[j] === " " || text[j] === "\t") {
    j++;
  }
  const onlySpacesBeforeClose = text[j] === "}";
  if (onlySpacesBeforeClose && /^[0-9]+$/.test(name) && text.slice(afterName, j).trim() === "") {
    const family = `{${name}}`;
    return { raw: text.slice(start, j + 1), family, end: j + 1 };
  }
  j = afterName;

  let conversion = "";
  if (text[j] === "!" && text[j + 1] !== undefined && "rsa".includes(text[j + 1]!)) {
    const next = text[j + 2];
    if (next === ":" || next === "}") {
      conversion = text.slice(j, j + 2);
      j += 2;
    } else {
      return null;
    }
  }

  let spec = "";
  if (text[j] === ":") {
    j++;
    const specStart = j;
    while (j < text.length && text[j] !== "}" && text[j] !== "{") {
      j++;
    }
    if (text[j] !== "}") {
      return null;
    }
    spec = text.slice(specStart, j);
  }

  if (text[j] !== "}") {
    return null;
  }
  const family = `{${name}${conversion}${spec.length > 0 ? `:${spec}` : ""}}`;
  return { raw: text.slice(start, j + 1), family, end: j + 1 };
}

function readSimpleIndex(text: string, start: number): { text: string; end: number } | null {
  if (text[start] !== "[") {
    return null;
  }
  let j = start + 1;
  if (isDigit(text[j])) {
    while (isDigit(text[j])) {
      j++;
    }
  } else if (text[j] === "'" || text[j] === '"') {
    const quote = text[j]!;
    j++;
    while (j < text.length && text[j] !== quote) {
      j++;
    }
    if (text[j] !== quote) {
      return null;
    }
    j++;
  } else {
    return null;
  }
  if (text[j] !== "]") {
    return null;
  }
  return { text: text.slice(start, j + 1), end: j + 1 };
}

function tryParseMustache(text: string, start: number): ScannedPlaceholder | null {
  if (text[start] !== "{" || text[start + 1] !== "{") {
    return null;
  }
  const close = text.indexOf("}}", start + 2);
  if (close === -1) {
    return null;
  }
  const raw = text.slice(start, close + 2);
  const inner = raw.slice(2, -2).trim();
  if (inner === "") {
    return null;
  }
  return { raw, family: inner, end: close + 2 };
}

function tryParsePercent(
  text: string,
  start: number
): { placeholder: ScannedPlaceholder | null; end: number } | null {
  if (text[start] !== "%") {
    return null;
  }
  if (text[start + 1] === "%") {
    return { placeholder: null, end: start + 2 };
  }
  const namedI18n = text.slice(start).match(/^%\{([A-Za-z_][A-Za-z0-9_]*)\}/);
  if (namedI18n) {
    const raw = namedI18n[0];
    return {
      placeholder: { raw, family: raw, end: start + raw.length },
      end: start + raw.length,
    };
  }

  let j = start + 1;
  if (text[j] === "(") {
    const close = text.indexOf(")", j + 1);
    if (close === -1) {
      return null;
    }
    const inner = text.slice(j + 1, close);
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(inner)) {
      return null;
    }
    j = close + 1;
  }

  while (j < text.length && "#0- +".includes(text[j]!)) {
    j++;
  }
  if (text[j] === "*") {
    j++;
  } else {
    while (isDigit(text[j])) {
      j++;
    }
  }
  if (text[j] === ".") {
    j++;
    if (text[j] === "*") {
      j++;
    } else {
      const precStart = j;
      while (isDigit(text[j])) {
        j++;
      }
      if (j === precStart) {
        return null;
      }
    }
  }
  const conv = text[j];
  if (conv === undefined || !PRINTF_CONVERSIONS.includes(conv)) {
    return null;
  }
  const next = text[j + 1];
  if (next !== undefined && /[A-Za-z0-9_]/.test(next)) {
    return null;
  }
  // French prose such as "% d'appels" is a percent sign plus a word, not "%d".
  if (next === "'" || next === "\u2019") {
    return null;
  }
  j++;
  const raw = text.slice(start, j);
  return { placeholder: { raw, family: raw, end: j }, end: j };
}

/** `default` keeps mustache, Python format fields, and printf. `dotnet` is composite format only. */
export type UiPlaceholderStyle = "default" | "dotnet";

/**
 * .NET composite item: `{index}`, `{index,alignment}`, `{index:format}`, `{index,alignment:format}`.
 * A `{name}` field is recorded so extract can reject it; `string.Format` would throw at runtime.
 * `{{` / `}}` are literal braces. `{{GLS_N}}` stays one token so forced glossary terms still restore.
 */
function tryParseDotnetField(text: string, start: number): ScannedPlaceholder | null {
  if (text[start] !== "{") {
    return null;
  }
  if (text[start + 1] === "{") {
    const glossary = text.slice(start).match(/^\{\{GLS_\d+\}\}/);
    if (glossary) {
      const raw = glossary[0];
      return { raw, family: raw, end: start + raw.length };
    }
    return { raw: "{{", family: "{{", end: start + 2 };
  }
  let j = start + 1;
  if (!isDigit(text[j]) && !isIdentStart(text[j])) {
    return null;
  }
  const named = isIdentStart(text[j]);
  while (isDigit(text[j]) || (named && isIdentChar(text[j]))) {
    j++;
  }
  if (!named && text[j] === ",") {
    j++;
    if (text[j] === "-") {
      j++;
    }
    if (!isDigit(text[j])) {
      return null;
    }
    while (isDigit(text[j])) {
      j++;
    }
  }
  if (text[j] === ":") {
    j++;
    while (j < text.length && text[j] !== "}" && text[j] !== "{") {
      j++;
    }
  }
  if (text[j] !== "}") {
    return null;
  }
  const raw = text.slice(start, j + 1);
  return { raw, family: raw, end: j + 1 };
}

function scanDotnetPlaceholders(text: string): ScannedPlaceholder[] {
  const found: ScannedPlaceholder[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === "}" && text[i + 1] === "}") {
      found.push({ raw: "}}", family: "}}", end: i + 2 });
      i += 2;
      continue;
    }
    if (ch === "{") {
      const field = tryParseDotnetField(text, i);
      if (field) {
        found.push(field);
        i = field.end;
        continue;
      }
    }
    i++;
  }
  return found;
}

/** True when a .NET catalog string contains a `{name}` item instead of `{0}`. */
export function hasDotnetNamedPlaceholder(text: string): boolean {
  for (const token of scanDotnetPlaceholders(text)) {
    if (/^\{[A-Za-z_]/.test(token.family)) {
      return true;
    }
  }
  return false;
}

/**
 * True when every letter and digit sits inside a placeholder.
 * `{state} · {title}` is copied as-is. `Hello {name}` is not.
 * A string with no placeholder is not placeholder-only.
 */
export function isPlaceholderOnlyUiString(
  text: string,
  style: UiPlaceholderStyle = "default"
): boolean {
  const tokens = scanUiPlaceholders(text, style);
  if (tokens.length === 0) {
    return false;
  }
  let cursor = 0;
  let outside = "";
  for (const token of tokens) {
    const start = token.end - token.raw.length;
    outside += text.slice(cursor, start);
    cursor = token.end;
  }
  outside += text.slice(cursor);
  return !/[\p{L}\p{N}]/u.test(outside);
}

/** Walk `text` and return placeholders in source order. `%%` is a literal percent in the default style. */
export function scanUiPlaceholders(
  text: string,
  style: UiPlaceholderStyle = "default"
): ScannedPlaceholder[] {
  if (style === "dotnet") {
    return scanDotnetPlaceholders(text);
  }
  const found: ScannedPlaceholder[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === "{" && text[i + 1] === "{") {
      const mustache = tryParseMustache(text, i);
      if (mustache) {
        found.push(mustache);
        i = mustache.end;
        continue;
      }
    }
    if (ch === "{") {
      const field = tryParseBraceField(text, i);
      if (field) {
        found.push(field);
        i = field.end;
        continue;
      }
    }
    if (ch === "%") {
      const percent = tryParsePercent(text, i);
      if (percent) {
        if (percent.placeholder) {
          found.push(percent.placeholder);
        }
        i = percent.end;
        continue;
      }
    }
    i++;
  }
  return found;
}

/** Extract unique placeholder substrings that must survive any suggested rewrite (proofread). */
export function extractUiPlaceholderTokens(
  original: string,
  style: UiPlaceholderStyle = "default"
): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const token of scanUiPlaceholders(original, style)) {
    if (seen.has(token.raw)) {
      continue;
    }
    seen.add(token.raw);
    found.push(token.raw);
  }
  return found;
}

/**
 * Canonical family key for a placeholder token.
 * - `{{ count }}` / `{{count}}` → `count` (inner trim; case-sensitive)
 * - `{ 0 }` / `{0}` → `{0}`
 * - `{name}` / `{price:,.2f}` / `{name!r}` stay distinct
 * - `%s`, `%.2f`, `%(name)s`, `%{name}` stay distinct
 */
export function canonicalPlaceholderFamily(
  rawToken: string,
  style: UiPlaceholderStyle = "default"
): string {
  const scanned = scanUiPlaceholders(rawToken, style);
  if (scanned.length === 1 && scanned[0]!.raw === rawToken) {
    return scanned[0]!.family;
  }
  const mustache = rawToken.match(/^\{\{\s*([\s\S]*?)\s*\}\}$/);
  if (mustache) {
    return (mustache[1] ?? "").trim();
  }
  const positional = rawToken.match(/^\{\s*([0-9]+)\s*\}$/);
  if (positional) {
    return `{${positional[1]!}}`;
  }
  if (rawToken === "%s" || rawToken === "%d") {
    return rawToken;
  }
  return rawToken;
}

/**
 * Collect placeholder families with occurrence counts (order of first appearance).
 * Mustache names are trimmed for the family key; matching remains case-sensitive.
 * Python format specs and conversions are part of the family, so reordering is
 * allowed but `{price:,.2f}` is not interchangeable with `{price}`.
 */
export function collectPlaceholderFamilies(
  text: string,
  style: UiPlaceholderStyle = "default"
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of scanUiPlaceholders(text, style)) {
    if (token.family === "") {
      continue;
    }
    counts.set(token.family, (counts.get(token.family) ?? 0) + 1);
  }
  return counts;
}

/** True when `family` is a quantity-style token (`count`, `%d`, `{n}`, `%(count)d`, …). */
export function isQuantityPlaceholderFamily(family: string): boolean {
  if (
    family === "count" ||
    family === "n" ||
    family === "%d" ||
    family === "%i" ||
    family === "%u" ||
    family === "%{count}" ||
    family === "%{n}"
  ) {
    return true;
  }
  if (/^\{[0-9]+\}$/.test(family) || /^\{0(?:,-?\d+)?(?::[^}]*)?\}$/.test(family)) {
    return true;
  }
  if (/^\{(?:count|n)(?:![rsa])?(?::[^}]*)?\}$/.test(family)) {
    return true;
  }
  if (/^%\((?:count|n)\)[0-9.+#\- *]*[diouxXeEfFgGcrsa]$/.test(family)) {
    return true;
  }
  return false;
}

/** True when the source has no quantity placeholder and no ASCII digit. */
export function isNounOnlyPluralSource(
  source: string,
  style: UiPlaceholderStyle = "default"
): boolean {
  if (/[0-9]/.test(source)) {
    return false;
  }
  for (const family of collectPlaceholderFamilies(source, style).keys()) {
    if (isQuantityPlaceholderFamily(family)) {
      return false;
    }
  }
  return true;
}

interface PlaceholderFamilyShape {
  family: string;
  /** Pairing bucket. Positional printf and literal braces are not name renames. */
  group:
    "brace" | "index" | "printf-named" | "printf-pos" | "percent-brace" | "mustache" | "literal";
  name: string;
  suffix: string;
}

/** Split a family key into the name a translator might rewrite and the spec that must stay. */
function placeholderFamilyShape(family: string): PlaceholderFamilyShape {
  const brace = family.match(
    /^\{([A-Za-z_][A-Za-z0-9_.]*(?:\[[^\]]*\])*)((?:![rsa])?(?::[\s\S]*)?)\}$/
  );
  if (brace) {
    return { family, group: "brace", name: brace[1]!, suffix: brace[2] ?? "" };
  }
  const index = family.match(/^\{(\d+)((?:,-?\d+)?(?::[\s\S]*)?)\}$/);
  if (index) {
    return { family, group: "index", name: index[1]!, suffix: index[2] ?? "" };
  }
  const namedPrintf = family.match(/^%\(([^)]+)\)([\s\S]*)$/);
  if (namedPrintf) {
    return {
      family,
      group: "printf-named",
      name: namedPrintf[1]!,
      suffix: namedPrintf[2] ?? "",
    };
  }
  const percentBrace = family.match(/^%\{([^}]+)\}$/);
  if (percentBrace) {
    return { family, group: "percent-brace", name: percentBrace[1]!, suffix: "" };
  }
  if (family.startsWith("%")) {
    return { family, group: "printf-pos", name: family, suffix: family };
  }
  if (family === "{{" || family === "}}") {
    return { family, group: "literal", name: family, suffix: "" };
  }
  return { family, group: "mustache", name: family, suffix: "" };
}

function takeUnpaired(
  extra: PlaceholderFamilyShape[],
  used: Set<number>,
  pred: (shape: PlaceholderFamilyShape) => boolean
): number {
  for (let i = 0; i < extra.length; i++) {
    if (used.has(i)) {
      continue;
    }
    if (pred(extra[i]!)) {
      used.add(i);
      return i;
    }
  }
  return -1;
}

/**
 * Compare placeholder families in `translated` with `source`.
 * Order may change. A renamed name (`{schedule}` → `{cronograma}`), a dropped or
 * invented token, or a format-spec change is reported. Equal families return `[]`.
 */
export function uiTranslationPlaceholderIssues(
  source: string,
  translated: string,
  style: UiPlaceholderStyle = "default"
): UiTranslationPlaceholderIssue[] {
  const src = collectPlaceholderFamilies(source, style);
  const dst = collectPlaceholderFamilies(translated, style);
  const missing: PlaceholderFamilyShape[] = [];
  const extra: PlaceholderFamilyShape[] = [];
  const families = new Set<string>([...src.keys(), ...dst.keys()]);
  for (const family of families) {
    const sourceCount = src.get(family) ?? 0;
    const translatedCount = dst.get(family) ?? 0;
    const shape = placeholderFamilyShape(family);
    for (let i = 0; i < sourceCount - translatedCount; i++) {
      missing.push(shape);
    }
    for (let i = 0; i < translatedCount - sourceCount; i++) {
      extra.push(shape);
    }
  }
  if (missing.length === 0 && extra.length === 0) {
    return [];
  }

  const usedExtra = new Set<number>();
  const issues: UiTranslationPlaceholderIssue[] = [];
  const unmatched: PlaceholderFamilyShape[] = [];
  const nameGroups = new Set(["brace", "printf-named", "percent-brace", "mustache"]);

  for (const item of missing) {
    const renamed = takeUnpaired(
      extra,
      usedExtra,
      (candidate) =>
        candidate.group === item.group &&
        candidate.suffix === item.suffix &&
        candidate.name !== item.name &&
        nameGroups.has(item.group)
    );
    if (renamed >= 0) {
      const translatedFamily = extra[renamed]!.family;
      issues.push({
        kind: "renamed",
        family: item.family,
        translatedFamily,
        message: `placeholder "${item.family}" was renamed to "${translatedFamily}"`,
      });
      continue;
    }
    const specChanged = takeUnpaired(
      extra,
      usedExtra,
      (candidate) =>
        candidate.group === item.group &&
        candidate.name === item.name &&
        candidate.suffix !== item.suffix
    );
    if (specChanged >= 0) {
      const translatedFamily = extra[specChanged]!.family;
      issues.push({
        kind: "spec-changed",
        family: item.family,
        translatedFamily,
        message: `placeholder "${item.family}" changed its format spec to "${translatedFamily}"`,
      });
      continue;
    }
    const renamedAndSpec = takeUnpaired(
      extra,
      usedExtra,
      (candidate) =>
        candidate.group === item.group && candidate.name !== item.name && nameGroups.has(item.group)
    );
    if (renamedAndSpec >= 0) {
      const translatedFamily = extra[renamedAndSpec]!.family;
      issues.push({
        kind: "renamed",
        family: item.family,
        translatedFamily,
        message: `placeholder "${item.family}" was renamed to "${translatedFamily}"`,
      });
      continue;
    }
    if (item.group === "printf-pos") {
      const swapped = takeUnpaired(
        extra,
        usedExtra,
        (candidate) => candidate.group === "printf-pos" && candidate.family !== item.family
      );
      if (swapped >= 0) {
        const translatedFamily = extra[swapped]!.family;
        issues.push({
          kind: "spec-changed",
          family: item.family,
          translatedFamily,
          message: `placeholder "${item.family}" changed its format spec to "${translatedFamily}"`,
        });
        continue;
      }
    }
    unmatched.push(item);
  }

  for (const item of unmatched) {
    issues.push({
      kind: "dropped",
      family: item.family,
      message: `placeholder "${item.family}" is missing from the translation`,
    });
  }
  for (let i = 0; i < extra.length; i++) {
    if (usedExtra.has(i)) {
      continue;
    }
    const invented = extra[i]!.family;
    issues.push({
      kind: "invented",
      family: invented,
      translatedFamily: invented,
      message: `translation invented placeholder "${invented}"`,
    });
  }
  return issues;
}

const PLACEHOLDER_RETRY_HINT =
  "Copy every placeholder name and format spec unchanged. Do not translate names inside braces.";

/**
 * Require each translation to carry the same placeholder families, with the same
 * counts, as its source. Order may change. A mismatch throws so the model
 * fallback loop can retry.
 */
export function assertUIBatchPlaceholders(
  sources: string[],
  translations: string[],
  rawResponse = "",
  style: UiPlaceholderStyle = "default"
): void {
  const lines: string[] = [];
  const issues: UiTranslationPlaceholderIssue[] = [];
  const count = Math.min(sources.length, translations.length);
  for (let i = 0; i < count; i++) {
    for (const issue of uiTranslationPlaceholderIssues(
      sources[i] ?? "",
      translations[i] ?? "",
      style
    )) {
      lines.push(`index ${i}: ${issue.message}`);
      issues.push({ ...issue, index: i });
    }
  }
  if (lines.length === 0) {
    return;
  }
  throw new UiBatchPlaceholderError(
    `UI batch placeholder validation failed: ${lines.join("; ")}. ${PLACEHOLDER_RETRY_HINT}`,
    rawResponse,
    issues
  );
}
