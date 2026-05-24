import { describe, expect, it } from "vitest";
import {
  AstroTemplateExtractor,
  adjustRelativeImportsInFrontmatter,
  computeImportDepthDelta,
  findMatchingBrace,
  isProtectedExpressionAttributeValue,
  isTranslatableExpressionString,
  isTranslatablePlainText,
  mergeAstroProtectionContext,
} from "../../src/extractors/astro-template-extractor.js";
import { segmentTranslationText } from "../../src/core/types.js";

describe("isTranslatablePlainText", () => {
  it("accepts prose and rejects whitespace-only", () => {
    expect(isTranslatablePlainText("Up and running")).toBe(true);
    expect(isTranslatablePlainText("   ")).toBe(false);
    expect(isTranslatablePlainText("<br/>")).toBe(false);
  });
});

describe("mergeAstroProtectionContext", () => {
  it("merges config protectAttributes and protectKeys with defaults", () => {
    const ctx = mergeAstroProtectionContext({
      protectAttributes: ["variant", "size"],
      protectKeys: ["slug", "code"],
    });
    expect(ctx.protectedAttributeNames.has("class")).toBe(true);
    expect(ctx.protectedAttributeNames.has("variant")).toBe(true);
    expect(ctx.protectedAttributeNames.has("size")).toBe(true);
    expect(ctx.protectedKeyNames.has("key")).toBe(true);
    expect(ctx.protectedKeyNames.has("slug")).toBe(true);
    expect(ctx.protectedKeyNames.has("code")).toBe(true);
    expect(ctx.protectedKeyNames.has("variant")).toBe(false);
  });
});

describe("isProtectedExpressionAttributeValue", () => {
  it("protects class, id, style, and data-* attribute values", () => {
    expect(isProtectedExpressionAttributeValue("class=")).toBe(true);
    expect(isProtectedExpressionAttributeValue("class = ")).toBe(true);
    expect(isProtectedExpressionAttributeValue("<motion.div id=")).toBe(true);
    expect(isProtectedExpressionAttributeValue("style=")).toBe(true);
    expect(isProtectedExpressionAttributeValue("data-testid=")).toBe(true);
    expect(isProtectedExpressionAttributeValue("aria-hidden=")).toBe(true);
    expect(isProtectedExpressionAttributeValue("class: ")).toBe(true);
    expect(isProtectedExpressionAttributeValue("key: ")).toBe(true);
  });

  it("does not protect translatable attrs or object copy fields", () => {
    expect(isProtectedExpressionAttributeValue("alt=")).toBe(false);
    expect(isProtectedExpressionAttributeValue("aria-label=")).toBe(false);
    expect(isProtectedExpressionAttributeValue("title: ")).toBe(false);
    expect(isProtectedExpressionAttributeValue("desc: ")).toBe(false);
  });
  it("honors extra protectAttributes and protectKeys from config", () => {
    const ctx = mergeAstroProtectionContext({
      protectAttributes: ["variant"],
      protectKeys: ["slug"],
    });
    expect(isProtectedExpressionAttributeValue("variant=", ctx)).toBe(true);
    expect(isProtectedExpressionAttributeValue("slug: ", ctx)).toBe(true);
    expect(isProtectedExpressionAttributeValue("title: ", ctx)).toBe(false);
  });
});

describe("isTranslatableExpressionString", () => {
  it("accepts list copy and rejects URLs, anchors, and t() keys", () => {
    expect(isTranslatableExpressionString("30+ UI Languages", "title: ")).toBe(true);
    expect(isTranslatableExpressionString("Features", "['#features', ")).toBe(true);
    expect(isTranslatableExpressionString("#features", "[")).toBe(false);
    expect(isTranslatableExpressionString("https://example.com", "[")).toBe(false);
    expect(isTranslatableExpressionString("dynamic", "{t(")).toBe(false);
  });

  it("rejects CSS class and id strings inside JSX expressions", () => {
    expect(isTranslatableExpressionString("provider-badge", "class=")).toBe(false);
    expect(isTranslatableExpressionString("text-slate-200", "<span class=")).toBe(false);
    expect(isTranslatableExpressionString("text-xs px-2 py-0.5 rounded-full", "<span class=")).toBe(
      false
    );
    expect(isTranslatableExpressionString("providers", "id=")).toBe(false);
  });

  it("rejects shell snippets, API keys, and container image references", () => {
    expect(isTranslatableExpressionString("docker run -it foo", "[")).toBe(false);
    expect(isTranslatableExpressionString("npm install pkg", "[")).toBe(false);
    expect(isTranslatableExpressionString("sk-or-v1-abc123", "[")).toBe(false);
    expect(isTranslatableExpressionString("pull ghcr.io/org/img:latest", "[")).toBe(false);
    expect(isTranslatableExpressionString("OPENROUTER_API_KEY=secret", "[")).toBe(false);
  });
});

