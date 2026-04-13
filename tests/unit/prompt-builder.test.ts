import {
  buildDocumentBatchPrompt,
  parseBatchJsonArrayResponse,
  parseBatchJsonObjectResponse,
  parseBatchTranslationResponse,
  parseUIJsonArrayResponse,
} from "../../src/core/prompt-builder.js";
import type { Segment } from "../../src/core/types.js";
import { BatchTranslationError } from "../../src/core/types.js";

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
    expect(systemPrompt).toContain("{{IT}}");
    expect(systemPrompt).toContain("{{IU}}");
    expect(systemPrompt).toContain("{{SE}}");
    expect(systemPrompt).toContain("{{SU}}");
    expect(systemPrompt).toContain("{{ST}}");
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

  it("json-array response mode uses JSON payload and JSON-only instructions", () => {
    const { systemPrompt, userContent } = buildDocumentBatchPrompt(
      oneSeg,
      baseOpts,
      "markdown",
      "json-array"
    );
    expect(systemPrompt).toContain("valid JSON array");
    expect(userContent).toContain("[");
    expect(userContent).toContain("\"Hello\"");
    expect(userContent).not.toContain("<seg id=");
  });

  it("json-object response mode uses indexed JSON object payload", () => {
    const { systemPrompt, userContent } = buildDocumentBatchPrompt(
      oneSeg,
      baseOpts,
      "markdown",
      "json-object"
    );
    expect(systemPrompt).toContain("valid JSON object");
    expect(userContent).toContain("\"0\": \"Hello\"");
    expect(userContent).not.toContain("<seg id=");
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

describe("document JSON batch parsers", () => {
  it("parses json-array with fences", () => {
    const m = parseBatchJsonArrayResponse('```json\n["A","B"]\n```', 2);
    expect(m.get(0)).toBe("A");
    expect(m.get(1)).toBe("B");
  });

  it("json-array throws on length mismatch", () => {
    expect(() => parseBatchJsonArrayResponse('["A"]', 2)).toThrow(BatchTranslationError);
  });

  it("parses json-object indexed by key", () => {
    const m = parseBatchJsonObjectResponse('{"0":"A","1":"B"}', 2);
    expect(m.get(0)).toBe("A");
    expect(m.get(1)).toBe("B");
  });

  it("json-object throws when key coverage is incomplete", () => {
    expect(() => parseBatchJsonObjectResponse('{"0":"A"}', 2)).toThrow(BatchTranslationError);
  });
});
