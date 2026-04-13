import path from "path";
import {
  documentationFileTrackingKey,
  resolveDocTrackingKeyToAbs,
} from "../../src/core/doc-file-tracking.js";

describe("doc-file-tracking", () => {
  describe("documentationFileTrackingKey", () => {
    it("namespaces block index and normalizes backslashes to slashes", () => {
      expect(documentationFileTrackingKey(0, "docs\\guide.md")).toBe("doc-block:0:docs/guide.md");
      expect(documentationFileTrackingKey(2, "a/b.md")).toBe("doc-block:2:a/b.md");
    });
  });

  describe("resolveDocTrackingKeyToAbs", () => {
    const root = path.resolve("/project/root");

    it("strips doc-block prefix and resolves relative segment", () => {
      const key = documentationFileTrackingKey(1, "docs/x.md");
      const abs = resolveDocTrackingKeyToAbs("/project/root", key);
      expect(abs).toBe(path.resolve(root, "docs/x.md"));
    });

    it("resolves JSON file_tracking keys when path is cwd-relative from project root", () => {
      const key = documentationFileTrackingKey(0, "docs-site/i18n/en/code.json");
      const abs = resolveDocTrackingKeyToAbs(root, key);
      expect(abs).toBe(path.resolve(root, "docs-site/i18n/en/code.json"));
    });

    it("resolves plain relative paths without prefix", () => {
      const abs = resolveDocTrackingKeyToAbs("/project/root", "readme.md");
      expect(abs).toBe(path.resolve(root, "readme.md"));
    });

    it("falls back to full resolve when prefix present but no colon after block id", () => {
      const abs = resolveDocTrackingKeyToAbs("/project/root", "doc-block:orphan");
      expect(abs).toBe(path.resolve(root, "doc-block:orphan"));
    });
  });
});
