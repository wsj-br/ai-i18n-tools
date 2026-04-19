import type { CldrPluralForm, Segment } from "./types.js";
import { BatchTranslationError } from "./types.js";
import { pluralCategoryExamplesHint } from "./plural-forms.js";
import {
  PROMPTS,
  type PromptStrings,
  type DocumentPromptStrings,
  type UIPromptStrings,
  type LintSourcePromptStrings,
} from "./prompts.js";

/**
 * Document translation prompts follow common OpenRouter-style doc-translation patterns
 * (`buildBatchPrompt`, `buildPrompt`, `MARKDOWN_PRESERVATION_RULES`). Adjust here when prompt strategy changes.
 *
 * For **JSON** (Docusaurus locale files) and **SVG** text segments, we append context addenda so batch
 * `<t id="N">` responses stay robust outside pure markdown. Single-segment calls use plain segment text in the user message (see {@link buildDocumentSinglePrompt}).
 *
 * Prompt **content** lives in `prompts.ts`; this module handles assembly and parsing only.
 */
export type DocumentPromptContentType = "markdown" | "json" | "svg";
export type DocumentBatchResponseFormat = "xml-tags" | "json-array" | "json-object";

export type { PromptStrings, DocumentPromptStrings, UIPromptStrings, LintSourcePromptStrings };
export { PROMPTS };

// ── Backward-compatible exported constants (derived from JSON) ────────────

/**
 * Extra system-prompt guidance so models do not break CommonMark / GFM structure.
 * Fenced ``` / ~~~ blocks are not sent to the model (`DocumentSplitter` marks them non-translatable).
 * @see docs/OVERVIEW.md (document translation)
 */
export const MARKDOWN_PRESERVATION_RULES: string = PROMPTS.document.markdownPreservation;

/** Appended for locale JSON message segments (batch `<t id="N">` response format). */
export const JSON_SEGMENT_CONTEXT_ADDENDUM: string = PROMPTS.document.jsonSegmentAddendum;

/** Appended for SVG <text>/<tspan>/<title> extracted segments. */
export const SVG_SEGMENT_CONTEXT_ADDENDUM: string = PROMPTS.document.svgSegmentAddendum;

// ── Builder options ───────────────────────────────────────────────────────

export interface PromptBuilderOptions {
  sourceLanguageLabel: string;
  targetLanguageLabel: string;
  glossaryHints: string[];
}

// ── Shared helpers ────────────────────────────────────────────────────────

