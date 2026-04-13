import fs from "fs";
import path from "path";
import { ConfigValidationError } from "./errors.js";
import {
  assignCoercedTargetLocales,
  coerceTargetLocalesField,
  normalizeLocale,
  parseLocaleList,
} from "./locale-utils.js";
import type { I18nConfig, RawI18nConfigInput } from "./types.js";

/**
 * UI language manifest (`ui-languages.json`).
 * Drives language switcher labels and, when configured, which locales receive UI string translation.
 */
export interface UiLanguageEntry {
  code: string;
  /**
   * Language name **in that language** (endonym), for in-app menus and switchers - e.g. `Deutsch`, `日本語`.
   * Not necessarily English.
   */
  label: string;
  /** English (or Latin-script) name for LLM prompts, `t()` keys, and pairing with `label` in menus. Required in the JSON manifest. */
  englishName: string;
}

/** True if `targetLocales` should be treated as a path to a UI languages JSON manifest (not a locale code). */
export function looksLikeUiLanguagesFileRef(s: string): boolean {
  const t = s.trim();
  if (!t) {
    return false;
  }
  if (t.endsWith(".json")) {
    return true;
  }
  if (t.includes("/") || t.includes("\\")) {
    return true;
  }
  return false;
}

/**
 * When `targetLocales` is a single string that looks like a manifest path, load it
 * (`ui-languages.json` shape), replace `targetLocales` with locale codes (excluding `sourceLocale`),
 * and set `uiLanguagesPath` to that path for prompts / `--locale` filtering.
 *
 * Call on merged config input **before** {@link parseI18nConfig} (e.g. from {@link loadI18nConfigFromFile}).
 */
export function expandTargetLocalesFileReferenceInRawInput(
  raw: RawI18nConfigInput,
  cwd: string
): void {
  assignCoercedTargetLocales(raw);
  const locs = raw.targetLocales;
  if (!Array.isArray(locs) || locs.length !== 1) {
    return;
  }
  const only = locs[0].trim();
  if (!looksLikeUiLanguagesFileRef(only)) {
    return;
  }

  const existingPath = raw.uiLanguagesPath?.trim();
  if (existingPath) {
    const absOnly = path.isAbsolute(only) ? only : path.join(cwd, only);
    const absExisting = path.isAbsolute(existingPath) ? existingPath : path.join(cwd, existingPath);
    if (path.normalize(absOnly) !== path.normalize(absExisting)) {
      throw new ConfigValidationError(
        `targetLocales references "${only}" but uiLanguagesPath is "${existingPath}"; use one manifest path, or omit uiLanguagesPath when using a string path or single manifest entry in targetLocales.`
      );
    }
  }

  const abs = path.isAbsolute(only) ? only : path.join(cwd, only);
  if (!fs.existsSync(abs)) {
    throw new ConfigValidationError(`targetLocales: UI languages file not found: ${abs}`);
  }

  let entries: UiLanguageEntry[];
  try {
    entries = loadUiLanguageEntries(abs);
  } catch (e) {
    throw new ConfigValidationError(
      `targetLocales: invalid UI languages file "${only}": ${e instanceof Error ? e.message : String(e)}`
    );
  }

  const src = normalizeLocale(raw.sourceLocale ?? "en");
  const codes = entries.map((e) => normalizeLocale(e.code)).filter((c) => c !== src);

  raw.targetLocales = codes;
  raw.uiLanguagesPath = only;
}

/**
 * When a block's `targetLocales` is a single manifest path (`ui-languages.json`), expand to locale codes
 * (excluding `sourceLocale`). Does not set `uiLanguagesPath` - UI resolution is unchanged.
 */
