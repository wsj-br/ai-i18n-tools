import fs from "fs";
import chalk from "chalk";
import { generateText } from "ai";
import {
  createOpenAICompatible,
  type MetadataExtractor,
  type OpenAICompatibleProvider,
} from "@ai-sdk/openai-compatible";
import type { CldrPluralForm, I18nConfig } from "../core/types.js";
import {
  type BatchTranslationResult,
  type ChatResponse,
  type LlmUsageStats,
  type Segment,
  type TranslationResult,
  BatchTranslationError,
} from "../core/types.js";
import {
  englishLanguageNameForLocale,
  normalizeLocale,
  resolveTranslationModels,
} from "../core/config.js";
import { disallowedScriptLetters, englishScriptName, scriptSubtag } from "../core/locale-utils.js";
import {
  OPENROUTER_PROVIDER_KEY,
  resolveActiveProvider,
  resolveApiKey,
  resolveProviderSettings,
  type ResolvedProviderSettings,
} from "../core/llm-providers.js";
import {
  buildDocumentBatchPrompt,
  buildDocumentSinglePrompt,
  buildLintSourcePromptMessages,
  buildUIPromptMessages,
  parseBatchJsonArrayResponse,
  parseBatchJsonObjectResponse,
  parseBatchTranslationResponse,
  parseLintSourceBatchResponse,
  parsePluralFormsJsonResponse,
  parseUIJsonArrayResponse,
  ScriptValidationError,
  type DocumentBatchResponseFormat,
  type DocumentPromptContentType,
  type LintSourceSlotResult,
} from "../core/prompt-builder.js";
import type { Logger } from "../utils/logger.js";

/** OpenRouter: prefer throughput; allow backup providers (top-level `provider` routing field). */
const OPENROUTER_PROVIDER = {
  sort: "throughput" as const,
  allow_fallbacks: true,
};

interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * OpenRouter returns `usage.cost` (USD) on non-streaming responses; surface it through
 * `providerMetadata.openrouter.cost` so the client can report exact spend.
 */
const openRouterMetadataExtractor: MetadataExtractor = {
  extractMetadata: ({ parsedBody }: { parsedBody: unknown }) => {
    const body = parsedBody as { usage?: { cost?: unknown }; cost?: unknown } | null;
    const cost = body?.usage?.cost ?? body?.cost;
    return Promise.resolve(
      typeof cost === "number" ? { [OPENROUTER_PROVIDER_KEY]: { cost } } : undefined
    );
  },
  createStreamExtractor: () => ({
    processChunk: () => {},
    buildMetadata: () => undefined,
  }),
};

/** Thrown when every model in the chain fails for {@link LlmClient.translateDocumentBatch}. */
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

export interface LlmClientOptions {
  config: Pick<I18nConfig, "provider" | "providers" | "sourceLocale" | "localeDisplayNames">;
  /** Override the active provider's API key (otherwise read from its configured env var). */
  apiKey?: string;
  /**
   * When set and non-empty, use this ordered model list instead of resolving from the active provider
   * (e.g. UI translation with `ui.preferredModel` prepended to the provider's list).
   */
  translationModels?: string[];
  /** Append request/response JSON when set. */
  debugTrafficFilePath?: string | null;
  logger?: Logger;
  httpReferer?: string;
  xTitle?: string;
}

/** @deprecated Use {@link LlmClientOptions}. */
export type OpenRouterClientOptions = LlmClientOptions;

/**
 * Provider-agnostic chat client (Vercel AI SDK, OpenAI-compatible transport) with an ordered
 * `translationModels` fallback chain. The active provider is chosen from config; OpenRouter-specific
 * routing/headers/cost are applied only when the active provider is `openrouter`.
 */
export class LlmClient {
  private readonly provider: string;
  private readonly isOpenRouter: boolean;
  private readonly apiKey: string;
  private readonly providerInstance: OpenAICompatibleProvider;
  private readonly modelsToTry: string[];
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly debugTrafficFilePath: string | null;
  private readonly logger?: Logger;
  private readonly localeDisplayNames: Record<string, string>;
  private readonly sourceLanguageLabel: string;
  private readonly httpReferer: string;
  private readonly xTitle: string;
  private readonly requestTimeoutMs: number;

