import fs from "fs";
import path from "path";
import chalk from "chalk";
import type {
  CldrPluralForm,
  I18nConfig,
  I18nUiTranslateConfig,
  StringsJsonEntry,
  StringsJsonPlainEntry,
} from "../core/types.js";
import { isPluralStringsEntry } from "../core/types.js";
import { normalizeLocale } from "../core/config.js";
import {
  effectiveUiTargetLocales,
  formatUiBlockLabel,
  resolveLocalesForUiBlock,
  selectUiBlocks,
  toUiTranslateConfig,
} from "../core/ui-blocks.js";
import { requiredCldrPluralForms } from "../core/plural-forms.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";
import { t } from "../i18n/index.js";

export type StringsJsonFile = Record<string, StringsJsonEntry>;

export interface ExportUIXliffOptions {
  cwd: string;
  locales?: string | null;
  outputDir?: string;
  untranslatedOnly: boolean;
  dryRun: boolean;
  /** Index, description, or stringsJson path. Omit to export every block with sourceRoots. */
  uiBlock?: string;
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
  config: { sourceLocale: string },
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
  config: { sourceLocale: string },
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
  config: { sourceLocale: string },
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
  config: { sourceLocale: string },
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
  const selected = selectUiBlocks(config, opts.uiBlock);
  const combined: ExportUIXliffSummary = {
    stringsPath: "",
    outputDir: "",
    locales: [],
    filesWritten: [],
    unitsPerLocale: {},
  };
  for (const item of selected) {
    console.log(chalk.cyan(formatUiBlockLabel(item.index, item.block)));
    const view = toUiTranslateConfig(
      { ...config, targetLocales: effectiveUiTargetLocales(config, item.block) },
      item.block
    );
    const one = exportOneUiCatalog(view, opts);
    combined.stringsPath = one.stringsPath;
    combined.outputDir = one.outputDir;
    for (const locale of one.locales) {
      if (!combined.locales.includes(locale)) {
        combined.locales.push(locale);
      }
      combined.unitsPerLocale[locale] =
        (combined.unitsPerLocale[locale] ?? 0) + (one.unitsPerLocale[locale] ?? 0);
    }
    combined.filesWritten.push(...one.filesWritten);
  }
  return combined;
}

function exportOneUiCatalog(
  config: I18nUiTranslateConfig,
  opts: ExportUIXliffOptions
): ExportUIXliffSummary {
  const stringsPath = resolveStringsJsonPath(config.ui, opts.cwd);
  if (!fs.existsSync(stringsPath)) {
    throw new Error(t("[export-ui-xliff] strings.json not found: {{path}}", { path: stringsPath }));
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(stringsPath, "utf8"));
  } catch (e) {
    throw new Error(
      t("[export-ui-xliff] Failed to parse {{path}}: {{error}}", {
        path: stringsPath,
        error: e instanceof Error ? e.message : String(e),
      })
    );
  }

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(t("[export-ui-xliff] Invalid strings.json: expected an object"));
  }

  const data = raw as StringsJsonFile;
  let locales: string[];
  try {
    locales = resolveLocalesForUiBlock(config, config.ui, opts.cwd, opts.locales ?? null);
  } catch (e) {
    if (e instanceof Error && e.message.includes("[translate-ui]")) {
      throw new Error(e.message.replace("[translate-ui]", "[export-ui-xliff]"));
    }
    throw e;
  }
  if (locales.length === 0) {
    throw new Error(
      t(
        "[export-ui-xliff] No target locales to export (check targetLocales / ui-languages and --locale)."
      )
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
      console.log(
        chalk.cyan(t("[dry-run] would write {{path}} ({{count}} units)", { path: outPath, count }))
      );
      continue;
    }

    writeAtomicUtf8(outPath, xml);
    filesWritten.push(outPath);
    console.log(chalk.green(t("✅ Wrote {{path}} ({{count}} units)", { path: outPath, count })));
  }

  return {
    stringsPath,
    outputDir: outDir,
    locales,
    filesWritten,
    unitsPerLocale,
  };
}
