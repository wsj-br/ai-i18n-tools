import fs from "fs";
import path from "path";
import { parseEnv } from "node:util";
import { PROVIDER_PRESETS } from "../core/llm-providers.js";

/** Tool variables read from the environment, besides provider API keys. */
export const TOOL_ENV_NAMES = [
  "OPENROUTER_BASE_URL",
  "OLLAMA_BASE_URL",
  "AI_I18N_LANG",
  "I18N_SOURCE_LOCALE",
  "I18N_TARGET_LOCALES",
  "I18N_LOG_LEVEL",
  "NO_COLOR",
  "I18N_LOG_SESSION_MAX",
  "BROWSER",
  "SOURCE_DATE_EPOCH",
] as const;

const DOTENV_FILES = [".env", ".env.local"] as const;

export type DotenvFileName = (typeof DOTENV_FILES)[number];

export interface DotenvLoadedFile {
  file: DotenvFileName;
  /** Variable names whose values were copied into `process.env` from this file. */
  names: string[];
}

export interface DotenvFileError {
  file: string;
  message: string;
}

export interface LoadDotenvResult {
  /** Files that supplied at least one variable, in `.env` then `.env.local` order. */
  loaded: DotenvLoadedFile[];
  /** Files that exist but could not be read or parsed. */
  errors: DotenvFileError[];
}

export interface LoadDotenvOptions {
  /**
   * Extra API-key variable names from `providers.*.apiKeyEnv`. Counted both as keys that
   * block file loading and as names that may be copied out of the files.
   */
  extraNames?: readonly string[];
}

/** Built-in provider API-key variable names, including legacy aliases. */
export function providerApiKeyEnvNames(): string[] {
  const names: string[] = [];
  for (const preset of Object.values(PROVIDER_PRESETS)) {
    if (preset.apiKeyEnv) {
      names.push(preset.apiKeyEnv);
    }
    names.push(...(preset.apiKeyEnvAliases ?? []));
  }
  return names;
}

/** `providers.*.apiKeyEnv` values declared on a raw config object. */
export function apiKeyEnvNamesFromRawConfig(raw: unknown): string[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }
  const providers = (raw as { providers?: unknown }).providers;
  if (!providers || typeof providers !== "object" || Array.isArray(providers)) {
    return [];
  }
  const names: string[] = [];
  for (const entry of Object.values(providers)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const name = (entry as { apiKeyEnv?: unknown }).apiKeyEnv;
    if (typeof name === "string" && name.trim() !== "") {
      names.push(name.trim());
    }
  }
  return names;
}

/**
 * `providers.*.apiKeyEnv` from a config file. Invalid JSON yields `[]`; config loading reports
 * that error itself.
 */
export function apiKeyEnvNamesFromConfigFile(configPath: string): string[] {
  let text: string;
  try {
    text = fs.readFileSync(configPath, "utf8");
  } catch {
    // Config loading reports a missing or unreadable file. Custom key names stay unknown until then.
    return [];
  }
  try {
    return apiKeyEnvNamesFromRawConfig(JSON.parse(text) as unknown);
  } catch {
    // Invalid JSON is reported when the config is loaded. Custom key names stay unknown until then.
    return [];
  }
}

function trimmedEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function uniqueNames(names: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (trimmed === "" || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    unique.push(trimmed);
  }
  return unique;
}

/** True when any provider API key already has a non-empty value in the environment. */
export function environmentHasApiKey(extraNames: readonly string[] = []): boolean {
  for (const name of uniqueNames([...providerApiKeyEnvNames(), ...extraNames])) {
    if (trimmedEnv(name) !== "") {
      return true;
    }
  }
  return false;
}

function neededEnvVarNames(extraNames: readonly string[]): string[] {
  return uniqueNames([...providerApiKeyEnvNames(), ...TOOL_ENV_NAMES, ...extraNames]).sort((a, b) =>
    a.localeCompare(b, "en")
  );
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function readDotenvFile(
  dir: string,
  file: DotenvFileName,
  errors: DotenvFileError[]
): Record<string, string> | undefined {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) {
    return undefined;
  }
  let text: string;
  try {
    text = fs.readFileSync(full, "utf8");
  } catch (e) {
    errors.push({ file, message: errorMessage(e) });
    return undefined;
  }
  try {
    const parsed = parseEnv(text);
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        values[key] = value;
      }
    }
    return values;
  } catch (e) {
    errors.push({ file, message: errorMessage(e) });
    return undefined;
  }
}

/**
 * When no provider API key is set, copy the variables this tool uses from `.env` and `.env.local`
 * in `dir` (the directory that contains `ai-i18n-tools.config.json`).
 *
 * An API key already present in the environment skips both files entirely. Otherwise `.env.local`
 * wins over `.env` for the same name, and a variable already set in the environment is left as it
 * is. The caller prints the variable names that were copied.
 */
export function loadDotenv(
  dir: string = process.cwd(),
  options: LoadDotenvOptions = {}
): LoadDotenvResult {
  const extraNames = options.extraNames ?? [];
  if (environmentHasApiKey(extraNames)) {
    return { loaded: [], errors: [] };
  }

  const errors: DotenvFileError[] = [];
  const fromFile = new Map<DotenvFileName, Record<string, string>>();
  for (const file of DOTENV_FILES) {
    const parsed = readDotenvFile(dir, file, errors);
    if (parsed) {
      fromFile.set(file, parsed);
    }
  }
  if (fromFile.size === 0) {
    return { loaded: [], errors };
  }

  const loadedEnv: string[] = [];
  const loadedLocal: string[] = [];
  for (const name of neededEnvVarNames(extraNames)) {
    if (trimmedEnv(name) !== "") {
      continue;
    }
    const localRaw = fromFile.get(".env.local")?.[name];
    const baseRaw = fromFile.get(".env")?.[name];
    if (localRaw !== undefined && localRaw.trim() !== "") {
      process.env[name] = localRaw;
      loadedLocal.push(name);
      continue;
    }
    if (baseRaw !== undefined && baseRaw.trim() !== "") {
      process.env[name] = baseRaw;
      loadedEnv.push(name);
    }
  }

  const loaded: DotenvLoadedFile[] = [];
  if (loadedEnv.length > 0) {
    loaded.push({ file: ".env", names: loadedEnv });
  }
  if (loadedLocal.length > 0) {
    loaded.push({ file: ".env.local", names: loadedLocal });
  }
  return { loaded, errors };
}
