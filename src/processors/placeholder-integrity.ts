/**
 * Post-protect / post-restore integrity checks for document translation placeholders.
 *
 * Layer A (pre-restore): model output must keep the same multiset of `{{IDENT}}`
 * tokens; structural tokens (`{{HTM_N}}`, `{{ADM_*}}`) must keep their ordered
 * subsequence. Content tokens (`{{ILC_N}}`, `{{URL_N}}`, `{{SE}}`, …) may move with
 * natural word order — restore maps them by id / occurrence.
 * Layer B (post-restore): restored HTML tag kinds must match the source, and any
 * leftover `{{IDENT}}` must already have existed in the unprotected source.
 */

import { protectHtmlTags } from "./html-tag-placeholders.js";

/** Matches `{{IDENT}}` with optional inner whitespace; skips `style={{…}}` object literals. */
const IDENT_TOKEN_RE = /\{\{\s*([A-Za-z_][A-Za-z0-9_-]*)\s*\}\}/g;

/** Leftover JSX-attribute appendix line markers (not `{{IDENT}}` form). */
const JXA_APPENDIX_LEAK_RE = /\|\|\s*JXA\d+:/i;

const EMPHASIS_TOKENS = new Set(["IT", "IU", "SE", "SU", "ST"]);

/** Numbered internal prefixes; hyphen vs underscore are equivalent for sequence compare. */
const NUMBERED_INTERNAL_PREFIXES = [
  "ADM_OPEN",
  "ADM_END",
  "ADM_TCLOSE",
  "HTM",
  "GLS",
  "MDX",
  "JXA",
  "URL",
  "BLD",
  "ILC",
  "ANC",
  "HDG",
] as const;

/**
 * Extract `{{IDENT}}` tokens in storage/logical order (not visual bidi order).
 * Returns the full matched token spellings (including braces and any inner whitespace).
 */
export function extractIdentTokens(text: string): string[] {
  const out: string[] = [];
  IDENT_TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = IDENT_TOKEN_RE.exec(text)) !== null) {
    out.push(m[0]!);
  }
  return out;
}

/**
 * Normalize a token spelling for sequence comparison:
 * - strip optional whitespace inside braces
 * - for numbered internals, unify `-` vs `_` and uppercase the prefix
 * - emphasis tokens compared case-insensitively as their canonical form
 * - author interpolations compared with exact inner name (case-sensitive) after whitespace strip
 */
export function normalizeIdentTokenForSequence(token: string): string {
  const m = /^\{\{\s*([A-Za-z_][A-Za-z0-9_-]*)\s*\}\}$/.exec(token);
  if (!m?.[1]) {
    return token;
  }
  const inner = m[1];
  const upper = inner.toUpperCase();
  if (EMPHASIS_TOKENS.has(upper)) {
    return `{{${upper}}}`;
  }
  for (const prefix of NUMBERED_INTERNAL_PREFIXES) {
    const re = new RegExp(`^${prefix}[-_]?(\\d+)$`, "i");
    const nm = re.exec(inner);
    if (nm?.[1]) {
      return `{{${prefix}_${nm[1]}}}`;
    }
  }
  return `{{${inner}}}`;
}

function sequenceKey(token: string): string {
  return normalizeIdentTokenForSequence(token);
}

function countByToken(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of tokens) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return counts;
}

/**
 * Structural tokens whose relative order must stay fixed (open/close nesting).
 * Content placeholders (`{{ILC_N}}`, `{{URL_N}}`, `{{BLD_N}}`, …) restore by id and may
 * move with natural word order as long as each id appears exactly once.
 */
const ORDER_SENSITIVE_PREFIXES = ["HTM", "ADM_OPEN", "ADM_END", "ADM_TCLOSE"] as const;

