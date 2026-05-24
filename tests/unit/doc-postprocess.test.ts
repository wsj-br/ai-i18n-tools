import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config.js";
import {
  applyMarkdownPostProcessing,
  applyRegexAdjustmentsToBody,
  buildLanguageSwitcherRows,
  buildMarkdownAdjustmentVars,
  extractLanguageListBlock,
  interpolateAdjustmentTemplate,
  parseAdjustmentSearchToRegExp,
  replaceLanguageListBlockInBody,
} from "../../src/processors/doc-postprocess.js";

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
    const cfg = {
      start: '<small id="lang-list">',
      end: "</small>",
      separator: " · ",
      label: "english" as const,
    };
    const body = 'Intro\n<small id="lang-list">old</small>\nRest';
    const ext = extractLanguageListBlock(body, cfg);
    expect(ext).not.toBeNull();
    expect(ext!.block).toContain("lang-list");
  });

  it("extractLanguageListBlock returns null when start missing", () => {
    const cfg = { start: "<!--X-->", end: "<!--/X-->", separator: "", label: "english" as const };
    expect(extractLanguageListBlock("no markers", cfg)).toBeNull();
  });

  it("extractLanguageListBlock spans lines when end on later line", () => {
    const cfg = { start: "<!--A-->", end: "<!--/A-->", separator: "", label: "english" as const };
    const body = "x\n<!--A-->\nmid\n<!--/A-->\nz";
    const ext = extractLanguageListBlock(body, cfg);
    expect(ext).not.toBeNull();
    expect(ext!.startLine).toBeGreaterThanOrEqual(1);
  });

  it("extractLanguageListBlock ignores start/end markers inside fenced code blocks", () => {
    const cfg = {
      start: '<small id="lang-list">',
      end: "</small>",
      separator: " · ",
      label: "english" as const,
    };
    const body = [
      "```json",
      '  "markdownOutput": {',
      '    "postProcessing": {',
      '      "languageListBlock": {',
      '        "start": "<small id=\\"lang-list\\">",',
      '        "end": "</small>"',
      "      }",
      "    }",
      "  }",
      "}",
      "```",
      "",
      '<small id="lang-list">[en](README.md)</small>',
    ].join("\n");
    const ext = extractLanguageListBlock(body, cfg);
    const lines = body.split(/\r?\n/);
    expect(ext).not.toBeNull();
    expect(ext!.block).toContain("[en](README.md)");
    expect(ext!.startLine).toBe(lines.findIndex((l) => l.includes("[en](README.md)")));
  });

  it("replaceLanguageListBlockInBody returns replaced false when block missing", () => {
    const cfg = {
      start: "<!--MISS-->",
      end: "<!--/MISS-->",
      separator: "",
      label: "english" as const,
    };
    const { body, replaced } = replaceLanguageListBlockInBody("hello", cfg, "new");
    expect(replaced).toBe(false);
    expect(body).toBe("hello");
  });

  it("replaceLanguageListBlockInBody replaces block", () => {
    const cfg = {
      start: '<small id="lang-list">',
      end: "</small>",
      separator: " · ",
      label: "english" as const,
    };
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
        docs: [
          {
            contentPaths: ["README.md"],
            outputDir: "translated-docs",
            docsOutput: {
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
                  label: "english",
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
          translateDocs: true,

          translateUIStrings: false,
        },
      })
    );
    const docCfg = toDocTranslateConfig(full, full.docs[0]!);
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
    expect(out).toMatch(/<!--LL-->\[English \(GB\)\]\(.*?README\.md.*?\)/);
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
        docs: [
          {
            contentPaths: ["a.md"],
            outputDir: "out",
            docsOutput: { style: "flat" as const },
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
          translateDocs: true,

          translateUIStrings: false,
        },
      })
    );
    const docCfg = toDocTranslateConfig(full, full.docs[0]!);
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
        docs: [
          {
            contentPaths: ["a.md"],
            outputDir: "out",
            docsOutput: {
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
          translateDocs: true,

          translateUIStrings: false,
        },
      })
    );
    const docCfg = toDocTranslateConfig(full, full.docs[0]!);
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
        docs: [
          {
            contentPaths: ["README.md"],
            outputDir: "translated-docs",
            docsOutput: {
              style: "flat",
              postProcessing: {
                languageListBlock: {
                  start: "<!--LL-->",
                  end: "<!--/LL-->",
                  separator: " | ",
                  label: "english",
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
          translateDocs: true,

          translateUIStrings: false,
        },
      })
    );
    const docCfg = toDocTranslateConfig(full, full.docs[0]!);
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
    const cfg = { start: "<s>", end: "</s>", separator: "", label: "english" as const };
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
        { code: "en", label: "English", englishName: "English", direction: "ltr" },
        { code: "de", label: "Deutsch", englishName: "German", direction: "ltr" },
      ]),
      "utf8"
    );
    try {
      const full = parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          uiLanguagesPath: "ui-languages.json",
          docs: [
            {
              contentPaths: ["a.md"],
              outputDir: "out",
              targetLocales: ["de"],
              docsOutput: { style: "flat" },
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
            translateDocs: true,

            translateUIStrings: false,
          },
        })
      );
      const docCfg = toDocTranslateConfig(full, full.docs[0]!);
      const rows = buildLanguageSwitcherRows(docCfg, dir);
      expect(rows.length).toBeGreaterThanOrEqual(2);
      expect(rows.some((r) => r.code === "de")).toBe(true);
      expect(rows.find((r) => r.code === "de")?.label).toBe("Deutsch");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("buildLanguageSwitcherRows supports english labels via languageListBlock.label", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "doc-pp-ui-en-"));
    const ui = path.join(dir, "ui-languages.json");
    fs.writeFileSync(
      ui,
      JSON.stringify([
        { code: "en", label: "English", englishName: "English", direction: "ltr" },
        { code: "de", label: "Deutsch", englishName: "German", direction: "ltr" },
      ]),
      "utf8"
    );
    try {
      const full = parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en",
          cacheDir: ".translation-cache",
          uiLanguagesPath: "ui-languages.json",
          docs: [
            {
              contentPaths: ["a.md"],
              outputDir: "out",
              targetLocales: ["de"],
              docsOutput: {
                style: "flat",
                postProcessing: {
                  languageListBlock: {
                    start: "<s>",
                    end: "</s>",
                    separator: " | ",
                    label: "english",
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
            translateDocs: true,

            translateUIStrings: false,
          },
        })
      );
      const docCfg = toDocTranslateConfig(full, full.docs[0]!);
      const rows = buildLanguageSwitcherRows(docCfg, dir);
      expect(rows.find((r) => r.code === "de")?.label).toBe("German");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("buildLanguageSwitcherRows falls back to bundled master local labels when ui-languages.json is missing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "doc-pp-master-local-"));
    try {
      const full = parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en-GB",
          cacheDir: ".translation-cache",
          docs: [
            {
              contentPaths: ["a.md"],
              outputDir: "out",
              targetLocales: ["de", "zh-TW"],
              docsOutput: {
                style: "flat",
                postProcessing: {
                  languageListBlock: {
                    start: "<s>",
                    end: "</s>",
                    separator: " | ",
                    label: "local",
                  },
                },
              },
            },
          ],
          targetLocales: ["de", "zh-TW"],
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
      const docCfg = toDocTranslateConfig(full, full.docs[0]!);
      const rows = buildLanguageSwitcherRows(docCfg, dir);
      expect(rows.find((r) => r.code === "de")?.label).toBe("Deutsch");
      expect(rows.find((r) => r.code === "zh-TW")?.label).toContain("中文");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("buildLanguageSwitcherRows falls back to bundled master english labels when ui-languages.json is missing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "doc-pp-master-en-"));
    try {
      const full = parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en-GB",
          cacheDir: ".translation-cache",
          docs: [
            {
              contentPaths: ["a.md"],
              outputDir: "out",
              targetLocales: ["de", "zh-TW"],
              docsOutput: {
                style: "flat",
                postProcessing: {
                  languageListBlock: {
                    start: "<s>",
                    end: "</s>",
                    separator: " | ",
                    label: "english",
                  },
                },
              },
            },
          ],
          targetLocales: ["de", "zh-TW"],
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
      const docCfg = toDocTranslateConfig(full, full.docs[0]!);
      const rows = buildLanguageSwitcherRows(docCfg, dir);
      expect(rows.find((r) => r.code === "de")?.label).toBe("German");
      expect(rows.find((r) => r.code === "zh-TW")?.label).toBe("Chinese (TW)");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("buildLanguageSwitcherRows falls back to localeDisplayNames/codes when manifest and master are unavailable", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "doc-pp-no-manifest-no-master-"));
    const existsSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false);
    try {
      const full = parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en-GB",
          localeDisplayNames: { "en-GB": "English UK" },
          cacheDir: ".translation-cache",
          docs: [
            {
              contentPaths: ["a.md"],
              outputDir: "out",
              targetLocales: ["de"],
              docsOutput: {
                style: "flat",
                postProcessing: {
                  languageListBlock: {
                    start: "<s>",
                    end: "</s>",
                    separator: " | ",
                    label: "local",
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
            translateDocs: true,

            translateUIStrings: false,
          },
        })
      );
      const docCfg = toDocTranslateConfig(full, full.docs[0]!);
      const rows = buildLanguageSwitcherRows(docCfg, dir);
      expect(rows).toEqual([
        { code: "en-GB", label: "English UK" },
        { code: "de", label: "de" },
      ]);
    } finally {
      existsSpy.mockRestore();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
