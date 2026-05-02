import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
import type * as Sqlite from "node:sqlite";
import { CacheError } from "./errors.js";
import { USER_EDITED_MODEL } from "./user-edited-model.js";
import type {
  CacheEntry,
  CleanupStats,
  FileTracking,
  TranslationFailureInsert,
  TranslationFailureListRow,
  TranslationFailureSummary,
  TranslationRow,
} from "./types.js";
import { computeSegmentHash } from "../utils/hash.js";
import { resolveCacheTrackingKeyToAbs } from "./cache-tracking-keys.js";

const SCHEMA_VERSION = 3;
const require = createRequire(import.meta.url);

type SqliteModule = typeof Sqlite;

let sqliteModule: SqliteModule | null = null;

function loadSqlite(): SqliteModule {
  // Delay node:sqlite evaluation until runtime so the CLI can install its
  // warning filter before Node emits the module's ExperimentalWarning.
  sqliteModule ??= require("node:sqlite") as SqliteModule;
  return sqliteModule;
}

/**
 * SQLite translation cache. `better-sqlite3` uses a single native connection per instance
 * (no JS-level pool); reuse one instance per process for best throughput.
 */
export class TranslationCache {
  private db: Sqlite.DatabaseSync;
  private readonly dbFilePath: string | null;

  constructor(cachePath: string) {
    const { DatabaseSync } = loadSqlite();

    if (cachePath === ":memory:") {
      this.dbFilePath = null;
      this.db = new DatabaseSync(":memory:");
      this.applyMigrations();
      return;
    }

    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(cachePath, { recursive: true });
    }

