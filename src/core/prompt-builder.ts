import type { Segment } from "./types.js";
import { BatchTranslationError } from "./types.js";
import {
  PROMPTS,
  type PromptStrings,
  type DocumentPromptStrings,
  type UIPromptStrings,
} from "./prompts.js";

/**
 * Document translation prompts follow common OpenRouter-style doc-translation patterns
 * (`buildBatchPrompt`, `buildPrompt`, `MARKDOWN_PRESERVATION_RULES`). Adjust here when prompt strategy changes.
 *
 * For **JSON** (Docusaurus locale files) and **SVG** text segments, we append context addenda so the same
 * `<t id="N">` / `<translate>` response shape stays robust outside pure markdown.
 *
 * Prompt **content** lives in `prompts.ts`; this module handles assembly and parsing only.
 */
export type DocumentPromptContentType = "markdown" | "json" | "svg";
export type DocumentBatchResponseFormat = "xml-tags" | "json-array" | "json-object";

export type { PromptStrings, DocumentPromptStrings, UIPromptStrings };
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
    const userContent = JSON.stringify(segments.map((s) => s.content), null, 2);
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
  const footer = PROMPTS.document.translateFooter;

  let systemPrompt: string;

  if (contentType === "markdown") {
    const example = PROMPTS.document.markdownExample.replace(
      /\{\{targetLang\}\}/g,
      opts.targetLanguageLabel
    );
    systemPrompt = `${documentCoreRulesBlock(opts)}

${example}

---
${footer}${glossary}`;
  } else {
    systemPrompt = `${documentCoreRulesBlock(opts)}${addendum}

---
${footer}${glossary}`;
  }

  const userContent = `<translate>
${content}
</translate>`;

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
  const glossaryBlock = buildGlossaryBlock(
    opts.glossaryHints ?? [],
    PROMPTS.ui.glossaryPreamble
  );

  const userContent = `Translate these ${texts.length} UI strings from ${opts.sourceLanguageLabel} to ${opts.targetLanguageLabel} and return a JSON array:

${JSON.stringify(texts, null, 2)}

Respond with ONLY the JSON array. No other text.`;

  return { systemPrompt: systemBase + glossaryBlock, userContent };
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
