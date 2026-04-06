import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { I18nConfig, Segment } from "../core/types.js";
import { BatchTranslationError } from "../core/types.js";
import { TranslationCache } from "../core/cache.js";
import { MarkdownExtractor } from "../extractors/markdown-extractor.js";
import { JsonExtractor } from "../extractors/json-extractor.js";
import { SvgExtractor } from "../extractors/svg-extractor.js";
import { PlaceholderHandler } from "../processors/placeholder-handler.js";
import { splitTranslatableIntoBatches } from "../processors/batch-processor.js";
import { Glossary } from "../glossary/glossary.js";
import { OpenRouterClient } from "../api/openrouter.js";
import { validateTranslation } from "../processors/validator.js";
import {
  computeFlatLinkRewritePrefixes,
  rewriteDocLinksForFlatOutput,
} from "../processors/flat-link-rewrite.js";
import {
  shouldRewriteFlatMarkdownLinks,
} from "../core/output-paths.js";
import { hashFileContent, resolveTranslatedOutputPath, writeAtomicUtf8 } from "./helpers.js";
import { normalizeLocale } from "../core/config.js";
import type { DocumentPromptContentType } from "../core/prompt-builder.js";

export interface TranslateRunOptions {
  cwd: string;
  locales: string[];
  dryRun: boolean;
  force: boolean;
  noCache: boolean;
  verbose: boolean;
  pathFilter?: string;
  typeFilter?: "markdown" | "json" | "svg";
  svgOnly?: boolean;
  jsonOnly?: boolean;
  noSvg?: boolean;
  noJson?: boolean;
}

export interface TranslateTotals {
  filesWritten: number;
  filesSkipped: number;
  inputTokens: number;
  outputTokens: number;
  costUsd?: number;
}

type ProtectState = ReturnType<PlaceholderHandler["protectForTranslation"]>;

export function shouldRunMarkdown(opts: TranslateRunOptions, config: I18nConfig): boolean {
  if (!config.features.translateMarkdown) {
    return false;
  }
  if (opts.typeFilter === "json" || opts.typeFilter === "svg") {
    return false;
  }
  if (opts.jsonOnly || opts.svgOnly) {
    return false;
  }
  return true;
}

export function shouldRunJson(opts: TranslateRunOptions, config: I18nConfig): boolean {
  if (!config.features.translateJSON || !config.documentation.jsonSource?.trim()) {
    return false;
  }
  if (opts.noJson) {
    return false;
  }
  if (opts.typeFilter === "markdown" || opts.typeFilter === "svg") {
    return false;
  }
  if (opts.svgOnly) {
    return false;
  }
  return true;
}

export function shouldRunSvg(opts: TranslateRunOptions, config: I18nConfig): boolean {
  if (!config.features.translateSVG) {
    return false;
  }
  if (opts.noSvg) {
    return false;
  }
  if (opts.typeFilter === "markdown" || opts.typeFilter === "json") {
    return false;
  }
  if (opts.jsonOnly) {
    return false;
  }
  return true;
}

function matchesPathFilter(relPath: string, filter: string | undefined): boolean {
  if (!filter?.trim()) {
    return true;
  }
  const f = filter.replace(/\\/g, "/");
  const r = relPath.replace(/\\/g, "/");
  return r === f || r.startsWith(f.endsWith("/") ? f : `${f}/`);
}

