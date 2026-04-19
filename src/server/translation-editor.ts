import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { parse } from "csv-parse/sync";
import { TranslationCache } from "../core/cache.js";
import type { CldrPluralForm } from "../core/types.js";
import { isPluralStringsEntry } from "../core/types.js";
import {
  isKnownCldrPluralFormKey,
  pluralFormsRequiredForTranslateUi,
  pluralTranslatedLocaleHasContent,
} from "../core/plural-forms.js";
import { USER_EDITED_MODEL } from "../core/user-edited-model.js";
import { computeProjectStats } from "../core/project-stats.js";
import { writeAtomicUtf8 } from "../cli/helpers.js";

/** User glossary CSV columns (see {@link Glossary} `loadUserCsv`). */
const GLOSSARY_USER_HEADERS = [
  "Original language string",
  "locale",
  "Translation",
  "Force",
] as const;

function csvEscapeCell(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function serializeGlossaryCsv(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(csvEscapeCell).join(","),
    ...rows.map((r) => r.map(csvEscapeCell).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

/** Strip empty plural form strings per locale from GET payloads (disk file unchanged). */
function omitEmptyPluralFormStrings(translated: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [loc, val] of Object.entries(translated)) {
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      const bucket: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (typeof v === "string" && v.trim() !== "") {
          bucket[k] = v;
        }
      }
      out[loc] = bucket;
    } else {
      out[loc] = val;
    }
  }
  return out;
}

/** Locales to surface for a plural row: source + targets + any locale key already in `translated`. */
function pluralLocaleUnion(
  translated: Record<string, unknown>,
  sourceLocale: string,
  targetLocales: string[]
): string[] {
  const s = new Set<string>();
  s.add(sourceLocale);
  for (const t of targetLocales) {
    s.add(t);
  }
  for (const k of Object.keys(translated)) {
    s.add(k);
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

/** Merge PATCH `translated` for plain (string per locale) vs plural (nested forms per locale). */
function mergeUiStringsTranslated(
  prevEntry: Record<string, unknown>,
  prevTranslated: Record<string, unknown>,
  patch: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (patch === undefined) {
    return prevTranslated;
  }
  if (isPluralStringsEntry(prevEntry)) {
    const next: Record<string, unknown> = { ...prevTranslated };
    for (const [loc, val] of Object.entries(patch)) {
      if (typeof val === "string") {
        throw new Error(
          `Locale "${loc}": plural entries require an object of CLDR forms (one, other, …), not a plain string.`
        );
      }
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        const prevLocRaw = next[loc];
        const prevLoc =
          prevLocRaw !== undefined &&
          typeof prevLocRaw === "object" &&
          prevLocRaw !== null &&
          !Array.isArray(prevLocRaw)
            ? (prevLocRaw as Record<string, unknown>)
            : {};
        const merged: Record<string, string> = {};
        for (const [k, v] of Object.entries(prevLoc)) {
          if (typeof v === "string") {
            merged[k] = v;
          }
        }
        for (const [formKey, formVal] of Object.entries(val as Record<string, unknown>)) {
          if (!isKnownCldrPluralFormKey(formKey)) {
            throw new Error(
              `Unknown plural form key "${formKey}" (expected a CLDR cardinal category).`
            );
          }
          if (typeof formVal !== "string") {
            throw new Error(`Locale "${loc}" form "${formKey}" must be a string.`);
          }
          if (formVal === "") {
            delete merged[formKey];
          } else {
            merged[formKey] = formVal;
          }
        }
        next[loc] = merged;
      }
    }
    return next;
  }
  const next: Record<string, unknown> = { ...prevTranslated };
  for (const [loc, val] of Object.entries(patch)) {
    if (typeof val !== "string") {
      throw new Error(`Locale "${loc}": plain entries require a string translation.`);
    }
    next[loc] = val;
  }
  return next;
}

/** Persist `strings.json` row preserving `plural` / `zeroDigit` / `locations`. */
function serializeStringsJsonRow(
  prev: Record<string, unknown>,
  next: {
    source: string;
    translated: Record<string, unknown>;
    models: Record<string, string>;
  }
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    source: next.source,
    translated: next.translated,
    ...(Array.isArray(prev.locations) && prev.locations.length > 0
      ? { locations: prev.locations }
      : {}),
    ...(Object.keys(next.models).length > 0 ? { models: next.models } : {}),
  };
  if (isPluralStringsEntry(prev)) {
    row.plural = true;
    if (typeof prev.zeroDigit === "boolean") {
      row.zeroDigit = prev.zeroDigit;
    }
  }
  return row;
}

