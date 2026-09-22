/**
 * Classify `{{IDENT}}` tokens present in protected document text so prompts
 * only advertise types the model will actually see.
 */

/** Matches `{{IDENT}}` with optional inner whitespace; skips `style={{…}}` object literals. */
const IDENT_TOKEN_RE = /\{\{\s*([A-Za-z_][A-Za-z0-9_-]*)\s*\}\}/g;

const JXA_APPENDIX_RE = /\|\|\s*JXA\d+:/i;

export const EMPHASIS_PLACEHOLDER_KINDS = ["IT", "IU", "SE", "SU", "ST"] as const;
export const STRUCTURAL_PLACEHOLDER_KINDS = ["HTM", "ADM_OPEN", "ADM_END", "ADM_TCLOSE"] as const;
export const NUMBERED_CONTENT_PLACEHOLDER_KINDS = [
  "URL",
  "ILC",
  "BLD",
  "GLS",
  "MDX",
  "JXA",
  "ANC",
  "HDG",
] as const;

const EMPHASIS_SET = new Set<string>(EMPHASIS_PLACEHOLDER_KINDS);
const STRUCTURAL_SET = new Set<string>(STRUCTURAL_PLACEHOLDER_KINDS);
const NUMBERED_CONTENT_SET = new Set<string>(NUMBERED_CONTENT_PLACEHOLDER_KINDS);
const NUMBERED_PREFIXES = [...STRUCTURAL_PLACEHOLDER_KINDS, ...NUMBERED_CONTENT_PLACEHOLDER_KINDS];

/** Official internal kinds plus `AUTHOR` (e.g. `{{count}}`) and `JXA_APPENDIX`. */
export type DocumentPlaceholderKind =
  | (typeof EMPHASIS_PLACEHOLDER_KINDS)[number]
  | (typeof STRUCTURAL_PLACEHOLDER_KINDS)[number]
  | (typeof NUMBERED_CONTENT_PLACEHOLDER_KINDS)[number]
  | "AUTHOR"
  | "JXA_APPENDIX";

export function isEmphasisPlaceholderKind(kind: string): boolean {
  return EMPHASIS_SET.has(kind);
}

export function isStructuralPlaceholderKind(kind: string): boolean {
  return STRUCTURAL_SET.has(kind);
}

export function isNumberedContentPlaceholderKind(kind: string): boolean {
  return NUMBERED_CONTENT_SET.has(kind);
}

function classifyIdentInner(inner: string): DocumentPlaceholderKind {
  const upper = inner.toUpperCase();
  if (EMPHASIS_SET.has(upper)) {
    return upper as (typeof EMPHASIS_PLACEHOLDER_KINDS)[number];
  }
  for (const prefix of NUMBERED_PREFIXES) {
    const re = new RegExp(`^${prefix}[-_]?\\d+$`, "i");
    if (re.test(inner)) {
      return prefix;
    }
  }
  return "AUTHOR";
}

/**
 * Union of official / author `{{IDENT}}` kinds (and JXA appendix markers) across `texts`.
 */
export function collectDocumentPlaceholderKinds(
  texts: readonly string[]
): Set<DocumentPlaceholderKind> {
  const kinds = new Set<DocumentPlaceholderKind>();
  for (const text of texts) {
    IDENT_TOKEN_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = IDENT_TOKEN_RE.exec(text)) !== null) {
      kinds.add(classifyIdentInner(m[1]!));
    }
    if (JXA_APPENDIX_RE.test(text)) {
      kinds.add("JXA");
      kinds.add("JXA_APPENDIX");
    }
  }
  return kinds;
}

function officialKinds(kinds: Set<DocumentPlaceholderKind>): DocumentPlaceholderKind[] {
  return [...kinds].filter((k) => k !== "AUTHOR" && k !== "JXA_APPENDIX");
}

function numberedTokenLabel(kind: string): string {
  return `{{${kind}_N}}`;
}

function emphasisTokenLabel(kind: string): string {
  return `{{${kind}}}`;
}

/**
 * Document `coreRules` mentioning only placeholder types present in this request.
 * When none are present, the model is told not to emit any `{{…}}` tokens.
 */
