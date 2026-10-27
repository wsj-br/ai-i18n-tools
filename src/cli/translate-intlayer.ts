import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig, StringsJsonEntry, UiConfig } from "../core/types.js";
import { isPluralStringsEntry } from "../core/types.js";
import { normalizeLocale } from "../core/config.js";
import {
  convertIntlayerPlaceholders,
  extractIntlayerContentFile,
  mapIntlayerLocaleToConfig,
  type IntlayerLeaf,
} from "../extractors/intlayer-content-extractor.js";
import {
  writeIntlayerContentFile,
  type IntlayerLeafLocaleUpdate,
} from "../extractors/intlayer-content-writer.js";
import { uiStringHash } from "../extractors/ui-string-locations.js";
import { selectUiBlocks, resolveLocalesForUiBlock } from "../core/ui-blocks.js";
import { collectFilesByExtension } from "./file-utils.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";
import { runTranslateUI } from "./translate-ui-strings.js";
import { TranslationCache } from "../core/cache.js";
import { t } from "../i18n/index.js";

const CONTENT_SUFFIX = ".content.ts";
/** file_tracking key prefix for per-leaf staleness of in-place Intlayer translation. */
const INTLAYER_LEAF_PREFIX = "intlayer-leaf:";

export interface RunTranslateIntlayerOptions {
  cwd: string;
  config: I18nConfig;
  /** Files/dirs/globs to scan (default: `ui.sourceRoots`). */
  paths?: string[];
  /** Raw `-l` / `--locale` value. Resolved against the block's locales. */
  localeFilter?: string;
  /** UI block to seed/translate: index, description, or stringsJson path (default: block 0). */
  uiBlock?: string;
  /** Plan only; do not call an LLM or write any file. */
  dryRun: boolean;
  verbose?: boolean;
  logPath?: string;
  concurrency?: number;
  debugFailed?: boolean;
  /** Test seam: translate the seeded catalog. Defaults to the real `runTranslateUI`. */
  translate?: (config: I18nConfig, opts: TranslateDelegateOptions) => Promise<void>;
}

export interface TranslateDelegateOptions {
  cwd: string;
  locales: string[];
  uiBlock?: string;
  dryRun: boolean;
  verbose: boolean;
  logPath?: string;
  concurrency?: number;
  debugFailed?: boolean;
}

export interface TranslateIntlayerSummary {
  written: boolean;
  dictionaries: number;
  filesChanged: number;
  leavesScanned: number;
  /** leaf × locale pairs sent for translation (missing + stale). */
  pairsTranslated: number;
  pairsMissing: number;
  pairsStale: number;
  localesTouched: string[];
}

interface ContentFilePlan {
  file: string;
  dictKey: string;
  leaves: IntlayerLeaf[];
  /** Original intlayer `{token}` placeholders present in each leaf, keyed by dotPath. */
  tokensByDotPath: Map<string, string[]>;
}

interface LeafLocaleTask {
  file: string;
  dotPath: string;
  /** Config-form target locale (e.g. `pt-BR`). */
  locale: string;
  /** Intlayer-style locale key to write back (reuse an existing key form when present). */
  localeKey: string;
  /** Catalog hash of the (placeholder-converted) source text. */
  hash: string;
  /** Source text converted to `{{token}}` placeholders (catalog form). */
  catalogSource: string;
  /** Tokens to restore back to `{token}` in the written value. */
  tokens: string[];
  reason: "missing" | "stale";
}

/** A leaf+locale already present in the dictionary that has no cached baseline hash yet. */
interface LeafLocaleBaseline {
  file: string;
  dotPath: string;
  locale: string;
  hash: string;
}

interface LeafLocalePlan {
  tasks: LeafLocaleTask[];
  /** Present leaves lacking a tracking hash; baselined after a successful write so future edits read as stale. */
  baselines: LeafLocaleBaseline[];
}

type StringsFile = Record<string, StringsJsonEntry>;

function isContentFile(rel: string): boolean {
  return rel.replace(/\\/g, "/").endsWith(CONTENT_SUFFIX);
}

