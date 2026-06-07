import { describe, expect, it, vi } from "vitest";
import type { Segment } from "../../src/core/types.js";
import { translateOneSegmentWithQualityRetry } from "../../src/cli/doc-translate-quality-retry.js";
import { protectSegmentForTranslation } from "../../src/cli/doc-translate.js";
import { Glossary } from "../../src/glossary/glossary.js";
import type { OpenRouterClient } from "../../src/api/openrouter.js";

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
    } as unknown as OpenRouterClient;

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
    } as unknown as OpenRouterClient;

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
});
