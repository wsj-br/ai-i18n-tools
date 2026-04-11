import { DatabaseSync, backup } from "node:sqlite";
import fs from "fs";
import path from "path";
import { CacheError } from "./errors.js";
import type { CacheEntry, CleanupStats, FileTracking, TranslationRow } from "./types.js";
import { computeSegmentHash } from "../utils/hash.js";

const SCHEMA_VERSION = 1;

/**
 * SQLite translation cache. `better-sqlite3` uses a single native connection per instance
 * (no JS-level pool); reuse one instance per process for best throughput.
 */
export class TranslationCache {
  private db: DatabaseSync;
  private readonly dbFilePath: string | null;

  constructor(cachePath: string) {
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
      this.db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    }
  }

  /** Segment hash (normalized whitespace, SHA-256, 16 hex chars). */
  static computeHash(content: string): string {
    return computeSegmentHash(content);
  }

  getSegment(
    sourceHash: string,
    locale: string,
    filepath?: string,
    startLine?: number
  ): string | null {
    const selectStmt = this.db.prepare(`
      SELECT translated_text FROM translations
      WHERE source_hash = ? AND locale = ?
    `);
    const row = selectStmt.get(sourceHash, locale) as { translated_text: string } | undefined;
    if (row) {
      const updates: string[] = ["last_hit_at = datetime('now')"];
      const params: (string | number)[] = [];

      if (filepath) {
        updates.push(
          "filepath = CASE WHEN (filepath IS NULL OR filepath = '') THEN ? ELSE filepath END"
        );
        params.push(filepath);
      }
      if (startLine !== undefined && startLine !== null) {
        updates.push("start_line = CASE WHEN start_line IS NULL THEN ? ELSE start_line END");
        params.push(startLine);
      }

      params.push(sourceHash, locale);
      this.db
        .prepare(
          `UPDATE translations SET ${updates.join(", ")} WHERE source_hash = ? AND locale = ?`
        )
        .run(...params);

      return row.translated_text;
    }
    return null;
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
        start_line = CASE WHEN translations.start_line IS NULL THEN excluded.start_line ELSE translations.start_line END
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
    this.db.prepare("DELETE FROM file_tracking WHERE filepath = ? AND locale = ?").run(filepath, locale);
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

  clear(locale?: string): void {
    if (locale) {
      this.db.prepare("DELETE FROM translations WHERE locale = ?").run(locale);
      this.db.prepare("DELETE FROM file_tracking WHERE locale = ?").run(locale);
    } else {
      this.db.prepare("DELETE FROM translations").run();
      this.db.prepare("DELETE FROM file_tracking").run();
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
      .prepare(`UPDATE translations SET translated_text = ? WHERE source_hash = ? AND locale = ?`)
      .run(translatedText, sourceHash, locale);
  }

  deleteTranslation(sourceHash: string, locale: string): void {
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
        `DELETE FROM file_tracking WHERE (source_hash, locale) IN (SELECT source_hash, locale FROM translations ${whereClause})`
      )
      .run(...params);

    const result = this.db.prepare(`DELETE FROM translations ${whereClause}`).run(...params);
    return Number(result.changes);
  }

  deleteByFilepath(filepath: string): number {
    const result = this.db.prepare("DELETE FROM translations WHERE filepath = ?").run(filepath);
    this.db.prepare("DELETE FROM file_tracking WHERE filepath = ?").run(filepath);
    return Number(result.changes);
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
    fs.mkdirSync(path.dirname(path.resolve(destinationPath)), { recursive: true });
    await backup(this.db, destinationPath);
  }

  /** Replace the on-disk DB with a copied file; closes and reopens the connection. */
  restoreFrom(sourcePath: string): void {
    if (this.dbFilePath === null) {
      throw new CacheError("restore is not supported for :memory: databases");
    }
    if (!fs.existsSync(sourcePath)) {
      throw new CacheError(`Backup file not found: ${sourcePath}`);
    }
    this.db.close();
    fs.copyFileSync(sourcePath, this.dbFilePath);
    this.db = new DatabaseSync(this.dbFilePath);
    this.applyMigrations();
  }
}
