import { SvgExtractor } from "../../src/extractors/svg-extractor.js";
import type { Segment } from "../../src/core/types.js";

describe("SvgExtractor", () => {
  it("extracts and reassembles desc", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">
  <desc id="d">A short description for screen readers.</desc>
  <text x="0" y="0">Label</text>
</svg>`;
    const x = new SvgExtractor();
    const segments = x.extract(svg, "t.svg");
    const descSeg = segments.find((s) => s.svg?.element === "desc");
    expect(descSeg).toBeDefined();
    expect(descSeg!.content).toBe("A short description for screen readers.");

    const translations = new Map<string, string>();
    translations.set(descSeg!.hash, "Une courte description.");

    const out = x.reassemble(segments, translations);
    expect(out).toContain("<desc");
    expect(out).toContain("Une courte description.");
    expect(out).not.toContain("A short description for screen readers.");
  });

  it("extracts <text> and reassembles with tspan wrapper", () => {
    const svg = `<svg><text x="1" y="2">Hello</text></svg>`;
    const ex = new SvgExtractor();
    const segs = ex.extract(svg, "i.svg");
    const t = segs.find((s) => s.svg?.element === "text");
    expect(t).toBeDefined();
    const m = new Map([[t!.hash, "Bonjour"]]);
    const out = ex.reassemble(segs, m);
    expect(out).toContain("<tspan>");
    expect(out).toContain("Bonjour");
    expect(out).not.toContain(">Hello<");
  });

  it("extracts <title> with attributes and reassembles", () => {
    const svg = `<svg><title id="t">My Title</title></svg>`;
    const ex = new SvgExtractor();
    const segs = ex.extract(svg, "a.svg");
    const title = segs.find((s) => s.svg?.element === "title");
    expect(title).toBeDefined();
    const out = ex.reassemble(segs, new Map([[title!.hash, "Mon titre"]]));
    expect(out).toContain('id="t"');
    expect(out).toContain("Mon titre");
  });

  it("extracts <title> without attributes", () => {
    const svg = `<svg><title>Plain</title></svg>`;
    const ex = new SvgExtractor();
    const segs = ex.extract(svg, "b.svg");
    expect(segs.some((s) => s.svg?.element === "title" && s.content === "Plain")).toBe(true);
  });

  it("reassembles <title> with no attribute branch (empty openingTag)", () => {
    const svg = `<svg><title>Plain</title></svg>`;
    const ex = new SvgExtractor();
    const segs = ex.extract(svg, "b.svg");
    const title = segs.find((s) => s.svg?.element === "title");
    expect(title).toBeDefined();
    const out = ex.reassemble(segs, new Map([[title!.hash, "Titre"]]));
    expect(out).toContain("<title>Titre</title>");
  });

  it("reassembles <desc> with no attributes", () => {
    const svg = `<svg><desc>Short</desc></svg>`;
    const ex = new SvgExtractor();
    const segs = ex.extract(svg, "d.svg");
    const d = segs.find((s) => s.svg?.element === "desc");
    expect(d).toBeDefined();
    const out = ex.reassemble(segs, new Map([[d!.hash, "Court"]]));
    expect(out).toContain("<desc>Court</desc>");
  });

  it("escapeXml escapes single quotes as &apos;", () => {
    const svg = `<svg><text>A</text></svg>`;
    const ex = new SvgExtractor();
    const segs = ex.extract(svg, "q.svg");
    const out = ex.reassemble(segs, new Map([[segs[0]!.hash, "it's"]]));
    expect(out).toContain("&apos;");
  });

  it("skips empty text/title/desc after stripping markup", () => {
    const svg = `<svg>
  <text></text>
  <text>   </text>
  <title></title>
  <desc><tspan> </tspan></desc>
</svg>`;
    const ex = new SvgExtractor();
    expect(ex.extract(svg, "empty.svg")).toHaveLength(0);
  });

  it("reassemble applies forceLowercase", () => {
    const svg = `<svg><text>HELLO</text></svg>`;
    const ex = new SvgExtractor({ forceLowercase: true });
    const segs = ex.extract(svg, "c.svg");
    const h = segs[0]!.hash;
    const out = ex.reassemble(segs, new Map([[h, "WORLD"]]));
    expect(out).toContain("world");
  });

  it("escapeXml escapes special characters in translation", () => {
    const svg = `<svg><text>A</text></svg>`;
    const ex = new SvgExtractor();
    const segs = ex.extract(svg, "d.svg");
    const out = ex.reassemble(segs, new Map([[segs[0]!.hash, 'B & C < "x"']]));
    expect(out).toContain("&amp;");
    expect(out).toContain("&lt;");
    expect(out).toContain("&quot;");
  });

  it("reassemble throws when extract was not called", () => {
    const ex = new SvgExtractor();
    expect(() => ex.reassemble([], new Map())).toThrow(/call extract\(\) first/);
  });

  it("reassemble skips segments without svg meta", () => {
    const svg = `<svg><text>Z</text></svg>`;
    const ex = new SvgExtractor();
    const segs = ex.extract(svg, "e.svg");
    const bogus: Segment = {
      id: "x",
      type: "paragraph",
      content: "nope",
      hash: "deadbeef",
      translatable: true,
    };
    const out = ex.reassemble([...segs, bogus], new Map([[segs[0]!.hash, "ZZ"]]));
    expect(out).toContain("ZZ");
  });

  it("canHandle accepts .svg case-insensitively", () => {
    const ex = new SvgExtractor();
    expect(ex.canHandle("x.SVG")).toBe(true);
    expect(ex.canHandle("x.png")).toBe(false);
  });
});
