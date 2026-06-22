import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { t } from "../i18n/index.js";
import { toDocTranslateConfig } from "../core/config.js";
import { TranslationCache } from "../core/cache.js";
import { documentationFileTrackingKey } from "../core/doc-file-tracking.js";
import { MarkdownExtractor } from "../extractors/markdown-extractor.js";
import { collectMarkdownIssuesForSegment } from "../processors/markdown-source-diagnostics.js";
import { collectFilesByExtension } from "./file-utils.js";
import { loadTranslateIgnore, isIgnored } from "../utils/ignore-parser.js";
import { matchesPathFilter, buildMarkdownExtractOpts } from "./doc-translate.js";

function filterIgnoredFiles(files: string[], cwd: string): string[] {
  const ig = loadTranslateIgnore(".translate-ignore", cwd);
  return files.filter((f) => !isIgnored(ig, path.join(cwd, f), cwd));
}

export interface CheckMarkdownOptions {
  cwd: string;
  config: I18nConfig;
  pathFilter?: string;
  json: boolean;
  noCache: boolean;
  verbose: boolean;
}

export interface CheckMarkdownJsonRow {
  filepath: string;
  displayPath: string;
  line: number | null;
  issueCode: string;
  detail: string;
  sourceHash: string;
}

/**
 * Scan configured documentation markdown for delimiter / inline-code issues; optional SQLite refresh.
 * @returns exit code 0 = no issues, 1 = at least one issue
 */
export async function runCheckMarkdown(opts: CheckMarkdownOptions): Promise<{ exitCode: number }> {
  const projectRoot = opts.cwd;
  const jsonRows: CheckMarkdownJsonRow[] = [];
  let issueCount = 0;

  const cache =
    !opts.noCache && opts.config.cacheDir
      ? new TranslationCache(path.join(projectRoot, opts.config.cacheDir))
      : null;

  try {
    for (let bi = 0; bi < opts.config.docs.length; bi++) {
      const block = opts.config.docs[bi]!;
      const view = toDocTranslateConfig(opts.config, block);
      const md = filterIgnoredFiles(
        collectFilesByExtension(block.contentPaths, [".md", ".mdx"], projectRoot),
        projectRoot
      ).filter((r) => matchesPathFilter(r, opts.pathFilter));

      const mdExtractOpts = buildMarkdownExtractOpts(view.doc);
      const extractor = new MarkdownExtractor();

      for (const relPath of md) {
        const abs = path.join(projectRoot, relPath);
        const content = fs.readFileSync(abs, "utf8");
        const segments = extractor.extract(content, relPath, mdExtractOpts);
        const trackKey = documentationFileTrackingKey(bi, relPath);
        const rows = segments.flatMap((s) => collectMarkdownIssuesForSegment(s, trackKey));

        if (cache) {
          cache.replaceMarkdownIssuesForFilepath(trackKey, rows);
        }

        for (const row of rows) {
          issueCount++;
          if (opts.json) {
            jsonRows.push({
              filepath: row.filepath,
              displayPath: relPath,
              line: row.startLine,
              issueCode: row.issueCode,
              detail: row.detail,
              sourceHash: row.sourceHash,
            });
          } else {
            const line = row.startLine ?? "?";
            console.error(
              chalk.cyan(`${relPath}:${line}`) +
                chalk.yellow(
                  `: [${row.issueCode}] ${row.detail}${opts.verbose ? ` (hash ${row.sourceHash})` : ""}`
                )
            );
          }
        }
      }
    }
  } finally {
    cache?.close();
  }

  if (opts.json) {
    console.log(JSON.stringify({ issues: jsonRows, count: issueCount }, null, 2));
  } else if (issueCount > 0) {
    console.error(
      chalk.red(
        t("\n❌ check-markdown: {{count}} issue(s) in documentation sources", { count: issueCount })
      )
    );
  } else {
    console.log(chalk.green(t("✅ check-markdown: no markdown source issues found")));
  }

  return { exitCode: issueCount > 0 ? 1 : 0 };
}
