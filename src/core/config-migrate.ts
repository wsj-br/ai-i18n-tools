import fs from "fs";
import { ConfigValidationError } from "./errors.js";

/** Coerce `contentPaths` from a single string or string array. */
export function coerceContentPathsField(v: unknown): string[] {
  if (v === undefined || v === null) {
    return [];
  }
  if (typeof v === "string") {
    const t = v.trim();
    return t ? [t] : [];
  }
  if (Array.isArray(v)) {
    return v
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((s) => s.trim());
  }
  return [];
}

function stableJsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function migrateDocBlock(block: Record<string, unknown>): void {
  if (block.jsonSource !== undefined && block.docusaurusCatalogDir === undefined) {
    block.docusaurusCatalogDir = block.jsonSource;
    delete block.jsonSource;
  }
  if (block.markdownOutput !== undefined && block.docsOutput === undefined) {
    block.docsOutput = block.markdownOutput;
    delete block.markdownOutput;
  }
  if (block.contentPaths !== undefined) {
    block.contentPaths = coerceContentPathsField(block.contentPaths);
  }
}

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Migrate the legacy single `openrouter` block to the multi-provider shape
 * (`provider: "openrouter"` + `providers.openrouter`). The `translationModels` list absorbs any
 * legacy `defaultModel` / `fallbackModel`; the default base URL is dropped (inherited from the preset).
 */
function migrateOpenrouterBlock(o: Record<string, unknown>): void {
  const legacy = o.openrouter;
  if (legacy === undefined) {
    return;
  }
  delete o.openrouter;
  if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) {
    return;
  }
  const or = legacy as Record<string, unknown>;

  const models: string[] = [];
  const pushModel = (m: unknown): void => {
    if (typeof m === "string" && m.trim() && !models.includes(m.trim())) {
      models.push(m.trim());
    }
  };
  if (Array.isArray(or.translationModels)) {
    for (const m of or.translationModels) {
      pushModel(m);
    }
  }
  pushModel(or.defaultModel);
  pushModel(or.fallbackModel);

  const entry: Record<string, unknown> = {};
  if (models.length > 0) {
    entry.translationModels = models;
  }
  if (
    typeof or.baseUrl === "string" &&
    or.baseUrl.trim() &&
    or.baseUrl.trim() !== DEFAULT_OPENROUTER_BASE_URL
  ) {
    entry.baseUrl = or.baseUrl.trim();
  }
  if (typeof or.maxTokens === "number") {
    entry.maxTokens = or.maxTokens;
  }
  if (typeof or.temperature === "number") {
    entry.temperature = or.temperature;
  }
  if (typeof or.requestTimeout === "number") {
    entry.requestTimeout = or.requestTimeout;
  }
  if (typeof or.requestTimeoutMs === "number") {
    entry.requestTimeoutMs = or.requestTimeoutMs;
  }

  const providers =
    o.providers && typeof o.providers === "object" && !Array.isArray(o.providers)
      ? { ...(o.providers as Record<string, unknown>) }
      : {};
  if (providers.openrouter === undefined) {
    providers.openrouter = entry;
  }
  o.providers = providers;
  if (o.provider === undefined) {
    o.provider = "openrouter";
  }
}

/**
 * Map legacy config keys to canonical names in-memory (accepted indefinitely at load).
 * Throws if `documentations` and `docs` both exist with different content.
 */