async function translateSegmentsBatched(
  batchable: Segment[],
  placeholderById: Map<string, ProtectState>,
  locale: string,
  glossary: Glossary,
  client: OpenRouterClient | null,
  dryRun: boolean,
  verbose: boolean,
  batchSize: number,
  maxBatchChars: number,
  contentType: DocumentPromptContentType
): Promise<{ map: Map<string, string>; inTok: number; outTok: number; cost: number }> {
  const out = new Map<string, string>();
  let inTok = 0;
  let outTok = 0;
  let cost = 0;

  const batches = splitTranslatableIntoBatches(batchable, { batchSize, maxBatchChars });

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi]!;
    const hintText = batch.map((s) => s.content).join("\n");
    const hints = glossary.findTermsInText(hintText, locale);

    if (dryRun || !client) {
      if (verbose) {
        console.log(`  [dry-run] batch ${bi + 1}/${batches.length} (${batch.length} segments)`);
      }
      for (const s of batch) {
        out.set(s.hash, s.content);
      }
      continue;
    }

    if (verbose) {
      console.log(`  Chunk ${bi + 1}/${batches.length} (${batch.length} segments)`);
    }

    try {
      const res = await client.translateDocumentBatch(batch, locale, hints, { contentType });
      inTok += res.usage.inputTokens;
      outTok += res.usage.outputTokens;
      cost += res.cost ?? 0;
      for (let i = 0; i < batch.length; i++) {
        const s = batch[i]!;
        const raw = res.translations.get(i);
        if (raw === undefined) {
          throw new Error(`Missing translation for batch index ${i}`);
        }
        const st = placeholderById.get(s.id);
        const restored = st
          ? new PlaceholderHandler().restoreAfterTranslation(raw, st)
          : raw;
        out.set(s.hash, restored);
      }
    } catch (e) {
      if (e instanceof BatchTranslationError && client) {
        if (verbose) {
          console.warn(`  Batch mismatch; falling back to single-segment calls`);
        }
        const handler = new PlaceholderHandler();
        for (const s of batch) {
          const st = placeholderById.get(s.id);
          const single = await client.translateDocumentSegment(s.content, locale, hints, {
            contentType,
          });
          inTok += single.usage.inputTokens;
          outTok += single.usage.outputTokens;
          cost += single.cost ?? 0;
          const restored = st ? handler.restoreAfterTranslation(single.content, st) : single.content;
          out.set(s.hash, restored);
        }
      } else {
        throw e;
      }
    }
  }

  return { map: out, inTok, outTok, cost };
}

export async function translateMarkdownFile(
  absSource: string,
  relPath: string,
  locale: string,
  config: I18nConfig,
  cache: TranslationCache | null,
  client: OpenRouterClient | null,
  glossary: Glossary,
  opts: TranslateRunOptions,
  hitKeys: Set<string>,
  markdownBasenames: string[]
): Promise<{ skipped: boolean; totals: TranslateTotals }> {
  const totals: TranslateTotals = {
    filesWritten: 0,
    filesSkipped: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };

  const content = fs.readFileSync(absSource, "utf8");
  const fileHash = hashFileContent(content);
  const outPath = resolveTranslatedOutputPath(config, opts.cwd, locale, relPath, "markdown");

  if (
    !opts.force &&
    cache &&
    !opts.noCache &&
    cache.getFileHash(relPath, locale) === fileHash &&
    fs.existsSync(outPath)
  ) {
    totals.filesSkipped = 1;
    return { skipped: true, totals };
  }

  const md = new MarkdownExtractor();
  const segments = md.extract(content, relPath);
  const translations = new Map<string, string>();
  const placeholderById = new Map<string, ProtectState>();
  const toBatch: Segment[] = [];

  const ph = new PlaceholderHandler();

  for (const s of segments) {
    if (!s.translatable) {
      continue;
    }
    if (!opts.force && cache && !opts.noCache) {
      const hit = cache.getSegment(s.hash, locale, relPath, s.startLine);
      if (hit) {
        translations.set(s.hash, hit);
        hitKeys.add(`${s.hash}|${locale}`);
        continue;
      }
    }
    const st = ph.protectForTranslation(s.content);
    placeholderById.set(s.id, st);
    toBatch.push({ ...s, content: st.text });
  }

  const batchSize = config.batchSize ?? 20;
  const maxBatchChars = config.maxBatchChars ?? 4096;

  const { map, inTok, outTok, cost } = await translateSegmentsBatched(
    toBatch,
    placeholderById,
    locale,
    glossary,
    client,
    opts.dryRun,
    opts.verbose,
    batchSize,
    maxBatchChars,
    "markdown"
  );

  for (const [h, t] of map) {
    translations.set(h, t);
  }
  totals.inputTokens += inTok;
  totals.outputTokens += outTok;
  totals.costUsd = (totals.costUsd ?? 0) + cost;

  for (const s of segments) {
    if (s.translatable && translations.has(s.hash)) {
      hitKeys.add(`${s.hash}|${locale}`);
    }
  }

  const merged: Segment[] = segments.map((s) => ({
    ...s,
    content: s.translatable ? (translations.get(s.hash) ?? s.content) : s.content,
  }));

  const v = validateTranslation(segments, merged);
  if (!v.valid && !opts.dryRun) {
    console.warn(`  [warn] ${relPath} (${locale}): ${v.errors.join("; ")}`);
  }

  let output = md.reassemble(segments, translations);

  if (shouldRewriteFlatMarkdownLinks(config)) {
    const mo = config.documentation.markdownOutput;
    const docsRoot = mo.linkRewriteDocsRoot?.trim() || ".";
    const { i18nPrefix, depthPrefix } = computeFlatLinkRewritePrefixes(
      opts.cwd,
      docsRoot,
      config.documentation.outputDir
    );
    const currentBasename = path.basename(relPath);
    const parsed = matter(output);
    const newBody = rewriteDocLinksForFlatOutput(
      parsed.content,
      locale,
      i18nPrefix,
      depthPrefix,
      markdownBasenames,
      currentBasename
    );
    output = matter.stringify(newBody, parsed.data);
  }

  if (!opts.dryRun) {
    writeAtomicUtf8(outPath, output);
    if (cache && !opts.noCache) {
      cache.setFileStatus(relPath, locale, fileHash);
      const model = client?.getConfiguredModels()[0] ?? "cache-only";
      for (const s of segments) {
        if (!s.translatable) {
          continue;
        }
        const t = translations.get(s.hash);
        if (t === undefined) {
          continue;
        }
        cache.setSegment(s.hash, locale, s.content, t, model, relPath, s.startLine ?? null);
      }
    }
    totals.filesWritten = 1;
  } else {
    totals.filesWritten = 0;
  }

  return { skipped: false, totals };
}

