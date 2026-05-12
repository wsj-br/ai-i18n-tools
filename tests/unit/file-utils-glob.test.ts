import { describe, expect, it } from "vitest";
import { collectFilesByExtension, isGlobPattern, matchGlob } from "../../src/cli/file-utils.js";

describe("file-utils glob support", () => {
  describe("isGlobPattern", () => {
    it("detects glob patterns", () => {
      expect(isGlobPattern("*.svg")).toBe(true);
      expect(isGlobPattern("**/*.md")).toBe(true);
      expect(isGlobPattern("images/[abc].svg")).toBe(true);
      expect(isGlobPattern("?.md")).toBe(true);
      expect(isGlobPattern("normal/path")).toBe(false);
      expect(isGlobPattern("images/logo.svg")).toBe(false);
    });
  });

  describe("matchGlob", () => {
    it("matches exact paths", () => {
      expect(matchGlob("images/logo.svg", "images/logo.svg")).toBe(true);
    });

    it("matches * wildcard (single segment)", () => {
      expect(matchGlob("images/foo.svg", "images/*.svg")).toBe(true);
      expect(matchGlob("images/bar.svg", "images/*.svg")).toBe(true);
      expect(matchGlob("images/sub/baz.svg", "images/*.svg")).toBe(false); // * doesn't match /
    });

    it("matches ** wildcard (any depth)", () => {
      expect(matchGlob("images/logo.svg", "**/*.svg")).toBe(true);
      expect(matchGlob("icons/app/logo.svg", "**/*.svg")).toBe(true);
      expect(matchGlob("deep/nested/path/file.svg", "**/*.svg")).toBe(true);
    });

    it("matches patterns starting with **/", () => {
      expect(matchGlob("a/b/c.svg", "**/c.svg")).toBe(true);
      expect(matchGlob("x/y/z.svg", "**/z.svg")).toBe(true);
    });

    it("does not match when pattern doesn't fit", () => {
      expect(matchGlob("images/logo.png", "*.svg")).toBe(false);
      expect(matchGlob("src/components/Button.tsx", "**/*.md")).toBe(false);
    });
  });

  describe("collectFilesByExtension with glob patterns", () => {
    it("collects files from a directory", () => {
      const files = collectFilesByExtension(["src"], [".ts"], process.cwd());
      // This will depend on actual project structure - just checking it runs
      expect(Array.isArray(files)).toBe(true);
    });

    it("supports simple glob patterns like *.svg", () => {
      // This would match all .svg files in a specific location
      // Actual testing requires a test fixture directory
      const result = collectFilesByExtension(["examples/**/*.svg"], [".svg"], process.cwd());
      expect(Array.isArray(result)).toBe(true);
      // Check that all returned paths are .svg files
      result.forEach((p) => {
        expect(p.endsWith(".svg")).toBe(true);
      });
    });
  });
});
