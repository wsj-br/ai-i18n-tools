import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { parse } from "csv-parse/sync";
import { TranslationCache } from "../core/cache.js";
import { USER_EDITED_MODEL } from "../core/user-edited-model.js";
import { writeAtomicUtf8 } from "../cli/helpers.js";

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

  app.get("/api/ui-strings/meta", (_req, res) => {
    res.json({
      path: stringsPath,
      targetLocales: opts.targetLocales,
      available: Boolean(stringsPath && fs.existsSync(stringsPath)),
      sourceLocale: opts.sourceLocale,
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
        {
          source?: string;
          translated?: Record<string, string>;
          models?: Record<string, string>;
          locations?: Array<{ file: string; line: number }>;
        }
      >;
      const entries = Object.entries(doc).map(([id, v]) => ({
        id,
        source: v.source ?? "",
        translated: v.translated ?? {},
        models: v.models ?? {},
        locations: v.locations ?? [],
      }));
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
      const body = req.body as { source?: string; translated?: Record<string, string> };
      const doc = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as Record<
        string,
        {
          source: string;
          translated: Record<string, string>;
          models?: Record<string, string>;
          locations?: Array<{ file: string; line: number }>;
        }
      >;
      const prev = doc[id];
      if (!prev) {
        res.status(404).json({ error: "Unknown id" });
        return;
      }
      const nextTranslated =
        body.translated !== undefined
          ? { ...prev.translated, ...body.translated }
          : prev.translated;
      const nextModels: Record<string, string> =
        prev.models && typeof prev.models === "object" ? { ...prev.models } : {};
      if (body.translated !== undefined) {
        for (const loc of Object.keys(body.translated)) {
          nextModels[loc] = USER_EDITED_MODEL;
        }
      }
      doc[id] = {
        source: body.source !== undefined ? body.source : prev.source,
        translated: nextTranslated,
        ...(prev.locations && prev.locations.length > 0 ? { locations: prev.locations } : {}),
        ...(Object.keys(nextModels).length > 0 ? { models: nextModels } : {}),
      };
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
        {
          source: string;
          translated: Record<string, string>;
          models?: Record<string, string>;
          locations?: Array<{ file: string; line: number }>;
        }
      >;
      const prev = doc[id];
      if (!prev) {
        res.status(404).json({ error: "Unknown id" });
        return;
      }
      const tr = prev.translated || {};
      if (!Object.prototype.hasOwnProperty.call(tr, locale)) {
        res.status(404).json({ error: "No translation for this locale" });
        return;
      }
      const nextTr = { ...tr };
      delete nextTr[locale];
      const nextModels: Record<string, string> =
        prev.models && typeof prev.models === "object" ? { ...prev.models } : {};
      delete nextModels[locale];
      doc[id] = {
        source: prev.source,
        translated: nextTr,
        ...(prev.locations && prev.locations.length > 0 ? { locations: prev.locations } : {}),
        ...(Object.keys(nextModels).length > 0 ? { models: nextModels } : {}),
      };
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
        {
          source: string;
          translated: Record<string, string>;
          models?: Record<string, string>;
          locations?: Array<{ file: string; line: number }>;
        }
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
        const tr = prev?.translated || {};
        if (!prev || !Object.prototype.hasOwnProperty.call(tr, loc)) continue;
        const nextTr = { ...tr };
        delete nextTr[loc];
        const nextModels: Record<string, string> =
          prev.models && typeof prev.models === "object" ? { ...prev.models } : {};
        delete nextModels[loc];
        doc[rowId] = {
          source: prev.source,
          translated: nextTr,
          ...(prev.locations && prev.locations.length > 0 ? { locations: prev.locations } : {}),
          ...(Object.keys(nextModels).length > 0 ? { models: nextModels } : {}),
        };
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
      headers: ["Original language string", "locale", "Translation"],
      available: Boolean(glossaryPath),
      targetLocales: opts.targetLocales,
      sourceLocale: opts.sourceLocale,
    });
  });

  app.get("/api/glossary-user", (_req, res) => {
    try {
      if (!glossaryPath || !fs.existsSync(glossaryPath)) {
        res.json({ headers: ["Original language string", "locale", "Translation"], rows: [] });
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
      }));
      res.json({
        headers: ["Original language string", "locale", "Translation"],
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
      const { original, locale, translation } = req.body as Record<string, string>;
      if (!original?.trim() || !locale?.trim() || translation === undefined) {
        res.status(400).json({ error: "Missing original, locale, or translation" });
        return;
      }
      const headers = ["Original language string", "locale", "Translation"];
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
        ]);
      }
      rows.push([original.trim(), locale.trim(), String(translation)]);
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
      const { original, locale, translation } = req.body as Record<string, string>;
      if (original === undefined || locale === undefined || translation === undefined) {
        res.status(400).json({ error: "Missing original, locale, or translation" });
        return;
      }
      const headers = ["Original language string", "locale", "Translation"];
      const rows = readGlossaryRows();
      if (index >= rows.length) {
        res.status(404).json({ error: "Row index out of range" });
        return;
      }
      rows[index] = [String(original).trim(), String(locale).trim(), String(translation)];
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
      const headers = ["Original language string", "locale", "Translation"];
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
      const cacheStats = cache.getDetailedStats();

      let uiStrings: {
        available: boolean;
        totalEntries: number;
        byLocale: { locale: string; translated: number; missing: number }[];
        byModel: { model: string; count: number }[];
        byModelLocale: { model: string; locale: string; count: number }[];
      };
      if (stringsPath && fs.existsSync(stringsPath)) {
        const doc = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as Record<
          string,
          { translated?: Record<string, string>; models?: Record<string, string> }
        >;
        const totalEntries = Object.keys(doc).length;
        const byLocale = opts.targetLocales.map((locale) => {
          let translated = 0;
          for (const v of Object.values(doc)) {
            const tr = v.translated?.[locale];
            if (tr != null && String(tr).trim() !== "") translated++;
          }
          return { locale, translated, missing: totalEntries - translated };
        });
        
        const modelCounts = new Map<string, number>();
        const modelLocaleCounts = new Map<string, number>();
        for (const v of Object.values(doc)) {
          if (v.models) {
            for (const [locale, model] of Object.entries(v.models)) {
              const m = model?.trim() ? model.trim() : "(unknown)";
              modelCounts.set(m, (modelCounts.get(m) ?? 0) + 1);
              const mlKey = `${m}\0${locale}`;
              modelLocaleCounts.set(mlKey, (modelLocaleCounts.get(mlKey) ?? 0) + 1);
            }
          }
        }
        const byModel = [...modelCounts.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([model, count]) => ({ model, count }));

        const byModelLocale = [...modelLocaleCounts.entries()].map(([key, count]) => {
          const [model, locale] = key.split("\0");
          return { model, locale, count };
        });

        uiStrings = { available: true, totalEntries, byLocale, byModel, byModelLocale };
      } else {
        uiStrings = { available: false, totalEntries: 0, byLocale: [], byModel: [], byModelLocale: [] };
      }

      let glossary: {
        available: boolean;
        totalTerms: number;
        byLocale: { locale: string; count: number }[];
      };
      if (glossaryPath && fs.existsSync(glossaryPath)) {
        const rows = readGlossaryRows();
        const byLoc = new Map<string, number>();
        for (const row of rows) {
          const loc = row[1]?.trim() ? row[1].trim() : "(unknown)";
          byLoc.set(loc, (byLoc.get(loc) ?? 0) + 1);
        }
        const byLocale = [...byLoc.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([locale, count]) => ({ locale, count }));
        glossary = { available: true, totalTerms: rows.length, byLocale };
      } else {
        glossary = { available: false, totalTerms: 0, byLocale: [] };
      }

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
