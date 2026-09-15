import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildMarkdownExtractOpts,
  translateMarkdownFile,
  type TranslateRunOptions,
} from "../../src/cli/doc-translate.js";
import { hashFileContent } from "../../src/cli/helpers.js";
import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config.js";
import { TranslationCache } from "../../src/core/cache.js";
import { documentationFileTrackingKey } from "../../src/core/doc-file-tracking.js";
import { MarkdownExtractor } from "../../src/extractors/markdown-extractor.js";
import { Glossary } from "../../src/glossary/glossary.js";

const SOURCE = "Hello world.\n";
const HI_TRANSLATION = "नमस्ते दुनिया।";

function makeDocConfig() {
  const full = parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en-GB",
      targetLocales: ["hi"],
      cacheDir: ".translation-cache",
      docs: [
        {
          contentPaths: ["page.md"],
          outputDir: "out",
          addFrontmatter: false,
          docsOutput: { style: "nested" as const },
        },
      ],
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels: ["m"],
        maxTokens: 100,
        temperature: 0.1,
      },
      features: {
        translateDocs: true,
        translateUIStrings: false,
      },
    })
  );
  return toDocTranslateConfig(full, full.docs[0]!);
}

function baseOpts(cwd: string, extra?: Partial<TranslateRunOptions>): TranslateRunOptions {
  return {
    cwd,
    locales: ["hi"],
    dryRun: false,
    force: false,
    forceUpdate: false,
    noCache: false,
    verbose: false,
    documentationBlockIndex: 0,
    ...extra,
  };
}

describe("translateMarkdownFile file-level skip vs --check-cache", () => {
  let dir: string | undefined;
  let cache: TranslationCache | undefined;

  afterEach(() => {
    cache?.close();
    cache = undefined;
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
      dir = undefined;
    }
  });

  function setupUnchangedHiFile(): {
    cwd: string;
    abs: string;
    config: ReturnType<typeof makeDocConfig>;
  } {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "doc-check-cache-"));
    const abs = path.join(dir, "page.md");
    const outPath = path.join(dir, "out", "hi", "page.md");
    fs.writeFileSync(abs, SOURCE, "utf8");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${HI_TRANSLATION}\n`, "utf8");
    const nowSec = Date.now() / 1000;
    fs.utimesSync(abs, nowSec - 20, nowSec - 20);
    fs.utimesSync(outPath, nowSec, nowSec);

    cache = new TranslationCache(":memory:");
    const fileHash = hashFileContent(SOURCE);
    cache.setFileStatus(documentationFileTrackingKey(0, "page.md"), "hi", fileHash);

    const config = makeDocConfig();
    const md = new MarkdownExtractor();
    const segments = md.extract(SOURCE, "page.md", buildMarkdownExtractOpts(config.doc));
    for (const s of segments) {
      if (s.translatable) {
        cache.setSegment(s.hash, "hi", s.content, HI_TRANSLATION, "test/model", "page.md", 1);
      }
    }
    return { cwd: dir, abs, config };
  }

  it("skips an unchanged tracked file for hi without --check-cache", async () => {
    const { cwd, abs, config } = setupUnchangedHiFile();
    const glossary = new Glossary(undefined, undefined, ["hi"]);
    const { skipped, totals } = await translateMarkdownFile(
      abs,
      "page.md",
      "hi",
      config,
      cache!,
      null,
      glossary,
      baseOpts(cwd),
      new Set(),
      new Set(["page.md"])
    );
    expect(skipped).toBe(true);
    expect(totals.filesSkipped).toBe(1);
    expect(totals.filesProcessed).toBe(0);
    expect(totals.filesWritten).toBe(0);
  });

  it("reprocesses an unchanged tracked hi file when --check-cache is set", async () => {
    const { cwd, abs, config } = setupUnchangedHiFile();
    const glossary = new Glossary(undefined, undefined, ["hi"]);
    const { skipped, totals } = await translateMarkdownFile(
      abs,
      "page.md",
      "hi",
      config,
      cache!,
      null,
      glossary,
      baseOpts(cwd, { checkCache: true }),
      new Set(),
      new Set(["page.md"])
    );
    expect(skipped).toBe(false);
    expect(totals.filesProcessed).toBe(1);
    expect(totals.filesWritten).toBe(1);
    expect(totals.segmentsCached).toBeGreaterThan(0);
    expect(totals.segmentsTranslated).toBe(0);
  });
});
