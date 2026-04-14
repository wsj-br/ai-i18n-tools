import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import type { UiLanguageRow } from "../core/ui-languages-catalog.js";
import {
  buildUiLanguageRowsFromMaster,
  loadUiLanguagesMaster,
} from "../core/ui-languages-catalog.js";
import { writeAtomicUtf8 } from "./helpers.js";
import { timestamp } from "./format.js";

/** Default bundled master file (next to `dist/` when running compiled CLI). */
export function resolveDefaultUiLanguagesMasterPath(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "ui-languages-complete.json");
}

export type { UiLanguageRow } from "../core/ui-languages-catalog.js";
export { effectiveUiLanguagesCodes, loadUiLanguagesMaster } from "../core/ui-languages-catalog.js";

export interface GenerateUiLanguagesResult {
  outPath: string;
  rows: UiLanguageRow[];
  warnings: string[];
  dryRun: boolean;
}

/**
 * Build project `ui-languages.json` rows from config locales and a master file.
 */
export function runGenerateUiLanguages(
  config: I18nConfig,
  cwd: string,
  options: { masterPath: string; dryRun: boolean }
): GenerateUiLanguagesResult {
  const uiPath = config.uiLanguagesPath?.trim();
  if (!uiPath) {
    throw new Error("uiLanguagesPath must be set in config (output path for ui-languages.json)");
  }

  const master = loadUiLanguagesMaster(path.resolve(options.masterPath));
  const { rows, warnings } = buildUiLanguageRowsFromMaster(config, master);

  const outPath = path.resolve(cwd, uiPath);
  if (!options.dryRun) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    writeAtomicUtf8(outPath, `${JSON.stringify(rows, null, 2)}\n`);
  }

  return { outPath, rows, warnings, dryRun: options.dryRun };
}

export function logGenerateUiLanguagesWarnings(warnings: string[]): void {
  for (const w of warnings) {
    console.warn(chalk.yellow(`⚠️  ${timestamp()} - ${w}`));
  }
}
