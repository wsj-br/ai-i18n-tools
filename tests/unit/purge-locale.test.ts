import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TranslationCache } from "../../src/core/cache.js";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import type { I18nConfig } from "../../src/core/types.js";
import { runPurgeLocale } from "../../src/cli/purge-locale.js";

function buildConfig(): I18nConfig {
  return parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en",
      targetLocales: ["de", "fr"],
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels: ["m"],
        maxTokens: 100,
        temperature: 0.1,
      },
      features: { translateDocs: true, translateUIStrings: true },
      ui: { sourceRoots: ["src"], stringsJson: "strings.json", flatOutputDir: "locales" },
      cacheDir: ".cache",
      docs: [
        {
          contentPaths: ["docs/"],
          outputDir: "translated-docs",
          docsOutput: { style: "nested", docsRoot: "docs" },
        },
      ],
    })
  );
}

function seedLocale(cache: TranslationCache, locale: string, hash: string): void {
  cache.setSegment(hash, locale, "source text", "translated", "m", "doc.md", 1);
  cache.setFileStatus("doc-block:0:doc.md", locale, hash);
  cache.addSegmentFailures([
    {
      sourceHash: hash,
      locale,
      model: "m",
      modelOrder: 1,
      qualityError: "q",
      errorMessage: "boom",
      fatal: false,
      filepath: "doc.md",
      sourceText: "source text",
    },
  ]);
}

describe("runPurgeLocale", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    dirs.length = 0;
    vi.restoreAllMocks();
  });

  function makeCacheDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "purge-locale-"));
    dirs.push(dir);
    const cache = new TranslationCache(dir);
    seedLocale(cache, "de", TranslationCache.computeHash("de seg"));
    seedLocale(cache, "fr", TranslationCache.computeHash("fr seg"));
    cache.close();
    return dir;
  }

  it("purges all three tables for the target locale and leaves others untouched", async () => {
    const dir = makeCacheDir();
    vi.spyOn(console, "log").mockImplementation(() => {});

    await runPurgeLocale({ cacheDir: dir, locales: ["de"], force: true });

    const cache = new TranslationCache(dir);
    try {
      expect(cache.countLocaleRows("de")).toEqual({
        translations: 0,
        fileTracking: 0,
        failures: 0,
      });
      expect(cache.countLocaleRows("fr")).toEqual({
        translations: 1,
        fileTracking: 1,
        failures: 1,
      });
    } finally {
      cache.close();
    }
  });

  it("dry-run deletes nothing", async () => {
    const dir = makeCacheDir();
    vi.spyOn(console, "log").mockImplementation(() => {});
    const rlSpy = vi.spyOn(readline, "createInterface");

    await runPurgeLocale({ cacheDir: dir, locales: ["de"], dryRun: true });

    expect(rlSpy).not.toHaveBeenCalled();
    const cache = new TranslationCache(dir);
    try {
      expect(cache.countLocaleRows("de")).toEqual({
        translations: 1,
        fileTracking: 1,
        failures: 1,
      });
    } finally {
      cache.close();
    }
  });

  it("purges multiple locales at once", async () => {
    const dir = makeCacheDir();
    vi.spyOn(console, "log").mockImplementation(() => {});

    await runPurgeLocale({ cacheDir: dir, locales: ["de", "fr"], force: true });

    const cache = new TranslationCache(dir);
    try {
      expect(cache.countLocaleRows("de").translations).toBe(0);
      expect(cache.countLocaleRows("fr").translations).toBe(0);
    } finally {
      cache.close();
    }
  });

  it("writes a SQLite backup before deletion when backupPath is set", async () => {
    const dir = makeCacheDir();
    const backupDir = fs.mkdtempSync(path.join(os.tmpdir(), "purge-locale-bak-"));
    dirs.push(backupDir);
    const backupPath = path.join(backupDir, "cache.db");
    vi.spyOn(console, "log").mockImplementation(() => {});

    await runPurgeLocale({ cacheDir: dir, locales: ["de"], force: true, backupPath });

    expect(fs.existsSync(backupPath)).toBe(true);
    expect(fs.statSync(backupPath).size).toBeGreaterThan(0);

    const backup = new TranslationCache(backupDir);
    try {
      expect(backup.countLocaleRows("de").translations).toBe(1);
    } finally {
      backup.close();
    }

    const cache = new TranslationCache(dir);
    try {
      expect(cache.countLocaleRows("de").translations).toBe(0);
    } finally {
      cache.close();
    }
  });

  it("warns and does not prompt when a locale has no cached rows", async () => {
    const dir = makeCacheDir();
    vi.spyOn(console, "log").mockImplementation(() => {});
    const rlSpy = vi.spyOn(readline, "createInterface");

    await runPurgeLocale({ cacheDir: dir, locales: ["es"] });

    expect(rlSpy).not.toHaveBeenCalled();
    const cache = new TranslationCache(dir);
    try {
      expect(cache.countLocaleRows("de").translations).toBe(1);
      expect(cache.countLocaleRows("fr").translations).toBe(1);
    } finally {
      cache.close();
    }
  });
});

