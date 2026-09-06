import chalk from "chalk";
import type { DocumentPromptContentType } from "../core/prompt-builder.js";
import type { Segment, SegmentType, TranslationFailureInsert } from "../core/types.js";
import { splitSegmentForQualityRetry } from "../extractors/markdown-quality-split.js";
import { PlaceholderHandler } from "../processors/placeholder-handler.js";
import { restoreGlossaryForcedTerms } from "../processors/glossary-force-placeholders.js";
import { errorsIncludeAstMismatch, validateDocTranslatePair } from "../processors/validator.js";
import { collectPreRestorePlaceholderErrors } from "../processors/placeholder-integrity.js";
import type { Glossary } from "../glossary/glossary.js";
import type { LlmClient } from "../api/llm-client.js";
import { throwIfAbortSignal } from "../utils/run-interrupt.js";
import { t } from "../i18n/index.js";

type ProtectState = {
  glossaryForceReplacements?: string[];
} & ReturnType<PlaceholderHandler["protectForTranslation"]>;

function restoreSegmentTranslation(
  ph: PlaceholderHandler,
  raw: string,
  st: ProtectState | undefined
): string {
  if (!st) {
    return raw;
  }
  let out = ph.restoreAfterTranslation(raw, st);
  out = restoreGlossaryForcedTerms(out, st.glossaryForceReplacements ?? []);
  return out;
}

export type DocQualityLogOutcome = "retrying_next_model" | "fatal" | "individual_success";

export type DocQualityLogWriter = (opts: {
  segmentsLabel: string;
  outcome: DocQualityLogOutcome;
  failedModel: string;
  nextModel?: string;
  qualityErrors: string[];
  perSegmentLines: string[];
  systemPrompt: string;
  userContent: string;
  rawAssistantContent: string;
  mode: "failed" | "debug";
}) => string | undefined;

export type ProtectSegmentFn = (raw: string) => { text: string; state: ProtectState };

export type TranslateOneSegmentQualityRetryParams = {
  client: LlmClient;
  locale: string;
  glossary: Glossary;
  contentType: DocumentPromptContentType;
  models: readonly string[];
  /** Original segment (pre-placeholder source text in `content`). */
  original: Segment;
  /** Protected text sent to the API for the top-level segment (unused when splitDepth > 0). */
  protectedContent: string;
  /** Placeholder state for the top-level segment (unused when splitDepth > 0). */
  protectState: ProtectState | undefined;
  /** Model index to start trying from (0-based). */
  startModelIndex: number;
  splitDepth: number;
  qualityRetrySplit: boolean;
  maxQualityRetrySplitDepth: number;
  protectForTranslation: ProtectSegmentFn;
  segmentHash: string;
  failureFp: string | null;
  recordFailures: (rows: TranslationFailureInsert[]) => Promise<void>;
  buildQualityFailureRows: (
    model: string,
    modelOrder: number | null,
    errors: readonly string[],
    fatal: boolean
  ) => TranslationFailureInsert[];
  buildRuntimeFailureRow: (
    model: string | null,
    modelOrder: number | null,
    message: string,
    fatal: boolean
  ) => TranslationFailureInsert;
  modelOrder1Based: (model: string | null) => number | null;
  segLabelSingle: string;
  batchSegIndex?: number;
  docIdx0?: number;
  docLog?: { relativePath: string; totalSegments: number };
  failureLogDirAbs?: string | null;
  writeFailureLog?: DocQualityLogWriter;
  writeDebugLog?: DocQualityLogWriter;
  warnModelSwitch?: (
    failedModel: string,
    nextModel: string,
    detail: string,
    nextModelOrdinal: { index1Based: number; total: number }
  ) => void;
  abortSignal?: AbortSignal;
};

export type TranslateOneSegmentQualityRetryResult = {
  text: string;
  modelUsed: string;
  inTok: number;
  outTok: number;
  cost: number;
  validationFailures: number;
  individualCalls: number;
  qualitySplitRetries: number;
};

type ModelRetryFailure = {
  ok: false;
  remainingErrors: string[];
  inTok: number;
  outTok: number;
  cost: number;
  validationFailures: number;
  individualCalls: number;
};

type ModelRetrySuccess = TranslateOneSegmentQualityRetryResult & { ok: true };

function isModelRetryFailure(
  result: ModelRetrySuccess | ModelRetryFailure
): result is ModelRetryFailure {
  return result.ok === false;
}

function perSegLine(
  params: TranslateOneSegmentQualityRetryParams,
  ok: boolean,
  errors: string[],
  partLabel?: string
): string {
  const hashLabel = partLabel ? `${params.segmentHash} part ${partLabel}` : params.segmentHash;
  if (params.docLog && params.docIdx0 !== undefined && params.batchSegIndex !== undefined) {
    return `doc #${params.docIdx0 + 1}/${params.docLog.totalSegments} seg id=${params.batchSegIndex} (hash ${hashLabel}): ${ok ? "OK" : errors.join("; ")}`;
  }
  if (params.batchSegIndex !== undefined) {
    return `batch seg id=${params.batchSegIndex} (hash ${hashLabel}): ${ok ? "OK" : errors.join("; ")}`;
  }
  return `(hash ${hashLabel}): ${ok ? "OK" : errors.join("; ")}`;
}

