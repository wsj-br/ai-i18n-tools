import fs from "fs";
import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import {
  type BatchTranslationResult,
  type ChatResponse,
  type Segment,
  type TranslationResult,
  BatchTranslationError,
} from "../core/types.js";
import {
  englishLanguageNameForLocale,
  normalizeLocale,
  resolveTranslationModels,
} from "../core/config.js";
import {
  buildDocumentBatchPrompt,
  buildDocumentSinglePrompt,
  buildUIPromptMessages,
  parseBatchJsonArrayResponse,
  parseBatchJsonObjectResponse,
  parseBatchTranslationResponse,
  parseUIJsonArrayResponse,
  type DocumentBatchResponseFormat,
  type DocumentPromptContentType,
} from "../core/prompt-builder.js";
import type { Logger } from "../utils/logger.js";

/** OpenRouter: prefer throughput; allow backup providers. */
const OPENROUTER_PROVIDER = {
  sort: "throughput" as const,
  allow_fallbacks: true,
};

interface OpenRouterContentBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral"; ttl?: string };
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterContentBlock[];
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost?: number;
    cost_details?: { upstream_inference_cost?: number };
  };
}

interface OpenRouterRequestPayload {
  model: string;
  max_tokens: number;
  temperature: number;
  messages: OpenRouterMessage[];
  provider: typeof OPENROUTER_PROVIDER;
}

/** Thrown when every model in the chain fails for {@link OpenRouterClient.translateDocumentBatch}. */
export class DocumentBatchAllModelsFailedError extends Error {
  constructor(
    message: string,
    public readonly details: {
      systemPrompt: string;
      userContent: string;
      lastModel: string;
      lastError: unknown;
      /** HTTP response body text when the model returned content but parsing failed. */
      lastRawAssistantContent?: string;
    }
  ) {
    super(message);
    this.name = "DocumentBatchAllModelsFailedError";
  }
}

export interface OpenRouterClientOptions {
  config: Pick<I18nConfig, "openrouter" | "sourceLocale" | "localeDisplayNames">;
  apiKey?: string;
  /**
   * When set and non-empty, use this ordered model list instead of resolving from `config.openrouter`
   * (e.g. UI translation with `ui.preferredModel` prepended to the global list).
   */
  translationModels?: string[];
  /** Append request/response JSON when set. */
  debugTrafficFilePath?: string | null;
  logger?: Logger;
  httpReferer?: string;
  xTitle?: string;
}

/**
 * OpenRouter chat client with ordered `translationModels` fallback chain.
 */
