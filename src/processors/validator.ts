import type { Heading, Root } from "mdast";
import type { Node } from "unist";
import { visit } from "unist-util-visit";
import type { Segment } from "../core/types.js";
import { hasInternalPlaceholderLeak } from "./translation-placeholder-leaks.js";

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/** Lazy ESM loads (mdast stack is ESM-only; dynamic import works in Vitest + Node). */
type MarkdownParserModules = {
  fromMarkdown: (value: string, options?: Record<string, unknown>) => Root;
  gfm: (options?: unknown) => unknown;
  gfmFromMarkdown: () => unknown[];
};

let parserPromise: Promise<MarkdownParserModules> | null = null;

function loadMarkdownParser(): Promise<MarkdownParserModules> {
  if (!parserPromise) {
    parserPromise = Promise.all([
      import("mdast-util-from-markdown"),
      import("micromark-extension-gfm"),
      import("mdast-util-gfm"),
    ]).then(([fromMarkdownMod, gfmMod, gfmMdMod]) => ({
      fromMarkdown: fromMarkdownMod.fromMarkdown as (value: string, options?: Record<string, unknown>) => Root,
      gfm: gfmMod.gfm as (options?: unknown) => unknown,
      gfmFromMarkdown: gfmMdMod.gfmFromMarkdown as () => unknown[],
    }));
  }
  return parserPromise;
}

/** Structural counts derived from mdast (GFM). Used to compare source vs translated segment text. */
interface MarkdownStructureStats {
  link: number;
  image: number;
  code: number;
  inlineCode: number;
  strong: number;
  emphasis: number;
  list: number;
  listItem: number;
  table: number;
  headingDepths: number[];
}

function emptyStats(): MarkdownStructureStats {
  return {
    link: 0,
    image: 0,
    code: 0,
    inlineCode: 0,
    strong: 0,
    emphasis: 0,
    list: 0,
    listItem: 0,
    table: 0,
    headingDepths: [],
  };
}

async function collectMarkdownStructure(md: string): Promise<MarkdownStructureStats> {
  const { fromMarkdown, gfm, gfmFromMarkdown } = await loadMarkdownParser();
  const tree = fromMarkdown(md, {
    extensions: [gfm()],
    mdastExtensions: gfmFromMarkdown(),
  });
  const stats = emptyStats();
  visit(tree, (node: Node) => {
    switch (node.type) {
      case "link":
        stats.link++;
        break;
      case "image":
        stats.image++;
        break;
      case "code":
        stats.code++;
        break;
      case "inlineCode":
        stats.inlineCode++;
        break;
      case "strong":
        stats.strong++;
        break;
      case "emphasis":
        stats.emphasis++;
        break;
      case "list":
        stats.list++;
        break;
      case "listItem":
        stats.listItem++;
        break;
      case "table":
        stats.table++;
        break;
      case "heading":
        stats.headingDepths.push((node as Heading).depth);
        break;
      default:
        break;
    }
  });
  return stats;
}

const STRUCT_KEYS = [
  "link",
  "image",
  "code",
  "inlineCode",
  "strong",
  "emphasis",
  "list",
  "listItem",
  "table",
] as const;

/**
 * Compare mdast structure between two Markdown strings (GFM). Returns human-readable error messages.
 */
export async function compareMarkdownAST(sourceMd: string, translatedMd: string): Promise<string[]> {
  const a = await collectMarkdownStructure(sourceMd);
  const b = await collectMarkdownStructure(translatedMd);
  const errors: string[] = [];
  for (const k of STRUCT_KEYS) {
    if (a[k] !== b[k]) {
      errors.push(`AST mismatch: ${k} ${a[k]} → ${b[k]}`);
    }
  }
  const aHead = a.headingDepths.join(",");
  const bHead = b.headingDepths.join(",");
  if (aHead !== bHead) {
    errors.push(`Heading depth sequence changed: [${aHead}] → [${bHead}]`);
  }
  return errors;
}

function shouldCompareMarkdownStructure(source: Segment): boolean {
  return source.type === "paragraph" || source.type === "heading" || source.type === "admonition";
}

/**
 * Compare translated segments to source: count, code-block integrity, mdast structure, length ratio.
 */
export async function validateTranslation(
  sourceSegments: Segment[],
  translatedSegments: Segment[]
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (sourceSegments.length !== translatedSegments.length) {
    errors.push(`Segment count mismatch: ${sourceSegments.length} vs ${translatedSegments.length}`);
    return { valid: false, warnings, errors };
  }

  for (let i = 0; i < sourceSegments.length; i++) {
    const source = sourceSegments[i];
    const translated = translatedSegments[i];
    if (!source || !translated) {
      continue;
    }

    if (source.type === "code" && source.content !== translated.content) {
      errors.push(`Code block modified at segment ${i} (hash ${source.hash})`);
    }

    if (shouldCompareMarkdownStructure(source)) {
      const astErrors = await compareMarkdownAST(source.content, translated.content);
      for (const msg of astErrors) {
        warnings.push(`${msg} at segment ${i} (hash ${source.hash})`);
      }
    }

    if (source.translatable && translated.content.length > 0) {
      const ratio = translated.content.length / Math.max(1, source.content.length);
      if (ratio > 3 || ratio < 0.2) {
        warnings.push(
          `Unusual length ratio (${ratio.toFixed(2)}) at segment ${i} (hash ${source.hash})`
        );
      }
    }

    if (source.type === "frontmatter") {
      const sourceFmKeys = source.content.match(/^[a-z_]+:/gm) || [];
      const translatedFmKeys = translated.content.match(/^[a-z_]+:/gm) || [];
      if (sourceFmKeys.length !== translatedFmKeys.length) {
        errors.push(`Front matter structure changed at segment ${i} (hash ${source.hash})`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Strict checks for markdown doc translation after placeholder restore: mdast structure matches source,
 * length ratio, frontmatter keys, and no leaked internal `{{...}}` markers.
 */
export async function validateDocTranslatePair(
  source: Segment,
  translatedText: string
): Promise<{
  ok: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (source.type === "code" && source.content !== translatedText) {
    errors.push(`Code block modified (hash ${source.hash})`);
  }

  if (shouldCompareMarkdownStructure(source)) {
    const astErrors = await compareMarkdownAST(source.content, translatedText);
    errors.push(...astErrors.map((e) => `${e} (hash ${source.hash})`));
  }

  if (source.translatable && translatedText.length > 0) {
    const ratio = translatedText.length / Math.max(1, source.content.length);
    if (ratio > 3 || ratio < 0.2) {
      errors.push(`Unusual length ratio (${ratio.toFixed(2)}) (hash ${source.hash})`);
    }
  }

  if (source.type === "frontmatter") {
    const sourceFmKeys = source.content.match(/^[a-z_]+:/gm) || [];
    const translatedFmKeys = translatedText.match(/^[a-z_]+:/gm) || [];
    if (sourceFmKeys.length !== translatedFmKeys.length) {
      errors.push(`Front matter structure changed (hash ${source.hash})`);
    }
  }

  if (hasInternalPlaceholderLeak(translatedText)) {
    errors.push(`Internal translation placeholder leaked in output (hash ${source.hash})`);
  }

  return { ok: errors.length === 0, errors };
}