export async function translateJsonFile(
  absSource: string,
  relPath: string,
  locale: string,
  config: I18nConfig,
  cache: TranslationCache | null,
  client: OpenRouterClient | null,
  glossary: Glossary,
  opts: TranslateRunOptions,
  hitKeys: Set<string>
): Promise<{ skipped: boolean; totals: TranslateTotals }> {
  const totals: TranslateTotals = {
    filesWritten: 0,
    filesSkipped: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };

  const content = fs.readFileSync(absSource, "utf8");
  const fileHash = hashFileContent(content);
  const outPath = resolveTranslatedOutputPath(config, opts.cwd, locale, relPath, "json");

  if (
    !opts.force &&
    cache &&
    !opts.noCache &&
    cache.getFileHash(relPath, locale) === fileHash &&
    fs.existsSync(outPath)
  ) {
    totals.filesSkipped = 1;
    return { skipped: true, totals };
  }

  const jx = new JsonExtractor();
  const segments = jx.extract(content, relPath);
  const translations = new Map<string, string>();
  const toBatch: Segment[] = [];

  for (const s of segments) {
    if (!opts.force && cache && !opts.noCache) {
      const hit = cache.getSegment(s.hash, locale, relPath);
      if (hit) {
        translations.set(s.hash, hit);
        hitKeys.add(`${s.hash}|${locale}`);
        continue;
      }
    }
    toBatch.push({ ...s });
  }

  const emptyPh = new Map<string, ProtectState>();
  const batchSize = config.batchSize ?? 20;
  const maxBatchChars = config.maxBatchChars ?? 4096;

  const { map, inTok, outTok, cost } = await translateSegmentsBatched(
    toBatch,
    emptyPh,
    locale,
    glossary,
    client,
    opts.dryRun,
    opts.verbose,
    batchSize,
    maxBatchChars,
    "json"
  );

  for (const [h, t] of map) {
    translations.set(h, t);
  }
  totals.inputTokens += inTok;
  totals.outputTokens += outTok;
  totals.costUsd = (totals.costUsd ?? 0) + cost;

  for (const s of segments) {
    if (s.translatable && translations.has(s.hash)) {
      hitKeys.add(`${s.hash}|${locale}`);
    }
  }

  const output = jx.reassemble(segments, translations);

  if (!opts.dryRun) {
    writeAtomicUtf8(outPath, output);
    if (cache && !opts.noCache) {
      cache.setFileStatus(relPath, locale, fileHash);
      const model = client?.getConfiguredModels()[0] ?? "cache-only";
      for (const s of segments) {
        if (!s.translatable) {
          continue;
        }
        const t = translations.get(s.hash);
        if (t === undefined) {
          continue;
        }
        cache.setSegment(s.hash, locale, s.content, t, model, relPath, null);
      }
    }
    totals.filesWritten = 1;
  }

  return { skipped: false, totals };
}

