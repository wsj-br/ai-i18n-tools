import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { translateHtmlFile, rewriteSourceHtmlMarkerBlocks } from "../../src/cli/doc-translate.js";
import { TranslationCache } from "../../src/core/cache.js";
import { mergeWithDefaults, parseI18nConfig, toDocTranslateConfig } from "../../src/core/config.js";
import {
  filterGeneratedHtmlOutputs,
  isGeneratedHtmlOutput,
  overlappingHtmlSources,
} from "../../src/core/html-source-filter.js";
import { resolveDocumentationOutputPath } from "../../src/core/output-paths.js";
import { Glossary } from "../../src/glossary/glossary.js";
import { applyHtmlMarkerBlocks } from "../../src/processors/html-marker-blocks.js";
import { rewriteHtmlLinks } from "../../src/processors/html-link-rewrite.js";
import type { I18nDocTranslateConfig } from "../../src/core/types.js";

const temps: string[] = [];

function tmp(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "html-docs-"));
  temps.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of temps.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function docConfig(docsOutput: Record<string, unknown>): I18nDocTranslateConfig {
  const full = parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en",
      targetLocales: ["pt-BR"],
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels: ["m"],
        maxTokens: 100,
        temperature: 0.1,
      },
      features: { translateDocs: true, translateUIStrings: false },
      ui: { sourceRoots: [], stringsJson: "s.json", flatOutputDir: "locales" },
      cacheDir: ".cache",
      docs: [
        {
          contentPaths: ["site/"],
          outputDir: "site",
          docsOutput,
        },
      ],
    })
  );
  return toDocTranslateConfig(full, full.docs[0]!);
}

describe("generated HTML exclusion", () => {
  it("drops locale trees and flat locale filenames under outputDir", () => {
    const locales = ["en", "pt-BR"];
    expect(isGeneratedHtmlOutput("site/pt-BR/index.html", "site", locales)).toBe(true);
    expect(isGeneratedHtmlOutput("site/index.pt-BR.html", "site", locales)).toBe(true);
    expect(isGeneratedHtmlOutput("site/index.html", "site", locales)).toBe(false);
    expect(
      filterGeneratedHtmlOutputs(
        ["site/index.html", "site/pt-BR/about.html", "site/about.pt-br.html"],
        ["site"],
        locales
      )
    ).toEqual(["site/index.html"]);
  });

  it("reports HTML that is both a catalog source and a document", () => {
    expect(
      overlappingHtmlSources(["public/index.html", "other.html"], ["public/index.html"])
    ).toEqual(["public/index.html"]);
  });
});

describe("HTML link rewrite", () => {
  it("rewrites page links, srcset, and locale images only when the file exists", () => {
    const cwd = tmp();
    fs.mkdirSync(path.join(cwd, "site", "img"), { recursive: true });
    fs.writeFileSync(path.join(cwd, "site", "img", "pic-pt-BR.jpg"), "x");
    fs.writeFileSync(path.join(cwd, "site", "logo.svg"), "<svg/>");
    const config = docConfig({
      style: "nested",
      docsRoot: "site",
      localizedAssets: {
        include: ["img/**", "*.svg"],
        pattern: "{stem}-{locale}{ext}",
        onlyIfExists: true,
      },
    });
    const html = rewriteHtmlLinks(
      `<a href="about.html">About</a><img src="img/pic.jpg" srcset="img/pic.jpg 1x, img/missing.png 2x"><img src="https://cdn.example/a.jpg"><img src="logo.svg"><source src="/img/pic.jpg">`,
      {
        cwd,
        config,
        locale: "pt-BR",
        sourceRelPath: "site/index.html",
        translatedHtmlRelPaths: new Set(["site/index.html", "site/about.html"]),
        localizedAssets: config.doc.docsOutput.localizedAssets,
      }
    );
    expect(html).toContain('href="./about.html"');
    expect(html).toContain('src="../img/pic-pt-BR.jpg"');
    expect(html).toContain("../img/pic-pt-BR.jpg 1x");
    expect(html).toContain("../img/missing.png 2x");
    expect(html).toContain('src="https://cdn.example/a.jpg"');
    expect(html).toContain('src="../logo.svg"');
    expect(html).toContain('src="/img/pic-pt-BR.jpg"');
  });
});

