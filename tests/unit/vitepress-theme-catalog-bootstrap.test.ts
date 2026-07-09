import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapVitepressThemeCatalog } from "../../src/cli/vitepress-theme-catalog.js";
import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config.js";

describe("bootstrapVitepressThemeCatalog", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Regression: config loading rewrites `docsOutput.style` from the `"vitepress"` alias to
  // canonical `"doc-system"`. Bootstrap must still trigger via `stylePreset`, which is what a
  // real `sync` / `translate-docs` run sees — not the raw, pre-normalization style value.
  it("bootstraps the catalog when docsOutput.style has been normalized to doc-system", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vitepress-theme-normalized-"));
    fs.mkdirSync(path.join(tmpDir, "docs/.vitepress"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, "docs/.vitepress/config.mts"),
      `import { defineConfig } from "vitepress";
export default defineConfig({
  title: "Site title",
  themeConfig: { nav: [{ text: "Guide", link: "/guide/" }] },
});`
    );

    const full = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        targetLocales: ["pt-BR"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: { translateDocs: true },
        docs: [
          {
            contentPaths: ["docs/index.md"],
            outputDir: "docs",
            docsOutput: {
              style: "vitepress",
              docsRoot: "docs",
              vitepressThemeCatalog: {
                configPath: "docs/.vitepress/config.mts",
                catalogPath: "docs/.vitepress/i18n/theme.en.json",
              },
            },
          },
        ],
      })
    );
    const config = toDocTranslateConfig(full, full.docs[0]!);
    expect(config.doc.docsOutput.style).toBe("doc-system");
    expect(config.doc.docsOutput.stylePreset).toBe("vitepress");

    const result = bootstrapVitepressThemeCatalog(config, tmpDir, {
      force: false,
      dryRun: false,
      verbose: false,
    });
    expect(result).not.toBeNull();
    expect(result?.updated).toBe(true);

    const catalogPath = path.join(tmpDir, "docs/.vitepress/i18n/theme.en.json");
    expect(fs.existsSync(catalogPath)).toBe(true);
    const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as Record<string, unknown>;
    expect(catalog.title).toBe("Site title");
  });

  it("returns null when the docsOutput style is not vitepress, even with a catalog configured", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vitepress-theme-wrong-style-"));
    fs.mkdirSync(path.join(tmpDir, "docs/.vitepress"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, "docs/.vitepress/config.mts"),
      `export default { title: "Site title" };`
    );

    const full = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        targetLocales: ["pt-BR"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: { translateDocs: true },
        docs: [
          {
            contentPaths: ["docs/index.md"],
            outputDir: "docs",
            docsOutput: {
              style: "flat",
              vitepressThemeCatalog: {
                configPath: "docs/.vitepress/config.mts",
                catalogPath: "docs/.vitepress/i18n/theme.en.json",
              },
            },
          },
        ],
      })
    );
    const config = toDocTranslateConfig(full, full.docs[0]!);

    const result = bootstrapVitepressThemeCatalog(config, tmpDir, {
      force: false,
      dryRun: false,
      verbose: false,
    });
    expect(result).toBeNull();
  });
});
