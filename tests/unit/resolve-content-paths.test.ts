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
});
