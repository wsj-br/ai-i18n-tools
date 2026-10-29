import fs from "fs";
import os from "os";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { describeRuntime, runDoctor } from "../../src/cli/doctor.js";
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
    expect(text).toContain("Node.js package /app/bin/ai-i18n-tools.mjs");
    expect(text).toContain("pass:ui[0] sourceRoots src");
    expect(text).toContain("created on first run");
    expect(text).not.toContain("doctor-secret-token");
    expect(fs.existsSync(path.join(root, ".translation-cache", "cache.db"))).toBe(false);
    expect(log.mock.calls.join("\n")).not.toContain("doctor-secret-token");
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
    expect(messages(online)).toContain("models in openrouter's catalog: missing m1");
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
    expect(text).toContain("OPENROUTER_API_KEY (set)");
    expect(text).toContain("OPENAI_API_KEY (set)");
    expect(text).toContain("AI_I18N_LANG=pt-BR");
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
    cache.recordApiCall({
      provider: "openrouter",
      model: "m1",
      operation: "translate-ui",
      locale: "de",
      outcome: "accepted",
      inputTokens: 3,
      outputTokens: 4,
      totalTokens: 7,
      createdAt: "2026-10-28 21:04:11",
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
    expect(text).toContain("2026-10-28 21:04:11");
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
    expect(messages(present)).toContain("languagebench 2, arena 1, models.dev 2");
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
    expect(report.checks.some((check) => check.message === "OPENROUTER_API_KEY (set)")).toBe(true);
    expect(report.checks.some((check) => check.message === "AI_I18N_LANG=pt-BR")).toBe(true);
    expect(raw).not.toContain("doctor-secret-token");
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
