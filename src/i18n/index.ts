/**
 * Lightweight self-localization runtime for the tool's OWN user interface (CLI logs, help, dashboard).
 *
 * Deliberately avoids i18next (not a CLI dependency) to keep startup cheap. UI strings are looked up
 * in a flat per-locale bundle keyed by the English source text (the same shape `translate-ui` emits),
 * shipped under `./locales/<code>.json` next to this module (copied into `dist/i18n/locales` at build).
 *
 * Source locale is English; when no bundle/key matches, `t()` returns the source string unchanged.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { resolveUiLocale, type ResolveUiLocaleResult } from "../core/ui-locale.js";

/** Source locale for the tool's own UI (matches this repo's `ai-i18n-tools.config.json`). */
export const UI_SOURCE_LOCALE = "en-GB";

/** One row of the shipped UI languages manifest. */
export interface UiLanguageManifestRow {
  code: string;
  label?: string;
  englishName?: string;
  direction?: "ltr" | "rtl";
  isSourceLocale?: boolean;
}

/** Interpolation values for `{{name}}` placeholders in a message. */
export type UiInterpolationVars = Record<string, string | number>;

function localesDir(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "locales");
}

let manifestCache: UiLanguageManifestRow[] | null = null;

/** Read the shipped `locales/ui-languages.json` manifest (cached). Returns `[]` when missing/invalid. */
export function loadUiManifest(): UiLanguageManifestRow[] {
  if (manifestCache) {
    return manifestCache;
  }
  const file = path.join(localesDir(), "ui-languages.json");
  try {
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw) as unknown;
    manifestCache = Array.isArray(data) ? (data as UiLanguageManifestRow[]) : [];
  } catch {
    manifestCache = [];
  }
  return manifestCache;
}

/** Available UI locale codes (from the manifest); always includes the source locale. */
export function availableUiLocales(): string[] {
  const rows = loadUiManifest();
  const codes = rows.map((r) => r.code).filter((c): c is string => typeof c === "string" && !!c);
  if (!codes.some((c) => c === UI_SOURCE_LOCALE)) {
    return [UI_SOURCE_LOCALE, ...codes];
  }
  return codes;
}

/** Layout direction for a UI locale (from the manifest); defaults to `ltr`. */
export function uiLocaleDirection(locale: string): "ltr" | "rtl" {
  const row = loadUiManifest().find((r) => r.code === locale);
  return row?.direction === "rtl" ? "rtl" : "ltr";
}

/** Load the flat bundle (English source -> translation) for a locale. Returns `{}` for source/missing. */
export function loadUiBundle(locale: string): Record<string, string> {
  if (!locale || locale === UI_SOURCE_LOCALE) {
    return {};
  }
  const file = path.join(localesDir(), `${locale}.json`);
  try {
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw) as unknown;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as Record<string, string>;
    }
  } catch {
    /* fall through to empty bundle */
  }
  return {};
}

let currentLocale = UI_SOURCE_LOCALE;
let currentBundle: Record<string, string> = {};

/** Initialize (or re-initialize) the active UI locale and load its bundle. Safe to call repeatedly. */
export function initUiI18n(locale: string | undefined | null): void {
  const next = locale && locale.trim() ? locale.trim() : UI_SOURCE_LOCALE;
  currentLocale = next;
  currentBundle = loadUiBundle(next);
}

/** Currently active UI locale code. */
export function getUiLocale(): string {
  return currentLocale;
}

export interface ResolveUiI18nInput {
  /** `--ui-lang` flag value (highest priority). */
  cliOption?: string | null;
  /** `AI_I18N_LANG` environment value. */
  env?: string | null;
  /** Config `uiLanguage` value (lowest priority before host OS default). */
  configOption?: string | null;
}

