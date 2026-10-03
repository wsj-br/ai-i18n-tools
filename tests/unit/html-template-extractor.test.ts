import { describe, expect, it } from "vitest";
import { HtmlTemplateExtractor } from "../../src/extractors/html-template-extractor.js";

function roundTrip(html: string): string {
  const extractor = new HtmlTemplateExtractor();
  const segments = extractor.extract(html, "index.html");
  return extractor.reassemble(segments, new Map());
}

function translate(html: string, map: Record<string, string>): string {
  const extractor = new HtmlTemplateExtractor();
  const segments = extractor.extract(html, "index.html");
  const translations = new Map<string, string>();
  for (const seg of segments) {
    if (!seg.translatable) continue;
    const next = map[seg.content];
    if (next !== undefined) translations.set(seg.hash, next);
  }
  return extractor.reassemble(segments, translations);
}

describe("HtmlTemplateExtractor", () => {
  const fixtures = [
    "<!doctype html>\n<html lang=\"en\">\n<body><p>Hello</p></body>\n</html>\n",
    "<!-- comment -->\n<p>Hi</p>\n",
    "<pre>keep <b>this</b></pre>\n<p>After</p>\n",
    "<script>const x = \"<div>nope</div>\";</script><p>Yes</p>",
    "<p>Tom &amp; Jerry</p>\r\n<p>Next</p>\r\n",
    "<p>Run <code>build</code> now.</p>\n",
    "<img alt=\"Italian Trulli\" src=\"pic_trulli.jpg\">\n",
    "<meta charset=\"utf-8\">\n<title>Home</title>\n<meta name=\"description\" content=\"A page\">\n",
    "<input type=\"submit\" value=\"Send\">\n",
    "<p>Hello\n",
  ];

  it("round-trips fixtures byte for byte when nothing is translated", () => {
    for (const html of fixtures) {
      expect(roundTrip(html)).toBe(html);
    }
  });

  it("translates text, mixed inline content, and translatable attributes", () => {
    const html = `<p>Run <code>build</code> now.</p><img alt="Italian Trulli" src="pic.jpg"><title>Home</title>`;
    const extractor = new HtmlTemplateExtractor();
    const segments = extractor.extract(html, "index.html");
    const translatable = segments.filter((s) => s.translatable).map((s) => s.content);
    expect(translatable).toContain("Italian Trulli");
    expect(translatable).toContain("Home");
    expect(translatable.some((s) => s.includes("{{HTM_"))).toBe(true);

    const out = translate(html, {
      "Run {{HTM_0}} now.": "Execute {{HTM_0}} agora.",
      "Italian Trulli": "Trulli Italianos",
      Home: "Início",
    });
    expect(out).toContain("Execute <code>build</code> agora.");
    expect(out).toContain('alt="Trulli Italianos"');
    expect(out).toContain("<title>Início</title>");
    expect(out).toContain('src="pic.jpg"');
  });

  it("sets html lang and dir only when a locale context is provided", () => {
    const html = `<html lang="en"><body><p>Hi</p></body></html>`;
    const extractor = new HtmlTemplateExtractor();
    const segments = extractor.extract(html, "index.html");
    extractor.setReassembleContext({ locale: "ar", dir: "rtl" });
    const out = extractor.reassemble(segments, new Map());
    expect(out.startsWith(`<html lang="ar" dir="rtl">`)).toBe(true);
  });

  it("warns when charset is not utf-8", () => {
    const extractor = new HtmlTemplateExtractor();
    extractor.extract(`<meta charset="iso-8859-1"><p>Hi</p>`, "index.html");
    expect(extractor.charsetWarnings.length).toBe(1);
  });

  it("leaves script, style, and pre contents untranslated", () => {
    const html = `<script>alert("Hello")</script><style>.a{content:"Hello"}</style><pre>Hello</pre>`;
    const extractor = new HtmlTemplateExtractor();
    const segments = extractor.extract(html, "index.html");
    expect(segments.filter((s) => s.translatable)).toHaveLength(0);
  });
});
