/**
 * LLM-assisted review of source-locale UI strings (spelling, grammar, terminology).
 * @see docs/GETTING_STARTED.md — `proofread-ui`
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig, StringsJsonEntry } from "../core/types.js";
import { LlmClient } from "../api/llm-client.js";
import { englishLanguageNameForLocale, normalizeLocale } from "../core/config.js";
import { createFilteredLlmClient } from "./llm-client-factory.js";
import { MODELS_ALL_UNKNOWN_AFTER_FILTER } from "./openrouter-catalog-model-filter.js";
import { TranslationCache } from "../core/cache.js";
import { createUsageRecorder } from "../core/usage-recorder.js";
import type { ProofreadUIIssue } from "../core/prompt-builder.js";
import { collectPlaceholderFamilies, extractUiPlaceholderTokens } from "../core/ui-placeholders.js";
import { resolveStringsJsonPath } from "./helpers.js";
import { runExtract } from "./extract-strings.js";
import { Glossary } from "../glossary/glossary.js";
import {
  loadTranslationContextFromConfig,
  translationContextClientOpts,
} from "../glossary/translation-context.js";
import { runMapWithConcurrency } from "../utils/concurrency.js";
import { t } from "../i18n/index.js";

const DEFAULT_CHUNK = 50;

export interface ProofreadUIUnit {
  segmentId: string;
  readonly field: "source";
  text: string;
  locations: Array<{ file: string; line: number }>;
}

/** Re-export for callers that imported from this CLI module. */
export { extractUiPlaceholderTokens };

/** Returns true if `suggested` has the same placeholder families, with the same counts, as `original`. */
export function proofreadSuggestionPreservesPlaceholders(
  original: string,
  suggested: string
): boolean {
  const orig = collectPlaceholderFamilies(original);
  const next = collectPlaceholderFamilies(suggested);
  if (orig.size !== next.size) {
    return false;
  }
  for (const [family, count] of orig) {
    if (next.get(family) !== count) {
      return false;
    }
  }
  return true;
}

/**
 * Minimum bigram Dice score for a suggestion to count as a rewrite of the same string.
 * Below this, the issue was attached to the wrong string (a short model array shifted slots).
 */
const SUGGESTION_REWRITE_MIN_DICE = 0.6;

function suggestionBigramDice(original: string, suggested: string): number {
  const grams = (value: string): Map<string, number> => {
    const counts = new Map<string, number>();
    const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();
    for (let i = 0; i < normalized.length - 1; i++) {
      const bg = normalized.slice(i, i + 2);
      counts.set(bg, (counts.get(bg) ?? 0) + 1);
    }
    return counts;
  };
  const left = grams(original);
  const right = grams(suggested);
  const size = (counts: Map<string, number>): number => {
    let total = 0;
    for (const n of counts.values()) {
      total += n;
    }
    return total;
  };
  const leftSize = size(left);
  const rightSize = size(right);
  if (leftSize === 0 || rightSize === 0) {
    return original.trim().toLowerCase() === suggested.trim().toLowerCase() ? 1 : 0;
  }
  let overlap = 0;
  for (const [bg, n] of left) {
    overlap += Math.min(n, right.get(bg) ?? 0);
  }
  return (2 * overlap) / (leftSize + rightSize);
}

/** True when `suggested` is a correction of `original`, not a different string's text. */
export function suggestionRewritesSource(original: string, suggested: string): boolean {
  return suggestionBigramDice(original, suggested) >= SUGGESTION_REWRITE_MIN_DICE;
}

const NOT_REVIEWED_UNALIGNED = "model response could not be aligned to this string";
const NOT_REVIEWED_BATCH_FAILED = "batch failed";

function countReviewedSlots(reviewed: boolean[]): number {
  let n = 0;
  for (const ok of reviewed) {
    if (ok) {
      n++;
    }
  }
  return n;
}

