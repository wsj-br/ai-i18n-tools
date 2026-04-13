import fs from "fs";
import os from "os";
import path from "path";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { TranslationCache } from "../../src/core/cache.js";
import {
  createTranslationEditorApp,
  resolveEditCacheStaticDir,
} from "../../src/server/translation-editor.js";
import { USER_EDITED_MODEL } from "../../src/core/user-edited-model.js";

async function withHttpServer(
  app: ReturnType<typeof createTranslationEditorApp>,
  fn: (baseUrl: string) => Promise<void>
): Promise<void> {
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });
  const addr = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${addr.port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

describe("createTranslationEditorApp", () => {
  let cache: TranslationCache;

  afterEach(() => {
    cache?.close();
  });

  it("GET /api/health returns ok", async () => {
    cache = new TranslationCache(":memory:");
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/health`);
      expect(res.ok).toBe(true);
      expect(await res.json()).toEqual({ ok: true });
    });
  });

  it("GET /api/stats returns cache, uiStrings, and glossary aggregates", async () => {
    cache = new TranslationCache(":memory:");
    cache.setSegment("abc", "de", "src", "dst", "m1", "f.md", 1);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "te-stats-"));
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
      const app = createTranslationEditorApp(cache, {
        cwd: dir,
        sourceLocale: "en",
        targetLocales: ["de", "fr"],
        stringsJsonPath: "strings.json",
        glossaryUserPath: "glossary-user.csv",
      });
      await withHttpServer(app, async (base) => {
        const res = await fetch(`${base}/api/stats`);
        expect(res.ok).toBe(true);
        const data = (await res.json()) as {
          cache: {
            totalSegments: number;
            byLocale: Array<{ locale: string; total: number }>;
            byModel: Array<{ model: string; count: number }>;
            byModelLocale: Array<{ model: string; locale: string; count: number }>;
          };
          uiStrings: {
            available: boolean;
            totalEntries: number;
            byLocale: Array<{ locale: string; translated: number; missing: number }>;
            byModel: Array<{ model: string; count: number }>;
            byModelLocale: Array<{ model: string; locale: string; count: number }>;
          };
          glossary: { available: boolean; totalTerms: number; byLocale: Array<{ locale: string; count: number }> };
        };
        expect(data.cache.totalSegments).toBe(1);
        expect(data.cache.byLocale.some((r) => r.locale === "de")).toBe(true);
        expect(data.cache.byModel.some((r) => r.model === "m1")).toBe(true);
        expect(data.cache.byModelLocale.some((r) => r.model === "m1" && r.locale === "de")).toBe(true);
        expect(data.uiStrings.available).toBe(true);
        expect(data.uiStrings.totalEntries).toBe(2);
        const deUi = data.uiStrings.byLocale.find((x) => x.locale === "de");
        expect(deUi?.missing).toBe(1);
        expect(data.uiStrings.byModel).toEqual([
          { model: "(unknown)", count: 1 },
          { model: "model-a", count: 1 },
        ]);
        const mLocArr = [...data.uiStrings.byModelLocale].sort((a, b) => a.model.localeCompare(b.model));
        expect(mLocArr).toEqual([
          { model: "(unknown)", locale: "fr", count: 1 },
          { model: "model-a", locale: "de", count: 1 },
        ]);
        expect(data.glossary.available).toBe(true);
        expect(data.glossary.totalTerms).toBe(2);
        expect(data.glossary.byLocale.find((x) => x.locale === "de")?.count).toBe(1);
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("PATCH /api/translations returns 400 when fields missing", async () => {
    cache = new TranslationCache(":memory:");
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/translations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  it("PATCH /api/translations sets model to user-edited", async () => {
    cache = new TranslationCache(":memory:");
    cache.setSegment("sh1", "de", "src line", "dst line", "openrouter/x", "f.md", 1);
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    await withHttpServer(app, async (base) => {
      const patch = await fetch(`${base}/api/translations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_hash: "sh1",
          locale: "de",
          translated_text: "edited",
        }),
      });
      expect(patch.ok).toBe(true);
      const list = await fetch(`${base}/api/translations?page=1&pageSize=10`);
      const data = (await list.json()) as {
        rows: Array<{ source_hash: string; translated_text: string; model: string }>;
      };
      const row = data.rows.find((r) => r.source_hash === "sh1");
      expect(row?.translated_text).toBe("edited");
      expect(row?.model).toBe(USER_EDITED_MODEL);
    });
  });

  it("GET /api/translations lists rows", async () => {
    cache = new TranslationCache(":memory:");
    cache.setSegment("abc", "de", "src", "dst", "m", "f.md", 1);
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/translations?page=1&pageSize=10`);
      const data = (await res.json()) as { rows: unknown[]; total: number };
      expect(data.total).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });

  it("GET /api/ui-strings returns 404 when strings.json missing", async () => {
    cache = new TranslationCache(":memory:");
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
      stringsJsonPath: path.join("/nonexistent", "strings.json"),
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/ui-strings`);
      expect(res.status).toBe(404);
    });
  });

  it("GET /api/ui-strings returns entries from strings.json", async () => {
    cache = new TranslationCache(":memory:");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "te-ui-"));
    const sj = path.join(dir, "strings.json");
    fs.writeFileSync(
      sj,
      JSON.stringify({
        h1: { source: "Hello", translated: { de: "Hallo" }, models: { de: "model-a" } },
      }),
      "utf8"
    );
    try {
      const app = createTranslationEditorApp(cache, {
        cwd: dir,
        sourceLocale: "en",
        targetLocales: ["de"],
        stringsJsonPath: "strings.json",
      });
      await withHttpServer(app, async (base) => {
        const res = await fetch(`${base}/api/ui-strings`);
        expect(res.ok).toBe(true);
        const data = (await res.json()) as {
          entries: Array<{ id: string; source: string; models?: Record<string, string> }>;
        };
        const row = data.entries.find((e) => e.id === "h1");
        expect(row?.source).toBe("Hello");
        expect(row?.models?.de).toBe("model-a");
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("POST /api/glossary-user returns 400 when glossary path not configured", async () => {
    cache = new TranslationCache(":memory:");
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/glossary-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: "a", locale: "de", translation: "b" }),
      });
      expect(res.status).toBe(400);
    });
  });

  it("GET /api/glossary-user returns 500 when CSV is invalid", async () => {
    cache = new TranslationCache(":memory:");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "te-gloss-bad-"));
    const gpath = path.join(dir, "bad.csv");
    fs.writeFileSync(gpath, '"unclosed', "utf8");
    try {
      const app = createTranslationEditorApp(cache, {
        cwd: dir,
        sourceLocale: "en",
        targetLocales: ["de"],
        glossaryUserPath: "bad.csv",
      });
      await withHttpServer(app, async (base) => {
        const res = await fetch(`${base}/api/glossary-user`);
        expect(res.status).toBe(500);
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("GET /api/glossary-user returns empty rows when file missing", async () => {
    cache = new TranslationCache(":memory:");
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
      glossaryUserPath: path.join("/tmp", "missing-glossary.csv"),
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/glossary-user`);
      expect(res.ok).toBe(true);
      const data = (await res.json()) as { rows: unknown[] };
      expect(data.rows).toEqual([]);
    });
  });

  it("GET /api/locales, /api/models, /api/filepaths", async () => {
    cache = new TranslationCache(":memory:");
    cache.setSegment("h1", "de", "s", "t", "model-x", "doc.md", 1);
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de", "fr"],
    });
    await withHttpServer(app, async (base) => {
      const loc = await (await fetch(`${base}/api/locales`)).json();
      expect(loc).toMatchObject({ sourceLocale: "en" });
      const mods = await (await fetch(`${base}/api/models`)).json();
      expect((mods as { models: string[] }).models).toContain("model-x");
      const fps = await (await fetch(`${base}/api/filepaths`)).json();
      expect((fps as { filepaths: string[] }).filepaths).toContain("doc.md");
    });
  });

  it("PATCH /api/translations updates row", async () => {
    cache = new TranslationCache(":memory:");
    cache.setSegment("sh", "de", "src", "old", "m", "f.md", 1);
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/translations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_hash: "sh",
          locale: "de",
          translated_text: "neu",
        }),
      });
      expect(res.ok).toBe(true);
      expect(cache.getSegment("sh", "de")).toBe("neu");
    });
  });

  it("DELETE /api/translations/:hash/:locale", async () => {
    cache = new TranslationCache(":memory:");
    cache.setSegment("delh", "fr", "a", "b", "m", "x.md", 1);
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["fr"],
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(
        `${base}/api/translations/${encodeURIComponent("delh")}/${encodeURIComponent("fr")}`,
        { method: "DELETE" }
      );
      expect(res.ok).toBe(true);
      expect(cache.getSegment("delh", "fr")).toBeNull();
    });
  });

  it("DELETE /api/translations/by-filters removes rows", async () => {
    cache = new TranslationCache(":memory:");
    cache.setSegment("fh", "de", "a", "b", "m", "z.md", 1);
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/translations/by-filters?locale=de`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { deleted: number };
      expect(data.deleted).toBeGreaterThanOrEqual(1);
    });
  });

  it("DELETE /api/translations/by-filepath", async () => {
    cache = new TranslationCache(":memory:");
    cache.setSegment("ph", "de", "a", "b", "m", "only.md", 1);
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(
        `${base}/api/translations/by-filepath?filepath=${encodeURIComponent("only.md")}`,
        { method: "DELETE" }
      );
      expect(res.ok).toBe(true);
    });
  });

  it("DELETE /api/translations/by-filepath returns 400 without filepath", async () => {
    cache = new TranslationCache(":memory:");
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/translations/by-filepath`, { method: "DELETE" });
      expect(res.status).toBe(400);
    });
  });

  it("POST /api/log-links returns 400 when fields missing", async () => {
    cache = new TranslationCache(":memory:");
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/log-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  it("POST /api/log-links succeeds with filepath and locale", async () => {
    cache = new TranslationCache(":memory:");
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
      jsonSource: "docs-site/i18n/en",
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/log-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath: "code.json", locale: "de", start_line: 3 }),
      });
      expect(res.ok).toBe(true);
    });
  });

  it("POST /api/ui-log-links iterates locations", async () => {
    cache = new TranslationCache(":memory:");
    const app = createTranslationEditorApp(cache, {
      cwd: "/tmp",
      sourceLocale: "en",
      targetLocales: ["de"],
    });
    await withHttpServer(app, async (base) => {
      const res = await fetch(`${base}/api/ui-log-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations: [{ file: "a.tsx", line: 2 }, { filepath: "b.tsx" }],
        }),
      });
      expect(res.ok).toBe(true);
    });
  });

  it("GET /api/ui-strings/meta reflects availability", async () => {
    cache = new TranslationCache(":memory:");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "te-meta-"));
    const sj = path.join(dir, "strings.json");
    fs.writeFileSync(sj, "{}\n", "utf8");
    try {
      const app = createTranslationEditorApp(cache, {
        cwd: dir,
        sourceLocale: "en",
        targetLocales: ["de"],
        stringsJsonPath: "strings.json",
      });
      await withHttpServer(app, async (base) => {
        const res = await fetch(`${base}/api/ui-strings/meta`);
        const data = (await res.json()) as { available: boolean; path: string | null };
        expect(data.available).toBe(true);
        expect(data.path).toBe(sj);
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("PATCH and DELETE ui-strings rows", async () => {
    cache = new TranslationCache(":memory:");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "te-patch-"));
    const sj = path.join(dir, "strings.json");
    fs.writeFileSync(
      sj,
      JSON.stringify({
        id1: {
          source: "Hi",
          translated: { de: "Hallo", fr: "Salut" },
          locations: [{ file: "x.tsx", line: 1 }],
        },
      }),
      "utf8"
    );
    try {
      const app = createTranslationEditorApp(cache, {
        cwd: dir,
        sourceLocale: "en",
        targetLocales: ["de", "fr"],
        stringsJsonPath: "strings.json",
      });
      await withHttpServer(app, async (base) => {
        const patch = await fetch(`${base}/api/ui-strings/id1`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translated: { de: "Hoi" } }),
        });
        expect(patch.ok).toBe(true);
        const doc = JSON.parse(fs.readFileSync(sj, "utf8")) as {
          id1: { translated: Record<string, string>; models?: Record<string, string> };
        };
        expect(doc.id1.translated.de).toBe("Hoi");
        expect(doc.id1.models?.de).toBe(USER_EDITED_MODEL);
        expect(doc.id1.models?.fr).toBe(undefined);

        const del404 = await fetch(`${base}/api/ui-strings/unknown`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: "de" }),
        });
        expect(del404.status).toBe(404);

        const del400 = await fetch(`${base}/api/ui-strings/id1`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        expect(del400.status).toBe(400);

        const delOk = await fetch(`${base}/api/ui-strings/id1`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: "fr" }),
        });
        expect(delOk.ok).toBe(true);

        const bulk400 = await fetch(`${base}/api/ui-strings/delete-rows`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: [] }),
        });
        expect(bulk400.status).toBe(400);

        const bulkOk = await fetch(`${base}/api/ui-strings/delete-rows`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: [{ id: "id1", locale: "de" }] }),
        });
        expect(bulkOk.ok).toBe(true);
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("POST /api/glossary-user writes CSV and PATCH/DELETE rows", async () => {
    cache = new TranslationCache(":memory:");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "te-gloss-"));
    const gpath = path.join(dir, "glossary-user.csv");
    try {
      const app = createTranslationEditorApp(cache, {
        cwd: dir,
        sourceLocale: "en",
        targetLocales: ["de"],
        glossaryUserPath: "glossary-user.csv",
      });
      await withHttpServer(app, async (base) => {
        const post = await fetch(`${base}/api/glossary-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original: "hello",
            locale: "de",
            translation: "hallo",
          }),
        });
        expect(post.ok).toBe(true);
        expect(fs.existsSync(gpath)).toBe(true);

        const get = await fetch(`${base}/api/glossary-user`);
        const rows = (await get.json()) as { rows: Array<{ rowIndex: number }> };
        expect(rows.rows.length).toBeGreaterThanOrEqual(1);

        const patch = await fetch(`${base}/api/glossary-user/0`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original: "hello",
            locale: "de",
            translation: "hallo!",
          }),
        });
        expect(patch.ok).toBe(true);

        const del = await fetch(`${base}/api/glossary-user/0`, { method: "DELETE" });
        expect(del.ok).toBe(true);

        const patch400 = await fetch(`${base}/api/glossary-user/99`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original: "x",
            locale: "de",
            translation: "y",
          }),
        });
        expect(patch400.status).toBe(404);

        const patchBadIdx = await fetch(`${base}/api/glossary-user/not-a-number`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ original: "a", locale: "b", translation: "c" }),
        });
        expect(patchBadIdx.status).toBe(400);

        const postMissing = await fetch(`${base}/api/glossary-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ original: "", locale: "de", translation: "x" }),
        });
        expect(postMissing.status).toBe(400);

        const delBad = await fetch(`${base}/api/glossary-user/NaN`, { method: "DELETE" });
        expect(delBad.status).toBe(400);

        await fetch(`${base}/api/glossary-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ original: "row2", locale: "de", translation: "r2" }),
        });
        const del404 = await fetch(`${base}/api/glossary-user/5`, { method: "DELETE" });
        expect(del404.status).toBe(404);

        const patchMissing = await fetch(`${base}/api/glossary-user/0`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ original: "a" }),
        });
        expect(patchMissing.status).toBe(400);

        const meta = await fetch(`${base}/api/glossary-user/meta`);
        expect(meta.ok).toBe(true);
        const metaJson = (await meta.json()) as { available: boolean; path: string };
        expect(metaJson.available).toBe(true);
        expect(metaJson.path).toBe(gpath);
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("resolveEditCacheStaticDir returns a path under src/server", () => {
    cache = new TranslationCache(":memory:");
    const d = resolveEditCacheStaticDir();
    expect(d).toContain("edit-cache-app");
    expect(fs.existsSync(d)).toBe(true);
  });
});
