import fs from "fs";
import chalk from "chalk";
import { generateText } from "ai";
import {
  createOpenAICompatible,
  type MetadataExtractor,
  type OpenAICompatibleProvider,
} from "@ai-sdk/openai-compatible";
import type { CldrPluralForm, I18nConfig, LlmApiCallEvent } from "../core/types.js";
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
import {
  batchTranslationScriptIssue,
  effectiveScriptSubtag,
  scriptValidationIssue,
} from "../core/locale-utils.js";
import {
  OPENROUTER_PROVIDER_KEY,
  resolveActiveProvider,
  resolveApiKey,
  resolveProviderSettings,
  type ResolvedProviderSettings,
} from "../core/llm-providers.js";
import {
  collectProviderPricing,
  estimateCostUsd,
  type ProviderPricingTable,
} from "../core/usage-stats.js";
import {
  buildDocumentBatchPrompt,
  buildDocumentSinglePrompt,
  buildProofreadUIPromptMessages,
  buildUIPromptMessages,
  parseBatchJsonArrayResponse,
  parseBatchJsonObjectResponse,
  parseBatchTranslationResponse,
  parseProofreadUIBatchResponse,
  parsePluralFormsJsonResponse,
  parseUIJsonArrayResponse,
  ScriptValidationError,
  type DocumentBatchResponseFormat,
  type DocumentPromptContentType,
  type ProofreadUISlotResult,
} from "../core/prompt-builder.js";
import { assertPluralFormsPlaceholders } from "../core/plural-placeholders.js";
import type { Logger } from "../utils/logger.js";
import {
  warnTranslationFailureLogPath,
  writeTranslationFailureLog,
} from "../utils/translation-failure-log.js";

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
 * Running total of tokens/cost spent on billed responses that were ultimately discarded (empty
 * content, parse failure, or wrong-script output) before a model in the fallback chain succeeded.
 * `cost` stays `undefined` until a billed attempt has a provider-reported or configured-pricing cost.
 */
interface DiscardedUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number | undefined;
}

/**
 * Thrown by {@link LlmClient.fetchCompletion} when a provider returns a billed response whose
 * content is empty/unusable, so the model-fallback loop can still account for the spent tokens/cost
 * instead of silently dropping them.
 */
