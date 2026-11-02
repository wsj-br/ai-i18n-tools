import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_GITIGNORE_BLOCK,
  ensureProjectGitignore,
  gitignorePatternSet,
  normalizeCacheDir,
  requiredGitignorePatterns,
} from "../../src/cli/project-gitignore.js";

describe("normalizeCacheDir", () => {
  it("trims, uses forward slashes, and drops a trailing slash", () => {
    expect(normalizeCacheDir("  .i18n-cache/  ")).toBe(".i18n-cache");
    expect(normalizeCacheDir(".i18n-cache\\nested\\")).toBe(".i18n-cache/nested");
    expect(normalizeCacheDir("   ")).toBe(".translation-cache");
  });
});

describe("requiredGitignorePatterns", () => {
  it("uses the configured cache directory for the two cache lines", () => {
    expect(requiredGitignorePatterns(".translation-cache")).toEqual([
      ".translation-cache/*",
      "!.translation-cache/cache.db",
      "benchmark-scores.json",
      ".env",
      ".env.local",
      ".env.*.local",
      "*.tmp",
      "*.backup.*",
    ]);
    expect(requiredGitignorePatterns(".i18n-cache/")).toEqual([
      ".i18n-cache/*",
      "!.i18n-cache/cache.db",
      "benchmark-scores.json",
      ".env",
      ".env.local",
      ".env.*.local",
      "*.tmp",
      "*.backup.*",
    ]);
  });
});

describe("ensureProjectGitignore", () => {
  let root: string;

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("creates the default block when .gitignore is absent", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "gitignore-"));
    expect(ensureProjectGitignore(root)).toBe("created");
    expect(fs.readFileSync(path.join(root, ".gitignore"), "utf8")).toBe(DEFAULT_GITIGNORE_BLOCK);
    expect(ensureProjectGitignore(root)).toBe("unchanged");
    expect(fs.readFileSync(path.join(root, ".gitignore"), "utf8")).toBe(DEFAULT_GITIGNORE_BLOCK);
  });

  it("appends only missing patterns and keeps existing lines", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "gitignore-"));
    const file = path.join(root, ".gitignore");
    fs.writeFileSync(file, "node_modules/\n\n.env\n# .env.local\n", "utf8");
    expect(ensureProjectGitignore(root)).toBe("updated");
    const text = fs.readFileSync(file, "utf8");
    expect(text.startsWith("node_modules/\n\n.env\n# .env.local\n\n")).toBe(true);
    expect(text).toContain("# Cache\n.translation-cache/*\n!.translation-cache/cache.db\n");
    expect(text).toContain("# Environment\n.env.local\n.env.*.local\n");
    expect(text).not.toContain("# Environment\n.env\n");
    expect(text).toContain("# Temporary files\n*.tmp\n*.backup.*\n");
    expect(gitignorePatternSet(text).has(".env")).toBe(true);
    expect(ensureProjectGitignore(root)).toBe("unchanged");
    expect(fs.readFileSync(file, "utf8")).toBe(text);
  });

  it("keeps CRLF when appending", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "gitignore-"));
    const file = path.join(root, ".gitignore");
    fs.writeFileSync(file, "dist/\r\n", "utf8");
    expect(ensureProjectGitignore(root)).toBe("updated");
    const text = fs.readFileSync(file, "utf8");
    expect(text.startsWith("dist/\r\n\r\n# Cache\r\n")).toBe(true);
    expect(text.replace(/\r\n/g, "")).not.toContain("\n");
  });
});
