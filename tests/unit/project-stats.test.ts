import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { TranslationCache } from "../../src/core/cache.js";
import { computeProjectStats } from "../../src/core/project-stats.js";

describe("computeProjectStats", () => {
  let cache: TranslationCache;

  afterEach(() => {
    cache?.close();
  });

  it("matches Editor /api/stats aggregates for cache, strings.json, and glossary", () => {
    cache = new TranslationCache(":memory:");
    cache.setSegment("abc", "de", "src", "dst", "m1", "f.md", 1);

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "proj-stats-"));
    const sj = path.join(dir, "strings.json");
    const gv = path.join(dir, "glossary-user.csv");
    fs.writeFileSync(
      sj,
      JSON.stringify({
        a: { source: "x", translated: { de: "y" }, models: { de: "model-a", fr: "" } },
        b: { source: "z", translated: {} },
      }),
      "utf8"
    );
    fs.writeFileSync(
      gv,
      "Original language string,locale,Translation\nhello,de,hallo\nworld,fr,monde\n",
      "utf8"
    );

    try {
      const data = computeProjectStats({
        cache,
        stringsPath: sj,
        glossaryPath: gv,
        sourceLocale: "en",
        targetLocales: ["de", "fr"],
      });

      expect(data.cache.totalSegments).toBe(1);
      expect(data.cache.byLocale.some((r) => r.locale === "de")).toBe(true);
      expect(data.cache.byModel.some((r) => r.model === "m1")).toBe(true);
      expect(data.cache.byModelLocale.some((r) => r.model === "m1" && r.locale === "de")).toBe(
        true
      );

      expect(data.uiStrings.available).toBe(true);
      expect(data.uiStrings.totalEntries).toBe(2);
      expect(data.uiStrings.plainTotal).toBe(2);
      expect(data.uiStrings.pluralTotal).toBe(0);
      const dePlain = data.uiStrings.plainByLocale.find((x) => x.locale === "de");
      expect(dePlain?.translated).toBe(1);
      expect(dePlain?.missing).toBe(1);
      expect(data.uiStrings.byModel).toEqual([
        { model: "(unknown)", count: 1 },
        { model: "model-a", count: 1 },
      ]);
      const mLocArr = [...data.uiStrings.byModelLocale].sort((a, b) =>
        a.model.localeCompare(b.model)
      );
      expect(mLocArr).toEqual([
        { model: "(unknown)", locale: "fr", count: 1 },
        { model: "model-a", locale: "de", count: 1 },
      ]);

      expect(data.glossary.available).toBe(true);
      expect(data.glossary.totalTerms).toBe(2);
      expect(data.glossary.byLocale.find((x) => x.locale === "de")?.count).toBe(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns unavailable uiStrings when strings path is missing", () => {
    cache = new TranslationCache(":memory:");
    const data = computeProjectStats({
      cache,
      stringsPath: path.join(os.tmpdir(), "nonexistent-strings-" + Date.now() + ".json"),
      glossaryPath: null,
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    expect(data.uiStrings.available).toBe(false);
    expect(data.uiStrings.byModel).toEqual([]);
    expect(data.glossary.available).toBe(false);
    expect(data.glossary.totalTerms).toBe(0);
  });
});
