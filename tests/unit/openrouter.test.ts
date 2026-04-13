import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentBatchAllModelsFailedError, OpenRouterClient } from "../../src/api/openrouter.js";
import type { I18nConfig } from "../../src/core/types.js";

function openRouterConfig(
  models: string[] = ["model-a", "model-b"]
): Pick<I18nConfig, "openrouter" | "sourceLocale" | "localeDisplayNames"> {
  return {
    sourceLocale: "en",
    localeDisplayNames: { de: "German" },
    openrouter: {
      baseUrl: "https://openrouter.ai/api/v1/",
      translationModels: models,
      maxTokens: 100,
      temperature: 0,
    },
  };
}

function completionBody(content: string, cost?: number) {
  return {
    id: "r1",
    choices: [{ message: { content }, finish_reason: "stop" }],
    usage: {
      prompt_tokens: 1,
      completion_tokens: 2,
      total_tokens: 3,
      ...(cost !== undefined ? { cost } : {}),
    },
  };
}

function mockJsonResponse(data: object, status = 200) {
  const raw = JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (_n: string) => null as string | null },
    text: async () => raw,
  };
}

describe("OpenRouterClient", () => {
  let prevKey: string | undefined;

  beforeEach(() => {
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

  it("throws when API key is missing", () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(() => new OpenRouterClient({ config: openRouterConfig(), apiKey: "" })).toThrow(
      /OPENROUTER_API_KEY is required/
    );
  });

  it("throws when no models are configured", () => {
    expect(() => new OpenRouterClient({ config: openRouterConfig([]) })).toThrow(
      /No OpenRouter models configured/
    );
  });

  it("getConfiguredModels returns resolved model list", () => {
    const c = new OpenRouterClient({ config: openRouterConfig(["x", "y"]), apiKey: "k" });
    expect(c.getConfiguredModels()).toEqual(["x", "y"]);
  });

  it("stripTranslateTags removes translate wrapper", () => {
    const c = new OpenRouterClient({ config: openRouterConfig(["m"]), apiKey: "k" });
    expect(c.stripTranslateTags("  <translate>  hi  </translate>  ")).toBe("hi");
  });

  it("chat returns first successful completion", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse(completionBody("ok")));
    vi.stubGlobal("fetch", fetchMock);

    const c = new OpenRouterClient({ config: openRouterConfig(["m1"]), apiKey: "k" });
    const res = await c.chat([
      { role: "system", content: "sys" },
      { role: "user", content: "usr" },
    ]);
    expect(res.content).toBe("ok");
    expect(res.model).toBe("m1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toContain("/chat/completions");
  });

  it("chat tries next model when first fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: { get: () => null },
        text: async () => "err",
      })
      .mockResolvedValueOnce(mockJsonResponse(completionBody("retry-ok")));
    vi.stubGlobal("fetch", fetchMock);

    const c = new OpenRouterClient({ config: openRouterConfig(["bad", "good"]), apiKey: "k" });
    const res = await c.chat(
      [
        { role: "system", content: "s" },
        { role: "user", content: "u" },
      ],
      { docLogContext: { locale: "de", relativePath: "a.md" } }
    );
    expect(res.content).toBe("retry-ok");
    expect(res.model).toBe("good");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("chat throws when all models fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: { get: () => null },
        text: async () => "x",
      })
    );
    const c = new OpenRouterClient({ config: openRouterConfig(["a", "b"]), apiKey: "k" });
    await expect(
      c.chat([
        { role: "system", content: "s" },
        { role: "user", content: "u" },
      ])
    ).rejects.toThrow(/All translation models failed/);
  });

  it("translateDocumentSegment strips tags from response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockJsonResponse(completionBody("<translate>DE</translate>")))
    );
    const c = new OpenRouterClient({ config: openRouterConfig(["m"]), apiKey: "k" });
    const r = await c.translateDocumentSegment("src", "de", []);
    expect(r.content).toBe("DE");
  });

  it("translateDocumentBatch returns empty map for zero segments", async () => {
    const c = new OpenRouterClient({ config: openRouterConfig(["m"]), apiKey: "k" });
    const r = await c.translateDocumentBatch([], "de");
    expect(r.translations.size).toBe(0);
    expect(r.usage.totalTokens).toBe(0);
  });

  it("translateDocumentBatch parses batch XML response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(mockJsonResponse(completionBody(`<t id="0">A</t>\n<t id="1">B</t>`)))
    );
    const c = new OpenRouterClient({ config: openRouterConfig(["m"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    const r = await c.translateDocumentBatch(segs, "de");
    expect(r.translations.get(0)).toBe("A");
    expect(r.translations.get(1)).toBe("B");
  });

  it("translateDocumentBatch parses json-array response format", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockJsonResponse(completionBody('["A","B"]')))
    );
    const c = new OpenRouterClient({ config: openRouterConfig(["m"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    const r = await c.translateDocumentBatch(segs, "de", [], { responseFormat: "json-array" });
    expect(r.translations.get(0)).toBe("A");
    expect(r.translations.get(1)).toBe("B");
  });

  it("translateDocumentBatch parses json-object response format", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockJsonResponse(completionBody('{"0":"A","1":"B"}')))
    );
    const c = new OpenRouterClient({ config: openRouterConfig(["m"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    const r = await c.translateDocumentBatch(segs, "de", [], { responseFormat: "json-object" });
    expect(r.translations.get(0)).toBe("A");
    expect(r.translations.get(1)).toBe("B");
  });

  it("translateDocumentBatch throws DocumentBatchAllModelsFailedError with parse details when all models fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockJsonResponse(completionBody(`<t id="0">x</t>`)))
    );
    const c = new OpenRouterClient({ config: openRouterConfig(["m1", "m2"]), apiKey: "k" });
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
    const d = (err as DocumentBatchAllModelsFailedError).details;
    expect(d.lastRawAssistantContent).toContain("<t id=");
    expect(d.systemPrompt.length).toBeGreaterThan(0);
    expect(d.userContent.length).toBeGreaterThan(0);
  });

  it("translateUIBatch returns empty for no texts", async () => {
    const c = new OpenRouterClient({ config: openRouterConfig(["m"]), apiKey: "k" });
    const r = await c.translateUIBatch([], "de");
    expect(r.translations).toEqual([]);
  });

  it("translateUIBatch parses JSON array response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockJsonResponse(completionBody('```json\n["eins","zwei"]\n```')))
    );
    const c = new OpenRouterClient({ config: openRouterConfig(["m"]), apiKey: "k" });
    const r = await c.translateUIBatch(["a", "b"], "de");
    expect(r.translations).toEqual(["eins", "zwei"]);
  });

  it("translateUIBatch includes BCP-47 id and English display name in the user prompt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse(completionBody('["x"]')));
    vi.stubGlobal("fetch", fetchMock);
    const c = new OpenRouterClient({
      config: {
        ...openRouterConfig(["m"]),
        localeDisplayNames: { de: "German", en: "English", "pt-BR": "Portuguese (BR)" },
      },
      apiKey: "k",
    });
    await c.translateUIBatch(["a"], "de");
    const init = fetchMock.mock.calls[0]![1] as { body?: string };
    const payload = JSON.parse(init.body ?? "{}") as {
      messages: Array<{ role: string; content: string }>;
    };
    const user = payload.messages.find((m) => m.role === "user");
    expect(user?.content).toContain("en: English");
    expect(user?.content).toContain("de: German");
  });

  it("translateUIBatch uses Intl English names when localeDisplayNames has no entry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse(completionBody('["x"]')));
    vi.stubGlobal("fetch", fetchMock);
    const c = new OpenRouterClient({
      config: {
        ...openRouterConfig(["m"]),
        localeDisplayNames: {},
      },
      apiKey: "k",
    });
    await c.translateUIBatch(["a"], "de");
    const init = fetchMock.mock.calls[0]![1] as { body?: string };
    const payload = JSON.parse(init.body ?? "{}") as {
      messages: Array<{ role: string; content: string }>;
    };
    const user = payload.messages.find((m) => m.role === "user");
    expect(user?.content).toContain("en: English");
    expect(user?.content).toContain("de: German");
  });

  it("fetchCompletion retries once on HTTP 429 then succeeds", async () => {
    vi.useFakeTimers();
    const first = {
      ok: false,
      status: 429,
      headers: {
        get: (name: string) => (name.toLowerCase() === "retry-after" ? "0.001" : null),
      },
      text: async () => "rate limited",
    };
    const second = mockJsonResponse(completionBody("after-429"));
    let call = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      call++;
      return Promise.resolve(call === 1 ? first : second);
    });
    vi.stubGlobal("fetch", fetchMock);
    const c = new OpenRouterClient({ config: openRouterConfig(["m"]), apiKey: "k" });
    const p = c.chat([
      { role: "system", content: "s" },
      { role: "user", content: "u" },
    ]);
    await vi.runAllTimersAsync();
    const res = await p;
    expect(res.content).toBe("after-429");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("chat logs via logger when model fails without docLogContext", async () => {
    const warn = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: { get: () => null },
        text: async () => "e",
      })
      .mockResolvedValueOnce(mockJsonResponse(completionBody("ok")));
    vi.stubGlobal("fetch", fetchMock);
    const c = new OpenRouterClient({
      config: openRouterConfig(["a", "b"]),
      apiKey: "k",
      logger: { warn } as never,
    });
    await c.chat([
      { role: "system", content: "s" },
      { role: "user", content: "u" },
    ]);
    expect(warn).toHaveBeenCalled();
  });

  it("translateDocumentBatch warns Batch parse failed without docLogContext", async () => {
    const warn = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse(completionBody(`<t id="0">only-one</t>`)))
      .mockResolvedValueOnce(mockJsonResponse(completionBody(`<t id="0">A</t>\n<t id="1">B</t>`)));
    vi.stubGlobal("fetch", fetchMock);
    const c = new OpenRouterClient({
      config: openRouterConfig(["bad", "good"]),
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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: { get: () => null },
        text: async () => "e",
      })
      .mockResolvedValueOnce(mockJsonResponse(completionBody(`<t id="0">A</t><t id="1">B</t>`)));
    vi.stubGlobal("fetch", fetchMock);
    const c = new OpenRouterClient({
      config: openRouterConfig(["bad", "good"]),
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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse(completionBody(`<t id="0">only-one</t>`)))
      .mockResolvedValueOnce(mockJsonResponse(completionBody(`<t id="0">A</t><t id="1">B</t>`)));
    vi.stubGlobal("fetch", fetchMock);
    const c = new OpenRouterClient({ config: openRouterConfig(["bad", "good"]), apiKey: "k" });
    const segs = [
      { id: "s0", type: "paragraph" as const, content: "a", hash: "h0", translatable: true },
      { id: "s1", type: "paragraph" as const, content: "b", hash: "h1", translatable: true },
    ];
    const r = await c.translateDocumentBatch(segs, "de", [], {
      docLogContext: { relativePath: "x.md" },
    });
    expect(r.translations.get(0)).toBe("A");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("translateUIBatch throws when all models fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: { get: () => null },
        text: async () => "err",
      })
    );
    const c = new OpenRouterClient({ config: openRouterConfig(["a", "b"]), apiKey: "k" });
    await expect(c.translateUIBatch(["x"], "de")).rejects.toThrow(
      /All translation models failed for UI batch/
    );
  });

  it("fetchCompletion throws on empty message content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockJsonResponse({
          id: "r",
          choices: [{ message: { content: "   " }, finish_reason: "stop" }],
          usage: { prompt_tokens: 1, completion_tokens: 0, total_tokens: 1 },
        })
      )
    );
    const c = new OpenRouterClient({ config: openRouterConfig(["m"]), apiKey: "k" });
    await expect(
      c.chat([
        { role: "system", content: "s" },
        { role: "user", content: "u" },
      ])
    ).rejects.toThrow(/Empty OpenRouter response/);
  });

  it("appendDebugLog writes request/response when debugTrafficFilePath set", async () => {
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "or-debug-")), "traffic.log");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJsonResponse(completionBody("x"))));
    const c = new OpenRouterClient({
      config: openRouterConfig(["m"]),
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
});
