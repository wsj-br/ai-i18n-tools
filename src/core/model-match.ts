/**
 * Id matching between provider catalogs, languagebench, Arena, and models.dev.
 * Ported from Transrewrt `dev/presets-shared/benchmark-scores.js` (no fuzzy match).
 */

const ENGINE_PREFIXES = new Set([
  "openrouter",
  "openai",
  "anthropic",
  "google",
  "deepseek",
  "groq",
  "mistralai",
  "xai",
  "cerebras",
  "nvidia",
  "alibaba",
  "apifun",
  "local",
]);

/** languagebench BCP-47 codes for locales this tool ships UI for. */
const UI_LOCALE_TO_BCP47: Record<string, readonly string[]> = {
  "en-GB": ["en"],
  ar: ["ar"],
  "zh-Hans": ["zh"],
  "zh-Hant": ["zh", "yue"],
  cs: ["cs"],
  nl: ["nl"],
  fr: ["fr"],
  de: ["de"],
  el: ["el"],
  hi: ["hi"],
  hu: ["hu"],
  it: ["it"],
  ja: ["ja"],
  ko: ["ko"],
  fa: ["fa"],
  pl: ["pl"],
  "pt-BR": ["pt"],
  ro: ["ro"],
  ru: ["ru"],
  sk: ["sk"],
  es: ["es"],
  sv: ["sv"],
  th: ["th"],
  tr: ["tr"],
  uk: ["uk"],
  vi: ["vi"],
};

/**
 * Benchmark id → catalog id tails when normalized keys still miss.
 * Keys are matched case-insensitively.
 */
const CURATED_BENCHMARK_TO_CATALOG: Record<string, readonly string[]> = {
  "x-ai/grok-4.20": ["grok-4.20-0309-non-reasoning", "grok-4.20-0309-reasoning"],
  "x-ai/grok-4.20-0309": ["grok-4.20-0309-non-reasoning", "grok-4.20-0309-reasoning"],
  "deepseek/deepseek-v4-flash-20260423": ["deepseek-v4-flash"],
  "anthropic/claude-haiku-4.5": ["claude-haiku-4-5-20251001", "claude-haiku-4-5"],
  "google/gemini-3.1-flash-lite": ["gemini-3.1-flash-lite"],
  "google/gemini-3.1-pro-preview": ["gemini-3.1-pro-preview"],
};

const CHAT_BLOCK_FRAGMENTS = [
  "embedding",
  "embed-",
  "text-embedding",
  "whisper",
  "dall-e",
  "dalle",
  "tts-",
  "moderation",
  "rerank",
  "davinci",
  "babbage",
  "curie",
  "ada-002",
  "prompt-guard",
  "safeguard",
  "multi-agent",
  "gpt-image",
  "imagine-image",
  "imagine-video",
  "text-to-image",
  "text-to-video",
  "image-generation",
  "orpheus",
  "canopylabs/",
];

export function stripEnginePrefix(id: string): string {
  const s = id.trim();
  const slash = s.indexOf("/");
  if (slash <= 0) {
    return s;
  }
  const eng = s.slice(0, slash).toLowerCase();
  return ENGINE_PREFIXES.has(eng) ? s.slice(slash + 1) : s;
}

