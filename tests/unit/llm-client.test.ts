import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as config from "../../src/core/config.js";
import type { I18nConfig } from "../../src/core/types.js";

const { generateTextMock } = vi.hoisted(() => ({ generateTextMock: vi.fn() }));
vi.mock("ai", () => ({ generateText: generateTextMock }));

// Imported after vi.mock so the client picks up the mocked `generateText`.
const { DocumentBatchAllModelsFailedError, LlmClient, OpenRouterClient } =
  await import("../../src/api/llm-client.js");

function llmConfig(
  models: string[] = ["model-a", "model-b"],
  overrides?: Partial<I18nConfig>
): Pick<I18nConfig, "provider" | "providers" | "sourceLocale" | "localeDisplayNames"> {
  return {
    sourceLocale: "en",
    localeDisplayNames: { de: "German" },
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: models,
        maxTokens: 100,
        temperature: 0,
        requestTimeoutMs: 30_000,
      },
    },
    ...overrides,
  };
}

interface GenResultOptions {
  cost?: number;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  finishReason?: string;
}

function genResult(text: string, opts?: GenResultOptions) {
  return {
    text,
    finishReason: opts?.finishReason ?? "stop",
    usage: opts?.usage ?? { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
    ...(opts?.cost !== undefined ? { providerMetadata: { openrouter: { cost: opts.cost } } } : {}),
  };
}

/** Read the args passed to the latest (or indexed) generateText call. */
function genArgs(callIndex = 0): {
  system?: string;
  messages: Array<{ role: string; content: string }>;
} {
  return generateTextMock.mock.calls[callIndex]![0] as {
    system?: string;
    messages: Array<{ role: string; content: string }>;
  };
}

describe("LlmClient", () => {
  let prevKey: string | undefined;

  beforeEach(() => {
    generateTextMock.mockReset();
    prevKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "env-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (prevKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = prevKey;
    }
  });

  it("OpenRouterClient is a backward-compatible alias for LlmClient", () => {
    expect(OpenRouterClient).toBe(LlmClient);
  });

  it("throws when API key is missing", () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(() => new LlmClient({ config: llmConfig(), apiKey: "" })).toThrow(
      /OPENROUTER_API_KEY is required/
    );
  });

  it("throws when no models are configured", () => {
    expect(() => new LlmClient({ config: llmConfig([]) })).toThrow(
      /No translation models configured/
    );
  });

  it("getConfiguredModels returns resolved model list", () => {
    const c = new LlmClient({ config: llmConfig(["x", "y"]), apiKey: "k" });
    expect(c.getConfiguredModels()).toEqual(["x", "y"]);
  });

  it("stripTranslateTags removes translate wrapper", () => {
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    expect(c.stripTranslateTags("  <translate>  hi  </translate>  ")).toBe("hi");
  });

  it("chat returns first successful completion", async () => {
    generateTextMock.mockResolvedValue(genResult("ok"));
    const c = new LlmClient({ config: llmConfig(["m1"]), apiKey: "k" });
    const res = await c.chat([
      { role: "system", content: "sys" },
      { role: "user", content: "usr" },
    ]);
    expect(res.content).toBe("ok");
    expect(res.model).toBe("m1");
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it("chat splits system/user into generateText system + messages", async () => {
    generateTextMock.mockResolvedValue(genResult("ok"));
    const c = new LlmClient({ config: llmConfig(["m1"]), apiKey: "k" });
    await c.chat([
      { role: "system", content: "sys" },
      { role: "user", content: "usr" },
    ]);
    const args = genArgs();
    expect(args.system).toBe("sys");
    expect(args.messages).toEqual([{ role: "user", content: "usr" }]);
  });

  it("chat tries next model when first fails", async () => {
    generateTextMock
      .mockRejectedValueOnce(new Error("500"))
      .mockResolvedValueOnce(genResult("retry-ok"));
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const res = await c.chat(
      [
        { role: "system", content: "s" },
        { role: "user", content: "u" },
      ],
      { docLogContext: { locale: "de", relativePath: "a.md" } }
    );
    expect(res.content).toBe("retry-ok");
    expect(res.model).toBe("good");
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("chat throws when all models fail", async () => {
    generateTextMock.mockRejectedValue(new Error("boom"));
    const c = new LlmClient({ config: llmConfig(["a", "b"]), apiKey: "k" });
    await expect(
      c.chat([
        { role: "system", content: "s" },
        { role: "user", content: "u" },
      ])
    ).rejects.toThrow(/All translation models failed/);
  });

  it("chat logs via logger when model fails without docLogContext", async () => {
    const warn = vi.fn();
    generateTextMock.mockRejectedValueOnce(new Error("e")).mockResolvedValueOnce(genResult("ok"));
    const c = new LlmClient({
      config: llmConfig(["a", "b"]),
      apiKey: "k",
      logger: { warn } as never,
    });
    await c.chat([
      { role: "system", content: "s" },
      { role: "user", content: "u" },
    ]);
    expect(warn).toHaveBeenCalled();
  });

  it("chat maps usage to input/output/total tokens only", async () => {
    generateTextMock.mockResolvedValue(
      genResult("ok", { usage: { inputTokens: 100, outputTokens: 2, totalTokens: 102 } })
    );
    const c = new LlmClient({ config: llmConfig(["m1"]), apiKey: "k" });
    const res = await c.chat([
      { role: "system", content: "sys" },
      { role: "user", content: "usr" },
    ]);
    expect(res.usage).toEqual({ inputTokens: 100, outputTokens: 2, totalTokens: 102 });
  });

  it("chat surfaces OpenRouter cost from providerMetadata", async () => {
    generateTextMock.mockResolvedValue(genResult("ok", { cost: 0.0012 }));
    const c = new LlmClient({ config: llmConfig(["m1"]), apiKey: "k" });
    const res = await c.chat([
      { role: "system", content: "sys" },
      { role: "user", content: "usr" },
    ]);
    expect(res.cost).toBe(0.0012);
  });

  it("chat reports undefined cost when provider returns no cost metadata", async () => {
    generateTextMock.mockResolvedValue(genResult("ok"));
    const c = new LlmClient({ config: llmConfig(["m1"]), apiKey: "k" });
    const res = await c.chat([
      { role: "system", content: "sys" },
      { role: "user", content: "usr" },
    ]);
    expect(res.cost).toBeUndefined();
  });

  it("non-openrouter providers do not require the OpenRouter key", () => {
    delete process.env.OPENROUTER_API_KEY;
    process.env.GROQ_API_KEY = "groq-key";
    const c = new LlmClient({
      config: {
        sourceLocale: "en",
        localeDisplayNames: {},
        provider: "groq",
        providers: { groq: { translationModels: ["llama-3.3-70b-versatile"] } },
      },
      apiKey: "groq-key",
    });
    expect(c.getConfiguredModels()).toEqual(["llama-3.3-70b-versatile"]);
    delete process.env.GROQ_API_KEY;
  });

  it("fetchCompletion throws on empty message content", async () => {
    generateTextMock.mockResolvedValue(genResult("   "));
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    await expect(
      c.chat([
        { role: "system", content: "s" },
        { role: "user", content: "u" },
      ])
    ).rejects.toThrow(/Empty response content/);
  });

  it("translateDocumentSegment strips tags from response", async () => {
    generateTextMock.mockResolvedValue(genResult("<translate>DE</translate>"));
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const r = await c.translateDocumentSegment("src", "de", []);
    expect(r.content).toBe("DE");
  });

  it("translateDocumentBatch returns empty map for zero segments", async () => {
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const r = await c.translateDocumentBatch([], "de");
    expect(r.translations.size).toBe(0);
    expect(r.usage.totalTokens).toBe(0);
  });

  it("translateDocumentBatch parses batch XML response", async () => {
    generateTextMock.mockResolvedValue(genResult(`<t id="0">A</t>\n<t id="1">B</t>`));
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    const r = await c.translateDocumentBatch(segs, "de");
    expect(r.translations.get(0)).toBe("A");
    expect(r.translations.get(1)).toBe("B");
  });

  it("translateDocumentBatch parses json-array response format", async () => {
    generateTextMock.mockResolvedValue(genResult('["A","B"]'));
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    const r = await c.translateDocumentBatch(segs, "de", [], { responseFormat: "json-array" });
    expect(r.translations.get(0)).toBe("A");
    expect(r.translations.get(1)).toBe("B");
  });

  it("translateDocumentBatch parses json-object response format", async () => {
    generateTextMock.mockResolvedValue(genResult('{"0":"A","1":"B"}'));
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    const r = await c.translateDocumentBatch(segs, "de", [], { responseFormat: "json-object" });
    expect(r.translations.get(0)).toBe("A");
    expect(r.translations.get(1)).toBe("B");
  });

  it("translateDocumentBatch throws DocumentBatchAllModelsFailedError with parse details when all models fail", async () => {
    generateTextMock.mockResolvedValue(genResult(`<t id="0">x</t>`));
    const c = new LlmClient({ config: llmConfig(["m1", "m2"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    let err: unknown;
    try {
      await c.translateDocumentBatch(segs, "de", [], {
        docLogContext: { relativePath: "a.md" },
      });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(DocumentBatchAllModelsFailedError);
    const d = (err as InstanceType<typeof DocumentBatchAllModelsFailedError>).details;
    expect(d.lastRawAssistantContent).toContain("<t id=");
    expect(d.systemPrompt.length).toBeGreaterThan(0);
    expect(d.userContent.length).toBeGreaterThan(0);
  });

  it("translateDocumentBatch warns Batch parse failed without docLogContext", async () => {
    const warn = vi.fn();
    generateTextMock
      .mockResolvedValueOnce(genResult(`<t id="0">only-one</t>`))
      .mockResolvedValueOnce(genResult(`<t id="0">A</t>\n<t id="1">B</t>`));
    const c = new LlmClient({
      config: llmConfig(["bad", "good"]),
      apiKey: "k",
      logger: { warn } as never,
    });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    await c.translateDocumentBatch(segs, "de");
    expect(warn.mock.calls.some((call) => String(call[0]).includes("Batch parse failed"))).toBe(
      true
    );
  });

  it("translateDocumentBatch warns Batch request failed without docLogContext", async () => {
    const warn = vi.fn();
    generateTextMock
      .mockRejectedValueOnce(new Error("e"))
      .mockResolvedValueOnce(genResult(`<t id="0">A</t><t id="1">B</t>`));
    const c = new LlmClient({
      config: llmConfig(["bad", "good"]),
      apiKey: "k",
      logger: { warn } as never,
    });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    await c.translateDocumentBatch(segs, "de");
    expect(warn.mock.calls.some((call) => String(call[0]).includes("Batch request failed"))).toBe(
      true
    );
  });

  it("translateDocumentBatch falls back when first model returns batch parse error", async () => {
    generateTextMock
      .mockResolvedValueOnce(genResult(`<t id="0">only-one</t>`))
      .mockResolvedValueOnce(genResult(`<t id="0">A</t><t id="1">B</t>`));
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    const r = await c.translateDocumentBatch(segs, "de", [], {
      docLogContext: { relativePath: "x.md" },
    });
    expect(r.translations.get(0)).toBe("A");
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("translateDocumentBatch logs non-BatchTranslationError parse failures without docLogContext", async () => {
    const warn = vi.fn();
    generateTextMock
      .mockResolvedValueOnce(genResult("not-json-array"))
      .mockResolvedValueOnce(genResult('["A","B"]'));
    const c = new LlmClient({
      config: llmConfig(["bad", "good"]),
      apiKey: "k",
      logger: { warn } as never,
    });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    await c.translateDocumentBatch(segs, "de", [], { responseFormat: "json-array" });
    expect(warn.mock.calls.some((call) => String(call[0]).includes("Batch parse failed"))).toBe(
      true
    );
  });

  it("translateUIBatch returns empty for no texts", async () => {
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const r = await c.translateUIBatch([], "de");
    expect(r.translations).toEqual([]);
  });

  it("translateUIBatch parses JSON array response", async () => {
    generateTextMock.mockResolvedValue(genResult('```json\n["eins","zwei"]\n```'));
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const r = await c.translateUIBatch(["a", "b"], "de");
    expect(r.translations).toEqual(["eins", "zwei"]);
  });

  it("translateUIBatch includes BCP-47 id and English display name in the system prompt", async () => {
    generateTextMock.mockResolvedValue(genResult('["x"]'));
    const c = new LlmClient({
      config: llmConfig(["m"], {
        localeDisplayNames: { de: "German", en: "English", "pt-BR": "Portuguese (BR)" },
      }),
      apiKey: "k",
    });
    await c.translateUIBatch(["a"], "de");
    const args = genArgs();
    expect(args.system).toContain("en: English");
    expect(args.system).toContain("de: German");
    const user = args.messages.find((m) => m.role === "user");
    expect(user?.content).toBe(JSON.stringify(["a"], null, 2));
  });

  it("translateUIBatch uses Intl English names when localeDisplayNames has no entry", async () => {
    generateTextMock.mockResolvedValue(genResult('["x"]'));
    const c = new LlmClient({
      config: llmConfig(["m"], { localeDisplayNames: {} }),
      apiKey: "k",
    });
    await c.translateUIBatch(["a"], "de");
    const args = genArgs();
    expect(args.system).toContain("en: English");
    expect(args.system).toContain("de: German");
    const user = args.messages.find((m) => m.role === "user");
    expect(user?.content).toBe(JSON.stringify(["a"], null, 2));
  });

  it("translateUIBatch sends plain string system content", async () => {
    generateTextMock.mockResolvedValue(genResult('["x"]'));
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    await c.translateUIBatch(["a"], "de");
    const args = genArgs();
    expect(typeof args.system).toBe("string");
    expect((args.system ?? "").length).toBeGreaterThan(0);
  });

  it("translateUIBatch throws when all models fail", async () => {
    generateTextMock.mockRejectedValue(new Error("err"));
    const c = new LlmClient({ config: llmConfig(["a", "b"]), apiKey: "k" });
    await expect(c.translateUIBatch(["x"], "de")).rejects.toThrow(
      /All translation models failed for UI batch/
    );
  });

  it("uses raw locale in prompts when Intl and localeDisplayNames yield no label", async () => {
    const spy = vi.spyOn(config, "englishLanguageNameForLocale").mockReturnValue(undefined);
    generateTextMock.mockResolvedValue(genResult('["t"]'));
    const c = new LlmClient({
      config: llmConfig(["m"], { localeDisplayNames: {} }),
      apiKey: "k",
    });
    await c.translateUIBatch(["a"], "qaa-QQ");
    const args = genArgs();
    expect(args.system).toContain("qaa-QQ");
    spy.mockRestore();
  });

  it("proofreadUISourceBatch returns empty slots for no texts", async () => {
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const r = await c.proofreadUISourceBatch([], "German");
    expect(r.slots).toEqual([]);
    expect(r.lengthWarning).toBeNull();
  });

  it("proofreadUISourceBatch parses model JSON response", async () => {
    generateTextMock.mockResolvedValue(
      genResult('[{"issues":[{"severity":"warn","message":"ok","suggestedText":"s"}]}]')
    );
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const r = await c.proofreadUISourceBatch(["Save"], "German");
    expect(r.slots).toHaveLength(1);
    expect(r.slots[0]?.issues[0]?.message).toBe("ok");
  });

  it("translatePluralCardinalBatch returns empty forms when expectedForms is empty", async () => {
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const r = await c.translatePluralCardinalBatch([], {
      systemPrompt: "s",
      userContent: "u",
    });
    expect(r.forms).toEqual({});
  });

  it("translatePluralCardinalBatch parses plural JSON object", async () => {
    generateTextMock.mockResolvedValue(genResult('{"one":"1 file","other":"n files"}'));
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const r = await c.translatePluralCardinalBatch(["one", "other"], {
      systemPrompt: "sys",
      userContent: "usr",
    });
    expect(r.forms.one).toBe("1 file");
    expect(r.forms.other).toBe("n files");
  });

  it("translateUIBatch prepends the Latin script directive for hi-Latn", async () => {
    generateTextMock.mockResolvedValue(genResult('["Save"]'));
    const c = new LlmClient({
      config: llmConfig(["m"], { localeDisplayNames: { "hi-Latn": "Hindi (Romanized)" } }),
      apiKey: "k",
    });
    await c.translateUIBatch(["Save"], "hi-Latn");
    const args = genArgs();
    expect(args.system).toContain("SCRIPT REQUIREMENT");
    expect(args.system).toContain("romanize");
  });

  it("translateUIBatch falls back to next model when hi-Latn output is in Devanagari", async () => {
    generateTextMock
      .mockResolvedValueOnce(genResult('["सहेव"]'))
      .mockResolvedValueOnce(genResult('["Sahej"]'));
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const r = await c.translateUIBatch(["Save"], "hi-Latn");
    expect(r.translations).toEqual(["Sahej"]);
    expect(r.model).toBe("good");
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("translateUIBatch throws when every model returns the wrong script", async () => {
    generateTextMock.mockResolvedValue(genResult('["नमस्ते"]'));
    const c = new LlmClient({ config: llmConfig(["a", "b"]), apiKey: "k" });
    await expect(c.translateUIBatch(["Hello"], "hi-Latn")).rejects.toThrow(
      /All translation models failed for UI batch/
    );
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("translateUIBatch enforces Devanagari for plain hi (rejects wrong non-Latin script)", async () => {
    generateTextMock
      .mockResolvedValueOnce(genResult('["مرحبا"]'))
      .mockResolvedValueOnce(genResult('["नमस्ते"]'));
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const r = await c.translateUIBatch(["Hello"], "hi");
    expect(r.translations).toEqual(["नमस्ते"]);
    expect(r.model).toBe("good");
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("translateUIBatch accepts Devanagari for plain hi", async () => {
    generateTextMock.mockResolvedValue(genResult('["नमस्ते"]'));
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const r = await c.translateUIBatch(["Hello"], "hi");
    expect(r.translations).toEqual(["नमस्ते"]);
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it("translateUIBatch prepends the Devanagari script directive for plain hi", async () => {
    generateTextMock.mockResolvedValue(genResult('["नमस्ते"]'));
    const c = new LlmClient({
      config: llmConfig(["m"], { localeDisplayNames: { hi: "Hindi" } }),
      apiKey: "k",
    });
    await c.translateUIBatch(["Save"], "hi");
    const args = genArgs();
    expect(args.system).toContain("SCRIPT REQUIREMENT");
    expect(args.system).toContain("Devanagari");
  });

  it("translateDocumentSegment retries when hi-Latn segment comes back in Devanagari", async () => {
    generateTextMock
      .mockResolvedValueOnce(genResult("नमस्ते दुनिया"))
      .mockResolvedValueOnce(genResult("Namaste duniya"));
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const r = await c.translateDocumentSegment("Hello world", "hi-Latn", []);
    expect(r.content).toBe("Namaste duniya");
    expect(r.model).toBe("good");
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("translateDocumentBatch falls back when an hi-Latn segment is in Devanagari", async () => {
    generateTextMock
      .mockResolvedValueOnce(genResult(`<t id="0"> नमस्ते</t><t id="1">Bye</t>`))
      .mockResolvedValueOnce(genResult(`<t id="0">Namaste</t><t id="1">Bye</t>`));
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "Hi", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "Bye", hash: "h1", translatable: true },
    ];
    const r = await c.translateDocumentBatch(segs, "hi-Latn");
    expect(r.translations.get(0)).toBe("Namaste");
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("translateUIBatch prepends the Cyrillic directive and accepts Latin-only output for uz-Cyrl", async () => {
    generateTextMock.mockResolvedValue(genResult('["OK"]'));
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const r = await c.translateUIBatch(["OK"], "uz-Cyrl");
    expect(r.translations).toEqual(["OK"]);
    const args = genArgs();
    expect(args.system).toContain("Cyrillic");
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it("translateUIBatch falls back when uz-Cyrl output leaks a different non-Latin script", async () => {
    generateTextMock
      .mockResolvedValueOnce(genResult('["नमस्ते"]'))
      .mockResolvedValueOnce(genResult('["Салом"]'));
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const r = await c.translateUIBatch(["Hello"], "uz-Cyrl");
    expect(r.translations).toEqual(["Салом"]);
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("translateUIBatch falls back when sr-Latn output comes back in Cyrillic", async () => {
    generateTextMock
      .mockResolvedValueOnce(genResult('["Сачувај"]'))
      .mockResolvedValueOnce(genResult('["Sačuvaj"]'));
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const r = await c.translateUIBatch(["Save"], "sr-Latn");
    expect(r.translations).toEqual(["Sačuvaj"]);
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("translateUIBatch falls back when a zh-Hans segment leaks Cyrillic but accepts Han + Latin", async () => {
    generateTextMock
      .mockResolvedValueOnce(genResult('["Привет"]'))
      .mockResolvedValueOnce(genResult('["保存 OK"]'));
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const r = await c.translateUIBatch(["Save"], "zh-Hans");
    expect(r.translations).toEqual(["保存 OK"]);
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("translateUIBatch accepts a zh-Hant segment containing the ℹ symbol without falling back", async () => {
    generateTextMock.mockResolvedValue(genResult('["ℹ 設定 → 模型"]'));
    const c = new LlmClient({ config: llmConfig(["m"]), apiKey: "k" });
    const r = await c.translateUIBatch(["Settings"], "zh-Hant");
    expect(r.translations).toEqual(["ℹ 設定 → 模型"]);
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it("translateUIBatch falls back when zh-Hant output is predominantly Simplified", async () => {
    generateTextMock
      .mockResolvedValueOnce(genResult('["无需注册或设置历史记录"]'))
      .mockResolvedValueOnce(genResult('["無需帳戶或註冊歷史記錄"]'));
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const r = await c.translateUIBatch(["History"], "zh-Hant");
    expect(r.translations).toEqual(["無需帳戶或註冊歷史記錄"]);
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("translatePluralCardinalBatch rejects wrong-script forms when targetLocale is hi-Latn", async () => {
    generateTextMock
      .mockResolvedValueOnce(genResult('{"one":"1 फ़ाइल","other":"{{count}} फ़ाइलें"}'))
      .mockResolvedValueOnce(genResult('{"one":"1 file","other":"{{count}} files"}'));
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const r = await c.translatePluralCardinalBatch(
      ["one", "other"],
      { systemPrompt: "sys", userContent: "usr" },
      { targetLocale: "hi-Latn" }
    );
    expect(r.forms.one).toBe("1 file");
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("translateDocumentSegment folds a discarded wrong-script attempt's tokens/cost into the result", async () => {
    generateTextMock
      .mockResolvedValueOnce(
        genResult("नमस्ते दुनिया", {
          cost: 0.001,
          usage: { inputTokens: 5, outputTokens: 7, totalTokens: 12 },
        })
      )
      .mockResolvedValueOnce(
        genResult("Namaste duniya", {
          cost: 0.002,
          usage: { inputTokens: 3, outputTokens: 4, totalTokens: 7 },
        })
      );
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const r = await c.translateDocumentSegment("Hello world", "hi-Latn", []);
    expect(r.content).toBe("Namaste duniya");
    expect(r.usage).toEqual({ inputTokens: 8, outputTokens: 11, totalTokens: 19 });
    expect(r.cost).toBeCloseTo(0.003);
  });

  it("chat folds a discarded empty-content attempt's tokens/cost into the result", async () => {
    generateTextMock
      .mockResolvedValueOnce(
        genResult("   ", {
          cost: 0.0005,
          usage: { inputTokens: 1, outputTokens: 0, totalTokens: 1 },
        })
      )
      .mockResolvedValueOnce(
        genResult("ok", { cost: 0.001, usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 } })
      );
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const r = await c.chat([
      { role: "system", content: "s" },
      { role: "user", content: "u" },
    ]);
    expect(r.content).toBe("ok");
    expect(r.usage).toEqual({ inputTokens: 3, outputTokens: 3, totalTokens: 6 });
    expect(r.cost).toBeCloseTo(0.0015);
  });

  it("translateDocumentBatch folds a discarded parse-failure attempt's tokens/cost into the result", async () => {
    generateTextMock
      .mockResolvedValueOnce(
        genResult(`<t id="0">only-one</t>`, {
          cost: 0.001,
          usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
        })
      )
      .mockResolvedValueOnce(
        genResult(`<t id="0">A</t><t id="1">B</t>`, {
          cost: 0.002,
          usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        })
      );
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    const r = await c.translateDocumentBatch(segs, "de");
    expect(r.usage).toEqual({ inputTokens: 7, outputTokens: 7, totalTokens: 14 });
    expect(r.cost).toBeCloseTo(0.003);
  });

  it("translateDocumentBatch sums discarded tokens but keeps cost undefined when no cost is reported", async () => {
    generateTextMock
      .mockResolvedValueOnce(
        genResult(`<t id="0">only-one</t>`, {
          usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
        })
      )
      .mockResolvedValueOnce(
        genResult(`<t id="0">A</t><t id="1">B</t>`, {
          usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        })
      );
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    const r = await c.translateDocumentBatch(segs, "de");
    expect(r.usage.totalTokens).toBe(14);
    expect(r.cost).toBeUndefined();
  });

  it("translateDocumentBatch attaches discarded tokens/cost to DocumentBatchAllModelsFailedError", async () => {
    generateTextMock.mockResolvedValue(
      genResult(`<t id="0">x</t>`, {
        cost: 0.001,
        usage: { inputTokens: 4, outputTokens: 1, totalTokens: 5 },
      })
    );
    const c = new LlmClient({ config: llmConfig(["m1", "m2"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    let err: unknown;
    try {
      await c.translateDocumentBatch(segs, "de", [], { docLogContext: { relativePath: "a.md" } });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(DocumentBatchAllModelsFailedError);
    const d = (err as InstanceType<typeof DocumentBatchAllModelsFailedError>).details;
    expect(d.wastedUsage).toEqual({ inputTokens: 8, outputTokens: 2, totalTokens: 10 });
    expect(d.wastedCost).toBeCloseTo(0.002);
  });

  it("translateUIBatch folds a discarded wrong-script attempt's tokens/cost into the result", async () => {
    generateTextMock
      .mockResolvedValueOnce(
        genResult('["सहेव"]', {
          cost: 0.001,
          usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
        })
      )
      .mockResolvedValueOnce(
        genResult('["Sahej"]', {
          cost: 0.002,
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        })
      );
    const c = new LlmClient({ config: llmConfig(["bad", "good"]), apiKey: "k" });
    const r = await c.translateUIBatch(["Save"], "hi-Latn");
    expect(r.translations).toEqual(["Sahej"]);
    expect(r.usage).toEqual({ inputTokens: 6, outputTokens: 6, totalTokens: 12 });
    expect(r.cost).toBeCloseTo(0.003);
  });

  it("onApiUsage fires once per billed response, including a discarded parse-failure attempt", async () => {
    const calls: Array<{ usage: GenResultOptions["usage"]; cost: number | undefined }> = [];
    generateTextMock
      .mockResolvedValueOnce(
        genResult(`<t id="0">only-one</t>`, {
          cost: 0.001,
          usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
        })
      )
      .mockResolvedValueOnce(
        genResult(`<t id="0">A</t><t id="1">B</t>`, {
          cost: 0.002,
          usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        })
      );
    const c = new LlmClient({
      config: llmConfig(["bad", "good"]),
      apiKey: "k",
      onApiUsage: (usage, cost) => calls.push({ usage, cost }),
    });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    await c.translateDocumentBatch(segs, "de");
    expect(calls).toEqual([
      { usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 }, cost: 0.001 },
      { usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 }, cost: 0.002 },
    ]);
  });

  it("onApiUsage fires for an empty-content billed response before fallback succeeds", async () => {
    const calls: Array<{ inputTokens: number; cost: number | undefined }> = [];
    generateTextMock
      .mockResolvedValueOnce(
        genResult("   ", {
          cost: 0.0005,
          usage: { inputTokens: 1, outputTokens: 0, totalTokens: 1 },
        })
      )
      .mockResolvedValueOnce(
        genResult("ok", { cost: 0.001, usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 } })
      );
    const c = new LlmClient({
      config: llmConfig(["bad", "good"]),
      apiKey: "k",
      onApiUsage: (usage, cost) => calls.push({ inputTokens: usage.inputTokens, cost }),
    });
    const r = await c.chat([
      { role: "system", content: "s" },
      { role: "user", content: "u" },
    ]);
    expect(r.content).toBe("ok");
    expect(calls).toEqual([
      { inputTokens: 1, cost: 0.0005 },
      { inputTokens: 2, cost: 0.001 },
    ]);
  });

  it("appendDebugLog writes request/response when debugTrafficFilePath set", async () => {
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "llm-debug-")), "traffic.log");
    generateTextMock.mockResolvedValue(genResult("x"));
    const c = new LlmClient({
      config: llmConfig(["m"]),
      apiKey: "k",
      debugTrafficFilePath: tmp,
    });
    await c.chat([
      { role: "system", content: "s" },
      { role: "user", content: "u" },
    ]);
    const log = fs.readFileSync(tmp, "utf8");
    expect(log).toContain("REQUEST");
    expect(log).toContain("RESPONSE");
    fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  });

  it("logs debug-traffic write failures without throwing", async () => {
    const warn = vi.fn();
    const badPath = fs.mkdtempSync(path.join(os.tmpdir(), "llm-debug-dir-"));
    generateTextMock.mockResolvedValue(genResult("x"));
    const c = new LlmClient({
      config: llmConfig(["m"]),
      apiKey: "k",
      debugTrafficFilePath: badPath,
      logger: { warn } as never,
    });
    await c.chat([
      { role: "system", content: "s" },
      { role: "user", content: "u" },
    ]);
    expect(warn.mock.calls.some((c) => String(c[0]).includes("debug-traffic"))).toBe(true);
    fs.rmSync(badPath, { recursive: true, force: true });
  });
});
