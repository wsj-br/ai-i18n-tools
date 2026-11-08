import fs from "fs";
import os from "os";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { describeRuntime, runDoctor } from "../../src/cli/doctor.js";
import { DEFAULT_GITIGNORE_BLOCK } from "../../src/cli/project-gitignore.js";
import { UI_SOURCE_LOCALE, initUiI18n } from "../../src/i18n/index.js";
import { stripAnsi } from "../../src/utils/logger.js";
import { displayWidth } from "../../src/utils/table.js";
import { PACKAGE_VERSION } from "../../src/build-info.generated.js";
import { TranslationCache } from "../../src/core/cache.js";
import { BENCHMARK_CACHE_VERSION } from "../../src/core/model-benchmarks.js";

const ENV_KEYS = [
  "OPENROUTER_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "DEEPSEEK_API_KEY",
  "CEREBRAS_API_KEY",
  "GROQ_API_KEY",
  "MISTRAL_API_KEY",
  "XAI_API_KEY",
  "NVIDIA_API_KEY",
  "ALIBABA_API_KEY",
  "APIKEYFAN_API_KEY",
  "APIFUN_API_KEY",
  "CHEAPERINFERENCE_API_KEY",
  "OPENROUTER_BASE_URL",
  "OLLAMA_BASE_URL",
  "AI_I18N_LANG",
  "I18N_SOURCE_LOCALE",
  "I18N_TARGET_LOCALES",
  "I18N_LOG_LEVEL",
  "NO_COLOR",
  "I18N_LOG_SESSION_MAX",
  "BROWSER",
  "SOURCE_DATE_EPOCH",
];

function uiConfig(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sourceLocale: "en-GB",
    targetLocales: ["de"],
    provider: "openrouter",
    providers: { openrouter: { translationModels: ["m1"] } },
    features: {
      translateUIStrings: true,
      translateDocs: false,
      translateJson: false,
      translateSVG: false,
    },
    ui: { sourceRoots: ["src"], stringsJson: "strings.json", flatOutputDir: "locales" },
    cacheDir: ".translation-cache",
    ...extra,
  };
}

function writeProject(root: string, config: unknown, files: Record<string, string> = {}): void {
  fs.writeFileSync(path.join(root, "ai-i18n-tools.config.json"), JSON.stringify(config));
  for (const [rel, contents] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, contents);
  }
}

function messages(result: { checks: { message: string; status: string }[] }): string {
  return result.checks.map((check) => `${check.status}:${check.message}`).join("\n");
}