function buildGlossaryBlock(hints: string[], preamble?: string): string {
  const filtered = hints.filter((h) => h.trim().length > 0);
  if (filtered.length === 0) return "";
  const prefix = preamble ? `\n\n${preamble}` : "";
  return `${prefix}\n<glossary>\n${filtered.join("\n")}\n</glossary>\n`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function unescapeXml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Shared rules block for document batch/single prompts (all document types). */
function documentCoreRulesBlock(opts: PromptBuilderOptions): string {
  return `Translate from ${opts.sourceLanguageLabel} to ${opts.targetLanguageLabel}.

${PROMPTS.document.coreRules}

${PROMPTS.document.markdownPreservation}`;
}

function contentTypeAddendum(contentType: DocumentPromptContentType): string {
  if (contentType === "json") return PROMPTS.document.jsonSegmentAddendum;
  if (contentType === "svg") return PROMPTS.document.svgSegmentAddendum;
  return "";
}

// ── Document prompt builders ──────────────────────────────────────────────

export function buildDocumentBatchPrompt(
  segments: Segment[],
  opts: PromptBuilderOptions,
  contentType: DocumentPromptContentType = "markdown",
  responseFormat: DocumentBatchResponseFormat = "xml-tags"
): { systemPrompt: string; userContent: string } {
  const glossary = buildGlossaryBlock(opts.glossaryHints);
  const addendum = contentTypeAddendum(contentType);

  if (responseFormat === "json-array") {
    const userContent = JSON.stringify(
      segments.map((s) => s.content),
      null,
      2
    );
    const systemPrompt = `${documentCoreRulesBlock(opts)}${addendum}

${PROMPTS.document.batchJsonArrayInstruction}${glossary}`;
    return { systemPrompt, userContent };
  }

  if (responseFormat === "json-object") {
    const payload: Record<string, string> = {};
    for (let i = 0; i < segments.length; i++) {
      payload[String(i)] = segments[i]?.content ?? "";
    }
    const userContent = JSON.stringify(payload, null, 2);
    const systemPrompt = `${documentCoreRulesBlock(opts)}${addendum}

${PROMPTS.document.batchJsonObjectInstruction}${glossary}`;
    return { systemPrompt, userContent };
  }

  const segBlocks = segments
    .map((s, i) => `<seg id="${i}">${escapeXml(s.content)}</seg>`)
    .join("\n");
  const systemPrompt = `${documentCoreRulesBlock(opts)}${addendum}

${PROMPTS.document.batchXmlInstruction}${glossary}`;
  const userContent = `<segments>
${segBlocks}
</segments>`;

  return { systemPrompt, userContent };
}

export function buildDocumentSinglePrompt(
  content: string,
  opts: PromptBuilderOptions,
  contentType: DocumentPromptContentType = "markdown"
): { systemPrompt: string; userContent: string } {
  const glossary = buildGlossaryBlock(opts.glossaryHints);
  const addendum = contentTypeAddendum(contentType);
  const outputHint = PROMPTS.document.singleSegmentOutputInstruction;

  let systemPrompt: string;

  if (contentType === "markdown") {
    const example = PROMPTS.document.markdownExample.replace(
      /\{\{targetLang\}\}/g,
      opts.targetLanguageLabel
    );
    systemPrompt = `${documentCoreRulesBlock(opts)}

${example}

---
${outputHint}${glossary}`;
  } else {
    systemPrompt = `${documentCoreRulesBlock(opts)}${addendum}

---
${outputHint}${glossary}`;
  }

  const userContent = content;

  return { systemPrompt, userContent };
}

// ── UI prompt builder ─────────────────────────────────────────────────────

export function buildUIPromptMessages(
  texts: string[],
  opts: {
    sourceLanguageLabel: string;
    targetLanguageLabel: string;
    glossaryHints?: string[];
  }
): { systemPrompt: string; userContent: string } {
  const systemBase = PROMPTS.ui.systemPrompt.join("\n");
  const glossaryBlock = buildGlossaryBlock(opts.glossaryHints ?? [], PROMPTS.ui.glossaryPreamble);

  const userContent = `Translate these ${texts.length} UI strings from ${opts.sourceLanguageLabel} to ${opts.targetLanguageLabel} and return a JSON array:

${JSON.stringify(texts, null, 2)}

Respond with ONLY the JSON array. No other text.`;

  return { systemPrompt: systemBase + glossaryBlock, userContent };
}

/** Step 0: fill `translated[sourceLocale]` cardinal forms from the original literal. */
export function buildPluralStep0Prompt(opts: {
  sourceLanguageLabel: string;
  originalLiteral: string;
  requiredForms: CldrPluralForm[];
  zeroDigit: boolean;
  glossaryHints?: string[];
  /** When set, appends an `Intl.PluralRules` sample-count line for this BCP-47 tag. */
  intlPluralLocaleTag?: string;
}): { systemPrompt: string; userContent: string } {
  const glossaryBlock = buildGlossaryBlock(
    opts.glossaryHints ?? [],
    PROMPTS.ui.glossaryPreamblePlural
  );
  const formsList = opts.requiredForms.join(", ");
  const zeroNote = opts.zeroDigit
    ? 'For the "zero" category, prefer the literal digit 0 where the quantity appears when that matches the language; still keep other placeholders exactly.'
    : 'For the "zero" category, use natural zero-quantity phrasing for this language; preserve {{count}} where needed.';
  const intlHint =
    opts.intlPluralLocaleTag !== undefined && opts.intlPluralLocaleTag.trim() !== ""
      ? `\n${pluralCategoryExamplesHint(opts.intlPluralLocaleTag)}\n`
      : "";

  const userContent = `Language — write every output string in this language: ${opts.sourceLanguageLabel}

Original UI string from source code (context):
${JSON.stringify(opts.originalLiteral)}

Generate cardinal plural variants for exactly these categories: ${formsList}.
${zeroNote}
${intlHint}
Reply with ONLY one JSON object whose keys are exactly those category names (strings: zero, one, two, few, many, other as applicable) and whose values are the UI text for ${opts.sourceLanguageLabel}.`;

  return {
    systemPrompt: PROMPTS.ui.pluralFormsSystemPrompt.join("\n") + glossaryBlock,
    userContent,
  };
}

/** Pass B: translate source-locale plural object into target locale forms. */
export function buildPluralPassBPrompt(opts: {
  sourceLanguageLabel: string;
  targetLanguageLabel: string;
  sourceForms: Partial<Record<CldrPluralForm, string>>;
  requiredTargetForms: CldrPluralForm[];
  originalLiteral: string;
  glossaryHints?: string[];
  /** When set, appends an `Intl.PluralRules` sample-count line for the target BCP-47 tag. */
  intlPluralLocaleTag?: string;
}): { systemPrompt: string; userContent: string } {
  const glossaryBlock = buildGlossaryBlock(
    opts.glossaryHints ?? [],
    PROMPTS.ui.glossaryPreamblePlural
  );
  const intlHint =
    opts.intlPluralLocaleTag !== undefined && opts.intlPluralLocaleTag.trim() !== ""
      ? `\n${pluralCategoryExamplesHint(opts.intlPluralLocaleTag)}\n`
      : "";

  const userContent = `Translate cardinal plural UI strings from ${opts.sourceLanguageLabel} to ${opts.targetLanguageLabel}.

Original developer string (context):
${JSON.stringify(opts.originalLiteral)}

Source-language plural strings (JSON object):
${JSON.stringify(opts.sourceForms, null, 2)}

Produce translations for exactly these target categories: ${opts.requiredTargetForms.join(", ")}.
${intlHint}
Reply with ONLY one JSON object whose keys are exactly those category names and whose values are the translated UI strings in ${opts.targetLanguageLabel}.`;

  return {
    systemPrompt: PROMPTS.ui.pluralFormsSystemPrompt.join("\n") + glossaryBlock,
    userContent,
  };
}

// ── Lint-source prompt ────────────────────────────────────────────────────

export function buildLintSourcePromptMessages(
  texts: string[],
  opts: {
    languageLabel: string;
    glossaryHints?: string[];
  }
): { systemPrompt: string; userContent: string } {
  const glossaryBlock = buildGlossaryBlock(
    opts.glossaryHints ?? [],
    PROMPTS.lintSource.glossaryPreamble
  );
  const systemPrompt = PROMPTS.lintSource.systemPrompt.join("\n") + glossaryBlock;
  const userContent = `${PROMPTS.lintSource.userMessagePreamble} ${opts.languageLabel}

${JSON.stringify(texts, null, 2)}

${PROMPTS.lintSource.outputContract.trim()}
Respond with ONLY the JSON array of length ${texts.length}.`;

  return { systemPrompt, userContent };
}

// ── Response parsing: shared helpers ──────────────────────────────────────

/** Base class for prompt/response parse errors that carry the raw model output. */
export class PromptParseError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string
  ) {
    super(message);
    this.name = "PromptParseError";
  }
}

