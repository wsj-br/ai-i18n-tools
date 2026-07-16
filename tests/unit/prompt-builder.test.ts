import { describe, expect, it } from "vitest";
import {
  buildDocumentBatchPrompt,
  buildDocumentSinglePrompt,
  buildPluralPassBPrompt,
  buildPluralStep0Prompt,
  buildProofreadUIPromptMessages,
  buildUIPromptMessages,
  parseProofreadUIBatchResponse,
  parsePluralFormsJsonResponse,
  parseBatchJsonArrayResponse,
  parseBatchJsonObjectResponse,
  parseBatchTranslationResponse,
  parseUIJsonArrayResponse,
  PromptParseError,
  DocumentBatchJsonParseError,
  ProofreadUIJsonParseError,
  PluralFormsParseError,
  UIJsonArrayParseError,
  ScriptValidationError,
  targetScriptDirective,
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
  it("puts locale routing in system and JSON-only payload in user", () => {
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

describe("targetScriptDirective", () => {
  it("returns the Latin romanization directive for *-Latn targets", () => {
    const d = targetScriptDirective("hi-Latn");
    expect(d).toBe(PROMPTS.script.latinDirective);
    expect(d).toContain("Latin (Roman)");
    expect(d).toContain("romanize");
    expect(d).toContain("Devanagari");
  });

  it("returns a generic directive naming the script for non-Latin script subtags", () => {
    const d = targetScriptDirective("sr-Cyrl");
    expect(d).toContain("SCRIPT REQUIREMENT");
    expect(d).toContain("Cyrillic");
    expect(d).not.toContain("{{SCRIPT_NAME}}");
  });

  it("uses friendlier names for CJK script subtags", () => {
    expect(targetScriptDirective("zh-Hans")).toContain("Simplified Chinese (Han)");
    expect(targetScriptDirective("zh-Hant")).toContain("Traditional Chinese (Han)");
  });

  it("appends a Simplified/Traditional character-form clause for zh-Hans / zh-Hant", () => {
    expect(targetScriptDirective("zh-Hans")).toContain("NEVER Traditional forms");
    expect(targetScriptDirective("zh-Hant")).toContain("NEVER Simplified forms");
  });

  it("returns empty string when there is no effective script", () => {
    expect(targetScriptDirective("en-GB")).toBe("");
    expect(targetScriptDirective("de")).toBe("");
    expect(targetScriptDirective(undefined)).toBe("");
  });

  it("defaults bare hi to the Devanagari directive", () => {
    const d = targetScriptDirective("hi");
    expect(d).toContain("SCRIPT REQUIREMENT");
    expect(d).toContain("Devanagari");
  });

  it("names the script for the catalog's script variants", () => {
    expect(targetScriptDirective("uz-Cyrl")).toContain("Cyrillic");
    expect(targetScriptDirective("ha-Arab")).toContain("Arabic");
    expect(targetScriptDirective("sd-Deva")).toContain("Devanagari");
    expect(targetScriptDirective("zh-Hans")).toContain("Simplified Chinese (Han)");
    expect(targetScriptDirective("zh-Hant")).toContain("Traditional Chinese (Han)");
  });

  it("disambiguates Mongolian from Cyrillic for mn-Mong", () => {
    const d = targetScriptDirective("mn-Mong");
    expect(d).toContain("Mongolian Bichig");
    expect(d).toContain("NOT Cyrillic");
  });

  it("uses the Latin romanization directive for kk-Latn and sr-Latn", () => {
    expect(targetScriptDirective("kk-Latn")).toBe(PROMPTS.script.latinDirective);
    expect(targetScriptDirective("sr-Latn")).toBe(PROMPTS.script.latinDirective);
  });
});

describe("script directive injection into prompts", () => {
  it("buildDocumentSinglePrompt prepends the Latin directive for hi-Latn and Devanagari for bare hi", () => {
    const withScript = buildDocumentSinglePrompt("Hello", {
      sourceLanguageLabel: "English",
      targetLanguageLabel: "hi-Latn: Hindi (Romanized)",
      glossaryHints: [],
      targetLocale: "hi-Latn",
    });
    expect(withScript.systemPrompt.startsWith("SCRIPT REQUIREMENT")).toBe(true);
    expect(withScript.systemPrompt).toContain("romanize");

    const hiDeva = buildDocumentSinglePrompt("Hello", {
      sourceLanguageLabel: "English",
      targetLanguageLabel: "Hindi",
      glossaryHints: [],
      targetLocale: "hi",
    });
    expect(hiDeva.systemPrompt.startsWith("SCRIPT REQUIREMENT")).toBe(true);
    expect(hiDeva.systemPrompt).toContain("Devanagari");

    const noScript = buildDocumentSinglePrompt("Hello", {
      sourceLanguageLabel: "English",
      targetLanguageLabel: "German",
      glossaryHints: [],
      targetLocale: "de",
    });
    expect(noScript.systemPrompt).not.toContain("SCRIPT REQUIREMENT");
  });

  it("buildUIPromptMessages prepends the Latin directive for hi-Latn", () => {
    const { systemPrompt } = buildUIPromptMessages(["Save"], {
      sourceLanguageLabel: "English",
      targetLanguageLabel: "hi-Latn: Hindi (Romanized)",
      targetLocale: "hi-Latn",
    });
    expect(systemPrompt.startsWith("SCRIPT REQUIREMENT")).toBe(true);
    expect(systemPrompt).toContain("professional UI/UX translator");
  });

  it("buildPluralPassBPrompt prepends the Latin directive for hi-Latn", () => {
    const { systemPrompt } = buildPluralPassBPrompt({
      sourceLanguageLabel: "English",
      targetLanguageLabel: "hi-Latn: Hindi (Romanized)",
      sourceForms: { one: "1 file", other: "{{count}} files" },
      requiredTargetForms: ["one", "other"],
      originalLiteral: "{{count}} files",
      targetLocale: "hi-Latn",
    });
    expect(systemPrompt.startsWith("SCRIPT REQUIREMENT")).toBe(true);
  });
});

describe("ScriptValidationError", () => {
  it("carries the offending characters and raw response", () => {
    const err = new ScriptValidationError("bad script", "नमस्ते", ["न", "म"]);
    expect(err).toBeInstanceOf(PromptParseError);
    expect(err.name).toBe("ScriptValidationError");
    expect(err.offendingChars).toEqual(["न", "म"]);
    expect(err.rawResponse).toBe("नमस्ते");
  });
});

describe("plural prompt builders and parsers", () => {
  it("buildPluralStep0Prompt includes intl hint and zeroDigit note", () => {
    const { systemPrompt, userContent } = buildPluralStep0Prompt({
      sourceLanguageLabel: "Arabic",
      originalLiteral: "You have {{count}} message",
      requiredForms: ["zero", "one", "other"],
      zeroDigit: true,
      intlPluralLocaleTag: "ar",
      glossaryHints: ['- "message" → "رسالة"'],
    });
    expect(systemPrompt).toContain("<glossary>");
    expect(userContent).toContain('For the "zero" category, prefer the literal digit 0');
    expect(userContent).toContain("Intl.PluralRules");
    expect(userContent).toContain("zero, one, other");
  });

  it("buildPluralPassBPrompt omits intl hint when empty tag", () => {
    const { userContent } = buildPluralPassBPrompt({
      sourceLanguageLabel: "English",
      targetLanguageLabel: "German",
      sourceForms: { one: "1 file", other: "{{count}} files" },
      requiredTargetForms: ["one", "other"],
      originalLiteral: "{{count}} files",
      intlPluralLocaleTag: "   ",
    });
    expect(userContent).toContain("Translate cardinal plural UI strings from English to German.");
    expect(userContent).not.toContain("Intl.PluralRules");
  });

  it("parsePluralFormsJsonResponse parses required forms and rejects missing keys", () => {
    const ok = parsePluralFormsJsonResponse('{"one":"1 Datei","other":"{{count}} Dateien"}', [
      "one",
      "other",
    ]);
    expect(ok.one).toBe("1 Datei");
    expect(ok.other).toContain("{{count}}");
    expect(() => parsePluralFormsJsonResponse('{"one":"1 Datei"}', ["one", "other"])).toThrow(
      PluralFormsParseError
    );
  });

  it("parsePluralFormsJsonResponse rejects invalid JSON and non-objects", () => {
    expect(() => parsePluralFormsJsonResponse("not-json", ["one"])).toThrow(PluralFormsParseError);
    expect(() => parsePluralFormsJsonResponse("[1,2]", ["one"])).toThrow(PluralFormsParseError);
  });

  it("parseBatchJsonObjectResponse rejects invalid JSON", () => {
    expect(() => parseBatchJsonObjectResponse("{", 1)).toThrow(DocumentBatchJsonParseError);
  });

  it("parseUIJsonArrayResponse rejects invalid JSON", () => {
    expect(() => parseUIJsonArrayResponse("{", 1)).toThrow(UIJsonArrayParseError);
  });
});

describe("proofread-ui prompt and parser", () => {
  it("buildProofreadUIPromptMessages includes locale line and output contract", () => {
    const { systemPrompt, userContent } = buildProofreadUIPromptMessages(["Save"], {
      languageLabel: "German",
      glossaryHints: ['- "Save" → "Speichern"'],
    });
    expect(systemPrompt).toContain("Locale / language of the strings under review: German");
    expect(systemPrompt).toContain(PROMPTS.proofreadUI.outputContract.trim());
    expect(systemPrompt).toContain("<glossary>");
    expect(userContent).toBe(JSON.stringify(["Save"], null, 2));
  });

  it("parseProofreadUIBatchResponse normalizes and pads malformed slots", () => {
    const { slots, lengthWarning } = parseProofreadUIBatchResponse(
      '[{"issues":[{"severity":"warn","message":"m1","suggestedText":"s1"}]}]',
      2
    );
    expect(lengthWarning).toContain("expected 2 slot objects, got 1");
    expect(slots).toHaveLength(2);
    expect(slots[0]?.issues[0]).toEqual({
      severity: "warning",
      message: "m1",
      suggestedText: "s1",
    });
    expect(slots[1]?.issues).toEqual([]);
  });

  it("parseProofreadUIBatchResponse throws on non-array", () => {
    expect(() => parseProofreadUIBatchResponse('{"issues":[]}', 1)).toThrow(
      ProofreadUIJsonParseError
    );
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