export function normalizeMatchKey(raw: string): string {
  let s = raw.toLowerCase().trim();
  if (!s) {
    return "";
  }
  s = s.replace(/^openrouter\//, "");
  s = s.replace(/^x-ai\//, "xai/");
  s = s.replace(/~/g, "");
  s = s.replace(/\s*\((?:x?high|max|low|medium|minimal|adaptive)\)\s*$/i, "");
  s = s
    .replace(/-(non-)?reasoning(-high|-low|-medium|-max|-minimal|-adaptive)?$/g, "")
    .replace(/-(high|low|medium|max|minimal|xhigh|preview|instant)(-\d{2}-\d{2})?$/g, "")
    .replace(/-preview(-\d{2}-\d{4})?$/g, "")
    .replace(/-\d{8}$/g, "")
    .replace(/-\d{6}$/g, "");
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s;
}

function addKey(keys: Set<string>, value: string): void {
  const key = normalizeMatchKey(value);
  if (key) {
    keys.add(key);
  }
}

export function keysForCatalogModel(
  provider: string,
  model: { id: string; name?: string }
): string[] {
  const keys = new Set<string>();
  addKey(keys, model.id);
  if (model.name) {
    addKey(keys, model.name);
  }
  addKey(keys, stripEnginePrefix(model.id));
  if (provider === "openrouter") {
    const tail = stripEnginePrefix(model.id);
    const innerSlash = tail.indexOf("/");
    if (innerSlash > 0) {
      addKey(keys, tail.slice(innerSlash + 1));
    }
  }
  return [...keys];
}

export function keysForBenchmarkId(benchId: string): string[] {
  const keys = new Set<string>();
  addKey(keys, benchId);
  addKey(keys, stripEnginePrefix(benchId));
  const tail = stripEnginePrefix(benchId);
  const slash = tail.indexOf("/");
  if (slash > 0) {
    addKey(keys, tail.slice(slash + 1));
  }
  return [...keys];
}

export function keysForArenaModel(row: { model: string; vendor: string }): string[] {
  const keys = new Set<string>();
  const stripped = row.model
    .replace(/\s*\((?:x?high|max|low|medium|minimal|adaptive)\)\s*$/i, "")
    .trim();
  addKey(keys, row.model);
  addKey(keys, stripped);
  const vendor = row.vendor.toLowerCase();
  if (vendor && row.model) {
    addKey(keys, `${vendor}/${row.model}`);
  }
  if (vendor && stripped) {
    addKey(keys, `${vendor}/${stripped}`);
  }
  return [...keys];
}

export function curatedCatalogKeys(benchId: string): string[] {
  const curated =
    CURATED_BENCHMARK_TO_CATALOG[benchId] ?? CURATED_BENCHMARK_TO_CATALOG[benchId.toLowerCase()];
  if (!curated) {
    return [];
  }
  return curated.flatMap((tail) => keysForBenchmarkId(tail));
}

/** True when the catalog row is a chat model a translation call can use. */
export function isChatWorkflowModel(model: { id: string; name?: string }): boolean {
  const id = model.id.trim();
  const slash = id.lastIndexOf("/");
  const tail = (slash >= 0 ? id.slice(slash + 1) : id).toLowerCase();
  const name = (model.name ?? "").toLowerCase();
  const hay = `${tail} ${name}`;
  if (CHAT_BLOCK_FRAGMENTS.some((fragment) => hay.includes(fragment))) {
    return false;
  }
  if (tail.startsWith("text-")) {
    return false;
  }
  if (/(^|\/|-)(image|video)(-|$)/.test(tail) && !/vision|multimodal/.test(hay)) {
    return false;
  }
  if (/(^|\/)compound(-mini)?$/.test(tail)) {
    return false;
  }
  if (/^gpt-5\.\d+(-\d+)?-pro(-\d{4}-\d{2}-\d{2})?$/.test(tail)) {
    return false;
  }
  return true;
}

/**
 * languagebench BCP-47 codes for the project's source and target locales.
 * Unknown locales use the primary subtag. An empty set falls back to `en`.
 */
export function bcp47ForLocales(locales: readonly string[]): string[] {
  const codes = new Set<string>();
  for (const locale of locales) {
    const trimmed = locale.trim();
    if (!trimmed) {
      continue;
    }
    const mapped = UI_LOCALE_TO_BCP47[trimmed];
    if (mapped) {
      for (const code of mapped) {
        codes.add(code);
      }
      continue;
    }
    const primary = trimmed.split("-")[0]?.toLowerCase() ?? "";
    if (primary.length >= 2) {
      codes.add(primary);
    }
  }
  if (codes.size === 0) {
    codes.add("en");
  }
  return [...codes];
}
