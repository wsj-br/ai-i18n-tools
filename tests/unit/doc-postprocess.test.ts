import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config";
import {
  applyMarkdownPostProcessing,
  applyRegexAdjustmentsToBody,
  buildLanguageSwitcherRows,
  buildMarkdownAdjustmentVars,
  extractLanguageListBlock,
  interpolateAdjustmentTemplate,
  parseAdjustmentSearchToRegExp,
  replaceLanguageListBlockInBody,
} from "../../src/processors/doc-postprocess";

describe("doc-postprocess", () => {
  it("parseAdjustmentSearchToRegExp uses plain pattern with g flag", () => {
    const re = parseAdjustmentSearchToRegExp("a+");
    expect(re.flags).toContain("g");
    expect("aa".replace(re, "x")).toBe("x");
  });

  it("parseAdjustmentSearchToRegExp parses slash form with flags", () => {
    const re = parseAdjustmentSearchToRegExp("/a/gi");
    expect(re.flags).toContain("g");
    expect("aA".replace(re, "x")).toBe("xx");
  });

  it("interpolateAdjustmentTemplate leaves unknown placeholders", () => {
    expect(interpolateAdjustmentTemplate("a ${known} b ${unknown}", { known: "K" })).toBe(
      "a K b ${unknown}"
    );
  });

  it("interpolates translatedLocale in regex replacement", () => {
    const vars = buildMarkdownAdjustmentVars(
      "/proj/README.md",
      "/proj/out/README.de.md",
      "en-GB",
      "de"
    );
    const body = "images/screenshots/en-GB/";
    const out = applyRegexAdjustmentsToBody(
      body,
      [
        {
          description: "screenshots",
          search: "images/screenshots/[^/]+/",
          replace: "images/screenshots/${translatedLocale}/",
        },
      ],
      vars,
      false,
      "README"
    );
    expect(out).toBe("images/screenshots/de/");
  });

  it("extractLanguageListBlock finds line-bounded block", () => {
    const cfg = { start: '<small id="lang-list">', end: "</small>", separator: " · " };
    const body = 'Intro\n<small id="lang-list">old</small>\nRest';
    const ext = extractLanguageListBlock(body, cfg);
    expect(ext).not.toBeNull();
    expect(ext!.block).toContain("lang-list");
  });

  it("extractLanguageListBlock returns null when start missing", () => {
    const cfg = { start: "<!--X-->", end: "<!--/X-->", separator: "" };
    expect(extractLanguageListBlock("no markers", cfg)).toBeNull();
  });

  it("extractLanguageListBlock spans lines when end on later line", () => {
    const cfg = { start: "<!--A-->", end: "<!--/A-->", separator: "" };
    const body = "x\n<!--A-->\nmid\n<!--/A-->\nz";
    const ext = extractLanguageListBlock(body, cfg);
    expect(ext).not.toBeNull();
    expect(ext!.startLine).toBeGreaterThanOrEqual(1);
  });

  it("replaceLanguageListBlockInBody returns replaced false when block missing", () => {
    const cfg = { start: "<!--MISS-->", end: "<!--/MISS-->", separator: "" };
    const { body, replaced } = replaceLanguageListBlockInBody("hello", cfg, "new");
    expect(replaced).toBe(false);
    expect(body).toBe("hello");
  });

  it("replaceLanguageListBlockInBody replaces block", () => {
    const cfg = { start: '<small id="lang-list">', end: "</small>", separator: " · " };
    const body = 'X\n<small id="lang-list">old</small>\nY';
    const { body: next, replaced } = replaceLanguageListBlockInBody(
      body,
      cfg,
      '<small id="lang-list">[en](README.md)</small>'
    );
    expect(replaced).toBe(true);
    expect(next).toContain("[en](README.md)");
    expect(next).not.toContain("old");
  });

  it("applyMarkdownPostProcessing runs regex then language list on body only", () => {
    const full = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        cacheDir: ".translation-cache",
        documentations: [
          {
            contentPaths: ["README.md"],
            outputDir: "translated-docs",
            markdownOutput: {
              style: "flat",
              postProcessing: {
                regexAdjustments: [
                  {
                    description: "x",
                    search: "FOO",
                    replace: "BAR",
                  },
                ],
                languageListBlock: {
                  start: "<!--LL-->",
                  end: "<!--/LL-->",
                  separator: " | ",
                },
              },
            },
          },
        ],
        targetLocales: ["de"],
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
    const md = `---
title: T
---
Hello FOO\n<!--LL--><!--/LL-->\n`;
    const out = applyMarkdownPostProcessing(md, {
      config: docCfg,
      cwd: "/proj",
      relPath: "README.md",
      locale: "de",
      absSource: "/proj/README.md",
      absTranslated: "/proj/translated-docs/README.de.md",
      verbose: false,
      docStem: "README",
    });
    expect(out).toContain("title: T");
    expect(out).toContain("Hello BAR");
    expect(out).toMatch(/<!--LL-->\[en-GB\]\(.*?README\.md.*?\)/);
    expect(out).toContain("<!--/LL-->");
  });

  it("applyRegexAdjustmentsToBody returns unchanged when rules empty", () => {
    expect(applyRegexAdjustmentsToBody("abc", [], {}, false, "d")).toBe("abc");
  });

  it("applyRegexAdjustmentsToBody skips invalid regex when verbose", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = applyRegexAdjustmentsToBody(
      "x",
      [{ description: "bad", search: "[", replace: "y" }],
      {},
      true,
      "MyDoc"
    );
    expect(out).toBe("x");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("applyMarkdownPostProcessing returns early when postProcessing absent", () => {
    const full = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        documentations: [
          {
            contentPaths: ["a.md"],
            outputDir: "out",
            markdownOutput: { style: "flat" as const },
          },
        ],
        targetLocales: ["de"],
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
    const md = "---\n---\nHi";
    const out = applyMarkdownPostProcessing(md, {
      config: docCfg,
      cwd: "/proj",
      relPath: "a.md",
      locale: "de",
      absSource: "/proj/a.md",
      absTranslated: "/proj/out/a.de.md",
      verbose: false,
      docStem: "a",
    });
    expect(out).toContain("Hi");
  });

  it("applyMarkdownPostProcessing returns early when postProcessing has no rules and no lang block", () => {
    const full = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en",
        cacheDir: ".translation-cache",
        documentations: [
          {
            contentPaths: ["a.md"],
            outputDir: "out",
            markdownOutput: {
              style: "flat" as const,
              postProcessing: {},
            },
          },
        ],
        targetLocales: ["de"],
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
    const md = "---\n---\nOnly";
    const out = applyMarkdownPostProcessing(md, {
      config: docCfg,
      cwd: "/proj",
      relPath: "a.md",
      locale: "de",
      absSource: "/proj/a.md",
      absTranslated: "/proj/out/a.de.md",
      verbose: false,
      docStem: "a",
    });
    expect(out).toContain("Only");
  });

  it("applyMarkdownPostProcessing warns when lang list missing and verbose", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const full = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        cacheDir: ".translation-cache",
        documentations: [
          {
            contentPaths: ["README.md"],
            outputDir: "translated-docs",
            markdownOutput: {
              style: "flat",
              postProcessing: {
                languageListBlock: {
                  start: "<!--LL-->",
                  end: "<!--/LL-->",
                  separator: " | ",
                },
              },
            },
          },
        ],
        targetLocales: ["de"],
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
    applyMarkdownPostProcessing("---\n---\nNo lang markers here\n", {
      config: docCfg,
      cwd: "/proj",
      relPath: "README.md",
      locale: "de",
      absSource: "/proj/README.md",
      absTranslated: "/proj/translated-docs/README.de.md",
      verbose: true,
      docStem: "README",
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("extractLanguageListBlock same-line start and end", () => {
    const cfg = { start: "<s>", end: "</s>", separator: "" };
    const ext = extractLanguageListBlock("pre\n<s>one line</s>\npost", cfg);
    expect(ext).not.toBeNull();
    expect(ext!.startLine).toBe(ext!.endLine);
  });

  it("buildLanguageSwitcherRows uses manifest when ui-languages.json exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "doc-pp-ui-"));
    const ui = path.join(dir, "ui-languages.json");
    fs.writeFileSync(
      ui,
      JSON.stringify([
        { code: "en", label: "English", englishName: "English" },
        { code: "de", label: "Deutsch", englishName: "German" },
      ]),
      "utf8"
    );
    try {
      const full = parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          uiLanguagesPath: "ui-languages.json",
          documentations: [
            {
              contentPaths: ["a.md"],
              outputDir: "out",
              targetLocales: ["de"],
              markdownOutput: { style: "flat" },
            },
          ],
          targetLocales: ["de"],
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
      const rows = buildLanguageSwitcherRows(docCfg, dir);
      expect(rows.length).toBeGreaterThanOrEqual(2);
      expect(rows.some((r) => r.code === "de")).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
