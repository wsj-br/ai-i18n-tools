import express from "express";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { TranslationCache } from "../core/cache.js";
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
  targetLocales: string[];
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
      const deleted = cache.deleteByFilepath(filepath);
      res.json({ ok: true, deleted });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/locales", (_req, res) => {
    try {
      res.json({ locales: cache.getUniqueLocales() });
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
      const lineSuffix = start_line != null ? `:${start_line}` : ":1";
      console.log(`[edit] ${String(filepath)}${lineSuffix} (${String(locale)})`);
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
        { source?: string; translated?: Record<string, string> }
      >;
      const entries = Object.entries(doc).map(([id, v]) => ({
        id,
        source: v.source ?? "",
        translated: v.translated ?? {},
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
        { source: string; translated: Record<string, string> }
      >;
      const prev = doc[id];
      if (!prev) {
        res.status(404).json({ error: "Unknown id" });
        return;
      }
      doc[id] = {
        source: body.source !== undefined ? body.source : prev.source,
        translated:
          body.translated !== undefined
            ? { ...prev.translated, ...body.translated }
            : prev.translated,
      };
      writeAtomicUtf8(stringsPath, `${JSON.stringify(doc, null, 2)}\n`);
      res.json({ ok: true });
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
      res.json({
        headers: ["Original language string", "locale", "Translation"],
        rows: records,
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

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

export function resolveEditCacheStaticDir(): string {
  return path.join(__dirname, "..", "..", "edit-cache-app");
}