    this.dbFilePath = path.join(cachePath, "cache.db");
    this.db = new DatabaseSync(this.dbFilePath);
    this.applyMigrations();
  }

  private applyMigrations(): void {
    const current = (this.db.prepare("PRAGMA user_version").get() as { user_version: number })
      .user_version;
    if (current < 1) {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS translations (
          source_hash TEXT NOT NULL,
          locale TEXT NOT NULL,
          source_text TEXT NOT NULL,
          translated_text TEXT NOT NULL,
          model TEXT,
          filepath TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          last_hit_at TEXT,
          start_line INTEGER,
          PRIMARY KEY (source_hash, locale)
        );

        CREATE TABLE IF NOT EXISTS file_tracking (
          filepath TEXT NOT NULL,
          locale TEXT NOT NULL,
          source_hash TEXT NOT NULL,
          last_translated TEXT DEFAULT (datetime('now')),
          PRIMARY KEY (filepath, locale)
        );

        CREATE INDEX IF NOT EXISTS idx_translations_locale
          ON translations(locale);

        CREATE INDEX IF NOT EXISTS idx_translations_filepath
          ON translations(filepath);
      `);
      this.db.exec("PRAGMA user_version = 1");
    }
    if (current < 2) {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS translation_failures (
          source_hash TEXT NOT NULL,
          locale TEXT NOT NULL,
          model TEXT,
          model_order INTEGER,
          quality_error TEXT NOT NULL,
          error_message TEXT NOT NULL,
          fatal INTEGER NOT NULL DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_translation_failures_source_locale
          ON translation_failures(source_hash, locale);

        CREATE INDEX IF NOT EXISTS idx_translation_failures_locale
          ON translation_failures(locale);

        CREATE INDEX IF NOT EXISTS idx_translation_failures_model
          ON translation_failures(model);

        CREATE INDEX IF NOT EXISTS idx_translation_failures_quality_error
          ON translation_failures(quality_error);

        CREATE INDEX IF NOT EXISTS idx_translation_failures_fatal
          ON translation_failures(fatal);
      `);
      this.db.exec("PRAGMA user_version = 2");
    }
    if (current < 3) {
      this.db.exec(`
        ALTER TABLE translation_failures ADD COLUMN filepath TEXT;
        ALTER TABLE translation_failures ADD COLUMN source_text TEXT;
      `);
      this.db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    }
  }

  /** Segment hash (normalized whitespace, SHA-256, 16 hex chars). */
  static computeHash(content: string): string {
    return computeSegmentHash(content);
  }

  /**
   * Cached segment text and model id (as stored on last successful translation).
   * Updates `last_hit_at` / optional filepath tracking like {@link getSegment}.
   */
  getSegmentDetails(
    sourceHash: string,
    locale: string,
    filepath?: string,
    startLine?: number
  ): { text: string; model: string | null } | null {
    const selectStmt = this.db.prepare(`
      SELECT translated_text, model FROM translations
      WHERE source_hash = ? AND locale = ?
    `);
    const row = selectStmt.get(sourceHash, locale) as
      | { translated_text: string; model: string | null }
      | undefined;
    if (!row) {
      return null;
    }
    const updates: string[] = ["last_hit_at = datetime('now')"];
    const params: (string | number)[] = [];

    if (filepath) {
      updates.push(
        "filepath = CASE WHEN (filepath IS NULL OR filepath = '') THEN ? ELSE filepath END"
      );
      params.push(filepath);
    }
    if (startLine !== undefined && startLine !== null) {
      updates.push("start_line = COALESCE(?, start_line)");
      params.push(startLine);
    }

    params.push(sourceHash, locale);
    this.db
      .prepare(`UPDATE translations SET ${updates.join(", ")} WHERE source_hash = ? AND locale = ?`)
      .run(...params);

    return { text: row.translated_text, model: row.model };
  }

  getSegment(
    sourceHash: string,
    locale: string,
    filepath?: string,
    startLine?: number
  ): string | null {
    return this.getSegmentDetails(sourceHash, locale, filepath, startLine)?.text ?? null;
  }

  setSegment(
    sourceHash: string,
    locale: string,
    sourceText: string,
    translatedText: string,
    model: string,
    filepath?: string,
    startLine?: number | null
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO translations (source_hash, locale, source_text, translated_text, model, filepath, created_at, last_hit_at, start_line)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?)
      ON CONFLICT(source_hash, locale) DO UPDATE SET
        source_text = excluded.source_text,
        translated_text = excluded.translated_text,
        model = excluded.model,
        filepath = excluded.filepath,
        last_hit_at = datetime('now'),
        start_line = COALESCE(excluded.start_line, translations.start_line)
    `);
    stmt.run(
      sourceHash,
      locale,
      sourceText,
      translatedText,
      model,
      filepath ?? null,
      startLine ?? null
    );
  }

  getFileHash(filepath: string, locale: string): string | null {
    const stmt = this.db.prepare(`
      SELECT source_hash FROM file_tracking
      WHERE filepath = ? AND locale = ?
    `);
    const row = stmt.get(filepath, locale) as { source_hash: string } | undefined;
    return row?.source_hash ?? null;
  }

  setFileStatus(filepath: string, locale: string, sourceHash: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO file_tracking
      (filepath, locale, source_hash)
      VALUES (?, ?, ?)
    `);
    stmt.run(filepath, locale, sourceHash);
  }

  /**
   * Remove file-tracking for one path/locale so the next run does not skip the file.
   * Segment rows stay keyed by `(source_hash, locale)`; `--force` bypasses segment cache reads so rows refresh on re-translate.
   */
  clearFile(filepath: string, locale: string): void {
    this.db
      .prepare("DELETE FROM file_tracking WHERE filepath = ? AND locale = ?")
      .run(filepath, locale);
  }

  getStats(): { totalSegments: number; totalFiles: number; byLocale: Record<string, number> } {
    const segments = this.db.prepare("SELECT COUNT(*) as count FROM translations").get() as {
      count: number;
    };
    const files = this.db.prepare("SELECT COUNT(*) as count FROM file_tracking").get() as {
      count: number;
    };

    const byLocale: Record<string, number> = {};
    const localeStats = this.db
      .prepare("SELECT locale, COUNT(*) as count FROM translations GROUP BY locale")
      .all() as { locale: string; count: number }[];

    for (const row of localeStats) {
      byLocale[row.locale] = row.count;
    }

    return {
      totalSegments: segments.count,
      totalFiles: files.count,
      byLocale,
    };
  }

  /**
   * Aggregate documentation-cache stats for dashboards (stale vs active, per locale/model).
   */
  getDetailedStats(): {
    totalSegments: number;
    totalFiles: number;
    staleSegments: number;
    activeSegments: number;
    byLocale: { locale: string; total: number; stale: number; active: number }[];
    byModel: { model: string; count: number }[];
    byModelLocale: { model: string; locale: string; count: number }[];
    uniqueFilepaths: number;
  } {
    const totalSegments = (
      this.db.prepare("SELECT COUNT(*) as count FROM translations").get() as { count: number }
    ).count;
    const totalFiles = (
      this.db.prepare("SELECT COUNT(*) as count FROM file_tracking").get() as { count: number }
    ).count;
    const staleSegments = (
      this.db
        .prepare("SELECT COUNT(*) as count FROM translations WHERE last_hit_at IS NULL")
        .get() as { count: number }
    ).count;
    const activeSegments = (
      this.db
        .prepare("SELECT COUNT(*) as count FROM translations WHERE last_hit_at IS NOT NULL")
        .get() as { count: number }
    ).count;
    const uniqueFilepaths = (
      this.db
        .prepare(
          "SELECT COUNT(DISTINCT filepath) as count FROM translations WHERE filepath IS NOT NULL AND TRIM(filepath) != ''"
        )
        .get() as { count: number }
    ).count;

    const localeRows = this.db
      .prepare(
        `SELECT locale,
          COUNT(*) as total,
          SUM(CASE WHEN last_hit_at IS NULL THEN 1 ELSE 0 END) as stale,
          SUM(CASE WHEN last_hit_at IS NOT NULL THEN 1 ELSE 0 END) as active
        FROM translations
        GROUP BY locale
        ORDER BY locale`
      )
      .all() as { locale: string; total: number; stale: number; active: number }[];

    const modelRows = this.db
      .prepare(
        `SELECT COALESCE(NULLIF(TRIM(model), ''), '(unknown)') as model, COUNT(*) as count
        FROM translations
        GROUP BY COALESCE(NULLIF(TRIM(model), ''), '(unknown)')
        ORDER BY count DESC, model`
      )
      .all() as { model: string; count: number }[];

    const modelLocaleRows = this.db
      .prepare(
        `SELECT COALESCE(NULLIF(TRIM(model), ''), '(unknown)') as model, locale, COUNT(*) as count
        FROM translations
        GROUP BY COALESCE(NULLIF(TRIM(model), ''), '(unknown)'), locale
        ORDER BY model, locale`
      )
      .all() as { model: string; locale: string; count: number }[];

    return {
      totalSegments,
      totalFiles,
      staleSegments,
      activeSegments,
      byLocale: localeRows,
      byModel: modelRows,
      byModelLocale: modelLocaleRows,
      uniqueFilepaths,
    };
  }

  clear(locale?: string): void {
    if (locale) {
      this.db.prepare("DELETE FROM translations WHERE locale = ?").run(locale);
      this.db.prepare("DELETE FROM file_tracking WHERE locale = ?").run(locale);
      this.db.prepare("DELETE FROM translation_failures WHERE locale = ?").run(locale);
    } else {
      this.db.prepare("DELETE FROM translations").run();
      this.db.prepare("DELETE FROM file_tracking").run();
      this.db.prepare("DELETE FROM translation_failures").run();
    }
  }

  /**
   * Set `last_hit_at = NULL` for markdown segments that were not hit this run.
   * Scoped to markdown-like paths only so JSON (and other) rows are not cleared.
   * @param keysHit - entries as `sourceHash|locale`.
   */
  resetLastHitAtForUnhitMarkdown(hitKeys: Set<string>): number {
    return this.resetLastHitAtForUnhitScoped(
      hitKeys,
      `(filepath IS NULL OR LOWER(filepath) LIKE '%.md' OR LOWER(filepath) LIKE '%.mdx')`
    );
  }

  /**
   * Set `last_hit_at = NULL` for JSON UI/doc segments that were not hit this run.
   * @param keysHit - entries as `sourceHash|locale`.
   */
  resetLastHitAtForUnhitJson(hitKeys: Set<string>): number {
    return this.resetLastHitAtForUnhitScoped(
      hitKeys,
      `(filepath IS NOT NULL AND LOWER(filepath) LIKE '%.json')`
    );
  }

  private resetLastHitAtForUnhitScoped(hitKeys: Set<string>, filepathPredicateSql: string): number {
    if (hitKeys.size === 0) {
      return 0;
    }
    const keys = Array.from(hitKeys);
    const flatParams = keys.flatMap((k) => {
      const [h, l] = k.split("|");
      return [h, l];
    });
    this.db.exec("CREATE TEMP TABLE IF NOT EXISTS _hit_keys (source_hash TEXT, locale TEXT)");
    const insertPlaceholders = keys.map(() => "(?, ?)").join(", ");
    this.db.prepare(`INSERT INTO _hit_keys VALUES ${insertPlaceholders}`).run(...flatParams);
    const result = this.db
      .prepare(
        `UPDATE translations SET last_hit_at = NULL
       WHERE ${filepathPredicateSql}
       AND (source_hash, locale) NOT IN (SELECT source_hash, locale FROM _hit_keys)`
      )
      .run();
    this.db.exec("DROP TABLE IF EXISTS _hit_keys");
    return Number(result.changes);
  }

  /**
   * Like {@link resetLastHitAtForUnhitMarkdown}, but only rows whose `filepath` is in `allowedRelPaths`
   * (e.g. markdown files in scope for this translate run after path filters).
   */
  resetLastHitAtForUnhitMarkdownInScope(
    hitKeys: Set<string>,
    allowedRelPaths: readonly string[]
  ): number {
    if (hitKeys.size === 0 || allowedRelPaths.length === 0) {
      return 0;
    }
    const normalized = allowedRelPaths.map((p) => p.split("\\").join("/"));
    return this.resetLastHitAtForUnhitScopedWithScope(
      hitKeys,
      `(filepath IS NULL OR LOWER(filepath) LIKE '%.md' OR LOWER(filepath) LIKE '%.mdx')`,
      normalized
    );
  }

  /**
   * Like {@link resetLastHitAtForUnhitJson}, but only rows whose `filepath` is in `allowedRelPaths`.
   */
  resetLastHitAtForUnhitJsonInScope(
    hitKeys: Set<string>,
    allowedRelPaths: readonly string[]
  ): number {
    if (hitKeys.size === 0 || allowedRelPaths.length === 0) {
      return 0;
    }
    const normalized = allowedRelPaths.map((p) => p.split("\\").join("/"));
    return this.resetLastHitAtForUnhitScopedWithScope(
      hitKeys,
      `(filepath IS NOT NULL AND LOWER(filepath) LIKE '%.json')`,
      normalized
    );
  }

  private resetLastHitAtForUnhitScopedWithScope(
    hitKeys: Set<string>,
    filepathPredicateSql: string,
    allowedRelPaths: readonly string[]
  ): number {
    const keys = Array.from(hitKeys);
    const flatParams = keys.flatMap((k) => {
      const [h, l] = k.split("|");
      return [h, l];
    });
    this.db.exec("DROP TABLE IF EXISTS _hit_keys");
    this.db.exec("CREATE TEMP TABLE _hit_keys (source_hash TEXT, locale TEXT)");
    const insertPlaceholders = keys.map(() => "(?, ?)").join(", ");
    this.db.prepare(`INSERT INTO _hit_keys VALUES ${insertPlaceholders}`).run(...flatParams);

    this.db.exec("DROP TABLE IF EXISTS _scope_paths");
    this.db.exec("CREATE TEMP TABLE _scope_paths (filepath TEXT PRIMARY KEY)");
    const scopePlaceholders = allowedRelPaths.map(() => "(?)").join(", ");
    this.db.prepare(`INSERT INTO _scope_paths VALUES ${scopePlaceholders}`).run(...allowedRelPaths);

    const result = this.db
      .prepare(
        `UPDATE translations SET last_hit_at = NULL
       WHERE ${filepathPredicateSql}
       AND filepath IN (SELECT filepath FROM _scope_paths)
       AND (source_hash, locale) NOT IN (SELECT source_hash, locale FROM _hit_keys)`
      )
      .run();
    this.db.exec("DROP TABLE IF EXISTS _hit_keys");
    this.db.exec("DROP TABLE IF EXISTS _scope_paths");
    return Number(result.changes);
  }

  cleanupStaleTranslations(dryRun = false): {
    count: number;
    deletedRows: { source_hash: string; locale: string; filepath: string | null }[];
  } {
    const deletedRows = this.db
      .prepare(
        `SELECT source_hash, locale, filepath FROM translations
       WHERE last_hit_at IS NULL OR filepath IS NULL OR filepath = ''`
      )
      .all() as { source_hash: string; locale: string; filepath: string | null }[];

    if (!dryRun) {
      for (const row of deletedRows) {
        this.deleteFailuresByTranslationKey(row.source_hash, row.locale);
      }
      this.db
        .prepare(
          `DELETE FROM translations
         WHERE last_hit_at IS NULL OR filepath IS NULL OR filepath = ''`
        )
        .run();
    }

    return { count: deletedRows.length, deletedRows };
  }

  listTranslations(filters?: {
    filename?: string;
    locale?: string;
    model?: string;
    source_hash?: string;
    source_text?: string;
    translated_text?: string;
    last_hit_at_null?: boolean;
    /** When true, only rows with a non-null `last_hit_at` (active). Mutually exclusive with `last_hit_at_null` in normal use. */
    last_hit_at_not_null?: boolean;
    limit?: number;
    offset?: number;
  }): { rows: TranslationRow[]; total: number } {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.filename?.trim()) {
      conditions.push("LOWER(filepath) LIKE ?");
      params.push(`%${filters.filename.trim().toLowerCase()}%`);
    }
    if (filters?.locale?.trim()) {
      conditions.push("locale = ?");
      params.push(filters.locale.trim());
    }
    if (filters?.model?.trim()) {
      conditions.push("model = ?");
      params.push(filters.model.trim());
    }
    if (filters?.source_hash?.trim()) {
      conditions.push("LOWER(source_hash) LIKE ?");
      params.push(`%${filters.source_hash.trim().toLowerCase()}%`);
    }
    if (filters?.source_text?.trim()) {
      conditions.push("LOWER(source_text) LIKE ?");
      params.push(`%${filters.source_text.trim().toLowerCase()}%`);
    }
    if (filters?.translated_text?.trim()) {
      conditions.push("LOWER(translated_text) LIKE ?");
      params.push(`%${filters.translated_text.trim().toLowerCase()}%`);
    }
    if (filters?.last_hit_at_null === true) {
      conditions.push("last_hit_at IS NULL");
    }
    if (filters?.last_hit_at_not_null === true) {
      conditions.push("last_hit_at IS NOT NULL");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM translations ${whereClause}`);
    const total = (countStmt.get(...params) as { count: number }).count;

    const selectStmt = this.db.prepare(
      `SELECT source_hash, locale, source_text, translated_text, model, filepath, created_at, last_hit_at, start_line
       FROM translations ${whereClause}
       ORDER BY filepath, locale, CASE WHEN start_line IS NULL THEN 1 ELSE 0 END, start_line, source_hash
       LIMIT ? OFFSET ?`
    );
    const rows = selectStmt.all(...params, limit, offset) as unknown as TranslationRow[];

    return { rows, total };
  }

  updateTranslation(sourceHash: string, locale: string, translatedText: string): void {
    this.db
      .prepare(
        `UPDATE translations SET translated_text = ?, model = ? WHERE source_hash = ? AND locale = ?`
      )
      .run(translatedText, USER_EDITED_MODEL, sourceHash, locale);
  }

  deleteTranslation(sourceHash: string, locale: string): void {
    this.deleteFailuresByTranslationKey(sourceHash, locale);
    this.db
      .prepare("DELETE FROM translations WHERE source_hash = ? AND locale = ?")
      .run(sourceHash, locale);
    this.db
      .prepare("DELETE FROM file_tracking WHERE source_hash = ? AND locale = ?")
      .run(sourceHash, locale);
  }

  deleteByFilters(filters?: {
    filename?: string;
    locale?: string;
    model?: string;
    source_hash?: string;
    source_text?: string;
    translated_text?: string;
    last_hit_at_null?: boolean;
    last_hit_at_not_null?: boolean;
  }): number {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.filename?.trim()) {
      conditions.push("LOWER(filepath) LIKE ?");
      params.push(`%${filters.filename.trim().toLowerCase()}%`);
    }
    if (filters?.locale?.trim()) {
      conditions.push("locale = ?");
      params.push(filters.locale.trim());
    }
    if (filters?.model?.trim()) {
      conditions.push("model = ?");
      params.push(filters.model.trim());
    }
    if (filters?.source_hash?.trim()) {
      conditions.push("LOWER(source_hash) LIKE ?");
      params.push(`%${filters.source_hash.trim().toLowerCase()}%`);
    }
    if (filters?.source_text?.trim()) {
      conditions.push("LOWER(source_text) LIKE ?");
      params.push(`%${filters.source_text.trim().toLowerCase()}%`);
    }
    if (filters?.translated_text?.trim()) {
      conditions.push("LOWER(translated_text) LIKE ?");
      params.push(`%${filters.translated_text.trim().toLowerCase()}%`);
    }
    if (filters?.last_hit_at_null === true) {
      conditions.push("last_hit_at IS NULL");
    }
    if (filters?.last_hit_at_not_null === true) {
      conditions.push("last_hit_at IS NOT NULL");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    this.db
      .prepare(
        `DELETE FROM translation_failures
         WHERE (source_hash, locale) IN (
           SELECT source_hash, locale FROM translations ${whereClause}
         )`
      )
      .run(...params);

    this.db
      .prepare(
        `DELETE FROM file_tracking WHERE (source_hash, locale) IN (SELECT source_hash, locale FROM translations ${whereClause})`
      )
      .run(...params);

    const result = this.db.prepare(`DELETE FROM translations ${whereClause}`).run(...params);
    return Number(result.changes);
  }

  /** Deletes matching rows in `translations` only (see {@link deleteFileTrackingByPath} for tracking keys). */
  deleteTranslationsByFilepath(filepath: string): number {
    this.db
      .prepare(
        `DELETE FROM translation_failures
         WHERE (source_hash, locale) IN (
           SELECT source_hash, locale FROM translations WHERE filepath = ?
         )`
      )
      .run(filepath);
    const result = this.db.prepare("DELETE FROM translations WHERE filepath = ?").run(filepath);
    return Number(result.changes);
  }

  /** Deletes all `file_tracking` rows for this cache key (all locales). */
  deleteFileTrackingByPath(filepath: string): number {
    const result = this.db.prepare("DELETE FROM file_tracking WHERE filepath = ?").run(filepath);
    return Number(result.changes);
  }

  /** Distinct `filepath` values in `file_tracking` (cache keys: `doc-block:…`, `svg-assets:…`, etc.). */
  listFileTrackingPaths(): string[] {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT filepath FROM file_tracking WHERE filepath IS NOT NULL AND filepath != '' ORDER BY filepath`
      )
      .all() as { filepath: string }[];
    return rows.map((r) => r.filepath);
  }

  /**
   * Remove `file_tracking` rows whose resolved path does not exist on disk under `projectRoot`.
   */
  pruneOrphanedFileTrackingByDisk(projectRoot: string, dryRun: boolean): number {
    let removed = 0;
    for (const fp of this.listFileTrackingPaths()) {
      const abs = resolveCacheTrackingKeyToAbs(projectRoot, fp);
      if (!fs.existsSync(abs)) {
        if (!dryRun) {
          removed += this.deleteFileTrackingByPath(fp);
        } else {
          removed += 1;
        }
      }
    }
    return removed;
  }

  /**
   * @deprecated Prefer {@link deleteTranslationsByFilepath} / {@link deleteFileTrackingByPath} explicitly.
   * Deletes `translations` rows only (no longer deletes `file_tracking`).
   */
  deleteByFilepath(filepath: string): number {
    return this.deleteTranslationsByFilepath(filepath);
  }

  getUniqueLocales(): string[] {
    const rows = this.db
      .prepare(`SELECT DISTINCT locale FROM translations ORDER BY locale`)
      .all() as { locale: string }[];
    return rows.map((r) => r.locale);
  }

  getUniqueFilepaths(): string[] {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT filepath FROM translations WHERE filepath IS NOT NULL AND filepath != '' ORDER BY filepath`
      )
      .all() as { filepath: string }[];
    return rows.map((r) => r.filepath);
  }

  getUniqueModels(): string[] {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT model FROM translations WHERE model IS NOT NULL AND model != '' ORDER BY model`
      )
      .all() as { model: string }[];
    return rows.map((r) => r.model);
  }

  clearSegmentFailures(sourceHash: string, locale: string): void {
    this.db
      .prepare("DELETE FROM translation_failures WHERE source_hash = ? AND locale = ?")
      .run(sourceHash, locale);
  }

  addSegmentFailures(rows: TranslationFailureInsert[]): void {
    if (rows.length === 0) {
      return;
    }
    const stmt = this.db.prepare(
      `INSERT INTO translation_failures
       (source_hash, locale, model, model_order, quality_error, error_message, fatal, created_at, filepath, source_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`
    );
    for (const row of rows) {
      stmt.run(
        row.sourceHash,
        row.locale,
        row.model,
        row.modelOrder,
        row.qualityError,
        row.errorMessage,
        row.fatal ? 1 : 0,
        row.filepath ?? null,
        row.sourceText ?? null
      );
    }
  }

  deleteFailuresByTranslationKey(sourceHash: string, locale: string): void {
    this.clearSegmentFailures(sourceHash, locale);
  }

  listTranslationFailures(filters?: {
    filename?: string;
    locale?: string;
    model?: string;
    source_hash?: string;
    source_text?: string;
    quality_error?: string;
    error_message?: string;
    fatal?: boolean;
    sort?: "failures_desc" | "filepath_line_asc";
    limit?: number;
    offset?: number;
  }): { rows: TranslationFailureListRow[]; total: number } {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.filename?.trim()) {
      conditions.push("LOWER(COALESCE(t.filepath, f.filepath)) LIKE ?");
      params.push(`%${filters.filename.trim().toLowerCase()}%`);
    }
    if (filters?.locale?.trim()) {
      conditions.push("f.locale = ?");
      params.push(filters.locale.trim());
    }
    if (filters?.model?.trim()) {
      conditions.push("f.model = ?");
      params.push(filters.model.trim());
    }
    if (filters?.source_hash?.trim()) {
      conditions.push("LOWER(f.source_hash) LIKE ?");
      params.push(`%${filters.source_hash.trim().toLowerCase()}%`);
    }
    if (filters?.source_text?.trim()) {
      conditions.push("LOWER(COALESCE(t.source_text, f.source_text)) LIKE ?");
      params.push(`%${filters.source_text.trim().toLowerCase()}%`);
    }
    if (filters?.quality_error?.trim()) {
      conditions.push("f.quality_error = ?");
      params.push(filters.quality_error.trim());
    }
    if (filters?.error_message?.trim()) {
      conditions.push("LOWER(f.error_message) LIKE ?");
      params.push(`%${filters.error_message.trim().toLowerCase()}%`);
    }
    if (filters?.fatal === true) {
      conditions.push("f.fatal = 1");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const fromSql = `FROM translation_failures f
      LEFT JOIN translations t
        ON t.source_hash = f.source_hash AND t.locale = f.locale`;
    const groupedSql = `SELECT
        f.source_hash as source_hash,
        f.locale as locale,
        REPLACE(COALESCE(GROUP_CONCAT(DISTINCT f.model), ''), ',', CHAR(10)) as model,
        MAX(t.model) as translation_model,
        MAX(f.model_order) as model_order,
        REPLACE(COALESCE(GROUP_CONCAT(DISTINCT f.quality_error), ''), ',', CHAR(10)) as quality_error,
        COALESCE(GROUP_CONCAT(f.error_message, CHAR(10)), '') as error_message,
        MAX(f.fatal) as fatal,
        MAX(f.created_at) as created_at,
        MAX(COALESCE(t.source_text, f.source_text)) as source_text,
        MAX(COALESCE(t.filepath, f.filepath)) as filepath,
        MIN(t.start_line) as start_line
      ${fromSql}
      ${whereClause}
      GROUP BY f.source_hash, f.locale`;
    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM (${groupedSql}) grouped`);
    const total = (countStmt.get(...params) as { count: number }).count;

    const orderBy =
      filters?.sort === "filepath_line_asc"
        ? "ORDER BY COALESCE(filepath, ''), CASE WHEN start_line IS NULL THEN 1 ELSE 0 END, start_line"
        : "ORDER BY CASE WHEN model_order IS NULL THEN 1 ELSE 0 END, model_order DESC, COALESCE(filepath, ''), start_line";

    const selectStmt = this.db.prepare(
      `SELECT * FROM (${groupedSql}) grouped
       ${orderBy}
       LIMIT ? OFFSET ?`
    );

    const rows = selectStmt.all(...params, limit, offset) as unknown as TranslationFailureListRow[];
    return { rows, total };
  }

  getTranslationFailureSummary(filters?: {
    filename?: string;
    locale?: string;
    model?: string;
    source_hash?: string;
    source_text?: string;
    quality_error?: string;
    error_message?: string;
    fatal?: boolean;
  }): TranslationFailureSummary {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.filename?.trim()) {
      conditions.push("LOWER(COALESCE(t.filepath, f.filepath)) LIKE ?");
      params.push(`%${filters.filename.trim().toLowerCase()}%`);
    }
    if (filters?.locale?.trim()) {
      conditions.push("f.locale = ?");
      params.push(filters.locale.trim());
    }
    if (filters?.model?.trim()) {
      conditions.push("f.model = ?");
      params.push(filters.model.trim());
    }
    if (filters?.source_hash?.trim()) {
      conditions.push("LOWER(f.source_hash) LIKE ?");
      params.push(`%${filters.source_hash.trim().toLowerCase()}%`);
    }
    if (filters?.source_text?.trim()) {
      conditions.push("LOWER(COALESCE(t.source_text, f.source_text)) LIKE ?");
      params.push(`%${filters.source_text.trim().toLowerCase()}%`);
    }
    if (filters?.quality_error?.trim()) {
      conditions.push("f.quality_error = ?");
      params.push(filters.quality_error.trim());
    }
    if (filters?.error_message?.trim()) {
      conditions.push("LOWER(f.error_message) LIKE ?");
      params.push(`%${filters.error_message.trim().toLowerCase()}%`);
    }
    if (filters?.fatal === true) {
      conditions.push("f.fatal = 1");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const segmentCounts = this.db
      .prepare(
        `SELECT f.source_hash, f.locale, COUNT(*) as failures
         FROM translation_failures f
         LEFT JOIN translations t
           ON t.source_hash = f.source_hash AND t.locale = f.locale
         ${whereClause}
         GROUP BY f.source_hash, f.locale`
      )
      .all(...params) as { source_hash: string; locale: string; failures: number }[];

    let with1 = 0;
    let with2 = 0;
    let with3OrMore = 0;
    for (const row of segmentCounts) {
      if (row.failures === 1) {
        with1++;
      } else if (row.failures === 2) {
        with2++;
      } else if (row.failures >= 3) {
        with3OrMore++;
      }
    }

    return {
      segmentsWithFailure: segmentCounts.length,
      segmentsWith1Failure: with1,
      segmentsWith2Failures: with2,
      segmentsWith3OrMoreFailures: with3OrMore,
    };
  }

  getUniqueFailureQualityErrors(): string[] {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT quality_error
         FROM translation_failures
         WHERE quality_error IS NOT NULL AND quality_error != ''
         ORDER BY quality_error`
      )
      .all() as { quality_error: string }[];
    return rows.map((r) => r.quality_error);
  }

  close(): void {
    this.db.close();
  }

  // --- Plan §1.4 async façade ---

  async getSegmentAsync(hash: string, locale: string): Promise<string | null> {
    return Promise.resolve(this.getSegment(hash, locale));
  }

  async setSegmentAsync(entry: CacheEntry): Promise<void> {
    this.setSegment(
      entry.sourceHash,
      entry.locale,
      entry.sourceText,
      entry.translatedText,
      entry.model,
      entry.filepath,
      entry.startLine ?? undefined
    );
    return Promise.resolve();
  }

  async getFileStatus(filepath: string, locale: string): Promise<FileTracking | null> {
    const stmt = this.db.prepare(`
      SELECT source_hash, last_translated FROM file_tracking
      WHERE filepath = ? AND locale = ?
    `);
    const row = stmt.get(filepath, locale) as
      | { source_hash: string; last_translated: string | null }
      | undefined;
    if (!row) {
      return null;
    }
    return Promise.resolve({
      filepath,
      locale,
      sourceHash: row.source_hash,
      lastTranslated: row.last_translated,
    });
  }

  async setFileStatusAsync(filepath: string, locale: string, hash: string): Promise<void> {
    this.setFileStatus(filepath, locale, hash);
    return Promise.resolve();
  }

  /**
   * @param markdownKeys - `sourceHash|locale` for markdown segments hit this run (may be empty).
   * @param jsonKeys - `sourceHash|locale` for JSON segments hit this run (may be empty).
   */
  async resetLastHitAtForUnhit(markdownKeys: string[], jsonKeys: string[]): Promise<void> {
    if (markdownKeys.length > 0) {
      this.resetLastHitAtForUnhitMarkdown(new Set(markdownKeys));
    }
    if (jsonKeys.length > 0) {
      this.resetLastHitAtForUnhitJson(new Set(jsonKeys));
    }
    return Promise.resolve();
  }

  async cleanup(): Promise<CleanupStats> {
    const { count, deletedRows } = this.cleanupStaleTranslations(false);
    return Promise.resolve({
      staleTranslationsRemoved: count,
      deletedRows,
    });
  }

  /** Hot SQLite backup to another file. */
  async backupTo(destinationPath: string): Promise<void> {
    if (this.dbFilePath === null) {
      throw new CacheError("backup is not supported for :memory: databases");
    }
    const { backup } = loadSqlite();
    fs.mkdirSync(path.dirname(path.resolve(destinationPath)), { recursive: true });
    await backup(this.db, destinationPath);
  }

  /** Replace the on-disk DB with a copied file; closes and reopens the connection. */
  restoreFrom(sourcePath: string): void {
    if (this.dbFilePath === null) {
      throw new CacheError("restore is not supported for :memory: databases");
    }
    const { DatabaseSync } = loadSqlite();
    if (!fs.existsSync(sourcePath)) {
      throw new CacheError(`Backup file not found: ${sourcePath}`);
    }
    this.db.close();
    fs.copyFileSync(sourcePath, this.dbFilePath);
    this.db = new DatabaseSync(this.dbFilePath);
    this.applyMigrations();
  }
}