/** Resolve the UI locale against the shipped manifest (`cli > env > config > host OS`, then fallback). */
export function resolveUiI18n(input: ResolveUiI18nInput): ResolveUiLocaleResult {
  return resolveUiLocale({
    cliOption: input.cliOption,
    env: input.env,
    configOption: input.configOption,
    available: availableUiLocales(),
    sourceLocale: UI_SOURCE_LOCALE,
  });
}

/** Resolve and initialize the active UI locale in one step; returns the chosen locale code. */
export function initUiI18nFrom(input: ResolveUiI18nInput): string {
  const resolved = resolveUiI18n(input);
  initUiI18n(resolved.locale);
  return resolved.locale;
}

/** Environment variable that overrides the tool's UI language (e.g. `AI_I18N_LANG=pt-BR`). */
export const UI_LANG_ENV_VAR = "AI_I18N_LANG";

/**
 * Read the global `--ui-lang` / `-L` value directly from argv, without a full Commander parse.
 * Needed because the UI locale must be resolved before help text is constructed.
 */
export function readUiLangFromArgv(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--ui-lang" || arg === "-L") {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        return next;
      }
      return undefined;
    }
    if (arg.startsWith("--ui-lang=")) {
      return arg.slice("--ui-lang=".length);
    }
    if (arg.startsWith("-L=")) {
      return arg.slice("-L=".length);
    }
  }
  return undefined;
}

/** Requested UI locales we've already warned about, so the warning is emitted at most once each. */
const warnedUnavailableUiLocales = new Set<string>();

/** First non-empty, trimmed value among the explicitly-set sources (`cli > env > config`). */
function firstExplicitUiLocale(input: ResolveUiI18nInput): string | undefined {
  for (const value of [input.cliOption, input.env, input.configOption]) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

/**
 * When the UI locale was explicitly requested via `--ui-lang`/`-L`, `AI_I18N_LANG`, or config
 * `uiLanguage` but no shipped bundle matched (the resolver fell back to the source locale), emit a
 * one-time warning that the default locale will be used. A locale inferred only from the host OS is
 * intentionally never warned about.
 */
function warnIfRequestedUiLocaleUnavailable(
  input: ResolveUiI18nInput,
  resolved: ResolveUiLocaleResult
): void {
  const explicit = firstExplicitUiLocale(input);
  if (!explicit || resolved.matched !== "fallback") {
    return;
  }
  if (warnedUnavailableUiLocales.has(explicit)) {
    return;
  }
  warnedUnavailableUiLocales.add(explicit);
  console.warn(
    chalk.yellow(
      `\n ⚠️  UI language "${explicit}" is not available; using the default (${resolved.locale}).\n`
    )
  );
}

/**
 * Resolve + initialize the UI locale from the process environment (argv `--ui-lang`, `AI_I18N_LANG`),
 * with an optional config `uiLanguage` as the lowest-priority candidate. Returns the chosen locale.
 * Call once at startup (no config), then again after config load passing `configUiLanguage`.
 *
 * Warns (once per requested value) when an explicitly-requested locale is unavailable and the tool
 * falls back to the default locale; locales coming only from the host OS never trigger a warning.
 */
export function initUiI18nFromEnvironment(configUiLanguage?: string | null): string {
  const input: ResolveUiI18nInput = {
    cliOption: readUiLangFromArgv(process.argv.slice(2)),
    env: process.env[UI_LANG_ENV_VAR],
    configOption: configUiLanguage ?? null,
  };
  const resolved = resolveUiI18n(input);
  initUiI18n(resolved.locale);
  warnIfRequestedUiLocaleUnavailable(input, resolved);
  return resolved.locale;
}

function interpolate(text: string, vars?: UiInterpolationVars): string {
  if (!vars) {
    return text;
  }
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Translate a source string to the active UI locale, with optional `{{name}}` interpolation.
 * Returns the (interpolated) source string when no translation exists.
 */
export function t(source: string, vars?: UiInterpolationVars): string {
  const translated = currentBundle[source];
  return interpolate(
    typeof translated === "string" && translated.length > 0 ? translated : source,
    vars
  );
}