export interface TranslationEditorOptions {
  cwd: string;
  /** Resolved absolute or cwd-relative path to strings.json (workspace B). */
  stringsJsonPath?: string | null;
  /** Resolved path to glossary-user.csv (workspace C). */
  glossaryUserPath?: string | null;
  /** BCP-47 locale for source / original strings (from config `sourceLocale`). */
  sourceLocale: string;
  targetLocales: string[];
  /**
   * `documentation.jsonSource` (cwd-relative). Used to print full paths for JSON segments
   * that were stored relative to this root (e.g. `code.json` → `docs-site/i18n/en/code.json`).
   */
  jsonSource?: string | null;
}

/** Normalize cache filepath for console log-links (JSON rows may omit jsonSource prefix). */
export function resolveSegmentLogFilepath(
  filepath: string,
  jsonSource: string | null | undefined
): string {
  if (!filepath || !jsonSource?.trim()) return String(filepath);
  const fp = String(filepath).replace(/\\/g, "/").replace(/^\/+/, "");
  const js = jsonSource.trim().replace(/\\/g, "/").replace(/\/$/, "");
  if (fp === js || fp.startsWith(`${js}/`)) return fp;
  if (!fp.toLowerCase().endsWith(".json")) return fp;
  return `${js}/${fp}`;
}

/**
 * Express app: workspace A (cache) + B (strings.json) + C (glossary CSV).
 */
