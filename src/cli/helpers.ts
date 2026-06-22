import crypto from "crypto";
import fs from "fs";
import path from "path";
import { loadI18nConfigFromFile, DEFAULT_CONFIG_FILENAME } from "../core/config.js";
import { ConfigValidationError } from "../core/errors.js";
import { initUiI18nFromEnvironment } from "../i18n/index.js";
import type { DocArtifactKind } from "../core/output-paths.js";
import { resolveDocumentationOutputPath } from "../core/output-paths.js";
import type { I18nConfig, I18nDocTranslateConfig } from "../core/types.js";

export interface GlobalCliOptions {
  config: string;
  verbose?: boolean;
  provider?: string;
}

/** True when the CLI arg is only the default filename (no directory), so we may look in the parent of `searchCwd`. */
function isBareDefaultConfigArg(flag: string): boolean {
  const norm = path.normalize(flag);
  return (
    path.basename(norm) === DEFAULT_CONFIG_FILENAME &&
    (path.dirname(norm) === "." || path.dirname(norm) === "")
  );
}

/**
 * Resolve the config file path: `searchCwd`/config, then parent/`DEFAULT_CONFIG_FILENAME`
 * when looking for the default filename only. Absolute paths are used as-is.
 */
export function resolveConfigFileLocation(
  configFlag: string | undefined,
  searchCwd: string
): string {
  const flag = configFlag && configFlag.length > 0 ? configFlag : DEFAULT_CONFIG_FILENAME;

  if (path.isAbsolute(flag)) {
    const abs = path.normalize(flag);
    if (!fs.existsSync(abs)) {
      throw new ConfigValidationError(`Config file not found: ${abs}`);
    }
    return abs;
  }

  const inCwd = path.resolve(searchCwd, flag);
  if (fs.existsSync(inCwd)) {
    return inCwd;
  }

  if (isBareDefaultConfigArg(flag)) {
    const parent = path.dirname(searchCwd);
    if (parent !== searchCwd) {
      const inParent = path.resolve(path.join(parent, DEFAULT_CONFIG_FILENAME));
      if (fs.existsSync(inParent)) {
        return inParent;
      }
      throw new ConfigValidationError(
        `Config file not found: ${inCwd} (also checked: ${inParent})`
      );
    }
  }

  throw new ConfigValidationError(`Config file not found: ${inCwd}`);
}

/**
 * Load config; `projectRoot` is the directory containing the config file (used for all paths in config).
 */
export function loadConfigOrExit(
  configFlag: string | undefined,
  searchCwd: string,
  providerOverride?: string
): { config: I18nConfig; projectRoot: string } {
  try {
    const resolvedAbs = resolveConfigFileLocation(configFlag, searchCwd);
    const projectRoot = path.dirname(resolvedAbs);
    const config = loadI18nConfigFromFile(resolvedAbs, projectRoot, providerOverride);
    // Re-resolve the tool's UI locale now that config is known. `--ui-lang` / `AI_I18N_LANG` still
    // win over config `uiLanguage` (precedence handled inside the resolver).
    initUiI18nFromEnvironment(config.uiLanguage ?? null);
    return { config, projectRoot };
  } catch (e) {
    console.error(
      `[ai-i18n-tools] Failed to load config: ${e instanceof Error ? e.message : String(e)}`
    );
    process.exit(1);
  }
}

/** SHA-256 hex of file contents (for file_tracking / status). */
export function hashFileContent(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

/** `strings.json` path: explicit glossary path or `ui.stringsJson`. */
export function resolveStringsJsonPath(config: I18nConfig, cwd: string): string {
  const fromGlossary = config.glossary?.uiGlossary?.trim();
  if (fromGlossary) {
    return path.isAbsolute(fromGlossary) ? fromGlossary : path.join(cwd, fromGlossary);
  }
  const p = config.ui.stringsJson.trim();
  return path.isAbsolute(p) ? p : path.join(cwd, p);
}

/** Resolved translated artifact path (markdown / JSON / SVG). */
export function resolveTranslatedOutputPath(
  config: I18nDocTranslateConfig,
  cwd: string,
  locale: string,
  relPath: string,
  kind: DocArtifactKind = "markdown"
): string {
  return resolveDocumentationOutputPath(config, cwd, locale, relPath, kind);
}

export function ensureDirForFile(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/** Blocking sleep for synchronous retry paths (Windows rename contention). */
function sleepSyncMs(ms: number): void {
  if (ms <= 0) return;
  try {
    const sab = new SharedArrayBuffer(4);
    const ia = new Int32Array(sab);
    Atomics.wait(ia, 0, 0, ms);
  } catch {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      /* fallback if Atomics.wait is unavailable */
    }
  }
}

/**
 * Write UTF-8 via temp file + rename. On Windows, retries rename on EPERM/EACCES/EBUSY
 * (concurrent writers, indexer, AV) so replacement of an existing file is more reliable.
 */
export function writeAtomicUtf8(filePath: string, data: string): void {
  ensureDirForFile(filePath);
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const maxAttempts = process.platform === "win32" ? 10 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tmp = path.join(
      dir,
      `.${base}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`
    );
    try {
      fs.writeFileSync(tmp, data, "utf8");
    } catch (e) {
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* ignore */
      }
      throw e;
    }

    try {
      fs.renameSync(tmp, filePath);
      return;
    } catch (renameErr) {
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* ignore */
      }
      const code = (renameErr as NodeJS.ErrnoException)?.code;
      const retry =
        process.platform === "win32" &&
        attempt < maxAttempts - 1 &&
        (code === "EPERM" || code === "EACCES" || code === "EBUSY");
      if (retry) {
        sleepSyncMs(40 + attempt * 25);
        continue;
      }
      throw renameErr;
    }
  }
}