export class DocumentBatchJsonParseError extends PromptParseError {
  constructor(message: string, rawResponse: string) {
    super(message, rawResponse);
    this.name = "DocumentBatchJsonParseError";
  }
}

export class UIJsonArrayParseError extends PromptParseError {
  constructor(message: string, rawResponse: string) {
    super(message, rawResponse);
    this.name = "UIJsonArrayParseError";
  }
}

export class PluralFormsParseError extends PromptParseError {
  constructor(message: string, rawResponse: string) {
    super(message, rawResponse);
    this.name = "PluralFormsParseError";
  }
}

export class LintSourceJsonParseError extends PromptParseError {
  constructor(message: string, rawResponse: string) {
    super(message, rawResponse);
    this.name = "LintSourceJsonParseError";
  }
}

/** One slot in a lint-source batch response (aligned with input string index). */
export interface LintSourceSlotResult {
  issues: LintSourceIssue[];
}

export interface LintSourceIssue {
  severity: "error" | "warning";
  message: string;
  suggestedText?: string;
  /** Set when a model suggestion was dropped because it broke placeholders. */
  suggestionDroppedPlaceholderMismatch?: boolean;
}

/**
 * Parse JSON array from model: `[ { "issues": [...] }, ... ]` with length `expectedLength`.
 * If the model returns fewer or more slots than `expectedLength`, pads with empty issues or truncates (best-effort) and sets `lengthWarning`.
 */
export function parseLintSourceBatchResponse(
  content: string,
  expectedLength: number
): { slots: LintSourceSlotResult[]; lengthWarning: string | null } {
  const cleaned = cleanJsonResponse(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new LintSourceJsonParseError(
      `lint-source batch: invalid JSON (${e instanceof Error ? e.message : String(e)})`,
      content
    );
  }
  if (!Array.isArray(parsed)) {
    throw new LintSourceJsonParseError("lint-source batch: response is not a JSON array", content);
  }

  let lengthWarning: string | null = null;
  if (parsed.length !== expectedLength) {
    lengthWarning = `lint-source batch: expected ${expectedLength} slot objects, got ${parsed.length} (using best-effort padding/truncation)`;
  }

  const out: LintSourceSlotResult[] = [];
  for (let i = 0; i < expectedLength; i++) {
    const row = i < parsed.length ? parsed[i] : undefined;
    if (row === null || row === undefined || typeof row !== "object" || Array.isArray(row)) {
      if (row !== undefined) {
        lengthWarning =
          lengthWarning ??
          `lint-source batch: slot ${i} is not a JSON object (treated as no issues)`;
      }
      out.push({ issues: [] });
      continue;
    }
    const rec = row as Record<string, unknown>;
    const rawIssues = rec["issues"];
    const issues: LintSourceIssue[] = [];
    if (Array.isArray(rawIssues)) {
      for (const item of rawIssues) {
        if (item === null || typeof item !== "object" || Array.isArray(item)) {
          continue;
        }
        const o = item as Record<string, unknown>;
        const sevRaw = o["severity"];
        const msgRaw = o["message"];
        const sugRaw = o["suggestedText"];
        const severity =
          sevRaw === "warning" || sevRaw === "error"
            ? sevRaw
            : sevRaw === "warn"
              ? "warning"
              : "warning";
        const message = typeof msgRaw === "string" ? msgRaw.trim() : "";
        if (!message) {
          continue;
        }
        const suggestedText =
          typeof sugRaw === "string" && sugRaw.trim().length > 0 ? sugRaw : undefined;
        issues.push({ severity, message, suggestedText });
      }
    }
    out.push({ issues });
  }

  return { slots: out, lengthWarning };
}

