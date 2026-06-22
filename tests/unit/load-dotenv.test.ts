import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadDotenv } from "../../src/utils/load-dotenv.js";

type LoadEnvFile = typeof process.loadEnvFile;

describe("loadDotenv", () => {
  const dirs: string[] = [];
  const addedEnvKeys = new Set<string>();
  const originalLoadEnvFile = process.loadEnvFile.bind(process);

  function tempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "load-dotenv-"));
    dirs.push(dir);
    return dir;
  }

  /** Replace `process.loadEnvFile` for a test; restored in `afterEach`. */
  function setLoadEnvFile(fn: LoadEnvFile | undefined): void {
    (process as { loadEnvFile?: LoadEnvFile }).loadEnvFile = fn;
  }

  afterEach(() => {
    setLoadEnvFile(originalLoadEnvFile);
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

  it("does nothing when no .env file exists", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const before = { ...process.env };
    loadDotenv(tempDir());
    expect(warn).not.toHaveBeenCalled();
    expect({ ...process.env }).toEqual(before);
  });

  it("loads new variables from .env into process.env", () => {
    const dir = tempDir();
    const key = "AI_I18N_TEST_NEWVAR";
    addedEnvKeys.add(key);
    delete process.env[key];
    fs.writeFileSync(path.join(dir, ".env"), `${key}=from-file\n`);

    loadDotenv(dir);

    expect(process.env[key]).toBe("from-file");
  });

  it("never overrides a variable already present in the environment", () => {
    const dir = tempDir();
    const key = "AI_I18N_TEST_EXISTING";
    addedEnvKeys.add(key);
    process.env[key] = "from-env";
    fs.writeFileSync(path.join(dir, ".env"), `${key}=from-file\n`);

    loadDotenv(dir);

    expect(process.env[key]).toBe("from-env");
  });

  it("warns and returns when process.loadEnvFile is unavailable", () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, ".env"), "ANY=1\n");
    setLoadEnvFile(undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    loadDotenv(dir);

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain("process.loadEnvFile is missing");
  });

  it("warns with the error message when loading throws an Error", () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, ".env"), "ANY=1\n");
    setLoadEnvFile(() => {
      throw new Error("boom");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    loadDotenv(dir);

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain("Could not load .env: boom");
  });

  it("warns with a stringified value when loading throws a non-Error", () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, ".env"), "ANY=1\n");
    setLoadEnvFile(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- exercising the non-Error catch branch
      throw "nope";
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    loadDotenv(dir);

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain("Could not load .env: nope");
  });
});
