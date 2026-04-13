import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config";
import { rewriteSourceMarkdownLanguageListBlocks } from "../../src/cli/doc-translate";

describe("rewriteSourceMarkdownLanguageListBlocks", () => {
  it("rewrites the original markdown language list with all locales", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "doc-source-lang-list-"));
    const readmePath = path.join(dir, "README.md");
    fs.writeFileSync(readmePath, 'Intro\n<small id="lang-list">old</small>\n', "utf8");

    try {
      const full = parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en-GB",
          cacheDir: ".translation-cache",
          documentations: [
            {
              contentPaths: ["README.md"],
              outputDir: "translated-docs",
              markdownOutput: {
                style: "flat" as const,
                postProcessing: {
                  languageListBlock: {
                    start: '<small id="lang-list">',
                    end: "</small>",
                    separator: " | ",
                  },
                },
              },
            },
          ],
          targetLocales: ["de", "fr"],
          openrouter: {
            baseUrl: "https://openrouter.ai/api/v1",
            translationModels: ["m"],
            maxTokens: 100,
            temperature: 0.1,
          },
          features: {
            translateMarkdown: true,
            translateJSON: false,
            extractUIStrings: false,
            translateUIStrings: false,
          },
        })
      );
      const docCfg = toDocTranslateConfig(full, full.documentations[0]!);

      const rewritten = rewriteSourceMarkdownLanguageListBlocks(
        docCfg,
        {
          cwd: dir,
          locales: ["de", "fr"],
          dryRun: false,
          force: false,
          forceUpdate: false,
          noCache: true,
          verbose: false,
        },
        ["README.md"]
      );

      expect(rewritten).toBe(1);

      const output = fs.readFileSync(readmePath, "utf8");
      expect(output).toContain('[en-GB](./README.md)');
      expect(output).toContain('[de](./translated-docs/README.de.md)');
      expect(output).toContain('[fr](./translated-docs/README.fr.md)');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
