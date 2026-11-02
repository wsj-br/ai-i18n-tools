/**
 * Dry-run-first codemod for .NET source-string calls.
 *
 * `T($"Saved to {path}")` becomes `T("Saved to {0}", path)`.
 * `--wrap` also marks unmarked XAML attributes and high-confidence C# sinks.
 * The default run writes a report and does not edit files. A second `--write` is a no-op.
 */
import fs from "node:fs";
import path from "node:path";
import type { I18nConfig } from "../core/types.js";
import { selectUiBlocks } from "../core/ui-blocks.js";
import { getUiExtractorConfig } from "../core/ui-extractor-config.js";
import { defaultFuncNamesFromConfig } from "../extractors/ui-string-locations.js";
import { isGeneratedI18nCs } from "../extractors/csharp-string-extractor.js";
import { migrateDotnetSource, type DotnetFileMigration } from "../extractors/csharp-migrate.js";
import {
  findResxNamedKeyUsages,
  legacyNamedResxKeys,
  renderNamedKeySection,
  type ResxNamedKeySuggestion,
} from "../extractors/resx-named-key-usages.js";
import { parseResx } from "../core/resx-codec.js";
import { collectFilesByExtension, isExcludedRelPath } from "./file-utils.js";
import { writeAtomicUtf8 } from "./helpers.js";

const DOTNET_EXTENSIONS = [".cs", ".razor", ".cshtml", ".xaml", ".axaml"];

export interface MigrateDotnetI18nResult {
  filesScanned: number;
  filesChanged: number;
  edits: number;
  reviews: number;
  candidates: number;
  written: boolean;
  reportPath: string;
}

export function runMigrateDotnetI18n(options: {
  cwd: string;
  config: I18nConfig;
  write?: boolean;
  wrap?: boolean;
  reportPath?: string;
  uiBlock?: string;
}): MigrateDotnetI18nResult {
  const blocks = selectUiBlocks(options.config, options.uiBlock);
  const migrations: DotnetFileMigration[] = [];
  const seen = new Set<string>();
  for (const item of blocks) {
    const extractor = getUiExtractorConfig(item.block);
    const extensions = (extractor?.extensions ?? []).map((ext) =>
      ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`
    );
    const scan = DOTNET_EXTENSIONS.filter((ext) => extensions.includes(ext));
    if (scan.length === 0) {
      continue;
    }
    const funcNames = defaultFuncNamesFromConfig(extractor);
    const files = collectFilesByExtension(item.block.sourceRoots, scan, options.cwd).filter(
      (rel) => !isExcludedRelPath(rel, extractor?.exclude)
    );
    for (const rel of files) {
      if (seen.has(rel)) {
        continue;
      }
      seen.add(rel);
      const abs = path.join(options.cwd, rel);
      const content = fs.readFileSync(abs, "utf8");
      if (isGeneratedI18nCs(content)) {
        continue;
      }
      migrations.push(
        migrateDotnetSource(content, funcNames, rel, {
          wrap: options.wrap,
        })
      );
    }
  }
  const changed = migrations.filter((item) => item.edits.length > 0);
  if (options.write) {
    for (const item of changed) {
      writeAtomicUtf8(path.join(options.cwd, item.file), item.content);
    }
  }
  const reportPath = options.reportPath ?? "migrate-dotnet-i18n-report.md";
  const suggestions = collectNamedKeySuggestions(options.cwd, blocks);
  writeAtomicUtf8(
    path.resolve(options.cwd, reportPath),
    renderReport(migrations, Boolean(options.write), suggestions)
  );
  return {
    filesScanned: migrations.length,
    filesChanged: changed.length,
    edits: changed.reduce((sum, item) => sum + item.edits.length, 0),
    reviews: migrations.reduce((sum, item) => sum + item.reviews.length, 0),
    candidates: migrations.reduce((sum, item) => sum + item.candidates.length, 0),
    written: Boolean(options.write),
    reportPath,
  };
}

function renderReport(
  migrations: DotnetFileMigration[],
  wrote: boolean,
  suggestions: readonly ResxNamedKeySuggestion[]
): string {
  const lines = [
    "# migrate-dotnet-i18n",
    "",
    wrote
      ? "Safe rewrites were written. Read every review note before shipping."
      : "Dry run. Re-run with `--write` to apply safe rewrites. `--wrap` without `--write` lists unmarked strings.",
    "",
  ];
  for (const item of migrations) {
    if (item.edits.length === 0 && item.reviews.length === 0 && item.candidates.length === 0) {
      continue;
    }
    lines.push(`## ${item.file}`, "");
    for (const edit of item.edits) {
      lines.push(`- line ${edit.line}: \`${code(edit.before)}\` → \`${code(edit.after)}\``);
    }
    for (const review of item.reviews) {
      lines.push(`- line ${review.line}: manual review — ${review.message}`);
    }
    for (const candidate of item.candidates) {
      lines.push(`- line ${candidate.line}: candidate — ${candidate.message}`);
    }
    lines.push("");
  }
  if (lines.length === 4 && suggestions.length === 0) {
    lines.push("No unsafe .NET translation calls found.", "");
  }
  if (suggestions.length > 0) {
    lines.push(renderNamedKeySection(suggestions).trimEnd(), "");
  }
  return `${lines.join("\n")}\n`;
}

function collectNamedKeySuggestions(
  cwd: string,
  blocks: ReturnType<typeof selectUiBlocks>
): ResxNamedKeySuggestion[] {
  const suggestions: ResxNamedKeySuggestion[] = [];
  for (const item of blocks) {
    const resx = item.block.resx;
    if (!resx || resx.ingestExistingResx === false) {
      continue;
    }
    const neutralPath = resx.neutralFile
      ? path.resolve(cwd, resx.neutralFile)
      : path.resolve(cwd, resx.outputDir, `${resx.baseName}.resx`);
    if (!fs.existsSync(neutralPath)) {
      continue;
    }
    let entries;
    try {
      entries = parseResx(fs.readFileSync(neutralPath, "utf8"));
    } catch {
      continue;
    }
    const keys = legacyNamedResxKeys(entries);
    if (keys.size === 0) {
      continue;
    }
    const extractor = getUiExtractorConfig(item.block);
    const extensions = (extractor?.extensions ?? DOTNET_EXTENSIONS).map((ext) =>
      ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`
    );
    const scan = DOTNET_EXTENSIONS.filter((ext) => extensions.includes(ext));
    const files = collectFilesByExtension(item.block.sourceRoots, scan, cwd).filter(
      (rel) => !isExcludedRelPath(rel, extractor?.exclude)
    );
    for (const rel of files) {
      const abs = path.join(cwd, rel);
      let content: string;
      try {
        content = fs.readFileSync(abs, "utf8");
      } catch {
        continue;
      }
      if (isGeneratedI18nCs(content)) {
        continue;
      }
      suggestions.push(...findResxNamedKeyUsages(content, rel, keys));
    }
  }
  return suggestions;
}

function code(value: string): string {
  return value.replace(/`/g, "'").replace(/\r?\n/g, " ");
}
