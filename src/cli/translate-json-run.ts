import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nConfig, JsonBlock } from "../core/types.js";
import { jsonBlockFileTrackingKey } from "../core/doc-file-tracking.js";
import { resolveContentPathEntries } from "../core/resolve-content-paths.js";
import { localePathPlaceholders, normalizeLocale } from "../core/locale-utils.js";
import { resolveLocalesForJson } from "../core/ui-languages.js";
import { NestedJsonExtractor } from "../extractors/nested-json-extractor.js";
import { TranslationCache } from "../core/cache.js";
import { Glossary } from "../glossary/glossary.js";
import { LlmClient } from "../api/llm-client.js";
import { hashFileContent, writeAtomicUtf8 } from "./helpers.js";
import type { Segment } from "../core/types.js";
import {
  protectSegmentForTranslation,
  translatePromptFormatToResponseFormat,
  translateSegmentsBatched,
  type DocSegmentTranslation,
  type TranslateRunOptions,
} from "./doc-translate.js";
import { formatElapsedMmSs } from "./format.js";
import {
  bindRunInterruptScope,
  interruptErrorFromSignal,
  isRunInterruptedError,
} from "../utils/run-interrupt.js";
import { t } from "../i18n/index.js";

export function expandJsonBlockOutputPath(
  template: string,
  projectRoot: string,
  locale: string,
  relSourcePath: string
): string {
  const posixRel = relSourcePath.replace(/\\/g, "/");
  const basename = path.posix.basename(posixRel);
  const stem = basename.replace(/\.[^.]+$/, "") || basename;
  const extension = path.posix.extname(basename);
  const relativeToSourceRoot = posixRel;
  const localeVars = localePathPlaceholders(locale);
  const vars: Record<string, string> = {
    ...localeVars,
    stem,
    basename,
    extension,
    relativeToSourceRoot,
  };
  let out = template;
  for (const [key, val] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(val);
  }
  return path.isAbsolute(out) ? out : path.join(projectRoot, out);
}

function timestamp(): string {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function printTranslateJsonSummary(
  wallElapsedMs: number,
  filesCompleted: number,
  filesSkipped: number,
  outcome: "success" | "interrupted"
): void {
  if (outcome === "success") {
    console.log(chalk.bold.green(t("\n✅ JSON translation complete!\n")));
  } else {
    console.log(
      chalk.bold.yellow(
        t(
          "\n⚠️  JSON translation interrupted — partial summary (reflects files completed before interrupt).\n"
        )
      )
    );
  }
  console.log(chalk.bold(t("📊 Summary:")));
  console.log(t("   Total elapsed time:    {{time}}", { time: formatElapsedMmSs(wallElapsedMs) }));
  console.log(t("   Files completed:       {{count}}", { count: filesCompleted }));
  console.log(t("   Files skipped:         {{count}}", { count: filesSkipped }));
  console.log("");
}

export async function translateNestedJsonFile(
  config: I18nConfig,
  block: JsonBlock,
  blockIndex: number,
  projectRoot: string,
  locale: string,
  relSourcePath: string,
  opts: TranslateRunOptions & { cache?: TranslationCache }
): Promise<{ skipped: boolean }> {
  const absSource = path.resolve(projectRoot, relSourcePath);
  const content = fs.readFileSync(absSource, "utf8");
  const fileHash = hashFileContent(content);
  const outPath = expandJsonBlockOutputPath(
    block.outputPathTemplate,
    projectRoot,
    locale,
    relSourcePath
  );
  const trackingKey = jsonBlockFileTrackingKey(blockIndex, relSourcePath);
  const cache = opts.cache;
  const glossaryUi = config.glossary?.uiGlossary
    ? path.join(projectRoot, config.glossary.uiGlossary)
    : undefined;
  const glossaryUser = config.glossary?.userGlossary
    ? path.join(projectRoot, config.glossary.userGlossary)
    : undefined;
  const glossary = new Glossary(glossaryUi, glossaryUser, [locale]);

  if (opts.force && cache && !opts.noCache) {
    cache.clearFile(trackingKey, locale);
  }

  const cachedHash = cache && !opts.noCache ? cache.getFileHash(trackingKey, locale) : null;
  if (
    !opts.force &&
    !opts.forceUpdate &&
    cache &&
    !opts.noCache &&
    cachedHash === fileHash &&
    fs.existsSync(outPath)
  ) {
    if (opts.verbose) {
      console.log(
        chalk.gray(
          t("⏭️  {{time}} - {{locale}}  {{path}} (json, unchanged)", {
            time: timestamp(),
            locale,
            path: relSourcePath,
          })
        )
      );
    }
    return { skipped: true };
  }

  const jx = new NestedJsonExtractor();
  const segments = jx.extract(content, relSourcePath, block.keyPolicy);
  const translatableCount = segments.filter((s) => s.translatable).length;
  console.log(
    chalk.yellow(
      t(
        "📄 {{locale}} {{path}} (nested-json): {{count}} segment(s) ({{translatableCount}} translatable)",
        {
          locale,
          path: relSourcePath,
          count: segments.length,
          translatableCount,
        }
      )
    )
  );

  const translations = new Map<string, DocSegmentTranslation>();
  const placeholderById = new Map<
    string,
    ReturnType<typeof protectSegmentForTranslation>["state"]
  >();
  const toBatch: Segment[] = [];
  const segmentIndicesInDoc: number[] = [];
  const client = new LlmClient({ config });

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i]!;
    if (!s.translatable) {
      continue;
    }
    if (!opts.force && cache && !opts.noCache) {
      const hit = cache.getSegment(s.hash, locale, relSourcePath);
      if (hit) {
        translations.set(s.hash, { text: hit });
        continue;
      }
    }
    const { text: protectedText, state } = protectSegmentForTranslation(
      s.content,
      glossary,
      locale,
      false
    );
    placeholderById.set(s.id, state);
    toBatch.push({ ...s, content: protectedText });
    segmentIndicesInDoc.push(i);
  }

  const { map } = await translateSegmentsBatched(
    toBatch,
    placeholderById,
    new Map(),
    locale,
    glossary,
    client,
    opts.dryRun,
    opts.verbose,
    config.batchSize ?? 20,
    config.maxBatchChars ?? 4096,
    "json",
    opts.batchConcurrency ?? config.batchConcurrency ?? 4,
    translatePromptFormatToResponseFormat(opts.promptFormat),
    {
      relativePath: relSourcePath,
      totalSegments: segments.length,
      segmentIndicesInDoc,
    },
    undefined,
    undefined,
    { filepath: relSourcePath },
    undefined,
    opts.abortSignal
  );

  for (const [h, t] of map) {
    translations.set(h, t);
  }

  const output = jx.reassemble(segments, translations);
  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    writeAtomicUtf8(outPath, output);
    if (cache && !opts.noCache) {
      cache.setFileStatus(trackingKey, locale, fileHash);
      for (const s of segments) {
        if (!s.translatable) {
          continue;
        }
        const entry = translations.get(s.hash);
        if (entry?.modelUsed) {
          cache.setSegment(
            s.hash,
            locale,
            s.content,
            entry.text,
            entry.modelUsed,
            relSourcePath,
            null
          );
        }
      }
    }
    console.log(
      chalk.green(
        t("   ✓ {{locale}} → {{path}}", {
          locale,
          path: path.relative(projectRoot, outPath),
        })
      )
    );
  }

  return { skipped: false };
}

