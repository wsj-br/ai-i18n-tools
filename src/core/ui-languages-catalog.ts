import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { ConfigValidationError } from "./errors.js";
import { normalizeManifestLocaleKey, primaryLanguageSubtag } from "./locale-utils.js";
import type { I18nConfig } from "./types.js";

/** Bundled IANA-derived master (`data/ui-languages-complete.json`). */
export function resolveBundledUiLanguagesCompletePath(): string {
  return path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "data",
    "ui-languages-complete.json"
  );
}

export type UiLanguageRow = {
  code: string;
  label: string;
  englishName: string;
  direction: "ltr" | "rtl";
  isSourceLocale?: boolean;
};

/**
 * Ordered unique locale codes: `sourceLocale` then `targetLocales`.
 * Deduplication uses {@link normalizeManifestLocaleKey} (hyphen vs underscore, case-insensitive).
 */
export function effectiveUiLanguagesCodes(config: I18nConfig): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of [config.sourceLocale, ...config.targetLocales]) {
    const key = normalizeManifestLocaleKey(c);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c.trim());
    }
  }
  return out;
}

/**
 * Load master catalog; keys are {@link normalizeManifestLocaleKey} (glibc or BCP-47).
 */
export function loadUiLanguagesMaster(absPath: string): Map<string, UiLanguageRow> {
  const raw = fs.readFileSync(absPath, "utf8");
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("ui-languages-complete.json must be a JSON array");
  }
  const map = new Map<string, UiLanguageRow>();
  for (const item of data) {
    if (item === null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const code = typeof o.code === "string" ? o.code.trim() : "";
    if (!code) continue;
    const label = typeof o.label === "string" && o.label.trim() ? o.label.trim() : code;
    const englishName =
      typeof o.englishName === "string" && o.englishName.trim() ? o.englishName.trim() : label;
    const dir = o.direction;
    const direction: "ltr" | "rtl" = dir === "ltr" || dir === "rtl" ? dir : "ltr";
    const row: UiLanguageRow = { code, label, englishName, direction };
    map.set(normalizeManifestLocaleKey(code), row);
  }
  return map;
}

/**
 * A locale is considered present in the master catalog when either:
 * - its normalized key matches a master `code` exactly, or
 * - it is a bare language subtag (no region/script, e.g. `en`, `zh`) whose primary subtag matches
 *   the primary subtag of some master entry (e.g. `en` ↔ `en-GB`/`en-US`).
 *
 * The second rule keeps generic language codes valid even though the IANA-derived master only
 * enumerates regional/script variants for some languages, while still rejecting malformed tags
 * such as `hi-Lan`.
 */
function isLocaleInUiLanguagesMaster(locale: string, master: Map<string, UiLanguageRow>): boolean {
  if (master.has(normalizeManifestLocaleKey(locale))) {
    return true;
  }
  const trimmed = locale.trim();
  const isBareLanguage = !/[-_]/.test(trimmed);
  if (!isBareLanguage) {
    return false;
  }
  const primary = primaryLanguageSubtag(trimmed);
  if (!primary) {
    return false;
  }
  for (const row of master.values()) {
    if (primaryLanguageSubtag(row.code) === primary) {
      return true;
    }
  }
  return false;
}

/**
 * Fatal-validate that `sourceLocale` and every `targetLocales` entry exist in the bundled master
 * catalog (`data/ui-languages-complete.json`). Throws {@link ConfigValidationError} listing any
 * unknown locale codes. See {@link isLocaleInUiLanguagesMaster} for the matching rules.
 */
export function assertEffectiveLocalesInUiLanguagesMaster(config: I18nConfig): void {
  const masterPath = resolveBundledUiLanguagesCompletePath();
  if (!fs.existsSync(masterPath)) {
    throw new ConfigValidationError(
      `Cannot validate locales: bundled UI languages catalog not found at ${masterPath}`
    );
  }
  const master = loadUiLanguagesMaster(masterPath);
  const unknown: { path: string; message: string }[] = [];
  if (!isLocaleInUiLanguagesMaster(config.sourceLocale, master)) {
    unknown.push({
      path: "sourceLocale",
      message: `unknown locale "${config.sourceLocale.trim()}" (not in data/ui-languages-complete.json)`,
    });
  }
  config.targetLocales.forEach((locale, index) => {
    if (!isLocaleInUiLanguagesMaster(locale, master)) {
      unknown.push({
        path: `targetLocales[${index}]`,
        message: `unknown locale "${locale.trim()}" (not in data/ui-languages-complete.json)`,
      });
    }
  });
  if (unknown.length > 0) {
    throw new ConfigValidationError(
      `Invalid locale(s) in config: ${unknown.map((u) => `${u.path}: ${u.message}`).join("; ")}. ` +
        `\n\nRun \`ai-i18n-tools list-languages\` to see the available language codes (add a search term, e.g. \`ai-i18n-tools list-languages portuguese\`, to filter).\n`,
      unknown
    );
  }
}

/**
 * Build manifest rows from config locales and a loaded master map (same rules as `generate-ui-languages`).
 */
export function buildUiLanguageRowsFromMaster(
  config: I18nConfig,
  master: Map<string, UiLanguageRow>
): { rows: UiLanguageRow[]; warnings: string[] } {
  const codes = effectiveUiLanguagesCodes(config);
  const warnings: string[] = [];
  const rows: UiLanguageRow[] = [];

  for (const code of codes) {
    const hit = master.get(normalizeManifestLocaleKey(code));
    if (hit) {
      const row: UiLanguageRow = {
        ...hit,
        direction: hit.direction ?? "ltr",
      };
      if (code === config.sourceLocale) {
        row.isSourceLocale = true;
      }
      rows.push(row);
    } else {
      warnings.push(`No master entry for locale "${code}"; using placeholders`);
      const row: UiLanguageRow = {
        code,
        label: code,
        englishName: `TODO (${code})`,
        direction: "ltr",
      };
      if (code === config.sourceLocale) {
        row.isSourceLocale = true;
      }
      rows.push(row);
    }
  }

  return { rows, warnings };
}