  constructor(opts: LlmClientOptions) {
    this.provider = resolveActiveProvider(opts.config);
    this.isOpenRouter = this.provider === OPENROUTER_PROVIDER_KEY;
    const settings = resolveProviderSettings(this.provider, opts.config);

    if (opts.apiKey !== undefined) {
      if (!opts.apiKey && settings.requiresApiKey) {
        throw new Error(
          `${settings.apiKeyEnv ?? "API key"} is required for provider "${this.provider}"`
        );
      }
      this.apiKey = opts.apiKey;
    } else {
      this.apiKey = resolveApiKey(settings);
    }

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
        : resolveTranslationModels(opts.config);
    if (this.modelsToTry.length === 0) {
      throw new Error(
        `No translation models configured for provider "${this.provider}" (set providers.${this.provider}.translationModels)`
      );
    }
    this.maxTokens = settings.maxTokens;
    this.temperature = settings.temperature;
    this.requestTimeoutMs = settings.requestTimeoutMs;
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
    this.providerInstance = this.buildProvider(settings);
  }

  private buildProvider(settings: ResolvedProviderSettings): OpenAICompatibleProvider {
    const headers: Record<string, string> = { ...settings.headers };
    if (this.isOpenRouter) {
      headers["HTTP-Referer"] = this.httpReferer;
      headers["X-Title"] = this.xTitle;
    }
    return createOpenAICompatible({
      name: settings.provider,
      baseURL: settings.baseUrl,
      ...(this.apiKey ? { apiKey: this.apiKey } : {}),
      headers,
      ...(this.isOpenRouter
        ? {
            transformRequestBody: (args: Record<string, unknown>) => ({
              ...args,
              provider: OPENROUTER_PROVIDER,
            }),
            metadataExtractor: openRouterMetadataExtractor,
          }
        : {}),
    });
  }

  getConfiguredModels(): readonly string[] {
    return this.modelsToTry;
  }

