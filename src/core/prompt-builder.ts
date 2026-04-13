import type { Segment } from "./types.js";
import { BatchTranslationError } from "./types.js";

/**
 * Document translation prompts follow common OpenRouter-style doc-translation patterns
 * (`buildBatchPrompt`, `buildPrompt`, `MARKDOWN_PRESERVATION_RULES`). Adjust here when prompt strategy changes.
 *
 * For **JSON** (Docusaurus locale files) and **SVG** text segments, we append context addenda so the same
 * `<t id="N">` / `<translate>` response shape stays robust outside pure markdown.
 */
export type DocumentPromptContentType = "markdown" | "json" | "svg";
export type DocumentBatchResponseFormat = "xml-tags" | "json-array" | "json-object";

/**
 * Extra system-prompt guidance so models do not break CommonMark / GFM structure.
 * Fenced ``` / ~~~ blocks are not sent to the model (`DocumentSplitter` marks them non-translatable).
 * @see docs/OVERVIEW.md (document translation)
 */
export const MARKDOWN_PRESERVATION_RULES = `Markdown structure: Preserve heading levels (#–######), list markers and indentation, blockquotes (>), horizontal rules, and meaningful line breaks. Keep **bold**, *italic*, and \`inline code\` spans intact with balanced delimiters (do not drop closing **, *, or backticks). Every **bold** span in the source must have a corresponding **bold** span in the translation — even when the bolded word translates to a short conjunction, particle, suffix, or single word in the target language; never remove bold to simplify the sentence. For **\`code\`** compound patterns (bold wrapping inline code), preserve both the outer ** delimiters and the inner backticks. In [visible text](url), ![alt](path), and HTML like <img …> / <a …>, translate only the visible link text or alt; keep URLs, paths, angle-bracket links, and attribute names unchanged. Preserve GFM pipe tables (| cells |).`;

/** Appended for locale JSON message segments (batch `<t id="N">` response format). */
export const JSON_SEGMENT_CONTEXT_ADDENDUM = `
Context: Segments are end-user-visible strings from Docusaurus or app locale JSON (messages, labels, descriptions, sidebar titles).
- Preserve interpolation and markup exactly: {name}, {{var}}, ICU/plural patterns, HTML inside strings, Markdown fragments if present, %s / %d style placeholders.
- Do not add or remove braces, brackets, or escape sequences; output only the translated human text inside each <t id="N"> block - never a full JSON object.`;

/** Appended for SVG <text>/<tspan>/<title> extracted segments. */
export const SVG_SEGMENT_CONTEXT_ADDENDUM = `
Context: Segments are human-readable text from SVG (text elements, titles).
- Preserve entities and characters needed for correct display (&amp;, &#…;, etc.) when they appear in the source.
- Keep short labels short when the source is short (layout).
- Translate only readable words; do not emit SVG/XML wrapper tags unless they were part of the segment source.`;

export interface PromptBuilderOptions {
  sourceLanguageLabel: string;
  targetLanguageLabel: string;
  glossaryHints: string[];
}