describe("findMatchingBrace", () => {
  it("balances nested braces in expressions", () => {
    const src = "{ foo({ bar: 1 }) } rest";
    const end = findMatchingBrace(src, 0);
    expect(src.slice(0, end)).toBe("{ foo({ bar: 1 }) }");
  });

  it("returns start+1 when text does not begin with {", () => {
    expect(findMatchingBrace("not a brace", 0)).toBe(1);
  });

  it("skips strings, line comments, block comments, and template literals", () => {
    const src = '{ a: "}" /* } */ // }\n`x${ { inner: 1 } }` }';
    const end = findMatchingBrace(src, 0);
    expect(src.slice(0, end)).toBe('{ a: "}" /* } */ // }\n`x${ { inner: 1 } }` }');
  });

  it("returns text.length when closing brace is missing", () => {
    const src = "{ unclosed";
    expect(findMatchingBrace(src, 0)).toBe(src.length);
  });
});

describe("computeImportDepthDelta", () => {
  it("adds one level for locale folder under pages", () => {
    expect(computeImportDepthDelta("src/pages/index.astro", "src/pages/de/index.astro")).toBe(1);
  });
});

describe("adjustRelativeImportsInFrontmatter", () => {
  it("prepends ../ for deeper output paths", () => {
    const fm = `---
import Layout from '../layouts/Main.astro';
---
`;
    expect(adjustRelativeImportsInFrontmatter(fm, 1)).toContain("from '../../layouts/Main.astro'");
  });

  it("leaves frontmatter unchanged when depthDelta is zero", () => {
    const fm = `---
import Layout from '../layouts/Main.astro';
---
`;
    expect(adjustRelativeImportsInFrontmatter(fm, 0)).toBe(fm);
  });
});

describe("computeImportDepthDelta edge cases", () => {
  it("returns zero when output is not deeper than source", () => {
    expect(computeImportDepthDelta("src/pages/de/index.astro", "src/pages/index.astro")).toBe(0);
    expect(computeImportDepthDelta("index.astro", "index.astro")).toBe(0);
  });
});