function cleanProofreadIssues(unitText: string, rawIssues: ProofreadUIIssue[]): ProofreadUIIssue[] {
  const cleaned: ProofreadUIIssue[] = [];
  for (const iss of rawIssues) {
    const st = iss.suggestedText;
    if (st === undefined || st === unitText) {
      continue;
    }
    if (!suggestionRewritesSource(unitText, st)) {
      continue;
    }
    if (!proofreadSuggestionPreservesPlaceholders(unitText, st)) {
      cleaned.push({
        severity: iss.severity,
        message: `${iss.message} (Suggested rewrite omitted: would break placeholders.)`,
        suggestionDroppedPlaceholderMismatch: true,
      });
      continue;
    }
    cleaned.push({
      severity: iss.severity,
      message: iss.message,
      suggestedText: st,
    });
  }
  return cleaned;
}

function normalizeLocations(entry: StringsJsonEntry): Array<{ file: string; line: number }> {
  const raw = entry.locations;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: Array<{ file: string; line: number }> = [];
  for (const loc of raw) {
    if (!loc || typeof loc !== "object") {
      continue;
    }
    const r = loc as Record<string, unknown>;
    const file =
      typeof r.file === "string" ? r.file : typeof r.filepath === "string" ? r.filepath : "";
    const lineRaw = r.line;
    const line =
      typeof lineRaw === "number" && Number.isFinite(lineRaw) && lineRaw >= 1
        ? Math.floor(lineRaw)
        : 1;
    if (file.trim() !== "") {
      out.push({ file, line });
    }
  }
  return out;
}

/**
 * Collect one proofread row per catalog entry: `source` only (plain and plural rows).
 */
export function collectProofreadUIUnits(
  strings: Record<string, StringsJsonEntry>
): ProofreadUIUnit[] {
  const out: ProofreadUIUnit[] = [];
  for (const [segmentId, entry] of Object.entries(strings)) {
    const src = typeof entry.source === "string" ? entry.source : "";
    if (!src.trim()) {
      continue;
    }
    out.push({
      segmentId,
      field: "source",
      text: src,
      locations: normalizeLocations(entry),
    });
  }
  return out;
}

function localeLabelForPrompt(config: I18nConfig, localeCode: string): string {
  const n = normalizeLocale(localeCode);
  const configured = config.localeDisplayNames?.[n];
  const display =
    configured && configured.trim().length > 0
      ? configured.trim()
      : englishLanguageNameForLocale(n);
  if (display && display.length > 0) {
    return `${n}: ${display}`;
  }
  return localeCode;
}

export interface ProofreadUIReportUnit {
  segmentId: string;
  field: "source";
  originalText: string;
  locations: Array<{ file: string; line: number }>;
  issues: Array<{
    severity: "error" | "warning";
    message: string;
    suggestedText?: string;
    suggestionDroppedPlaceholderMismatch?: boolean;
  }>;
  /** Set when this string was not judged (batch failed, or the model response could not be aligned). */
  notReviewedReason?: string;
}

export interface ProofreadUIReport {
  schemaVersion: 1;
  sourceLocale: string;
  stringsPath: string;
  projectRoot: string;
  units: ProofreadUIReportUnit[];
  batchErrors: Array<{ batchIndex: number; message: string }>;
  summary: {
    totalUnits: number;
    unitsWithIssues: number;
    /** Strings with zero reported issues after proofreading. Excludes strings that were not reviewed. */
    unitsOk: number;
    /** Strings skipped because a batch failed or its response could not be aligned. */
    unitsNotReviewed: number;
    issueCount: number;
    /** Sum of OpenRouter-reported USD `cost` for successful batches (0 when dry-run, empty, or all batches failed). */
    totalCostUsd: number;
  };
}

export interface ProofreadUIOptions {
  cwd: string;
  chunkSize?: number;
  concurrency?: number;
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
  locale?: string;
}

