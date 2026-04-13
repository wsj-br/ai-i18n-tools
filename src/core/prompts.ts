/**
 * Centralized prompt strings for all translation modes.
 *
 * Edit prompt **content** here; assembly logic lives in `prompt-builder.ts`.
 * Follows the same separation pattern as transrewrt `prompts.json`.
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface DocumentPromptStrings {
  coreRules: string;
  markdownPreservation: string;
  jsonSegmentAddendum: string;
  svgSegmentAddendum: string;
  markdownExample: string;
  translateFooter: string;
  batchXmlInstruction: string;
  batchJsonArrayInstruction: string;
  batchJsonObjectInstruction: string;
}

export interface UIPromptStrings {
  systemPrompt: string[];
  glossaryPreamble: string;
}

export interface PromptStrings {
  document: DocumentPromptStrings;
  ui: UIPromptStrings;
}

// ── Prompt content ────────────────────────────────────────────────────────

export const PROMPTS: PromptStrings = {
  document: {
    coreRules:
      "Rules: Keep headers (###), variables, URLs, line breaks, markdown formatting, placeholders {{X}} unchanged. Preserve exactly (do not translate or alter): {{ADM_OPEN_N}}, {{ADM_END_N}}, {{URL_N}}, {{BLD_N}}, {{ILC_N}}, {{ANC_N}}, {{HDG_N}}, {{GLS_N}}, {{IT}}, {{IU}}, {{SE}}, {{SU}}, {{ST}} (for GLS and similar tokens, N is any non-negative integer; copy the full token character-for-character). Copy each placeholder character-for-character; do not change underscores, hyphens, or digits inside {{...}} tokens. Translate only title/description in front matter. If a <glossary> block appears below, you must preserve each suggested target wording when the source matches or contains that term (use that wording exactly; do not paraphrase or substitute synonyms). Maintain coherence for all other phrasing.",

    markdownPreservation:
      "Markdown structure: Preserve heading levels (#\u2013######), list markers and indentation, blockquotes (>), horizontal rules, and meaningful line breaks. Inline `` `code` `` is sent as {{ILC_N}}; bold+code **`code`** as {{BLD_N}} \u2014 copy those tokens exactly. Keep **bold** and *italic* intact with balanced delimiters. Every **bold** span in the source must have a corresponding **bold** span in the translation \u2014 even when the bolded word translates to a short conjunction, particle, suffix, or single word in the target language; never remove bold to simplify the sentence. In [visible text](url), ![alt](path), and HTML like <img \u2026> / <a \u2026>, translate only the visible link text or alt; keep URLs, paths, angle-bracket links, and attribute names unchanged. Preserve GFM pipe tables (| cells |).",

    jsonSegmentAddendum: `
Context: Segments are end-user-visible strings from Docusaurus or app locale JSON (messages, labels, descriptions, sidebar titles).
- Preserve interpolation and markup exactly: {name}, {{var}}, ICU/plural patterns, HTML inside strings, Markdown fragments if present, %s / %d style placeholders.
- Do not add or remove braces, brackets, or escape sequences; output only the translated human text inside each <t id="N"> block - never a full JSON object.`,

    svgSegmentAddendum: `
Context: Segments are human-readable text from SVG (text elements, titles).
- Preserve entities and characters needed for correct display (&amp;, &#\u2026;, etc.) when they appear in the source.
- Keep short labels short when the source is short (layout).
- Translate only readable words; do not emit SVG/XML wrapper tags unless they were part of the segment source.`,

    markdownExample: `Example (same structure in {{targetLang}}):
Input:
### Section title
Body line with \`CODE\` and {{PLACEHOLDER}}.

Output:
### [Translated section title]
[Translated body line with \`CODE\` and {{PLACEHOLDER}}.]`,

    translateFooter:
      "Translate the content inside the <translate> tags below. Output ONLY the translated text - do NOT include <translate> or </translate> tags in your response. No explanations or extra markup.",

    batchXmlInstruction:
      'Each <seg id="N"> element contains one source segment. Reply with ONLY <t id="N">translation</t> blocks, one per segment, preserving the same N id. No other text.',

    batchJsonArrayInstruction: `Each item in the JSON array is one source segment in order (index 0..N-1).
Reply with ONLY a valid JSON array of translated strings, preserving array length and index order exactly.
Do not return XML tags, markdown, code fences, comments, or any extra text.`,

    batchJsonObjectInstruction: `The JSON object maps segment index to source text (keys "0".."N-1").
Reply with ONLY a valid JSON object with the exact same keys, each value translated.
Do not change keys, add keys, remove keys, or return XML tags/markdown/code fences/extra text.`,
  },

  ui: {
    systemPrompt: [
      "You are a professional UI/UX translator specializing in software interfaces.",
      "",
      "RULES:",
      "- Translate UI labels, buttons, tooltips, menu items, and status messages",
      "- Preserve capitalization style (Title Case stays Title Case, ALL CAPS stays ALL CAPS)",
      "- Preserve leading/trailing whitespace exactly",
      "- Keep placeholders unchanged: {{variable}}, {0}, %s, %d, :value, and {{GLS_N}} (any non-negative integer N; copy exactly)",
      "- Keep HTML tags unchanged: <strong>, <br/>, etc.",
      "- Use informal/familiar tone where natural for the target language",
      "- Short strings (1-3 words) must stay short - do not expand them",
      "- You MUST respond with ONLY a valid JSON array, nothing else",
      "- No markdown, no code fences, no explanation, no preamble, no postamble",
      "- First character of your response must be [ and last character must be ]",
    ],

    glossaryPreamble:
      "Glossary - when a string matches or contains a term below, you must use the suggested target wording exactly (preserve brand names and terminology; do not paraphrase, translate around, or substitute synonyms). Do not output glossary lines; respond with only the JSON array as required above.",
  },
};
