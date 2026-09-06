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
});
