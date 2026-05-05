import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { stripBoldAroundInlineCode } from "../utils/stripBoldAroundInlineCode.js";
import { collectDocumentationMarkdownRelPaths } from "./write-heading-ids.js";
import { normalizePathFilterForProjectRoot } from "./doc-translate.js";
import { writeAtomicUtf8 } from "./helpers.js";

export interface StripMdBoldInlineOptions {
  cwd: string;
  config: I18nConfig;
  pathRaw?: string;
  dryRun: boolean;
  noBackup: boolean;
  verbose: boolean;
}

function defaultBackupAbsolutePath(absSource: string): string {
  const dir = path.dirname(absSource);
  const ext = path.extname(absSource);
  const stem = path.basename(absSource, ext);
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(dir, `${stem}${ext}.backup.${ts}.tmp`);
}

export function runStripMdBoldInline(opts: StripMdBoldInlineOptions): {
  filesWritten: number;
  filesUnchanged: number;
  filesFailed: number;
} {
  const pathFilter = normalizePathFilterForProjectRoot(opts.cwd, opts.pathRaw);
  const relPaths = collectDocumentationMarkdownRelPaths({
    config: opts.config,
    projectRoot: opts.cwd,
    pathFilter,
  });

  if (relPaths.length === 0) {
    console.log(chalk.yellow("[strip-md-bold-inline] No markdown files matched."));
    return { filesWritten: 0, filesUnchanged: 0, filesFailed: 0 };
  }

  let filesWritten = 0;
  let filesUnchanged = 0;
  let filesFailed = 0;

  for (const rel of relPaths) {
    const abs = path.join(opts.cwd, rel);
    let raw: string;
    try {
      raw = fs.readFileSync(abs, "utf8");
    } catch (e) {
      filesFailed += 1;
      console.error(
        chalk.red(
          `[strip-md-bold-inline] Cannot read ${rel}: ${e instanceof Error ? e.message : e}`
        )
      );
      continue;
    }

    const next = stripBoldAroundInlineCode(raw);

    if (next === raw) {
      filesUnchanged += 1;
      if (opts.verbose) {
        console.log(chalk.gray(`  unchanged ${rel}`));
      }
      continue;
    }

    filesWritten += 1;
    const delta = raw.length - next.length;
    if (opts.dryRun) {
      console.log(
        chalk.cyan(
          `[dry-run] would update ${rel} (${raw.length} → ${next.length} chars, −${delta})`
        )
      );
      continue;
    }

    if (!opts.noBackup) {
      const backupAbs = defaultBackupAbsolutePath(abs);
      try {
        fs.copyFileSync(abs, backupAbs);
        console.log(chalk.gray(`  backup → ${path.relative(opts.cwd, backupAbs)}`));
      } catch (e) {
        filesFailed += 1;
        console.error(
          chalk.red(
            `[strip-md-bold-inline] Cannot backup ${rel}: ${e instanceof Error ? e.message : e}`
          )
        );
        continue;
      }
    }

    try {
      writeAtomicUtf8(abs, next);
      console.log(chalk.green(`  wrote ${rel} (−${delta} chars)`));
    } catch (e) {
      filesFailed += 1;
      console.error(
        chalk.red(
          `[strip-md-bold-inline] Cannot write ${rel}: ${e instanceof Error ? e.message : e}`
        )
      );
    }
  }

  return { filesWritten, filesUnchanged, filesFailed };
}