export async function runTranslateJson(
  config: I18nConfig,
  projectRoot: string,
  opts: TranslateRunOptions
): Promise<void> {
  if (!config.features.translateJson) {
    throw new Error(t("Enable features.translateJson in config"));
  }
  const locales = opts.locales?.length
    ? opts.locales
    : resolveLocalesForJson(config, projectRoot, null);
  const src = normalizeLocale(config.sourceLocale);
  const targets = locales.filter((l) => normalizeLocale(l) !== src);
  if (targets.length === 0) {
    console.log(chalk.yellow(t("No target locales for translate-json.")));
    return;
  }

  const { opts: boundOpts, scope: interruptScope } = bindRunInterruptScope(opts);
  opts = boundOpts;

  const cacheDir = path.join(projectRoot, config.cacheDir);
  const cache = opts.noCache ? undefined : new TranslationCache(cacheDir);
  const wallStart = Date.now();
  let filesCompleted = 0;
  let filesSkipped = 0;

  try {
    for (let bi = 0; bi < config.json.length; bi++) {
      if (opts.abortSignal?.aborted) {
        throw interruptErrorFromSignal(opts.abortSignal);
      }
      const block = config.json[bi]!;
      const files = resolveContentPathEntries(block.contentPaths, {
        projectRoot,
        extensions: [".json"],
      });
      if (files.length === 0) {
        continue;
      }
      const desc =
        typeof block.description === "string" && block.description.trim()
          ? ` — ${block.description.trim()}`
          : "";
      console.log(
        chalk.gray(
          t("\n--- json[{{index}}]{{desc}} ({{count}} file(s)) ---\n", {
            index: bi,
            desc,
            count: files.length,
          })
        )
      );
      for (const locale of targets) {
        for (const rel of files) {
          if (opts.abortSignal?.aborted) {
            throw interruptErrorFromSignal(opts.abortSignal);
          }
          const { skipped } = await translateNestedJsonFile(
            config,
            block,
            bi,
            projectRoot,
            locale,
            rel,
            {
              ...opts,
              cache,
            }
          );
          if (skipped) {
            filesSkipped++;
          } else {
            filesCompleted++;
          }
        }
      }
    }
    printTranslateJsonSummary(Date.now() - wallStart, filesCompleted, filesSkipped, "success");
  } catch (e) {
    if (isRunInterruptedError(e) || opts.abortSignal?.aborted) {
      printTranslateJsonSummary(
        Date.now() - wallStart,
        filesCompleted,
        filesSkipped,
        "interrupted"
      );
      throw isRunInterruptedError(e) ? e : interruptErrorFromSignal(opts.abortSignal!);
    }
    throw e;
  } finally {
    interruptScope.dispose();
    cache?.close();
  }
}
