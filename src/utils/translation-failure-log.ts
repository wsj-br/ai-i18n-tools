/**
 * Writes FAILED-TRANSLATION / DEBUG-TRANSLATION detail logs under cacheDir.
 * Used by docs, JSON, SVG, and UI pipelines when `--debug-failed` is set.
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import { t } from "../i18n/index.js";

export type TranslationLogOutcome = "retrying_next_model" | "fatal" | "individual_success";
export type TranslationLogMode = "failed" | "debug";

export function translationFailureLogDir(
  opts: { debugFailed?: boolean; cwd: string },
  cacheDir: string
): string | null {
  if (!opts.debugFailed) {
    return null;
  }
  return path.join(opts.cwd, cacheDir);
}

/** Spread into `createFilteredLlmClient` / `LlmClient` when `--debug-failed` is on. */
export function llmClientDebugFailedOpts(
  opts: { debugFailed?: boolean; cwd: string },
  cacheDir: string
): { debugFailedDir?: string } {
  const dir = translationFailureLogDir(opts, cacheDir);
  return dir ? { debugFailedDir: dir } : {};
}

function safeNameForLogFilename(relativePath: string): string {
  return relativePath.replace(/[/\\:*?"<>|]/g, "_");
}

export interface TranslationDetailLogOpts {
  cacheDirAbs: string;
  relativePath: string;
  locale: string;
  segmentsLabel: string;
  outcome: TranslationLogOutcome;
  failedModel: string;
  nextModel?: string;
  qualityErrors: string[];
  perSegmentLines: string[];
  systemPrompt: string;
  userContent: string;
  rawAssistantContent: string;
  /** Restored / accepted translation when the attempt eventually succeeded. */
  translatedText?: string;
}

/**
 * Filename: `{iso}-FAILED-TRANSLATION_{document}_{ms}.log` (or DEBUG-) under `cacheDirAbs`.
 * Returns absolute path; callers print `📝 Failure log: …`.
 */
export function writeTranslationDetailLog(
  opts: TranslationDetailLogOpts,
  mode: TranslationLogMode = "failed"
): string | undefined {
  const fileLabel = mode === "failed" ? "FAILED-TRANSLATION" : "DEBUG-TRANSLATION";
  const headerTitle =
    mode === "failed"
      ? "=== ai-i18n-tools translation failure ==="
      : "=== ai-i18n-tools translation debug ===";
  const tsIso = new Date().toISOString().replace(/:/g, "-");
  const ms = Date.now();
  const doc = safeNameForLogFilename(opts.relativePath);
  const model = safeNameForLogFilename(opts.failedModel);
  const fileName = `${tsIso}-${fileLabel}_${doc}_${model}_${ms}.log`;
  const abs = path.join(opts.cacheDirAbs, fileName);
  try {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    const lines = [
      headerTitle,
      `logFilePath: ${abs}`,
      `isoTime: ${new Date().toISOString()}`,
      `locale: ${opts.locale}`,
      `document: ${opts.relativePath}`,
      `segments: ${opts.segmentsLabel}`,
      `outcome: ${opts.outcome}`,
      `failedModel: ${opts.failedModel}`,
      opts.nextModel ? `nextModel: ${opts.nextModel}` : "",
      "",
      "--- quality / validation errors ---",
      ...(opts.qualityErrors.length > 0 ? opts.qualityErrors.map((e) => `  ${e}`) : ["  (none)"]),
      "",
      "--- per-segment validation ---",
      ...(opts.perSegmentLines.length > 0
        ? opts.perSegmentLines.map((e) => `  ${e}`)
        : ["  (none)"]),
      "",
      "--- system prompt ---",
      opts.systemPrompt,
      "",
      "--- user content ---",
      opts.userContent,
      "",
      "--- raw assistant response ---",
      opts.rawAssistantContent,
      "",
      ...(opts.translatedText !== undefined
        ? ["--- translated text ---", opts.translatedText, ""]
        : []),
    ].filter((l) => l !== "");
    fs.writeFileSync(abs, lines.join("\n"), "utf8");
    return abs;
  } catch (e) {
    console.warn(
      chalk.yellow(
        t("  ⚠️  Could not write translation {{mode}} log: {{error}}", {
          mode,
          error: String(e),
        })
      )
    );
    return undefined;
  }
}

export function writeTranslationFailureLog(opts: TranslationDetailLogOpts): string | undefined {
  return writeTranslationDetailLog(opts, "failed");
}

export function writeTranslationDebugLog(opts: TranslationDetailLogOpts): string | undefined {
  return writeTranslationDetailLog(opts, "debug");
}

export function warnTranslationFailureLogPath(logPath: string | undefined): void {
  if (!logPath) {
    return;
  }
  console.warn(chalk.gray(t("  📝 Failure log: {{path}}", { path: logPath })));
}
