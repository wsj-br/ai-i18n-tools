import fs from "fs";
import path from "path";
import chalk from "chalk";
import {
  applyHeadingAnchorsToMarkdown,
  defaultPymdownOptions,
  type PymdownSlugOptions,
  type SlugStyle,
} from "../markdown/write-heading-ids-core.js";
import { writeAtomicUtf8 } from "./helpers.js";
import { matchesPathFilter, normalizePathFilterForProjectRoot } from "./doc-translate.js";
import { collectFilesByExtension } from "./file-utils.js";
import type { I18nConfig } from "../core/types.js";
import { loadTranslateIgnore, isIgnored } from "../utils/ignore-parser.js";

const SLUG_STYLES = new Set<SlugStyle>([
  "github",
  "bitbucket",
  "gitlab",
  "pymdown",
  "azure-devops",
]);

export interface WriteHeadingIdsOptions {
  cwd: string;
  config: I18nConfig;
  pathRaw?: string;
  slugStyle: SlugStyle;
  dryRun: boolean;
  verbose: boolean;
  pymdown?: PymdownSlugOptions;
}

/** Union of markdown/MDX paths from all `documentations[].contentPaths`, `.translate-ignore`, optional path filter. */
export function collectDocumentationMarkdownRelPaths(args: {
  config: I18nConfig;
  projectRoot: string;
  pathFilter: string | undefined;
}): string[] {
  const ig = loadTranslateIgnore(".translate-ignore", args.projectRoot);
  const out: string[] = [];
  for (const block of args.config.documentations) {
    const md = collectFilesByExtension(
      block.contentPaths,
      [".md", ".mdx"],
      args.projectRoot
    ).filter((f) => !isIgnored(ig, path.join(args.projectRoot, f), args.projectRoot));
    for (const rel of md) {
      if (matchesPathFilter(rel, args.pathFilter)) {
        out.push(rel);
      }
    }
  }
  return [...new Set(out)].sort();
}

export function runWriteHeadingIds(opts: WriteHeadingIdsOptions): {
  filesWritten: number;
  filesUnchanged: number;
} {
  const pathFilter = normalizePathFilterForProjectRoot(opts.cwd, opts.pathRaw);
  const relPaths = collectDocumentationMarkdownRelPaths({
    config: opts.config,
    projectRoot: opts.cwd,
    pathFilter,
  });

  if (relPaths.length === 0) {
    console.log(chalk.yellow("[write-heading-ids] No markdown files matched."));
    return { filesWritten: 0, filesUnchanged: 0 };
  }

  let filesWritten = 0;
  let filesUnchanged = 0;

  for (const rel of relPaths) {
    const abs = path.join(opts.cwd, rel);
    let raw: string;
    try {
      raw = fs.readFileSync(abs, "utf8");
    } catch (e) {
      console.error(
        chalk.red(`[write-heading-ids] Cannot read ${rel}: ${e instanceof Error ? e.message : e}`)
      );
      continue;
    }

    const next = applyHeadingAnchorsToMarkdown(
      raw,
      opts.slugStyle,
      opts.slugStyle === "pymdown" ? opts.pymdown : undefined
    );

    if (next === raw) {
      filesUnchanged += 1;
      if (opts.verbose) {
        console.log(chalk.gray(`  unchanged ${rel}`));
      }
      continue;
    }

    filesWritten += 1;
    if (opts.dryRun) {
      console.log(chalk.cyan(`[dry-run] would update ${rel}`));
    } else {
      writeAtomicUtf8(abs, next);
      console.log(chalk.green(`  wrote ${rel}`));
    }
  }

  return { filesWritten, filesUnchanged };
}

export function parseSlugStyle(raw: string | undefined): SlugStyle {
  const s = (raw ?? "github").trim().toLowerCase();
  if (s === "azure" || s === "ado") {
    return "azure-devops";
  }
  if (SLUG_STYLES.has(s as SlugStyle)) {
    return s as SlugStyle;
  }
  throw new Error(`Invalid --slug-style "${raw}". Expected one of: ${[...SLUG_STYLES].join(", ")}`);
}

export function parsePymdownCase(raw: string | undefined): PymdownSlugOptions["case"] {
  const v = (raw ?? "lower").trim().toLowerCase();
  if (v === "lower" || v === "title" || v === "none") {
    return v;
  }
  throw new Error(`Invalid --pymdown-case "${raw}". Expected lower, title, or none.`);
}

export function parsePymdownNormalize(raw: string | undefined): PymdownSlugOptions["normalize"] {
  const v = (raw ?? "nfc").trim().toLowerCase();
  if (v === "nfc" || v === "nfd" || v === "none") {
    return v;
  }
  throw new Error(`Invalid --pymdown-normalize "${raw}". Expected nfc, nfd, or none.`);
}

/** Merge CLI pymdown overrides onto defaults (percent-encode default true). */
export function resolvePymdownOptions(opts: {
  pymdownCase?: string;
  pymdownNormalize?: string;
  pymdownPercentEncode?: boolean;
  noPymdownPercentEncode?: boolean;
}): PymdownSlugOptions {
  const base = defaultPymdownOptions();
  let percent = base.percentEncode;
  if (opts.noPymdownPercentEncode) {
    percent = false;
  }
  if (opts.pymdownPercentEncode) {
    percent = true;
  }
  return {
    case: parsePymdownCase(opts.pymdownCase),
    normalize: parsePymdownNormalize(opts.pymdownNormalize),
    percentEncode: percent,
  };
}
