import fs from "fs";
import os from "os";
import path from "path";
import { TranslationCache } from "../../src/core/cache";

describe("TranslationCache", () => {
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
});