function collectContentFiles(cwd: string, roots: string[]): string[] {
  return collectFilesByExtension(roots, [".ts"], cwd).filter((f) => isContentFile(f));
}

function translateUiBlock(
  config: I18nConfig,
  selector?: string
): { block: UiConfig; index: number } {
  if (!selector?.trim()) {
    const block = config.ui[0];
    if (!block) {
      throw new Error(t("Config has no ui block."));
    }
    return { block, index: 0 };
  }
  const selected = selectUiBlocks(config, selector);
  return { block: selected[0]!.block, index: selected[0]!.index };
}

function defaultRoots(block: UiConfig, paths: string[] | undefined): string[] {
  if (paths && paths.length > 0) {
    return paths;
  }
  return block.sourceRoots.length > 0 ? block.sourceRoots : ["."];
}

/** Single-brace `{token}` names present in the source (ignores already-doubled `{{token}}`). */
function intlayerTokensInText(text: string): string[] {
  const tokens: string[] = [];
  const re = /(?<!\{)\{([A-Za-z0-9_$.]+)\}(?!\})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    if (name && !tokens.includes(name)) {
      tokens.push(name);
    }
  }
  return tokens;
}

/** Reverse {@link convertIntlayerPlaceholders}: turn `{{token}}` back into `{token}`. */
function restoreIntlayerPlaceholders(text: string, tokens: string[]): string {
  let out = text;
  for (const token of tokens) {
    if (!token) {
      continue;
    }
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\{\\{${escaped}\\}\\}`, "g");
    out = out.replace(re, `{${token}}`);
  }
  return out;
}

function leafTrackingKey(file: string, dotPath: string): string {
  return `${INTLAYER_LEAF_PREFIX}${file.replace(/\\/g, "/")}::${dotPath}`;
}

/** Extract every dictionary and record the catalog hash + original tokens for each leaf. */
function planContentFiles(cwd: string, roots: string[], sourceLocale: string): ContentFilePlan[] {
  const plans: ContentFilePlan[] = [];
  for (const rel of collectContentFiles(cwd, roots)) {
    const abs = path.join(cwd, rel);
    const content = fs.readFileSync(abs, "utf8");
    const extracted = extractIntlayerContentFile(content, rel, sourceLocale);
    if (extracted.leaves.length === 0) {
      continue;
    }
    const tokensByDotPath = new Map<string, string[]>();
    for (const leaf of extracted.leaves) {
      const tokens = intlayerTokensInText(leaf.sourceText);
      tokensByDotPath.set(leaf.dotPath, tokens);
      if (tokens.length > 0) {
        leaf.sourceText = convertIntlayerPlaceholders(leaf.sourceText, tokens);
        leaf.hash = uiStringHash(leaf.sourceText.trim());
      }
    }
    plans.push({
      file: rel,
      dictKey: extracted.dictKey,
      leaves: extracted.leaves,
      tokensByDotPath,
    });
  }
  return plans;
}

/**
 * Decide which leaf × locale pairs need translation. A pair is translated when the leaf has no
 * value for that locale (missing), or when the leaf's source text changed since we last translated
 * it for that locale (stale, detected via the cache's per-leaf file-tracking hash).
 */
function planLeafLocaleTasks(
  plans: ContentFilePlan[],
  sourceLocale: string,
  targets: string[],
  cache: TranslationCache | null
): LeafLocalePlan {
  const tasks: LeafLocaleTask[] = [];
  const baselines: LeafLocaleBaseline[] = [];
  for (const plan of plans) {
    for (const leaf of plan.leaves) {
      const tokens = plan.tokensByDotPath.get(leaf.dotPath) ?? [];
      // Map existing intlayer locale keys onto config targets to detect presence and reuse key form.
      const presentByTarget = new Map<string, string>();
      for (const intKey of Object.keys(leaf.locales)) {
        const mapped = mapIntlayerLocaleToConfig(intKey, sourceLocale, targets);
        if (mapped && leaf.locales[intKey]?.trim()) {
          presentByTarget.set(mapped, intKey);
        }
      }
      for (const locale of targets) {
        const existingKey = presentByTarget.get(locale);
        const trackingKey = leafTrackingKey(plan.file, leaf.dotPath);
        const tracked = cache?.getFileHash(trackingKey, locale) ?? null;
        let reason: "missing" | "stale" | null = null;
        if (!existingKey) {
          reason = "missing";
        } else if (tracked !== null && tracked !== leaf.hash) {
          reason = "stale";
        }
        if (reason === null) {
          if (existingKey && tracked === null) {
            baselines.push({ file: plan.file, dotPath: leaf.dotPath, locale, hash: leaf.hash });
          }
          continue;
        }
        tasks.push({
          file: plan.file,
          dotPath: leaf.dotPath,
          locale,
          localeKey: existingKey ?? locale,
          hash: leaf.hash,
          catalogSource: leaf.sourceText,
          tokens,
          reason,
        });
      }
    }
  }
  return { tasks, baselines };
}

/** Merge the source strings for the pending tasks into the on-disk `strings.json` (keyed by hash). */
function seedCatalog(stringsPath: string, tasks: LeafLocaleTask[]): void {
  let strings: StringsFile = {};
  if (fs.existsSync(stringsPath)) {
    try {
      strings = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as StringsFile;
    } catch {
      strings = {};
    }
  }
  for (const task of tasks) {
    const existing = strings[task.hash];
    if (existing && !isPluralStringsEntry(existing)) {
      existing.source = task.catalogSource;
      existing.translated = existing.translated ?? {};
      continue;
    }
    if (!existing) {
      strings[task.hash] = { source: task.catalogSource, translated: {} };
    }
  }
  writeAtomicUtf8(stringsPath, `${JSON.stringify(strings, null, 2)}\n`);
}

/** Read the translated value for one hash + locale out of the catalog, or `undefined`. */
function translatedValue(strings: StringsFile, hash: string, locale: string): string | undefined {
  const entry = strings[hash];
  if (!entry || isPluralStringsEntry(entry)) {
    return undefined;
  }
  const value = entry.translated?.[locale];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

export async function runTranslateIntlayer(
  opts: RunTranslateIntlayerOptions
): Promise<TranslateIntlayerSummary> {
  const { cwd, config, dryRun } = opts;
  if (!config.features.translateUIStrings) {
    throw new Error(t("Enable features.translateUIStrings in config"));
  }
  const chosen = translateUiBlock(config, opts.uiBlock);
  const roots = defaultRoots(chosen.block, opts.paths);
  const sourceLocale = normalizeLocale(config.sourceLocale);
  const targets = resolveLocalesForUiBlock(config, chosen.block, cwd, opts.localeFilter);

  const plans = planContentFiles(cwd, roots, sourceLocale);
  const leavesScanned = plans.reduce((n, p) => n + p.leaves.length, 0);

  if (opts.verbose) {
    for (const plan of plans) {
      console.log(
        chalk.gray(
          t("• {{file}} ({{key}}): {{leaves}} leaf/leaves", {
            file: plan.file,
            key: plan.dictKey || "?",
            leaves: plan.leaves.length,
          })
        )
      );
    }
  }

  const cacheDirAbs = path.join(cwd, config.cacheDir);
  const cacheDbExists = fs.existsSync(path.join(cacheDirAbs, "cache.db"));

  // Dry run must not create the on-disk cache; read staleness from an existing DB only.
  const cache =
    dryRun && !cacheDbExists ? new TranslationCache(":memory:") : new TranslationCache(cacheDirAbs);

  if (dryRun) {
    try {
      const { tasks } = planLeafLocaleTasks(plans, sourceLocale, targets, cache);
      return {
        written: false,
        dictionaries: plans.length,
        filesChanged: 0,
        leavesScanned,
        pairsTranslated: tasks.length,
        pairsMissing: tasks.filter((x) => x.reason === "missing").length,
        pairsStale: tasks.filter((x) => x.reason === "stale").length,
        localesTouched: [...new Set(tasks.map((x) => x.locale))].sort(),
      };
    } finally {
      cache.close();
    }
  }

  try {
    const { tasks, baselines } = planLeafLocaleTasks(plans, sourceLocale, targets, cache);
    const pairsMissing = tasks.filter((x) => x.reason === "missing").length;
    const pairsStale = tasks.filter((x) => x.reason === "stale").length;
    const touchedLocales = [...new Set(tasks.map((x) => x.locale))].sort();

    // Baseline present-but-untracked leaves so a later source edit is detectable as stale.
    for (const b of baselines) {
      cache.setFileStatus(leafTrackingKey(b.file, b.dotPath), b.locale, b.hash);
    }

    if (tasks.length === 0) {
      console.log(chalk.gray(t("Nothing to translate: all leaves are up to date.")));
      return {
        written: true,
        dictionaries: plans.length,
        filesChanged: 0,
        leavesScanned,
        pairsTranslated: 0,
        pairsMissing: 0,
        pairsStale: 0,
        localesTouched: [],
      };
    }

    const stringsPath = resolveStringsJsonPath(chosen.block, cwd);
    seedCatalog(stringsPath, tasks);

    const translate = opts.translate ?? defaultTranslate;
    await translate(config, {
      cwd,
      locales: touchedLocales,
      uiBlock: String(chosen.index),
      dryRun: false,
      verbose: Boolean(opts.verbose),
      ...(opts.logPath !== undefined ? { logPath: opts.logPath } : {}),
      ...(opts.concurrency !== undefined ? { concurrency: opts.concurrency } : {}),
      debugFailed: Boolean(opts.debugFailed),
    });

    const strings = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as StringsFile;

    // Group applied updates per file so each file is rewritten once.
    const updatesByFile = new Map<string, IntlayerLeafLocaleUpdate[]>();
    const trackingWrites: Array<{ key: string; locale: string; hash: string }> = [];
    let pairsTranslated = 0;

    for (const task of tasks) {
      const value = translatedValue(strings, task.hash, task.locale);
      if (value === undefined) {
        continue;
      }
      const restored = restoreIntlayerPlaceholders(value, task.tokens);
      const list = updatesByFile.get(task.file) ?? [];
      list.push({ dotPath: task.dotPath, localeKey: task.localeKey, text: restored });
      updatesByFile.set(task.file, list);
      trackingWrites.push({
        key: leafTrackingKey(task.file, task.dotPath),
        locale: task.locale,
        hash: task.hash,
      });
      pairsTranslated++;
    }

    let filesChanged = 0;
    for (const [file, updates] of updatesByFile) {
      const abs = path.join(cwd, file);
      const source = fs.readFileSync(abs, "utf8");
      const result = writeIntlayerContentFile(source, updates);
      if (result.changed) {
        writeAtomicUtf8(abs, result.output);
        filesChanged++;
        console.log(
          chalk.cyan(
            t("• {{file}}: {{count}} locale leaf/leaves written", {
              file,
              count: result.appliedDotPaths.length,
            })
          )
        );
      }
      if (result.missingDotPaths.length > 0 && opts.verbose) {
        console.log(
          chalk.yellow(
            t("  ⚠️  {{file}}: {{count}} leaf/leaves not found for write-back", {
              file,
              count: result.missingDotPaths.length,
            })
          )
        );
      }
    }

    for (const w of trackingWrites) {
      cache.setFileStatus(w.key, w.locale, w.hash);
    }

    return {
      written: true,
      dictionaries: plans.length,
      filesChanged,
      leavesScanned,
      pairsTranslated,
      pairsMissing,
      pairsStale,
      localesTouched: touchedLocales,
    };
  } finally {
    cache.close();
  }
}

async function defaultTranslate(config: I18nConfig, opts: TranslateDelegateOptions): Promise<void> {
  await runTranslateUI(config, {
    cwd: opts.cwd,
    locales: opts.locales,
    force: false,
    dryRun: opts.dryRun,
    verbose: opts.verbose,
    ...(opts.logPath !== undefined ? { logPath: opts.logPath } : {}),
    ...(opts.uiBlock !== undefined ? { uiBlock: opts.uiBlock } : {}),
    ...(opts.concurrency !== undefined ? { concurrency: opts.concurrency } : {}),
    ...(opts.debugFailed !== undefined ? { debugFailed: opts.debugFailed } : {}),
  });
}
