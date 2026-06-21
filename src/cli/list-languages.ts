import fs from "fs";
import chalk from "chalk";
import { resolveBundledUiLanguagesCompletePath } from "../core/ui-languages-catalog.js";

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
    throw new Error("ui-languages-complete.json must be a JSON array");
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
  const codeW = Math.max(4, ...entries.map((e) => e.code.length));
  const dirW = Math.max(3, ...entries.map((e) => e.direction.length));
  const enW = Math.max(12, ...entries.map((e) => e.englishName.length));

  // Native name is last because non-Latin scripts (combining marks, wide CJK glyphs)
  // have a display width that differs from their string length; keeping the variable-width
  // column last means its glyphs cannot push any later column out of alignment.
  console.log(
    "  " +
      chalk.bold("Code".padEnd(codeW)) +
      "  " +
      chalk.bold("Dir".padEnd(dirW)) +
      "  " +
      chalk.bold("English name".padEnd(enW)) +
      "  " +
      chalk.bold("Native name")
  );
  console.log(
    "  " +
      chalk.gray("-".repeat(codeW)) +
      "  " +
      chalk.gray("-".repeat(dirW)) +
      "  " +
      chalk.gray("-".repeat(enW)) +
      "  " +
      chalk.gray("-".repeat(11))
  );
  for (const entry of entries) {
    const dir =
      entry.direction === "rtl"
        ? chalk.yellow(entry.direction.padEnd(dirW))
        : chalk.gray(entry.direction.padEnd(dirW));
    console.log(
      "  " +
        chalk.cyan(entry.code.padEnd(codeW)) +
        "  " +
        dir +
        "  " +
        entry.englishName.padEnd(enW) +
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
    console.log(
      chalk.bold(
        `Available UI languages — ${entries.length} entr${entries.length === 1 ? "y" : "ies"}.`
      )
    );
  } else {
    console.log(
      chalk.bold(
        `UI languages matching "${term}" — ${filtered.length} of ${entries.length} entr${
          entries.length === 1 ? "y" : "ies"
        }.`
      )
    );
  }
  console.log();

  if (filtered.length === 0) {
    console.log(chalk.yellow("No matching languages."));
    console.log();
    return { exitCode: 0 };
  }

  printLanguageTable(filtered);
  console.log();
  return { exitCode: 0 };
}