export function createTranslationEditorApp(
  cache: TranslationCache,
  opts: TranslationEditorOptions
): express.Application {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // --- Workspace A: document segment cache ---
  app.get("/api/translations", (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 50));
      const offset = (page - 1) * pageSize;

      const { rows, total } = cache.listTranslations({
        filename: req.query.filename as string | undefined,
        locale: req.query.locale as string | undefined,
        model: req.query.model as string | undefined,
        source_hash: req.query.source_hash as string | undefined,
        source_text: req.query.source_text as string | undefined,
        translated_text: req.query.translated_text as string | undefined,
        last_hit_at_null: req.query.last_hit_at_null === "true",
        last_hit_at_not_null: req.query.last_hit_at_not_null === "true",
        limit: pageSize,
        offset,
      });

      res.json({ rows, total, page, pageSize });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.patch("/api/translations", (req, res) => {
    try {
      const { source_hash, locale, translated_text } = req.body as Record<string, unknown>;
      if (!source_hash || !locale || translated_text === undefined) {
        res.status(400).json({ error: "Missing source_hash, locale, or translated_text" });
        return;
      }
      cache.updateTranslation(String(source_hash), String(locale), String(translated_text));
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete("/api/translations/:sourceHash/:locale", (req, res) => {
    try {
      const sourceHash = decodeURIComponent(req.params.sourceHash);
      const locale = decodeURIComponent(req.params.locale);
      cache.deleteTranslation(sourceHash, locale);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete("/api/translations/by-filters", (req, res) => {
    try {
      const filters = {
        filename: req.query.filename as string | undefined,
        locale: req.query.locale as string | undefined,
        model: req.query.model as string | undefined,
        source_hash: req.query.source_hash as string | undefined,
        source_text: req.query.source_text as string | undefined,
        translated_text: req.query.translated_text as string | undefined,
        last_hit_at_null: req.query.last_hit_at_null === "true",
        last_hit_at_not_null: req.query.last_hit_at_not_null === "true",
      };
      const deleted = cache.deleteByFilters(filters);
      res.json({ ok: true, deleted });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete("/api/translations/by-filepath", (req, res) => {
    try {
      const filepath = req.query.filepath as string;
      if (!filepath) {
        res.status(400).json({ error: "Missing filepath query parameter" });
        return;
      }
      const deleted = cache.deleteTranslationsByFilepath(filepath);
      res.json({ ok: true, deleted });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/locales", (_req, res) => {
    try {
      res.json({ locales: cache.getUniqueLocales(), sourceLocale: opts.sourceLocale });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/models", (_req, res) => {
    try {
      res.json({ models: cache.getUniqueModels() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/filepaths", (_req, res) => {
    try {
      res.json({ filepaths: cache.getUniqueFilepaths() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/log-links", (req, res) => {
    try {
      const { filepath, start_line, locale } = req.body as Record<string, unknown>;
      if (!filepath || !locale) {
        res.status(400).json({ error: "Missing filepath or locale" });
        return;
      }
      const resolved = resolveSegmentLogFilepath(String(filepath), opts.jsonSource);
      const lineSuffix = start_line != null ? `:${start_line}` : ":1";
      console.log(`[editor] link: ` + chalk.cyan(`${resolved}${lineSuffix}`));
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/ui-log-links", (req, res) => {
    try {
      const body = req.body as {
        locations?: Array<{ filepath?: string; file?: string; line?: number }>;
        locale?: string;
      };
      const locs = body.locations ?? [];
      for (const loc of locs) {
        const filepath = loc.filepath ?? loc.file;
        if (!filepath) continue;
        const line = loc.line != null ? loc.line : 1;
        console.log(`[editor] link:  ` + chalk.cyan(`${String(filepath)}:${line}`));
      }
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  // --- Workspace B: strings.json ---
  const stringsPath = opts.stringsJsonPath
    ? path.isAbsolute(opts.stringsJsonPath)
      ? opts.stringsJsonPath
      : path.join(opts.cwd, opts.stringsJsonPath)
    : null;

  const uiPluralLocaleList = [...new Set([opts.sourceLocale, ...opts.targetLocales])];
  const requiredPluralFormsByLocale = Object.fromEntries(
    uiPluralLocaleList.map((loc) => [loc, pluralFormsRequiredForTranslateUi(loc)])
  );

  app.get("/api/ui-strings/meta", (_req, res) => {
    res.json({
      path: stringsPath,
      targetLocales: opts.targetLocales,
      available: Boolean(stringsPath && fs.existsSync(stringsPath)),
      sourceLocale: opts.sourceLocale,
      pluralLocales: uiPluralLocaleList,
      requiredPluralFormsByLocale,
    });
  });

  app.get("/api/ui-strings", (_req, res) => {
    try {
      if (!stringsPath || !fs.existsSync(stringsPath)) {
        res.status(404).json({ error: "strings.json not configured or missing" });
        return;
      }
      const doc = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as Record<
        string,
        Record<string, unknown>
      >;
      const entries = Object.entries(doc).map(([id, row]) => {
        const translatedRaw = (row.translated as Record<string, unknown> | undefined) ?? {};
        const base = {
          id,
          source: String(row.source ?? ""),
          translated: translatedRaw,
          models: (row.models as Record<string, string> | undefined) ?? {},
          locations: (row.locations as Array<{ file: string; line: number }> | undefined) ?? [],
        };
        if (isPluralStringsEntry(row)) {
          const locKeys = pluralLocaleUnion(translatedRaw, opts.sourceLocale, opts.targetLocales);
          const completenessByLocale: Record<string, boolean> = {};
          const requiredFormsByLocale: Record<string, CldrPluralForm[]> = {};
          for (const loc of locKeys) {
            completenessByLocale[loc] = pluralTranslatedLocaleHasContent(
              translatedRaw[loc] as Record<string, unknown> | undefined,
              loc
            );
            requiredFormsByLocale[loc] = pluralFormsRequiredForTranslateUi(loc);
          }
          return {
            ...base,
            translated: omitEmptyPluralFormStrings(translatedRaw),
            plural: true,
            ...(typeof row.zeroDigit === "boolean" ? { zeroDigit: row.zeroDigit } : {}),
            completenessByLocale,
            requiredFormsByLocale,
          };
        }
        return base;
      });
      res.json({ entries });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.patch("/api/ui-strings/:id", (req, res) => {
    try {
      if (!stringsPath || !fs.existsSync(stringsPath)) {
        res.status(404).json({ error: "strings.json not available" });
        return;
      }
      const id = decodeURIComponent(req.params.id);
      const bodyRaw = req.body as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(bodyRaw, "zeroDigit")) {
        res.status(400).json({ error: "zeroDigit is read-only" });
        return;
      }
      const body = bodyRaw as { source?: string; translated?: Record<string, unknown> };
      const doc = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as Record<
        string,
        Record<string, unknown>
      >;
      const prev = doc[id];
      if (!prev) {
        res.status(404).json({ error: "Unknown id" });
        return;
      }
      let nextTranslated: Record<string, unknown>;
      try {
        nextTranslated = mergeUiStringsTranslated(
          prev,
          (prev.translated as Record<string, unknown> | undefined) ?? {},
          body.translated
        );
      } catch (e) {
        res.status(400).json({ error: String(e) });
        return;
      }
      const nextModels: Record<string, string> =
        prev.models && typeof prev.models === "object"
          ? { ...(prev.models as Record<string, string>) }
          : {};
      if (body.translated !== undefined) {
        for (const loc of Object.keys(body.translated)) {
          nextModels[loc] = USER_EDITED_MODEL;
        }
      }
      doc[id] = serializeStringsJsonRow(prev, {
        source: body.source !== undefined ? String(body.source) : String(prev.source ?? ""),
        translated: nextTranslated,
        models: nextModels,
      });
      writeAtomicUtf8(stringsPath, `${JSON.stringify(doc, null, 2)}\n`);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete("/api/ui-strings/:id", (req, res) => {
    try {
      if (!stringsPath || !fs.existsSync(stringsPath)) {
        res.status(404).json({ error: "strings.json not available" });
        return;
      }
      const id = decodeURIComponent(req.params.id);
      const body = req.body as { locale?: string };
      const locale = body.locale;
      if (!locale || typeof locale !== "string") {
        res.status(400).json({ error: "Missing locale" });
        return;
      }
      const doc = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as Record<
        string,
        Record<string, unknown>
      >;
      const prev = doc[id];
      if (!prev) {
        res.status(404).json({ error: "Unknown id" });
        return;
      }
      const tr = (prev.translated as Record<string, unknown> | undefined) ?? {};
      if (!Object.prototype.hasOwnProperty.call(tr, locale)) {
        res.status(404).json({ error: "No translation for this locale" });
        return;
      }
      const nextTr = { ...tr };
      delete nextTr[locale];
      const nextModels: Record<string, string> =
        prev.models && typeof prev.models === "object"
          ? { ...(prev.models as Record<string, string>) }
          : {};
      delete nextModels[locale];
      doc[id] = serializeStringsJsonRow(prev, {
        source: String(prev.source ?? ""),
        translated: nextTr,
        models: nextModels,
      });
      writeAtomicUtf8(stringsPath, `${JSON.stringify(doc, null, 2)}\n`);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/ui-strings/delete-rows", (req, res) => {
    try {
      if (!stringsPath || !fs.existsSync(stringsPath)) {
        res.status(404).json({ error: "strings.json not available" });
        return;
      }
      const body = req.body as { rows?: Array<{ id?: string; locale?: string }> };
      const rows = body.rows;
      if (!Array.isArray(rows) || rows.length === 0) {
        res.status(400).json({ error: "Missing or empty rows" });
        return;
      }
      const doc = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as Record<
        string,
        Record<string, unknown>
      >;
      let deleted = 0;
      const seen = new Set<string>();
      for (const r of rows) {
        const rowId = r.id != null ? String(r.id) : "";
        const loc = r.locale != null ? String(r.locale) : "";
        if (!rowId || !loc) continue;
        const key = `${rowId}\0${loc}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const prev = doc[rowId];
        const tr = (prev?.translated as Record<string, unknown> | undefined) ?? {};
        if (!prev || !Object.prototype.hasOwnProperty.call(tr, loc)) continue;
        const nextTr = { ...tr };
        delete nextTr[loc];
        const nextModels: Record<string, string> =
          prev.models && typeof prev.models === "object"
            ? { ...(prev.models as Record<string, string>) }
            : {};
        delete nextModels[loc];
        doc[rowId] = serializeStringsJsonRow(prev, {
          source: String(prev.source ?? ""),
          translated: nextTr,
          models: nextModels,
        });
        deleted++;
      }
      writeAtomicUtf8(stringsPath, `${JSON.stringify(doc, null, 2)}\n`);
      res.json({ ok: true, deleted });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  // --- Workspace C: glossary-user.csv ---
  const glossaryPath = opts.glossaryUserPath
    ? path.isAbsolute(opts.glossaryUserPath)
      ? opts.glossaryUserPath
      : path.join(opts.cwd, opts.glossaryUserPath)
    : null;

  app.get("/api/glossary-user/meta", (_req, res) => {
    res.json({
      path: glossaryPath,
      headers: [...GLOSSARY_USER_HEADERS],
      available: Boolean(glossaryPath),
      targetLocales: opts.targetLocales,
      sourceLocale: opts.sourceLocale,
    });
  });

  app.get("/api/glossary-user", (_req, res) => {
    try {
      if (!glossaryPath || !fs.existsSync(glossaryPath)) {
        res.json({ headers: [...GLOSSARY_USER_HEADERS], rows: [] });
        return;
      }
      const raw = fs.readFileSync(glossaryPath, "utf8");
      const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as Record<
        string,
        string
      >[];
      const rows = records.map((r, rowIndex) => ({
        rowIndex,
        "Original language string": r["Original language string"] ?? r["en"] ?? "",
        locale: r["locale"] ?? "",
        Translation: r["Translation"] ?? r["translation"] ?? "",
        force: r["Force"] ?? r["force"] ?? "",
      }));
      res.json({
        headers: [...GLOSSARY_USER_HEADERS],
        rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/glossary-user", (req, res) => {
    try {
      if (!glossaryPath) {
        res.status(400).json({ error: "glossary user path not configured" });
        return;
      }
      const { original, locale, translation, force } = req.body as Record<string, string>;
      if (!original?.trim() || !locale?.trim() || translation === undefined) {
        res.status(400).json({ error: "Missing original, locale, or translation" });
        return;
      }
      const headers = [...GLOSSARY_USER_HEADERS];
      let rows: string[][] = [];
      if (fs.existsSync(glossaryPath)) {
        const raw = fs.readFileSync(glossaryPath, "utf8");
        const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as Record<
          string,
          string
        >[];
        rows = records.map((r) => [
          r["Original language string"] ?? r["en"] ?? "",
          r["locale"] ?? "",
          r["Translation"] ?? r["translation"] ?? "",
          r["Force"] ?? r["force"] ?? "",
        ]);
      }
      rows.push([original.trim(), locale.trim(), String(translation), force?.trim() ?? ""]);
      writeAtomicUtf8(glossaryPath, serializeGlossaryCsv(headers, rows));
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  function readGlossaryRows(): string[][] {
    if (!glossaryPath || !fs.existsSync(glossaryPath)) {
      return [];
    }
    const raw = fs.readFileSync(glossaryPath, "utf8");
    const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as Record<
      string,
      string
    >[];
    return records.map((r) => [
      r["Original language string"] ?? r["en"] ?? "",
      r["locale"] ?? "",
      r["Translation"] ?? r["translation"] ?? "",
      r["Force"] ?? r["force"] ?? "",
    ]);
  }

  app.patch("/api/glossary-user/:index", (req, res) => {
    try {
      if (!glossaryPath) {
        res.status(400).json({ error: "glossary user path not configured" });
        return;
      }
      const index = parseInt(req.params.index, 10);
      if (Number.isNaN(index) || index < 0) {
        res.status(400).json({ error: "Invalid row index" });
        return;
      }
      const { original, locale, translation, force } = req.body as Record<string, string>;
      if (original === undefined || locale === undefined || translation === undefined) {
        res.status(400).json({ error: "Missing original, locale, or translation" });
        return;
      }
      const headers = [...GLOSSARY_USER_HEADERS];
      const rows = readGlossaryRows();
      if (index >= rows.length) {
        res.status(404).json({ error: "Row index out of range" });
        return;
      }
      const prev = rows[index]!;
      rows[index] = [
        String(original).trim(),
        String(locale).trim(),
        String(translation),
        force !== undefined ? String(force).trim() : (prev[3] ?? ""),
      ];
      writeAtomicUtf8(glossaryPath, serializeGlossaryCsv(headers, rows));
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete("/api/glossary-user/:index", (req, res) => {
    try {
      if (!glossaryPath) {
        res.status(400).json({ error: "glossary user path not configured" });
        return;
      }
      const index = parseInt(req.params.index, 10);
      if (Number.isNaN(index) || index < 0) {
        res.status(400).json({ error: "Invalid row index" });
        return;
      }
      const headers = [...GLOSSARY_USER_HEADERS];
      const rows = readGlossaryRows();
      if (index >= rows.length) {
        res.status(404).json({ error: "Row index out of range" });
        return;
      }
      rows.splice(index, 1);
      writeAtomicUtf8(glossaryPath, serializeGlossaryCsv(headers, rows));
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/stats", (_req, res) => {
    try {
      const {
        cache: cacheStats,
        uiStrings,
        glossary,
      } = computeProjectStats({
        cache,
        stringsPath,
        glossaryPath,
        sourceLocale: opts.sourceLocale,
        targetLocales: opts.targetLocales,
      });
      res.json({ cache: cacheStats, uiStrings, glossary });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

export function resolveEditCacheStaticDir(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "edit-cache-app");
}
