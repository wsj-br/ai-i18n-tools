import { JsonExtractor } from "../../src/extractors/json-extractor.js";

describe("JsonExtractor", () => {
  const ex = new JsonExtractor();

  it("canHandle .json files case-insensitively", () => {
    expect(ex.canHandle("x.json")).toBe(true);
    expect(ex.canHandle("x.JSON")).toBe(true);
    expect(ex.canHandle("x.md")).toBe(false);
  });

  it("extract extracts message entries with jsonKey and line numbers", () => {
    const json = `{
  "a": {
    "message": "Hello",
    "description": "d1"
  }
}`;
    const segs = ex.extract(json, "file.json");
    expect(segs).toHaveLength(1);
    expect(segs[0]!.type).toBe("json");
    expect(segs[0]!.content).toBe("Hello");
    expect(segs[0]!.jsonKey).toBe("a");
    expect(segs[0]!.jsonDescription).toBe("d1");
    expect(segs[0]!.translatable).toBe(true);
  });

  it("extract walks nested objects without message", () => {
    const json = `{
  "outer": {
    "inner": {
      "message": "Nested"
    }
  }
}`;
    const segs = ex.extract(json, "f.json");
    expect(segs.some((s) => s.content === "Nested")).toBe(true);
  });

  it("extract throws on invalid JSON", () => {
    expect(() => ex.extract("{", "bad.json")).toThrow(/Failed to parse JSON file bad\.json/);
  });

  it("reassemble applies translations and preserves description", () => {
    const json = `{
  "k": {
    "message": "Src",
    "description": "desc"
  }
}`;
    const segs = ex.extract(json, "f.json");
    const map = new Map<string, string>();
    map.set(segs[0]!.hash, "Translated");
    const out = ex.reassemble(segs, map);
    const parsed = JSON.parse(out) as { k: { message: string; description: string } };
    expect(parsed.k.message).toBe("Translated");
    expect(parsed.k.description).toBe("desc");
  });

  it("reassemble throws without prior extract", () => {
    const fresh = new JsonExtractor();
    expect(() => fresh.reassemble([], new Map())).toThrow(/call extract\(\) first/);
  });

  it("skips non-string message values", () => {
    const json = `{ "k": { "message": 42 } }`;
    const segs = ex.extract(json, "n.json");
    expect(segs).toHaveLength(0);
  });

  it("findLineNumber falls back to line containing quoted message", () => {
    const json = `{
  "k": {
    "message":
      "Hello"
  }
}`;
    const segs = ex.extract(json, "lines.json");
    expect(segs[0]!.startLine).toBeGreaterThan(1);
    expect(segs[0]!.content).toBe("Hello");
  });

  it("reassemble keeps original message when jsonKey missing from map", () => {
    const json = `{
  "k": {
    "message": "Src"
  }
}`;
    const segs = ex.extract(json, "f.json");
    const out = ex.reassemble(segs, new Map());
    const parsed = JSON.parse(out) as { k: { message: string } };
    expect(parsed.k.message).toBe("Src");
  });

  it("reassemble omits description when entry has no description field", () => {
    const json = `{ "k": { "message": "Only" } }`;
    const segs = ex.extract(json, "nd.json");
    const out = ex.reassemble(segs, new Map([[segs[0]!.hash, "X"]]));
    const parsed = JSON.parse(out) as { k: { message: string; description?: string } };
    expect(parsed.k.message).toBe("X");
    expect(parsed.k.description).toBeUndefined();
  });

  it("reassemble copies primitive leaf values", () => {
    const json = `{ "k": { "message": "Hi" }, "n": 3 }`;
    const segs = ex.extract(json, "mix.json");
    const out = ex.reassemble(segs, new Map());
    const parsed = JSON.parse(out) as { n: number };
    expect(parsed.n).toBe(3);
  });
});
