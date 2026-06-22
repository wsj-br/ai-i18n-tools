import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { markHtmlContent } from "../extractors/html-i18n-marks.js";
import { collectFilesByExtension } from "./file-utils.js";
import { writeAtomicUtf8 } from "./helpers.js";
import { timestamp } from "./format.js";
import { t } from "../i18n/index.js";

export interface MarkHtmlSkip {
  file: string;
  line: number;
  tag: string;
  text: string;
}

export interface MarkHtmlSummary {
  filesScanned: number;
  filesChanged: number;
  markersAdded: number;
  skipped: MarkHtmlSkip[];
  /** True when changes were written to disk (`--write`), false for a dry run. */
  written: boolean;
}

export interface RunMarkHtmlOptions {
  cwd: string;
  config: I18nConfig;
  /** Files/dirs/globs to scan; defaults to `.html`/`.htm` under `ui.sourceRoots`. */
  paths?: string[];
  /** Apply changes to disk. When false, report only (dry run). */
  write: boolean;
  verbose?: boolean;
}

/**
 * Insert bare `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` markers into HTML so the source
 * text is written once (on the element itself). Idempotent; reports mixed-content elements that need a
 * manual `<span data-i18n>` instead of mangling them.
 */
export function runMarkHtml(opts: RunMarkHtmlOptions): MarkHtmlSummary {
  const { cwd, config, write } = opts;
  const roots = opts.paths && opts.paths.length > 0 ? opts.paths : (config.ui?.sourceRoots ?? []);
  if (roots.length === 0) {
    throw new Error(t("Provide one or more paths, or set ui.sourceRoots, to scan for HTML."));
  }

  const files = collectFilesByExtension(roots, [".html", ".htm"], cwd);
  const skipped: MarkHtmlSkip[] = [];
  let filesChanged = 0;
  let markersAdded = 0;

  for (const rel of files) {
    const abs = path.join(cwd, rel);
    const content = fs.readFileSync(abs, "utf8");
    const result = markHtmlContent(content);
    for (const s of result.skipped) {
      skipped.push({ file: rel, line: s.line, tag: s.tag, text: s.text });
    }
    const changed = result.output !== content;
    if (changed) {
      filesChanged++;
      markersAdded += result.added;
      if (write) {
        writeAtomicUtf8(abs, result.output);
      }
      const verb = write ? t("updated") : t("would update");
      console.log(
        chalk.cyan(
          t("• {{file}}: {{verb}} (+{{added}} marker(s))", {
            file: rel,
            verb,
            added: result.added,
          })
        )
      );
    } else if (opts.verbose) {
      console.log(chalk.gray(t("• {{file}}: no changes", { file: rel })));
    }
  }

  if (skipped.length > 0) {
    console.log(
      chalk.yellow(
        t(
          "⚠️  {{time}} - {{count}} element(s) have translatable text mixed with child elements; wrap each text run in <span data-i18n> manually:",
          { time: timestamp(), count: skipped.length }
        )
      )
    );
    for (const s of skipped) {
      console.log(
        chalk.yellow(
          t('   {{file}}:{{line}} <{{tag}}> — "{{text}}"', {
            file: s.file,
            line: s.line,
            tag: s.tag,
            text: s.text,
          })
        )
      );
    }
  }

  return {
    filesScanned: files.length,
    filesChanged,
    markersAdded,
    skipped,
    written: write,
  };
}
