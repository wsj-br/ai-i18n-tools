/**
 * LLM-assisted review of source-locale UI strings (spelling, grammar, terminology).
 * @see docs/GETTING_STARTED.md — `lint-source`
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig, StringsJsonEntry } from "../core/types.js";
import { OpenRouterClient } from "../api/openrouter.js";
import {
  englishLanguageNameForLocale,
  normalizeLocale,
  resolveUITranslationModels,
} from "../core/config.js";
import type { LintSourceIssue } from "../core/prompt-builder.js";
import { resolveStringsJsonPath } from "./helpers.js";
import { runExtract } from "./extract-strings.js";
import { Glossary } from "../glossary/glossary.js";
import { runMapWithConcurrency } from "../utils/concurrency.js";

const DEFAULT_CHUNK = 50;

export interface LintSourceUnit {
  segmentId: string;
  readonly field: "source";
  text: string;
  locations: Array<{ file: string; line: number }>;
}

/** Extract placeholder substrings that must survive any suggested rewrite. */
export function extractUiPlaceholderTokens(original: string): string[] {
  const found = new Set<string>();
  for (const re of [/\{\{[\s\S]*?\}\}/g, /\{\s*[0-9]+\s*\}/g, /%[sd]/g]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(original)) !== null) {
      found.add(m[0]);
    }
  }
  return [...found];
}

