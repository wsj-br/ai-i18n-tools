import path from "path";
import { describe, expect, it } from "vitest";
import {
  jsonFileProjectRelativePath,
  matchesPathFilter,
  normalizePathFilterForProjectRoot,
} from "../../src/cli/doc-translate.js";

describe("normalizePathFilterForProjectRoot", () => {
  const root = path.resolve("/proj");

  it("returns undefined for empty or whitespace", () => {
    expect(normalizePathFilterForProjectRoot(root, undefined)).toBeUndefined();
    expect(normalizePathFilterForProjectRoot(root, "")).toBeUndefined();
    expect(normalizePathFilterForProjectRoot(root, "  ")).toBeUndefined();
  });

  it("returns undefined when filter is the project root", () => {
    expect(normalizePathFilterForProjectRoot(root, "/proj")).toBeUndefined();
    expect(normalizePathFilterForProjectRoot(root, ".")).toBeUndefined();
  });

  it("normalizes relative segments under root", () => {
    expect(normalizePathFilterForProjectRoot(root, "docs")).toBe("docs");
    expect(normalizePathFilterForProjectRoot(root, "docs/guide.md")).toBe("docs/guide.md");
  });

  it("normalizes absolute paths under root", () => {
    expect(normalizePathFilterForProjectRoot(root, "/proj/docs")).toBe("docs");
    expect(normalizePathFilterForProjectRoot(root, path.join(root, "a", "b.md"))).toBe("a/b.md");
  });

  it("throws when path escapes project root", () => {
    expect(() => normalizePathFilterForProjectRoot(root, "/other/x")).toThrow(/inside the project root/);
  });
});

describe("jsonFileProjectRelativePath", () => {
  it("joins json root and json-relative path", () => {
    const root = path.resolve("/app");
    const jsonRoot = path.join(root, "i18n", "en");
    expect(jsonFileProjectRelativePath(root, jsonRoot, "foo.json")).toBe("i18n/en/foo.json");
  });
});

describe("matchesPathFilter with normalized filter", () => {
  it("matches markdown paths and directory prefixes", () => {
    expect(matchesPathFilter("docs/a.md", "docs")).toBe(true);
    expect(matchesPathFilter("other/a.md", "docs")).toBe(false);
    expect(matchesPathFilter("docs/a.md", "docs/a.md")).toBe(true);
  });

  it("matches json project-relative paths from jsonFileProjectRelativePath", () => {
    const root = path.resolve("/app");
    const jsonRoot = path.join(root, "i18n", "en");
    const filter = normalizePathFilterForProjectRoot(root, "i18n/en")!;
    const rel = jsonFileProjectRelativePath(root, jsonRoot, "docusaurus.json");
    expect(matchesPathFilter(rel, filter)).toBe(true);
  });
});
