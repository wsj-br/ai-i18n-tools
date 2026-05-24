import { describe, expect, it } from "vitest";
import { NestedJsonExtractor } from "../../src/extractors/nested-json-extractor.js";
import type { JsonKeyPolicyConfig } from "../../src/core/types.js";
import { segmentTranslationText } from "../../src/core/types.js";

const denySlug: JsonKeyPolicyConfig = {
  mode: "denylist",
  skipKeys: ["slug", "id"],
  translateKeys: [],
};

describe("NestedJsonExtractor", () => {
  const extractor = new NestedJsonExtractor();

  it("extracts string leaves and skips denylisted key paths", () => {
    const json = JSON.stringify({
      nav: { home: { label: "Home", slug: "home" } },
      id: "root-id",
    });
    const segments = extractor.extract(json, "bundle.json", denySlug);
    const paths = segments.map((s) => s.jsonKey).sort();
    expect(paths).toEqual(["nav.home.label"]);
  });

  it("allowlist mode only translates matching paths", () => {
    const policy: JsonKeyPolicyConfig = {
      mode: "allowlist",
      skipKeys: [],
      translateKeys: ["nav.*"],
    };
    const json = JSON.stringify({ nav: { a: "A" }, footer: "Footer" });
    const segments = extractor.extract(json, "x.json", policy);
    expect(segments.map((s) => s.jsonKey)).toEqual(["nav.a"]);
  });

  it("reassembles translated leaves into JSON", () => {
    const json = JSON.stringify({ title: "Hello" });
    const segments = extractor.extract(json, "x.json", {
      mode: "denylist",
      skipKeys: [],
      translateKeys: [],
    });
    const hash = segments[0]!.hash;
    const out = extractor.reassemble(segments, new Map([[hash, { text: "Hola" }]]));
    expect(JSON.parse(out)).toEqual({ title: "Hola" });
    expect(segmentTranslationText({ text: "Hola" })).toBe("Hola");
  });

  it("canHandle only matches .json paths", () => {
    expect(extractor.canHandle("bundle.json")).toBe(true);
    expect(extractor.canHandle("BUNDLE.JSON")).toBe(true);
    expect(extractor.canHandle("readme.md")).toBe(false);
  });

  it("throws a parse error that includes the filepath", () => {
    expect(() => extractor.extract("{ not json", "broken.json", denySlug)).toThrow(
      /Failed to parse JSON file broken\.json/
    );
  });

  it("both mode requires allowlist match and not denylisted", () => {
    const policy: JsonKeyPolicyConfig = {
      mode: "both",
      skipKeys: ["*.secret"],
      translateKeys: ["nav.*"],
    };
    const json = JSON.stringify({
      nav: { title: "Home", secret: "x" },
      footer: "Footer",
    });
    const segments = extractor.extract(json, "x.json", policy);
    expect(segments.map((s) => s.jsonKey)).toEqual(["nav.title"]);
  });

  it("extracts string leaves inside arrays with numeric paths", () => {
    const json = JSON.stringify({ items: ["One", "Two"] });
    const segments = extractor.extract(json, "x.json", {
      mode: "denylist",
      skipKeys: [],
      translateKeys: [],
    });
    expect(segments.map((s) => s.jsonKey).sort()).toEqual(["items.0", "items.1"]);
    const byPath = new Map(segments.map((s) => [s.jsonKey!, s.hash]));
    const out = extractor.reassemble(
      segments,
      new Map([
        [byPath.get("items.0")!, { text: "Eins" }],
        [byPath.get("items.1")!, { text: "Zwei" }],
      ])
    );
    expect(JSON.parse(out)).toEqual({ items: ["Eins", "Zwei"] });
  });

  it("reassemble throws when extract was not called first", () => {
    const fresh = new NestedJsonExtractor();
    expect(() => fresh.reassemble([], new Map())).toThrow(/call extract\(\) first/);
  });

  it("preserves non-translatable segment content on reassemble", () => {
    const json = JSON.stringify({ title: "Hello" });
    const segments = extractor.extract(json, "x.json", {
      mode: "denylist",
      skipKeys: [],
      translateKeys: [],
    });
    const withCode = [
      ...segments,
      {
        ...segments[0]!,
        id: "code-0",
        type: "code" as const,
        translatable: false,
        content: "// keep",
        jsonKey: undefined,
      },
    ];
    const out = extractor.reassemble(withCode, new Map());
    expect(JSON.parse(out)).toEqual({ title: "Hello" });
  });
});
