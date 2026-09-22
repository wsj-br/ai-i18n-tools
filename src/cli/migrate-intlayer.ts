import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig, Segment, SegmentTranslationMapValue } from "../core/types.js";
import { UIStringExtractor } from "../extractors/ui-string-extractor.js";
import { uiStringHash } from "../extractors/ui-string-locations.js";
import {
  convertIntlayerPlaceholders,
  extractIntlayerContentFile,
  mapIntlayerLocaleToConfig,
  type IntlayerDictionaryExtract,
  type IntlayerLeaf,
  type UnsupportedIntlayerLeaf,
} from "../extractors/intlayer-content-extractor.js";
import {
  codemodIntlayerUsages,
  findIntlayerLeftovers,
  refreshReviewAfterLeafConversion,
  relativeTImport,
  type IntlayerLeftover,
  type ManualReviewSite,
  type SafeRewrite,
} from "../extractors/intlayer-usage-codemod.js";
import { resolveLanguagesManifestAbsPath } from "../core/ui-languages.js";
import { collectFilesByExtension } from "./file-utils.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";
import {
  buildMigrateIntlayerReport,
  renderRuntimeBootstrap,
  type CatalogKeyChange,
} from "./migrate-intlayer-report.js";
import { t } from "../i18n/index.js";

export interface RunMigrateIntlayerOptions {
  cwd: string;
  config: I18nConfig;
  /** Files/dirs/globs to scan (content + usage). Default: `ui.sourceRoots` or `.`. */
  paths?: string[];
  contentGlob?: string;
  write: boolean;
  reportPath?: string;
  tImport?: string;
  verbose?: boolean;
}

export interface MigrateIntlayerSummary {
  written: boolean;
  filesScanned: number;
  filesChanged: number;
  leavesImported: number;
  dictionaries: number;
  rewrites: number;
  reviews: number;
  reportPath: string;
  stringsJsonPath: string;
}

const CONTENT_SUFFIX = ".content.ts";
const USAGE_EXT = [".ts", ".tsx", ".js", ".jsx"];

function defaultRoots(config: I18nConfig, paths: string[] | undefined): string[] {
  if (paths && paths.length > 0) {
    return paths;
  }
  const roots = config.ui?.sourceRoots ?? [];
  return roots.length > 0 ? roots : ["."];
}

function isContentFile(rel: string): boolean {
  return rel.replace(/\\/g, "/").endsWith(CONTENT_SUFFIX);
}

function projectRelative(cwd: string, filePath: string): string {
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
  return path.relative(cwd, abs).split(path.sep).join("/");
}

function moduleSpecifier(fromFile: string, toFile: string): string {
  const fromDir = path.posix.dirname(fromFile.replace(/\\/g, "/"));
  let rel = path.posix.relative(fromDir, toFile.replace(/\\/g, "/"));
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }
  return rel;
}

function collectContentFiles(cwd: string, roots: string[]): string[] {
  const files = collectFilesByExtension(roots, [".ts"], cwd);
  return files.filter((f) => isContentFile(f));
}

function collectUsageFiles(cwd: string, roots: string[]): string[] {
  const files = collectFilesByExtension(roots, USAGE_EXT, cwd);
  return files.filter((f) => !isContentFile(f) && !f.endsWith(".d.ts"));
}

function findI18nBootstrap(cwd: string): string | undefined {
  const candidates = [
    "src/i18n.ts",
    "src/i18n.tsx",
    "src/i18n.js",
    "src/lib/i18n.ts",
    "src/lib/i18n.js",
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(cwd, c))) {
      return c;
    }
  }
  return undefined;
}

