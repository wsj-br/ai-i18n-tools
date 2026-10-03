import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import chalk from "chalk";
import { t } from "../i18n/index.js";
import { TranslationCache } from "../core/cache.js";
import { normalizeLocale, toDocTranslateConfig } from "../core/config.js";
import type { I18nConfig, StringsJsonEntry } from "../core/types.js";
import { isFumadocsDotParser } from "../core/fumadocs-parser.js";
import { collectFilesByExtension } from "./file-utils.js";
import { filterGeneratedHtmlOutputs, htmlOutputLocales } from "../core/html-source-filter.js";
import { resolveStringsJsonPath, resolveTranslatedOutputPath, writeAtomicUtf8 } from "./helpers.js";
import { selectUiBlocks } from "../core/ui-blocks.js";

type StringsFile = Record<string, StringsJsonEntry>;

export type RunPurgeLocaleOptions = {
  /** Absolute path to the translation cache directory (contains `cache.db`). */
  cacheDir: string;
  /** Raw locale codes from `--locale`; normalized and deduped inside. */
  locales: string[];
  /** When true, only report what would be deleted; do not delete. */
  dryRun?: boolean;
  /** When true, delete without prompting. Ignored when `dryRun` is true. */
  force?: boolean;
  /** Absolute path for a SQLite backup written before any deletion. No backup unless set. */
  backupPath?: string;
  /** Loaded config; required to remove generated files / `strings.json` entries. */
  config?: I18nConfig;
  /** Project root (cwd used to resolve output paths). Required alongside `config` for file ops. */
  projectRoot?: string;
  /** When true, only purge the SQLite cache; leave generated files and `strings.json` untouched. */
  keepFiles?: boolean;
  /** Index, description, or stringsJson path. Omit to purge every UI block with sourceRoots. */
  uiBlock?: string;
};

type LocaleWork = {
  locale: string;
  translations: number;
  fileTracking: number;
  failures: number;
  /** Existing translated document outputs (absolute paths) for this locale. */
  docFiles: string[];
  /** Existing generated flat `<locale>.json` UI files (absolute paths). */
  flatFiles: string[];
  /** Number of `strings.json` entries holding a translation for this locale. */
  stringsEntries: number;
};

function cacheTotal(work: LocaleWork): number {
  return work.translations + work.fileTracking + work.failures;
}

function hasWork(work: LocaleWork): boolean {
  return (
    cacheTotal(work) > 0 ||
    work.docFiles.length > 0 ||
    work.flatFiles.length > 0 ||
    work.stringsEntries > 0
  );
}

const DOC_EXTENSIONS = new Set([".md", ".mdx", ".astro", ".html", ".htm"]);