class BilledCompletionError extends Error {
  constructor(
    message: string,
    public readonly usage: LlmUsageStats,
    public readonly cost: number | undefined
  ) {
    super(message);
    this.name = "BilledCompletionError";
  }
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

/** Details attached when every model in a fallback chain fails. */
export interface LlmAllModelsFailedDetails {
  systemPrompt: string;
  userContent: string;
  lastModel: string;
  lastError: unknown;
  /** HTTP response body text when the model returned content but parsing/validation failed. */
  lastRawAssistantContent?: string;
  /** Tokens spent across billed-but-discarded attempts before every model failed. */
  wastedUsage?: LlmUsageStats;
  /** USD cost spent across billed-but-discarded attempts (undefined when no cost was known). */
  wastedCost?: number;
}

/** Thrown when every model in the chain fails for a translation request. */
export class LlmAllModelsFailedError extends Error {
  constructor(
    message: string,
    public readonly details: LlmAllModelsFailedDetails
  ) {
    super(message);
    this.name = "LlmAllModelsFailedError";
  }
}

/** True when a discarded attempt produced model output (parse/script/quality), not a transport error. */
export function llmFailureHasAssistantOutput(details: LlmAllModelsFailedDetails): boolean {
  const raw = details.lastRawAssistantContent;
  return typeof raw === "string" && raw.trim().length > 0;
}

/** Thrown when every model in the chain fails for {@link LlmClient.translateDocumentBatch}. */
export class DocumentBatchAllModelsFailedError extends LlmAllModelsFailedError {
  constructor(message: string, details: LlmAllModelsFailedDetails) {
    super(message, details);
    this.name = "DocumentBatchAllModelsFailedError";
  }
}

export interface LlmClientOptions {
  config: Pick<I18nConfig, "provider" | "providers" | "sourceLocale" | "localeDisplayNames">;
  /** Override the active provider's API key (otherwise read from its configured env var). */
  apiKey?: string;
  /**
   * When set and non-empty, use this ordered model list instead of resolving from the active provider
   * (e.g. locale-aware UI or document translation with `uiModels` / `localeModels` prepended).
   */
  translationModels?: string[];
  /** Append request/response JSON when set. */
  debugTrafficFilePath?: string | null;
  /**
   * When set (CLI `--debug-failed` → `cacheDir`), write a `FAILED-TRANSLATION` file for each
   * discarded translation-check (script/parse/quality), including fallbacks — not only the final
   * all-models-failed throw. Provider API / empty-body failures go to the console instead.
   */
  debugFailedDir?: string | null;
  /**
   * Path label used in `--debug-failed` logs for UI/plural/proofread batches. Document batches
   * prefer `docLogContext.relativePath` when present.
   */
  debugFailedRelativePath?: string;
  logger?: Logger;
  httpReferer?: string;
  xTitle?: string;
  /**
   * Fires once per billed API response (whether the response is later accepted, rejected, or
   * empty) with that call's tokens/cost. Lets callers maintain a live run total that survives
   * interrupts/errors, since the usage is captured the moment the provider responds rather than
   * only when the enclosing batch/file completes. Must be synchronous and must not throw.
   */
  onApiUsage?: (usage: LlmUsageStats, cost: number | undefined) => void;
  /**
   * Fires once per billed API response after the outcome is known (`accepted` vs `discarded`).
   * Unlike {@link onApiUsage}, this is not called for transport failures that never produced a
   * billed body. Must be synchronous and must not throw.
   */
  onApiCall?: (event: LlmApiCallEvent) => void;
  /** Project/feature context from `glossary.contextFiles` injected into translation prompts. */
  translationContext?: string;
}

/** @deprecated Use {@link LlmClientOptions}. */
export type OpenRouterClientOptions = LlmClientOptions;

/**
 * Provider-agnostic chat client (Vercel AI SDK, OpenAI-compatible transport) with an ordered
 * `translationModels` fallback chain. The active provider is chosen from config; OpenRouter-specific
 * routing/headers are applied only when the active provider is `openrouter`. USD cost is the
 * provider-reported `usage.cost` when present; otherwise it is calculated from
 * `providers.<name>.modelPricing` or `pricing` and reported on the same cost field.
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
  private readonly debugFailedDir: string | null;
  private readonly debugFailedRelativePath: string;
  private readonly logger?: Logger;
  private readonly localeDisplayNames: Record<string, string>;
  private readonly sourceLanguageLabel: string;
  private readonly httpReferer: string;
  private readonly xTitle: string;
  private readonly requestTimeoutMs: number;
  private readonly pricing: ProviderPricingTable;
  private readonly onApiUsage?: (usage: LlmUsageStats, cost: number | undefined) => void;
  private readonly onApiCall?: (event: LlmApiCallEvent) => void;
  private readonly translationContext: string;
  /** Dedupes identical API/call-failure console lines per (model, error message). */
  private readonly warnedCallFailures = new Set<string>();

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
    this.debugFailedDir = opts.debugFailedDir ?? null;
    this.debugFailedRelativePath = opts.debugFailedRelativePath?.trim() || "llm-batch";
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
    this.onApiUsage = opts.onApiUsage;
    this.onApiCall = opts.onApiCall;
    this.translationContext = opts.translationContext?.trim() ?? "";
    this.pricing = collectProviderPricing(opts.config.providers);
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
   * Enforce the target locale's expected script on a model response, throwing
   * {@link ScriptValidationError} so the model-fallback loop retries with the next model.
   *
   * Uses a statistical dominant-script check ({@link scriptValidationIssue}): Latin text
   * (code, URLs, brand names, placeholders) and letter-like symbols such as `ℹ` are ignored,
   * a stray foreign-language quote does not fail the output, and `zh-Hans`/`zh-Hant` are told
   * apart via variant-distinct characters. Uses {@link effectiveScriptSubtag} so bare `hi`
   * (Devanagari by default) is enforced like an explicit `*-Deva` tag. Locales with no
   * effective script are not enforced. Composite families (`Jpan`, `Kore`) are enforced as
   * allowed-script sets. Fully Latin leftover that is not a preserved brand/code token is
   * rejected for non-Latin targets.
   */
  private assertExpectedScript(text: string, targetLocale: string, sourceText?: string): void {
    const script = effectiveScriptSubtag(targetLocale);
    if (!script) {
      return;
    }
    const issue = scriptValidationIssue(
      text,
      script,
      sourceText !== undefined ? { sourceText } : undefined
    );
    if (!issue) {
      return;
    }
    const suffix = issue.sample.length > 0 ? ` (${issue.sample.join(" ")})` : "";
    throw new ScriptValidationError(
      `Output for ${targetLocale} ${issue.message}${suffix}`,
      text,
      issue.sample
    );
  }