export function expandDocumentationTargetLocalesInRawInput(
  raw: RawI18nConfigInput,
  cwd: string
): void {
  const docs = raw.documentations;
  if (!Array.isArray(docs)) {
    return;
  }
  for (const item of docs) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const d = item as Record<string, unknown>;
    const tl = d.targetLocales;
    if (tl === undefined || tl === null) {
      continue;
    }
    const arr = coerceTargetLocalesField(tl);
    d.targetLocales = arr;
    if (!Array.isArray(arr) || arr.length !== 1) {
      continue;
    }
    const only = String(arr[0]).trim();
    if (!looksLikeUiLanguagesFileRef(only)) {
      continue;
    }
    const abs = path.isAbsolute(only) ? only : path.join(cwd, only);
    if (!fs.existsSync(abs)) {
      throw new ConfigValidationError(`documentations[].targetLocales: languages file not found: ${abs}`);
    }
    let entries: UiLanguageEntry[];
    try {
      entries = loadUiLanguageEntries(abs);
    } catch (e) {
      throw new ConfigValidationError(
        `documentations[].targetLocales: invalid languages file "${only}": ${e instanceof Error ? e.message : String(e)}`
      );
    }
    const src = normalizeLocale(raw.sourceLocale ?? "en");
    const codes = entries.map((e) => normalizeLocale(e.code)).filter((c) => c !== src);
    d.targetLocales = codes;
  }
}

/**
 * Locale codes used for **documentation** translation (markdown / JSON): union of each block's
 * `targetLocales` when non-empty, otherwise root `targetLocales`, per block. Excludes `sourceLocale`, deduped.
 */