describe("runDoctor", () => {
  let root: string;
  const saved = new Map<string, string | undefined>();
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-"));
    for (const key of ENV_KEYS) {
      saved.set(key, process.env[key]);
      delete process.env[key];
    }
    log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    for (const [key, value] of saved) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("passes a local UI project without creating a cache database", async () => {
    process.env.OPENROUTER_API_KEY = "doctor-secret-token";
    writeProject(root, uiConfig(), { "src/main.ts": "export const label = t('Hello');\n" });
    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "/usr/bin/node",
      argv1: "/app/bin/ai-i18n-tools.mjs",
      fetchImpl: () => {
        throw new Error("network");
      },
    });
    const text = messages(result);
    expect(result.exitCode).toBe(0);
    expect(text).toContain("version");
    expect(text).toContain("1 translationModels configured for openrouter");
    expect(text).toContain("Node.js package /app/bin/ai-i18n-tools.mjs");
    expect(text).toContain("pass:ui[0] sourceRoots src");
    expect(text).toContain("created on first run");
    expect(text).not.toContain("doctor-secret-token");
    expect(fs.existsSync(path.join(root, ".translation-cache", "cache.db"))).toBe(false);
    expect(log.mock.calls.join("\n")).not.toContain("doctor-secret-token");
  });

  it("accepts and redacts the legacy apikeyfan API key during a catalog check", async () => {
    process.env.APIFUN_API_KEY = "legacy-secret-token";
    writeProject(
      root,
      uiConfig({ provider: "apikeyfan", providers: { apikeyfan: { translationModels: ["m1"] } } }),
      { "src/main.ts": "export const label = t('Hello');\n" }
    );
    let catalogAuth: string | undefined;
    const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
      if (String(url).includes("api.github.com")) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ tag_name: `v${PACKAGE_VERSION}` }),
        };
      }
      catalogAuth = new Headers(init?.headers).get("Authorization") ?? undefined;
      return { ok: true, status: 200, text: async () => JSON.stringify({ data: [{ id: "m1" }] }) };
    }) as typeof fetch;
    const result = await runDoctor({
      cwd: root,
      fetchImpl,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(result.exitCode).toBe(0);
    expect(catalogAuth).toBe("Bearer legacy-secret-token");
    expect(messages(result)).toContain("1 translationModels configured for apikeyfan");
    expect(messages(result)).toContain("the configured model is valid in apikeyfan's catalog");
    expect(messages(result)).toContain("APIFUN_API_KEY is set");
    expect(JSON.stringify(result)).not.toContain("legacy-secret-token");
  });

  it("fails when a configured model is missing from the catalog and skips the network with --local", async () => {
    process.env.OPENROUTER_API_KEY = "doctor-secret-token";
    writeProject(root, uiConfig(), { "src/main.ts": "export const label = t('Hello');\n" });
    const calls: string[] = [];
    const fetchImpl = (async (url: string | URL) => {
      calls.push(String(url));
      const address = String(url);
      if (address.includes("api.github.com")) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ tag_name: `v${PACKAGE_VERSION}` }),
        };
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: [{ id: "other-model" }] }),
      };
    }) as typeof fetch;

    const online = await runDoctor({
      cwd: root,
      fetchImpl,
      sea: false,
      execPath: "/usr/bin/node",
      argv1: "cli",
    });
    expect(online.exitCode).toBe(1);
    expect(messages(online)).toContain("1 translationModels configured for openrouter");
    expect(messages(online)).toContain(
      "the configured model is missing from openrouter's catalog: m1"
    );
    expect(online.checks.filter((check) => check.message.startsWith("version "))).toEqual([
      expect.objectContaining({
        message: expect.stringMatching(/^version .+ \(latest release\)$/),
      }),
    ]);
    expect(calls.some((url) => url.includes("models"))).toBe(true);

    calls.length = 0;
    const local = await runDoctor({
      cwd: root,
      local: true,
      fetchImpl,
      sea: false,
      execPath: "/usr/bin/node",
      argv1: "cli",
    });
    expect(local.exitCode).toBe(0);
    expect(calls).toEqual([]);
    expect(messages(local)).toContain("provider catalog was not checked");
  });

  it("reports every configured model as valid, missing, or past its expiration date", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    const fetchCatalog = (data: Array<{ id: string; expiration_date?: string }>): typeof fetch =>
      (async (url: string | URL) => {
        if (String(url).includes("api.github.com")) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ tag_name: `v${PACKAGE_VERSION}` }),
          };
        }
        return { ok: true, status: 200, text: async () => JSON.stringify({ data }) };
      }) as typeof fetch;

    writeProject(
      root,
      uiConfig({
        providers: { openrouter: { translationModels: ["keep", "also"] } },
      }),
      { "src/main.ts": "export const label = t('Hello');\n" }
    );
    const valid = await runDoctor({
      cwd: root,
      fetchImpl: fetchCatalog([{ id: "keep" }, { id: "also" }]),
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(valid.exitCode).toBe(0);
    expect(messages(valid)).toContain("2 translationModels configured for openrouter");
    expect(messages(valid)).toContain("all 2 configured models are valid in openrouter's catalog");

    const oneMissing = await runDoctor({
      cwd: root,
      fetchImpl: fetchCatalog([{ id: "keep" }]),
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(oneMissing.exitCode).toBe(1);
    expect(messages(oneMissing)).toContain(
      "1 of 2 configured models is missing from openrouter's catalog: also"
    );

    writeProject(
      root,
      uiConfig({
        providers: { openrouter: { translationModels: ["keep", "gone-a", "gone-b"] } },
      }),
      { "src/main.ts": "export const label = t('Hello');\n" }
    );
    const someMissing = await runDoctor({
      cwd: root,
      fetchImpl: fetchCatalog([{ id: "keep" }]),
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(someMissing.exitCode).toBe(1);
    expect(messages(someMissing)).toContain(
      "2 of 3 configured models are missing from openrouter's catalog: gone-a, gone-b"
    );

    const allMissing = await runDoctor({
      cwd: root,
      fetchImpl: fetchCatalog([{ id: "other" }]),
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(allMissing.exitCode).toBe(1);
    expect(messages(allMissing)).toContain(
      "all 3 configured models are missing from openrouter's catalog: keep, gone-a, gone-b"
    );

    writeProject(
      root,
      uiConfig({
        providers: { openrouter: { translationModels: ["old"] } },
      }),
      { "src/main.ts": "export const label = t('Hello');\n" }
    );
    const expiredOnly = await runDoctor({
      cwd: root,
      fetchImpl: fetchCatalog([{ id: "old", expiration_date: "1999-06-01T00:00:00Z" }]),
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(expiredOnly.exitCode).toBe(1);
    expect(messages(expiredOnly)).toContain(
      "the configured model is past its expiration date in openrouter's catalog: old (1999-06-01)"
    );

    writeProject(
      root,
      uiConfig({
        providers: { openrouter: { translationModels: ["keep", "old-a", "old-b"] } },
      }),
      { "src/main.ts": "export const label = t('Hello');\n" }
    );
    const expiredSome = await runDoctor({
      cwd: root,
      fetchImpl: fetchCatalog([
        { id: "keep" },
        { id: "old-a", expiration_date: "1999-01-01" },
        { id: "old-b", expiration_date: "1999-06-01" },
      ]),
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(expiredSome.exitCode).toBe(1);
    expect(messages(expiredSome)).toContain(
      "2 of 3 configured models are past their expiration date in openrouter's catalog: old-a (1999-01-01), old-b (1999-06-01)"
    );

    writeProject(
      root,
      uiConfig({
        providers: { openrouter: { translationModels: ["old-a", "old-b"] } },
      }),
      { "src/main.ts": "export const label = t('Hello');\n" }
    );
    const expiredAll = await runDoctor({
      cwd: root,
      fetchImpl: fetchCatalog([
        { id: "old-a", expiration_date: "1999-01-01" },
        { id: "old-b", expiration_date: "1999-06-01" },
      ]),
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(expiredAll.exitCode).toBe(1);
    expect(messages(expiredAll)).toContain(
      "all 2 configured models are past their expiration date in openrouter's catalog: old-a (1999-01-01), old-b (1999-06-01)"
    );

    writeProject(
      root,
      uiConfig({
        providers: {
          openrouter: { translationModels: ["keep", "gone"], uiModels: ["ui-only"] },
        },
      }),
      { "src/main.ts": "export const label = t('Hello');\n" }
    );
    const mixed = await runDoctor({
      cwd: root,
      fetchImpl: fetchCatalog([{ id: "keep" }, { id: "ui-only", expiration_date: "2001-02-03" }]),
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(mixed.exitCode).toBe(1);
    expect(messages(mixed)).toContain("2 translationModels configured for openrouter");
    expect(messages(mixed)).toContain(
      "1 of 3 configured models is missing from openrouter's catalog: gone"
    );
    expect(messages(mixed)).toContain(
      "1 of 3 configured models is past its expiration date in openrouter's catalog: ui-only (2001-02-03)"
    );
    expect(messages(mixed)).not.toContain("models in openrouter's catalog");
  });

  it("warns when GitHub has a newer release and does not request it with --local", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(root, uiConfig(), { "src/main.ts": "export const label = t('Hello');\n" });
    const fetchImpl = (async (url: string | URL) => {
      const address = String(url);
      if (address.includes("api.github.com")) {
        return { ok: true, status: 200, text: async () => JSON.stringify({ tag_name: "v9.9.9" }) };
      }
      return { ok: true, status: 200, text: async () => JSON.stringify({ data: [{ id: "m1" }] }) };
    }) as typeof fetch;
    const online = await runDoctor({
      cwd: root,
      fetchImpl,
      sea: false,
      execPath: "/usr/bin/node",
      argv1: "cli",
    });
    expect(online.exitCode).toBe(0);
    expect(messages(online)).toContain("upgrade available: 9.9.9");

    let called = false;
    const local = await runDoctor({
      cwd: root,
      local: true,
      fetchImpl: (() => {
        called = true;
        throw new Error("network");
      }) as typeof fetch,
      sea: false,
      execPath: "/usr/bin/node",
      argv1: "cli",
    });
    expect(called).toBe(false);
    expect(local.exitCode).toBe(0);
    expect(messages(local)).toContain("GitHub release was not checked");
  });

  it("warns when the GitHub request fails without failing the command", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(root, uiConfig(), { "src/main.ts": "export const label = t('Hello');\n" });
    const fetchImpl = (async (url: string | URL) => {
      if (String(url).includes("api.github.com")) {
        return { ok: false, status: 503, text: async () => "" };
      }
      return { ok: true, status: 200, text: async () => JSON.stringify({ data: [{ id: "m1" }] }) };
    }) as typeof fetch;
    const result = await runDoctor({
      cwd: root,
      fetchImpl,
      sea: false,
      execPath: "/usr/bin/node",
      argv1: "cli",
    });
    expect(result.exitCode).toBe(0);
    expect(
      result.checks.some((check) => check.status === "warn" && check.message.includes("GitHub"))
    ).toBe(true);
  });

  it("reports invalid JSON and does not check paths", async () => {
    fs.writeFileSync(path.join(root, "ai-i18n-tools.config.json"), "{");
    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(result.exitCode).toBe(1);
    expect(messages(result)).toContain("Invalid JSON");
    expect(messages(result)).not.toContain("sourceRoots");
  });

  it("stops after schema errors", async () => {
    writeProject(
      root,
      uiConfig({ batchSize: -1, ui: { sourceRoots: ["missing-root-should-not-be-checked"] } })
    );
    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(result.exitCode).toBe(1);
    expect(messages(result)).toContain("batchSize");
    expect(messages(result)).not.toContain("missing-root-should-not-be-checked");
  });

  it("reports every business-rule problem", async () => {
    writeProject(
      root,
      uiConfig({
        features: {
          translateUIStrings: false,
          translateDocs: true,
          translateJson: true,
          translateSVG: false,
        },
        ui: { sourceRoots: [] },
        docs: [{ contentPaths: [] }],
        json: [],
      })
    );
    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    const text = messages(result);
    expect(text).toContain("translateJson is enabled but json[] has no contentPaths entries");
    expect(text).toContain("docs[].contentPaths must be non-empty");
  });

  it("fails when a source root or docs glob is missing and notes a missing output directory", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(
      root,
      uiConfig({
        features: {
          translateUIStrings: true,
          translateDocs: true,
          translateJson: false,
          translateSVG: false,
        },
        ui: { sourceRoots: ["missing-src"] },
        docs: [{ contentPaths: ["docs/**/*.md"], outputDir: "i18n" }],
      })
    );
    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    const text = messages(result);
    expect(result.exitCode).toBe(1);
    expect(text).toContain("missing-src");
    expect(text).toContain("docs/**/*.md");
    expect(text).toContain("i18n");
    expect(text).toContain("created on first run");
  });

  it("fails when the active API key is missing and never prints a secret", async () => {
    process.env.OPENAI_API_KEY = "doctor-secret-token";
    writeProject(root, uiConfig(), { "src/main.ts": "export const label = t('Hello');\n" });
    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(result.exitCode).toBe(1);
    expect(messages(result)).toContain("OPENROUTER_API_KEY is not set");
    expect(log.mock.calls.join("\n")).not.toContain("doctor-secret-token");
  });

  it("lists every configured provider and a set key for an inactive provider", async () => {
    process.env.OPENROUTER_API_KEY = "router-secret-token";
    process.env.OPENAI_API_KEY = "openai-secret-token";
    process.env.AI_I18N_LANG = "pt-BR";
    writeProject(
      root,
      uiConfig({
        providers: {
          openrouter: { translationModels: ["m1"] },
          openai: { translationModels: ["gpt-4o-mini"] },
        },
      }),
      { "src/main.ts": "export const label = t('Hello');\n" }
    );
    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    const text = messages(result);
    expect(text).toContain(
      "openrouter (active, OPENROUTER_API_KEY is set, baseUrl https://openrouter.ai/api/v1)"
    );
    expect(text).toContain("openai (OPENAI_API_KEY is set, baseUrl https://api.openai.com/v1)");
    expect(text).toContain(
      "Configured variables: AI_I18N_LANG=pt-BR, OPENAI_API_KEY, OPENROUTER_API_KEY"
    );
    expect(text).not.toContain("I18N_LOG_LEVEL");
    expect(log.mock.calls.join("\n")).not.toContain("router-secret-token");
    expect(log.mock.calls.join("\n")).not.toContain("openai-secret-token");
  });

  it("does not require an API key for Ollama", async () => {
    writeProject(
      root,
      uiConfig({
        provider: "ollama",
        providers: { ollama: { translationModels: ["llama3.1"] } },
      }),
      { "src/main.ts": "export const label = t('Hello');\n" }
    );
    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(result.exitCode).toBe(0);
    expect(messages(result)).toContain(
      "ollama (active, API key is not required, baseUrl http://localhost:11434/v1)"
    );
  });

  it("counts UI catalog files and notes when they are absent", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(root, uiConfig(), {
      "src/main.ts": "export const label = t('Hello');\n",
      "strings.json": JSON.stringify({ a: { source: "A" }, b: { source: "B" } }),
      "locales/ui-languages.json": JSON.stringify([
        { code: "de", label: "Deutsch", englishName: "German", direction: "ltr" },
      ]),
    });
    const present = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(messages(present)).toContain("2 keys");
    expect(messages(present)).toContain("1 entries");

    fs.rmSync(path.join(root, "strings.json"));
    fs.rmSync(path.join(root, "locales", "ui-languages.json"));
    const absent = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(absent.exitCode).toBe(0);
    const absentText = messages(absent);
    expect(absentText).toContain("strings.json is missing");
    expect(absentText).toContain("ui-languages.json is missing");
    expect(
      absent.checks
        .filter((check) => check.message.includes("strings.json"))
        .every((check) => check.status !== "fail")
    ).toBe(true);
  });

  it("reads cache statistics without migrating the database", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(root, uiConfig(), { "src/main.ts": "export const label = t('Hello');\n" });
    const cacheDir = path.join(root, ".translation-cache");
    const cache = new TranslationCache(cacheDir);
    cache.setSegment("hash", "de", "Hello", "Hallo", "m1", "src/main.ts");
    cache.setFileStatus("src/main.ts", "de", "abc");
    // Detail rows older than seven UTC days are rolled up on close, so use a recent timestamp.
    const recentCallAt = new Date(Date.now() - 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    cache.recordApiCall({
      provider: "openrouter",
      model: "m1",
      operation: "translate-ui",
      locale: "de",
      outcome: "accepted",
      inputTokens: 3,
      outputTokens: 4,
      totalTokens: 7,
      createdAt: recentCallAt,
    });
    cache.close();
    const dbFile = path.join(cacheDir, "cache.db");
    const before = new DatabaseSync(dbFile, { readOnly: true });
    const versionBefore = (before.prepare("PRAGMA user_version").get() as { user_version: number })
      .user_version;
    before.close();
    const walBefore = fs.existsSync(`${dbFile}-wal`);

    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    const text = messages(result);
    expect(text).toContain("translation segments 1");
    expect(text).toContain("API calls 1");
    expect(text).toContain(recentCallAt);
    expect(text).toContain("tracked files");

    const after = new DatabaseSync(dbFile, { readOnly: true });
    const versionAfter = (after.prepare("PRAGMA user_version").get() as { user_version: number })
      .user_version;
    after.close();
    expect(versionAfter).toBe(versionBefore);
    if (!walBefore) {
      expect(fs.existsSync(`${dbFile}-wal`)).toBe(false);
    }
  });

  it("summarizes benchmark-scores.json and notes when it is absent", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(root, uiConfig(), { "src/main.ts": "export const label = t('Hello');\n" });
    const absent = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(messages(absent)).toContain("benchmark-scores.json is absent");

    const bench = {
      cacheVersion: BENCHMARK_CACHE_VERSION,
      sources: {
        languagebench: {
          url: "u",
          license: "l",
          attribution: "a",
          fetchedAt: "2026-10-21T00:00:00.000Z",
          error: null,
        },
        arena: { url: "u", license: "l", attribution: "a", fetchedAt: null, error: null },
        modelsDev: { url: "u", license: "l", attribution: "a", fetchedAt: null, error: null },
      },
      languagebench: {
        models: { a: { chrfByBcp47: {}, cost: null }, b: { chrfByBcp47: {}, cost: null } },
      },
      arena: { models: [{ model: "a", vendor: "v", score: 1, publishDate: null }] },
      modelsDev: { pricing: { a: { input: 1, output: 2 }, b: { input: null, output: null } } },
    };
    fs.mkdirSync(path.join(root, ".translation-cache"), { recursive: true });
    fs.writeFileSync(
      path.join(root, ".translation-cache", "benchmark-scores.json"),
      JSON.stringify(bench)
    );
    const present = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(messages(present)).toContain(
      "languagebench 2, arena 1, models.dev 2 (fetched 2026-10-21)"
    );

    initUiI18n("pt-BR");
    try {
      const translated = await runDoctor({
        cwd: root,
        local: true,
        sea: false,
        execPath: "node",
        argv1: "cli",
      });
      expect(messages(translated)).toContain(
        "languagebench 2, arena 1, models.dev 2 (obtido 2026-10-21)"
      );
    } finally {
      initUiI18n(UI_SOURCE_LOCALE);
    }
  });

  it("fails on a missing context file and warns on a missing user glossary", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(
      root,
      uiConfig({
        glossary: { userGlossary: "glossary-user.csv", contextFiles: ["notes/missing.md"] },
      }),
      { "src/main.ts": "export const label = t('Hello');\n" }
    );
    const warned = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(warned.exitCode).toBe(1);
    expect(messages(warned)).toContain("glossary.contextFiles");
    expect(messages(warned)).toContain("glossary-user.csv is missing");

    writeProject(root, uiConfig({ glossary: { userGlossary: "glossary-user.csv" } }), {
      "src/main.ts": "export const label = t('Hello');\n",
    });
    const glossaryOnly = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(glossaryOnly.exitCode).toBe(0);
    expect(glossaryOnly.checks.some((check) => check.status === "warn")).toBe(true);
    const strict = await runDoctor({
      cwd: root,
      local: true,
      strict: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(strict.exitCode).toBe(1);
  });

  it("prints set environment variables side by side and wraps at 80 columns", async () => {
    for (const key of [
      "OPENROUTER_API_KEY",
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "GOOGLE_API_KEY",
      "DEEPSEEK_API_KEY",
      "CEREBRAS_API_KEY",
      "GROQ_API_KEY",
      "MISTRAL_API_KEY",
      "XAI_API_KEY",
      "NVIDIA_API_KEY",
      "ALIBABA_API_KEY",
      "APIKEYFAN_API_KEY",
      "CHEAPERINFERENCE_API_KEY",
    ]) {
      process.env[key] = "doctor-secret-token";
    }
    const longLocales = "de,".repeat(40);
    process.env.I18N_TARGET_LOCALES = longLocales;
    writeProject(root, uiConfig(), { "src/main.ts": "export const label = t('Hello');\n" });
    await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    const printed = log.mock.calls.map((call) => stripAnsi(call.map(String).join(" ")));
    const start = printed.findIndex((line) => line.includes("Environment"));
    const rest = printed.slice(start + 1);
    const end = rest.findIndex((line) => line.includes("Summary"));
    const envLines = rest.slice(0, end);
    expect(envLines).toEqual([
      "  ✓  Configured variables: ALIBABA_API_KEY, ANTHROPIC_API_KEY, APIKEYFAN_API_KEY",
      "     CEREBRAS_API_KEY, CHEAPERINFERENCE_API_KEY, DEEPSEEK_API_KEY",
      "     GOOGLE_API_KEY, GROQ_API_KEY",
      `     I18N_TARGET_LOCALES=${longLocales}`,
      "     MISTRAL_API_KEY, NVIDIA_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY",
      "     XAI_API_KEY",
    ]);
    for (const line of envLines) {
      if (line.includes("I18N_TARGET_LOCALES=")) {
        expect(displayWidth(line)).toBeGreaterThan(80);
        expect(line).toContain(longLocales);
      } else {
        expect(displayWidth(line)).toBeLessThanOrEqual(80);
      }
    }
    expect(printed.join("\n")).not.toContain("doctor-secret-token");
  });

  it("prints a JSON report with redacted environment values", async () => {
    process.env.OPENROUTER_API_KEY = "doctor-secret-token";
    process.env.AI_I18N_LANG = "pt-BR";
    writeProject(root, uiConfig(), { "src/main.ts": "export const label = t('Hello');\n" });
    const result = await runDoctor({
      cwd: root,
      local: true,
      json: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    const raw = log.mock.calls.map((call) => call.join(" ")).join("\n");
    const report = JSON.parse(raw) as {
      ok: boolean;
      errorCount: number;
      warningCount: number;
      checks: { section: string; status: string; message: string }[];
    };
    expect(report.ok).toBe(result.exitCode === 0);
    expect(report.errorCount).toBe(0);
    expect(
      report.checks.some(
        (check) => check.message === "Configured variables: AI_I18N_LANG=pt-BR, OPENROUTER_API_KEY"
      )
    ).toBe(true);
    expect(raw).not.toContain("inlineItems");
    expect(raw).not.toContain("doctor-secret-token");
  });

  it("warns when .gitignore is missing and stays successful without --strict", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(root, uiConfig(), { "src/main.ts": "export const label = t('Hello');\n" });
    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(result.exitCode).toBe(0);
    const warning = result.checks.find(
      (check) => check.status === "warn" && check.message.includes(".gitignore")
    );
    expect(warning?.message).toContain(".gitignore for .translation-cache is missing");
    expect(warning?.message).toContain(".translation-cache/*");
    expect(warning?.message).toContain("!.translation-cache/cache.db");
    expect(warning?.message).toContain(".env");
    expect(warning?.message).toContain("*.backup.*");
    expect(warning?.message).toContain("Run ai-i18n-tools doctor --fix-gitignore to add them.");
    expect(fs.existsSync(path.join(root, ".gitignore"))).toBe(false);

    const strict = await runDoctor({
      cwd: root,
      local: true,
      strict: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(strict.exitCode).toBe(1);
  });

  it("passes a complete default .gitignore", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(root, uiConfig(), {
      "src/main.ts": "export const label = t('Hello');\n",
      ".gitignore": DEFAULT_GITIGNORE_BLOCK,
    });
    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(result.exitCode).toBe(0);
    expect(messages(result)).toContain("pass:.gitignore for .translation-cache");
    expect(
      result.checks.some((check) => check.status === "warn" && check.message.includes(".gitignore"))
    ).toBe(false);
  });

  it("checks the configured cacheDir instead of .translation-cache", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    const fixed = [
      "benchmark-scores.json",
      ".env",
      ".env.local",
      ".env.*.local",
      "*.tmp",
      "*.backup.*",
    ].join("\n");
    writeProject(root, uiConfig({ cacheDir: ".i18n-cache/" }), {
      "src/main.ts": "export const label = t('Hello');\n",
      ".gitignore": `${DEFAULT_GITIGNORE_BLOCK}${fixed}\n`,
    });
    const wrong = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    const wrongText = messages(wrong);
    expect(wrongText).toContain(
      ".gitignore for .i18n-cache is missing .i18n-cache/*, !.i18n-cache/cache.db. Run ai-i18n-tools doctor --fix-gitignore to add them."
    );
    expect(wrongText).not.toContain("missing .translation-cache/*");

    fs.writeFileSync(
      path.join(root, ".gitignore"),
      [".i18n-cache/*", "!.i18n-cache/cache.db", fixed, ""].join("\n"),
      "utf8"
    );
    const right = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(messages(right)).toContain("pass:.gitignore for .i18n-cache");
    expect(right.exitCode).toBe(0);
  });

  it("warns when the cache directory itself is ignored", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(root, uiConfig({ cacheDir: ".i18n-cache" }), {
      "src/main.ts": "export const label = t('Hello');\n",
      ".gitignore": [
        ".i18n-cache/",
        ".i18n-cache/*",
        "!.i18n-cache/cache.db",
        "benchmark-scores.json",
        ".env",
        ".env.local",
        ".env.*.local",
        "*.tmp",
        "*.backup.*",
        "",
      ].join("\n"),
    });
    const result = await runDoctor({
      cwd: root,
      local: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(result.exitCode).toBe(0);
    expect(messages(result)).toContain("pass:.gitignore for .i18n-cache");
    expect(messages(result)).toContain(
      "warn:.i18n-cache/ ignores the cache directory, so !.i18n-cache/cache.db does not keep cache.db"
    );
    expect(messages(result)).not.toContain("--fix-gitignore");
  });

  it("adds missing .gitignore lines with --fix-gitignore", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(root, uiConfig(), { "src/main.ts": "export const label = t('Hello');\n" });
    const created = await runDoctor({
      cwd: root,
      local: true,
      fixGitignore: true,
      strict: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(created.exitCode).toBe(0);
    expect(fs.readFileSync(path.join(root, ".gitignore"), "utf8")).toBe(DEFAULT_GITIGNORE_BLOCK);
    expect(messages(created)).toContain("pass:Wrote .gitignore");
    expect(messages(created)).toContain("pass:.gitignore for .translation-cache");
    expect(messages(created)).not.toContain("--fix-gitignore");

    const again = await runDoctor({
      cwd: root,
      local: true,
      fixGitignore: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    expect(fs.readFileSync(path.join(root, ".gitignore"), "utf8")).toBe(DEFAULT_GITIGNORE_BLOCK);
    expect(messages(again)).not.toContain("Updated .gitignore");
    expect(messages(again)).toContain("pass:.gitignore for .translation-cache");
  });

  it("appends only the configured cache lines with --fix-gitignore", async () => {
    process.env.OPENROUTER_API_KEY = "k";
    writeProject(root, uiConfig({ cacheDir: ".i18n-cache" }), {
      "src/main.ts": "export const label = t('Hello');\n",
      ".gitignore": "node_modules/\n\n.env\n",
    });
    const result = await runDoctor({
      cwd: root,
      local: true,
      fixGitignore: true,
      sea: false,
      execPath: "node",
      argv1: "cli",
    });
    const text = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
    expect(text).toBe(
      [
        "node_modules/",
        "",
        ".env",
        "",
        "# ai-i18n-tools doctor fix",
        ".i18n-cache/*",
        "!.i18n-cache/cache.db",
        "benchmark-scores.json",
        ".env.local",
        ".env.*.local",
        "*.tmp",
        "*.backup.*",
        "",
      ].join("\n")
    );
    expect(result.exitCode).toBe(0);
    expect(messages(result)).toContain("pass:Updated .gitignore");
    expect(messages(result)).toContain("pass:.gitignore for .i18n-cache");
  });

  it("describes a standalone executable", () => {
    expect(
      describeRuntime({
        sea: true,
        execPath: "/home/user/.local/bin/ai-i18n-tools",
        argv1: "ignored",
      })
    ).toBe("standalone executable /home/user/.local/bin/ai-i18n-tools");
  });
});
