import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapFumadocsUiCatalog } from "../../src/cli/fumadocs-ui-catalog.js";
import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config.js";

describe("bootstrapFumadocsUiCatalog", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("bootstraps catalog when docsOutput.style is normalized to doc-system", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fumadocs-ui-normalized-"));
    fs.mkdirSync(path.join(tmpDir, "lib/i18n"), { recursive: true });
    fs.copyFileSync(
      path.join(process.cwd(), "tests/fixtures/fumadocs-dot/lib/layout.shared.ts"),
      path.join(tmpDir, "lib/layout.shared.ts")
    );

    const full = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        targetLocales: ["pt"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: { translateDocs: true },
        docs: [
          {
            contentPaths: ["content/docs"],
            outputDir: "content/docs",
            docsOutput: {
              style: "fumadocs",
              docsRoot: "content/docs",
              fumadocsParser: "dot",
              fumadocsUiCatalog: {
                sourcePath: "lib/layout.shared.ts",
                catalogPath: "lib/i18n/ui.en.json",
              },
            },
          },
        ],
      })
    );
    const config = toDocTranslateConfig(full, full.docs[0]!);
    expect(config.doc.docsOutput.stylePreset).toBe("fumadocs");

    const result = bootstrapFumadocsUiCatalog(config, tmpDir, {
      force: false,
      dryRun: false,
      verbose: false,
    });
    expect(result).not.toBeNull();
    expect(result?.updated).toBe(true);

    const catalogPath = path.join(tmpDir, "lib/i18n/ui.en.json");
    expect(fs.existsSync(catalogPath)).toBe(true);
    const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as Record<string, string>;
    expect(catalog["Search(search trigger)"]).toBe("Search docs");
  });

  it("returns null when docsOutput style is not fumadocs", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fumadocs-ui-wrong-style-"));
    fs.mkdirSync(path.join(tmpDir, "lib"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "lib/layout.shared.ts"), "export const x = 1;\n");

    const full = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        targetLocales: ["pt"],
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
              fumadocsUiCatalog: {
                sourcePath: "lib/layout.shared.ts",
                catalogPath: "lib/i18n/ui.en.json",
              },
            },
          },
        ],
      })
    );
    const config = toDocTranslateConfig(full, full.docs[0]!);

    const result = bootstrapFumadocsUiCatalog(config, tmpDir, {
      force: false,
      dryRun: false,
      verbose: false,
    });
    expect(result).toBeNull();
  });
});
