import { describe, expect, it } from "vitest";
import path from "path";
import {
  dictionaryFileTrackingKey,
  docBlockFileTrackingKeyToRelPath,
  documentationFileTrackingKey,
  fumadocsMetaFileTrackingKey,
  fumadocsUiFileTrackingKey,
  jsonBlockFileTrackingKey,
  metaFileTrackingKey,
  resolveDocTrackingKeyToAbs,
  vitepressThemeFileTrackingKey,
} from "../../src/core/doc-file-tracking.js";

describe("doc-file-tracking", () => {
  describe("documentationFileTrackingKey", () => {
    it("namespaces block index and normalizes backslashes to slashes", () => {
      expect(documentationFileTrackingKey(0, "docs\\guide.md")).toBe("doc-block:0:docs/guide.md");
      expect(documentationFileTrackingKey(2, "a/b.md")).toBe("doc-block:2:a/b.md");
    });
  });

  describe("jsonBlockFileTrackingKey", () => {
    it("namespaces JSON block keys and normalizes separators", () => {
      expect(jsonBlockFileTrackingKey(0, "i18n\\en\\code.json")).toBe(
        "json-block:0:i18n/en/code.json"
      );
      expect(jsonBlockFileTrackingKey(3, "messages/fr.json")).toBe("json-block:3:messages/fr.json");
    });
  });

  describe("metaFileTrackingKey", () => {
    it("namespaces nextra meta keys and normalizes separators", () => {
      expect(metaFileTrackingKey(1, "content\\en\\_meta.js")).toBe(
        "nextra-meta:1:content/en/_meta.js"
      );
      expect(metaFileTrackingKey(0, "pages/_meta.ts")).toBe("nextra-meta:0:pages/_meta.ts");
    });
  });

  describe("fumadocsMetaFileTrackingKey", () => {
    it("namespaces fumadocs meta keys and normalizes separators", () => {
      expect(fumadocsMetaFileTrackingKey(0, "content\\docs\\meta.json")).toBe(
        "fumadocs-meta:0:content/docs/meta.json"
      );
      expect(fumadocsMetaFileTrackingKey(2, "content/docs/guide/meta.json")).toBe(
        "fumadocs-meta:2:content/docs/guide/meta.json"
      );
    });
  });

  describe("dictionaryFileTrackingKey", () => {
    it("namespaces nextra dictionary keys and normalizes separators", () => {
      expect(dictionaryFileTrackingKey(0, "dictionaries\\en.json")).toBe(
        "nextra-dictionary:0:dictionaries/en.json"
      );
      expect(dictionaryFileTrackingKey(1, "dictionaries/pt.json")).toBe(
        "nextra-dictionary:1:dictionaries/pt.json"
      );
    });
  });

  describe("vitepressThemeFileTrackingKey", () => {
    it("namespaces vitepress theme keys and normalizes separators", () => {
      expect(vitepressThemeFileTrackingKey(0, ".vitepress\\theme\\index.ts")).toBe(
        "vitepress-theme:0:.vitepress/theme/index.ts"
      );
      expect(vitepressThemeFileTrackingKey(4, ".vitepress/config.ts")).toBe(
        "vitepress-theme:4:.vitepress/config.ts"
      );
    });
  });

  describe("fumadocsUiFileTrackingKey", () => {
    it("namespaces fumadocs UI keys and normalizes separators", () => {
      expect(fumadocsUiFileTrackingKey(0, "lib\\i18n\\ui.ts")).toBe("fumadocs-ui:0:lib/i18n/ui.ts");
      expect(fumadocsUiFileTrackingKey(1, "lib/i18n/ui.ts")).toBe("fumadocs-ui:1:lib/i18n/ui.ts");
    });
  });

  describe("resolveDocTrackingKeyToAbs", () => {
    const root = path.resolve("/project/root");

    it("strips doc-block prefix and resolves relative segment", () => {
      const key = documentationFileTrackingKey(1, "docs/x.md");
      const abs = resolveDocTrackingKeyToAbs("/project/root", key);
      expect(abs).toBe(path.resolve(root, "docs/x.md"));
    });

    it("resolves JSON block keys when path is cwd-relative from project root", () => {
      const key = jsonBlockFileTrackingKey(0, "docs-site/i18n/en/code.json");
      const abs = resolveDocTrackingKeyToAbs(root, key);
      expect(abs).toBe(path.resolve(root, "docs-site/i18n/en/code.json"));
    });

    it("resolves nextra meta, dictionary, and fumadocs meta keys", () => {
      expect(resolveDocTrackingKeyToAbs(root, metaFileTrackingKey(0, "pages/_meta.js"))).toBe(
        path.resolve(root, "pages/_meta.js")
      );
      expect(
        resolveDocTrackingKeyToAbs(root, dictionaryFileTrackingKey(2, "dictionaries/en.json"))
      ).toBe(path.resolve(root, "dictionaries/en.json"));
      expect(
        resolveDocTrackingKeyToAbs(root, fumadocsMetaFileTrackingKey(1, "content/docs/meta.json"))
      ).toBe(path.resolve(root, "content/docs/meta.json"));
    });

    it("resolves vitepress theme and fumadocs UI keys", () => {
      expect(
        resolveDocTrackingKeyToAbs(root, vitepressThemeFileTrackingKey(0, ".vitepress/theme.ts"))
      ).toBe(path.resolve(root, ".vitepress/theme.ts"));
      expect(resolveDocTrackingKeyToAbs(root, fumadocsUiFileTrackingKey(3, "lib/i18n/ui.ts"))).toBe(
        path.resolve(root, "lib/i18n/ui.ts")
      );
    });

    it("resolves plain relative paths without prefix", () => {
      const abs = resolveDocTrackingKeyToAbs("/project/root", "readme.md");
      expect(abs).toBe(path.resolve(root, "readme.md"));
    });

    it("falls back to full resolve when prefix present but no colon after block id", () => {
      expect(resolveDocTrackingKeyToAbs("/project/root", "doc-block:orphan")).toBe(
        path.resolve(root, "doc-block:orphan")
      );
      expect(resolveDocTrackingKeyToAbs(root, "json-block:orphan")).toBe(
        path.resolve(root, "json-block:orphan")
      );
      expect(resolveDocTrackingKeyToAbs(root, "nextra-meta:orphan")).toBe(
        path.resolve(root, "nextra-meta:orphan")
      );
      expect(resolveDocTrackingKeyToAbs(root, "fumadocs-ui:orphan")).toBe(
        path.resolve(root, "fumadocs-ui:orphan")
      );
    });

    it("leaves unrelated prefixed keys as plain paths", () => {
      expect(resolveDocTrackingKeyToAbs(root, "svg-files:icons/x.svg")).toBe(
        path.resolve(root, "svg-files:icons/x.svg")
      );
    });
  });

  describe("docBlockFileTrackingKeyToRelPath", () => {
    it("strips doc-block index prefix", () => {
      expect(docBlockFileTrackingKeyToRelPath("doc-block:0:README.md")).toBe("README.md");
      expect(docBlockFileTrackingKeyToRelPath("doc-block:12:docs/guide.md")).toBe("docs/guide.md");
    });

    it("returns input unchanged for non doc-block keys", () => {
      expect(docBlockFileTrackingKeyToRelPath("README.md")).toBe("README.md");
      expect(docBlockFileTrackingKeyToRelPath("svg-files:icons/x.svg")).toBe(
        "svg-files:icons/x.svg"
      );
      expect(docBlockFileTrackingKeyToRelPath("json-block:0:a.json")).toBe("json-block:0:a.json");
    });

    it("returns input unchanged when doc-block prefix is malformed", () => {
      expect(docBlockFileTrackingKeyToRelPath("doc-block:orphan")).toBe("doc-block:orphan");
    });
  });
});