/** Returns true if every placeholder token from `original` appears unchanged in `suggested`. */
export function lintSuggestionPreservesPlaceholders(original: string, suggested: string): boolean {
  for (const t of extractUiPlaceholderTokens(original)) {
    if (!suggested.includes(t)) {
      return false;
    }
  }
  return true;
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
 * Collect one lint row per catalog entry: `source` only (plain and plural rows).
 */
export function collectLintSourceUnits(
  strings: Record<string, StringsJsonEntry>
): LintSourceUnit[] {
  const out: LintSourceUnit[] = [];
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

export interface LintSourceReportUnit {
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
}

export interface LintSourceReport {
  schemaVersion: 1;
  sourceLocale: string;
  stringsPath: string;
  projectRoot: string;
  units: LintSourceReportUnit[];
  batchErrors: Array<{ batchIndex: number; message: string }>;
  summary: {
    totalUnits: number;
    unitsWithIssues: number;
    /** Strings with zero reported issues after lint. */
    unitsOk: number;
    issueCount: number;
    /** Sum of OpenRouter-reported USD `cost` for successful batches (0 when dry-run, empty, or all batches failed). */
    totalCostUsd: number;
  };
}

export interface LintSourceOptions {
  cwd: string;
  chunkSize?: number;
  concurrency?: number;
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
  locale?: string;
}

function isoTimestampForLintLog(): string {
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

/** Absolute path for `lint-source-results_*.log` so editor file links work when the log is outside cwd. */
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
 * Plain-text report for `lint-source-results_*.log` (no JSON; no ANSI).
 * With `--json`, stdout still receives {@link LintSourceReport} as JSON only.
 */
export function formatLintSourceHumanLogText(
  report: LintSourceReport,
  projectRoot: string,
  meta?: { dryRun?: boolean }
): string {
  const lines: string[] = [];
  lines.push("lint-source results");
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

  const issueUnits = report.units.filter((u) => u.issues.length > 0);
  const okUnits = report.units.filter((u) => u.issues.length === 0);

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
 * Run `lint-source`: **`extract`** refreshes `strings.json`, then chunked OpenRouter batches and a human-readable `.log` under `cacheDir`.
 * Pass `--json` for machine-readable JSON on stdout only.
 */
export async function runLintSource(
  config: I18nConfig,
  opts: LintSourceOptions
): Promise<{ report: LintSourceReport; logFilePath: string; exitWithError?: string }> {
  const cwd = opts.cwd;

  if (!config.features.extractUIStrings) {
    const stringsPathEarly = resolveStringsJsonPath(config, cwd);
    return {
      report: emptyReport(config, cwd, stringsPathEarly),
      logFilePath: "",
      exitWithError:
        "[lint-source] Enable features.extractUIStrings in config (lint-source runs extract first so strings.json matches source).",
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
      exitWithError: `strings.json not found: ${stringsPath}`,
    };
  }

  let strings: Record<string, StringsJsonEntry>;
  try {
    strings = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as Record<string, StringsJsonEntry>;
  } catch (e) {
    return {
      report: emptyReport(config, cwd, stringsPath),
      logFilePath: "",
      exitWithError: `Invalid strings.json: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const localeRaw = opts.locale?.trim() || config.sourceLocale;
  const localeNorm = normalizeLocale(localeRaw);
  const languageLabel = localeLabelForPrompt(config, localeNorm);

  const units = collectLintSourceUnits(strings);
  const chunkSize = Math.max(1, Math.floor(opts.chunkSize ?? DEFAULT_CHUNK));
  const concurrency = Math.max(1, Math.floor(opts.concurrency ?? config.concurrency ?? 4));

  const cacheDir = path.join(cwd, config.cacheDir);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  const logFilePath = path.join(cacheDir, `lint-source-results_${isoTimestampForLintLog()}.log`);

  if (units.length === 0) {
    const report: LintSourceReport = {
      schemaVersion: 1,
      sourceLocale: localeNorm,
      stringsPath,
      projectRoot: cwd,
      units: [],
      batchErrors: [],
      summary: { totalUnits: 0, unitsWithIssues: 0, unitsOk: 0, issueCount: 0, totalCostUsd: 0 },
    };
    fs.writeFileSync(logFilePath, formatLintSourceHumanLogText(report, cwd), "utf8");
    const humanFn = opts.json ? console.error : console.log;
    const logBase = path.basename(logFilePath);
    humanFn(chalk.bold(`Summary: 0 string(s) — 0 with issues, 0 OK, 0 issue(s)`));
    humanFn("");
    humanFn(chalk.green(`✔  0 strings checked — all OK (0 of 0). Results written to ${logBase}`));
    humanFn(chalk.green(`   💵 Total OpenRouter cost: $0.000000`));
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
        `[lint-source] dry-run: ${units.length} string(s), ${nChunks} batch(es) of up to ${chunkSize}, concurrency ${concurrency} — no API calls`
      )
    );
    outFn("");
    const dryReportUnits: LintSourceReportUnit[] = units.map((u) => ({
      segmentId: u.segmentId,
      field: "source",
      originalText: u.text,
      locations: u.locations,
      issues: [],
    }));
    const report: LintSourceReport = {
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
        issueCount: 0,
        totalCostUsd: 0,
      },
    };
    fs.writeFileSync(
      logFilePath,
      formatLintSourceHumanLogText(report, cwd, { dryRun: true }),
      "utf8"
    );
    const logBase = path.basename(logFilePath);
    outFn(
      chalk.bold(
        `Summary: ${units.length} string(s) — 0 with issues, ${units.length} OK, 0 issue(s)`
      )
    );
    outFn("");
    outFn(
      chalk.green(
        `✔  ${units.length} strings checked — all OK (${units.length} of ${units.length}, dry-run). Results written to ${logBase}`
      )
    );
    outFn(chalk.green(`   💵 Total OpenRouter cost: $0.000000`));
    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
    }
    return { report, logFilePath };
  }

  let client: OpenRouterClient;
  try {
    client = new OpenRouterClient({
      config,
      translationModels: resolveUITranslationModels(config),
    });
  } catch (e) {
    return {
      report: emptyReport(config, cwd, stringsPath, units.length),
      logFilePath,
      exitWithError: `OPENROUTER_API_KEY required for lint-source: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  /** Same as `translate-ui`: user glossary CSV only — do not load `strings.json` / `uiGlossary` or we may reinforce bad copy as terminology. */
  const glossaryUser = config.glossary?.userGlossary
    ? path.join(cwd, config.glossary.userGlossary)
    : undefined;
  const glossary = new Glossary(undefined, glossaryUser, [localeNorm]);

  const chunks: LintSourceUnit[][] = [];
  for (let i = 0; i < units.length; i += chunkSize) {
    chunks.push(units.slice(i, i + chunkSize));
  }

  type BatchOk = {
    kind: "ok";
    batchIndex: number;
    pairs: Array<{ unit: LintSourceUnit; issues: LintSourceIssue[] }>;
    lengthWarning: string | null;
    model: string;
    costUsd: number;
  };
  type BatchErr = { kind: "err"; batchIndex: number; message: string };

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

  const results = await runMapWithConcurrency(chunks, concurrency, async (chunk, batchIndex) => {
    const texts = chunk.map((u) => u.text);
    const hints = glossary.findTermsInText(texts.join("\n"), localeNorm);
    try {
      const batch = await client.lintUISourceBatch(texts, languageLabel, {
        glossaryHints: hints,
      });
      if (opts.verbose && batch.lengthWarning) {
        console.error(
          chalk.yellow(`[lint-source] batch ${batchIndex + 1}: ${batch.lengthWarning}`)
        );
      }
      const pairs: Array<{ unit: LintSourceUnit; issues: LintSourceIssue[] }> = [];
      for (let i = 0; i < chunk.length; i++) {
        const unit = chunk[i]!;
        const slot = batch.slots[i];
        const rawIssues = slot?.issues ?? [];
        const cleaned: LintSourceIssue[] = [];
        for (const iss of rawIssues) {
          const st = iss.suggestedText?.trim();
          if (st && st !== unit.text && !lintSuggestionPreservesPlaceholders(unit.text, st)) {
            cleaned.push({
              severity: iss.severity,
              message: `${iss.message} (Suggested rewrite omitted: would break placeholders.)`,
              suggestionDroppedPlaceholderMismatch: true,
            });
          } else {
            cleaned.push({
              severity: iss.severity,
              message: iss.message,
              suggestedText: st && st !== unit.text ? st : undefined,
            });
          }
        }
        pairs.push({ unit, issues: cleaned });
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
      return { kind: "err", batchIndex, message: msg } satisfies BatchErr;
    }
  });

  let totalCostUsd = 0;
  for (const r of results) {
    if (r.kind === "err") {
      batchErrors.push({ batchIndex: r.batchIndex, message: r.message });
      console.error(chalk.red(`❌ [lint-source] batch ${r.batchIndex + 1} failed: ${r.message}`));
      continue;
    }
    totalCostUsd += r.costUsd;
    if (opts.verbose && r.lengthWarning) {
      console.error(chalk.yellow(`[lint-source] batch ${r.batchIndex + 1}: ${r.lengthWarning}`));
    }
    if (opts.verbose) {
      console.error(
        chalk.gray(`[lint-source] batch ${r.batchIndex + 1}/${chunks.length} complete (${r.model})`)
      );
    }
    for (const { unit, issues } of r.pairs) {
      if (issues.length === 0) {
        continue;
      }
      const prev = unitIssues.get(unit.segmentId) ?? [];
      prev.push(...issues);
      unitIssues.set(unit.segmentId, prev);
    }
  }

  const reportUnits: LintSourceReportUnit[] = units.map((u) => ({
    segmentId: u.segmentId,
    field: "source",
    originalText: u.text,
    locations: u.locations,
    issues: unitIssues.get(u.segmentId) ?? [],
  }));

  let unitsWithIssues = 0;
  let issueCount = 0;
  for (const ru of reportUnits) {
    if (ru.issues.length > 0) {
      unitsWithIssues++;
      issueCount += ru.issues.length;
    }
  }
  const unitsOk = units.length - unitsWithIssues;

  const report: LintSourceReport = {
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
      issueCount,
      totalCostUsd,
    },
  };

  fs.writeFileSync(logFilePath, formatLintSourceHumanLogText(report, cwd), "utf8");

  const humanFn = opts.json ? console.error : console.log;
  const logBase = path.basename(logFilePath);

  humanFn(
    chalk.bold(
      `Summary: ${units.length} string(s) — ${unitsWithIssues} with issues, ${unitsOk} OK, ${issueCount} issue(s)`
    )
  );
  humanFn("");

  for (const ru of reportUnits) {
    if (ru.issues.length === 0) {
      continue;
    }
    const quoted = JSON.stringify(ru.originalText);
    for (const iss of ru.issues) {
      const tag = iss.severity === "error" ? chalk.red("[error]") : chalk.yellow("[warning]");
      humanFn(`${tag} ${quoted}`);
      if (iss.suggestedText !== undefined && iss.suggestedText !== "") {
        humanFn(`  ${chalk.green("→")} Suggested: ${JSON.stringify(iss.suggestedText)}`);
      }
      humanFn(`  ${chalk.gray("→")} ${iss.message}`);
      for (const loc of ru.locations) {
        const disp = resolveLocationDisplayPath(cwd, loc.file);
        humanFn(`  ${chalk.cyan(`${disp}:${loc.line}`)}`);
      }
      if (ru.locations.length === 0) {
        humanFn(`  ${chalk.gray("(no call-site locations in catalog)")}`);
      }
      humanFn("");
    }
  }

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  }

  if (issueCount === 0) {
    humanFn(
      chalk.green(
        `✔  ${units.length} strings checked — all OK (${unitsOk} of ${units.length}). Results written to ${logBase}`
      )
    );
  } else {
    humanFn(
      chalk.yellow(
        `⚠  ${issueCount} issue(s) in ${unitsWithIssues} string(s); ${unitsOk} OK of ${units.length} total. Results written to ${logBase}`
      )
    );
  }
  humanFn(chalk.green(`   💵 Total OpenRouter cost: $${totalCostUsd.toFixed(6)}`));

  if (batchErrors.length === chunks.length && chunks.length > 0) {
    return {
      report,
      logFilePath,
      exitWithError: "All lint-source batches failed (see batchErrors in log file).",
    };
  }

  return { report, logFilePath };
}

function emptyReport(
  config: I18nConfig,
  cwd: string,
  stringsPath: string,
  totalUnits = 0
): LintSourceReport {
  return {
    schemaVersion: 1,
    sourceLocale: normalizeLocale(config.sourceLocale),
    stringsPath,
    projectRoot: cwd,
    units: [],
    batchErrors: [],
    summary: { totalUnits, unitsWithIssues: 0, unitsOk: 0, issueCount: 0, totalCostUsd: 0 },
  };
}
