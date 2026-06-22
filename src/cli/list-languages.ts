import fs from "fs";
import chalk from "chalk";
import { resolveBundledUiLanguagesCompletePath } from "../core/ui-languages-catalog.js";
import { displayWidth, padEndDisplay } from "../utils/table.js";
import { t } from "../i18n/index.js";

export interface RunListLanguagesResult {
  exitCode: number;
}

interface UiLanguageEntry {
  code: string;
  label: string;
  englishName: string;
  direction: string;
}

/** Read the bundled master catalog as a raw array (preserves every entry; no dedup/normalization). */
function loadAllUiLanguages(absPath: string): UiLanguageEntry[] {
  const raw = fs.readFileSync(absPath, "utf8");
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error(t("ui-languages-complete.json must be a JSON array"));
  }
  const rows: UiLanguageEntry[] = [];
  for (const item of data) {
    if (item === null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const code = typeof o.code === "string" ? o.code : "";
    if (!code) continue;
    rows.push({
      code,
      label: typeof o.label === "string" ? o.label : "",
      englishName: typeof o.englishName === "string" ? o.englishName : "",
      direction: typeof o.direction === "string" ? o.direction : "",
    });
  }
  return rows;
}

/** True when `search` (case-insensitive) appears in any field of the entry. */
function entryMatches(entry: UiLanguageEntry, search: string): boolean {
  const needle = search.toLowerCase();
  return (
    entry.code.toLowerCase().includes(needle) ||
    entry.label.toLowerCase().includes(needle) ||
    entry.englishName.toLowerCase().includes(needle) ||
    entry.direction.toLowerCase().includes(needle)
  );
}

function printLanguageTable(entries: UiLanguageEntry[]): void {
  // Headers are translated, so their (display) width must be included in the column
  // sizing — a localized label like "Répertoire" is wider than the English "Dir".
  const codeHeader = t("Code");
  const dirHeader = t("Dir");
  const enHeader = t("English name");
  const nativeHeader = t("Native name");
  const codeW = Math.max(displayWidth(codeHeader), ...entries.map((e) => displayWidth(e.code)));
  const dirW = Math.max(displayWidth(dirHeader), ...entries.map((e) => displayWidth(e.direction)));
  const enW = Math.max(displayWidth(enHeader), ...entries.map((e) => displayWidth(e.englishName)));

  // Native name is last because non-Latin scripts (combining marks, wide CJK glyphs)
  // have a display width that differs from their string length; keeping the variable-width
  // column last means its glyphs cannot push any later column out of alignment.
  console.log(
    "  " +
      chalk.bold(padEndDisplay(codeHeader, codeW)) +
      "  " +
      chalk.bold(padEndDisplay(dirHeader, dirW)) +
      "  " +
      chalk.bold(padEndDisplay(enHeader, enW)) +
      "  " +
      chalk.bold(nativeHeader)
  );
  console.log(
    "  " +
      chalk.gray("-".repeat(codeW)) +
      "  " +
      chalk.gray("-".repeat(dirW)) +
      "  " +
      chalk.gray("-".repeat(enW)) +
      "  " +
      chalk.gray("-".repeat(displayWidth(nativeHeader)))
  );
  for (const entry of entries) {
    const dir =
      entry.direction === "rtl"
        ? chalk.yellow(padEndDisplay(entry.direction, dirW))
        : chalk.gray(padEndDisplay(entry.direction, dirW));
    console.log(
      "  " +
        chalk.cyan(padEndDisplay(entry.code, codeW)) +
        "  " +
        dir +
        "  " +
        padEndDisplay(entry.englishName, enW) +
        "  " +
        entry.label
    );
  }
}

/**
 * List the bundled UI languages catalog (`data/ui-languages-complete.json`) formatted for humans.
 * When `search` is provided, only entries whose code, native label, English name, or text direction
 * contain the term (case-insensitive) are shown.
 */
export function runListLanguages(search?: string): RunListLanguagesResult {
  let entries: UiLanguageEntry[];
  try {
    entries = loadAllUiLanguages(resolveBundledUiLanguagesCompletePath());
  } catch (e) {
    console.error(chalk.red(e instanceof Error ? e.message : String(e)));
    return { exitCode: 1 };
  }

  const term = search?.trim() ?? "";
  const filtered = term === "" ? entries : entries.filter((entry) => entryMatches(entry, term));

  if (term === "") {
    const summary =
      entries.length === 1
        ? t("Available UI languages — {{count}} entry.", { count: entries.length })
        : t("Available UI languages — {{count}} entries.", { count: entries.length });
    console.log(chalk.bold(summary));
  } else {
    const summary =
      entries.length === 1
        ? t('UI languages matching "{{term}}" — {{matched}} of {{total}} entry.', {
            term,
            matched: filtered.length,
            total: entries.length,
          })
        : t('UI languages matching "{{term}}" — {{matched}} of {{total}} entries.', {
            term,
            matched: filtered.length,
            total: entries.length,
          });
    console.log(chalk.bold(summary));
  }
  console.log();

  if (filtered.length === 0) {
    console.log(chalk.yellow(t("No matching languages.")));
    console.log();
    return { exitCode: 0 };
  }

  printLanguageTable(filtered);
  console.log();
  return { exitCode: 0 };
}