export class OpenRouterClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly modelsToTry: string[];
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly debugTrafficFilePath: string | null;
  private readonly logger?: Logger;
  private readonly localeDisplayNames: Record<string, string>;
  private readonly sourceLanguageLabel: string;
  private readonly httpReferer: string;
  private readonly xTitle: string;

  constructor(opts: OpenRouterClientOptions) {
    this.apiKey = opts.apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required");
    }
    this.baseUrl = opts.config.openrouter.baseUrl.replace(/\/$/, "");
    const override = opts.translationModels;
    const fromOverride =
      Array.isArray(override) && override.length > 0
        ? override
            .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
            .map((m) => m.trim())
        : null;
    this.modelsToTry =
      fromOverride !== null && fromOverride.length > 0
        ? fromOverride
        : resolveTranslationModels(opts.config.openrouter);
    if (this.modelsToTry.length === 0) {
      throw new Error("No OpenRouter models configured (translationModels or defaultModel)");
    }
    this.maxTokens = opts.config.openrouter.maxTokens;
    this.temperature = opts.config.openrouter.temperature;
    this.debugTrafficFilePath = opts.debugTrafficFilePath ?? null;
    this.logger = opts.logger;
    this.localeDisplayNames = {};
    for (const [k, v] of Object.entries(opts.config.localeDisplayNames ?? {})) {
      if (typeof v === "string") {
        this.localeDisplayNames[normalizeLocale(k)] = v;
      }
    }
    this.sourceLanguageLabel = this.languageLabelForPrompt(opts.config.sourceLocale);
    this.httpReferer = opts.httpReferer ?? "https://github.com/wsj-br/ai-i18n-tools";
    this.xTitle = opts.xTitle ?? "ai-i18n-tools";
  }

  getConfiguredModels(): readonly string[] {
    return this.modelsToTry;
  }

  /**
   * BCP-47 locale id plus English display name for LLM prompts (e.g. `pt-BR: Brazilian Portuguese`).
   * Uses a colon so it reads as a clear key–value / label field (common in prompt instructions);
   * it does not clash with hyphens inside tags (`zh-CN`, `pt-BR`) the way a bare `-` can.
   * Order: `localeDisplayNames` from config, else `englishLanguageNameForLocale` (Intl), else raw code.
   */
  private languageLabelForPrompt(localeCode: string): string {
    const n = normalizeLocale(localeCode);
    const configured = this.localeDisplayNames[n];
    const display =
      configured && configured.trim().length > 0
        ? configured.trim()
        : englishLanguageNameForLocale(n);
    if (display && display.length > 0) {
      return `${n}: ${display}`;
    }
    return localeCode;
  }

  private appendDebugLog(direction: "request" | "response", payload: unknown): void {
    if (!this.debugTrafficFilePath) {
      return;
    }
    const ts = new Date().toISOString();
    const sep = `========== ${direction.toUpperCase()} ${ts} ==========`;
    const body = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    try {
      fs.appendFileSync(this.debugTrafficFilePath, `${sep}\n${body}\n\n`, "utf8");
    } catch (e) {
      this.logger?.warn(`[debug-traffic] Failed to write: ${e}`);
    }
  }

  private async handleRateLimit(response: Response): Promise<void> {
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const ms = retryAfter ? parseFloat(retryAfter) * 1000 : 2000;
      await new Promise((r) => setTimeout(r, Number.isFinite(ms) ? ms : 2000));
    }
  }

  /** Match doc-translate log lines: two-space indent, locale, filename. */
  private warnModelSwitch(
    localeCode: string,
    relativePath: string | undefined,
    failedModel: string,
    nextModel: string,
    error: unknown
  ): void {
    const loc = relativePath != null ? `${localeCode} ${relativePath}` : localeCode;
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(
      chalk.yellow(`  ⚠️  ${loc}: ${failedModel} failed (${detail}). Trying ${nextModel}…`)
    );
  }

  private extractUsage(data: OpenRouterResponse): {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost?: number;
  } {
    const cost = data.usage.cost ?? (data as { cost?: number }).cost;
    return {
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
      cost,
    };
  }

  private toOpenRouterMessages(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
  ): OpenRouterMessage[] {
    return messages.map((m, i) => {
      if (m.role === "system" && i === 0) {
        return {
          role: "system",
          content: [
            {
              type: "text",
              text: m.content,
              cache_control: { type: "ephemeral" },
            },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });
  }

  /** Single HTTP call for one model (with one 429 retry). */
  private async fetchCompletion(
    model: string,
    openRouterMessages: OpenRouterMessage[]
  ): Promise<ChatResponse> {
    const requestPayload: OpenRouterRequestPayload = {
      model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: openRouterMessages,
      provider: OPENROUTER_PROVIDER,
    };

    if (this.debugTrafficFilePath) {
      this.appendDebugLog("request", requestPayload);
    }

    let response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": this.httpReferer,
        "X-Title": this.xTitle,
      },
      body: JSON.stringify(requestPayload),
    });

    if (response.status === 429) {
      await this.handleRateLimit(response);
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.httpReferer,
          "X-Title": this.xTitle,
        },
        body: JSON.stringify(requestPayload),
      });
    }

    const rawBody = await response.text();

    if (this.debugTrafficFilePath) {
      let parsedBody: unknown = rawBody;
      try {
        parsedBody = response.ok ? (JSON.parse(rawBody) as unknown) : rawBody;
      } catch {
        /* keep text */
      }
      this.appendDebugLog("response", {
        status: response.status,
        ok: response.ok,
        body: parsedBody,
      });
    }

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} - ${rawBody}`);
    }

    let data: OpenRouterResponse;
    try {
      data = JSON.parse(rawBody) as OpenRouterResponse;
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }

    const content = data.choices[0]?.message?.content;
    if (content === undefined || content === null || String(content).trim() === "") {
      throw new Error("Empty OpenRouter response content");
    }

    const usage = this.extractUsage(data);
    return {
      content: String(content),
      model,
      usage,
      cost: usage.cost,
    };
  }

  async chat(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: {
      startModelIndex?: number;
      docLogContext?: { locale: string; relativePath: string };
    }
  ): Promise<ChatResponse> {
    const openRouterMessages = this.toOpenRouterMessages(messages);
    const start = Math.max(0, Math.floor(options?.startModelIndex ?? 0));
    let lastError: unknown;

    for (let mi = start; mi < this.modelsToTry.length; mi++) {
      const model = this.modelsToTry[mi]!;
      try {
        return await this.fetchCompletion(model, openRouterMessages);
      } catch (e) {
        lastError = e;
        const nextModel = this.modelsToTry[mi + 1];
        if (nextModel && options?.docLogContext) {
          this.warnModelSwitch(
            options.docLogContext.locale,
            options.docLogContext.relativePath,
            model,
            nextModel,
            e
          );
        } else if (!options?.docLogContext) {
          this.logger?.warn(`Model ${model} failed: ${e}`);
        }
      }
    }

    throw new Error(
      `All translation models failed (${this.modelsToTry.slice(start).join(", ")}). Last error: ${lastError}`
    );
  }

  stripTranslateTags(content: string): string {
    return content
      .replace(/^\s*<translate>\s*/i, "")
      .replace(/\s*<\/translate>\s*$/i, "")
      .trim();
  }

  async translateDocumentSegment(
    content: string,
    targetLocale: string,
    glossaryHints: string[],
    options?: {
      startModelIndex?: number;
      contentType?: DocumentPromptContentType;
      docLogContext?: { locale: string; relativePath: string };
    }
  ): Promise<TranslationResult> {
    const contentType = options?.contentType ?? "markdown";
    const { systemPrompt, userContent } = buildDocumentSinglePrompt(
      content,
      {
        sourceLanguageLabel: this.sourceLanguageLabel,
        targetLanguageLabel: this.languageLabelForPrompt(targetLocale),
        glossaryHints,
      },
      contentType
    );

    const res = await this.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      {
        startModelIndex: options?.startModelIndex,
        docLogContext: options?.docLogContext,
      }
    );

    return {
      content: this.stripTranslateTags(res.content),
      model: res.model,
      usage: res.usage,
      cost: res.cost,
      debugPrompt: { systemPrompt, userContent },
      rawAssistantContent: res.content,
    };
  }

  async translateDocumentBatch(
    segments: Segment[],
    locale: string,
    glossaryHints: string[] = [],
    options?: {
      startModelIndex?: number;
      contentType?: DocumentPromptContentType;
      responseFormat?: DocumentBatchResponseFormat;
      /** When set, log model fallback warnings (translate-docs style). */
      docLogContext?: { relativePath: string };
    }
  ): Promise<BatchTranslationResult> {
    if (segments.length === 0) {
      return {
        translations: new Map(),
        model: this.modelsToTry[0]!,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      };
    }

    const contentType = options?.contentType ?? "markdown";
    const responseFormat = options?.responseFormat ?? "xml-tags";
    const { systemPrompt, userContent } = buildDocumentBatchPrompt(
      segments,
      {
        sourceLanguageLabel: this.sourceLanguageLabel,
        targetLanguageLabel: this.languageLabelForPrompt(locale),
        glossaryHints,
      },
      contentType,
      responseFormat
    );

    const openRouterMessages = this.toOpenRouterMessages([
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ]);

    const start = Math.max(0, Math.floor(options?.startModelIndex ?? 0));
    let lastError: unknown;
    let lastFailureDetails:
      | {
          systemPrompt: string;
          userContent: string;
          lastModel: string;
          lastError: unknown;
          lastRawAssistantContent?: string;
        }
      | undefined;

    for (let mi = start; mi < this.modelsToTry.length; mi++) {
      const model = this.modelsToTry[mi]!;
      let completion: ChatResponse;
      try {
        completion = await this.fetchCompletion(model, openRouterMessages);
      } catch (e) {
        lastError = e;
        lastFailureDetails = {
          systemPrompt,
          userContent,
          lastModel: model,
          lastError: e,
          lastRawAssistantContent: undefined,
        };
        const nextModel = this.modelsToTry[mi + 1];
        if (nextModel && options?.docLogContext) {
          this.warnModelSwitch(locale, options.docLogContext.relativePath, model, nextModel, e);
        } else if (!options?.docLogContext) {
          if (e instanceof BatchTranslationError) {
            this.logger?.warn(`Batch parse failed with ${model}: ${e.message}`);
          } else {
            this.logger?.warn(`Batch request failed with ${model}: ${e}`);
          }
        }
        continue;
      }

      try {
        let translations: Map<number, string>;
        if (responseFormat === "json-array") {
          translations = parseBatchJsonArrayResponse(completion.content, segments.length);
        } else if (responseFormat === "json-object") {
          translations = parseBatchJsonObjectResponse(completion.content, segments.length);
        } else {
          translations = parseBatchTranslationResponse(
            completion.content,
            segments.length,
            completion.content
          );
        }
        return {
          translations,
          model: completion.model,
          usage: completion.usage,
          cost: completion.cost,
          debugPrompt: { systemPrompt, userContent },
          rawAssistantContent: completion.content,
        };
      } catch (e) {
        lastError = e;
        lastFailureDetails = {
          systemPrompt,
          userContent,
          lastModel: model,
          lastError: e,
          lastRawAssistantContent: completion.content,
        };
        const nextModel = this.modelsToTry[mi + 1];
        if (nextModel && options?.docLogContext) {
          this.warnModelSwitch(locale, options.docLogContext.relativePath, model, nextModel, e);
        } else if (!options?.docLogContext) {
          if (e instanceof BatchTranslationError) {
            this.logger?.warn(`Batch parse failed with ${model}: ${e.message}`);
          } else {
            this.logger?.warn(`Batch parse failed with ${model}: ${e}`);
          }
        }
      }
    }

    const msg = `All translation models failed for batch (${this.modelsToTry.slice(start).join(", ")}). Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`;
    const details =
      lastFailureDetails ??
      ({
        systemPrompt,
        userContent,
        lastModel: this.modelsToTry[Math.max(0, this.modelsToTry.length - 1)]!,
        lastError,
        lastRawAssistantContent: undefined,
      } as const);
    throw new DocumentBatchAllModelsFailedError(msg, details);
  }

  /**
   * UI strings: translate a batch of strings and return a JSON array response, with model fallback chain.
   */
  async translateUIBatch(
    texts: string[],
    targetLocale: string,
    options?: { startModelIndex?: number; glossaryHints?: string[] }
  ): Promise<{
    translations: string[];
    model: string;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
    cost?: number;
  }> {
    if (texts.length === 0) {
      return {
        translations: [],
        model: this.modelsToTry[0]!,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      };
    }

    const { systemPrompt, userContent } = buildUIPromptMessages(texts, {
      sourceLanguageLabel: this.sourceLanguageLabel,
      targetLanguageLabel: this.languageLabelForPrompt(targetLocale),
      glossaryHints: options?.glossaryHints,
    });

    const openRouterMessages = this.toOpenRouterMessages([
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ]);

    const start = Math.max(0, Math.floor(options?.startModelIndex ?? 0));
    let lastError: unknown;

    for (let mi = start; mi < this.modelsToTry.length; mi++) {
      const model = this.modelsToTry[mi]!;
      try {
        const result = await this.fetchCompletion(model, openRouterMessages);
        const translations = parseUIJsonArrayResponse(result.content, texts.length);
        return {
          translations,
          model: result.model,
          usage: result.usage,
          cost: result.cost,
        };
      } catch (e) {
        lastError = e;
        this.logger?.warn(`UI batch failed with ${model}: ${e}`);
      }
    }

    throw new Error(
      `All translation models failed for UI batch (${this.modelsToTry.slice(start).join(", ")}). Last error: ${lastError}`
    );
  }
}