export async function translateSvgFile(
  absSource: string,
  relPath: string,
  locale: string,
  config: I18nConfig,
  cache: TranslationCache | null,
  client: OpenRouterClient | null,
  glossary: Glossary,
  opts: TranslateRunOptions,
  hitKeys: Set<string>
): Promise<{ skipped: boolean; totals: TranslateTotals }> {
  const totals: TranslateTotals = {
    filesWritten: 0,
    filesSkipped: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };

  const forceLc = config.documentation.svgExtractor?.forceLowercase ?? false;
  const content = fs.readFileSync(absSource, "utf8");
  const fileHash = hashFileContent(content);
  const outPath = resolveTranslatedOutputPath(config, opts.cwd, locale, relPath, "svg");

  if (
    !opts.force &&
    cache &&
    !opts.noCache &&
    cache.getFileHash(relPath, locale) === fileHash &&
    fs.existsSync(outPath)
  ) {
    totals.filesSkipped = 1;
    return { skipped: true, totals };
  }

  const sx = new SvgExtractor({ forceLowercase: forceLc });
  const segments = sx.extract(content, relPath);
  const translations = new Map<string, string>();
  const toBatch: Segment[] = [];

  for (const s of segments) {
    if (!opts.force && cache && !opts.noCache) {
      const hit = cache.getSegment(s.hash, locale, relPath);
      if (hit) {
        let t = hit;
        if (forceLc) {
          t = t.toLowerCase();
        }
        translations.set(s.hash, t);
        hitKeys.add(`${s.hash}|${locale}`);
        continue;
      }
    }
    toBatch.push({ ...s });
  }

  const emptyPh = new Map<string, ProtectState>();
  const batchSize = config.batchSize ?? 20;
  const maxBatchChars = config.maxBatchChars ?? 4096;

  const { map, inTok, outTok, cost } = await translateSegmentsBatched(
    toBatch,
    emptyPh,
    locale,
    glossary,
    client,
    opts.dryRun,
    opts.verbose,
    batchSize,
    maxBatchChars,
    "svg"
  );

  for (const [h, t] of map) {
    translations.set(h, t);
  }
  totals.inputTokens += inTok;
  totals.outputTokens += outTok;
  totals.costUsd = (totals.costUsd ?? 0) + cost;

  for (const s of segments) {
    if (s.translatable && translations.has(s.hash)) {
      hitKeys.add(`${s.hash}|${locale}`);
    }
  }

  const output = sx.reassemble(segments, translations);

  if (!opts.dryRun) {
    writeAtomicUtf8(outPath, output);
    if (cache && !opts.noCache) {
      cache.setFileStatus(relPath, locale, fileHash);
      const model = client?.getConfiguredModels()[0] ?? "cache-only";
      for (const s of segments) {
        if (!s.translatable) {
          continue;
        }
        const t = translations.get(s.hash);
        if (t === undefined) {
          continue;
        }
        cache.setSegment(s.hash, locale, s.content, t, model, relPath, null);
      }
    }
    totals.filesWritten = 1;
  }

  return { skipped: false, totals };
}

