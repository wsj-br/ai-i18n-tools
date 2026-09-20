import fs from "fs";
import path from "path";
import chalk from "chalk";
import matter from "@11ty/gray-matter";
const matterStringify = matter.stringify;
import {
  applyHeadingAnchorsToMarkdown,
  applyKnownHeadingIds,
  defaultPymdownOptions,
  extractHeadingIds,
  stripHeadingIdsAnywhere,
  type PymdownSlugOptions,
  type SlugStyle,
} from "../markdown/write-heading-ids-core.js";
import { toDocTranslateConfig } from "../core/config.js";
import { getDocumentationTargetLocaleCodesForBlock } from "../core/ui-languages.js";
import type { DocBlock, I18nConfig } from "../core/types.js";
import { writeAtomicUtf8, resolveTranslatedOutputPath } from "./helpers.js";
import { matchesPathFilter, normalizePathFilterForProjectRoot } from "./doc-translate.js";
import { collectFilesByExtension } from "./file-utils.js";
import { loadTranslateIgnore, isIgnored } from "../utils/ignore-parser.js";
import { t } from "../i18n/index.js";

const SLUG_STYLES = new Set<SlugStyle>([
  "github",
  "bitbucket",
  "gitlab",
  "pymdown",
  "azure-devops",
  "mdx-comment",
]);

export interface WriteHeadingIdsOptions {
  cwd: string;
  config: I18nConfig;
  pathRaw?: string;
  slugStyle: SlugStyle;
  dryRun: boolean;
  verbose: boolean;
  pymdown?: PymdownSlugOptions;
  /** Strip HTML anchors and heading-id suffixes instead of writing ids. */
  remove?: boolean;
}

