import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveContentPathEntries } from "../../src/core/resolve-content-paths.js";
import { ConfigValidationError } from "../../src/core/errors.js";

describe("resolveContentPathEntries", () => {
  const tmpDirs: string[] = [];
  afterEach(() => {
    for (const d of tmpDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it("resolves a single file path", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "rcp-"));
    tmpDirs.push(root);
    const f = path.join(root, "src", "en.json");
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, "{}", "utf8");
    const rel = resolveContentPathEntries(["src/en.json"], {
      projectRoot: root,
      extensions: [".json"],
    });
    expect(rel).toEqual(["src/en.json"]);
  });

  it("walks a directory for matching extensions", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "rcp-"));
    tmpDirs.push(root);
    fs.mkdirSync(path.join(root, "dir"), { recursive: true });
    fs.writeFileSync(path.join(root, "dir", "a.json"), "{}", "utf8");
    fs.writeFileSync(path.join(root, "dir", "b.txt"), "x", "utf8");
    const rel = resolveContentPathEntries(["dir"], { projectRoot: root, extensions: [".json"] });
    expect(rel.sort()).toEqual(["dir/a.json"]);
  });

  it("expands globs with minimatch magic", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "rcp-"));
    tmpDirs.push(root);
    fs.mkdirSync(path.join(root, "i18n", "en"), { recursive: true });
    fs.writeFileSync(path.join(root, "i18n", "en", "a.json"), "{}", "utf8");
    fs.writeFileSync(path.join(root, "i18n", "en", "b.json"), "{}", "utf8");
    const rel = resolveContentPathEntries(["i18n/en/*.json"], {
      projectRoot: root,
      extensions: [".json"],
    });
    expect(rel.sort()).toEqual(["i18n/en/a.json", "i18n/en/b.json"]);
  });

  it("throws when path is missing and not a glob", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "rcp-"));
    tmpDirs.push(root);
    expect(() =>
      resolveContentPathEntries(["missing/file.json"], {
        projectRoot: root,
        extensions: [".json"],
      })
    ).toThrow(ConfigValidationError);
  });

  it("walks nested directories and skips blank entries", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "rcp-"));
    tmpDirs.push(root);
    fs.mkdirSync(path.join(root, "a", "b"), { recursive: true });
    fs.writeFileSync(path.join(root, "a", "b", "deep.json"), "{}", "utf8");
    const rel = resolveContentPathEntries(["a", "  "], {
      projectRoot: root,
      extensions: [".json"],
    });
    expect(rel).toEqual(["a/b/deep.json"]);
  });

  it("ignores files with non-matching extensions and paths outside project root", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "rcp-"));
    tmpDirs.push(root);
    fs.writeFileSync(path.join(root, "note.txt"), "x", "utf8");
    expect(
      resolveContentPathEntries(["note.txt"], { projectRoot: root, extensions: [".json"] })
    ).toEqual([]);
    const outside = path.join(os.tmpdir(), "outside-only.json");
    fs.writeFileSync(outside, "{}", "utf8");
    try {
      expect(
        resolveContentPathEntries([outside], { projectRoot: root, extensions: [".json"] })
      ).toEqual([]);
    } finally {
      fs.rmSync(outside, { force: true });
    }
  });

  it("throws when glob or directory matches no files", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "rcp-"));
    tmpDirs.push(root);
    fs.mkdirSync(path.join(root, "empty"), { recursive: true });
    expect(() =>
      resolveContentPathEntries(["missing/*.json"], { projectRoot: root, extensions: [".json"] })
    ).toThrow(/glob matched no files/);
    expect(() =>
      resolveContentPathEntries(["empty"], { projectRoot: root, extensions: [".json"] })
    ).toThrow(/contains no files/);
  });
});