export function getDocumentationTargetLocaleCodes(config: I18nConfig): string[] {
  const src = normalizeLocale(config.sourceLocale);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const block of config.documentations) {
    const doc = block.targetLocales;
    const useDoc = Array.isArray(doc) && doc.length > 0;
    const list = useDoc ? doc! : config.targetLocales;
    for (const l of list) {
      const c = normalizeLocale(l);
      if (c === src || seen.has(c)) {
        continue;
      }
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

/**
 * Locales for `translate` / `sync` document steps (and `status` markdown columns). Honors `--locale` by
 * intersecting with allowed documentation targets.
 */
export function resolveLocalesForDocumentation(
  config: I18nConfig,
  _cwd: string,
  cliLocalesRaw?: string | null
): string[] {
  const base = getDocumentationTargetLocaleCodes(config);
  const src = normalizeLocale(config.sourceLocale);
  if (cliLocalesRaw?.trim()) {
    const requested = parseLocaleList(cliLocalesRaw).map((c) => normalizeLocale(c));
    const allowed = new Set(base);
    const list = requested.filter((c) => c !== src && allowed.has(c));
    if (list.length === 0 && requested.filter((c) => c !== src).length > 0) {
      throw new Error(
        `[translate] None of the requested --locale codes are documentation target locales. Allowed: ${[...allowed].join(", ") || "(none)"}`
      );
    }
    return list;
  }
  return base;
}

/**
 * Locales for `translate-svg`: always includes `sourceLocale` (copy-through output), plus documentation
 * target locales (same as {@link getDocumentationTargetLocaleCodes}).
 */
export function resolveLocalesForSvg(
  config: I18nConfig,
  _cwd: string,
  cliLocalesRaw?: string | null
): string[] {
  const docTargets = getDocumentationTargetLocaleCodes(config);
  const src = normalizeLocale(config.sourceLocale);
  const base: string[] = [src];
  for (const l of docTargets) {
    if (!base.includes(l)) {
      base.push(l);
    }
  }
  if (cliLocalesRaw?.trim()) {
    const requested = parseLocaleList(cliLocalesRaw).map((c) => normalizeLocale(c));
    const allowed = new Set(base);
    const list = requested.filter((c) => allowed.has(c));
    if (list.length === 0 && requested.length > 0) {
      throw new Error(
        `[translate-svg] None of the requested --locale codes are allowed. Allowed: ${[...allowed].join(", ")}`
      );
    }
    return list;
  }
  return base;
}

export function resolveUiLanguagesAbsPath(config: I18nConfig, cwd: string): string | null {
  const p = config.uiLanguagesPath?.trim();
  if (!p) {
    return null;
  }
  return path.isAbsolute(p) ? p : path.join(cwd, p);
}

export function loadUiLanguageEntries(absPath: string): UiLanguageEntry[] {
  const raw = fs.readFileSync(absPath, "utf8");
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("ui-languages.json must be a JSON array of { code, label, englishName }");
  }
  const out: UiLanguageEntry[] = [];
  for (const item of data) {
    if (item === null || typeof item !== "object") {
      continue;
    }
    const o = item as Record<string, unknown>;
    const code = typeof o.code === "string" ? o.code.trim() : "";
    if (!code) {
      continue;
    }
    const label = typeof o.label === "string" ? o.label : code;
    const enRaw = o.englishName;
    if (typeof enRaw !== "string" || !enRaw.trim()) {
      throw new Error(
        `ui-languages.json: entry with code "${code}" must include a non-empty string "englishName"`
      );
    }
    const englishName = enRaw.trim();
    out.push({ code, label, englishName });
  }
  if (out.length === 0) {
    throw new Error("ui-languages.json: no valid entries with a `code` field");
  }
  return out;
}

/** Merge `englishName` into `localeDisplayNames` (normalized locale keys) for LLM prompts. */
export function mergeUiLanguageDisplayNames(
  config: I18nConfig,
  entries: UiLanguageEntry[]
): I18nConfig {
  const names = { ...(config.localeDisplayNames ?? {}) };
  for (const e of entries) {
    const n = normalizeLocale(e.code);
    if (!names[n]) {
      names[n] = e.englishName;
    }
  }
  return { ...config, localeDisplayNames: names };
}

/**
 * Codes from `ui-languages.json` that are not the config source locale.
 * If `config.targetLocales` is non-empty, keep only codes present in both (subset for apps that ship fewer translations).
 */
export function resolveUiTranslationTargetCodes(
  config: I18nConfig,
  entries: UiLanguageEntry[]
): string[] {
  const src = normalizeLocale(config.sourceLocale);
  const fromFile = entries
    .map((e) => normalizeLocale(e.code))
    .filter((c) => c !== src);

  const configured = config.targetLocales.map((l) => normalizeLocale(l));
  if (configured.length === 0) {
    return fromFile;
  }
  const allowed = new Set(fromFile);
  return configured.filter((c) => allowed.has(c));
}

/**
 * Locales for `translate-ui` (and the UI step of `translate` / `sync`).
 *
 * - With `--locale`: parsed list; if `ui-languages.json` exists, only codes listed there are kept.
 * - Without `--locale` and with a manifest on disk (`uiLanguagesPath`, usually set when `targetLocales` was a single
 *   manifest path at load): targets from file (− source), optionally ∩ `targetLocales`.
 * - Otherwise: `config.targetLocales` (− source).
 */
export function resolveLocalesForUI(
  config: I18nConfig,
  cwd: string,
  cliLocalesRaw?: string | null
): string[] {
  const abs = resolveUiLanguagesAbsPath(config, cwd);
  const entries =
    abs && fs.existsSync(abs)
      ? loadUiLanguageEntries(abs)
      : null;

  const allowedCodes = entries ? new Set(entries.map((e) => normalizeLocale(e.code))) : null;
  const src = normalizeLocale(config.sourceLocale);

  let list: string[];

  if (cliLocalesRaw?.trim()) {
    list = parseLocaleList(cliLocalesRaw);
    if (allowedCodes) {
      const before = list.length;
      list = list.filter((c) => allowedCodes.has(normalizeLocale(c)));
      if (list.length === 0 && before > 0) {
        const where = config.uiLanguagesPath ?? "targetLocales UI languages file";
        throw new Error(
          `[translate-ui] None of the requested locales appear in ${where}. ` +
            `Allowed codes: ${[...allowedCodes].join(", ")}`
        );
      }
    }
  } else if (entries) {
    list = resolveUiTranslationTargetCodes(config, entries);
  } else {
    list = config.targetLocales.map((l) => normalizeLocale(l));
  }

  return list.filter((c) => normalizeLocale(c) !== src);
}

/** If `uiLanguagesPath` is set and the file exists, merge display names into config. */
export function augmentConfigWithUiLanguagesFile(config: I18nConfig, cwd: string): I18nConfig {
  const abs = resolveUiLanguagesAbsPath(config, cwd);
  if (!abs || !fs.existsSync(abs)) {
    return config;
  }
  try {
    const entries = loadUiLanguageEntries(abs);
    return mergeUiLanguageDisplayNames(config, entries);
  } catch (e) {
    throw new Error(
      `Invalid ui-languages file (${config.uiLanguagesPath}): ${e instanceof Error ? e.message : String(e)}`
    );
  }
}
