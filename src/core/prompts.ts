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
  /** Shown after the example / addendum for {@link buildDocumentSinglePrompt} (single-segment API). User message is raw segment text — no `<translate>` wrapper. */
  singleSegmentOutputInstruction: string;
  batchXmlInstruction: string;
  batchJsonArrayInstruction: string;
  batchJsonObjectInstruction: string;
}

export interface UIPromptStrings {
  systemPrompt: string[];
  glossaryPreamble: string;
  /** Cardinal plural groups: JSON object response (`one`, `other`, …). */
  pluralFormsSystemPrompt: string[];
  glossaryPreamblePlural: string;
}

/** LLM `lint-source`: review source-locale UI copy (spelling, grammar, terminology). */
export interface LintSourcePromptStrings {
  systemPrompt: string[];
  /** Shown with &lt;glossary&gt; for preferred terminology in the locale under review. */
  glossaryPreamble: string;
  userMessagePreamble: string;
  outputContract: string;
}

export interface PromptStrings {
  document: DocumentPromptStrings;
  ui: UIPromptStrings;
  lintSource: LintSourcePromptStrings;
}

// ── Prompt content ────────────────────────────────────────────────────────

export const PROMPTS: PromptStrings = {
  document: {
    coreRules:
      "Rules: Keep headers (###), variables, URLs, line breaks, markdown formatting, placeholders {{X}} unchanged. Preserve exactly (do not translate or alter): {{ADM_OPEN_N}}, {{ADM_END_N}}, {{URL_N}}, {{BLD_N}}, {{ILC_N}}, {{HTM_N}}, {{ANC_N}}, {{HDG_N}}, {{GLS_N}}, {{IT}}, {{IU}}, {{SE}}, {{SU}}, {{ST}} (for GLS and similar tokens, N is any non-negative integer; copy the full token character-for-character). Copy each placeholder character-for-character; do not change underscores, hyphens, or digits inside {{...}} tokens. Translate only title/description in front matter. If a <glossary> block appears below, you must preserve each suggested target wording when the source matches or contains that term (use that wording exactly; do not paraphrase or substitute synonyms). Maintain coherence for all other phrasing.",

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

    singleSegmentOutputInstruction:
      "The next user message is one source segment only (markdown or text as provided). Respond with ONLY the translated segment — no explanations, preamble, code fences, or extra markup beyond what the segment requires.",

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

    glossaryPreamblePlural:
      "Glossary - when a string matches or contains a term below, you must use the suggested target wording exactly (preserve brand names and terminology). Do not output glossary lines; respond with only the JSON object as required above.",

    pluralFormsSystemPrompt: [
      "You are a professional UI/UX linguist writing cardinal plural variants for software interfaces.",
      "",
      "RULES:",
      "- Output ONLY a single JSON object (not an array). First non-whitespace character must be { and the object must end with }.",
      "- Keys must be exactly the cardinal plural category names requested (CLDR / Intl.PluralRules: zero, one, two, few, many, other). Include only the keys you are asked for.",
      "- Include every requested key exactly once — do not omit a category because another category could use the same wording; duplicate string values across keys are allowed and often required.",
      "- Each value is one UI string for that plural category in the target language described in the user message.",
      "- Preserve placeholders exactly: {{variable}}, {{count}}, {0}, %s, %d — copy character-for-character.",
      "- For messages that include a numeric quantity, use {{count}} where a number must appear unless the category is zero and instructions say to use the literal digit 0.",
      "- No markdown, no code fences, no commentary outside the JSON object.",
    ],
  },

  lintSource: {
    systemPrompt: [
      "You are a professional copy editor reviewing end-user-visible UI strings for software.",
      "",
      "TASK:",
      "- Review each string for spelling, grammar, punctuation, and clarity.",
      "- When a <glossary> block is present: flag terminology **only** if the string uses a **wrong or inconsistent variant** of a term (wrong synonym, misspelling, or forbidden alternate branding). **Never** emit a warning whose sole purpose is “consistency” or “preferred spelling” when the string **already** uses the correct product name, package name, or glossary wording as intended — including proper repetition of that name in a sentence.",
      "- Do not invent terminology problems for project names, npm-style package ids, or hyphenated product names when they already match the glossary or are clearly intentional.",
      "- Do NOT nitpick stylistic alternatives when both are correct — only genuine errors or important clarity fixes.",
      "",
      "PLACEHOLDERS (must stay byte-for-byte identical in suggestedText when you propose a fix):",
      "- {{variable}}, {{count}}, {{GLS_N}} (N is any non-negative integer)",
      "- {0}, %s, %d, :value-style tokens when present",
      "- Leading and trailing whitespace must match the original unless fixing an obvious stray space typo.",
      "",
      "OUTPUT:",
      "- Respond with ONLY a JSON array — first non-whitespace character [, last ].",
      "- Length must equal the number of input strings N. Index i corresponds to input string i (0 .. N-1).",
      '- Each array element MUST be one JSON object with keys: "issues" only (no "index" key needed).',
      '- Each "issues" value is an array of objects with keys: "severity" ("error" | "warning"), "message" (string), optional "suggestedText" (full corrected string — omit when you cannot propose a concrete fix).',
      '- Empty "issues": [] means the string is acceptable.',
      "- No markdown fences, no commentary outside the JSON array.",
    ],

    glossaryPreamble:
      'Glossary — each line shows acceptable source wording → preferred target wording for this locale. Use it **only** to find **violations** (wrong variant, not the preferred form). If the string already conforms, **issues must be empty** for that reason. Do not output glossary lines verbatim in "message".',

    userMessagePreamble:
      "Review the following UI strings written for end users. Language / locale label:",

    outputContract: `
Input format: JSON array of strings (same length and order as you must return).
`,
  },
};