export function buildDocumentCoreRules(kinds: Set<DocumentPlaceholderKind>): string {
  const official = officialKinds(kinds);
  const numbered = official.filter((k) => !isEmphasisPlaceholderKind(k));
  const emphasis = official.filter((k) => isEmphasisPlaceholderKind(k));
  const structural = official.filter((k) => isStructuralPlaceholderKind(k));
  const contentNumbered = official.filter((k) => isNumberedContentPlaceholderKind(k));

  const parts: string[] = [
    "Rules: Keep headers (###), variables, URLs, line breaks, markdown formatting, placeholders {{X}} unchanged.",
  ];

  if (official.length === 0) {
    parts.push(
      "This input has no internal {{…}} placeholders. Do not emit any {{…}} tokens; glossary target words are plain text, not wrapped in {{…}}."
    );
    if (kinds.has("AUTHOR")) {
      parts.push(
        "Copy each author interpolation ({{name}} style) character-for-character; do not invent new {{…}} tokens."
      );
    }
  } else {
    const preserveList = [
      ...numbered.map(numberedTokenLabel),
      ...emphasis.map(emphasisTokenLabel),
    ].join(", ");
    const numberedNote = numbered.length
      ? " (for numbered tokens, N is any non-negative integer; copy the full token character-for-character)"
      : "";
    parts.push(`Preserve exactly (do not translate or alter): ${preserveList}${numberedNote}.`);
    parts.push(
      "Copy each placeholder character-for-character; do not change underscores, hyphens, or digits inside {{...}} tokens."
    );
    parts.push(
      "Use every {{…}} token from the input exactly once; do not reuse, drop, or renumber tokens."
    );
    if (structural.length > 0) {
      parts.push(
        `Keep structural tokens (${structural.map(numberedTokenLabel).join(", ")}) in the same relative order.`
      );
    }
    if (contentNumbered.length > 0 || emphasis.length > 0) {
      const contentBits: string[] = [];
      if (contentNumbered.length > 0) {
        contentBits.push(
          `Content tokens (${contentNumbered.map(numberedTokenLabel).join(", ")}, and similar)`
        );
      }
      if (emphasis.length > 0) {
        contentBits.push(`emphasis markers ${emphasis.map(emphasisTokenLabel).join(", ")}`);
      }
      parts.push(
        `${contentBits.join(" and ")} may move with natural word order, but each id / type’s count must still match.`
      );
    }
    parts.push(
      "Do not invent new {{…}} tokens; glossary target words are plain text, not wrapped in {{…}}."
    );
    if (structural.length > 0) {
      parts.push(
        "Keep structural-token order even when the target language is written right-to-left (placeholders are markup, not prose)."
      );
    }
  }

  if (kinds.has("JXA") || kinds.has("JXA_APPENDIX")) {
    parts.push(
      "Some segments end with appendix lines `||JXA_N: …||` (one or more): preserve each marker’s index N and closing `||`; translate only the human-readable text between the colon and the closing `||`."
    );
  }
  parts.push("YAML front matter is not translated (omitted from segments).");
  if (kinds.has("ADM_OPEN")) {
    parts.push(
      "Admonition lines only mask the directive prefix (for example `:::note `); translate any title text that appears after {{ADM_OPEN_N}} on the same line."
    );
  }
  parts.push(
    "If a <glossary> block appears below, you must preserve each suggested target wording when the source matches or contains that term (use that wording exactly; do not paraphrase or substitute synonyms). If a <translation-context> block appears, use it to choose accurate product meaning and register; it does not override glossary mappings or forced terms. Maintain coherence for all other phrasing."
  );
  return parts.join(" ");
}

/**
 * Markdown-structure prompt: mention `{{ILC_N}}` / `{{BLD_N}}` only when those tokens are present.
 */
export function buildMarkdownPreservation(kinds: Set<DocumentPlaceholderKind>): string {
  const head =
    "Markdown structure: Preserve heading levels (#\u2013######), list markers and indentation, blockquotes (>), horizontal rules, and meaningful line breaks.";
  const tokenBits: string[] = [];
  if (kinds.has("ILC")) {
    tokenBits.push("Inline `` `code` `` is sent as {{ILC_N}}");
  }
  if (kinds.has("BLD")) {
    tokenBits.push("bold+code **`code`** as {{BLD_N}}");
  }
  const tokenClause =
    tokenBits.length > 0 ? ` ${tokenBits.join("; ")} \u2014 copy those tokens exactly.` : "";
  const rest =
    " Keep **bold** and *italic* intact with balanced delimiters. Every **bold** span in the source must have a corresponding **bold** span in the translation \u2014 even when the bolded word translates to a short conjunction, particle, suffix, or single word in the target language; never remove bold to simplify the sentence. In [visible text](url), ![alt](path), and HTML like <img \u2026> / <a \u2026>, translate only the visible link text or alt; keep URLs, paths, angle-bracket links, and attribute names unchanged. Preserve GFM pipe tables (| cells |).";
  return `${head}${tokenClause}${rest}`;
}

/**
 * Single-segment markdown example. Only include a `{{…}}` token that appears in this request.
 */
export function buildMarkdownExample(
  targetLang: string,
  kinds: Set<DocumentPlaceholderKind>
): string {
  let bodyInput: string;
  let bodyOutput: string;
  if (kinds.has("HTM")) {
    bodyInput = "Body line with `CODE` and {{HTM_0}}.";
    bodyOutput = "[Translated body line with `CODE` and {{HTM_0}}.]";
  } else if (kinds.has("ILC")) {
    bodyInput = "Body line with {{ILC_0}}.";
    bodyOutput = "[Translated body line with {{ILC_0}}.]";
  } else {
    bodyInput = "Body line with `CODE`.";
    bodyOutput = "[Translated body line with `CODE`.]";
  }
  return `Example (same structure in ${targetLang}):
Input:
### Section title
${bodyInput}

Output:
### [Translated section title]
${bodyOutput}`;
}
