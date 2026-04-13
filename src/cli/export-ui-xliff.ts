import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { normalizeLocale } from "../core/config.js";
import { resolveLocalesForUI } from "../core/ui-languages.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";

/** Matches `strings.json` entry shape used by extract / translate-ui. */
export interface StringsJsonEntry {
  source?: string;
  translated?: Record<string, string>;
  models?: Record<string, string>;
  locations?: Array<{ file?: string; line?: number }>;
}

export type StringsJsonFile = Record<string, StringsJsonEntry>;

export interface ExportUIXliffOptions {
  cwd: string;
  locales?: string | null;
  outputDir?: string;
  untranslatedOnly: boolean;
  dryRun: boolean;
}

export interface ExportUIXliffSummary {
  stringsPath: string;
  outputDir: string;
  locales: string[];
  filesWritten: string[];
  unitsPerLocale: Record<string, number>;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** XLIFF 2.0 `xml:lang`-style value: BCP 47; keep normalized config codes. */
function xliffLangAttr(locale: string): string {
  return escapeXml(normalizeLocale(locale));
}

function buildNotesBlock(entry: StringsJsonEntry): string {
  const locs = entry.locations;
  if (!locs?.length) {
    return "";
  }
  const lines: string[] = ["      <notes>"];
  for (const loc of locs) {
    const file = typeof loc.file === "string" ? loc.file : "";
    const line = typeof loc.line === "number" ? loc.line : undefined;
    const text =
      line !== undefined && file ? `${file}:${line}` : file || (line !== undefined ? String(line) : "");
    if (text) {
      lines.push(`        <note category="location">${escapeXml(text)}</note>`);
    }
  }
  lines.push("      </notes>");
  return lines.length > 2 ? `${lines.join("\n")}\n` : "";
}

function buildUnitXml(
  id: string,
  entry: StringsJsonEntry,
  targetLocale: string,
  untranslatedOnly: boolean
): string | null {
  const source = entry.source ?? "";
  const tr = entry.translated?.[targetLocale];
  const hasTranslation = typeof tr === "string" && tr.trim().length > 0;

  if (untranslatedOnly && hasTranslation) {
    return null;
  }

  const notes = buildNotesBlock(entry);
  const state = hasTranslation ? "translated" : "initial";
  const sourceLine = `        <source>${escapeXml(source)}</source>`;
  const targetLine = hasTranslation
    ? `\n        <target>${escapeXml(tr!)}</target>`
    : "";

  return `    <unit id="${escapeXml(id)}">
${notes}      <segment state="${state}">
${sourceLine}${targetLine}
      </segment>
    </unit>`;
}

export function buildUiXliffString(
  config: I18nConfig,
  data: StringsJsonFile,
  targetLocale: string,
  untranslatedOnly: boolean,
  fileId: string
): string {
  const srcLang = xliffLangAttr(config.sourceLocale);
  const trgLang = xliffLangAttr(targetLocale);

  const unitLines: string[] = [];
  for (const id of Object.keys(data).sort()) {
    const entry = data[id];
    if (!entry) {
      continue;
    }
    const unitXml = buildUnitXml(id, entry, targetLocale, untranslatedOnly);
    if (unitXml) {
      unitLines.push(unitXml);
    }
  }

  const body = unitLines.join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="2.0" xmlns="urn:oasis:names:tc:xliff:document:2.0" srcLang="${srcLang}" trgLang="${trgLang}">
  <file id="${escapeXml(fileId)}">
${body}
  </file>
</xliff>
`;
}

/**
 * Read `strings.json` and write one XLIFF 2.0 file per target locale.
 */
export function runExportUIXliff(config: I18nConfig, opts: ExportUIXliffOptions): ExportUIXliffSummary {
  const stringsPath = resolveStringsJsonPath(config, opts.cwd);
  if (!fs.existsSync(stringsPath)) {
    throw new Error(`[export-ui-xliff] strings.json not found: ${stringsPath}`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(stringsPath, "utf8"));
  } catch (e) {
    throw new Error(
      `[export-ui-xliff] Failed to parse ${stringsPath}: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`[export-ui-xliff] Invalid strings.json: expected an object`);
  }

  const data = raw as StringsJsonFile;
  let locales: string[];
  try {
    locales = resolveLocalesForUI(config, opts.cwd, opts.locales ?? null);
  } catch (e) {
    if (e instanceof Error && e.message.includes("[translate-ui]")) {
      throw new Error(e.message.replace("[translate-ui]", "[export-ui-xliff]"));
    }
    throw e;
  }
  if (locales.length === 0) {
    throw new Error(
      `[export-ui-xliff] No target locales to export (check targetLocales / ui-languages and --locale).`
    );
  }

  const outDir = opts.outputDir
    ? path.isAbsolute(opts.outputDir)
      ? opts.outputDir
      : path.join(opts.cwd, opts.outputDir)
    : path.dirname(stringsPath);

  const baseName = path.basename(stringsPath, path.extname(stringsPath));
  const fileId = baseName || "strings";

  const filesWritten: string[] = [];
  const unitsPerLocale: Record<string, number> = {};

  for (const locale of locales) {
    const normalized = normalizeLocale(locale);
    const xml = buildUiXliffString(config, data, normalized, opts.untranslatedOnly, fileId);
    const outPath = path.join(outDir, `${baseName}.${normalized}.xliff`);

    let count = 0;
    for (const id of Object.keys(data)) {
      const entry = data[id];
      if (!entry) {
        continue;
      }
      const tr = entry.translated?.[normalized];
      const hasTranslation = typeof tr === "string" && tr.trim().length > 0;
      if (opts.untranslatedOnly && hasTranslation) {
        continue;
      }
      count += 1;
    }
    unitsPerLocale[normalized] = count;

    if (opts.dryRun) {
      console.log(chalk.cyan(`[dry-run] would write ${outPath} (${count} units)`));
      continue;
    }

    writeAtomicUtf8(outPath, xml);
    filesWritten.push(outPath);
    console.log(chalk.green(`✅ Wrote ${outPath} (${count} units)`));
  }

  return {
    stringsPath,
    outputDir: outDir,
    locales,
    filesWritten,
    unitsPerLocale,
  };
}
