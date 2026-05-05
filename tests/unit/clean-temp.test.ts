import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import chalk from "chalk";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatFindPrintLine,
  matchesCleanTempBasename,
  runCleanTemp,
} from "../../src/cli/clean-temp.js";

describe("matchesCleanTempBasename", () => {
  it("matches *.log", () => {
    expect(matchesCleanTempBasename("app.log")).toBe(true);
    expect(matchesCleanTempBasename(".log")).toBe(true);
  });

  it("matches cache.db.backup*.sqlite", () => {
    expect(matchesCleanTempBasename("cache.db.backup.2024-01-01.sqlite")).toBe(true);
    expect(matchesCleanTempBasename("cache.db.backup.sqlite")).toBe(true);
  });

  it("rejects other names", () => {
    expect(matchesCleanTempBasename("cache.db.sqlite")).toBe(false);
    expect(matchesCleanTempBasename("notlog")).toBe(false);
    expect(matchesCleanTempBasename("readme.txt")).toBe(false);
  });
});

describe("formatFindPrintLine", () => {
  it("prefixes with ./ for relative paths", () => {
    const root = path.resolve("/proj");
    expect(formatFindPrintLine(root, path.join(root, "a.log"))).toContain("./a.log");
    expect(formatFindPrintLine(root, path.join(root, "d", "b.log"))).toContain("./d/b.log");
  });
});

describe("runCleanTemp", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    dirs.length = 0;
  });

  it("dry-run prints only matching files in find-style paths", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "clean-temp-"));
    dirs.push(root);
    fs.writeFileSync(path.join(root, "a.log"), "x");
    fs.mkdirSync(path.join(root, "sub"));
    fs.writeFileSync(path.join(root, "sub", "cache.db.backup.2024.sqlite"), "");
    fs.writeFileSync(path.join(root, "sub", "readme.txt"), "");

    const lines: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((m: unknown) => lines.push(String(m)));
    await runCleanTemp({ rootDir: root, dryRun: true });
    spy.mockRestore();

    const rootAbs = path.resolve(root);
    expect(lines.sort()).toEqual(
      [
        chalk.gray("Dry run mode: no files will be deleted."),
        formatFindPrintLine(rootAbs, path.join(root, "a.log")),
        formatFindPrintLine(rootAbs, path.join(root, "sub", "cache.db.backup.2024.sqlite")),
      ].sort()
    );
  });

  it("force deletes without prompting", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "clean-temp-"));
    dirs.push(root);
    const logPath = path.join(root, "a.log");
    fs.writeFileSync(logPath, "x");
    const rlSpy = vi.spyOn(readline, "createInterface");
    await runCleanTemp({ rootDir: root, force: true });
    rlSpy.mockRestore();
    expect(rlSpy).not.toHaveBeenCalled();
    expect(fs.existsSync(logPath)).toBe(false);
  });

  it("does not prompt when no matching files", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "clean-temp-"));
    dirs.push(root);
    fs.writeFileSync(path.join(root, "readme.txt"), "x");
    const rlSpy = vi.spyOn(readline, "createInterface");
    await runCleanTemp({ rootDir: root });
    rlSpy.mockRestore();
    expect(rlSpy).not.toHaveBeenCalled();
  });

  it("dry-run overrides force and does not delete", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "clean-temp-"));
    dirs.push(root);
    const logPath = path.join(root, "a.log");
    fs.writeFileSync(logPath, "x");
    await runCleanTemp({ rootDir: root, dryRun: true, force: true });
    expect(fs.existsSync(logPath)).toBe(true);
  });
});