function glossarySection(hints: string[]): string {
  if (hints.length === 0) {
    return "";
  }
  return `\n<glossary>\n${hints.join("\n")}\n</glossary>\n`;
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

Rules: Keep headers (###), inline \`code\`, variables, URLs, line breaks, markdown formatting, placeholders {{X}} unchanged. Preserve exactly (do not translate or alter): {{ADM_OPEN_N}}, {{ADM_END_N}}, {{URL_PLACEHOLDER_N}}, {{HTML_ANCHOR_N}}, {{DOC_HEADING_ID_N}}, {{IT}}, {{IU}}, {{SE}}, {{SU}}, {{ST}}. Copy each placeholder character-for-character, including underscores in DOC_HEADING_ID (never replace them with hyphens). Translate only title/description in front matter. Prefer glossary terms. Maintain coherence on the translated terminology.

${MARKDOWN_PRESERVATION_RULES}`;
}

function contentTypeAddendum(contentType: DocumentPromptContentType): string {
  if (contentType === "json") {
    return JSON_SEGMENT_CONTEXT_ADDENDUM;
  }
  if (contentType === "svg") {
    return SVG_SEGMENT_CONTEXT_ADDENDUM;
  }
  return "";
}

export function buildDocumentBatchPrompt(
  segments: Segment[],
  opts: PromptBuilderOptions,
  contentType: DocumentPromptContentType = "markdown",
  responseFormat: DocumentBatchResponseFormat = "xml-tags"
): { systemPrompt: string; userContent: string } {
  const glossary = glossarySection(opts.glossaryHints);
  const addendum = contentTypeAddendum(contentType);
  if (responseFormat === "json-array") {
    const userContent = JSON.stringify(segments.map((s) => s.content), null, 2);
    const systemPrompt = `${documentCoreRulesBlock(opts)}${addendum}

Each item in the JSON array is one source segment in order (index 0..N-1).
Reply with ONLY a valid JSON array of translated strings, preserving array length and index order exactly.
Do not return XML tags, markdown, code fences, comments, or any extra text.${glossary}`;
    return { systemPrompt, userContent };
  }

  if (responseFormat === "json-object") {
    const payload: Record<string, string> = {};
    for (let i = 0; i < segments.length; i++) {
      payload[String(i)] = segments[i]?.content ?? "";
    }
    const userContent = JSON.stringify(payload, null, 2);
    const systemPrompt = `${documentCoreRulesBlock(opts)}${addendum}

The JSON object maps segment index to source text (keys \"0\"..\"N-1\").
Reply with ONLY a valid JSON object with the exact same keys, each value translated.
Do not change keys, add keys, remove keys, or return XML tags/markdown/code fences/extra text.${glossary}`;
    return { systemPrompt, userContent };
  }

  const segBlocks = segments
    .map((s, i) => `<seg id="${i}">${escapeXml(s.content)}</seg>`)
    .join("\n");
  const systemPrompt = `${documentCoreRulesBlock(opts)}${addendum}

Each <seg id="N"> element contains one source segment. Reply with ONLY <t id="N">translation</t> blocks, one per segment, preserving the same N id. No other text.${glossary}`;
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
  const glossary = glossarySection(opts.glossaryHints);
  const addendum = contentTypeAddendum(contentType);

  let systemPrompt: string;

  if (contentType === "markdown") {
    systemPrompt = `${documentCoreRulesBlock(opts)}

Example (same structure in ${opts.targetLanguageLabel}):
Input:
### Section title
Body line with \`CODE\` and {{PLACEHOLDER}}.

Output:
### [Translated section title]
[Translated body line with \`CODE\` and {{PLACEHOLDER}}.]

---
Translate the content inside the <translate> tags below. Output ONLY the translated text - do NOT include <translate> or </translate> tags in your response. No explanations or extra markup.${glossary}`;
  } else {
    systemPrompt = `${documentCoreRulesBlock(opts)}${addendum}

---
Translate the content inside the <translate> tags below. Output ONLY the translated text - do NOT include <translate> or </translate> tags in your response. No explanations or extra markup.${glossary}`;
  }

  const userContent = `<translate>
${content}
</translate>`;

  return { systemPrompt, userContent };
}

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

export class DocumentBatchJsonParseError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string
  ) {
    super(message);
    this.name = "DocumentBatchJsonParseError";
  }
}

function cleanJsonResponse(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

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

/** System prompt for UI batch translation - JSON array response only. */
const UI_BATCH_SYSTEM_PROMPT = `You are a professional UI/UX translator specializing in software interfaces.

RULES:
- Translate UI labels, buttons, tooltips, menu items, and status messages
- Preserve capitalization style (Title Case stays Title Case, ALL CAPS stays ALL CAPS)
- Preserve leading/trailing whitespace exactly
- Keep placeholders unchanged: {{variable}}, {0}, %s, %d, :value
- Keep HTML tags unchanged: <strong>, <br/>, etc.
- Use informal/familiar tone where natural for the target language
- Short strings (1-3 words) must stay short - do not expand them
- You MUST respond with ONLY a valid JSON array, nothing else
- No markdown, no code fences, no explanation, no preamble, no postamble
- First character of your response must be [ and last character must be ]`;

export function buildUIPromptMessages(
  texts: string[],
  opts: {
    sourceLanguageLabel: string;
    targetLanguageLabel: string;
    /** Optional terminology lines (same shape as document `<glossary>` blocks). */
    glossaryHints?: string[];
  }
): { systemPrompt: string; userContent: string } {
  const hints = opts.glossaryHints?.filter((h) => h.trim().length > 0) ?? [];
  const glossaryBlock =
    hints.length === 0
      ? ""
      : `

Glossary - when a string matches or contains a term below, prefer the suggested target wording. Do not output glossary lines; respond with only the JSON array as required above.
<glossary>
${hints.join("\n")}
</glossary>`;

  const userContent = `Translate these ${texts.length} UI strings from ${opts.sourceLanguageLabel} to ${opts.targetLanguageLabel} and return a JSON array:

${JSON.stringify(texts, null, 2)}

Respond with ONLY the JSON array. No other text.`;

  return { systemPrompt: UI_BATCH_SYSTEM_PROMPT + glossaryBlock, userContent };
}

export class UIJsonArrayParseError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string
  ) {
    super(message);
    this.name = "UIJsonArrayParseError";
  }
}

export function parseUIJsonArrayResponse(content: string, expectedLength: number): string[] {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
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