/** Run translate for all enabled kinds and locales. */
export async function runTranslate(
  config: I18nConfig,
  opts: TranslateRunOptions,
  files: {
    markdown: string[];
    json: string[];
    svg: string[];
  },
  jsonAbsRoot: string
): Promise<TranslateTotals> {
  const sum: TranslateTotals = {
    filesWritten: 0,
    filesSkipped: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };

  const cache: TranslationCache | null = opts.noCache
    ? null
    : new TranslationCache(path.join(opts.cwd, config.documentation.cacheDir));

  const needsApi =
    !opts.dryRun &&
    (config.features.translateMarkdown ||
      config.features.translateJSON ||
      config.features.translateSVG);
  const client = needsApi ? new OpenRouterClient({ config }) : null;

  const glossaryUi = config.glossary?.uiGlossaryFromStringsJson
    ? path.join(opts.cwd, config.glossary.uiGlossaryFromStringsJson)
    : undefined;
  const glossaryUser = config.glossary?.userGlossary
    ? path.join(opts.cwd, config.glossary.userGlossary)
    : undefined;
  const hitKeys = new Set<string>();
  const markdownHitKeys = new Set<string>();
  const markdownBasenames = files.markdown.map((r) => path.basename(r));

  const locales = opts.locales.map((l) => normalizeLocale(l));
  const glossary = new Glossary(glossaryUi, glossaryUser, locales);

  for (const locale of locales) {
    if (shouldRunMarkdown(opts, config)) {
      for (const rel of files.markdown) {
        if (!matchesPathFilter(rel, opts.pathFilter)) {
          continue;
        }
        const abs = path.join(opts.cwd, rel);
        if (opts.verbose) {
          console.log(`🌐 ${locale}  ${rel}`);
        }
        const { skipped, totals } = await translateMarkdownFile(
          abs,
          rel,
          locale,
          config,
          cache,
          client,
          glossary,
          opts,
          markdownHitKeys,
          markdownBasenames
        );
        if (skipped) {
          sum.filesSkipped += totals.filesSkipped;
        } else {
          sum.filesWritten += totals.filesWritten;
          sum.inputTokens += totals.inputTokens;
          sum.outputTokens += totals.outputTokens;
          sum.costUsd = (sum.costUsd ?? 0) + (totals.costUsd ?? 0);
        }
      }
    }

    if (shouldRunJson(opts, config)) {
      for (const rel of files.json) {
        if (!matchesPathFilter(rel, opts.pathFilter)) {
          continue;
        }
        const abs = path.join(jsonAbsRoot, rel);
        if (opts.verbose) {
          console.log(`🌐 ${locale}  ${rel} (json)`);
        }
        const { skipped, totals } = await translateJsonFile(
          abs,
          rel,
          locale,
          config,
          cache,
          client,
          glossary,
          opts,
          hitKeys
        );
        if (skipped) {
          sum.filesSkipped += totals.filesSkipped;
        } else {
          sum.filesWritten += totals.filesWritten;
          sum.inputTokens += totals.inputTokens;
          sum.outputTokens += totals.outputTokens;
          sum.costUsd = (sum.costUsd ?? 0) + (totals.costUsd ?? 0);
        }
      }
    }

    if (shouldRunSvg(opts, config)) {
      for (const rel of files.svg) {
        if (!matchesPathFilter(rel, opts.pathFilter)) {
          continue;
        }
        const abs = path.join(opts.cwd, rel);
        if (opts.verbose) {
          console.log(`🌐 ${locale}  ${rel} (svg)`);
        }
        const { skipped, totals } = await translateSvgFile(
          abs,
          rel,
          locale,
          config,
          cache,
          client,
          glossary,
          opts,
          hitKeys
        );
        if (skipped) {
          sum.filesSkipped += totals.filesSkipped;
        } else {
          sum.filesWritten += totals.filesWritten;
          sum.inputTokens += totals.inputTokens;
          sum.outputTokens += totals.outputTokens;
          sum.costUsd = (sum.costUsd ?? 0) + (totals.costUsd ?? 0);
        }
      }
    }
  }

  if (cache && markdownHitKeys.size > 0) {
    await cache.resetLastHitAtForUnhit([...markdownHitKeys]);
  }

  cache?.close();

  return sum;
}
