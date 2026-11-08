import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import type { Segment } from "../../src/core/types.js";
import { translateOneSegmentWithQualityRetry } from "../../src/cli/doc-translate-quality-retry.js";
import { protectSegmentForTranslation } from "../../src/cli/doc-translate.js";
import { Glossary } from "../../src/glossary/glossary.js";
import type { LlmClient } from "../../src/api/llm-client.js";

const WHOLE_SEGMENT = [
  "1. **Rephrase…** — click **Rephrase…** above the output.",
  "2. **Word alternatives** — select words, then right-click.",
  "3. **Costs** — each **Rephrase…** click uses the model again.",
].join("\n");

function seg(content: string): Segment {
  return {
    id: "seg-0",
    type: "paragraph",
    content,
    hash: "abc123",
    translatable: true,
  };
}

describe("translateOneSegmentWithQualityRetry split fallback", () => {
  it("splits and retries from model 0 when all models fail with AST mismatch on whole segment", async () => {
    const models = ["model-a", "model-b"];
    let callCount = 0;
    const client = {
      getConfiguredModels: () => models,
      translateDocumentSegment: vi.fn(async (text: string) => {
        callCount++;
        const listItemCount = (text.match(/^\d+\./gm) ?? []).length;
        const isWhole = listItemCount >= 3;
        if (isWhole) {
          return {
            content: text.replace(/\{\{SE\}\}/g, ""),
            model: "model-b",
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            cost: 0,
            debugPrompt: { systemPrompt: "", userContent: "" },
            rawAssistantContent: "",
          };
        }
        return {
          content: text,
          model: "model-a",
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
          cost: 0,
          debugPrompt: { systemPrompt: "", userContent: "" },
          rawAssistantContent: "",
        };
      }),
    } as unknown as LlmClient;

    const glossary = new Glossary(undefined, undefined);
    const protectForPart = (raw: string) =>
      protectSegmentForTranslation(raw, glossary, "ko", true, true);
    const wholeProtected = protectForPart(WHOLE_SEGMENT);
    const result = await translateOneSegmentWithQualityRetry({
      client,
      locale: "ko",
      glossary,
      contentType: "markdown",
      models,
      original: seg(WHOLE_SEGMENT),
      protectedContent: wholeProtected.text,
      protectState: wholeProtected.state,
      startModelIndex: 0,
      splitDepth: 0,
      qualityRetrySplit: true,
      maxQualityRetrySplitDepth: 3,
      protectForTranslation: protectForPart,
      segmentHash: "abc123",
      failureFp: null,
      recordFailures: async () => {},
      buildQualityFailureRows: () => [],
      buildRuntimeFailureRow: () => ({
        sourceHash: "abc123",
        locale: "ko",
        model: null,
        modelOrder: null,
        qualityError: "runtime",
        errorMessage: "",
        fatal: true,
        filepath: null,
        sourceText: WHOLE_SEGMENT,
      }),
      modelOrder1Based: () => null,
      segLabelSingle: "segment 1/1",
    });

    expect(result.text).toBe(WHOLE_SEGMENT);
    expect(result.qualitySplitRetries).toBeGreaterThan(0);
    expect(callCount).toBeGreaterThan(models.length);
  });

  it("throws when qualityRetrySplit is false after model exhaustion", async () => {
    const models = ["model-a"];
    const client = {
      getConfiguredModels: () => models,
      translateDocumentSegment: vi.fn(async (text: string) => ({
        content: text.replace(/\{\{SE\}\}/g, ""),
        model: "model-a",
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        cost: 0,
        debugPrompt: { systemPrompt: "", userContent: "" },
        rawAssistantContent: "",
      })),
    } as unknown as LlmClient;

    const glossary = new Glossary(undefined, undefined);
    const short = "Use **bold** and **more** here.";
    const protectForPart = (raw: string) =>
      protectSegmentForTranslation(raw, glossary, "ko", true, true);
    const protectedShort = protectForPart(short);
    await expect(
      translateOneSegmentWithQualityRetry({
        client,
        locale: "ko",
        glossary,
        contentType: "markdown",
        models,
        original: seg(short),
        protectedContent: protectedShort.text,
        protectState: protectedShort.state,
        startModelIndex: 0,
        splitDepth: 0,
        qualityRetrySplit: false,
        maxQualityRetrySplitDepth: 3,
        protectForTranslation: protectForPart,
        segmentHash: "abc123",
        failureFp: null,
        recordFailures: async () => {},
        buildQualityFailureRows: () => [],
        buildRuntimeFailureRow: () => ({
          sourceHash: "abc123",
          locale: "ko",
          model: null,
          modelOrder: null,
          qualityError: "runtime",
          errorMessage: "",
          fatal: true,
          filepath: null,
          sourceText: "",
        }),
        modelOrder1Based: () => null,
        segLabelSingle: "",
      })
    ).rejects.toThrow(/Doc translation quality failed/);
  });

  it("retries next model when first returns HTML token swap; accepts correct second model", async () => {
    const source = '<li><a href="display-settings.md">Display Settings</a>: Configure theme</li>';
    const models = ["model-a", "model-b"];
    const glossary = new Glossary(undefined, undefined);
    const protectForPart = (raw: string) =>
      protectSegmentForTranslation(raw, glossary, "de", true, false);
    const protectedSeg = protectForPart(source);
    const good = "{{HTM_0}}{{HTM_1}}Anzeigeeinstellungen{{HTM_2}}: Design konfigurieren{{HTM_3}}";
    const bad = "{{HTM_0}}{{HTM_1}}Anzeigeeinstellungen{{HTM_3}}: Design konfigurieren{{HTM_3}}";

    const client = {
      getConfiguredModels: () => models,
      translateDocumentSegment: vi.fn(
        async (
          _text: string,
          _locale: string,
          _hints: unknown,
          opts?: { startModelIndex?: number }
        ) => {
          const idx = opts?.startModelIndex ?? 0;
          const model = models[idx]!;
          return {
            content: model === "model-a" ? bad : good,
            model,
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            cost: 0,
            debugPrompt: { systemPrompt: "", userContent: "" },
            rawAssistantContent: model === "model-a" ? bad : good,
          };
        }
      ),
    } as unknown as LlmClient;

    const result = await translateOneSegmentWithQualityRetry({
      client,
      locale: "de",
      glossary,
      contentType: "markdown",
      models,
      original: seg(source),
      protectedContent: protectedSeg.text,
      protectState: protectedSeg.state,
      startModelIndex: 0,
      splitDepth: 0,
      qualityRetrySplit: true,
      maxQualityRetrySplitDepth: 3,
      protectForTranslation: protectForPart,
      segmentHash: "abc123",
      failureFp: null,
      recordFailures: async () => {},
      buildQualityFailureRows: () => [],
      buildRuntimeFailureRow: () => ({
        sourceHash: "abc123",
        locale: "de",
        model: null,
        modelOrder: null,
        qualityError: "runtime",
        errorMessage: "",
        fatal: true,
        filepath: null,
        sourceText: source,
      }),
      modelOrder1Based: () => null,
      segLabelSingle: "segment 1/1",
    });

    expect(result.text).toContain("</a>");
    expect(result.text).not.toMatch(/Anzeigeeinstellungen<\/li>:/);
    expect(result.modelUsed).toBe("model-b");
    expect(result.qualitySplitRetries).toBe(0);
  });

  it("accepts CJK content-token reordering from the first model", async () => {
    const source = [
      "1. Create a new `.md` file in `documentation/docs/` (or a subdirectory)",
      "2. Add it to the sidebar in `documentation/sidebars.ts`",
      "3. Run `pnpm write-translations` to update the translation files structure",
      "4. Run `pnpm write-heading-ids` to generate heading IDs (anchors)",
    ].join("\n");
    const reordered = [
      "1. 在 {{ILC_1}}（或子目录）中创建新的 {{ILC_0}} 文件",
      "2. 将其添加到 {{ILC_2}} 侧边栏中",
      "3. 运行 {{ILC_3}} 以更新翻译文件结构",
      "4. 运行 {{ILC_4}} 以生成标题 ID（锚点）",
    ].join("\n");
    const models = ["model-a", "model-b"];
    const glossary = new Glossary(undefined, undefined);
    const protectForPart = (raw: string) =>
      protectSegmentForTranslation(raw, glossary, "zh-Hans", true, false);
    const protectedSeg = protectForPart(source);
    const translateDocumentSegment = vi.fn(async () => ({
      content: reordered,
      model: "model-a",
      usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      cost: 0,
      debugPrompt: { systemPrompt: "", userContent: "" },
      rawAssistantContent: reordered,
    }));
    const client = {
      getConfiguredModels: () => models,
      translateDocumentSegment,
    } as unknown as LlmClient;

    const result = await translateOneSegmentWithQualityRetry({
      client,
      locale: "zh-Hans",
      glossary,
      contentType: "markdown",
      models,
      original: seg(source),
      protectedContent: protectedSeg.text,
      protectState: protectedSeg.state,
      startModelIndex: 0,
      splitDepth: 0,
      qualityRetrySplit: true,
      maxQualityRetrySplitDepth: 3,
      protectForTranslation: protectForPart,
      segmentHash: "abc123",
      failureFp: null,
      recordFailures: async () => {},
      buildQualityFailureRows: () => [],
      buildRuntimeFailureRow: () => ({
        sourceHash: "abc123",
        locale: "zh-Hans",
        model: null,
        modelOrder: null,
        qualityError: "runtime",
        errorMessage: "",
        fatal: true,
        filepath: null,
        sourceText: source,
      }),
      modelOrder1Based: () => null,
      segLabelSingle: "segment 1/1",
    });

    expect(result.modelUsed).toBe("model-a");
    expect(result.qualitySplitRetries).toBe(0);
    expect(translateDocumentSegment).toHaveBeenCalledTimes(1);
    expect(result.text).toContain("`documentation/docs/`");
    expect(result.text).toContain("`.md`");
  });

  it("throws on placeholder invent without quality split after model exhaustion", async () => {
    const source =
      "- Optional [API keys](settings/api-keys-settings.md) for uploads with size limits";
    const models = ["model-a"];
    const glossary = new Glossary(undefined, undefined);
    const protectForPart = (raw: string) =>
      protectSegmentForTranslation(raw, glossary, "es", true, false);
    const protectedSeg = protectForPart(source);
    const bad = "- [Claves de API](settings/api-keys-settings.md) opcionales con {{TAM}} de subida";

    const client = {
      getConfiguredModels: () => models,
      translateDocumentSegment: vi.fn(async () => ({
        content: bad,
        model: "model-a",
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        cost: 0,
        debugPrompt: { systemPrompt: "", userContent: "" },
        rawAssistantContent: bad,
      })),
    } as unknown as LlmClient;

    await expect(
      translateOneSegmentWithQualityRetry({
        client,
        locale: "es",
        glossary,
        contentType: "markdown",
        models,
        original: seg(source),
        protectedContent: protectedSeg.text,
        protectState: protectedSeg.state,
        startModelIndex: 0,
        splitDepth: 0,
        qualityRetrySplit: true,
        maxQualityRetrySplitDepth: 3,
        protectForTranslation: protectForPart,
        segmentHash: "abc123",
        failureFp: null,
        recordFailures: async () => {},
        buildQualityFailureRows: () => [],
        buildRuntimeFailureRow: () => ({
          sourceHash: "abc123",
          locale: "es",
          model: null,
          modelOrder: null,
          qualityError: "runtime",
          errorMessage: "",
          fatal: true,
          filepath: null,
          sourceText: source,
        }),
        modelOrder1Based: () => null,
        segLabelSingle: "",
      })
    ).rejects.toThrow(/Doc translation quality failed/);
  });

  it("accepts the earliest glossary-label candidate when every model misses the label", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-soft-"));
    const strings = path.join(dir, "strings.json");
    fs.writeFileSync(
      strings,
      JSON.stringify({
        a: { source: "Other Models", translated: { de: "Andere Modelle" } },
      }),
      "utf8"
    );
    const source = "See **Other Models** here.";
    const models = ["model-a", "model-b"];
    const glossary = new Glossary(strings, undefined, ["de"]);
    const protectForPart = (raw: string) =>
      protectSegmentForTranslation(raw, glossary, "de", true, false);
    const protectedSeg = protectForPart(source);
    const misses = ["Siehe **Hier** bitte.", "Siehe **Dort** bitte."];
    const recorded: Array<{ fatal: boolean; errors: readonly string[]; rejected?: string }> = [];
    const client = {
      getConfiguredModels: () => models,
      translateDocumentSegment: vi.fn(
        async (
          _text: string,
          _locale: string,
          _hints: unknown,
          opts?: { startModelIndex?: number }
        ) => {
          const idx = opts?.startModelIndex ?? 0;
          const model = models[idx]!;
          return {
            content: misses[idx]!,
            model,
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            cost: 0,
            debugPrompt: { systemPrompt: "", userContent: "" },
            rawAssistantContent: misses[idx]!,
          };
        }
      ),
    } as unknown as LlmClient;

    try {
      const result = await translateOneSegmentWithQualityRetry({
        client,
        locale: "de",
        glossary,
        contentType: "markdown",
        models,
        original: seg(source),
        protectedContent: protectedSeg.text,
        protectState: protectedSeg.state,
        startModelIndex: 0,
        splitDepth: 0,
        qualityRetrySplit: true,
        maxQualityRetrySplitDepth: 3,
        protectForTranslation: protectForPart,
        segmentHash: "abc123",
        failureFp: null,
        recordFailures: async () => {},
        buildQualityFailureRows: (model, _order, errors, fatal, rejectedText) => {
          recorded.push({ fatal, errors, rejected: rejectedText });
          return [];
        },
        buildRuntimeFailureRow: () => ({
          sourceHash: "abc123",
          locale: "de",
          model: null,
          modelOrder: null,
          qualityError: "runtime",
          errorMessage: "",
          fatal: true,
        }),
        modelOrder1Based: (model) => (model ? models.indexOf(model) + 1 : null),
        segLabelSingle: "segment 1/1",
      });
      expect(result.text).toBe(misses[0]);
      expect(result.modelUsed).toBe("model-a");
      expect(result.glossaryWarning?.issues.map((issue) => issue.term)).toEqual(["Other Models"]);
      expect(result.glossaryWarning?.candidates.map((candidate) => candidate.model)).toEqual(
        models
      );
      expect(recorded.every((row) => row.fatal === false)).toBe(true);
      expect(recorded.map((row) => row.rejected)).toEqual(misses);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("drops a hard-error attempt and keeps an earlier glossary-label candidate", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-soft-hard-"));
    const strings = path.join(dir, "strings.json");
    fs.writeFileSync(
      strings,
      JSON.stringify({
        a: { source: "Other Models", translated: { de: "Andere Modelle" } },
      }),
      "utf8"
    );
    const source = "See **Other Models** here.";
    const models = ["model-a", "model-b"];
    const glossary = new Glossary(strings, undefined, ["de"]);
    const protectForPart = (raw: string) =>
      protectSegmentForTranslation(raw, glossary, "de", true, false);
    const protectedSeg = protectForPart(source);
    const labelMiss = "Siehe **Hier** bitte.";
    const astMiss = "Siehe hier bitte.";
    const client = {
      getConfiguredModels: () => models,
      translateDocumentSegment: vi.fn(
        async (
          _text: string,
          _locale: string,
          _hints: unknown,
          opts?: { startModelIndex?: number }
        ) => {
          const idx = opts?.startModelIndex ?? 0;
          const model = models[idx]!;
          const content = model === "model-a" ? labelMiss : astMiss;
          return {
            content,
            model,
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            cost: 0,
            debugPrompt: { systemPrompt: "", userContent: "" },
            rawAssistantContent: content,
          };
        }
      ),
    } as unknown as LlmClient;

    try {
      const result = await translateOneSegmentWithQualityRetry({
        client,
        locale: "de",
        glossary,
        contentType: "markdown",
        models,
        original: seg(source),
        protectedContent: protectedSeg.text,
        protectState: protectedSeg.state,
        startModelIndex: 0,
        splitDepth: 0,
        qualityRetrySplit: false,
        maxQualityRetrySplitDepth: 3,
        protectForTranslation: protectForPart,
        segmentHash: "abc123",
        failureFp: null,
        recordFailures: async () => {},
        buildQualityFailureRows: () => [],
        buildRuntimeFailureRow: () => ({
          sourceHash: "abc123",
          locale: "de",
          model: null,
          modelOrder: null,
          qualityError: "runtime",
          errorMessage: "",
          fatal: true,
        }),
        modelOrder1Based: (model) => (model ? models.indexOf(model) + 1 : null),
        segLabelSingle: "",
      });
      expect(result.text).toBe(labelMiss);
      expect(result.modelUsed).toBe("model-a");
      expect(result.glossaryWarning?.candidates).toHaveLength(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("stops after three identical glossary-label failures and keeps the earliest candidate", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-failfast-"));
    const strings = path.join(dir, "strings.json");
    fs.writeFileSync(
      strings,
      JSON.stringify({
        a: { source: "Other Models", translated: { de: "Andere Modelle" } },
      }),
      "utf8"
    );
    const source = "See **Other Models** here.";
    const models = ["model-a", "model-b", "model-c", "model-d", "model-e"];
    const glossary = new Glossary(strings, undefined, ["de"]);
    const protectForPart = (raw: string) =>
      protectSegmentForTranslation(raw, glossary, "de", true, false);
    const protectedSeg = protectForPart(source);
    const miss = "Siehe **Hier** bitte.";
    let calls = 0;
    const client = {
      getConfiguredModels: () => models,
      translateDocumentSegment: vi.fn(
        async (
          _text: string,
          _locale: string,
          _hints: unknown,
          opts?: { startModelIndex?: number }
        ) => {
          calls++;
          const idx = opts?.startModelIndex ?? 0;
          const model = models[idx]!;
          const content = idx < 3 ? miss : "Siehe **Andere Modelle** hier.";
          return {
            content,
            model,
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            cost: 0,
            debugPrompt: { systemPrompt: "", userContent: "" },
            rawAssistantContent: content,
          };
        }
      ),
    } as unknown as LlmClient;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const result = await translateOneSegmentWithQualityRetry({
        client,
        locale: "de",
        glossary,
        contentType: "markdown",
        models,
        original: seg(source),
        protectedContent: protectedSeg.text,
        protectState: protectedSeg.state,
        startModelIndex: 0,
        splitDepth: 0,
        qualityRetrySplit: true,
        maxQualityRetrySplitDepth: 3,
        protectForTranslation: protectForPart,
        segmentHash: "abc123",
        failureFp: null,
        recordFailures: async () => {},
        buildQualityFailureRows: () => [],
        buildRuntimeFailureRow: () => ({
          sourceHash: "abc123",
          locale: "de",
          model: null,
          modelOrder: null,
          qualityError: "runtime",
          errorMessage: "",
          fatal: true,
        }),
        modelOrder1Based: (model) => (model ? models.indexOf(model) + 1 : null),
        segLabelSingle: "segment 1/1",
      });
      expect(calls).toBe(3);
      expect(result.text).toBe(miss);
      expect(result.modelUsed).toBe("model-a");
      expect(result.glossaryWarning?.candidates.map((candidate) => candidate.model)).toEqual([
        "model-a",
        "model-b",
        "model-c",
      ]);
      expect(
        warn.mock.calls.some((call) => String(call[0]).includes("identical quality failures"))
      ).toBe(true);
    } finally {
      warn.mockRestore();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("stops after three identical hard failures without calling the remaining models", async () => {
    const models = ["model-a", "model-b", "model-c", "model-d", "model-e"];
    let calls = 0;
    const client = {
      getConfiguredModels: () => models,
      translateDocumentSegment: vi.fn(
        async (
          text: string,
          _locale: string,
          _hints: unknown,
          opts?: { startModelIndex?: number }
        ) => {
          calls++;
          const idx = opts?.startModelIndex ?? 0;
          return {
            content: text.replace(/\{\{SE\}\}/g, ""),
            model: models[idx]!,
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            cost: 0,
            debugPrompt: { systemPrompt: "", userContent: "" },
            rawAssistantContent: "",
          };
        }
      ),
    } as unknown as LlmClient;
    const glossary = new Glossary(undefined, undefined);
    const short = "Use **bold** and **more** here.";
    const protectForPart = (raw: string) =>
      protectSegmentForTranslation(raw, glossary, "ko", true, true);
    const protectedShort = protectForPart(short);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await expect(
        translateOneSegmentWithQualityRetry({
          client,
          locale: "ko",
          glossary,
          contentType: "markdown",
          models,
          original: seg(short),
          protectedContent: protectedShort.text,
          protectState: protectedShort.state,
          startModelIndex: 0,
          splitDepth: 0,
          qualityRetrySplit: false,
          maxQualityRetrySplitDepth: 3,
          protectForTranslation: protectForPart,
          segmentHash: "abc123",
          failureFp: null,
          recordFailures: async () => {},
          buildQualityFailureRows: () => [],
          buildRuntimeFailureRow: () => ({
            sourceHash: "abc123",
            locale: "ko",
            model: null,
            modelOrder: null,
            qualityError: "runtime",
            errorMessage: "",
            fatal: true,
            filepath: null,
            sourceText: short,
          }),
          modelOrder1Based: () => null,
          segLabelSingle: "",
        })
      ).rejects.toThrow(/Doc translation quality failed/);
      expect(calls).toBe(3);
    } finally {
      warn.mockRestore();
    }
  });

  it("keeps trying when quality errors are not the same three times", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-mixed-"));
    const strings = path.join(dir, "strings.json");
    fs.writeFileSync(
      strings,
      JSON.stringify({
        a: { source: "Other Models", translated: { de: "Andere Modelle" } },
      }),
      "utf8"
    );
    const source = "See **Other Models** here.";
    const models = ["model-a", "model-b", "model-c", "model-d"];
    const glossary = new Glossary(strings, undefined, ["de"]);
    const protectForPart = (raw: string) =>
      protectSegmentForTranslation(raw, glossary, "de", true, false);
    const protectedSeg = protectForPart(source);
    const labelMiss = "Siehe **Hier** bitte.";
    const astMiss = "Siehe hier bitte.";
    let calls = 0;
    const client = {
      getConfiguredModels: () => models,
      translateDocumentSegment: vi.fn(
        async (
          _text: string,
          _locale: string,
          _hints: unknown,
          opts?: { startModelIndex?: number }
        ) => {
          calls++;
          const idx = opts?.startModelIndex ?? 0;
          const content = idx % 2 === 0 ? labelMiss : astMiss;
          return {
            content,
            model: models[idx]!,
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            cost: 0,
            debugPrompt: { systemPrompt: "", userContent: "" },
            rawAssistantContent: content,
          };
        }
      ),
    } as unknown as LlmClient;

    try {
      const result = await translateOneSegmentWithQualityRetry({
        client,
        locale: "de",
        glossary,
        contentType: "markdown",
        models,
        original: seg(source),
        protectedContent: protectedSeg.text,
        protectState: protectedSeg.state,
        startModelIndex: 0,
        splitDepth: 0,
        qualityRetrySplit: false,
        maxQualityRetrySplitDepth: 3,
        protectForTranslation: protectForPart,
        segmentHash: "abc123",
        failureFp: null,
        recordFailures: async () => {},
        buildQualityFailureRows: () => [],
        buildRuntimeFailureRow: () => ({
          sourceHash: "abc123",
          locale: "de",
          model: null,
          modelOrder: null,
          qualityError: "runtime",
          errorMessage: "",
          fatal: true,
        }),
        modelOrder1Based: () => null,
        segLabelSingle: "",
      });
      expect(calls).toBe(4);
      expect(result.modelUsed).toBe("model-a");
      expect(result.glossaryWarning?.candidates).toHaveLength(2);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("counts a prior batch failure toward the three identical failures", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-prior-"));
    const strings = path.join(dir, "strings.json");
    fs.writeFileSync(
      strings,
      JSON.stringify({
        a: { source: "Other Models", translated: { de: "Andere Modelle" } },
      }),
      "utf8"
    );
    const source = "See **Other Models** here.";
    const models = ["model-a", "model-b", "model-c", "model-d"];
    const glossary = new Glossary(strings, undefined, ["de"]);
    const protectForPart = (raw: string) =>
      protectSegmentForTranslation(raw, glossary, "de", true, false);
    const protectedSeg = protectForPart(source);
    const miss = "Siehe **Hier** bitte.";
    const prior = glossary.missingLockedUiLabels(source, miss, "de").map((issue) => issue.message);
    let calls = 0;
    const client = {
      getConfiguredModels: () => models,
      translateDocumentSegment: vi.fn(
        async (
          _text: string,
          _locale: string,
          _hints: unknown,
          opts?: { startModelIndex?: number }
        ) => {
          calls++;
          const idx = opts?.startModelIndex ?? 0;
          return {
            content: miss,
            model: models[idx]!,
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            cost: 0,
            debugPrompt: { systemPrompt: "", userContent: "" },
            rawAssistantContent: miss,
          };
        }
      ),
    } as unknown as LlmClient;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const result = await translateOneSegmentWithQualityRetry({
        client,
        locale: "de",
        glossary,
        contentType: "markdown",
        models,
        original: seg(source),
        protectedContent: protectedSeg.text,
        protectState: protectedSeg.state,
        startModelIndex: 0,
        splitDepth: 0,
        qualityRetrySplit: false,
        maxQualityRetrySplitDepth: 3,
        protectForTranslation: protectForPart,
        segmentHash: "abc123",
        failureFp: null,
        recordFailures: async () => {},
        buildQualityFailureRows: () => [],
        buildRuntimeFailureRow: () => ({
          sourceHash: "abc123",
          locale: "de",
          model: null,
          modelOrder: null,
          qualityError: "runtime",
          errorMessage: "",
          fatal: true,
        }),
        modelOrder1Based: () => null,
        segLabelSingle: "",
        priorIdenticalQualityErrors: prior,
      });
      expect(calls).toBe(2);
      expect(result.glossaryWarning?.candidates).toHaveLength(2);
    } finally {
      warn.mockRestore();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
