import fs from "fs";
import path from "path";
import chalk from "chalk";
import type {
  CldrPluralForm,
  I18nConfig,
  StringsJsonEntry,
  StringsJsonPlainEntry,
} from "../core/types.js";
import { isPluralStringsEntry } from "../core/types.js";
import { normalizeLocale } from "../core/config.js";
import { resolveLocalesForUI } from "../core/ui-languages.js";
import { requiredCldrPluralForms } from "../core/plural-forms.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";

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
      line !== undefined && file
        ? `${file}:${line}`
        : file || (line !== undefined ? String(line) : "");
    if (text) {
      lines.push(`        <note category="location">${escapeXml(text)}</note>`);
    }
  }
  lines.push("      </notes>");
  return lines.length > 2 ? `${lines.join("\n")}\n` : "";
}

function pluralFullyTranslated(entry: StringsJsonPluralLike, locale: string): boolean {
  const forms = entry.translated?.[normalizeLocale(locale)];
  if (!forms || typeof forms !== "object") {
    return false;
  }
  const req = requiredCldrPluralForms(locale);
  return req.every((f) => typeof forms[f] === "string" && String(forms[f]).trim().length > 0);
}

type StringsJsonPluralLike = {
  plural: true;
  source?: string;
  translated?: Record<string, Partial<Record<CldrPluralForm, string>>>;
  locations?: Array<{ file?: string; line?: number }>;
};

function buildPlainUnitXml(
  id: string,
  entry: StringsJsonPlainEntry,
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
  const targetLine = hasTranslation ? `\n        <target>${escapeXml(tr!)}</target>` : "";

  return `    <unit id="${escapeXml(id)}">
${notes}      <segment state="${state}">
${sourceLine}${targetLine}
      </segment>
    </unit>`;
}

function buildPluralUnitXml(
  config: I18nConfig,
  id: string,
  entry: StringsJsonPluralLike,
  targetLocale: string,
  untranslatedOnly: boolean
): string | null {
  const srcNorm = normalizeLocale(config.sourceLocale);
  const tgtNorm = normalizeLocale(targetLocale);

  const fullyTranslated = pluralFullyTranslated(entry, targetLocale);
  if (untranslatedOnly && fullyTranslated) {
    return null;
  }

  const notes = buildPluralNotes(entry);

  const reqTarget = requiredCldrPluralForms(targetLocale);
  const segments: string[] = [];
  for (const form of reqTarget) {
    const srcText = String(
      (entry.translated?.[srcNorm] as Partial<Record<CldrPluralForm, string>>)?.[form] ?? ""
    );
    const trRaw = (entry.translated?.[tgtNorm] as Partial<Record<CldrPluralForm, string>>)?.[form];
    const hasTr = typeof trRaw === "string" && trRaw.trim().length > 0;
    const state = hasTr ? "translated" : "initial";
    const targetLine = hasTr ? `\n        <target>${escapeXml(trRaw!)}</target>` : "";
    segments.push(`      <segment id="${escapeXml(`${id}_${form}`)}" state="${state}">
        <source>${escapeXml(srcText)}</source>${targetLine}
      </segment>`);
  }

  return `    <unit id="${escapeXml(id)}">
${notes}${segments.join("\n")}
    </unit>`;
}

function buildPluralNotes(entry: StringsJsonPluralLike): string {
  const lines: string[] = [];
  if (entry.source?.trim()) {
    lines.push(`        <note category="original">${escapeXml(entry.source.trim())}</note>`);
  }
  for (const loc of entry.locations ?? []) {
    const file = typeof loc.file === "string" ? loc.file : "";
    const line = typeof loc.line === "number" ? loc.line : undefined;
    const text =
      line !== undefined && file
        ? `${file}:${line}`
        : file || (line !== undefined ? String(line) : "");
    if (text) {
      lines.push(`        <note category="location">${escapeXml(text)}</note>`);
    }
  }
  if (lines.length === 0) {
    return "";
  }
  return `      <notes>
${lines.join("\n")}
      </notes>
`;
}

function buildUnitXml(
  config: I18nConfig,
  id: string,
  entry: StringsJsonEntry,
  targetLocale: string,
  untranslatedOnly: boolean
): string | null {
  if (isPluralStringsEntry(entry)) {
    return buildPluralUnitXml(config, id, entry, targetLocale, untranslatedOnly);
  }
  return buildPlainUnitXml(id, entry as StringsJsonPlainEntry, targetLocale, untranslatedOnly);
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
    const unitXml = buildUnitXml(config, id, entry, targetLocale, untranslatedOnly);
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

function shouldCountUnit(
  config: I18nConfig,
  entry: StringsJsonEntry | undefined,
  normalized: string,
  untranslatedOnly: boolean
): boolean {
  if (!entry) {
    return false;
  }
  if (isPluralStringsEntry(entry)) {
    const fullyTranslated = pluralFullyTranslated(entry, normalized);
    if (untranslatedOnly && fullyTranslated) {
      return false;
    }
    return true;
  }
  const tr = entry.translated?.[normalized];
  const hasTranslation = typeof tr === "string" && tr.trim().length > 0;
  if (untranslatedOnly && hasTranslation) {
    return false;
  }
  return true;
}

/**
 * Read `strings.json` and write one XLIFF 2.0 file per target locale.
 */
export function runExportUIXliff(
  config: I18nConfig,
  opts: ExportUIXliffOptions
): ExportUIXliffSummary {
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
      if (shouldCountUnit(config, data[id], normalized, opts.untranslatedOnly)) {
        count += 1;
      }
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