function cleanJsonResponse(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// ── XML batch parser ──────────────────────────────────────────────────────

export function parseBatchTranslationResponse(
  response: string,
  segmentCount: number,
  rawResponse: string
): Map<number, string> {
  const regex = /<t\s+id="(\d+)"[^>]*>\s*([\s\S]*?)\s*<\/t>/g;
  const byIndex = new Map<number, string>();
  let match;

  while ((match = regex.exec(response)) !== null) {
    const id = parseInt(match[1], 10);
    const rawContent = match[2].trim();
    byIndex.set(id, unescapeXml(rawContent));
  }

  if (byIndex.size !== segmentCount) {
    throw new BatchTranslationError(segmentCount, byIndex.size, rawResponse);
  }

  for (let i = 0; i < segmentCount; i++) {
    if (byIndex.get(i) === undefined) {
      throw new BatchTranslationError(segmentCount, byIndex.size, rawResponse);
    }
  }

  return byIndex;
}

// ── JSON batch parsers (unified) ──────────────────────────────────────────

export function parseBatchJsonArrayResponse(
  content: string,
  expectedLength: number
): Map<number, string> {
  const cleaned = cleanJsonResponse(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new DocumentBatchJsonParseError(
      `Document batch (json-array): invalid JSON (${e instanceof Error ? e.message : String(e)})`,
      content
    );
  }
  if (!Array.isArray(parsed)) {
    throw new DocumentBatchJsonParseError(
      "Document batch (json-array): response is not a JSON array",
      content
    );
  }
  if (parsed.length !== expectedLength) {
    throw new BatchTranslationError(expectedLength, parsed.length, content);
  }
  const out = new Map<number, string>();
  for (let i = 0; i < expectedLength; i++) {
    out.set(i, String(parsed[i]));
  }
  return out;
}

export function parseBatchJsonObjectResponse(
  content: string,
  expectedLength: number
): Map<number, string> {
  const cleaned = cleanJsonResponse(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new DocumentBatchJsonParseError(
      `Document batch (json-object): invalid JSON (${e instanceof Error ? e.message : String(e)})`,
      content
    );
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new DocumentBatchJsonParseError(
      "Document batch (json-object): response is not a JSON object",
      content
    );
  }
  const record = parsed as Record<string, unknown>;
  const out = new Map<number, string>();
  for (let i = 0; i < expectedLength; i++) {
    const key = String(i);
    if (!(key in record)) {
      throw new BatchTranslationError(expectedLength, out.size, content);
    }
    out.set(i, String(record[key]));
  }
  return out;
}

// ── UI JSON array parser ──────────────────────────────────────────────────

export function parseUIJsonArrayResponse(content: string, expectedLength: number): string[] {
  const cleaned = cleanJsonResponse(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new UIJsonArrayParseError(
      `UI batch: invalid JSON (${e instanceof Error ? e.message : String(e)})`,
      content
    );
  }
  if (!Array.isArray(parsed)) {
    throw new UIJsonArrayParseError("UI batch: response is not a JSON array", content);
  }
  if (parsed.length !== expectedLength) {
    throw new UIJsonArrayParseError(
      `UI batch: expected ${expectedLength} strings, got ${parsed.length}`,
      content
    );
  }
  return parsed.map((x) => String(x));
}

/** Parse JSON object `{ one: "…", other: "…" }` for cardinal plural batches. */
export function parsePluralFormsJsonResponse(
  content: string,
  requiredForms: CldrPluralForm[]
): Record<CldrPluralForm, string> {
  const cleaned = cleanJsonResponse(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new PluralFormsParseError(
      `Plural forms: invalid JSON (${e instanceof Error ? e.message : String(e)})`,
      content
    );
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new PluralFormsParseError("Plural forms: response is not a JSON object", content);
  }
  const record = parsed as Record<string, unknown>;
  const out = {} as Record<CldrPluralForm, string>;
  for (const f of requiredForms) {
    const v = record[f];
    if (v === undefined || typeof v !== "string") {
      throw new PluralFormsParseError(`Plural forms: missing or invalid key "${f}"`, content);
    }
    out[f] = v;
  }
  return out;
}