export function preprocessLegacyConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }
  const o = { ...(raw as Record<string, unknown>) };

  if (o.documentations !== undefined && o.docs !== undefined) {
    if (!stableJsonEqual(o.documentations, o.docs)) {
      throw new ConfigValidationError(
        'Config cannot set both "documentations" and "docs" with different values; use "docs" only.'
      );
    }
    delete o.documentations;
  } else if (o.documentations !== undefined && o.docs === undefined) {
    o.docs = o.documentations;
    delete o.documentations;
  }

  if (Array.isArray(o.docs)) {
    for (const item of o.docs) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        migrateDocBlock(item as Record<string, unknown>);
      }
    }
  }

  if (o.features && typeof o.features === "object" && !Array.isArray(o.features)) {
    const f = { ...(o.features as Record<string, unknown>) };
    if (f.translateDocs === undefined && f.translateMarkdown !== undefined) {
      f.translateDocs = f.translateMarkdown;
    }
    delete f.translateMarkdown;
    delete f.translateJSON;
    delete f.extractUIStrings;
    o.features = f;
  }

  migrateOpenrouterBlock(o);

  if (o.uiLanguagesPath !== undefined && o.languagesManifestPath !== undefined) {
    if (!stableJsonEqual(o.uiLanguagesPath, o.languagesManifestPath)) {
      throw new ConfigValidationError(
        'Config cannot set both "uiLanguagesPath" and "languagesManifestPath" with different values; use "languagesManifestPath" only.'
      );
    }
    delete o.uiLanguagesPath;
  } else if (o.uiLanguagesPath !== undefined && o.languagesManifestPath === undefined) {
    o.languagesManifestPath = o.uiLanguagesPath;
    delete o.uiLanguagesPath;
  }

  throwIfLegacyGlossaryUiPath(o);

  return o;
}

function normLegacyPath(value: string): string {
  return value.trim().replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
}

function rawUiStringsJsonPaths(raw: Record<string, unknown>): string[] {
  const ui = raw.ui;
  const fromBlock = (item: unknown): string => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const stringsJson = (item as Record<string, unknown>).stringsJson;
      if (typeof stringsJson === "string" && stringsJson.trim()) {
        return stringsJson.trim();
      }
    }
    return "strings.json";
  };
  if (Array.isArray(ui)) {
    return ui.length > 0 ? ui.map(fromBlock) : ["strings.json"];
  }
  if (ui && typeof ui === "object") {
    return [fromBlock(ui)];
  }
  return ["strings.json"];
}

function legacyGlossaryUiPathMessage(key: string, value: unknown, paths: string[]): string {
  const shown = typeof value === "string" ? value : JSON.stringify(value);
  const normVal = typeof value === "string" ? normLegacyPath(value) : "";
  const index = paths.findIndex((item) => normLegacyPath(item) === normVal);
  if (index >= 0) {
    const catalog = paths[index];
    return (
      `glossary.${key} is no longer supported (found ${JSON.stringify(shown)}). ` +
      `Remove "glossary.${key}" from the config. That catalog is already ui[${index}].stringsJson, ` +
      `and ui[].uiGlossary (boolean, default true) now includes it in glossary hints. ` +
      `Set "uiGlossary": false on that block to exclude it. ` +
      `Before: "glossary": { "${key}": ${JSON.stringify(shown)} }. ` +
      `After: delete that key. Optional: "ui": [{ "stringsJson": ${JSON.stringify(catalog)}, "uiGlossary": false }].`
    );
  }
  const catalog = typeof value === "string" && value.trim() ? value.trim() : "path/to/strings.json";
  return (
    `glossary.${key} is no longer supported (found ${JSON.stringify(shown)}). ` +
    `Remove "glossary.${key}" and declare the catalog as a UI block: ` +
    `"ui": [{ "stringsJson": ${JSON.stringify(catalog)} }] (empty sourceRoots is fine; the catalog is used for hints without being extracted). ` +
    `Keep any existing ui block and add this one to the array. ` +
    `Before: "glossary": { "${key}": ${JSON.stringify(shown)} }. ` +
    `After: "ui": [{ "stringsJson": ${JSON.stringify(catalog)}, "sourceRoots": [] }].`
  );
}

function throwIfLegacyGlossaryUiPath(raw: Record<string, unknown>): void {
  const glossary = raw.glossary;
  if (!glossary || typeof glossary !== "object" || Array.isArray(glossary)) {
    return;
  }
  const record = glossary as Record<string, unknown>;
  const keys = (["uiGlossary", "uiGlossaryFromStringsJson"] as const).filter((key) =>
    Object.prototype.hasOwnProperty.call(record, key)
  );
  if (keys.length === 0) {
    return;
  }
  const paths = rawUiStringsJsonPaths(raw);
  throw new ConfigValidationError(
    keys.map((key) => legacyGlossaryUiPathMessage(key, record[key], paths)).join(" ")
  );
}

