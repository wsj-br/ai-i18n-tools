import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  augmentMarkdownFilesFromPathFilter,
  expandPathFilterToMarkdownPaths,
  isProjectRelUnderAnyDocumentationContentPath,
  isProjectRelUnderBlockContentPath,
} from "../../src/cli/doc-translate.js";

function write(p: string, content: string): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

describe("augmentMarkdownFilesFromPathFilter", () => {
  const tmpDirs: string[] = [];
  afterEach(() => {
    for (const d of tmpDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it("adds a markdown file outside all contentPaths to block 0 with a warning", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-path-"));
    tmpDirs.push(root);
    const orphan = path.join(root, "orphan", "x.md");
    write(orphan, "# hi");
    const rel = "orphan/x.md";
    const documentations = [{ contentPaths: ["docs"] as string[] }];
    const { markdown, warnings } = augmentMarkdownFilesFromPathFilter(
      root,
      rel,
      0,
      documentations,
      []
    );
    expect(markdown).toEqual([rel]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("outside every documentations");
  });

  it("does not attach out-of-config paths to block 1 (only block 0)", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-path-"));
    tmpDirs.push(root);
    const orphan = path.join(root, "z.md");
    write(orphan, "# z");
    const rel = "z.md";
    const documentations = [{ contentPaths: ["docs"] as string[] }];
    const { markdown, warnings } = augmentMarkdownFilesFromPathFilter(
      root,
      rel,
      1,
      documentations,
      []
    );
    expect(markdown).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it("adds a file under the block that was skipped by discovery (e.g. would be ignore)", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-path-"));
    tmpDirs.push(root);
    const f = path.join(root, "docs", "a.md");
    write(f, "# a");
    const rel = "docs/a.md";
    const documentations = [{ contentPaths: ["docs"] as string[] }];
    const { markdown, warnings } = augmentMarkdownFilesFromPathFilter(
      root,
      rel,
      0,
      documentations,
      [] // discovery returned nothing
    );
    expect(markdown).toEqual([rel]);
    expect(warnings.some((w) => w.includes("documentations[0]"))).toBe(true);
  });

  it("leaves a path for the owning block when two documentations[] blocks exist", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-path-"));
    tmpDirs.push(root);
    const f = path.join(root, "b2", "n.md");
    write(f, "# n");
    const rel = "b2/n.md";
    const documentations = [
      { contentPaths: ["docs"] as string[] },
      { contentPaths: ["b2"] as string[] },
    ];
    const r0 = augmentMarkdownFilesFromPathFilter(root, rel, 0, documentations, []);
    expect(r0.markdown).toEqual([]);
    const r1 = augmentMarkdownFilesFromPathFilter(root, rel, 1, documentations, []);
    expect(r1.markdown).toEqual([rel]);
    expect(r1.warnings.length).toBeGreaterThan(0);
  });
});

describe("path filter helpers", () => {
  const tmpDirs: string[] = [];
  afterEach(() => {
    for (const d of tmpDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it("expandPathFilterToMarkdownPaths lists files under a directory", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-path-"));
    tmpDirs.push(root);
    write(path.join(root, "d", "a.md"), "a");
    write(path.join(root, "d", "b.mdx"), "b");
    const out = expandPathFilterToMarkdownPaths(root, "d");
    expect(out.sort()).toEqual(["d/a.md", "d/b.mdx"]);
  });

  it("isProjectRelUnderBlockContentPath matches directory prefix", () => {
    const root = os.tmpdir();
    expect(isProjectRelUnderBlockContentPath(root, "docs/foo.md", { contentPaths: ["docs"] })).toBe(
      true
    );
    expect(
      isProjectRelUnderBlockContentPath(root, "other/foo.md", { contentPaths: ["docs"] })
    ).toBe(false);
  });

  it("isProjectRelUnderAnyDocumentationContentPath checks all blocks", () => {
    const root = os.tmpdir();
    const docs = [{ contentPaths: ["a"] }, { contentPaths: ["b"] }];
    expect(isProjectRelUnderAnyDocumentationContentPath(root, "b/x.md", docs)).toBe(true);
    expect(isProjectRelUnderAnyDocumentationContentPath(root, "c/x.md", docs)).toBe(false);
  });
});
