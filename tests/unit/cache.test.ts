import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { TranslationCache } from "../../src/core/cache.js";
import { USER_EDITED_MODEL } from "../../src/core/user-edited-model.js";

describe("TranslationCache", () => {
  it("updates start_line on upsert when a new non-null line is written", () => {
    const cache = new TranslationCache(":memory:");
    const h = TranslationCache.computeHash("duplicate segment text");
    cache.setSegment(
      h,
      "pt-BR",
      "duplicate segment text",
      "tr1",
      "m",
      "docs/GETTING_STARTED.md",
      71
    );
    cache.setSegment(
      h,
      "pt-BR",
      "duplicate segment text",
      "tr2",
      "m",
      "docs/GETTING_STARTED.md",
      75
    );
    const { rows } = cache.listTranslations({ locale: "pt-BR", limit: 10, offset: 0 });
    const row = rows.find((r) => r.source_hash === h);
    expect(row?.start_line).toBe(75);
    cache.close();
  });

  it("stores and retrieves a segment", async () => {
    const cache = new TranslationCache(":memory:");
    const h = TranslationCache.computeHash("hello world");
    await cache.setSegmentAsync({
      sourceHash: h,
      locale: "de",
      sourceText: "hello world",
      translatedText: "hallo welt",
      model: "test/model",
      filepath: "a.md",
      startLine: 1,
    });
    const t = await cache.getSegmentAsync(h, "de");
    expect(t).toBe("hallo welt");
    const det = cache.getSegmentDetails(h, "de");
    expect(det?.text).toBe("hallo welt");
    expect(det?.model).toBe("test/model");
    expect(cache.getTranslationSourceText(h, "de")).toBe("hello world");
    expect(cache.getTranslationSourceText(h, "fr")).toBeNull();
    cache.close();
  });

  it("misses cached segments when prompt context hash changes but keeps user edits", () => {
    const cache = new TranslationCache(":memory:");
    const h = TranslationCache.computeHash("hello world");
    cache.setSegment(h, "de", "hello world", "hallo welt", "m", "a.md", 1, "ctx-a");
    expect(cache.getSegment(h, "de", "a.md", 1, "ctx-a")).toBe("hallo welt");
    expect(cache.getSegment(h, "de", "a.md", 1, "ctx-b")).toBeNull();
    expect(cache.getSegmentsBatch([h], "de", "ctx-b").has(h)).toBe(false);
    cache.setSegment(h, "de", "hello world", "hand edit", USER_EDITED_MODEL, "a.md", 1, "ctx-a");
    expect(cache.getSegment(h, "de", "a.md", 1, "ctx-b")).toBe("hand edit");
    cache.close();
  });

  it("file tracking matches only when source hash and prompt context agree", () => {
    const cache = new TranslationCache(":memory:");
    cache.setFileStatus("doc.md", "de", "abc123", "ctx-a");
    expect(cache.fileTrackingMatches("doc.md", "de", "abc123", "ctx-a")).toBe(true);
    expect(cache.fileTrackingMatches("doc.md", "de", "abc123", "ctx-b")).toBe(false);
    expect(cache.fileTrackingMatches("doc.md", "de", "zzz", "ctx-a")).toBe(false);
    expect(cache.getFileTrackingHashes("doc.md", "de")).toEqual({
      sourceHash: "abc123",
      promptContextHash: "ctx-a",
    });
    cache.close();
  });

  it("tracks file status", async () => {
    const cache = new TranslationCache(":memory:");
    await cache.setFileStatusAsync("doc.md", "fr", "abc123");
    const st = await cache.getFileStatus("doc.md", "fr");
    expect(st).not.toBeNull();
    expect(st?.sourceHash).toBe("abc123");
    cache.close();
  });

  it("close removes WAL sidecar files on disk", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-cache-wal-"));
    try {
      const cache = new TranslationCache(dir);
      cache.setSegment("h", "de", "source", "trans", "m", "a.md", 1);
      cache.close();
      expect(fs.readdirSync(dir).sort()).toEqual(["cache.db"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("backup and restore on disk", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-cache-"));
    const cache = new TranslationCache(dir);
    const h = TranslationCache.computeHash("x");
    cache.setSegment(h, "de", "x", "y", "m");
    const backupPath = path.join(dir, "snap.db");
    await cache.backupTo(backupPath);
    cache.clear();
    expect(cache.getStats().totalSegments).toBe(0);
    cache.restoreFrom(backupPath);
    expect(cache.getSegment(h, "de")).toBe("y");
    cache.close();
  });

  it("backupTo leaves no -wal / -shm sidecar files next to the backup", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-cache-backup-clean-"));
    try {
      const cache = new TranslationCache(dir);
      cache.setSegment(TranslationCache.computeHash("x"), "de", "x", "y", "m");
      const backupPath = path.join(dir, "snap.sqlite");
      await cache.backupTo(backupPath);
      expect(fs.existsSync(backupPath)).toBe(true);
      expect(fs.existsSync(`${backupPath}-wal`)).toBe(false);
      expect(fs.existsSync(`${backupPath}-shm`)).toBe(false);
      cache.close();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("close removes the cache.db -wal / -shm sidecar files", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-cache-close-clean-"));
    try {
      const cache = new TranslationCache(dir);
      cache.setSegment(TranslationCache.computeHash("x"), "de", "x", "y", "m");
      const dbPath = path.join(dir, "cache.db");
      cache.close();
      expect(fs.existsSync(dbPath)).toBe(true);
      expect(fs.existsSync(`${dbPath}-wal`)).toBe(false);
      expect(fs.existsSync(`${dbPath}-shm`)).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("listTranslations and getStats", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("h1", "de", "source", "trans", "m1", "a.md", 2);
    const { rows, total } = cache.listTranslations({ locale: "de", limit: 10, offset: 0 });
    expect(total).toBeGreaterThanOrEqual(1);
    expect(rows.some((r) => r.source_hash === "h1")).toBe(true);
    const stats = cache.getStats();
    expect(stats.totalSegments).toBeGreaterThanOrEqual(1);
    expect(stats.byLocale.de).toBeGreaterThanOrEqual(1);
    cache.close();
  });

  it("getUniqueLocales, getUniqueModels, getUniqueFilepaths", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("x", "es", "s", "t", "mx", "p.md", 1);
    expect(cache.getUniqueLocales()).toContain("es");
    expect(cache.getUniqueModels()).toContain("mx");
    expect(cache.getUniqueFilepaths()).toContain("p.md");
    cache.close();
  });

  it("getFileHash returns stored hash", () => {
    const cache = new TranslationCache(":memory:");
    cache.setFileStatus("f.md", "de", "abc");
    expect(cache.getFileHash("f.md", "de")).toBe("abc");
    cache.close();
  });

  it("deleteByFilepath returns count", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("h", "de", "a", "b", "m", "path-only.md", 1);
    const n = cache.deleteByFilepath("path-only.md");
    expect(n).toBeGreaterThanOrEqual(1);
    expect(cache.getSegment("h", "de")).toBeNull();
    cache.close();
  });

  it("deleteByFilters matches model, source_hash, source_text, translated_text", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("hash1", "fr", "source-x", "trans-y", "model-z", "doc.md", 1);
    expect(
      cache.deleteByFilters({
        model: "model-z",
        source_hash: "hash",
        source_text: "source",
        translated_text: "trans",
      })
    ).toBeGreaterThanOrEqual(1);
    cache.close();
  });

  it("resetLastHitAtForUnhitMarkdown and listTranslations last_hit filters", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("keep", "de", "a", "b", "m", "doc.md", 1);
    cache.setSegment("stale", "de", "c", "d", "m", "other.md", 1);
    const n = cache.resetLastHitAtForUnhitMarkdown(new Set(["keep|de"]));
    expect(n).toBeGreaterThanOrEqual(1);
    const nullHits = cache.listTranslations({ last_hit_at_null: true, limit: 50, offset: 0 });
    expect(nullHits.rows.some((r) => r.source_hash === "stale")).toBe(true);
    const active = cache.listTranslations({ last_hit_at_not_null: true, limit: 50, offset: 0 });
    expect(active.rows.some((r) => r.source_hash === "keep")).toBe(true);
    cache.close();
  });

  it("cleanupStaleTranslations dryRun reports without deleting", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("gone", "de", "a", "b", "m", "", 1);
    const { count, deletedRows } = cache.cleanupStaleTranslations(true);
    expect(count).toBeGreaterThanOrEqual(1);
    expect(deletedRows.length).toBeGreaterThanOrEqual(1);
    expect(cache.getStats().totalSegments).toBeGreaterThanOrEqual(1);
    cache.close();
  });

  it("pruneUnconfiguredLocales removes locales absent from the allowed set", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("h", "hi", "a", "b", "m", "doc.md", 1);
    cache.setSegment("h", "hi-Latn", "a", "b", "m", "doc.md", 1);
    cache.setFileStatus("doc-block:0:doc.md", "hi-Latn", "fh");
    cache.addSegmentFailures([
      {
        sourceHash: "h",
        locale: "hi-Latn",
        model: "mx",
        modelOrder: 0,
        qualityError: "api",
        errorMessage: "failed",
        fatal: true,
        filepath: "doc.md",
        sourceText: "a",
      },
    ]);

    const dry = cache.pruneUnconfiguredLocales(["en", "hi"], true);
    expect(dry.locales).toEqual(["hi-Latn"]);
    expect(dry.count).toBe(3);
    expect(cache.getSegment("h", "hi-Latn")).not.toBeNull();

    const pruned = cache.pruneUnconfiguredLocales(["en", "hi"], false);
    expect(pruned.locales).toEqual(["hi-Latn"]);
    expect(pruned.count).toBe(3);
    expect(cache.getSegment("h", "hi")).not.toBeNull();
    expect(cache.getSegment("h", "hi-Latn")).toBeNull();
    expect(cache.getFileHash("doc-block:0:doc.md", "hi-Latn")).toBeNull();
    expect(cache.listTranslationFailures({ locale: "hi-Latn", limit: 10, offset: 0 }).total).toBe(
      0
    );
    cache.close();
  });

  it("pruneUnconfiguredLocales keeps source and configured target locales", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("h", "en", "a", "b", "m", "doc.md", 1);
    cache.setSegment("h", "de", "a", "b", "m", "doc.md", 1);
    const pruned = cache.pruneUnconfiguredLocales(["en", "de"], false);
    expect(pruned.count).toBe(0);
    expect(cache.getSegment("h", "en")).not.toBeNull();
    expect(cache.getSegment("h", "de")).not.toBeNull();
    cache.close();
  });

  it("clear with locale removes only that locale", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("h", "de", "a", "b", "m", "f.md", 1);
    cache.setSegment("h", "fr", "a", "b", "m", "f.md", 1);
    cache.clear("de");
    expect(cache.getSegment("h", "de")).toBeNull();
    expect(cache.getSegment("h", "fr")).not.toBeNull();
    cache.close();
  });

  it("listTranslations respects filename and translated_text filters", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("h2", "de", "st", "tt", "m", "unique-name.md", 3);
    const { rows, total } = cache.listTranslations({
      filename: "unique",
      translated_text: "tt",
      limit: 20,
      offset: 0,
    });
    expect(total).toBeGreaterThanOrEqual(1);
    expect(rows.some((r) => r.filepath?.includes("unique-name"))).toBe(true);
    cache.close();
  });

  it("getFileStatus returns null when no tracking row", async () => {
    const cache = new TranslationCache(":memory:");
    expect(await cache.getFileStatus("missing.md", "de")).toBeNull();
    cache.close();
  });

  it("resetLastHitAtForUnhit clears JSON rows not listed in jsonKeys", async () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("ja", "de", "a", "b", "m", "a.json", 1);
    cache.setSegment("jb", "de", "c", "d", "m", "b.json", 1);
    await cache.resetLastHitAtForUnhit([], ["ja|de"]);
    const nullHits = cache.listTranslations({ last_hit_at_null: true, limit: 50, offset: 0 });
    expect(nullHits.rows.some((r) => r.source_hash === "jb")).toBe(true);
    cache.close();
  });

  it("backupTo and restoreFrom reject :memory:", async () => {
    const cache = new TranslationCache(":memory:");
    await expect(cache.backupTo("/tmp/x.db")).rejects.toThrow(/:memory:/);
    expect(() => cache.restoreFrom("/tmp/x.db")).toThrow(/:memory:/);
    cache.close();
  });

  it("restoreFrom throws when backup file is missing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cache-restore-"));
    const cache = new TranslationCache(dir);
    try {
      expect(() => cache.restoreFrom(path.join(dir, "nope.db"))).toThrow(/not found/);
    } finally {
      cache.close();
    }
  });

  it("cleanup removes stale translations", async () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("stale", "de", "a", "b", "m", "", 1);
    const stats = await cache.cleanup();
    expect(stats.staleTranslationsRemoved).toBeGreaterThanOrEqual(1);
    cache.close();
  });

  it("deleteTranslationsByFilepath does not delete file_tracking rows", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("h", "de", "a", "b", "m", "plain.md", 1);
    cache.setFileStatus("doc-block:0:plain.md", "de", "filehash");
    cache.deleteTranslationsByFilepath("plain.md");
    expect(cache.getSegment("h", "de")).toBeNull();
    expect(cache.getFileHash("doc-block:0:plain.md", "de")).toBe("filehash");
    cache.close();
  });

  it("deleteFileTrackingByPath removes only file_tracking", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("h", "de", "a", "b", "m", "x.md", 1);
    cache.setFileStatus("doc-block:0:x.md", "de", "fh");
    cache.deleteFileTrackingByPath("doc-block:0:x.md");
    expect(cache.getSegment("h", "de")).not.toBeNull();
    expect(cache.getFileHash("doc-block:0:x.md", "de")).toBeNull();
    cache.close();
  });

  it("resetLastHitAtForUnhitMarkdownInScope only touches allowed filepaths", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("inHit", "de", "a", "b", "m", "scoped.md", 1);
    cache.setSegment("inScopeStale", "de", "c", "d", "m", "scoped.md", 1);
    cache.setSegment("outOfScope", "de", "e", "f", "m", "other.md", 1);
    const n = cache.resetLastHitAtForUnhitMarkdownInScope(new Set(["inHit|de"]), ["scoped.md"]);
    expect(n).toBeGreaterThanOrEqual(1);
    const nullHits = cache.listTranslations({ last_hit_at_null: true, limit: 50, offset: 0 });
    expect(nullHits.rows.some((r) => r.source_hash === "inScopeStale")).toBe(true);
    expect(nullHits.rows.some((r) => r.source_hash === "outOfScope")).toBe(false);
    cache.close();
  });

  it("global dedupe: setSegment upserts single row per source_hash and locale", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("shared", "de", "a", "b", "m", "first.md", 1);
    cache.setSegment("shared", "de", "a2", "b2", "m", "second.md", 1);
    expect(cache.getStats().totalSegments).toBe(1);
    cache.close();
  });

  it("pruneOrphanedFileTrackingByDisk removes file_tracking when source file is missing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-cache-prune-"));
    try {
      const cache = new TranslationCache(dir);
      cache.setFileStatus("doc-block:0:does-not-exist.md", "de", "fh");
      const n = cache.pruneOrphanedFileTrackingByDisk(dir, false);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(cache.getFileHash("doc-block:0:does-not-exist.md", "de")).toBeNull();
      cache.close();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("getDetailedStats reports stale vs active and model breakdown", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("h1", "de", "a", "b", "m1", "doc.md", 1);
    cache.setSegment("h2", "de", "c", "d", "", "other.md", 1);
    const d = cache.getDetailedStats();
    expect(d.totalSegments).toBe(2);
    expect(d.byLocale.some((r) => r.locale === "de" && r.total === 2)).toBe(true);
    expect(d.byModel.some((r) => r.model === "m1")).toBe(true);
    expect(d.uniqueFilepaths).toBeGreaterThanOrEqual(1);
    cache.close();
  });

  it("pruneOrphanedTranslationFailures removes failures without translations row", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-cache-fail-prune-"));
    try {
      const cache = new TranslationCache(dir);
      cache.addSegmentFailures([
        {
          sourceHash: "orphan",
          locale: "de",
          model: "mx",
          modelOrder: 0,
          qualityError: "api",
          errorMessage: "failed",
          fatal: true,
          filepath: "gone.md",
          sourceText: "text",
        },
      ]);
      const n = cache.pruneOrphanedTranslationFailures(dir, false);
      expect(n).toBe(1);
      expect(cache.listTranslationFailures({ limit: 10, offset: 0 }).total).toBe(0);
      cache.close();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("pruneOrphanedTranslationFailures removes failures when filepath is missing on disk", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-cache-fail-disk-"));
    try {
      const cache = new TranslationCache(dir);
      cache.setSegment("h", "de", "a", "b", "m", "missing.md", 1);
      cache.addSegmentFailures([
        {
          sourceHash: "h",
          locale: "de",
          model: "mx",
          modelOrder: 0,
          qualityError: "placeholder",
          errorMessage: "bad",
          fatal: false,
          filepath: "missing.md",
          sourceText: "a",
        },
      ]);
      const n = cache.pruneOrphanedTranslationFailures(dir, false);
      expect(n).toBe(1);
      expect(cache.listTranslationFailures({ limit: 10, offset: 0 }).total).toBe(0);
      expect(cache.getSegment("h", "de")).not.toBeNull();
      cache.close();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("pruneOrphanedTranslationFailures keeps failures when translation and file exist", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-cache-fail-keep-"));
    try {
      const rel = "exists.md";
      fs.writeFileSync(path.join(dir, rel), "# doc\n");
      const cache = new TranslationCache(dir);
      cache.setSegment("h", "de", "a", "b", "m", rel, 1);
      cache.addSegmentFailures([
        {
          sourceHash: "h",
          locale: "de",
          model: "mx",
          modelOrder: 0,
          qualityError: "placeholder",
          errorMessage: "bad",
          fatal: false,
          filepath: rel,
          sourceText: "a",
        },
      ]);
      const n = cache.pruneOrphanedTranslationFailures(dir, false);
      expect(n).toBe(0);
      expect(cache.listTranslationFailures({ limit: 10, offset: 0 }).total).toBeGreaterThanOrEqual(
        1
      );
      cache.close();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("pruneOrphanedTranslationFailures dryRun reports without deleting", () => {
    const cache = new TranslationCache(":memory:");
    cache.addSegmentFailures([
      {
        sourceHash: "orphan",
        locale: "de",
        model: "mx",
        modelOrder: 0,
        qualityError: "api",
        errorMessage: "failed",
        fatal: true,
      },
    ]);
    const n = cache.pruneOrphanedTranslationFailures(process.cwd(), true);
    expect(n).toBe(1);
    expect(cache.listTranslationFailures({ limit: 10, offset: 0 }).total).toBeGreaterThanOrEqual(1);
    cache.close();
  });

  it("translation failure listing and summary aggregate rows", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("sh", "de", "orig", "tr", "mx", "fail.md", 2);
    cache.addSegmentFailures([
      {
        sourceHash: "sh",
        locale: "de",
        model: "mx",
        modelOrder: 0,
        qualityError: "placeholder",
        errorMessage: "bad",
        fatal: false,
        filepath: "fail.md",
        sourceText: "orig",
      },
      {
        sourceHash: "sh",
        locale: "de",
        model: "mx",
        modelOrder: 1,
        qualityError: "placeholder",
        errorMessage: "still bad",
        fatal: false,
      },
    ]);
    const listed = cache.listTranslationFailures({ locale: "de", limit: 10, offset: 0 });
    expect(listed.total).toBeGreaterThanOrEqual(1);
    expect(listed.rows.some((r) => r.source_hash === "sh")).toBe(true);
    const summary = cache.getTranslationFailureSummary({ locale: "de" });
    expect(summary.segmentsWithFailure).toBeGreaterThanOrEqual(1);
    expect(cache.getUniqueFailureQualityErrors()).toContain("placeholder");
    cache.close();
  });

  it("resetLastHitAtForUnhitJsonInScope respects allowed paths only", () => {
    const cache = new TranslationCache(":memory:");
    cache.setSegment("hit", "de", "a", "b", "m", "in.json", 1);
    cache.setSegment("stale", "de", "c", "d", "m", "in.json", 1);
    cache.setSegment("other", "de", "e", "f", "m", "out.json", 1);
    const n = cache.resetLastHitAtForUnhitJsonInScope(new Set(["hit|de"]), ["in.json"]);
    expect(n).toBeGreaterThanOrEqual(1);
    const nullHits = cache.listTranslations({ last_hit_at_null: true, limit: 50, offset: 0 });
    expect(nullHits.rows.some((r) => r.source_hash === "stale")).toBe(true);
    expect(nullHits.rows.some((r) => r.source_hash === "other")).toBe(false);
    cache.close();
  });

  it("replaceMarkdownIssuesForFilepath replaces markdown_source_issues rows", () => {
    const cache = new TranslationCache(":memory:");
    const fp = "doc-block:0:guide.md";
    cache.replaceMarkdownIssuesForFilepath(fp, [
      {
        filepath: fp,
        sourceHash: "abc",
        startLine: 2,
        issueCode: "UNPAIRED_EMPHASIS",
        detail: "test",
      },
    ]);
    const listed = cache.listMarkdownSourceIssues({ filename: "guide", limit: 10, offset: 0 });
    expect(listed.total).toBe(1);
    expect(listed.rows[0]?.source_hash).toBe("abc");
    const summary = cache.getMarkdownSourceIssueSummary({ filename: "guide" });
    expect(summary.rowsWithIssues).toBe(1);
    expect(summary.byCode.UNPAIRED_EMPHASIS).toBe(1);
    expect(cache.getUniqueMarkdownSourceIssueCodes()).toContain("UNPAIRED_EMPHASIS");
    cache.replaceMarkdownIssuesForFilepath(fp, []);
    expect(cache.listMarkdownSourceIssues({ limit: 20, offset: 0 }).total).toBe(0);
    cache.close();
  });

  it("deleteTranslationsByFilepath deletes markdown_source_issues for same filepath", () => {
    const cache = new TranslationCache(":memory:");
    const fp = "docs/a.md";
    cache.setSegment("h", "de", "s", "t", "m", fp, 1);
    cache.replaceMarkdownIssuesForFilepath(fp, [
      {
        filepath: fp,
        sourceHash: "h",
        startLine: 1,
        issueCode: "UNCLOSED_INLINE_CODE",
        detail: "x",
      },
    ]);
    cache.deleteTranslationsByFilepath(fp);
    expect(cache.listMarkdownSourceIssues({ filename: "a.md", limit: 10, offset: 0 }).total).toBe(
      0
    );
    cache.close();
  });

  it("clearAllMarkdownIssues removes every row regardless of file/config state", () => {
    const cache = new TranslationCache(":memory:");
    const configured = "doc-block:0:exists.md";
    const stale = "doc-block:0:renamed-away.md";
    cache.replaceMarkdownIssuesForFilepath(configured, [
      {
        filepath: configured,
        sourceHash: "h1",
        startLine: 1,
        issueCode: "UNPAIRED_EMPHASIS",
        detail: "x",
      },
    ]);
    cache.replaceMarkdownIssuesForFilepath(stale, [
      {
        filepath: stale,
        sourceHash: "h2",
        startLine: 4,
        issueCode: "UNCLOSED_INLINE_CODE",
        detail: "y",
      },
      {
        filepath: stale,
        sourceHash: "h3",
        startLine: 9,
        issueCode: "STRONG_OUTSIDE_INLINE_CODE",
        detail: "z",
      },
    ]);
    const n = cache.clearAllMarkdownIssues(false);
    expect(n).toBe(3);
    expect(cache.listMarkdownSourceIssues({ limit: 20, offset: 0 }).total).toBe(0);
    cache.close();
  });

  it("clearAllMarkdownIssues dryRun reports count without deleting", () => {
    const cache = new TranslationCache(":memory:");
    const fp = "doc-block:0:gone.md";
    cache.replaceMarkdownIssuesForFilepath(fp, [
      { filepath: fp, sourceHash: "h1", startLine: 1, issueCode: "UNPAIRED_EMPHASIS", detail: "x" },
    ]);
    const n = cache.clearAllMarkdownIssues(true);
    expect(n).toBe(1);
    expect(cache.listMarkdownSourceIssues({ limit: 20, offset: 0 }).total).toBe(1);
    cache.close();
  });

  describe("batch operations", () => {
    it("getSegmentsBatch returns cached segments without updating last_hit_at", () => {
      const cache = new TranslationCache(":memory:");
      cache.setSegment("h1", "de", "source1", "trans1", "m1", "doc.md", 1);
      cache.setSegment("h2", "de", "source2", "trans2", "m2", "doc.md", 2);
      cache.setSegment("h3", "fr", "source3", "trans3", "m3", "doc.md", 3); // different locale

      // Clear last_hit_at to simulate segments that haven't been accessed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cache as any).db.exec("UPDATE translations SET last_hit_at = NULL");

      const batch = cache.getSegmentsBatch(["h1", "h2", "h3"], "de");

      expect(batch.size).toBe(2);
      expect(batch.get("h1")?.text).toBe("trans1");
      expect(batch.get("h1")?.model).toBe("m1");
      expect(batch.get("h2")?.text).toBe("trans2");
      expect(batch.get("h2")?.model).toBe("m2");
      expect(batch.get("h3")).toBeUndefined();

      // last_hit_at should still be null (batch read doesn't update)
      const row1 = cache.listTranslations({ source_hash: "h1", limit: 1, offset: 0 }).rows[0];
      expect(row1?.last_hit_at).toBeNull();

      cache.close();
    });

    it("getSegmentsBatch handles empty hash list", () => {
      const cache = new TranslationCache(":memory:");
      const batch = cache.getSegmentsBatch([], "de");
      expect(batch.size).toBe(0);
      cache.close();
    });

    it("getSegmentsBatch handles large hash lists by chunking", () => {
      const cache = new TranslationCache(":memory:");
      const hashes: string[] = [];
      for (let i = 0; i < 600; i++) {
        const h = `hash${i.toString().padStart(4, "0")}`;
        hashes.push(h);
        cache.setSegment(h, "de", `source${i}`, `trans${i}`, "m", "doc.md", i);
      }

      const batch = cache.getSegmentsBatch(hashes, "de");

      expect(batch.size).toBe(600);
      expect(batch.get("hash0000")?.text).toBe("trans0");
      expect(batch.get("hash0599")?.text).toBe("trans599");
      cache.close();
    });

    it("batchUpdateLastHitAt updates timestamps for multiple segments", () => {
      const cache = new TranslationCache(":memory:");
      cache.setSegment("h1", "de", "s1", "t1", "m", "doc.md", 1);
      cache.setSegment("h2", "de", "s2", "t2", "m", "doc.md", 2);
      cache.setSegment("h3", "de", "s3", "t3", "m", "doc.md", 3);

      // Clear last_hit_at to simulate segments that haven't been accessed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cache as any).db.exec("UPDATE translations SET last_hit_at = NULL");

      // Initially no last_hit_at
      let nullHits = cache.listTranslations({ last_hit_at_null: true, limit: 10, offset: 0 });
      expect(nullHits.total).toBe(3);

      // Batch update last_hit_at
      cache.batchUpdateLastHitAt(["h1|de", "h2|de"]);

      // h1 and h2 should now have last_hit_at
      nullHits = cache.listTranslations({ last_hit_at_null: true, limit: 10, offset: 0 });
      expect(nullHits.total).toBe(1);
      expect(nullHits.rows[0]?.source_hash).toBe("h3");

      cache.close();
    });

    it("batchUpdateLastHitAt handles empty key list", () => {
      const cache = new TranslationCache(":memory:");
      cache.setSegment("h1", "de", "s1", "t1", "m", "doc.md", 1);

      // Should not throw
      expect(() => cache.batchUpdateLastHitAt([])).not.toThrow();
      cache.close();
    });

    it("batchUpdateLastHitAt ignores malformed keys", () => {
      const cache = new TranslationCache(":memory:");
      cache.setSegment("h1", "de", "s1", "t1", "m", "doc.md", 1);

      // Malformed keys (no pipe separator) should be ignored
      cache.batchUpdateLastHitAt(["h1|de", "invalid", "also|invalid|extra"]);

      const row = cache.listTranslations({ source_hash: "h1", limit: 1, offset: 0 }).rows[0];
      expect(row?.last_hit_at).not.toBeNull();
      cache.close();
    });

    it("getSegmentsBatch respects locale filtering", () => {
      const cache = new TranslationCache(":memory:");
      cache.setSegment("h1", "de", "s1", "t1-de", "m", "doc.md", 1);
      cache.setSegment("h1", "fr", "s1", "t1-fr", "m", "doc.md", 1);
      cache.setSegment("h1", "es", "s1", "t1-es", "m", "doc.md", 1);

      const deBatch = cache.getSegmentsBatch(["h1"], "de");
      expect(deBatch.get("h1")?.text).toBe("t1-de");

      const frBatch = cache.getSegmentsBatch(["h1"], "fr");
      expect(frBatch.get("h1")?.text).toBe("t1-fr");

      cache.close();
    });
  });

  describe("api_calls", () => {
    it("records calls and aggregates mixed reported/unknown cost", () => {
      const cache = new TranslationCache(":memory:");
      cache.recordApiCall({
        provider: "openrouter",
        model: "m1",
        operation: "translate-docs",
        locale: "de",
        outcome: "accepted",
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
        costUsd: 0.01,
      });
      cache.recordApiCall({
        provider: "openai",
        model: "m2",
        operation: "translate-ui",
        locale: "fr",
        outcome: "discarded",
        inputTokens: 5,
        outputTokens: 7,
        totalTokens: 12,
      });
      const stats = cache.getApiCallStats();
      expect(stats.summary.calls).toBe(2);
      expect(stats.summary.acceptedCalls).toBe(1);
      expect(stats.summary.discardedCalls).toBe(1);
      expect(stats.summary.totalTokens).toBe(42);
      expect(stats.summary.callsWithCost).toBe(1);
      expect(stats.summary.callsWithoutCost).toBe(1);
      expect(stats.summary.actualCostUsd).toBeCloseTo(0.01);
      expect(stats.summary.inputTokensWithoutCost).toBe(5);
      expect(stats.byProvider.map((r) => r.provider).sort()).toEqual(["openai", "openrouter"]);
      expect(stats.byModel).toHaveLength(2);
      expect(stats.byOperation.map((r) => r.operation).sort()).toEqual([
        "translate-docs",
        "translate-ui",
      ]);
      const { rows, total } = cache.listApiCalls({ limit: 10, offset: 0 });
      expect(total).toBe(2);
      expect(rows).toHaveLength(2);
      expect(rows.find((r) => r.model === "m2")?.cost_usd).toBeNull();
      const opts = cache.getApiCallFilterOptions();
      expect(opts.providers).toEqual(["openai", "openrouter"]);
      expect(opts.locales).toEqual(["de", "fr"]);
      cache.close();
    });

    it("filters by provider and prunes old rows", () => {
      const cache = new TranslationCache(":memory:");
      cache.recordApiCall({
        provider: "openrouter",
        model: "m1",
        operation: "translate-docs",
        outcome: "accepted",
        inputTokens: 1,
        outputTokens: 1,
        totalTokens: 2,
        costUsd: 0.1,
        createdAt: "2020-01-01 00:00:00",
      });
      cache.recordApiCall({
        provider: "openai",
        model: "m2",
        operation: "translate-ui",
        outcome: "accepted",
        inputTokens: 2,
        outputTokens: 2,
        totalTokens: 4,
      });
      const filtered = cache.getApiCallStats({ provider: "openai" });
      expect(filtered.summary.calls).toBe(1);
      expect(filtered.summary.totalTokens).toBe(4);
      const preview = cache.deleteUsageOlderThan("1mo", true, new Date("2026-09-21T12:00:00.000Z"));
      expect(preview.removedCalls).toBe(1);
      expect(cache.getApiCallStats().summary.calls).toBe(2);
      const removed = cache.deleteUsageOlderThan(
        "1mo",
        false,
        new Date("2026-09-21T12:00:00.000Z")
      );
      expect(removed.removedCalls).toBe(1);
      expect(cache.getApiCallStats().summary.calls).toBe(1);
      expect(cache.clearUsage(true)).toEqual({ removedCalls: 1, removedTotals: 0 });
      expect(cache.clearUsage(false)).toEqual({ removedCalls: 1, removedTotals: 0 });
      expect(cache.getApiCallStats().summary.calls).toBe(0);
      cache.close();
    });

    it("creates api_totals in the v5 schema and rolls up rows older than seven calendar days", () => {
      const cache = new TranslationCache(":memory:");
      const now = new Date("2026-09-21T12:00:00.000Z");
      cache.recordApiCall({
        provider: "openrouter",
        model: "m1",
        operation: "translate-ui",
        locale: "de",
        outcome: "accepted",
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
        costUsd: 0.1,
        createdAt: "2026-08-15 10:00:00",
      });
      cache.recordApiCall({
        provider: "openrouter",
        model: "m1",
        operation: "translate-ui",
        locale: "de",
        outcome: "discarded",
        inputTokens: 3,
        outputTokens: 4,
        totalTokens: 7,
        costUsd: 0.02,
        createdAt: "2026-08-16 10:00:00",
      });
      cache.recordApiCall({
        provider: "openai",
        model: "m2",
        operation: "translate-ui",
        locale: "de",
        outcome: "accepted",
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        createdAt: "2026-08-17 10:00:00",
      });
      cache.recordApiCall({
        provider: "openrouter",
        model: "m1",
        operation: "translate-ui",
        locale: "de",
        outcome: "accepted",
        inputTokens: 5,
        outputTokens: 5,
        totalTokens: 10,
        costUsd: 0.05,
        createdAt: "2026-09-18 10:00:00",
      });
      expect(cache.consolidateApiCalls(now)).toEqual({ rolledUpCalls: 3 });
      expect(cache.consolidateApiCalls(now)).toEqual({ rolledUpCalls: 0 });
      expect(cache.listApiCalls().total).toBe(1);
      const stats = cache.getApiCallStats(undefined, now);
      expect(stats.summary.calls).toBe(4);
      expect(stats.summary.acceptedCalls).toBe(3);
      expect(stats.summary.discardedCalls).toBe(1);
      expect(stats.summary.totalTokens).toBe(197);
      expect(stats.summary.actualCostUsd).toBeCloseTo(0.17);
      expect(stats.summary.callsWithCost).toBe(3);
      expect(stats.summary.callsWithoutCost).toBe(1);
      expect(stats.summary.inputTokensWithoutCost).toBe(100);
      expect(stats.summary.outputTokensWithoutCost).toBe(50);
      expect(stats.byMonth.map((r) => r.month).sort()).toEqual(["2026-08", "2026-09"]);
      const august = stats.byMonth.find((r) => r.month === "2026-08");
      expect(august?.calls).toBe(3);
      expect(august?.acceptedCalls).toBe(2);
      expect(august?.discardedCalls).toBe(1);
      expect(august?.callsWithCost).toBe(2);
      expect(august?.callsWithoutCost).toBe(1);
      expect(stats.byDay).toHaveLength(1);
      expect(stats.byDay[0]?.day).toBe("2026-09-18");
      const short = cache.getApiCallStats({ since: "2026-09-21 11:30:00" }, now);
      expect(short.summary.calls).toBe(0);
      const twoMonths = cache.getApiCallStats({ since: "2026-08-01 00:00:00" }, now);
      expect(twoMonths.summary.calls).toBe(4);
      cache.close();
    });

    it("consolidates on close after recording and upserts the same monthly dimensions", () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "api-totals-"));
      try {
        const now = new Date("2026-09-21T12:00:00.000Z");
        const first = new TranslationCache(dir);
        first.recordApiCall({
          provider: "openrouter",
          model: "m1",
          operation: "translate-docs",
          outcome: "accepted",
          inputTokens: 8,
          outputTokens: 2,
          totalTokens: 10,
          costUsd: 0.01,
          createdAt: "2026-07-02 00:00:00",
        });
        first.close();
        const second = new TranslationCache(dir);
        expect(second.listApiCalls().total).toBe(0);
        expect(second.getApiCallStats(undefined, now).summary.calls).toBe(1);
        second.recordApiCall({
          provider: "openrouter",
          model: "m1",
          operation: "translate-docs",
          outcome: "accepted",
          inputTokens: 2,
          outputTokens: 2,
          totalTokens: 4,
          costUsd: 0.02,
          createdAt: "2026-07-03 00:00:00",
        });
        expect(second.consolidateApiCalls(now)).toEqual({ rolledUpCalls: 1 });
        const stats = second.getApiCallStats(undefined, now);
        expect(stats.summary.calls).toBe(2);
        expect(stats.summary.totalTokens).toBe(14);
        expect(stats.summary.actualCostUsd).toBeCloseTo(0.03);
        expect(stats.byMonth).toEqual([
          expect.objectContaining({ month: "2026-07", calls: 2, acceptedCalls: 2 }),
        ]);
        second.close();
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