function isOrderSensitiveToken(normalizedToken: string): boolean {
  const m = /^\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}$/.exec(normalizedToken);
  if (!m?.[1]) {
    return false;
  }
  const inner = m[1];
  for (const prefix of ORDER_SENSITIVE_PREFIXES) {
    if (inner === prefix) {
      return true;
    }
    if (new RegExp(`^${prefix}_(\\d+)$`).test(inner)) {
      return true;
    }
  }
  return false;
}

function compareTokenMultisets(expected: string[], actual: string[]): string | null {
  if (expected.length !== actual.length) {
    return `HTML tag placeholders reused or dropped: expected ${expected.length} {{…}} token(s), got ${actual.length}`;
  }
  const expectedCounts = countByToken(expected);
  const actualCounts = countByToken(actual);
  for (const [token, expCount] of expectedCounts) {
    const actCount = actualCounts.get(token) ?? 0;
    if (actCount !== expCount) {
      return `HTML tag placeholders reused or dropped: expected ${expCount} ${token} token(s), got ${actCount}`;
    }
  }
  for (const [token, actCount] of actualCounts) {
    if (!expectedCounts.has(token)) {
      return `HTML tag placeholders reused or dropped: expected 0 ${token} token(s), got ${actCount}`;
    }
  }
  return null;
}

/**
 * Compare IDENT integrity (logical order).
 *
 * - Same multiset of all `{{IDENT}}` tokens (each id / emphasis type the right number of times).
 * - Structural tokens (`{{HTM_N}}`, `{{ADM_*_N}}`) must keep the same ordered subsequence
 *   (open/close nesting). Content tokens (`{{ILC_N}}`, `{{URL_N}}`, `{{SE}}`, …) may move
 *   with natural word order — restore maps them by id / occurrence, not by absolute position.
 *
 * Returns an error message or null.
 */
export function compareIdentTokenSequences(
  expectedProtectedText: string,
  modelOutput: string
): string | null {
  const expected = extractIdentTokens(expectedProtectedText).map(sequenceKey);
  const actual = extractIdentTokens(modelOutput).map(sequenceKey);

  const multisetErr = compareTokenMultisets(expected, actual);
  if (multisetErr) {
    return multisetErr;
  }

  const expectedStructural = expected.filter(isOrderSensitiveToken);
  const actualStructural = actual.filter(isOrderSensitiveToken);
  for (let i = 0; i < expectedStructural.length; i++) {
    if (expectedStructural[i] !== actualStructural[i]) {
      return `HTML tag placeholders reused or dropped: token sequence mismatch at index ${i} (expected ${expectedStructural[i]}, got ${actualStructural[i]})`;
    }
  }
  return null;
}

/**
 * Build the protected text string that was (or would be) sent to the model for sequence compare.
 */
export function protectedTextForSequenceCompare(state: {
  text: string;
  jsxAttributeText?: string;
}): string {
  if (state.jsxAttributeText) {
    return `${state.text}\n${state.jsxAttributeText}`;
  }
  return state.text;
}

/**
 * Pre-restore check: model output IDENT sequence must match protected source.
 */
export function collectPreRestorePlaceholderErrors(
  protectedState: { text: string; jsxAttributeText?: string } | undefined,
  modelOutput: string,
  sourceHash?: string
): string[] {
  if (!protectedState) {
    return [];
  }
  const expected = protectedTextForSequenceCompare(protectedState);
  const err = compareIdentTokenSequences(expected, modelOutput);
  if (!err) {
    return [];
  }
  const suffix = sourceHash ? ` (hash ${sourceHash})` : "";
  return [`${err}${suffix}`];
}

