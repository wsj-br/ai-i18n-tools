import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { TranslationCache } from "../../src/core/cache.js";

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
});