describe("runPurgeLocale with generated files", () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const d of roots) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    roots.length = 0;
    vi.restoreAllMocks();
  });

  function makeProject(): { root: string; cacheDir: string } {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-locale-proj-"));
    roots.push(root);

    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "intro.md"), "# Hi\n");

    for (const loc of ["de", "fr"]) {
      const outDir = path.join(root, "translated-docs", loc, "docs");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "intro.md"), `# Hi (${loc})\n`);
      fs.mkdirSync(path.join(root, "locales"), { recursive: true });
      fs.writeFileSync(
        path.join(root, "locales", `${loc}.json`),
        JSON.stringify({ Hi: `Hi-${loc}` }, null, 2)
      );
    }

    fs.writeFileSync(
      path.join(root, "strings.json"),
      JSON.stringify(
        {
          abc12345: {
            source: "Hi",
            translated: { de: "Hallo", fr: "Salut" },
            models: { de: "m", fr: "m" },
          },
        },
        null,
        2
      )
    );

    const cacheDir = path.join(root, ".cache");
    const cache = new TranslationCache(cacheDir);
    cache.setSegment("h-de", "de", "Hi", "Hallo", "m", "docs/intro.md", 1);
    cache.setSegment("h-fr", "fr", "Hi", "Salut", "m", "docs/intro.md", 1);
    cache.close();

    return { root, cacheDir };
  }

  it("removes translated docs, the flat file, and strings.json entries for the locale", async () => {
    const { root, cacheDir } = makeProject();
    const config = buildConfig();
    vi.spyOn(console, "log").mockImplementation(() => {});

    await runPurgeLocale({
      cacheDir,
      locales: ["de"],
      force: true,
      config,
      projectRoot: root,
    });

    expect(fs.existsSync(path.join(root, "translated-docs", "de", "docs", "intro.md"))).toBe(false);
    expect(fs.existsSync(path.join(root, "locales", "de.json"))).toBe(false);
    expect(fs.existsSync(path.join(root, "translated-docs", "fr", "docs", "intro.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "locales", "fr.json"))).toBe(true);

    const strings = JSON.parse(fs.readFileSync(path.join(root, "strings.json"), "utf8"));
    expect(strings.abc12345.translated.de).toBeUndefined();
    expect(strings.abc12345.models.de).toBeUndefined();
    expect(strings.abc12345.translated.fr).toBe("Salut");

    const cache = new TranslationCache(cacheDir);
    try {
      expect(cache.countLocaleRows("de").translations).toBe(0);
      expect(cache.countLocaleRows("fr").translations).toBe(1);
    } finally {
      cache.close();
    }
  });

  it("keepFiles purges only the cache and leaves files and strings.json intact", async () => {
    const { root, cacheDir } = makeProject();
    const config = buildConfig();
    vi.spyOn(console, "log").mockImplementation(() => {});

    await runPurgeLocale({
      cacheDir,
      locales: ["de"],
      force: true,
      keepFiles: true,
      config,
      projectRoot: root,
    });

    expect(fs.existsSync(path.join(root, "translated-docs", "de", "docs", "intro.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "locales", "de.json"))).toBe(true);
    const strings = JSON.parse(fs.readFileSync(path.join(root, "strings.json"), "utf8"));
    expect(strings.abc12345.translated.de).toBe("Hallo");

    const cache = new TranslationCache(cacheDir);
    try {
      expect(cache.countLocaleRows("de").translations).toBe(0);
    } finally {
      cache.close();
    }
  });

  it("sweeps orphaned translated outputs whose source was removed", async () => {
    const { root, cacheDir } = makeProject();
    const config = buildConfig();
    // Orphan: a translated doc under the locale dir with no corresponding source file.
    const orphan = path.join(root, "translated-docs", "de", "docs", "removed.md");
    fs.writeFileSync(orphan, "# orphan\n");
    vi.spyOn(console, "log").mockImplementation(() => {});

    await runPurgeLocale({ cacheDir, locales: ["de"], force: true, config, projectRoot: root });

    expect(fs.existsSync(orphan)).toBe(false);
    expect(fs.existsSync(path.join(root, "translated-docs", "fr", "docs", "intro.md"))).toBe(true);
  });

  it("sweeps flat-style outputs by locale filename suffix, including orphans", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-locale-flat-"));
    roots.push(root);
    const config = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["de", "fr"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: { translateDocs: true },
        ui: { sourceRoots: ["src"], stringsJson: "strings.json", flatOutputDir: "locales" },
        cacheDir: ".cache",
        docs: [
          {
            contentPaths: ["docs/GETTING_STARTED.md"],
            outputDir: "translated-docs",
            docsOutput: { style: "flat", flatPreserveRelativeDir: true },
          },
        ],
      })
    );
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "GETTING_STARTED.md"), "# Hi\n");
    fs.mkdirSync(path.join(root, "translated-docs", "docs"), { recursive: true });
    const current = path.join(root, "translated-docs", "docs", "GETTING_STARTED.fr.md");
    const orphan = path.join(root, "translated-docs", "docs", "REMOVED.fr.md");
    const otherLocale = path.join(root, "translated-docs", "docs", "GETTING_STARTED.de.md");
    fs.writeFileSync(current, "# Salut\n");
    fs.writeFileSync(orphan, "# orphan\n");
    fs.writeFileSync(otherLocale, "# Hallo\n");

    const cacheDir = path.join(root, ".cache");
    const cache = new TranslationCache(cacheDir);
    cache.setSegment("h", "fr", "Hi", "Salut", "m", "docs/GETTING_STARTED.md", 1);
    cache.close();

    vi.spyOn(console, "log").mockImplementation(() => {});
    await runPurgeLocale({ cacheDir, locales: ["fr"], force: true, config, projectRoot: root });

    expect(fs.existsSync(current)).toBe(false);
    expect(fs.existsSync(orphan)).toBe(false);
    expect(fs.existsSync(otherLocale)).toBe(true);
  });

  it("sweeps fumadocs dot-parser outputs by locale filename suffix", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-locale-fumadocs-dot-"));
    roots.push(root);
    const config = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["pt", "zh"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: { translateDocs: true },
        ui: { sourceRoots: ["src"], stringsJson: "strings.json", flatOutputDir: "locales" },
        cacheDir: ".cache",
        docs: [
          {
            contentPaths: ["content/docs"],
            outputDir: "content/docs",
            docsOutput: {
              style: "fumadocs",
              docsRoot: "content/docs",
              fumadocsParser: "dot",
            },
          },
        ],
      })
    );
    fs.mkdirSync(path.join(root, "content/docs/guide"), { recursive: true });
    fs.writeFileSync(path.join(root, "content/docs/index.mdx"), "# Hi\n");
    fs.writeFileSync(path.join(root, "content/docs/index.pt.mdx"), "# Olá\n");
    fs.writeFileSync(path.join(root, "content/docs/guide/start.zh.mdx"), "# 你好\n");

    const cacheDir = path.join(root, ".cache");
    vi.spyOn(console, "log").mockImplementation(() => {});
    await runPurgeLocale({ cacheDir, locales: ["pt"], force: true, config, projectRoot: root });

    expect(fs.existsSync(path.join(root, "content/docs/index.pt.mdx"))).toBe(false);
    expect(fs.existsSync(path.join(root, "content/docs/guide/start.zh.mdx"))).toBe(true);
  });

  it("dry-run reports files but deletes nothing", async () => {
    const { root, cacheDir } = makeProject();
    const config = buildConfig();
    vi.spyOn(console, "log").mockImplementation(() => {});

    await runPurgeLocale({
      cacheDir,
      locales: ["de"],
      dryRun: true,
      config,
      projectRoot: root,
    });

    expect(fs.existsSync(path.join(root, "translated-docs", "de", "docs", "intro.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "locales", "de.json"))).toBe(true);
    const strings = JSON.parse(fs.readFileSync(path.join(root, "strings.json"), "utf8"));
    expect(strings.abc12345.translated.de).toBe("Hallo");

    const cache = new TranslationCache(cacheDir);
    try {
      expect(cache.countLocaleRows("de").translations).toBe(1);
    } finally {
      cache.close();
    }
  });
});