  private assertBatchExpectedScript(
    outputs: readonly string[],
    sources: readonly string[],
    targetLocale: string
  ): void {
    const issue = batchTranslationScriptIssue(outputs, sources, targetLocale);
    if (!issue) {
      return;
    }
    const suffix = issue.sample.length > 0 ? ` (${issue.sample.join(" ")})` : "";
    throw new ScriptValidationError(
      `Output for ${targetLocale} ${issue.message}${suffix}`,
      outputs.join("\n"),
      issue.sample
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
    nextModel: string | undefined,
    error: unknown
  ): void {
    const loc =
      relativePath != null && relativePath !== "" ? `${localeCode} ${relativePath}` : localeCode;
    const detail = error instanceof Error ? error.message : String(error);
    const trying = nextModel ? `. Trying ${nextModel}…` : "";
    console.warn(chalk.yellow(`  ⚠️  ${loc}: ${failedModel} failed (${detail})${trying}`));
  }

  private static isCallFailure(rawAssistantContent?: string): boolean {
    return rawAssistantContent == null || rawAssistantContent.trim() === "";
  }

  /**
   * Record a discarded model attempt.
   * Call failures (no assistant text): console.warn, no FAILED-TRANSLATION file.
   * Check failures (parse/script/quality): file dump when `debugFailedDir` is set.
   */
  private recordDiscardedAttempt(args: {
    locale: string;
    relativePath: string;
    model: string;
    modelIndex: number;
    error: unknown;
    systemPrompt: string;
    userContent: string;
    rawAssistantContent?: string;
    segmentsLabel?: string;
    /** Docs/chat with `docLogContext`: console.warn check failures when a fallback remains. */
    warnCheckFailure?: boolean;
    loggerCheckMessage?: string;
  }): void {
    const nextModel = this.modelsToTry[args.modelIndex + 1];
    if (LlmClient.isCallFailure(args.rawAssistantContent)) {
      const errMsg = args.error instanceof Error ? args.error.message : String(args.error);
      const key = `${args.model}\0${errMsg}`;
      if (!this.warnedCallFailures.has(key)) {
        this.warnedCallFailures.add(key);
        this.warnModelSwitch(args.locale, args.relativePath, args.model, nextModel, args.error);
      }
      return;
    }

    if (args.warnCheckFailure) {
      if (nextModel) {
        this.warnModelSwitch(args.locale, args.relativePath, args.model, nextModel, args.error);
      }
    } else {
      this.logger?.warn(args.loggerCheckMessage ?? `Model ${args.model} failed: ${args.error}`);
    }

    this.logFailedModelAttempt(args);
  }

  /**
   * Persist prompt + raw output + validation error for a discarded translation-check when
   * `--debug-failed` supplied `debugFailedDir`.
   */
  private logFailedModelAttempt(args: {
    locale: string;
    relativePath: string;
    model: string;
    modelIndex: number;
    error: unknown;
    systemPrompt: string;
    userContent: string;
    rawAssistantContent?: string;
    segmentsLabel?: string;
  }): void {
    if (!this.debugFailedDir) {
      return;
    }
    const nextModel = this.modelsToTry[args.modelIndex + 1];
    const errMsg = args.error instanceof Error ? args.error.message : String(args.error);
    warnTranslationFailureLogPath(
      writeTranslationFailureLog({
        cacheDirAbs: this.debugFailedDir,
        relativePath: args.relativePath,
        locale: args.locale,
        segmentsLabel: args.segmentsLabel ?? "batch",
        outcome: nextModel ? "retrying_next_model" : "fatal",
        failedModel: args.model,
        nextModel,
        qualityErrors: [errMsg],
        perSegmentLines: [],
        systemPrompt: args.systemPrompt,
        userContent: args.userContent,
        rawAssistantContent: args.rawAssistantContent ?? "",
      })
    );
  }

  private static promptPartsFromMessages(messages: Array<{ role: string; content: string }>): {
    systemPrompt: string;
    userContent: string;
  } {
    return {
      systemPrompt: messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n"),
      userContent: messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join("\n\n"),
    };
  }

  private toOpenRouterMessages(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
  ): LlmMessage[] {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  private static emptyDiscarded(): DiscardedUsage {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: undefined };
  }

  /** Add a billed-but-discarded attempt's tokens/cost onto the running discarded total. */
  private static addDiscarded(
    acc: DiscardedUsage,
    usage: LlmUsageStats,
    cost: number | undefined
  ): void {
    acc.inputTokens += usage.inputTokens;
    acc.outputTokens += usage.outputTokens;
    acc.totalTokens += usage.totalTokens;
    if (typeof cost === "number") {
      acc.cost = (acc.cost ?? 0) + cost;
    }
  }

  /** Fold discarded-attempt tokens/cost into the eventually-successful response's totals. */
  private static foldDiscarded(
    usage: LlmUsageStats,
    cost: number | undefined,
    discarded: DiscardedUsage
  ): { usage: LlmUsageStats; cost: number | undefined } {
    const mergedUsage: LlmUsageStats = {
      inputTokens: usage.inputTokens + discarded.inputTokens,
      outputTokens: usage.outputTokens + discarded.outputTokens,
      totalTokens: usage.totalTokens + discarded.totalTokens,
    };
    const mergedCost =
      cost === undefined && discarded.cost === undefined
        ? undefined
        : (cost ?? 0) + (discarded.cost ?? 0);
    return { usage: mergedUsage, cost: mergedCost };
  }

  private emitApiCall(
    model: string,
    usage: LlmUsageStats,
    cost: number | undefined,
    outcome: LlmApiCallEvent["outcome"]
  ): void {
    try {
      this.onApiCall?.({
        provider: this.provider,
        model,
        usage,
        cost,
        outcome,
      });
    } catch {
      // Callers must not throw; swallow so accounting cannot abort translation.
    }
  }

  private accountDiscarded(
    acc: DiscardedUsage,
    model: string,
    usage: LlmUsageStats,
    cost: number | undefined
  ): void {
    LlmClient.addDiscarded(acc, usage, cost);
    this.emitApiCall(model, usage, cost, "discarded");
  }

  private accountAccepted(model: string, usage: LlmUsageStats, cost: number | undefined): void {
    this.emitApiCall(model, usage, cost, "accepted");
  }

  /** Read OpenRouter's exact USD cost from `providerMetadata` (other providers: undefined). */
  private extractCost(
    providerMetadata: Record<string, Record<string, unknown>> | undefined
  ): number | undefined {
    const raw = providerMetadata?.[OPENROUTER_PROVIDER_KEY]?.cost;
    return typeof raw === "number" ? raw : undefined;
  }

  /**
   * Provider-reported USD cost when the response includes it. Otherwise the amount from
   * configured `modelPricing` / `pricing` for this model, or `undefined` when neither applies.
   * A reported cost (including `0`) is never replaced by configured rates.
   */
  private resolveBilledCost(
    model: string,
    usage: LlmUsageStats,
    providerMetadata: Record<string, Record<string, unknown>> | undefined
  ): number | undefined {
    const reported = this.extractCost(providerMetadata);
    if (typeof reported === "number") {
      return reported;
    }
    return estimateCostUsd(
      this.provider,
      model,
      usage.inputTokens,
      usage.outputTokens,
      this.pricing
    );
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
        this.appendDebugLog("response", {
          model,
          error: e instanceof Error ? e.message : String(e),
        });
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
    const cost = this.resolveBilledCost(model, usage, result.providerMetadata);

    // Report every billed response immediately so a live run total survives interrupts/errors,
    // even for responses that are later rejected (empty content, parse/script failure) below.
    this.onApiUsage?.(usage, cost);

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
      throw new BilledCompletionError(
        `Empty response content from ${this.provider} model ${model}`,
        usage,
        cost
      );
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
    const discarded = LlmClient.emptyDiscarded();
    const promptParts = LlmClient.promptPartsFromMessages(messages);
    const failedPath = options?.docLogContext?.relativePath ?? this.debugFailedRelativePath;
    const failedLocale = options?.docLogContext?.locale ?? "unknown";

    for (let mi = start; mi < this.modelsToTry.length; mi++) {
      const model = this.modelsToTry[mi]!;
      const recordFailure = (e: unknown, rawAssistantContent?: string): void => {
        this.recordDiscardedAttempt({
          locale: failedLocale,
          relativePath: failedPath,
          model,
          modelIndex: mi,
          error: e,
          systemPrompt: promptParts.systemPrompt,
          userContent: promptParts.userContent,
          rawAssistantContent,
          warnCheckFailure: Boolean(options?.docLogContext),
        });
      };

      let completion: ChatResponse;
      try {
        completion = await this.fetchCompletion(model, openRouterMessages);
      } catch (e) {
        lastError = e;
        if (e instanceof BilledCompletionError) {
          this.accountDiscarded(discarded, model, e.usage, e.cost);
        }
        recordFailure(e);
        continue;
      }

      try {
        options?.validateResponse?.(completion.content);
      } catch (e) {
        lastError = e;
        this.accountDiscarded(discarded, model, completion.usage, completion.cost);
        recordFailure(e, completion.content);
        continue;
      }

      this.accountAccepted(completion.model, completion.usage, completion.cost);
      const folded = LlmClient.foldDiscarded(completion.usage, completion.cost, discarded);
      return { ...completion, usage: folded.usage, cost: folded.cost };
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
        translationContext: this.translationContext || undefined,
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
        validateResponse: (c) =>
          this.assertExpectedScript(this.stripTranslateTags(c), targetLocale, content),
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
        translationContext: this.translationContext || undefined,
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
    const discarded = LlmClient.emptyDiscarded();
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
        if (e instanceof BilledCompletionError) {
          this.accountDiscarded(discarded, model, e.usage, e.cost);
        }
        lastFailureDetails = {
          systemPrompt,
          userContent,
          lastModel: model,
          lastError: e,
          lastRawAssistantContent: undefined,
        };
        this.recordDiscardedAttempt({
          locale,
          relativePath: options?.docLogContext?.relativePath ?? this.debugFailedRelativePath,
          model,
          modelIndex: mi,
          error: e,
          systemPrompt,
          userContent,
          warnCheckFailure: Boolean(options?.docLogContext),
          loggerCheckMessage:
            e instanceof BatchTranslationError
              ? `Batch parse failed with ${model}: ${e.message}`
              : `Batch request failed with ${model}: ${e}`,
        });
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
        for (const [index, value] of translations.entries()) {
          this.assertExpectedScript(value, locale, segments[index]?.content);
        }
        const batchOutputs: string[] = [];
        const batchSources: string[] = [];
        for (let i = 0; i < segments.length; i++) {
          const value = translations.get(i);
          if (value === undefined) {
            continue;
          }
          batchOutputs.push(value);
          batchSources.push(segments[i]?.content ?? "");
        }
        this.assertBatchExpectedScript(batchOutputs, batchSources, locale);
        this.accountAccepted(completion.model, completion.usage, completion.cost);
        const folded = LlmClient.foldDiscarded(completion.usage, completion.cost, discarded);
        return {
          translations,
          model: completion.model,
          usage: folded.usage,
          cost: folded.cost,
          debugPrompt: { systemPrompt, userContent },
          rawAssistantContent: completion.content,
        };
      } catch (e) {
        lastError = e;
        this.accountDiscarded(discarded, model, completion.usage, completion.cost);
        lastFailureDetails = {
          systemPrompt,
          userContent,
          lastModel: model,
          lastError: e,
          lastRawAssistantContent: completion.content,
        };
        this.recordDiscardedAttempt({
          locale,
          relativePath: options?.docLogContext?.relativePath ?? this.debugFailedRelativePath,
          model,
          modelIndex: mi,
          error: e,
          systemPrompt,
          userContent,
          rawAssistantContent: completion.content,
          warnCheckFailure: Boolean(options?.docLogContext),
          loggerCheckMessage:
            e instanceof BatchTranslationError
              ? `Batch parse failed with ${model}: ${e.message}`
              : `Batch parse failed with ${model}: ${e}`,
        });
      }
    }

    const msg = `All translation models failed for batch (${this.modelsToTry.slice(start).join(", ")}). Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`;
    const baseDetails =
      lastFailureDetails ??
      ({
        systemPrompt,
        userContent,
        lastModel: this.modelsToTry[Math.max(0, this.modelsToTry.length - 1)]!,
        lastError,
        lastRawAssistantContent: undefined,
      } as const);
    throw new DocumentBatchAllModelsFailedError(msg, {
      ...baseDetails,
      wastedUsage: {
        inputTokens: discarded.inputTokens,
        outputTokens: discarded.outputTokens,
        totalTokens: discarded.totalTokens,
      },
      ...(discarded.cost !== undefined ? { wastedCost: discarded.cost } : {}),
    });
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
      translationContext: this.translationContext || undefined,
    });

    const openRouterMessages = this.toOpenRouterMessages([
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ]);

    const start = Math.max(0, Math.floor(options?.startModelIndex ?? 0));
    let lastError: unknown;
    const discarded = LlmClient.emptyDiscarded();
    let lastFailureDetails: LlmAllModelsFailedDetails | undefined;

    for (let mi = start; mi < this.modelsToTry.length; mi++) {
      const model = this.modelsToTry[mi]!;
      let result: ChatResponse;
      try {
        result = await this.fetchCompletion(model, openRouterMessages);
      } catch (e) {
        lastError = e;
        if (e instanceof BilledCompletionError) {
          this.accountDiscarded(discarded, model, e.usage, e.cost);
        }
        lastFailureDetails = {
          systemPrompt,
          userContent,
          lastModel: model,
          lastError: e,
        };
        this.recordDiscardedAttempt({
          locale: targetLocale,
          relativePath: this.debugFailedRelativePath,
          model,
          modelIndex: mi,
          error: e,
          systemPrompt,
          userContent,
          segmentsLabel: "ui-batch",
          loggerCheckMessage: `UI batch failed with ${model}: ${e}`,
        });
        continue;
      }
      try {
        const translations = parseUIJsonArrayResponse(result.content, texts.length);
        for (let i = 0; i < translations.length; i++) {
          this.assertExpectedScript(translations[i]!, targetLocale, texts[i]);
        }
        this.assertBatchExpectedScript(translations, texts, targetLocale);
        this.accountAccepted(result.model, result.usage, result.cost);
        const folded = LlmClient.foldDiscarded(result.usage, result.cost, discarded);
        return {
          translations,
          model: result.model,
          usage: folded.usage,
          cost: folded.cost,
        };
      } catch (e) {
        lastError = e;
        this.accountDiscarded(discarded, model, result.usage, result.cost);
        lastFailureDetails = {
          systemPrompt,
          userContent,
          lastModel: model,
          lastError: e,
          lastRawAssistantContent: result.content,
        };
        this.recordDiscardedAttempt({
          locale: targetLocale,
          relativePath: this.debugFailedRelativePath,
          model,
          modelIndex: mi,
          error: e,
          systemPrompt,
          userContent,
          rawAssistantContent: result.content,
          segmentsLabel: "ui-batch",
          loggerCheckMessage: `UI batch failed with ${model}: ${e}`,
        });
      }
    }

    throw new LlmAllModelsFailedError(
      `All translation models failed for UI batch (${this.modelsToTry.slice(start).join(", ")}). Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
      lastFailureDetails ?? {
        systemPrompt,
        userContent,
        lastModel: this.modelsToTry[Math.max(0, this.modelsToTry.length - 1)]!,
        lastError,
      }
    );
  }

  /**
   * `proofread-ui`: review a batch of source-locale UI strings; model returns JSON array of `{ issues: [...] }`.
   */
  async proofreadUISourceBatch(
    texts: string[],
    languageLabel: string,
    options?: { startModelIndex?: number; glossaryHints?: string[] }
  ): Promise<{
    slots: ProofreadUISlotResult[];
    /** Parallel to `texts`: false when that string's slot was missing or could not be aligned. */
    reviewed: boolean[];
    model: string;
    usage: LlmUsageStats;
    cost?: number;
    lengthWarning: string | null;
  }> {
    if (texts.length === 0) {
      return {
        slots: [],
        reviewed: [],
        model: this.modelsToTry[0]!,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        lengthWarning: null,
      };
    }

    const { systemPrompt, userContent } = buildProofreadUIPromptMessages(texts, {
      languageLabel,
      glossaryHints: options?.glossaryHints,
      translationContext: this.translationContext || undefined,
    });

    const openRouterMessages = this.toOpenRouterMessages([
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ]);

    const start = Math.max(0, Math.floor(options?.startModelIndex ?? 0));
    let lastError: unknown;
    const discarded = LlmClient.emptyDiscarded();

    for (let mi = start; mi < this.modelsToTry.length; mi++) {
      const model = this.modelsToTry[mi]!;
      let result: ChatResponse;
      try {
        result = await this.fetchCompletion(model, openRouterMessages);
      } catch (e) {
        lastError = e;
        if (e instanceof BilledCompletionError) {
          this.accountDiscarded(discarded, model, e.usage, e.cost);
        }
        this.recordDiscardedAttempt({
          locale: languageLabel,
          relativePath: this.debugFailedRelativePath,
          model,
          modelIndex: mi,
          error: e,
          systemPrompt,
          userContent,
          segmentsLabel: "proofread-ui",
          loggerCheckMessage: `proofread-ui batch failed with ${model}: ${e}`,
        });
        continue;
      }
      try {
        const { slots, lengthWarning, reviewed } = parseProofreadUIBatchResponse(
          result.content,
          texts.length
        );
        this.accountAccepted(result.model, result.usage, result.cost);
        const folded = LlmClient.foldDiscarded(result.usage, result.cost, discarded);
        return {
          slots,
          reviewed,
          model: result.model,
          usage: folded.usage,
          cost: folded.cost,
          lengthWarning,
        };
      } catch (e) {
        lastError = e;
        this.accountDiscarded(discarded, model, result.usage, result.cost);
        this.recordDiscardedAttempt({
          locale: languageLabel,
          relativePath: this.debugFailedRelativePath,
          model,
          modelIndex: mi,
          error: e,
          systemPrompt,
          userContent,
          rawAssistantContent: result.content,
          segmentsLabel: "proofread-ui",
          loggerCheckMessage: `proofread-ui batch failed with ${model}: ${e}`,
        });
      }
    }

    throw new Error(
      `All translation models failed for proofread-ui batch (${this.modelsToTry.slice(start).join(", ")}). Last error: ${lastError}`
    );
  }

  /**
   * Cardinal plural groups: model returns one JSON object (`one`, `other`, …) per locale batch.
   */
  async translatePluralCardinalBatch(
    expectedForms: CldrPluralForm[],
    messages: { systemPrompt: string; userContent: string },
    options?: {
      startModelIndex?: number;
      targetLocale?: string;
      /** Original developer literal; when set, placeholder/qty validation runs after parse. */
      originalLiteral?: string;
      zeroDigit?: boolean;
    }
  ): Promise<{
    forms: Record<CldrPluralForm, string>;
    model: string;
    usage: LlmUsageStats;
    cost?: number;
    /** Raw assistant text before plural-forms parse (for live/debug dumps). */
    rawAssistantContent?: string;
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
    const discarded = LlmClient.emptyDiscarded();
    let lastFailureDetails: LlmAllModelsFailedDetails | undefined;

    for (let mi = start; mi < this.modelsToTry.length; mi++) {
      const model = this.modelsToTry[mi]!;
      let result: ChatResponse;
      try {
        result = await this.fetchCompletion(model, openRouterMessages);
      } catch (e) {
        lastError = e;
        if (e instanceof BilledCompletionError) {
          this.accountDiscarded(discarded, model, e.usage, e.cost);
        }
        lastFailureDetails = {
          systemPrompt: messages.systemPrompt,
          userContent: messages.userContent,
          lastModel: model,
          lastError: e,
        };
        this.recordDiscardedAttempt({
          locale: options?.targetLocale ?? "unknown",
          relativePath: this.debugFailedRelativePath,
          model,
          modelIndex: mi,
          error: e,
          systemPrompt: messages.systemPrompt,
          userContent: messages.userContent,
          segmentsLabel: "plural-batch",
          loggerCheckMessage: `Plural cardinal batch failed with ${model}: ${e}`,
        });
        continue;
      }
      try {
        const forms = parsePluralFormsJsonResponse(result.content, expectedForms);
        if (options?.originalLiteral !== undefined) {
          assertPluralFormsPlaceholders(options.originalLiteral, forms, {
            zeroDigit: options.zeroDigit === true,
            rawResponse: result.content,
          });
        }
        if (options?.targetLocale) {
          for (const value of Object.values(forms)) {
            this.assertExpectedScript(value, options.targetLocale, options.originalLiteral);
          }
        }
        this.accountAccepted(result.model, result.usage, result.cost);
        const folded = LlmClient.foldDiscarded(result.usage, result.cost, discarded);
        return {
          forms,
          model: result.model,
          usage: folded.usage,
          cost: folded.cost,
          rawAssistantContent: result.content,
        };
      } catch (e) {
        lastError = e;
        this.accountDiscarded(discarded, model, result.usage, result.cost);
        lastFailureDetails = {
          systemPrompt: messages.systemPrompt,
          userContent: messages.userContent,
          lastModel: model,
          lastError: e,
          lastRawAssistantContent: result.content,
        };
        this.recordDiscardedAttempt({
          locale: options?.targetLocale ?? "unknown",
          relativePath: this.debugFailedRelativePath,
          model,
          modelIndex: mi,
          error: e,
          systemPrompt: messages.systemPrompt,
          userContent: messages.userContent,
          rawAssistantContent: result.content,
          segmentsLabel: "plural-batch",
          loggerCheckMessage: `Plural cardinal batch failed with ${model}: ${e}`,
        });
      }
    }

    throw new LlmAllModelsFailedError(
      `All translation models failed for plural cardinal batch (${this.modelsToTry.slice(start).join(", ")}). Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
      lastFailureDetails ?? {
        systemPrompt: messages.systemPrompt,
        userContent: messages.userContent,
        lastModel: this.modelsToTry[Math.max(0, this.modelsToTry.length - 1)]!,
        lastError,
      }
    );
  }
}

/** @deprecated Use {@link LlmClient}. Retained for backward-compatible imports. */
export const OpenRouterClient = LlmClient;
/** @deprecated Use {@link LlmClient}. */
export type OpenRouterClient = LlmClient;
