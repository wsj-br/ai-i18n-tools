import {
  buildDocumentBatchPrompt,
  parseBatchTranslationResponse,
  parseUIJsonArrayResponse,
} from "../../src/core/prompt-builder";
import type { Segment } from "../../src/core/types";
import { BatchTranslationError } from "../../src/core/types";

describe("parseBatchTranslationResponse", () => {
  it("parses t tags", () => {
    const raw = `<t id="0">A</t><t id="1">B</t>`;
    const m = parseBatchTranslationResponse(raw, 2, raw);
    expect(m.get(0)).toBe("A");
    expect(m.get(1)).toBe("B");
  });

  it("throws on mismatch", () => {
    expect(() => parseBatchTranslationResponse(`<t id="0">A</t>`, 2, "")).toThrow(BatchTranslationError);
  });
});

describe("buildDocumentBatchPrompt", () => {
  const baseOpts = {
    sourceLanguageLabel: "English",
    targetLanguageLabel: "German",
    glossaryHints: [] as string[],
  };

  const oneSeg: Segment[] = [
    {
      id: "a",
      type: "paragraph",
      content: "Hello",
      hash: "h1",
      translatable: true,
    },
  ];

  it("markdown type includes core rules but no JSON/SVG addendum", () => {
    const { systemPrompt } = buildDocumentBatchPrompt(oneSeg, baseOpts, "markdown");
    expect(systemPrompt).toContain("{{ADM_OPEN_N}}");
    expect(systemPrompt).toContain("Preserve GFM pipe tables");
    expect(systemPrompt).not.toContain("Docusaurus or app locale JSON");
  });

  it("json type appends locale-string context", () => {
    const { systemPrompt } = buildDocumentBatchPrompt(oneSeg, baseOpts, "json");
    expect(systemPrompt).toContain("{{ADM_OPEN_N}}");
    expect(systemPrompt).toContain("Docusaurus or app locale JSON");
  });

  it("svg type appends SVG text context", () => {
    const { systemPrompt } = buildDocumentBatchPrompt(oneSeg, baseOpts, "svg");
    expect(systemPrompt).toContain("human-readable text from SVG");
  });
});

describe("parseUIJsonArrayResponse", () => {
  it("parses JSON array", () => {
    expect(parseUIJsonArrayResponse('["a","b"]', 2)).toEqual(["a", "b"]);
  });

  it("strips fences", () => {
    expect(parseUIJsonArrayResponse("```json\n[\"x\"]\n```", 1)).toEqual(["x"]);
  });

  it("throws on wrong length", () => {
    expect(() => parseUIJsonArrayResponse('["a"]', 2)).toThrow();
  });
});
