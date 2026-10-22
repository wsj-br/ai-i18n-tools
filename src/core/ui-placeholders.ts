/**
 * Shared UI placeholder token extraction for proofread-ui, plural-form validation,
 * and Python `%` / `{field}` / `%{name}` tokens.
 */

/** Thrown when a UI batch translation drops, invents, or rewrites a placeholder. */
export class UiBatchPlaceholderError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string
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
  j++;
  const raw = text.slice(start, j);
  return { placeholder: { raw, family: raw, end: j }, end: j };
}

/** Walk `text` and return placeholders in source order. `%%` is a literal percent. */
export function scanUiPlaceholders(text: string): ScannedPlaceholder[] {
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
export function extractUiPlaceholderTokens(original: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const token of scanUiPlaceholders(original)) {
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
export function canonicalPlaceholderFamily(rawToken: string): string {
  const scanned = scanUiPlaceholders(rawToken);
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
export function collectPlaceholderFamilies(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of scanUiPlaceholders(text)) {
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
  if (/^\{[0-9]+\}$/.test(family)) {
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
export function isNounOnlyPluralSource(source: string): boolean {
  if (/[0-9]/.test(source)) {
    return false;
  }
  for (const family of collectPlaceholderFamilies(source).keys()) {
    if (isQuantityPlaceholderFamily(family)) {
      return false;
    }
  }
  return true;
}

/**
 * Require each translation to carry the same placeholder families, with the same
 * counts, as its source. Order may change. A mismatch throws so the model
 * fallback loop can retry.
 */
export function assertUIBatchPlaceholders(
  sources: string[],
  translations: string[],
  rawResponse = ""
): void {
  const issues: string[] = [];
  const count = Math.min(sources.length, translations.length);
  for (let i = 0; i < count; i++) {
    const src = collectPlaceholderFamilies(sources[i] ?? "");
    const dst = collectPlaceholderFamilies(translations[i] ?? "");
    for (const [family, expected] of src) {
      const got = dst.get(family) ?? 0;
      if (got !== expected) {
        issues.push(`index ${i}: placeholder "${family}" count ${got}, expected ${expected}`);
      }
    }
    for (const family of dst.keys()) {
      if (!src.has(family)) {
        issues.push(`index ${i}: invented placeholder "${family}"`);
      }
    }
  }
  if (issues.length === 0) {
    return;
  }
  throw new UiBatchPlaceholderError(
    `UI batch placeholder validation failed: ${issues.join("; ")}`,
    rawResponse
  );
}