function applyInterpolationConversions(
  leaves: IntlayerLeaf[],
  rewrites: SafeRewrite[]
): Array<{ dictKey: string; dotPath: string; tokens: string[]; from: string; to: string }> {
  const tokensByLeaf = new Map<string, Set<string>>();
  for (const r of rewrites) {
    if (r.kind !== "replace" || !r.token) {
      continue;
    }
    const k = `${r.dictKey}\0${r.dotPath}`;
    const set = tokensByLeaf.get(k) ?? new Set<string>();
    set.add(r.token);
    tokensByLeaf.set(k, set);
  }
  const conversions: Array<{
    dictKey: string;
    dotPath: string;
    tokens: string[];
    from: string;
    to: string;
  }> = [];
  for (const leaf of leaves) {
    const tokens = [...(tokensByLeaf.get(`${leaf.dictKey}\0${leaf.dotPath}`) ?? [])];
    if (tokens.length === 0) {
      continue;
    }
    const from = leaf.sourceText;
    const to = convertIntlayerPlaceholders(from, tokens);
    if (to === from) {
      continue;
    }
    leaf.sourceText = to;
    leaf.hash = uiStringHash(to.trim());
    for (const loc of Object.keys(leaf.locales)) {
      leaf.locales[loc] = convertIntlayerPlaceholders(leaf.locales[loc]!, tokens);
    }
    conversions.push({ dictKey: leaf.dictKey, dotPath: leaf.dotPath, tokens, from, to });
  }
  return conversions;
}

function seedStringsAndFlat(
  cwd: string,
  config: I18nConfig,
  leaves: IntlayerLeaf[],
  write: boolean
): { stringsJsonPath: string; imported: number } {
  const stringsJsonPath = resolveStringsJsonPath(config, cwd);
  const extractor = new UIStringExtractor(undefined, { cwd });
  const seen = new Map<string, IntlayerLeaf>();
  for (const leaf of leaves) {
    if (!seen.has(leaf.hash)) {
      seen.set(leaf.hash, leaf);
    }
  }
  const unique = [...seen.values()];
  const segments: Segment[] = unique.map((leaf, i) => ({
    id: `ui-intlayer-${i}`,
    type: "ui-string",
    content: leaf.sourceText,
    hash: leaf.hash,
    translatable: true,
    startLine: leaf.line,
  }));

  const translationsByLocale: Record<string, Map<string, SegmentTranslationMapValue>> = {};
  const sourceLocale = config.sourceLocale;
  const targets = config.targetLocales ?? [];
  for (const leaf of unique) {
    for (const [intKey, text] of Object.entries(leaf.locales)) {
      const mapped = mapIntlayerLocaleToConfig(intKey, sourceLocale, targets);
      if (!mapped || !text.trim()) {
        continue;
      }
      const map = translationsByLocale[mapped] ?? new Map();
      map.set(leaf.hash, text);
      translationsByLocale[mapped] = map;
    }
  }

  const body = extractor.buildStringsJson(
    segments,
    translationsByLocale,
    fs.existsSync(stringsJsonPath) ? stringsJsonPath : undefined
  );

  if (write) {
    writeAtomicUtf8(stringsJsonPath, body);
    const outDir = path.join(cwd, config.ui.flatOutputDir);
    fs.mkdirSync(outDir, { recursive: true });
    const parsed = JSON.parse(body) as Record<
      string,
      { source?: string; translated?: Record<string, string> }
    >;
    const byLocale = new Map<string, Record<string, string>>();
    for (const entry of Object.values(parsed)) {
      const src = entry.source ?? "";
      if (!src.trim()) {
        continue;
      }
      for (const [loc, tx] of Object.entries(entry.translated ?? {})) {
        if (!tx || !String(tx).trim()) {
          continue;
        }
        const flat = byLocale.get(loc) ?? {};
        flat[src] = tx;
        byLocale.set(loc, flat);
      }
    }
    for (const [loc, flat] of byLocale) {
      writeAtomicUtf8(path.join(outDir, `${loc}.json`), `${JSON.stringify(flat, null, 2)}\n`);
    }
  }

  return { stringsJsonPath, imported: unique.length };
}