/** Recursively list files under `dir` whose lowercase extension is in `exts` (missing dir → []). */
function listFilesRecursive(dir: string, exts: Set<string>): string[] {
  const out: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...listFilesRecursive(full, exts));
    } else if (ent.isFile() && exts.has(path.extname(ent.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Sweep the output tree on disk for translated documents belonging to `locale`, including orphans
 * whose source file no longer exists. Skipped when a custom `pathTemplate` is set (layout is
 * arbitrary, so we cannot reliably attribute files to a locale — source-driven resolution covers
 * the still-present sources). For `flat` style the locale is a filename suffix (`<stem>.<locale><ext>`);
 * for the per-locale-directory styles every document under `outputDir/<locale>/` belongs to it.
 */
function sweepLocaleDocOutputsOnDisk(
  config: I18nConfig,
  block: I18nConfig["docs"][number],
  projectRoot: string,
  locale: string
): string[] {
  const view = toDocTranslateConfig(config, block);
  const mo = view.doc.docsOutput;
  if (mo.pathTemplate?.trim()) {
    return [];
  }
  const outBase = path.resolve(projectRoot, view.doc.outputDir);
  const localeSeg = (mo.localePathLowercase ?? false) ? locale.toLowerCase() : locale;

  if (mo.style === "flat" || isFumadocsDotParser(mo)) {
    return listFilesRecursive(outBase, DOC_EXTENSIONS).filter((f) => {
      const base = path.basename(f);
      const ext = path.extname(base);
      const stem = base.slice(0, base.length - ext.length);
      return stem.endsWith(`.${localeSeg}`);
    });
  }
  return listFilesRecursive(path.join(outBase, localeSeg), DOC_EXTENSIONS);
}

/**
 * Collect existing translated markdown/mdx/astro document outputs for one locale across docs blocks.
 * Unions source-driven resolution (current sources, works for custom path templates) with an on-disk
 * sweep (catches orphaned outputs whose source was removed).
 */
function collectTranslatedDocOutputs(
  config: I18nConfig,
  projectRoot: string,
  locale: string
): string[] {
  const found = new Set<string>();
  for (const block of config.docs ?? []) {
    const view = toDocTranslateConfig(config, block);
    const sources = collectFilesByExtension(
      block.contentPaths,
      [".md", ".mdx", ".astro"],
      projectRoot
    );
    for (const rel of sources) {
      const out = resolveTranslatedOutputPath(view, projectRoot, locale, rel, "markdown");
      if (fs.existsSync(out)) {
        found.add(path.resolve(out));
      }
    }
    const htmlSources = filterGeneratedHtmlOutputs(
      collectFilesByExtension(block.contentPaths, [".html", ".htm"], projectRoot),
      [block.outputDir],
      htmlOutputLocales(config.sourceLocale, config.targetLocales)
    );
    for (const rel of htmlSources) {
      const out = resolveTranslatedOutputPath(view, projectRoot, locale, rel, "html");
      if (fs.existsSync(out)) {
        found.add(path.resolve(out));
      }
    }
    for (const out of sweepLocaleDocOutputsOnDisk(config, block, projectRoot, locale)) {
      found.add(path.resolve(out));
    }
  }
  return [...found];
}

function flatLocaleFiles(
  config: I18nConfig,
  projectRoot: string,
  locale: string,
  selector?: string
): string[] {
  const files: string[] = [];
  for (const item of selectUiBlocks(config, selector)) {
    const flatDir = item.block.flatOutputDir?.trim();
    if (!flatDir) {
      continue;
    }
    const filePath = path.join(projectRoot, flatDir, `${locale}.json`);
    if (fs.existsSync(filePath)) {
      files.push(filePath);
    }
  }
  return files;
}

function readUiCatalogs(
  config: I18nConfig,
  projectRoot: string,
  selector?: string
): Array<{ path: string; doc: StringsFile }> {
  const catalogs: Array<{ path: string; doc: StringsFile }> = [];
  for (const item of selectUiBlocks(config, selector)) {
    const stringsPath = resolveStringsJsonPath(item.block, projectRoot);
    const doc = readStringsJson(stringsPath);
    if (doc) {
      catalogs.push({ path: stringsPath, doc });
    }
  }
  return catalogs;
}

function readStringsJson(stringsPath: string): StringsFile | null {
  if (!fs.existsSync(stringsPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(stringsPath, "utf8")) as StringsFile;
  } catch {
    return null;
  }
}

function countLocaleInStrings(strings: StringsFile, locale: string): number {
  let count = 0;
  for (const entry of Object.values(strings)) {
    if (entry.translated && entry.translated[locale] !== undefined) {
      count++;
    }
  }
  return count;
}

/** Remove the given locales from every `strings.json` entry's `translated`/`models` maps. */
function removeLocalesFromStrings(strings: StringsFile, locales: readonly string[]): number {
  let removed = 0;
  for (const entry of Object.values(strings)) {
    for (const locale of locales) {
      if (entry.translated && entry.translated[locale] !== undefined) {
        delete entry.translated[locale];
        removed++;
      }
      if (entry.models && entry.models[locale] !== undefined) {
        delete entry.models[locale];
      }
    }
  }
  return removed;
}

async function promptPurgeConfirmed(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = await rl.question(
      chalk.red(t("\nDelete cached translations and generated files for these locales? (y/n) "))
    );
    return ans === "y";
  } finally {
    rl.close();
  }
}

/**
 * Deletes all `translations`, `file_tracking`, and `translation_failures` rows for the given
 * locale(s). Unless `keepFiles` is set (and when `config` + `projectRoot` are provided), it also
 * removes generated translated document outputs (`.md` / `.mdx` / `.astro`), the per-locale flat
 * UI file (`<locale>.json`), and the locale's entries in `strings.json`. Prints per-locale counts,
 * warns (does not error) for locales with nothing to purge, and prompts unless `force` or `dryRun`.
 */
export async function runPurgeLocale(opts: RunPurgeLocaleOptions): Promise<void> {
  const normalized = Array.from(new Set(opts.locales.map((l) => normalizeLocale(l))));
  if (normalized.length === 0) {
    console.error(chalk.red(t("No locales provided. Pass at least one -l / --locale <code>.")));
    process.exitCode = 1;
    return;
  }

  const doFileOps = !opts.keepFiles && Boolean(opts.config) && Boolean(opts.projectRoot);
  const dryTag = opts.dryRun ? t(" (dry-run)") : "";

  // Read strings.json once up front so per-locale counts and the eventual removal share one object.
  const catalogs =
    doFileOps && opts.config && opts.projectRoot
      ? readUiCatalogs(opts.config, opts.projectRoot, opts.uiBlock)
      : [];

  const cache = new TranslationCache(opts.cacheDir);
  try {
    const allWork: LocaleWork[] = [];
    for (const locale of normalized) {
      const counts = cache.countLocaleRows(locale);
      const docFiles =
        doFileOps && opts.config && opts.projectRoot
          ? collectTranslatedDocOutputs(opts.config, opts.projectRoot, locale)
          : [];
      const flatFiles =
        doFileOps && opts.config && opts.projectRoot
          ? flatLocaleFiles(opts.config, opts.projectRoot, locale, opts.uiBlock)
          : [];
      const stringsEntries = catalogs.reduce(
        (sum, catalog) => sum + countLocaleInStrings(catalog.doc, locale),
        0
      );
      allWork.push({ locale, ...counts, docFiles, flatFiles, stringsEntries });
    }

    const purgeable: LocaleWork[] = [];
    for (const work of allWork) {
      if (!hasWork(work)) {
        console.log(
          chalk.yellow(
            t("[purge-locale] {{locale}}: nothing to purge; skipping", { locale: work.locale })
          )
        );
        continue;
      }
      purgeable.push(work);
      console.log(
        t(
          "[purge-locale] {{locale}}: translations={{translations}}, file_tracking={{fileTracking}}, translation_failures={{failures}}, documents={{documents}}, strings.json={{strings}}, flat_file={{flat}}",
          {
            locale: work.locale,
            translations: work.translations,
            fileTracking: work.fileTracking,
            failures: work.failures,
            documents: work.docFiles.length,
            strings: work.stringsEntries,
            flat: work.flatFiles.length,
          }
        ) + dryTag
      );
      if (opts.dryRun) {
        for (const f of work.docFiles) {
          console.log(chalk.gray(`    - ${f}`));
        }
        if (work.flatFiles.length > 0) {
          for (const flatFile of work.flatFiles) {
            console.log(chalk.gray(`    - ${flatFile}`));
          }
        }
      }
    }

    if (purgeable.length === 0) {
      console.log(chalk.green(t("[purge-locale] Nothing to purge.")));
      return;
    }

    if (opts.dryRun) {
      console.log(chalk.gray(t("[purge-locale] Dry run mode: nothing was deleted.")));
      return;
    }

    if (!opts.force) {
      const ok = await promptPurgeConfirmed();
      if (!ok) {
        console.log(chalk.gray(t("[purge-locale] Aborted; nothing was deleted.")));
        return;
      }
    }

    if (opts.backupPath) {
      await cache.backupTo(opts.backupPath);
      console.log(t("[purge-locale] Backup → {{path}}", { path: opts.backupPath }));
    }

    for (const work of purgeable) {
      cache.clear(work.locale);

      let deletedFiles = 0;
      if (doFileOps) {
        for (const f of [...work.docFiles, ...work.flatFiles]) {
          try {
            fs.rmSync(f, { force: true });
            deletedFiles++;
          } catch (e) {
            console.error(
              t("[purge-locale] Failed to delete {{file}}: {{error}}", {
                file: f,
                error: e instanceof Error ? e.message : String(e),
              })
            );
            process.exitCode = 1;
          }
        }
      }

      console.log(
        chalk.blue(
          t("[purge-locale] {{locale}}: purged {{count}} cache row(s), {{files}} file(s)", {
            locale: work.locale,
            count: cacheTotal(work),
            files: deletedFiles,
          })
        )
      );
    }

    if (doFileOps && catalogs.length > 0) {
      let removed = 0;
      const locales = purgeable.map((work) => work.locale);
      for (const catalog of catalogs) {
        const cleared = removeLocalesFromStrings(catalog.doc, locales);
        if (cleared > 0) {
          writeAtomicUtf8(catalog.path, `${JSON.stringify(catalog.doc, null, 2)}\n`);
          removed += cleared;
        }
      }
      if (removed > 0) {
        console.log(
          chalk.blue(
            t("[purge-locale] Cleared {{count}} strings.json entr(ies) across purged locales", {
              count: removed,
            })
          )
        );
      }
    }
  } finally {
    cache.close();
  }
}
