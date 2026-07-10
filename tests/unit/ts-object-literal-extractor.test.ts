import { describe, expect, it } from "vitest";
import {
  applyTsLiteralTranslations,
  extractTsObjectLiteralStrings,
} from "../../src/extractors/ts-object-literal-extractor.js";

describe("extractTsObjectLiteralStrings (meta)", () => {
  it("extracts shorthand and title literals from _meta.ts", () => {
    const src = `export default {
  index: { type: "page", title: "Home" },
  guide: "Guide",
  advanced: { title: "Advanced", type: "separator" },
};`;
    const { segments, spans } = extractTsObjectLiteralStrings(src, "_meta.ts", "meta");
    expect(segments.map((s) => s.jsonKey).sort()).toEqual(
      ["advanced.title", "guide", "index.title"].sort()
    );
    expect(spans.length).toBe(3);
  });

  it("skips href, type values, empty strings, and URLs", () => {
    const src = `export default {
  external: { title: "Docs", href: "https://example.com" },
  empty: "",
  skipType: { type: "page", title: "Visible" },
};`;
    const { segments } = extractTsObjectLiteralStrings(src, "_meta.ts", "meta");
    expect(segments.map((s) => s.jsonKey).sort()).toEqual(
      ["external.title", "skipType.title"].sort()
    );
  });

  it("extracts all string leaves for dictionary policy", () => {
    const src = `export default {
  siteTitle: "Hello",
  nested: { label: "World" },
};`;
    const { segments } = extractTsObjectLiteralStrings(src, "en.ts", "dictionary");
    expect(segments.map((s) => s.jsonKey).sort()).toEqual(["nested.label", "siteTitle"].sort());
  });

  it("applyTsLiteralTranslations replaces by byte offset", () => {
    const src = `export default { title: "Hello" };`;
    const { segments, spans } = extractTsObjectLiteralStrings(src, "en.ts", "dictionary");
    const hash = segments[0]!.hash;
    const out = applyTsLiteralTranslations(src, spans, new Map([[hash, "Hola"]]));
    expect(out).toContain('"Hola"');
    expect(out).not.toContain('"Hello"');
  });
});

describe("extractTsObjectLiteralStrings (_meta.tsx)", () => {
  it("extracts object literal strings from _meta.tsx export default", () => {
    const src = `export default {
  index: { title: "Getting started" },
  advanced: { title: "Advanced", type: "separator" },
};`;
    const { segments } = extractTsObjectLiteralStrings(src, "_meta.tsx", "meta");
    expect(segments.map((s) => s.content).sort()).toEqual(["Advanced", "Getting started"].sort());
  });
});
