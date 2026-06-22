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
 * A locale is considered present in the master catalog only when its normalized key matches a
 * master `code` exactly.
 *
 * Exact-match is the same rule {@link buildUiLanguageRowsFromMaster} uses to build the manifest, so
 * validation and manifest construction never disagree. A bare language subtag that the catalog only
 * carries regional/script variants for (e.g. `zh` → `zh-Hans`/`zh-Hant`, `pa` → `pa-IN`/`pa-PK`) is
 * rejected here rather than silently degraded to a placeholder row at build time; such tags are
 * script-ambiguous and have no sensible default variant. Callers surface the available variants via
 * {@link bareSubtagVariantCodes}.
 */
function isLocaleInUiLanguagesMaster(locale: string, master: Map<string, UiLanguageRow>): boolean {
  return master.has(normalizeManifestLocaleKey(locale));
}

/**
 * For a bare language subtag (no region/script, e.g. `pa`) with no exact catalog entry, return the
 * catalog codes that share its primary subtag (e.g. `pa-IN`, `pa-PK`), sorted. Returns `[]` for
 * tags that already carry a region/script or have no matching variants, so the suggestion is only
 * offered when it is genuinely actionable.
 */
function bareSubtagVariantCodes(locale: string, master: Map<string, UiLanguageRow>): string[] {
  const trimmed = locale.trim();
  if (/[-_]/.test(trimmed)) {
    return [];
  }
  const primary = primaryLanguageSubtag(trimmed);
  if (!primary) {
    return [];
  }
  const variants: string[] = [];
  for (const row of master.values()) {
    if (primaryLanguageSubtag(row.code) === primary) {
      variants.push(row.code);
    }
  }
  return variants.sort((a, b) => a.localeCompare(b));
}

/** Join codes as `"a"`, `"a" or "b"`, `"a", "b" or "c"` for a human-readable suggestion. */
function formatVariantSuggestion(codes: string[]): string {
  const quoted = codes.map((c) => `"${c}"`);
  if (quoted.length <= 1) {
    return quoted.join("");
  }
  return `${quoted.slice(0, -1).join(", ")} or ${quoted[quoted.length - 1]}`;
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
  const describeUnknown = (locale: string): string => {
    const variants = bareSubtagVariantCodes(locale, master);
    const suggestion =
      variants.length > 0 ? `; did you mean ${formatVariantSuggestion(variants)}?` : "";
    return `unknown locale "${locale.trim()}" (not in data/ui-languages-complete.json)${suggestion}`;
  };
  if (!isLocaleInUiLanguagesMaster(config.sourceLocale, master)) {
    unknown.push({
      path: "sourceLocale",
      message: describeUnknown(config.sourceLocale),
    });
  }
  config.targetLocales.forEach((locale, index) => {
    if (!isLocaleInUiLanguagesMaster(locale, master)) {
      unknown.push({
        path: `targetLocales[${index}]`,
        message: describeUnknown(locale),
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
