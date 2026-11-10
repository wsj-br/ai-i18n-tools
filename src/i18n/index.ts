/**
 * Lightweight self-localization runtime for the tool's OWN user interface (CLI logs, help, dashboard).
 *
 * Deliberately avoids i18next (not a CLI dependency) to keep startup cheap. UI strings are looked up
 * in a flat per-locale bundle keyed by the English source text (the same shape `translate-ui` emits),
 * shipped under `./locales/<code>.json` next to this module (copied into `dist/i18n/locales` at build).
 *
 * Source locale is English; when no bundle/key matches, `t()` returns the source string unchanged.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { resolveUiLocale, type ResolveUiLocaleResult } from "../core/ui-locale.js";
import { readUiLocaleAsset } from "../core/sea-assets.js";
import { displayWidth } from "../utils/table.js";

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
    const raw = readUiLocaleAsset("ui-languages.json", file);
    if (raw === null) {
      manifestCache = [];
      return manifestCache;
    }
    const data = JSON.parse(raw) as unknown;
    manifestCache = Array.isArray(data) ? (data as UiLanguageManifestRow[]) : [];
  } catch {
    manifestCache = [];
  }
  return manifestCache;
}

/** Available UI locale codes (from the manifest); always includes the source locale. */
export function availableUiLocales(): string[] {
  return availableUiLanguageChoices().map((choice) => choice.code);
}

/** One shipped UI language the `-L` / `--ui-lang` flag can select. */
export interface AvailableUiLanguageChoice {
  code: string;
  /** English catalog name, or the native label when no English name is shipped. */
  name: string;
  /** Native label when it differs from `name`. */
  nativeName?: string;
}

/** Shipped UI languages in manifest order, always including the source locale. */
export function availableUiLanguageChoices(): AvailableUiLanguageChoice[] {
  const choices: AvailableUiLanguageChoice[] = [];
  for (const row of loadUiManifest()) {
    if (typeof row.code !== "string" || row.code.length === 0) {
      continue;
    }
    const english = row.englishName?.trim() ?? "";
    const native = row.label?.trim() ?? "";
    const name = english || native || row.code;
    const nativeName = native && native !== name ? native : undefined;
    choices.push({ code: row.code, name, nativeName });
  }
  if (!choices.some((choice) => choice.code === UI_SOURCE_LOCALE)) {
    return [{ code: UI_SOURCE_LOCALE, name: UI_SOURCE_LOCALE }, ...choices];
  }
  return choices;
}

/** Native label, then the English name, when the manifest has both and they differ. */
export function formatAvailableUiLanguageName(choice: AvailableUiLanguageChoice): string {
  return choice.nativeName ? `${choice.nativeName} — ${choice.name}` : choice.name;
}

/** Comma-separated `code (English name)` list for option help. */
export function formatAvailableUiLanguagesInline(): string {
  return availableUiLanguageChoices()
    .map((choice) => `${choice.code} (${choice.name})`)
    .join(", ");
}

/** Aligned `code  name` lines for a bare `-L` / `--ui-lang` (no code). */
export function formatAvailableUiLanguagesBlock(): string {
  const choices = availableUiLanguageChoices();
  const width = Math.max(1, ...choices.map((choice) => choice.code.length));
  return choices
    .map((choice) => `  ${choice.code.padEnd(width)}  ${formatAvailableUiLanguageName(choice)}`)
    .join("\n");
}

/** Native label when the manifest has one, otherwise the English catalog name. */
function availableUiLanguageShortName(choice: AvailableUiLanguageChoice): string {
  return choice.nativeName ?? choice.name;
}

const UI_LANGUAGE_LIST_WIDTH = 80;
const UI_LANGUAGE_LIST_INDENT = "  ";

/**
 * Wrap comma-separated items so each line, including its indent, stays within `maxWidth`
 * terminal columns. A single item wider than that limit is left intact on its own line.
 */
function wrapIndentedCommaList(items: string[], maxWidth: number, indent: string): string {
  const first = items[0];
  if (first === undefined) {
    return "";
  }
  const indentWidth = displayWidth(indent);
  const lines: string[] = [];
  let line = first;
  let width = indentWidth + displayWidth(first);
  for (const item of items.slice(1)) {
    const addition = `, ${item}`;
    const additionWidth = displayWidth(addition);
    if (width + additionWidth > maxWidth) {
      lines.push(`${indent}${line}`);
      line = item;
      width = indentWidth + displayWidth(item);
      continue;
    }
    line += addition;
    width += additionWidth;
  }
  lines.push(`${indent}${line}`);
  return lines.join("\n");
}

/**
 * Comma-separated `code - native name` list for root help, wrapped at 80 columns.
 * Every line, including the first, is indented by two spaces.
 */
export function formatAvailableUiLanguagesWrapped(): string {
  const items = availableUiLanguageChoices().map(
    (choice) => `${choice.code} - ${availableUiLanguageShortName(choice)}`
  );
  return wrapIndentedCommaList(items, UI_LANGUAGE_LIST_WIDTH, UI_LANGUAGE_LIST_INDENT);
}

function availableUiLanguagesHeading(): string {
  return t("Available languages for -L / --ui-lang:");
}

/** Heading plus the aligned language table (bare `-L` / `--ui-lang`). */
export function availableUiLanguagesNotice(): string {
  return `${availableUiLanguagesHeading()}\n${formatAvailableUiLanguagesBlock()}`;
}

/** Heading plus the wrapped language list for root help. */
export function availableUiLanguagesHelpNotice(): string {
  return `${availableUiLanguagesHeading()}\n${formatAvailableUiLanguagesWrapped()}`;
}

const UI_LANG_MISSING_ARGUMENT = "option '-L, --ui-lang <code>' argument missing";

/**
 * When Commander reports a missing `-L` / `--ui-lang` value, append the shipped UI languages.
 * Other error text is returned unchanged.
 */
export function withAvailableUiLanguagesOnMissingUiLang(message: string): string {
  if (!message.includes(UI_LANG_MISSING_ARGUMENT)) {
    return message;
  }
  const trimmed = message.endsWith("\n") ? message.slice(0, -1) : message;
  return `${trimmed}\n${availableUiLanguagesNotice()}\n`;
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
    const raw = readUiLocaleAsset(`${locale}.json`, file);
    if (raw === null) {
      return {};
    }
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

function catalogText(key: string): string | undefined {
  const value = currentBundle[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Put the call's leading and trailing whitespace back around a trimmed catalog hit. */
function withSourceEdges(source: string, text: string): string {
  const core = source.trim();
  if (!core || core === source) {
    return text;
  }
  const start = source.indexOf(core);
  return `${source.slice(0, start)}${text}${source.slice(start + core.length)}`;
}

/**
 * Translate a source string to the active UI locale, with optional `{{name}}` interpolation.
 * Returns the (interpolated) source string when no translation exists.
 *
 * The lookup is the literal, including a leading or trailing space. A catalog row extracted
 * before that still has the trimmed text, so a miss tries that row and keeps the call's spaces.
 */
export function t(source: string, vars?: UiInterpolationVars): string {
  const direct = catalogText(source);
  if (direct !== undefined) {
    return interpolate(direct, vars);
  }
  const core = source.trim();
  if (core && core !== source) {
    const fallback = catalogText(core);
    if (fallback !== undefined) {
      return interpolate(withSourceEdges(source, fallback), vars);
    }
  }
  return interpolate(source, vars);
}