/** Union of markdown/MDX paths from all `docs[].contentPaths`, `.translate-ignore`, optional path filter. */
export function collectDocumentationMarkdownRelPaths(args: {
  config: I18nConfig;
  projectRoot: string;
  pathFilter: string | undefined;
}): string[] {
  const ig = loadTranslateIgnore(".translate-ignore", args.projectRoot);
  const out: string[] = [];
  for (const block of args.config.docs) {
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

function markdownBody(markdown: string): string {
  const parsed = matter(markdown);
  return typeof parsed.content === "string" ? parsed.content : String(parsed.content);
}

function applyBodyTransform(markdown: string, transform: (body: string) => string): string {
  const parsed = matter(markdown);
  const content = typeof parsed.content === "string" ? parsed.content : String(parsed.content);
  const nextBody = transform(content);
  if (nextBody === content) {
    return markdown;
  }
  return matterStringify(nextBody, parsed.data);
}

function collectBlockMarkdownRelPaths(args: {
  block: DocBlock;
  projectRoot: string;
  pathFilter: string | undefined;
}): string[] {
  const ig = loadTranslateIgnore(".translate-ignore", args.projectRoot);
  const md = collectFilesByExtension(
    args.block.contentPaths,
    [".md", ".mdx"],
    args.projectRoot
  ).filter((f) => !isIgnored(ig, path.join(args.projectRoot, f), args.projectRoot));
  const out: string[] = [];
  for (const rel of md) {
    if (matchesPathFilter(rel, args.pathFilter)) {
      out.push(rel);
    }
  }
  return [...new Set(out)].sort();
}

export function runWriteHeadingIds(opts: WriteHeadingIdsOptions): {
  filesWritten: number;
  filesUnchanged: number;
  translatedFilesWritten: number;
  translatedFilesUnchanged: number;
} {
  const pathFilter = normalizePathFilterForProjectRoot(opts.cwd, opts.pathRaw);
  const relPaths = collectDocumentationMarkdownRelPaths({
    config: opts.config,
    projectRoot: opts.cwd,
    pathFilter,
  });

  if (relPaths.length === 0) {
    console.log(chalk.yellow(t("[write-heading-ids] No markdown files matched.")));
    return {
      filesWritten: 0,
      filesUnchanged: 0,
      translatedFilesWritten: 0,
      translatedFilesUnchanged: 0,
    };
  }

  let filesWritten = 0;
  let filesUnchanged = 0;
  const englishNextByRel = new Map<string, string>();

  for (const rel of relPaths) {
    const abs = path.join(opts.cwd, rel);
    let raw: string;
    try {
      raw = fs.readFileSync(abs, "utf8");
    } catch (e) {
      console.error(
        chalk.red(
          t("[write-heading-ids] Cannot read {{path}}: {{error}}", {
            path: rel,
            error: e instanceof Error ? e.message : String(e),
          })
        )
      );
      continue;
    }

    const next = applyHeadingAnchorsToMarkdown(
      raw,
      opts.slugStyle,
      opts.slugStyle === "pymdown" ? opts.pymdown : undefined,
      Boolean(opts.remove)
    );
    englishNextByRel.set(rel, next);

    if (next === raw) {
      filesUnchanged += 1;
      if (opts.verbose) {
        console.log(chalk.gray(t("  unchanged {{path}}", { path: rel })));
      }
      continue;
    }

    filesWritten += 1;
    if (opts.dryRun) {
      console.log(chalk.cyan(t("[dry-run] would update {{path}}", { path: rel })));
    } else {
      writeAtomicUtf8(abs, next);
      console.log(chalk.green(t("  Wrote {{path}}", { path: rel })));
    }
  }

  let translatedFilesWritten = 0;
  let translatedFilesUnchanged = 0;
  const remove = Boolean(opts.remove);

  for (const block of opts.config.docs) {
    const blockRels = collectBlockMarkdownRelPaths({
      block,
      projectRoot: opts.cwd,
      pathFilter,
    });
    const locales = getDocumentationTargetLocaleCodesForBlock(opts.config, block);
    if (locales.length === 0 || blockRels.length === 0) {
      continue;
    }
    const view = toDocTranslateConfig(opts.config, block);
    for (const rel of blockRels) {
      const englishNext = englishNextByRel.get(rel);
      if (!remove && englishNext === undefined) {
        continue;
      }
      const ids = remove ? [] : extractHeadingIds(markdownBody(englishNext!));
      for (const locale of locales) {
        const outPath = resolveTranslatedOutputPath(view, opts.cwd, locale, rel, "markdown");
        if (!fs.existsSync(outPath)) {
          continue;
        }
        let translatedRaw: string;
        try {
          translatedRaw = fs.readFileSync(outPath, "utf8");
        } catch (e) {
          console.error(
            chalk.red(
              t("[write-heading-ids] Cannot read {{path}}: {{error}}", {
                path: path.relative(opts.cwd, outPath) || outPath,
                error: e instanceof Error ? e.message : String(e),
              })
            )
          );
          continue;
        }
        const next = applyBodyTransform(translatedRaw, (body) =>
          remove ? stripHeadingIdsAnywhere(body) : applyKnownHeadingIds(body, ids, opts.slugStyle)
        );
        const translatedRel = path.relative(opts.cwd, outPath) || outPath;
        if (next === translatedRaw) {
          translatedFilesUnchanged += 1;
          if (opts.verbose) {
            console.log(chalk.gray(t("  unchanged {{path}}", { path: translatedRel })));
          }
          continue;
        }
        translatedFilesWritten += 1;
        if (opts.dryRun) {
          console.log(chalk.cyan(t("[dry-run] would update {{path}}", { path: translatedRel })));
        } else {
          writeAtomicUtf8(outPath, next);
          console.log(chalk.green(t("  Repositioned {{path}}", { path: translatedRel })));
        }
      }
    }
  }

  return {
    filesWritten,
    filesUnchanged,
    translatedFilesWritten,
    translatedFilesUnchanged,
  };
}

export function parseSlugStyle(raw: string | undefined): SlugStyle {
  const s = (raw ?? "github").trim().toLowerCase();
  if (s === "azure" || s === "ado") {
    return "azure-devops";
  }
  if (s === "mdx" || s === "mdx-comment") {
    return "mdx-comment";
  }
  if (SLUG_STYLES.has(s as SlugStyle)) {
    return s as SlugStyle;
  }
  throw new Error(
    t('Invalid --slug-style "{{value}}". Expected one of: {{styles}}', {
      value: String(raw),
      styles: [...SLUG_STYLES].join(", "),
    })
  );
}

export function parsePymdownCase(raw: string | undefined): PymdownSlugOptions["case"] {
  const v = (raw ?? "lower").trim().toLowerCase();
  if (v === "lower" || v === "title" || v === "none") {
    return v;
  }
  throw new Error(
    t('Invalid --pymdown-case "{{value}}". Expected lower, title, or none.', { value: String(raw) })
  );
}

export function parsePymdownNormalize(raw: string | undefined): PymdownSlugOptions["normalize"] {
  const v = (raw ?? "nfc").trim().toLowerCase();
  if (v === "nfc" || v === "nfd" || v === "none") {
    return v;
  }
  throw new Error(
    t('Invalid --pymdown-normalize "{{value}}". Expected nfc, nfd, or none.', {
      value: String(raw),
    })
  );
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
