import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadDotenvForConfig,
  readConfigFlagFromArgv,
  warnDotenvLoaded,
} from "../../src/cli/helpers.js";
import { stripAnsi } from "../../src/utils/logger.js";
import {
  apiKeyEnvNamesFromRawConfig,
  environmentHasApiKey,
  loadDotenv,
} from "../../src/utils/load-dotenv.js";

describe("loadDotenv", () => {
  const dirs: string[] = [];
  const addedEnvKeys = new Set<string>();

  function tempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "load-dotenv-"));
    dirs.push(dir);
    return dir;
  }

  function track(key: string): void {
    addedEnvKeys.add(key);
    delete process.env[key];
  }

  afterEach(() => {
    for (const dir of dirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    dirs.length = 0;
    for (const key of addedEnvKeys) {
      delete process.env[key];
    }
    addedEnvKeys.clear();
    vi.restoreAllMocks();
  });

  it("does nothing when no env file exists and no API key is set", () => {
    track("OPENROUTER_API_KEY");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const before = { ...process.env };
    const result = loadDotenv(tempDir());
    expect(result.loaded).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
    expect({ ...process.env }).toEqual(before);
  });

  it("does not read .env or .env.local when any provider API key is already set", () => {
    track("OPENAI_API_KEY");
    track("OPENROUTER_API_KEY");
    track("I18N_LOG_LEVEL");
    process.env.OPENAI_API_KEY = "from-env";
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, ".env"));
    fs.writeFileSync(
      path.join(dir, ".env.local"),
      "OPENROUTER_API_KEY=from-file\nI18N_LOG_LEVEL=debug\n"
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = loadDotenv(dir);

    expect(result.loaded).toEqual([]);
    expect(process.env.OPENROUTER_API_KEY).toBeUndefined();
    expect(process.env.I18N_LOG_LEVEL).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
    expect(environmentHasApiKey()).toBe(true);
  });

  it("loads needed variables from .env and warns with their names", () => {
    track("OPENROUTER_API_KEY");
    track("I18N_LOG_LEVEL");
    track("NOT_A_TOOL_VARIABLE");
    const dir = tempDir();
    fs.writeFileSync(
      path.join(dir, ".env"),
      [
        'export OPENROUTER_API_KEY="from-file"',
        "I18N_LOG_LEVEL=debug",
        "NOT_A_TOOL_VARIABLE=secret",
        "EMPTY=",
      ].join("\n")
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = loadDotenv(dir);

    expect(process.env.OPENROUTER_API_KEY).toBe("from-file");
    expect(process.env.I18N_LOG_LEVEL).toBe("debug");
    expect(process.env.NOT_A_TOOL_VARIABLE).toBeUndefined();
    expect(result.loaded).toEqual([
      { file: ".env", names: ["I18N_LOG_LEVEL", "OPENROUTER_API_KEY"] },
    ]);
    warnDotenvLoaded(result);
    expect(warn).toHaveBeenCalledOnce();
    expect(stripAnsi(String(warn.mock.calls[0]?.[0]))).toContain(
      "Read I18N_LOG_LEVEL, OPENROUTER_API_KEY from .env"
    );
  });

  it("lets .env.local override .env and names both files in one warning", () => {
    track("OPENROUTER_API_KEY");
    track("AI_I18N_LANG");
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, ".env"), "OPENROUTER_API_KEY=from-env-file\nAI_I18N_LANG=de\n");
    fs.writeFileSync(path.join(dir, ".env.local"), "OPENROUTER_API_KEY=from-local\n");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = loadDotenv(dir);

    expect(process.env.OPENROUTER_API_KEY).toBe("from-local");
    expect(process.env.AI_I18N_LANG).toBe("de");
    expect(result.loaded).toEqual([
      { file: ".env", names: ["AI_I18N_LANG"] },
      { file: ".env.local", names: ["OPENROUTER_API_KEY"] },
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("does not override a needed variable that is already set when no API key is set", () => {
    track("I18N_LOG_LEVEL");
    track("OPENROUTER_API_KEY");
    process.env.I18N_LOG_LEVEL = "warn";
    const dir = tempDir();
    fs.writeFileSync(
      path.join(dir, ".env"),
      "I18N_LOG_LEVEL=debug\nOPENROUTER_API_KEY=from-file\n"
    );

    loadDotenv(dir);

    expect(process.env.I18N_LOG_LEVEL).toBe("warn");
    expect(process.env.OPENROUTER_API_KEY).toBe("from-file");
  });

  it("loads a custom apiKeyEnv and treats it as an API key that blocks a later read", () => {
    track("MY_PROJECT_KEY");
    track("OPENROUTER_API_KEY");
    const dir = tempDir();
    fs.writeFileSync(
      path.join(dir, ".env.local"),
      "MY_PROJECT_KEY=custom\nOPENROUTER_API_KEY=other\n"
    );

    const first = loadDotenv(dir, { extraNames: ["MY_PROJECT_KEY"] });
    expect(first.loaded).toEqual([
      { file: ".env.local", names: ["MY_PROJECT_KEY", "OPENROUTER_API_KEY"] },
    ]);
    expect(environmentHasApiKey(["MY_PROJECT_KEY"])).toBe(true);

    process.env.OPENROUTER_API_KEY = "from-env";
    delete process.env.MY_PROJECT_KEY;
    fs.writeFileSync(path.join(dir, ".env"), "MY_PROJECT_KEY=from-file\n");
    const second = loadDotenv(dir, { extraNames: ["MY_PROJECT_KEY"] });
    expect(second.loaded).toEqual([]);
    expect(process.env.MY_PROJECT_KEY).toBeUndefined();
  });

  it("warns when an env file cannot be read and still loads the other file", () => {
    track("OPENROUTER_API_KEY");
    track("I18N_LOG_LEVEL");
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, ".env"));
    fs.writeFileSync(path.join(dir, ".env.local"), "OPENROUTER_API_KEY=from-local\n");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = loadDotenv(dir);
    warnDotenvLoaded(result);

    expect(process.env.OPENROUTER_API_KEY).toBe("from-local");
    expect(result.loaded).toEqual([{ file: ".env.local", names: ["OPENROUTER_API_KEY"] }]);
    expect(result.errors[0]?.file).toBe(".env");
    const lines = warn.mock.calls.map((call) => stripAnsi(String(call[0])));
    expect(lines.some((line) => line.includes("Could not load .env:"))).toBe(true);
    expect(lines.some((line) => line.includes("Read OPENROUTER_API_KEY from .env.local"))).toBe(
      true
    );
  });

  it("reads .env beside the config and skips the working directory", () => {
    track("OPENROUTER_API_KEY");
    track("MY_PROJECT_KEY");
    track("I18N_LOG_LEVEL");
    const cwd = tempDir();
    const project = path.join(cwd, "nested");
    fs.mkdirSync(project);
    fs.writeFileSync(path.join(cwd, ".env"), "OPENROUTER_API_KEY=from-cwd\nI18N_LOG_LEVEL=debug\n");
    fs.writeFileSync(
      path.join(project, "ai-i18n-tools.config.json"),
      JSON.stringify({
        providers: { local: { apiKeyEnv: "MY_PROJECT_KEY", baseUrl: "http://localhost/v1" } },
      })
    );
    fs.writeFileSync(
      path.join(project, ".env.local"),
      "MY_PROJECT_KEY=from-config\nOPENROUTER_API_KEY=from-config-router\n"
    );

    const result = loadDotenvForConfig("nested/ai-i18n-tools.config.json", cwd);

    expect(process.env.MY_PROJECT_KEY).toBe("from-config");
    expect(process.env.OPENROUTER_API_KEY).toBe("from-config-router");
    expect(process.env.I18N_LOG_LEVEL).toBeUndefined();
    expect(result.loaded).toEqual([
      { file: ".env.local", names: ["MY_PROJECT_KEY", "OPENROUTER_API_KEY"] },
    ]);
  });

  it("warnDotenvLoaded prints one line for both files", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnDotenvLoaded({
      loaded: [
        { file: ".env", names: ["I18N_LOG_LEVEL"] },
        { file: ".env.local", names: ["OPENROUTER_API_KEY"] },
      ],
      errors: [],
    });
    expect(stripAnsi(String(warn.mock.calls[0]?.[0]))).toContain(
      "Read I18N_LOG_LEVEL from .env and OPENROUTER_API_KEY from .env.local"
    );
  });

  it("reads -c and --config from argv", () => {
    expect(readConfigFlagFromArgv(["doctor", "-c", "nested/ai-i18n-tools.config.json"])).toBe(
      "nested/ai-i18n-tools.config.json"
    );
    expect(readConfigFlagFromArgv(["--config=./ai-i18n-tools.config.json", "sync"])).toBe(
      "./ai-i18n-tools.config.json"
    );
    expect(readConfigFlagFromArgv(["doctor", "--local"])).toBeUndefined();
  });

  it("reads custom apiKeyEnv names from a providers block", () => {
    expect(
      apiKeyEnvNamesFromRawConfig({
        providers: {
          openrouter: { translationModels: ["m1"] },
          local: { apiKeyEnv: "  MY_PROJECT_KEY  " },
          skipped: { apiKeyEnv: "" },
        },
      })
    ).toEqual(["MY_PROJECT_KEY"]);
    expect(apiKeyEnvNamesFromRawConfig(null)).toEqual([]);
    expect(apiKeyEnvNamesFromRawConfig({ providers: [] })).toEqual([]);
  });
});