async function translateProtectedContent(
  params: TranslateOneSegmentQualityRetryParams,
  originalContent: string,
  protectedContent: string,
  protectState: ProtectState | undefined,
  startModelIndex: number,
  partLabel?: string
): Promise<ModelRetrySuccess | ModelRetryFailure> {
  const {
    client,
    locale,
    glossary,
    contentType,
    models,
    original,
    segmentHash,
    recordFailures,
    buildQualityFailureRows,
    buildRuntimeFailureRow,
    modelOrder1Based,
    segLabelSingle,
    failureLogDirAbs,
    docLog,
    writeFailureLog,
    writeDebugLog,
    warnModelSwitch,
  } = params;

  const hints = glossary.findTermsInText(protectedContent, locale, { skipUiAbbreviations: true });
  const ph = new PlaceholderHandler();
  let startIdx = startModelIndex;
  let remainingErrors: string[] = [];
  let inTok = 0;
  let outTok = 0;
  let cost = 0;
  let validationFailures = 0;
  let individualCalls = 0;

  while (startIdx < models.length) {
    throwIfAbortSignal(params.abortSignal);
    individualCalls++;
    const startModel = models[startIdx] ?? null;
    let single;
    try {
      single = await client.translateDocumentSegment(protectedContent, locale, hints, {
        contentType,
        startModelIndex: startIdx,
        docLogContext: docLog?.relativePath
          ? { locale, relativePath: docLog.relativePath }
          : undefined,
      });
    } catch (err) {
      await recordFailures([
        buildRuntimeFailureRow(startModel, modelOrder1Based(startModel), String(err), true),
      ]);
      throw err;
    }
    throwIfAbortSignal(params.abortSignal);
    inTok += single.usage.inputTokens;
    outTok += single.usage.outputTokens;
    cost += single.cost ?? 0;

    const restored = restoreSegmentTranslation(ph, single.content, protectState);
    const origSeg: Segment = { ...original, content: originalContent };
    const preRestoreErrors = collectPreRestorePlaceholderErrors(
      protectState,
      single.content,
      segmentHash
    );
    const v = await validateDocTranslatePair(origSeg, restored);
    const allErrors = [...preRestoreErrors, ...v.errors];
    const ok = preRestoreErrors.length === 0 && v.ok;
    const nextIdx = models.indexOf(single.model) + 1;
    const line = perSegLine(params, ok, allErrors, partLabel);

    if (failureLogDirAbs && docLog && writeDebugLog) {
      const debugLogPath = writeDebugLog({
        segmentsLabel: segLabelSingle || "(segment range unknown)",
        outcome: ok
          ? "individual_success"
          : nextIdx >= models.length
            ? "fatal"
            : "retrying_next_model",
        failedModel: single.model,
        nextModel: nextIdx < models.length ? models[nextIdx]! : undefined,
        qualityErrors: allErrors,
        perSegmentLines: [line],
        systemPrompt: single.debugPrompt?.systemPrompt ?? "",
        userContent: single.debugPrompt?.userContent ?? "",
        rawAssistantContent:
          single.rawAssistantContent ?? "(missing raw response; rebuild ai-i18n-tools)",
        mode: "debug",
      });
      if (debugLogPath) {
        console.warn(chalk.gray(t("  🧪 Debug log: {{path}}", { path: debugLogPath })));
      }
    }

    if (ok) {
      return {
        ok: true as const,
        text: restored,
        modelUsed: single.model,
        inTok,
        outTok,
        cost,
        validationFailures,
        individualCalls,
        qualitySplitRetries: 0,
      };
    }

    validationFailures++;
    remainingErrors = allErrors;
    await recordFailures(
      buildQualityFailureRows(
        single.model,
        modelOrder1Based(single.model),
        allErrors,
        nextIdx >= models.length
      )
    );

    if (failureLogDirAbs && docLog && writeFailureLog) {
      const failureLogPath = writeFailureLog({
        segmentsLabel: segLabelSingle || "(segment range unknown)",
        outcome: nextIdx >= models.length ? "fatal" : "retrying_next_model",
        failedModel: single.model,
        nextModel: nextIdx < models.length ? models[nextIdx]! : undefined,
        qualityErrors: allErrors,
        perSegmentLines: [line],
        systemPrompt: single.debugPrompt?.systemPrompt ?? "",
        userContent: single.debugPrompt?.userContent ?? "",
        rawAssistantContent:
          single.rawAssistantContent ?? "(missing raw response; rebuild ai-i18n-tools)",
        mode: "failed",
      });
      if (failureLogPath) {
        console.warn(chalk.gray(t("  📝 Failure log: {{path}}", { path: failureLogPath })));
      }
    }

    if (nextIdx >= models.length) {
      break;
    }

    warnModelSwitch?.(single.model, models[nextIdx]!, allErrors.join("; "), {
      index1Based: nextIdx + 1,
      total: models.length,
    });
    startIdx = nextIdx;
  }

  return {
    ok: false as const,
    remainingErrors,
    inTok,
    outTok,
    cost,
    validationFailures,
    individualCalls,
  };
}