const LEGACY_FEATURE_KEYS = new Set(["translateMarkdown", "translateJSON", "extractUIStrings"]);
const LEGACY_BLOCK_KEYS = new Set(["jsonSource", "markdownOutput"]);

/** True when the parsed JSON object still uses deprecated key names. */
export function rawConfigHasLegacyKeys(json: unknown): boolean {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return false;
  }
  const o = json as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(o, "documentations")) {
    return true;
  }
  if (Object.prototype.hasOwnProperty.call(o, "openrouter")) {
    return true;
  }
  if (Object.prototype.hasOwnProperty.call(o, "uiLanguagesPath")) {
    return true;
  }
  const f = o.features;
  if (f && typeof f === "object" && !Array.isArray(f)) {
    for (const k of LEGACY_FEATURE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(f, k)) {
        return true;
      }
    }
  }
  const docs = (o.docs ?? o.documentations) as unknown;
  if (Array.isArray(docs)) {
    for (const item of docs) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        continue;
      }
      const b = item as Record<string, unknown>;
      for (const k of LEGACY_BLOCK_KEYS) {
        if (Object.prototype.hasOwnProperty.call(b, k)) {
          return true;
        }
      }
    }
  }
  return false;
}

/** Build canonical JSON-serializable object for writing (after successful preprocess). */
export function canonicalizeConfigForWrite(json: unknown): Record<string, unknown> {
  const preprocessed = preprocessLegacyConfigInput(json);
  if (!preprocessed || typeof preprocessed !== "object" || Array.isArray(preprocessed)) {
    throw new ConfigValidationError("Config root must be a JSON object");
  }
  return preprocessed as Record<string, unknown>;
}

export type ConfigRewriteResult = { rewritten: false } | { rewritten: true; messages: string[] };

/**
 * Rewrite config file to canonical keys when legacy names are present.
 */
export function maybeRewriteConfigFile(configPath: string, rawJson: unknown): ConfigRewriteResult {
  if (!rawConfigHasLegacyKeys(rawJson)) {
    return { rewritten: false };
  }
  const canonical = canonicalizeConfigForWrite(rawJson);
  const messages: string[] = [];
  const o = rawJson as Record<string, unknown>;
  if (o.documentations !== undefined) {
    messages.push("documentations → docs");
  }
  if (o.openrouter !== undefined) {
    messages.push('openrouter → providers.openrouter (+ provider: "openrouter")');
  }
  if (o.uiLanguagesPath !== undefined) {
    messages.push("uiLanguagesPath → languagesManifestPath");
  }
  const f = o.features as Record<string, unknown> | undefined;
  if (f?.translateMarkdown !== undefined) {
    messages.push("translateMarkdown → translateDocs");
  }
  if (f?.translateJSON !== undefined) {
    messages.push("translateJSON removed (use docs[].docusaurusCatalogDir)");
  }
  if (f?.extractUIStrings !== undefined) {
    messages.push("extractUIStrings removed (extract runs before translateUIStrings)");
  }
  if (Array.isArray(o.documentations ?? o.docs)) {
    for (const item of (o.documentations ?? o.docs) as unknown[]) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const b = item as Record<string, unknown>;
      if (b.jsonSource !== undefined) {
        messages.push("jsonSource → docusaurusCatalogDir");
        break;
      }
      if (b.markdownOutput !== undefined) {
        messages.push("markdownOutput → docsOutput");
        break;
      }
    }
  }

  try {
    fs.writeFileSync(configPath, `${JSON.stringify(canonical, null, 2)}\n`, "utf8");
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e ? String((e as NodeJS.ErrnoException).code) : "";
    if (code === "EACCES" || code === "EROFS") {
      console.warn(
        `[config] Legacy keys detected but could not rewrite ${configPath} (read-only): ${e instanceof Error ? e.message : String(e)}`
      );
      return { rewritten: false };
    }
    throw e;
  }
  return { rewritten: true, messages: [...new Set(messages)] };
}
