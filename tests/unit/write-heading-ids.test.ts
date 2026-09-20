import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import { runWriteHeadingIds } from "../../src/cli/write-heading-ids.js";

function writeFile(abs: string, body: string): void {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body, "utf8");
}

describe("runWriteHeadingIds", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ai-i18n-whi-"));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("writes source ids and repairs a mid-heading id in the translated file", () => {
    writeFile(path.join(tmp, "docs", "security.md"), "## HTTPS with a reverse proxy\n");
    writeFile(
      path.join(tmp, "i18n", "hi", "docs", "security.md"),
      "## रिवर्स प्रॉक्सी {/* #https-with-a-reverse-proxy */} के साथ HTTPS\n"
    );
    const config = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["hi"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: { translateDocs: true },
        ui: { sourceRoots: [], stringsJson: "s.json", flatOutputDir: "locales" },
        cacheDir: ".cache",
        docs: [
          {
            contentPaths: ["docs/"],
            outputDir: "i18n",
            docsOutput: { style: "nested", docsRoot: "docs" },
          },
        ],
      })
    );

    const sum = runWriteHeadingIds({
      cwd: tmp,
      config,
      slugStyle: "mdx-comment",
      dryRun: false,
      verbose: false,
    });

    expect(sum.filesWritten).toBe(1);
    expect(sum.translatedFilesWritten).toBe(1);
    expect(fs.readFileSync(path.join(tmp, "docs", "security.md"), "utf8")).toBe(
      "## HTTPS with a reverse proxy {/* #https-with-a-reverse-proxy */}\n"
    );
    expect(fs.readFileSync(path.join(tmp, "i18n", "hi", "docs", "security.md"), "utf8")).toBe(
      "## रिवर्स प्रॉक्सी के साथ HTTPS {/* #https-with-a-reverse-proxy */}\n"
    );
  });

  it("skips a missing translated file and strips mid-line ids with --remove", () => {
    writeFile(path.join(tmp, "docs", "a.md"), "## Hello {/* #hello */}\n");
    writeFile(path.join(tmp, "docs", "b.md"), "## Other {/* #other */}\n");
    writeFile(path.join(tmp, "i18n", "de", "docs", "a.md"), "## Hallo {/* #hello */} extra\n");
    const config = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        targetLocales: ["de", "fr"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        features: { translateDocs: true },
        ui: { sourceRoots: [], stringsJson: "s.json", flatOutputDir: "locales" },
        cacheDir: ".cache",
        docs: [
          {
            contentPaths: ["docs/"],
            outputDir: "i18n",
            docsOutput: { style: "nested", docsRoot: "docs" },
          },
        ],
      })
    );

    const sum = runWriteHeadingIds({
      cwd: tmp,
      config,
      slugStyle: "mdx-comment",
      dryRun: false,
      verbose: false,
      remove: true,
    });

    expect(sum.filesWritten).toBe(2);
    expect(sum.translatedFilesWritten).toBe(1);
    expect(fs.readFileSync(path.join(tmp, "docs", "a.md"), "utf8")).toBe("## Hello\n");
    expect(fs.readFileSync(path.join(tmp, "i18n", "de", "docs", "a.md"), "utf8")).toBe(
      "## Hallo extra\n"
    );
    expect(fs.existsSync(path.join(tmp, "i18n", "fr", "docs", "a.md"))).toBe(false);
  });
});