function throwQualityFatal(params: TranslateOneSegmentQualityRetryParams, errors: string[]): never {
  const loc = params.docLog?.relativePath ?? "?";
  throw new Error(
    t("Doc translation quality failed ({{locale}}, {{loc}}): {{detail}}", {
      locale: params.locale,
      loc,
      detail: `${params.segLabelSingle ? `${params.segLabelSingle}: ` : ""}${errors.join("; ")}`,
    })
  );
}

/**
 * Translate one markdown segment with model cycling and progressive split-on-AST-failure fallback.
 */
export async function translateOneSegmentWithQualityRetry(
  params: TranslateOneSegmentQualityRetryParams
): Promise<TranslateOneSegmentQualityRetryResult> {
  const {
    original,
    protectedContent,
    protectState,
    startModelIndex,
    splitDepth,
    qualityRetrySplit,
    maxQualityRetrySplitDepth,
    protectForTranslation,
    docLog,
    segLabelSingle,
    locale,
  } = params;

  const direct = await translateProtectedContent(
    params,
    original.content,
    protectedContent,
    protectState,
    startModelIndex
  );

  if (!isModelRetryFailure(direct)) {
    const { ok: _ok, ...result } = direct;
    return result;
  }

  const { remainingErrors } = direct;
  const splittable =
    qualityRetrySplit &&
    errorsIncludeAstMismatch(remainingErrors) &&
    splitSegmentForQualityRetry(
      original.content,
      original.type as SegmentType,
      splitDepth,
      maxQualityRetrySplitDepth
    ) !== null;

  if (!splittable) {
    throwQualityFatal(params, remainingErrors);
  }

  const parts = splitSegmentForQualityRetry(
    original.content,
    original.type as SegmentType,
    splitDepth,
    maxQualityRetrySplitDepth
  );
  if (!parts || parts.length <= 1) {
    throwQualityFatal(params, remainingErrors);
  }

  const baseLoc = docLog?.relativePath ? `${locale} ${docLog.relativePath}` : locale;
  console.warn(
    chalk.magenta(
      t(
        "  ✂️  {{loc}}: splitting segment into {{parts}} part(s) after model exhaustion (depth {{depth}}/{{maxDepth}}) — {{label}}",
        {
          loc: baseLoc,
          parts: parts.length,
          depth: splitDepth + 1,
          maxDepth: maxQualityRetrySplitDepth,
          label: segLabelSingle || `hash ${params.segmentHash}`,
        }
      )
    )
  );

  const translatedParts: string[] = [];
  const modelsUsed = new Set<string>();
  let inTok = direct.inTok;
  let outTok = direct.outTok;
  let cost = direct.cost;
  let validationFailures = direct.validationFailures;
  let individualCalls = direct.individualCalls;
  let qualitySplitRetries = 1;

  for (let pi = 0; pi < parts.length; pi++) {
    throwIfAbortSignal(params.abortSignal);
    const partContent = parts[pi]!;
    const { text: partProtected, state: partState } = protectForTranslation(partContent);
    const partOriginal: Segment = {
      ...original,
      content: partContent,
    };
    const partResult = await translateOneSegmentWithQualityRetry({
      ...params,
      original: partOriginal,
      protectedContent: partProtected,
      protectState: partState,
      startModelIndex: 0,
      splitDepth: splitDepth + 1,
    });
    inTok += partResult.inTok;
    outTok += partResult.outTok;
    cost += partResult.cost;
    validationFailures += partResult.validationFailures;
    individualCalls += partResult.individualCalls;
    qualitySplitRetries += partResult.qualitySplitRetries;
    for (const m of partResult.modelUsed.split(",")) {
      const t = m.trim();
      if (t) {
        modelsUsed.add(t);
      }
    }
    translatedParts.push(partResult.text);
  }

  const joined = translatedParts.join("\n");
  const joinedValidation = await validateDocTranslatePair(original, joined);
  if (!joinedValidation.ok) {
    throwQualityFatal(params, [`joined sub-parts: ${joinedValidation.errors.join("; ")}`]);
  }

  const modelUsed = [...modelsUsed].sort((a, b) => a.localeCompare(b)).join(",");
  return {
    text: joined,
    modelUsed,
    inTok,
    outTok,
    cost,
    validationFailures,
    individualCalls,
    qualitySplitRetries,
  };
}
