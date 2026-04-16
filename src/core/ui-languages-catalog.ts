import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { normalizeManifestLocaleKey } from "./locale-utils.js";
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
      rows.push({
        ...hit,
        direction: hit.direction ?? "ltr",
      });
    } else {
      warnings.push(`No master entry for locale "${code}"; using placeholders`);
      rows.push({
        code,
        label: code,
        englishName: `TODO (${code})`,
        direction: "ltr",
      });
    }
  }

  return { rows, warnings };
}