/**
 * Extract Intlayer dictionaries, seed `strings.json` / flat locale files, and
 * safely rewrite `useIntlayer` / `getIntlayer` call sites. Dry-run by default.
 */
export function runMigrateIntlayer(opts: RunMigrateIntlayerOptions): MigrateIntlayerSummary {
  const { cwd, config, write } = opts;
  const roots = defaultRoots(config, opts.paths);
  void opts.contentGlob;
  const contentFiles = collectContentFiles(cwd, roots);
  const usageFiles = collectUsageFiles(cwd, roots);

  const dictionaries: IntlayerDictionaryExtract[] = [];
  const unsupportedLeaves: UnsupportedIntlayerLeaf[] = [];
  const allLeaves: IntlayerLeaf[] = [];

  for (const rel of contentFiles) {
    const abs = path.join(cwd, rel);
    const content = fs.readFileSync(abs, "utf8");
    const extracted = extractIntlayerContentFile(content, rel, config.sourceLocale);
    dictionaries.push(extracted);
    allLeaves.push(...extracted.leaves);
    unsupportedLeaves.push(...extracted.unsupported);
    if (opts.verbose) {
      console.log(
        chalk.gray(
          t("• {{file}} ({{key}}): {{leaves}} leaf/leaves", {
            file: rel,
            key: extracted.dictKey || "?",
            leaves: extracted.leaves.length,
          })
        )
      );
    }
  }

  const bootstrap = findI18nBootstrap(cwd);

  const rewrites: SafeRewrite[] = [];
  const reviews: ManualReviewSite[] = [];
  const leftovers: IntlayerLeftover[] = [];
  let filesChanged = 0;

  for (const rel of usageFiles) {
    const abs = path.join(cwd, rel);
    const source = fs.readFileSync(abs, "utf8");
    const specifier =
      opts.tImport ?? (bootstrap ? relativeTImport(rel.replace(/\\/g, "/"), bootstrap) : "i18next");
    const result = codemodIntlayerUsages({
      file: rel,
      source,
      leaves: allLeaves,
      tImportSpecifier: specifier,
    });
    rewrites.push(...result.rewrites);
    reviews.push(...result.reviews);
    leftovers.push(...findIntlayerLeftovers(rel, result.output));
    if (result.changed) {
      filesChanged++;
      if (write) {
        writeAtomicUtf8(abs, result.output);
      }
      const verb = write ? t("updated") : t("would update");
      console.log(
        chalk.cyan(
          t("• {{file}}: {{verb}} ({{rewrites}} rewrite(s), {{reviews}} manual)", {
            file: rel,
            verb,
            rewrites: result.rewrites.length,
            reviews: result.reviews.length,
          })
        )
      );
    } else if (result.reviews.length > 0) {
      console.log(
        chalk.yellow(
          t("• {{file}}: {{count}} manual-review site(s)", {
            file: rel,
            count: result.reviews.length,
          })
        )
      );
    } else if (opts.verbose) {
      console.log(chalk.gray(t("• {{file}}: no changes", { file: rel })));
    }
  }

  const sourceBeforeConversion = new Map<string, string>(
    allLeaves.map((leaf) => [`${leaf.dictKey}\0${leaf.dotPath}`, leaf.sourceText])
  );
  const interpolationConversions = applyInterpolationConversions(allLeaves, rewrites);
  // Re-apply sourceText on replace rewrites after conversion so the catalog hash matches.
  for (const r of rewrites) {
    const leaf = allLeaves.find((l) => l.dictKey === r.dictKey && l.dotPath === r.dotPath);
    if (leaf) {
      r.sourceText = leaf.sourceText;
    }
  }
  for (const review of reviews) {
    for (const suggestion of review.suggestions) {
      if (!suggestion.dotPath) {
        continue;
      }
      const key = `${review.dictKey}\0${suggestion.dotPath}`;
      const previous = sourceBeforeConversion.get(key);
      const leaf = allLeaves.find(
        (item) => item.dictKey === review.dictKey && item.dotPath === suggestion.dotPath
      );
      if (!leaf || previous === undefined || leaf.sourceText === previous) {
        continue;
      }
      refreshReviewAfterLeafConversion(review, suggestion.dotPath, previous, leaf.sourceText);
    }
  }
  const catalogKeyChanges: CatalogKeyChange[] = [];
  const seenCatalogChange = new Set<string>();
  for (const review of reviews) {
    for (const suggestion of review.suggestions) {
      if (!suggestion.dotPath) {
        continue;
      }
      const leaf = allLeaves.find(
        (item) => item.dictKey === review.dictKey && item.dotPath === suggestion.dotPath
      );
      if (!leaf || suggestion.sourceText.trim() === leaf.sourceText.trim()) {
        continue;
      }
      const id = `${review.file}:${review.line}:${suggestion.dotPath}`;
      if (seenCatalogChange.has(id)) {
        continue;
      }
      seenCatalogChange.add(id);
      catalogKeyChanges.push({
        file: review.file,
        line: review.line,
        dictKey: review.dictKey,
        dotPath: suggestion.dotPath,
        seededSource: leaf.sourceText,
        nextSource: suggestion.sourceText.trim(),
      });
    }
  }

  const seeded = seedStringsAndFlat(cwd, config, allLeaves, write);
  const reportRel = opts.reportPath ?? "migrate-intlayer-report.md";
  const reportAbs = path.isAbsolute(reportRel) ? reportRel : path.join(cwd, reportRel);
  const stringsJsonPath = path.relative(cwd, seeded.stringsJsonPath) || seeded.stringsJsonPath;
  const bootstrapFile = bootstrap ?? "src/i18n.ts";
  const manifestAbs =
    resolveLanguagesManifestAbsPath(config, cwd) ??
    path.join(cwd, config.ui.flatOutputDir, "ui-languages.json");
  const stringsRel = projectRelative(cwd, seeded.stringsJsonPath);
  const manifestRel = projectRelative(cwd, manifestAbs);
  const localeDirRel = path.posix.dirname(stringsRel);
  const runtimeCode = renderRuntimeBootstrap({
    sourceLocale: config.sourceLocale,
    targetLocales: config.targetLocales,
    stringsImport: moduleSpecifier(bootstrapFile, stringsRel),
    uiLanguagesImport: moduleSpecifier(bootstrapFile, manifestRel),
    localeDirImport: moduleSpecifier(bootstrapFile, localeDirRel),
  });
  const report = buildMigrateIntlayerReport({
    written: write,
    leavesImported: seeded.imported,
    dictionaries,
    unsupportedLeaves,
    rewrites,
    reviews,
    interpolationConversions,
    filesChanged,
    filesScanned: usageFiles.length,
    stringsJsonPath,
    flatOutputDir: config.ui.flatOutputDir,
    reportPath: path.relative(cwd, reportAbs) || reportAbs,
    contentFiles: dictionaries.map((dictionary) => dictionary.file),
    leftovers,
    catalogKeyChanges,
    runtime: {
      file: bootstrapFile,
      code: runtimeCode,
      uiLanguagesPath: manifestRel,
      stringsJsonPath: stringsRel,
    },
    scanRoots: roots,
    invocation: {
      paths: opts.paths ?? [],
      reportPath: path.relative(cwd, reportAbs) || reportAbs,
      contentGlob: opts.contentGlob,
      tImport: opts.tImport,
    },
  });
  writeAtomicUtf8(reportAbs, report);

  return {
    written: write,
    filesScanned: usageFiles.length,
    filesChanged,
    leavesImported: seeded.imported,
    dictionaries: dictionaries.length,
    rewrites: rewrites.length,
    reviews: reviews.length,
    reportPath: path.relative(cwd, reportAbs) || reportAbs,
    stringsJsonPath: path.relative(cwd, seeded.stringsJsonPath) || seeded.stringsJsonPath,
  };
}