describe("HTML marker blocks", () => {
  it("fills links, select options, and hreflang, and leaves markers in code alone", () => {
    const cwd = tmp();
    const rel = "site/index.html";
    fs.mkdirSync(path.join(cwd, "site"), { recursive: true });
    const source = `<!DOCTYPE html><html lang="en"><head>
<!-- ai-i18n:hreflang -->
<!-- /ai-i18n:hreflang -->
<script>var x = "<!-- ai-i18n:hreflang --><!-- /ai-i18n:hreflang -->";</script>
</head><body>
<nav><ul>
<!-- ai-i18n:lang-list -->
<!-- /ai-i18n:lang-list -->
</ul></nav>
<pre><!-- ai-i18n:lang-list -->keep<!-- /ai-i18n:lang-list --></pre>
</body></html>`;
    fs.writeFileSync(path.join(cwd, rel), source);
    const config = docConfig({
      style: "nested",
      html: {
        languageList: { format: "links", label: "english" },
        hreflang: { siteUrl: "https://example.com", xDefault: "en", stripIndexHtml: true },
      },
    });
    const outPath = resolveDocumentationOutputPath(config, cwd, "pt-BR", rel, "html");
    const once = applyHtmlMarkerBlocks(source, {
      cwd,
      config,
      locale: "pt-BR",
      sourceRelPath: rel,
      absCurrentFile: outPath,
      availableLocales: new Set(["en", "pt-BR"]),
      languageList: { ...config.doc.docsOutput.html!.languageList!, format: "links" },
      hreflang: config.doc.docsOutput.html!.hreflang!,
    });
    expect(once).toContain('hreflang="pt-BR"');
    expect(once).toContain('hreflang="x-default"');
    expect(once).toContain("https://example.com/");
    expect(once).toContain("<li><a ");
    expect(once).toContain('var x = "<!-- ai-i18n:hreflang --><!-- /ai-i18n:hreflang -->"');
    expect(once).toContain("<pre><!-- ai-i18n:lang-list -->keep<!-- /ai-i18n:lang-list --></pre>");
    const again = applyHtmlMarkerBlocks(once, {
      cwd,
      config,
      locale: "pt-BR",
      sourceRelPath: rel,
      absCurrentFile: outPath,
      availableLocales: new Set(["en", "pt-BR"]),
      languageList: config.doc.docsOutput.html!.languageList!,
      hreflang: config.doc.docsOutput.html!.hreflang!,
    });
    expect(again).toBe(once);
  });

  it("emits option rows for format select and relative hreflang without siteUrl", () => {
    const cwd = tmp();
    const rel = "site/index.html";
    fs.mkdirSync(path.join(cwd, "site"), { recursive: true });
    const source = `<html><head><!-- ai-i18n:hreflang --><!-- /ai-i18n:hreflang --></head>
<body><select><!-- ai-i18n:lang-list --><!-- /ai-i18n:lang-list --></select></body></html>`;
    fs.writeFileSync(path.join(cwd, rel), source);
    const config = docConfig({
      style: "nested",
      html: { languageList: { format: "select", label: "both" } },
    });
    const out = applyHtmlMarkerBlocks(source, {
      cwd,
      config,
      locale: "en",
      sourceRelPath: rel,
      absCurrentFile: path.join(cwd, rel),
      availableLocales: new Set(["en", "pt-BR"]),
      languageList: {
        ...config.doc.docsOutput.html!.languageList!,
        format: "select",
        label: "both",
      },
      hreflang: {
        start: "<!-- ai-i18n:hreflang -->",
        end: "<!-- /ai-i18n:hreflang -->",
        stripIndexHtml: false,
      },
    });
    expect(out).toContain("<option ");
    expect(out).toContain("selected");
    expect(out).not.toContain("https://");
    expect(out).toContain('rel="alternate"');
  });
});

describe("translateHtmlFile", () => {
  it("writes a locale page, refreshes the English markers, and skips a second run", async () => {
    const cwd = tmp();
    fs.mkdirSync(path.join(cwd, "site", "img"), { recursive: true });
    fs.writeFileSync(path.join(cwd, "site", "img", "pic-pt-BR.jpg"), "jpeg");
    const page = `<!DOCTYPE html><html lang="en"><head>
<!-- ai-i18n:hreflang --><!-- /ai-i18n:hreflang -->
</head><body>
<p>Hello</p>
<img src="img/pic.jpg" alt="Italian Trulli">
<a href="about.html">About</a>
<nav><ul><!-- ai-i18n:lang-list --><!-- /ai-i18n:lang-list --></ul></nav>
</body></html>`;
    fs.writeFileSync(path.join(cwd, "site", "index.html"), page);
    fs.writeFileSync(path.join(cwd, "site", "about.html"), page.replace("Hello", "About page"));
    const config = docConfig({
      style: "nested",
      docsRoot: "site",
      localizedAssets: {
        include: ["img/**"],
        pattern: "{stem}-{locale}{ext}",
        onlyIfExists: true,
      },
      html: {
        hreflang: { siteUrl: "https://example.com", xDefault: "en" },
      },
    });
    const cache = new TranslationCache(path.join(cwd, ".cache"));
    const glossary = new Glossary(undefined, undefined, ["pt-BR"]);
    const opts = {
      cwd,
      locales: ["pt-BR"],
      dryRun: false,
      force: false,
      forceUpdate: false,
      noCache: false,
      verbose: false,
      checkCache: false,
    };
    const files = new Set(["site/index.html", "site/about.html"]);
    const first = await translateHtmlFile(
      path.join(cwd, "site", "index.html"),
      "site/index.html",
      "pt-BR",
      config,
      cache,
      null,
      glossary,
      opts,
      new Set(),
      files
    );
    expect(first.skipped).toBe(false);
    const written = fs.readFileSync(path.join(cwd, "site", "pt-BR", "index.html"), "utf8");
    expect(written).toContain('lang="pt-BR"');
    expect(written).toContain("Hello");
    expect(written).toContain("../img/pic-pt-BR.jpg");
    expect(written).toContain('href="./about.html"');
    expect(written).toContain('hreflang="pt-BR"');
    expect(written).toContain("<li>");
    const second = await translateHtmlFile(
      path.join(cwd, "site", "index.html"),
      "site/index.html",
      "pt-BR",
      config,
      cache,
      null,
      glossary,
      opts,
      new Set(),
      files
    );
    expect(second.skipped).toBe(true);
    const refreshed = rewriteSourceHtmlMarkerBlocks(config, opts, ["site/index.html"]);
    expect(refreshed).toBe(1);
    const source = fs.readFileSync(path.join(cwd, "site", "index.html"), "utf8");
    expect(source).toContain('hreflang="en"');
    expect(source).toContain("<li>");
    expect(rewriteSourceHtmlMarkerBlocks(config, opts, ["site/index.html"])).toBe(0);
    cache.close();
  });
});
