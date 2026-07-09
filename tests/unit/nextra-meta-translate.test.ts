import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { collectNextraMetaFiles } from "../../src/cli/nextra-meta-translate.js";
import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config.js";
import type { I18nDocTranslateConfig } from "../../src/core/types.js";

describe("collectNextraMetaFiles", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("collects _meta files under docsRoot for nextra style", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextra-meta-"));
    fs.mkdirSync(path.join(tmpDir, "content/en/guide"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "content/en/_meta.ts"), "export default {};\n");
    fs.writeFileSync(path.join(tmpDir, "content/en/guide/_meta.ts"), "export default {};\n");
    fs.writeFileSync(path.join(tmpDir, "content/en/index.mdx"), "# Hi\n");

    const config = {
      doc: {
        contentPaths: ["content/en"],
        outputDir: "content",
        docsOutput: { style: "nextra" as const, docsRoot: "content/en" },
      },
      features: { translateDocs: true },
    } as I18nDocTranslateConfig;

    const files = collectNextraMetaFiles(tmpDir, config);
    expect(files.sort()).toEqual(["content/en/_meta.ts", "content/en/guide/_meta.ts"].sort());
  });

  // Regression: config loading rewrites `docsOutput.style` from the `"nextra"` alias to
  // canonical `"doc-system"`. Collection must still trigger via `stylePreset`, which is what a
  // real `sync` / `translate-docs` run sees — not the raw, pre-normalization style value.
  it("collects _meta files when docsOutput.style has been normalized to doc-system", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextra-meta-normalized-"));
    fs.mkdirSync(path.join(tmpDir, "content/en"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "content/en/_meta.ts"), "export default {};\n");

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
            contentPaths: ["content/en"],
            outputDir: "content",
            docsOutput: { style: "nextra", docsRoot: "content/en" },
          },
        ],
      })
    );
    const config = toDocTranslateConfig(full, full.docs[0]!);
    expect(config.doc.docsOutput.style).toBe("doc-system");
    expect(config.doc.docsOutput.stylePreset).toBe("nextra");

    const files = collectNextraMetaFiles(tmpDir, config);
    expect(files).toEqual(["content/en/_meta.ts"]);
  });

  it("uses nextraMetaGlob to override the default docsRoot walk when set", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextra-meta-glob-"));
    fs.mkdirSync(path.join(tmpDir, "content/en/guide"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "other-root"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "content/en/_meta.ts"), "export default {};\n");
    fs.writeFileSync(path.join(tmpDir, "content/en/guide/_meta.ts"), "export default {};\n");
    fs.writeFileSync(path.join(tmpDir, "other-root/_meta.ts"), "export default {};\n");

    const config = {
      doc: {
        contentPaths: ["content/en"],
        outputDir: "content",
        nextraMetaGlob: "other-root/**/_meta.ts",
        docsOutput: { style: "nextra" as const, docsRoot: "content/en" },
      },
      features: { translateDocs: true },
    } as I18nDocTranslateConfig;

    const files = collectNextraMetaFiles(tmpDir, config);
    expect(files).toEqual(["other-root/_meta.ts"]);
  });

  it("accepts an array of glob patterns for nextraMetaGlob", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextra-meta-glob-array-"));
    fs.mkdirSync(path.join(tmpDir, "content/en/guide"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "content/en/_meta.ts"), "export default {};\n");
    fs.writeFileSync(path.join(tmpDir, "content/en/guide/_meta.ts"), "export default {};\n");

    const config = {
      doc: {
        contentPaths: ["content/en"],
        outputDir: "content",
        nextraMetaGlob: ["content/en/_meta.ts"],
        docsOutput: { style: "nextra" as const, docsRoot: "content/en" },
      },
      features: { translateDocs: true },
    } as I18nDocTranslateConfig;

    const files = collectNextraMetaFiles(tmpDir, config);
    expect(files).toEqual(["content/en/_meta.ts"]);
  });
});
