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
});