function isoTimestampForProofreadLog(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function resolveLocationDisplayPath(projectRoot: string, file: string): string {
  const abs = path.isAbsolute(file) ? file : path.join(projectRoot, file);
  try {
    return path.relative(projectRoot, abs) || file;
  } catch {
    return file;
  }
}

/** Absolute path for `proofread-ui-results_*.log` so dashboard file links work when the log is outside cwd. */
function resolveLocationAbsolutePathForLog(projectRoot: string, file: string): string {
  const abs = path.isAbsolute(file) ? file : path.join(projectRoot, file);
  return path.normalize(abs);
}

function appendLocationLines(
  lines: string[],
  projectRoot: string,
  locs: Array<{ file: string; line: number }>
): void {
  for (const loc of locs) {
    const disp = resolveLocationAbsolutePathForLog(projectRoot, loc.file);
    lines.push(`  ${disp}:${loc.line}`);
  }
  if (locs.length === 0) {
    lines.push(`  (no call-site locations in catalog)`);
  }
}

/**
 * Plain-text report for `proofread-ui-results_*.log` (no JSON; no ANSI).
 * With `--json`, stdout still receives {@link ProofreadUIReport} as JSON only.
 */
export function formatProofreadUIHumanLogText(
  report: ProofreadUIReport,
  projectRoot: string,
  meta?: { dryRun?: boolean }
): string {
  const lines: string[] = [];
  lines.push("proofread-ui results");
  lines.push(`generatedAt: ${new Date().toISOString()}`);
  lines.push(`sourceLocale: ${report.sourceLocale}`);
  lines.push(`strings: ${report.stringsPath}`);
  lines.push(`projectRoot: ${report.projectRoot}`);
  lines.push("");

  if (meta?.dryRun) {
    lines.push("Note: dry-run — catalog strings listed below were not sent to the model.");
    lines.push("");
  }

  const s = report.summary;
  lines.push("Summary:");
  lines.push(`  totalStrings: ${s.totalUnits}`);
  lines.push(`  withIssues: ${s.unitsWithIssues}`);
  lines.push(`  ok: ${s.unitsOk}`);
  lines.push(`  notReviewed: ${s.unitsNotReviewed}`);
  lines.push(`  issueCount: ${s.issueCount}`);
  lines.push(`  totalCostUsd: ${s.totalCostUsd.toFixed(6)}`);
  if (report.batchErrors.length > 0) {
    lines.push(`  failedBatches: ${report.batchErrors.length}`);
  }
  lines.push("");

  if (report.batchErrors.length > 0) {
    lines.push("Batch errors:");
    for (const be of report.batchErrors) {
      lines.push(`  batchIndex ${be.batchIndex}: ${be.message}`);
    }
    lines.push("");
  }

  const issueUnits = report.units.filter((u) => !u.notReviewedReason && u.issues.length > 0);
  const okUnits = report.units.filter((u) => !u.notReviewedReason && u.issues.length === 0);
  const notReviewedUnits = report.units.filter((u) => u.notReviewedReason);

  if (issueUnits.length > 0) {
    lines.push("Issues:");
    lines.push("");
    for (const ru of issueUnits) {
      for (const iss of ru.issues) {
        lines.push(`[${iss.severity}] ${JSON.stringify(ru.originalText)}`);
        if (iss.suggestedText !== undefined && iss.suggestedText !== "") {
          lines.push(`  -> Suggested: ${JSON.stringify(iss.suggestedText)}`);
        }
        lines.push(`  -> ${iss.message}`);
        appendLocationLines(lines, projectRoot, ru.locations);
        lines.push("");
      }
    }
  }

  if (notReviewedUnits.length > 0) {
    lines.push(`Not reviewed (${notReviewedUnits.length}):`);
    lines.push("");
    for (const ru of notReviewedUnits) {
      lines.push(`[not-reviewed] ${ru.segmentId} ${JSON.stringify(ru.originalText)}`);
      lines.push(`  -> ${ru.notReviewedReason}`);
      appendLocationLines(lines, projectRoot, ru.locations);
      lines.push("");
    }
  }

  if (okUnits.length > 0) {
    lines.push(`OK (${okUnits.length}):`);
    lines.push("");
    for (const ru of okUnits) {
      lines.push(`[ok] ${ru.segmentId} ${JSON.stringify(ru.originalText)}`);
      appendLocationLines(lines, projectRoot, ru.locations);
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

/**
 * Run `proofread-ui`: **`extract`** refreshes `strings.json`, then chunked OpenRouter batches and a human-readable `.log` under `cacheDir`.
 * Pass `--json` for machine-readable JSON on stdout only.
 */
export async function runProofreadUI(
  config: I18nConfig,
  opts: ProofreadUIOptions
): Promise<{ report: ProofreadUIReport; logFilePath: string; exitWithError?: string }> {
  const cwd = opts.cwd;

  if (!config.features.translateUIStrings) {
    const stringsPathEarly = resolveStringsJsonPath(config, cwd);
    return {
      report: emptyReport(config, cwd, stringsPathEarly),
      logFilePath: "",
      exitWithError: t(
        "[proofread-ui] Enable features.translateUIStrings in config (proofread-ui runs extract first so strings.json matches source)."
      ),
    };
  }

  try {
    runExtract(config, cwd);
  } catch (e) {
    const stringsPathEarly = resolveStringsJsonPath(config, cwd);
    return {
      report: emptyReport(config, cwd, stringsPathEarly),
      logFilePath: "",
      exitWithError: e instanceof Error ? e.message : String(e),
    };
  }

  const stringsPath = resolveStringsJsonPath(config, cwd);
  if (!fs.existsSync(stringsPath)) {
    return {
      report: emptyReport(config, cwd, stringsPath),
      logFilePath: "",
      exitWithError: t("strings.json not found: {{path}}", { path: stringsPath }),
    };
  }

  let strings: Record<string, StringsJsonEntry>;
  try {
    strings = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as Record<string, StringsJsonEntry>;
  } catch (e) {
    return {
      report: emptyReport(config, cwd, stringsPath),
      logFilePath: "",
      exitWithError: t("Invalid strings.json: {{error}}", {
        error: e instanceof Error ? e.message : String(e),
      }),
    };
  }

  const localeRaw = opts.locale?.trim() || config.sourceLocale;
  const localeNorm = normalizeLocale(localeRaw);
  const languageLabel = localeLabelForPrompt(config, localeNorm);

  const units = collectProofreadUIUnits(strings);
  const chunkSize = Math.max(1, Math.floor(opts.chunkSize ?? DEFAULT_CHUNK));
  const concurrency = Math.max(1, Math.floor(opts.concurrency ?? config.concurrency ?? 4));

  const cacheDir = path.join(cwd, config.cacheDir);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  const logFilePath = path.join(
    cacheDir,
    `proofread-ui-results_${isoTimestampForProofreadLog()}.log`
  );

  if (units.length === 0) {
    const report: ProofreadUIReport = {
      schemaVersion: 1,
      sourceLocale: localeNorm,
      stringsPath,
      projectRoot: cwd,
      units: [],
      batchErrors: [],
      summary: {
        totalUnits: 0,
        unitsWithIssues: 0,
        unitsOk: 0,
        unitsNotReviewed: 0,
        issueCount: 0,
        totalCostUsd: 0,
      },
    };
    fs.writeFileSync(logFilePath, formatProofreadUIHumanLogText(report, cwd), "utf8");
    const humanFn = opts.json ? console.error : console.log;
    const logBase = path.basename(logFilePath);
    humanFn(chalk.bold(t("Summary: 0 string(s) — 0 with issues, 0 OK, 0 issue(s)")));
    humanFn("");
    humanFn(
      chalk.green(
        t("✔  0 strings checked — all OK (0 of 0). Results written to {{logBase}}", { logBase })
      )
    );
    humanFn(chalk.green(t("   💵 Total OpenRouter cost: $0.000000")));
    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
    }
    return { report, logFilePath };
  }

  if (opts.dryRun) {
    const nChunks = Math.ceil(units.length / chunkSize);
    const outFn = opts.json ? console.error : console.log;
    outFn(
      chalk.cyan(
        t(
          "[proofread-ui] dry-run: {{count}} string(s), {{batches}} batch(es) of up to {{chunkSize}}, concurrency {{concurrency}} — no API calls",
          {
            count: units.length,
            batches: nChunks,
            chunkSize,
            concurrency,
          }
        )
      )
    );
    outFn("");
    const dryReportUnits: ProofreadUIReportUnit[] = units.map((u) => ({
      segmentId: u.segmentId,
      field: "source",
      originalText: u.text,
      locations: u.locations,
      issues: [],
    }));
    const report: ProofreadUIReport = {
      schemaVersion: 1,
      sourceLocale: localeNorm,
      stringsPath,
      projectRoot: cwd,
      units: dryReportUnits,
      batchErrors: [],
      summary: {
        totalUnits: units.length,
        unitsWithIssues: 0,
        unitsOk: units.length,
        unitsNotReviewed: 0,
        issueCount: 0,
        totalCostUsd: 0,
      },
    };
    fs.writeFileSync(
      logFilePath,
      formatProofreadUIHumanLogText(report, cwd, { dryRun: true }),
      "utf8"
    );
    const logBase = path.basename(logFilePath);
    outFn(
      chalk.bold(
        t("Summary: {{count}} string(s) — 0 with issues, {{ok}} OK, 0 issue(s)", {
          count: units.length,
          ok: units.length,
        })
      )
    );
    outFn("");
    outFn(
      chalk.green(
        t(
          "✔  {{count}} strings checked — all OK ({{ok}} of {{total}}, dry-run). Results written to {{logBase}}",
          {
            count: units.length,
            ok: units.length,
            total: units.length,
            logBase,
          }
        )
      )
    );
    outFn(chalk.green(t("   💵 Total OpenRouter cost: $0.000000")));
    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
    }
    return { report, logFilePath };
  }

  const usageCache = new TranslationCache(cacheDir);
  let translationContext;
  try {
    translationContext = loadTranslationContextFromConfig(config, cwd);
  } catch (e) {
    usageCache.close();
    return {
      report: emptyReport(config, cwd, stringsPath, units.length),
      logFilePath,
      exitWithError: e instanceof Error ? e.message : String(e),
    };
  }
  let client: LlmClient;
  try {
    client = await createFilteredLlmClient(config, localeNorm, {
      ui: true,
      ...translationContextClientOpts(translationContext.text),
      onApiCall: createUsageRecorder(usageCache, "proofread-ui", localeNorm),
    });
  } catch (e) {
    usageCache.close();
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === MODELS_ALL_UNKNOWN_AFTER_FILTER) {
      return {
        report: emptyReport(config, cwd, stringsPath, units.length),
        logFilePath,
        exitWithError: MODELS_ALL_UNKNOWN_AFTER_FILTER,
      };
    }
    return {
      report: emptyReport(config, cwd, stringsPath, units.length),
      logFilePath,
      exitWithError: t("LLM provider API key required for proofread-ui: {{error}}", {
        error: msg,
      }),
    };
  }

  try {
    const glossaryUser = config.glossary?.userGlossary
      ? path.join(cwd, config.glossary.userGlossary)
      : undefined;
    const glossary = new Glossary(undefined, glossaryUser, [localeNorm]);

    const chunks: ProofreadUIUnit[][] = [];
    for (let i = 0; i < units.length; i += chunkSize) {
      chunks.push(units.slice(i, i + chunkSize));
    }

    type BatchOk = {
      kind: "ok";
      batchIndex: number;
      pairs: Array<{
        unit: ProofreadUIUnit;
        issues: ProofreadUIIssue[];
        notReviewedReason?: string;
      }>;
      lengthWarning: string | null;
      model: string;
      costUsd: number;
    };
    type BatchErr = {
      kind: "err";
      batchIndex: number;
      message: string;
      units: ProofreadUIUnit[];
    };

    const batchErrors: Array<{ batchIndex: number; message: string }> = [];
    const unitIssues = new Map<
      string,
      Array<{
        severity: "error" | "warning";
        message: string;
        suggestedText?: string;
        suggestionDroppedPlaceholderMismatch?: boolean;
      }>
    >();
    const notReviewed = new Map<string, string>();

    const results = await runMapWithConcurrency(chunks, concurrency, async (chunk, batchIndex) => {
      const texts = chunk.map((u) => u.text);
      const hints = glossary.findTermsInText(texts.join("\n"), localeNorm);
      try {
        let batch = await client.proofreadUISourceBatch(texts, languageLabel, {
          glossaryHints: hints,
        });
        if (batch.reviewed.some((ok) => !ok)) {
          try {
            const retry = await client.proofreadUISourceBatch(texts, languageLabel, {
              glossaryHints: hints,
            });
            if (countReviewedSlots(retry.reviewed) > countReviewedSlots(batch.reviewed)) {
              batch = retry;
            }
          } catch (e) {
            if (opts.verbose) {
              console.error(
                chalk.yellow(
                  t("[proofread-ui] batch {{batch}} retry failed: {{error}}", {
                    batch: batchIndex + 1,
                    error: e instanceof Error ? e.message : String(e),
                  })
                )
              );
            }
          }
        }
        const pairs: BatchOk["pairs"] = [];
        for (let i = 0; i < chunk.length; i++) {
          const unit = chunk[i]!;
          if (!batch.reviewed[i]) {
            pairs.push({ unit, issues: [], notReviewedReason: NOT_REVIEWED_UNALIGNED });
            continue;
          }
          pairs.push({
            unit,
            issues: cleanProofreadIssues(unit.text, batch.slots[i]?.issues ?? []),
          });
        }
        const ok: BatchOk = {
          kind: "ok",
          batchIndex,
          pairs,
          lengthWarning: batch.lengthWarning,
          model: batch.model,
          costUsd: batch.cost ?? 0,
        };
        return ok;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { kind: "err", batchIndex, message: msg, units: chunk } satisfies BatchErr;
      }
    });

    let totalCostUsd = 0;
    for (const r of results) {
      if (r.kind === "err") {
        batchErrors.push({ batchIndex: r.batchIndex, message: r.message });
        for (const unit of r.units) {
          notReviewed.set(unit.segmentId, NOT_REVIEWED_BATCH_FAILED);
        }
        console.error(
          chalk.red(
            t("❌ [proofread-ui] batch {{batch}} failed: {{error}}", {
              batch: r.batchIndex + 1,
              error: r.message,
            })
          )
        );
        continue;
      }
      totalCostUsd += r.costUsd;
      if (opts.verbose && r.lengthWarning) {
        console.error(
          chalk.yellow(
            t("[proofread-ui] batch {{batch}}: {{warning}}", {
              batch: r.batchIndex + 1,
              warning: r.lengthWarning,
            })
          )
        );
      }
      if (opts.verbose) {
        console.error(
          chalk.gray(
            t("[proofread-ui] batch {{batch}}/{{total}} complete ({{model}})", {
              batch: r.batchIndex + 1,
              total: chunks.length,
              model: r.model,
            })
          )
        );
      }
      for (const { unit, issues, notReviewedReason } of r.pairs) {
        if (notReviewedReason) {
          notReviewed.set(unit.segmentId, notReviewedReason);
          continue;
        }
        if (issues.length === 0) {
          continue;
        }
        const prev = unitIssues.get(unit.segmentId) ?? [];
        prev.push(...issues);
        unitIssues.set(unit.segmentId, prev);
      }
    }

    const reportUnits: ProofreadUIReportUnit[] = units.map((u) => {
      const notReviewedReason = notReviewed.get(u.segmentId);
      return {
        segmentId: u.segmentId,
        field: "source",
        originalText: u.text,
        locations: u.locations,
        issues: notReviewedReason ? [] : (unitIssues.get(u.segmentId) ?? []),
        ...(notReviewedReason ? { notReviewedReason } : {}),
      };
    });

    let unitsWithIssues = 0;
    let issueCount = 0;
    let unitsNotReviewed = 0;
    for (const ru of reportUnits) {
      if (ru.notReviewedReason) {
        unitsNotReviewed++;
        continue;
      }
      if (ru.issues.length > 0) {
        unitsWithIssues++;
        issueCount += ru.issues.length;
      }
    }
    const unitsOk = units.length - unitsWithIssues - unitsNotReviewed;

    const report: ProofreadUIReport = {
      schemaVersion: 1,
      sourceLocale: localeNorm,
      stringsPath,
      projectRoot: cwd,
      units: reportUnits,
      batchErrors,
      summary: {
        totalUnits: units.length,
        unitsWithIssues,
        unitsOk,
        unitsNotReviewed,
        issueCount,
        totalCostUsd,
      },
    };

    fs.writeFileSync(logFilePath, formatProofreadUIHumanLogText(report, cwd), "utf8");

    const humanFn = opts.json ? console.error : console.log;
    const logBase = path.basename(logFilePath);

    humanFn(
      chalk.bold(
        unitsNotReviewed === 0
          ? t(
              "Summary: {{count}} string(s) — {{withIssues}} with issues, {{ok}} OK, {{issues}} issue(s)",
              {
                count: units.length,
                withIssues: unitsWithIssues,
                ok: unitsOk,
                issues: issueCount,
              }
            )
          : t(
              "Summary: {{count}} string(s) — {{withIssues}} with issues, {{ok}} OK, {{notReviewed}} not reviewed, {{issues}} issue(s)",
              {
                count: units.length,
                withIssues: unitsWithIssues,
                ok: unitsOk,
                notReviewed: unitsNotReviewed,
                issues: issueCount,
              }
            )
      )
    );
    humanFn("");

    for (const ru of reportUnits) {
      if (ru.notReviewedReason || ru.issues.length === 0) {
        continue;
      }
      const quoted = JSON.stringify(ru.originalText);
      for (const iss of ru.issues) {
        const tag =
          iss.severity === "error" ? chalk.red(t("[error]")) : chalk.yellow(t("[warning]"));
        humanFn(`${tag} ${quoted}`);
        if (iss.suggestedText !== undefined && iss.suggestedText !== "") {
          humanFn(
            t("  {{arrow}} Suggested: {{suggested}}", {
              arrow: chalk.green("→"),
              suggested: JSON.stringify(iss.suggestedText),
            })
          );
        }
        humanFn(`  ${chalk.gray("→")} ${iss.message}`);
        for (const loc of ru.locations) {
          const disp = resolveLocationDisplayPath(cwd, loc.file);
          humanFn(`  ${chalk.cyan(`${disp}:${loc.line}`)}`);
        }
        if (ru.locations.length === 0) {
          humanFn(`  ${chalk.gray(t("(no call-site locations in catalog)"))}`);
        }
        humanFn("");
      }
    }

    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
    }

    if (issueCount === 0 && unitsNotReviewed === 0) {
      humanFn(
        chalk.green(
          t(
            "✔  {{count}} strings checked — all OK ({{ok}} of {{total}}). Results written to {{logBase}}",
            {
              count: units.length,
              ok: unitsOk,
              total: units.length,
              logBase,
            }
          )
        )
      );
    } else if (unitsNotReviewed === 0) {
      humanFn(
        chalk.yellow(
          t(
            "⚠  {{issues}} issue(s) in {{withIssues}} string(s); {{ok}} OK of {{total}} total. Results written to {{logBase}}",
            {
              issues: issueCount,
              withIssues: unitsWithIssues,
              ok: unitsOk,
              total: units.length,
              logBase,
            }
          )
        )
      );
    } else {
      humanFn(
        chalk.yellow(
          t(
            "⚠  {{issues}} issue(s) in {{withIssues}} string(s); {{ok}} OK, {{notReviewed}} not reviewed, of {{total}} total. Results written to {{logBase}}",
            {
              issues: issueCount,
              withIssues: unitsWithIssues,
              ok: unitsOk,
              notReviewed: unitsNotReviewed,
              total: units.length,
              logBase,
            }
          )
        )
      );
    }
    humanFn(
      chalk.green(t("   💵 Total OpenRouter cost: ${{cost}}", { cost: totalCostUsd.toFixed(6) }))
    );

    if (batchErrors.length === chunks.length && chunks.length > 0) {
      return {
        report,
        logFilePath,
        exitWithError: t("All proofread-ui batches failed (see batchErrors in log file)."),
      };
    }

    return { report, logFilePath };
  } finally {
    usageCache.close();
  }
}

function emptyReport(
  config: I18nConfig,
  cwd: string,
  stringsPath: string,
  totalUnits = 0
): ProofreadUIReport {
  return {
    schemaVersion: 1,
    sourceLocale: normalizeLocale(config.sourceLocale),
    stringsPath,
    projectRoot: cwd,
    units: [],
    batchErrors: [],
    summary: {
      totalUnits,
      unitsWithIssues: 0,
      unitsOk: 0,
      unitsNotReviewed: 0,
      issueCount: 0,
      totalCostUsd: 0,
    },
  };
}
