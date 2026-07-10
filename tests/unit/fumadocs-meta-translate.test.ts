import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { collectFumadocsMetaFiles } from "../../src/cli/fumadocs-meta-translate.js";
import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config.js";
import { resolveDocumentationOutputPath } from "../../src/core/output-paths.js";
import type { I18nDocTranslateConfig } from "../../src/core/types.js";

describe("collectFumadocsMetaFiles", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("collects meta.json under docsRoot for fumadocs dot parser", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fumadocs-meta-dot-"));
    fs.mkdirSync(path.join(tmpDir, "content/docs/guide"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "content/docs/meta.json"), "{}\n");
    fs.writeFileSync(path.join(tmpDir, "content/docs/guide/meta.json"), "{}\n");
    fs.writeFileSync(path.join(tmpDir, "content/docs/meta.pt.json"), "{}\n");

    const config = {
      doc: {
        contentPaths: ["content/docs"],
        outputDir: "content/docs",
        docsOutput: {
          style: "fumadocs" as const,
          docsRoot: "content/docs",
          fumadocsParser: "dot" as const,
        },
      },
      features: { translateDocs: true },
      targetLocales: ["pt"],
    } as I18nDocTranslateConfig;

    const files = collectFumadocsMetaFiles(tmpDir, config);
    expect(files.sort()).toEqual(["content/docs/guide/meta.json", "content/docs/meta.json"].sort());
  });

  it("collects meta.json when style normalized to doc-system", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fumadocs-meta-normalized-"));
    fs.mkdirSync(path.join(tmpDir, "content/docs/en"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "content/docs/en/meta.json"), "{}\n");

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
            contentPaths: ["content/docs/en"],
            outputDir: "content/docs",
            docsOutput: {
              style: "fumadocs",
              docsRoot: "content/docs/en",
              fumadocsParser: "dir",
            },
          },
        ],
      })
    );
    const config = toDocTranslateConfig(full, full.docs[0]!);
    expect(config.doc.docsOutput.stylePreset).toBe("fumadocs");

    const files = collectFumadocsMetaFiles(tmpDir, config);
    expect(files).toEqual(["content/docs/en/meta.json"]);
  });
});

describe("fumadocs meta output paths", () => {
  const cwd = "/proj";

  function cfg(over: Record<string, unknown> = {}) {
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
        docs: [over],
      })
    );
    return toDocTranslateConfig(full, full.docs[0]!);
  }

  it("writes meta.{locale}.json for dot parser", () => {
    const c = cfg({
      contentPaths: ["content/docs"],
      outputDir: "content/docs",
      docsOutput: {
        style: "fumadocs",
        docsRoot: "content/docs",
        fumadocsParser: "dot",
      },
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "pt",
      "content/docs/guide/meta.json",
      "markdown"
    );
    expect(out.replace(/\\/g, "/")).toBe("/proj/content/docs/guide/meta.pt.json");
  });

  it("writes locale folder meta.json for dir parser", () => {
    const c = cfg({
      contentPaths: ["content/docs/en"],
      outputDir: "content/docs",
      docsOutput: {
        style: "fumadocs",
        docsRoot: "content/docs/en",
        fumadocsParser: "dir",
      },
    });
    const out = resolveDocumentationOutputPath(
      c,
      cwd,
      "pt-BR",
      "content/docs/en/guide/meta.json",
      "markdown"
    );
    expect(out.replace(/\\/g, "/")).toBe("/proj/content/docs/pt-BR/guide/meta.json");
  });
});
