import {
  buildDocumentBatchPrompt,
  buildDocumentSinglePrompt,
  buildUIPromptMessages,
  parseBatchJsonArrayResponse,
  parseBatchJsonObjectResponse,
  parseBatchTranslationResponse,
  parseUIJsonArrayResponse,
  PromptParseError,
  DocumentBatchJsonParseError,
  UIJsonArrayParseError,
  PROMPTS,
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
    expect(() => parseBatchTranslationResponse(`<t id="0">A</t>`, 2, "")).toThrow(
      BatchTranslationError
    );
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
    expect(systemPrompt).toContain("TERMINOLOGY (technical documentation)");
    expect(systemPrompt).toContain("{{ADM_OPEN_N}}");
    expect(systemPrompt).toContain("{{BLD_N}}");
    expect(systemPrompt).toContain("{{ILC_N}}");
    expect(systemPrompt).toContain("{{IT}}");
    expect(systemPrompt).toContain("{{IU}}");
    expect(systemPrompt).toContain("{{SE}}");
    expect(systemPrompt).toContain("{{SU}}");
    expect(systemPrompt).toContain("{{ST}}");
    expect(systemPrompt).toContain("Preserve GFM pipe tables");
    expect(systemPrompt).not.toContain("software localization JSON file");
  });

  it("json type appends locale-string context", () => {
    const { systemPrompt } = buildDocumentBatchPrompt(oneSeg, baseOpts, "json");
    expect(systemPrompt).toContain("{{ADM_OPEN_N}}");
    expect(systemPrompt).toContain("software localization JSON file");
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
    expect(userContent).toContain('"Hello"');
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
    expect(userContent).toContain('"0": "Hello"');
    expect(userContent).not.toContain("<seg id=");
  });
});

describe("parseUIJsonArrayResponse", () => {
  it("parses JSON array", () => {
    expect(parseUIJsonArrayResponse('["a","b"]', 2)).toEqual(["a", "b"]);
  });

  it("strips fences", () => {
    expect(parseUIJsonArrayResponse('```json\n["x"]\n```', 1)).toEqual(["x"]);
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

describe("PROMPTS config shape", () => {
  it("has all required document prompt keys", () => {
    const doc = PROMPTS.document;
    expect(typeof doc.terminology).toBe("string");
    expect(typeof doc.coreRules).toBe("string");
    expect(typeof doc.markdownPreservation).toBe("string");
    expect(typeof doc.jsonSegmentAddendum).toBe("string");
    expect(typeof doc.svgSegmentAddendum).toBe("string");
    expect(typeof doc.markdownExample).toBe("string");
    expect(typeof doc.singleSegmentOutputInstruction).toBe("string");
    expect(typeof doc.batchXmlInstruction).toBe("string");
    expect(typeof doc.batchJsonArrayInstruction).toBe("string");
    expect(typeof doc.batchJsonObjectInstruction).toBe("string");
  });

  it("has all required UI prompt keys", () => {
    expect(Array.isArray(PROMPTS.ui.systemPrompt)).toBe(true);
    expect(PROMPTS.ui.systemPrompt.length).toBeGreaterThan(0);
    expect(Array.isArray(PROMPTS.ui.translationJobLines)).toBe(true);
    expect(PROMPTS.ui.translationJobLines.join("\n")).toContain("{{SOURCE_LANG}}");
    expect(typeof PROMPTS.ui.glossaryPreamble).toBe("string");
  });

  it("markdownExample contains the {{targetLang}} placeholder", () => {
    expect(PROMPTS.document.markdownExample).toContain("{{targetLang}}");
  });
});

describe("buildDocumentSinglePrompt", () => {
  const baseOpts = {
    sourceLanguageLabel: "English",
    targetLanguageLabel: "French",
    glossaryHints: [] as string[],
  };

  it("markdown includes example and single-segment output instruction", () => {
    const { systemPrompt, userContent } = buildDocumentSinglePrompt(
      "Hello world",
      baseOpts,
      "markdown"
    );
    expect(systemPrompt).toContain("Example (same structure in French)");
    expect(systemPrompt).toContain(PROMPTS.document.singleSegmentOutputInstruction);
    expect(userContent).toBe("Hello world");
  });

  it("json type includes addendum but no markdown example", () => {
    const { systemPrompt } = buildDocumentSinglePrompt("Hello", baseOpts, "json");
    expect(systemPrompt).toContain("software localization JSON file");
    expect(systemPrompt).not.toContain("Example (same structure in");
  });

  it("includes glossary when hints are provided", () => {
    const opts = { ...baseOpts, glossaryHints: ['- "Hello" → "Bonjour"'] };
    const { systemPrompt } = buildDocumentSinglePrompt("Hello", opts, "markdown");
    expect(systemPrompt).toContain("<glossary>");
    expect(systemPrompt).toContain("Bonjour");
  });
});

describe("buildUIPromptMessages", () => {
  it("puts locale routing in system and JSON-only payload in user (prompt cache prefix)", () => {
    const { systemPrompt, userContent } = buildUIPromptMessages(["Save", "Cancel"], {
      sourceLanguageLabel: "English",
      targetLanguageLabel: "German",
    });
    expect(systemPrompt).toContain("professional UI/UX translator");
    expect(systemPrompt).toContain("conventional software");
    expect(systemPrompt).toContain("mainstream software terminology");
    expect(systemPrompt).toContain("TRANSLATION JOB:");
    expect(systemPrompt).toContain("Source language: English");
    expect(systemPrompt).toContain("Target language: German");
    expect(userContent).toBe(JSON.stringify(["Save", "Cancel"], null, 2));
    expect(userContent).not.toContain("TRANSLATION JOB:");
    expect(userContent).not.toContain("Translate these");
  });

  it("includes glossary block when hints provided", () => {
    const { systemPrompt } = buildUIPromptMessages(["OK"], {
      sourceLanguageLabel: "English",
      targetLanguageLabel: "German",
      glossaryHints: ['- "z" → "z"', '- "a" → "a"'],
    });
    expect(systemPrompt).toContain("<glossary>");
    expect(systemPrompt).toContain(PROMPTS.ui.glossaryPreamble);
    expect(systemPrompt.indexOf('- "a"')).toBeLessThan(systemPrompt.indexOf('- "z"'));
  });
});

describe("error class hierarchy", () => {
  it("DocumentBatchJsonParseError extends PromptParseError", () => {
    const err = new DocumentBatchJsonParseError("test", "raw");
    expect(err).toBeInstanceOf(PromptParseError);
    expect(err).toBeInstanceOf(Error);
    expect(err.rawResponse).toBe("raw");
    expect(err.name).toBe("DocumentBatchJsonParseError");
  });

  it("UIJsonArrayParseError extends PromptParseError", () => {
    const err = new UIJsonArrayParseError("test", "raw");
    expect(err).toBeInstanceOf(PromptParseError);
    expect(err).toBeInstanceOf(Error);
    expect(err.rawResponse).toBe("raw");
    expect(err.name).toBe("UIJsonArrayParseError");
  });
});
