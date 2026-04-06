import crypto from "crypto";
import fs from "fs";
import path from "path";
import { loadI18nConfigFromFile, DEFAULT_CONFIG_FILENAME } from "../core/config.js";
import type { DocArtifactKind } from "../core/output-paths.js";
import { resolveDocumentationOutputPath } from "../core/output-paths.js";
import type { I18nConfig } from "../core/types.js";

export interface GlobalCliOptions {
  config: string;
  verbose?: boolean;
}

export function resolveConfigPath(configFlag: string | undefined, cwd: string): string {
  return configFlag && configFlag.length > 0 ? configFlag : path.join(cwd, DEFAULT_CONFIG_FILENAME);
}

export function loadConfigOrExit(configPath: string, cwd: string): I18nConfig {
  try {
    return loadI18nConfigFromFile(configPath, cwd);
  } catch (e) {
    console.error(`[ai-i18n-tools] Failed to load config: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}

/** SHA-256 hex of file contents (for file_tracking / status). */
export function hashFileContent(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

/** `strings.json` path: explicit glossary path or `ui.stringsJson`. */
export function resolveStringsJsonPath(config: I18nConfig, cwd: string): string {
  const fromGlossary = config.glossary?.uiGlossaryFromStringsJson?.trim();
  if (fromGlossary) {
    return path.isAbsolute(fromGlossary) ? fromGlossary : path.join(cwd, fromGlossary);
  }
  const p = config.ui.stringsJson.trim();
  return path.isAbsolute(p) ? p : path.join(cwd, p);
}

/** Resolved translated artifact path (markdown / JSON / SVG). */
export function resolveTranslatedOutputPath(
  config: I18nConfig,
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

export function writeAtomicUtf8(filePath: string, data: string): void {
  ensureDirForFile(filePath);
  const dir = path.dirname(filePath);
  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.tmp`);
  fs.writeFileSync(tmp, data, "utf8");
  fs.renameSync(tmp, filePath);
}
