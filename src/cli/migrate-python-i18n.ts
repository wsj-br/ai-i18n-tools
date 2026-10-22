/**
 * Dry-run-first codemod for unsafe Python lookups.
 *
 * `_(f"Hello, {name}!")` becomes `t("Hello, {name}!", name=name)`.
 * `_("Hello, %s!" % name)` becomes `_("Hello, %s!") % name`.
 * `_("Hello, {name}!".format(name=name))` becomes `t("Hello, {name}!", name=name)`.
 * Calls that are already safe are left untouched, so a second run is a no-op.
 */
import fs from "node:fs";
import path from "node:path";
import type { I18nConfig } from "../core/types.js";
import { selectUiBlocks } from "../core/ui-blocks.js";
import { getUiExtractorConfig } from "../core/ui-extractor-config.js";
import { defaultFuncNamesFromConfig } from "../extractors/ui-string-locations.js";
import {
  findPythonI18nCalls,
  isGeneratedI18nPy,
  type PythonCallSite,
} from "../extractors/python-string-extractor.js";
import { collectFilesByExtension } from "./file-utils.js";
import { writeAtomicUtf8 } from "./helpers.js";

export interface PythonMigrationEdit {
  line: number;
  before: string;
  after: string;
}

export interface PythonMigrationReview {
  line: number;
  message: string;
}

export interface PythonFileMigration {
  file: string;
  content: string;
  edits: PythonMigrationEdit[];
  reviews: PythonMigrationReview[];
}

export function migratePythonI18nSource(
  content: string,
  funcNames: string[],
  file = "source.py"
): PythonFileMigration {
  const sites = findPythonI18nCalls(content, file, funcNames);
  const edits: PythonMigrationEdit[] = [];
  const reviews: PythonMigrationReview[] = [];
  const rewrites = sites
    .filter((site) => site.replacement && content.slice(site.start, site.end) !== site.replacement)
    .sort((a, b) => b.start - a.start);
  let next = content;
  for (const site of rewrites) {
    const before = content.slice(site.start, site.end);
    const after = site.replacement!;
    edits.push({ line: site.line, before, after });
    next = next.slice(0, site.start) + after + next.slice(site.end);
  }
  for (const site of sites) {
    const message = reviewMessage(site);
    if (message) {
      reviews.push({ line: site.line, message });
    }
  }
  edits.sort((a, b) => a.line - b.line);
  return { file, content: next, edits, reviews };
}

function reviewMessage(site: PythonCallSite): string | null {
  if (site.review) {
    return site.review;
  }
  if (site.unsafe && !site.replacement) {
    return `unsafe ${site.unsafeKind ?? "lookup"} was not rewritten`;
  }
  return null;
}

export interface MigratePythonI18nResult {
  filesScanned: number;
  filesChanged: number;
  edits: number;
  reviews: number;
  written: boolean;
  reportPath: string;
}

export function runMigratePythonI18n(options: {
  cwd: string;
  config: I18nConfig;
  write?: boolean;
  reportPath?: string;
  uiBlock?: string;
}): MigratePythonI18nResult {
  const blocks = selectUiBlocks(options.config, options.uiBlock);
  const migrations: PythonFileMigration[] = [];
  const seen = new Set<string>();
  for (const item of blocks) {
    const extractor = getUiExtractorConfig(item.block);
    const extensions = extractor?.extensions ?? [".py"];
    if (!extensions.some((ext) => ext.toLowerCase() === ".py" || ext.toLowerCase() === "py")) {
      continue;
    }
    const funcNames = defaultFuncNamesFromConfig(extractor);
    const files = collectFilesByExtension(item.block.sourceRoots, [".py"], options.cwd);
    for (const rel of files) {
      if (seen.has(rel)) {
        continue;
      }
      seen.add(rel);
      const abs = path.join(options.cwd, rel);
      const content = fs.readFileSync(abs, "utf8");
      if (isGeneratedI18nPy(content)) {
        continue;
      }
      migrations.push(migratePythonI18nSource(content, funcNames, rel));
    }
  }
  const changed = migrations.filter((item) => item.edits.length > 0);
  if (options.write) {
    for (const item of changed) {
      writeAtomicUtf8(path.join(options.cwd, item.file), item.content);
    }
  }
  const reportPath = options.reportPath ?? "migrate-python-i18n-report.md";
  const reportAbs = path.resolve(options.cwd, reportPath);
  writeAtomicUtf8(reportAbs, renderReport(migrations, Boolean(options.write)));
  return {
    filesScanned: migrations.length,
    filesChanged: changed.length,
    edits: changed.reduce((sum, item) => sum + item.edits.length, 0),
    reviews: migrations.reduce((sum, item) => sum + item.reviews.length, 0),
    written: Boolean(options.write),
    reportPath,
  };
}

function renderReport(migrations: PythonFileMigration[], wrote: boolean): string {
  const lines = [
    "# migrate-python-i18n",
    "",
    wrote
      ? "Safe rewrites were written. Review every complex-expression note before shipping."
      : "Dry run. Re-run with `--write` to apply safe rewrites.",
    "",
  ];
  for (const item of migrations) {
    if (item.edits.length === 0 && item.reviews.length === 0) {
      continue;
    }
    lines.push(`## ${item.file}`, "");
    for (const edit of item.edits) {
      lines.push(`- line ${edit.line}: \`${edit.before}\` → \`${edit.after}\``);
    }
    for (const review of item.reviews) {
      lines.push(`- line ${review.line}: manual review — ${review.message}`);
    }
    lines.push("");
  }
  if (lines.length === 4) {
    lines.push("No unsafe Python translation calls found.", "");
  }
  return `${lines.join("\n")}\n`;
}
