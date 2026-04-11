import { SvgExtractor } from "../../src/extractors/svg-extractor.js";

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
});