describe("AstroTemplateExtractor", () => {
  const extractor = new AstroTemplateExtractor();

  it("canHandle only .astro files", () => {
    expect(extractor.canHandle("page.astro")).toBe(true);
    expect(extractor.canHandle("Page.ASTRO")).toBe(true);
    expect(extractor.canHandle("page.tsx")).toBe(false);
  });

  it("extracts text nodes split by inline tags", () => {
    const content = [
      "---",
      "const x = 1;",
      "---",
      '<h2 class="hero">Up and running<br/>in minutes</h2>',
    ].join("\n");
    const segments = extractor.extract(content, "page.astro");
    const translatable = segments.filter((s) => s.translatable).map((s) => s.content.trim());
    expect(translatable).toContain("Up and running");
    expect(translatable).toContain("in minutes");
  });

  it("skips script, style, and dynamic t() calls", () => {
    const content = [
      "---",
      "import { t } from './t';",
      "---",
      "<style>.x { color: red; }</style>",
      "<script>const label = 'Do not translate';</script>",
      "<p>{t('dynamic')}</p>",
      "<p>Static visible text</p>",
    ].join("\n");
    const segments = extractor.extract(content, "page.astro");
    const translatable = segments.filter((s) => s.translatable).map((s) => s.content);
    expect(translatable).not.toContain("Do not translate");
    expect(translatable).not.toContain("dynamic");
    expect(translatable).toContain("Static visible text");
    const scriptSeg = segments.find((s) => s.type === "code" && s.content.includes("<script"));
    expect(scriptSeg?.translatable).toBe(false);
    expect(segments.some((s) => s.content.includes("{t('dynamic')}"))).toBe(true);
  });

  it("extracts string literals inside template expressions", () => {
    const content = [
      "---",
      "---",
      "<ul>",
      "{['Complete execution history with filters', 'Export history to CSV'].map(item => (",
      "  <li>{item}</li>",
      "))}",
      "</ul>",
      "<motion>",
      "{[{ icon: '🌍', title: '30+ UI Languages', desc: 'Full RTL support included' }].map(f => (",
      "  <div>{f.title}</motion>",
      "))}",
      "</motion>",
    ].join("\n");
    const segments = extractor.extract(content, "page.astro");
    const translatable = segments.filter((s) => s.translatable).map((s) => s.content);
    expect(translatable).toContain("Complete execution history with filters");
    expect(translatable).toContain("Export history to CSV");
    expect(translatable).toContain("30+ UI Languages");
    expect(translatable).toContain("Full RTL support included");
    expect(translatable).not.toContain("🌍");
  });

  it("reassembles translated expression string literals with escaping", () => {
    const content = ["---", "---", "{['Hello world'].map(item => <li>{item}</li>)}"].join("\n");
    const segments = extractor.extract(content, "page.astro");
    const hello = segments.find((s) => s.translatable && s.content === "Hello world")!;
    const translations = new Map<string, { text: string }>([[hello.hash, { text: "L'histoire" }]]);
    const out = extractor.reassemble(segments, translations);
    expect(out).toContain("['L\\'histoire']");
  });

  it("skips custom protectAttributes from setExtractOptions", () => {
    const customExtractor = new AstroTemplateExtractor();
    customExtractor.setExtractOptions({ protectAttributes: ["variant"] });
    const content = [
      "---",
      "---",
      "{items.map(item => (",
      '  <div variant="primary">{item.label}</div>',
      "))}",
    ].join("\n");
    const segments = customExtractor.extract(content, "page.astro");
    const translatable = segments.filter((s) => s.translatable).map((s) => s.content);
    expect(translatable).not.toContain("primary");
  });

  it("skips class attributes inside JSX map expressions", () => {
    const content = [
      "---",
      "---",
      '<motion.div class="flex flex-wrap">',
      "{providers.map(p => (",
      '  <motion.div class="provider-badge" style={`color: ${p.color};`}>',
      '    <span class="w-2 h-2 rounded-full flex-shrink-0">{p.name}</span>',
      "  </motion.div>",
      "))}",
      "</motion.div>",
    ].join("\n");
    const segments = extractor.extract(content, "page.astro");
    const translatable = segments.filter((s) => s.translatable).map((s) => s.content);
    expect(translatable).not.toContain("provider-badge");
    expect(translatable).not.toContain("w-2 h-2 rounded-full flex-shrink-0");
    expect(translatable).not.toContain("flex flex-wrap");
  });

  it("skips static HTML attrs listed in protectAttributes", () => {
    const content = `---
---
<img src="/logo.svg" alt="Keep brand" title="Do not translate title" />`;
    const customExtractor = new AstroTemplateExtractor();
    customExtractor.setExtractOptions({ protectAttributes: ["title"] });
    const segments = customExtractor.extract(content, "page.astro");
    expect(segments.some((s) => s.translatable && s.content === "Keep brand")).toBe(true);
    expect(segments.some((s) => s.translatable && s.content === "Do not translate title")).toBe(
      false
    );
  });

  it("extracts translatable alt attributes", () => {
    const content = `---
---
<img src="/logo.svg" alt="Transrewrt Logo" />`;
    const segments = extractor.extract(content, "page.astro");
    expect(segments.some((s) => s.translatable && s.content === "Transrewrt Logo")).toBe(true);
  });

  it("skips HTML comments and protected attribute values", () => {
    const content = [
      "---",
      "---",
      "<!-- keep * and ` out of diagnostics -->",
      '<p aria-hidden="true">Visible</p>',
    ].join("\n");
    const segments = extractor.extract(content, "page.astro");
    expect(segments.some((s) => s.content.includes("<!-- keep"))).toBe(true);
    expect(segments.some((s) => s.translatable && s.content === "true")).toBe(false);
    expect(segments.some((s) => s.translatable && s.content === "Visible")).toBe(true);
  });

  it("handles unclosed style blocks and quoted attributes with escapes", () => {
    const content = [
      "---",
      "---",
      '<div data-x="say \\"hi\\""></div>',
      "<style>.x { color: red }</style>",
      "<p>After style</p>",
    ].join("\n");
    const segments = extractor.extract(content, "page.astro");
    expect(segments.some((s) => s.type === "code" && s.content.includes("<style"))).toBe(true);
    expect(segments.some((s) => s.translatable && s.content === "After style")).toBe(true);
  });

  it("parses expression literals with line and block comments", () => {
    const content = [
      "---",
      "---",
      "<p>{",
      "  // comment only",
      "  /* block */",
      "  'Translatable line'",
      "}</p>",
    ].join("\n");
    const segments = extractor.extract(content, "page.astro");
    expect(segments.some((s) => s.translatable && s.content === "Translatable line")).toBe(true);
  });

  it("reassembles with double-quote escaping when adjacent quotes are double", () => {
    const content = ["---", "---", '{["Say \\"hi\\""].map(x => x)}'].join("\n");
    const segments = extractor.extract(content, "page.astro");
    const seg = segments.find((s) => s.translatable && s.content.includes("hi"))!;
    const out = extractor.reassemble(segments, new Map([[seg.hash, { text: 'She said "ok"' }]]));
    expect(out).toContain('\\"ok\\"');
  });

  it("reassembles with translations and adjusts imports", () => {
    const content = [
      "---",
      "import Layout from '../layouts/Main.astro';",
      "---",
      "<h2>Hello<br/><strong>World</strong></h2>",
    ].join("\n");
    const segments = extractor.extract(content, "src/pages/index.astro");
    const translations = new Map<string, { text: string }>();
    for (const s of segments.filter((seg) => seg.translatable)) {
      if (s.content === "Hello") {
        translations.set(s.hash, { text: "Hola" });
      }
      if (s.content === "World") {
        translations.set(s.hash, { text: "Mundo" });
      }
    }
    extractor.setReassembleContext({
      importDepthDelta: computeImportDepthDelta(
        "src/pages/index.astro",
        "src/pages/es/index.astro"
      ),
    });
    const out = extractor.reassemble(segments, translations);
    expect(out).toContain("Hola");
    expect(out).toContain("Mundo");
    expect(out).toContain("from '../../layouts/Main.astro'");
    expect(
      segmentTranslationText(translations.get(segments.find((s) => s.content === "Hello")!.hash)!)
    ).toBe("Hola");
  });
});
