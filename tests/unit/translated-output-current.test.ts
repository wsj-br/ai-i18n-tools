import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { translatedOutputIsCurrent } from "../../src/cli/helpers.js";

describe("translatedOutputIsCurrent", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    dirs.length = 0;
  });

  function tmpDir(): string {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), "out-current-"));
    dirs.push(d);
    return d;
  }

  it("returns false when the output file does not exist", () => {
    const dir = tmpDir();
    const out = path.join(dir, "missing.md");
    expect(translatedOutputIsCurrent(out, new Date().toISOString())).toBe(false);
  });

  it("returns false when the output is older than the source", () => {
    const dir = tmpDir();
    const out = path.join(dir, "out.md");
    fs.writeFileSync(out, "x", "utf8");
    const sourceMtime = new Date(Date.now() + 60_000).toISOString();
    expect(translatedOutputIsCurrent(out, sourceMtime)).toBe(false);
  });

  it("returns true when the output is newer than the source", () => {
    const dir = tmpDir();
    const out = path.join(dir, "out.md");
    fs.writeFileSync(out, "x", "utf8");
    const sourceMtime = new Date(Date.now() - 60_000).toISOString();
    expect(translatedOutputIsCurrent(out, sourceMtime)).toBe(true);
  });

  it("returns true when output and source share the same mtime", () => {
    const dir = tmpDir();
    const out = path.join(dir, "out.md");
    fs.writeFileSync(out, "x", "utf8");
    const sameMtime = fs.statSync(out).mtime.toISOString();
    expect(translatedOutputIsCurrent(out, sameMtime)).toBe(true);
  });

  it("treats an unparseable source mtime as current (does not force re-translation)", () => {
    const dir = tmpDir();
    const out = path.join(dir, "out.md");
    fs.writeFileSync(out, "x", "utf8");
    expect(translatedOutputIsCurrent(out, "not-a-date")).toBe(true);
  });
});