  /** The active LLM provider key (e.g. `openrouter`, `openai`) chosen from config. */
  getProvider(): string {
    return this.provider;
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

  /**
   * Enforce the target locale's ISO 15924 script subtag on a model response, throwing
   * {@link ScriptValidationError} so the model-fallback loop retries with the next model.
   *
   * For romanized (`*-Latn`) targets any non-Latin letter is rejected (output must be pure Latin).
   * For other supported scripts (`Cyrl`, `Arab`, `Deva`, `Mong`, `Han`, …) only letters from a
   * *different* non-Latin script are rejected — Latin text (code, URLs, brand names, placeholders)
   * is always allowed, so this is free of false positives. See {@link disallowedScriptLetters}.
   * Locales without a script subtag, and composite scripts (e.g. `Jpan`, `Kore`), are not enforced.
   */
  private assertExpectedScript(text: string, targetLocale: string): void {
    const script = scriptSubtag(targetLocale);
    if (!script) {
      return;
    }
    const offending = disallowedScriptLetters(text, script, 5);
    if (offending.length === 0) {
      return;
    }
    const expected =
      script === "Latn"
        ? "romanized Latin (Roman)"
        : `${englishScriptName(script) ?? script} (${script})`;
    throw new ScriptValidationError(
      `Output for ${targetLocale} contains characters outside the expected ${expected} script (${offending.join(" ")})`,
      text,
      offending
    );
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

  private toOpenRouterMessages(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
  ): LlmMessage[] {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  /** Read OpenRouter's exact USD cost from `providerMetadata` (other providers: undefined). */
  private extractCost(providerMetadata: Record<string, Record<string, unknown>> | undefined):
    | number
    | undefined {
    const raw = providerMetadata?.[OPENROUTER_PROVIDER_KEY]?.cost;
    return typeof raw === "number" ? raw : undefined;
  }

  /** Single chat-completions call for one model via the active provider (AI SDK transport). */
  private async fetchCompletion(model: string, messages: LlmMessage[]): Promise<ChatResponse> {
    const systemText = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    if (this.debugTrafficFilePath) {
      this.appendDebugLog("request", {
        provider: this.provider,
        model,
        maxTokens: this.maxTokens,
        temperature: this.temperature,
        system: systemText,
        messages: chatMessages,
      });
    }

    let result: Awaited<ReturnType<typeof generateText>>;
    try {
      result = await generateText({
        model: this.providerInstance(model),
        ...(systemText ? { system: systemText } : {}),
        messages: chatMessages,
        maxOutputTokens: this.maxTokens,
        temperature: this.temperature,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(this.requestTimeoutMs),
      });
    } catch (e) {
      if (this.debugTrafficFilePath) {
        this.appendDebugLog("response", { model, error: e instanceof Error ? e.message : String(e) });
      }
      throw new Error(
        `${this.provider} API error for model ${model}: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    const content = result.text;
    const usage: LlmUsageStats = {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
      totalTokens: result.usage.totalTokens ?? 0,
    };
    const cost = this.extractCost(result.providerMetadata);

    if (this.debugTrafficFilePath) {
      this.appendDebugLog("response", {
        model,
        finishReason: result.finishReason,
        usage,
        cost,
        content,
      });
    }

    if (!content || content.trim() === "") {
      throw new Error(`Empty response content from ${this.provider} model ${model}`);
    }

    return { content, model, usage, cost };
  }

  async chat(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: {
      startModelIndex?: number;
      docLogContext?: { locale: string; relativePath: string };
      /** Throw to reject a completion and fall through to the next model (e.g. wrong-script output). */
      validateResponse?: (content: string) => void;
    }
  ): Promise<ChatResponse> {
    const openRouterMessages = this.toOpenRouterMessages(messages);
    const start = Math.max(0, Math.floor(options?.startModelIndex ?? 0));
    let lastError: unknown;

    for (let mi = start; mi < this.modelsToTry.length; mi++) {
      const model = this.modelsToTry[mi]!;
      try {
        const completion = await this.fetchCompletion(model, openRouterMessages);
        options?.validateResponse?.(completion.content);
        return completion;
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
        targetLocale,
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
        validateResponse: (c) => this.assertExpectedScript(this.stripTranslateTags(c), targetLocale),
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
        targetLocale: locale,
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
        for (const value of translations.values()) {
          this.assertExpectedScript(value, locale);
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
    usage: LlmUsageStats;
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
      targetLocale,
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
        for (const value of translations) {
          this.assertExpectedScript(value, targetLocale);
        }
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

  /**
   * `lint-source`: review a batch of source-locale UI strings; model returns JSON array of `{ issues: [...] }`.
   */
  async lintUISourceBatch(
    texts: string[],
    languageLabel: string,
    options?: { startModelIndex?: number; glossaryHints?: string[] }
  ): Promise<{
    slots: LintSourceSlotResult[];
    model: string;
    usage: LlmUsageStats;
    cost?: number;
    lengthWarning: string | null;
  }> {
    if (texts.length === 0) {
      return {
        slots: [],
        model: this.modelsToTry[0]!,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        lengthWarning: null,
      };
    }

    const { systemPrompt, userContent } = buildLintSourcePromptMessages(texts, {
      languageLabel,
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
        const { slots, lengthWarning } = parseLintSourceBatchResponse(result.content, texts.length);
        return {
          slots,
          model: result.model,
          usage: result.usage,
          cost: result.cost,
          lengthWarning,
        };
      } catch (e) {
        lastError = e;
        this.logger?.warn(`lint-source batch failed with ${model}: ${e}`);
      }
    }

    throw new Error(
      `All translation models failed for lint-source batch (${this.modelsToTry.slice(start).join(", ")}). Last error: ${lastError}`
    );
  }

  /**
   * Cardinal plural groups: model returns one JSON object (`one`, `other`, …) per locale batch.
   */
  async translatePluralCardinalBatch(
    expectedForms: CldrPluralForm[],
    messages: { systemPrompt: string; userContent: string },
    options?: { startModelIndex?: number; targetLocale?: string }
  ): Promise<{
    forms: Record<CldrPluralForm, string>;
    model: string;
    usage: LlmUsageStats;
    cost?: number;
  }> {
    if (expectedForms.length === 0) {
      return {
        forms: {} as Record<CldrPluralForm, string>,
        model: this.modelsToTry[0]!,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      };
    }

    const openRouterMessages = this.toOpenRouterMessages([
      { role: "system", content: messages.systemPrompt },
      { role: "user", content: messages.userContent },
    ]);

    const start = Math.max(0, Math.floor(options?.startModelIndex ?? 0));
    let lastError: unknown;

    for (let mi = start; mi < this.modelsToTry.length; mi++) {
      const model = this.modelsToTry[mi]!;
      try {
        const result = await this.fetchCompletion(model, openRouterMessages);
        const forms = parsePluralFormsJsonResponse(result.content, expectedForms);
        if (options?.targetLocale) {
          for (const value of Object.values(forms)) {
            this.assertExpectedScript(value, options.targetLocale);
          }
        }
        return {
          forms,
          model: result.model,
          usage: result.usage,
          cost: result.cost,
        };
      } catch (e) {
        lastError = e;
        this.logger?.warn(`Plural cardinal batch failed with ${model}: ${e}`);
      }
    }

    throw new Error(
      `All translation models failed for plural cardinal batch (${this.modelsToTry.slice(start).join(", ")}). Last error: ${lastError}`
    );
  }
}

/** @deprecated Use {@link LlmClient}. Retained for backward-compatible imports. */
export const OpenRouterClient = LlmClient;
/** @deprecated Use {@link LlmClient}. */
export type OpenRouterClient = LlmClient;