/** Fingerprint for one HTML tag map entry: kind + lowercased tag name (attrs ignored). */
export function htmlTagKindFingerprint(tag: string): string {
  const trimmed = tag.trim();
  if (trimmed.startsWith("<!--")) {
    return "comment";
  }
  const close = /^<\/\s*([A-Za-z][A-Za-z0-9]*)\s*>$/i.exec(trimmed);
  if (close?.[1]) {
    return `close:${close[1].toLowerCase()}`;
  }
  const selfClosing = /^<\s*([A-Za-z][A-Za-z0-9]*)\b[^>]*\/\s*>$/i.exec(trimmed);
  if (selfClosing?.[1]) {
    return `self:${selfClosing[1].toLowerCase()}`;
  }
  const open = /^<\s*([A-Za-z][A-Za-z0-9]*)\b[^>]*>$/i.exec(trimmed);
  if (open?.[1]) {
    return `open:${open[1].toLowerCase()}`;
  }
  return `raw:${trimmed.toLowerCase()}`;
}

/**
 * Compare HTML tag-kind sequences after restore. Returns error or null.
 */
export function compareHtmlTagKindSequences(
  sourceText: string,
  restoredText: string
): string | null {
  const sourceMap = protectHtmlTags(sourceText).htmlTagMap.map(htmlTagKindFingerprint);
  const restoredMap = protectHtmlTags(restoredText).htmlTagMap.map(htmlTagKindFingerprint);
  if (sourceMap.length !== restoredMap.length) {
    return `HTML tag placeholders reused or dropped: expected ${sourceMap.length} HTML tag(s), got ${restoredMap.length}`;
  }
  for (let i = 0; i < sourceMap.length; i++) {
    if (sourceMap[i] !== restoredMap[i]) {
      return `HTML tag placeholders reused or dropped: tag kind mismatch at index ${i} (expected ${sourceMap[i]}, got ${restoredMap[i]})`;
    }
  }
  return null;
}

/**
 * After restore, every `{{IDENT}}` in the output must already exist in the unprotected source.
 * Also flags leftover `||JXA…:` appendix markers.
 */
export function collectUnexpectedIdentErrors(
  unprotectedSource: string,
  restoredText: string
): string[] {
  const errors: string[] = [];
  if (JXA_APPENDIX_LEAK_RE.test(restoredText)) {
    errors.push("Internal translation placeholder leaked in output");
  }

  const sourceTokens = new Set(extractIdentTokens(unprotectedSource));
  const seenUnexpected = new Set<string>();
  for (const token of extractIdentTokens(restoredText)) {
    if (sourceTokens.has(token)) {
      continue;
    }
    if (seenUnexpected.has(token)) {
      continue;
    }
    seenUnexpected.add(token);
    // Official leftovers use the legacy leak message so summarizeQualityError stays stable.
    if (isOfficialInternalTokenSpelling(token)) {
      errors.push("Internal translation placeholder leaked in output");
    } else {
      errors.push(`Unexpected {{…}} token in translation: ${token}`);
    }
  }
  return errors;
}

function isOfficialInternalTokenSpelling(token: string): boolean {
  const m = /^\{\{\s*([A-Za-z_][A-Za-z0-9_-]*)\s*\}\}$/.exec(token);
  if (!m?.[1]) {
    return false;
  }
  const inner = m[1];
  const upper = inner.toUpperCase();
  if (EMPHASIS_TOKENS.has(upper)) {
    return true;
  }
  for (const prefix of NUMBERED_INTERNAL_PREFIXES) {
    const re = new RegExp(`^${prefix}[-_]?\\d+$`, "i");
    if (re.test(inner)) {
      return true;
    }
  }
  return false;
}

/**
 * Post-restore integrity checks for validateDocTranslatePair.
 */
export function collectPostRestorePlaceholderErrors(
  unprotectedSource: string,
  restoredText: string,
  sourceHash?: string
): string[] {
  const suffix = sourceHash ? ` (hash ${sourceHash})` : "";
  const errors: string[] = [];

  const tagErr = compareHtmlTagKindSequences(unprotectedSource, restoredText);
  if (tagErr) {
    errors.push(`${tagErr}${suffix}`);
  }

  for (const e of collectUnexpectedIdentErrors(unprotectedSource, restoredText)) {
    errors.push(`${e}${suffix}`);
  }

  return errors;
}
