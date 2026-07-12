import matter from "@11ty/gray-matter";
const matterStringify = matter.stringify;
import type {
  LanguageListBlockConfig,
  Segment,
  SegmentSplittingConfig,
  SegmentTranslationMapValue,
} from "../core/types.js";
import { extractLanguageListBlock } from "../processors/doc-postprocess.js";
import {
  collectTranslatableFrontmatterFields,
  encodeFrontmatterShell,
  decodeFrontmatterShell,
  applyFrontmatterFieldTranslations,
  FRONTMATTER_SHELL_PREFIX,
  resolveFrontmatterFieldAllowList,
} from "./frontmatter-fields.js";
import { BaseExtractor } from "./base-extractor.js";
import {
  formatImageMarkdown,
  hasTranslatableImageAlt,
  parseStandaloneImageMarkdown,
} from "./image-markdown.js";
import { expandSegmentsWithSplitting } from "./markdown-segment-split.js";
import {
  ADMONITION_CLOSING_NOINDENT_RE,
  ADMONITION_OPENER_COLONS_RE,
} from "../processors/admonition-syntax.js";

/** Optional extraction behavior for markdown docs (e.g. skip language-list blocks from translation). */
export type MarkdownExtractOptions = {
  languageListBlock?: LanguageListBlockConfig;
  segmentSplitting?: SegmentSplittingConfig;
  /** When false, entire YAML front matter stays non-translatable. Default true. */
  translateFrontmatterFields?: boolean | string[];
};

/** CommonMark fenced code: line starts (after optional indent) with 3+ ``` or 3+ ~~~. */
const MD_CODE_FENCE_LINE_RE = /^\s*(?:`{3,}|~{3,})/;

/** MDX top-level ESM (`import …`, `export …`) — those segments are component code, not prose. */
const MDX_TOPLEVEL_ESM_RE = /^(?:import|export)\b/;

export class MarkdownExtractor extends BaseExtractor {
  readonly name = "markdown";

  canHandle(filepath: string): boolean {
    return /\.mdx?$/i.test(filepath);
  }

  extract(content: string, filepath: string, options?: MarkdownExtractOptions): Segment[] {
    void filepath;
    const segments: Segment[] = [];
    let segmentIndex = 0;

    const { data: frontMatter, content: body } = matter(content);

    if (Object.keys(frontMatter).length > 0) {
      const fmRecord = frontMatter as Record<string, unknown>;
      const allowList = resolveFrontmatterFieldAllowList(options?.translateFrontmatterFields);
      const translatableFields =
        allowList === null || allowList.length > 0
          ? collectTranslatableFrontmatterFields(
              fmRecord,
              allowList === null ? undefined : allowList
            )
          : [];

      if (translatableFields.length > 0) {
        segments.push({
          id: `seg-${segmentIndex++}`,
          type: "frontmatter",
          content: encodeFrontmatterShell(fmRecord),
          hash: this.computeHash(encodeFrontmatterShell(fmRecord)),
          translatable: false,
          startLine: 1,
        });
        for (const field of translatableFields) {
          segments.push({
            id: `seg-${segmentIndex++}`,
            type: "frontmatter-field",
            content: field.value,
            hash: this.computeHash(field.value),
            translatable: true,
            frontmatterPath: field.path,
            startLine: 1,
          });
        }
      } else {
        const frontMatterStr = matterStringify("", frontMatter).trim();
        segments.push({
          id: `seg-${segmentIndex++}`,
          type: "frontmatter",
          content: frontMatterStr,
          hash: this.computeHash(frontMatterStr),
          translatable: false,
          startLine: 1,
        });
      }
    }

    const bodyStartLine =
      1 + (content.substring(0, content.indexOf(body)).match(/\n/g) || []).length;

    let bodySegments = this.splitBody(body, bodyStartLine, options?.languageListBlock);
    const splitOpts = options?.segmentSplitting;
    if (splitOpts?.enabled) {
      bodySegments = expandSegmentsWithSplitting(bodySegments, splitOpts);
    }
    for (const seg of bodySegments) {
      segments.push({
        id: `seg-${segmentIndex++}`,
        ...seg,
        hash: this.computeHash(seg.content),
      });
    }

    return segments;
  }

  reassemble(segments: Segment[], translations: Map<string, SegmentTranslationMapValue>): string {
    const merged = this.mergeTranslations(segments, translations);
    const parts: string[] = [];

    for (let i = 0; i < merged.length; i++) {
      const segment = merged[i];
      if (!segment) {
        continue;
      }
      if (segment.tightJoinPrevious) {
        continue;
      }
      if (segment.type === "frontmatter") {
        if (segment.content.startsWith(FRONTMATTER_SHELL_PREFIX)) {
          const data = decodeFrontmatterShell(segment.content);
          const fieldUpdates: Array<{ path: string; value: string }> = [];
          let j = i + 1;
          while (j < merged.length && merged[j]?.type === "frontmatter-field") {
            const fieldSeg = merged[j]!;
            if (fieldSeg.frontmatterPath) {
              fieldUpdates.push({
                path: fieldSeg.frontmatterPath,
                value: fieldSeg.content,
              });
            }
            j++;
          }
          applyFrontmatterFieldTranslations(data, fieldUpdates);
          parts.push(matterStringify("", data).trim());
          parts.push("");
          i = j - 1;
          continue;
        }
        parts.push(segment.content);
        parts.push("");
        continue;
      }
      if (segment.type === "frontmatter-field") {
        continue;
      }
      if (segment.type === "image" && segment.image) {
        parts.push(formatImageMarkdown(segment.content, segment.image.url));
        continue;
      }
      let chunk = segment.content;
      let j = i + 1;
      while (j < merged.length && merged[j]?.tightJoinPrevious) {
        chunk += "\n" + merged[j]!.content;
        j++;
      }
      parts.push(chunk);
    }

    return parts.join("\n\n").trim() + "\n";
  }

  private splitBody(
    body: string,
    bodyStartLine: number,
    languageListBlock?: LanguageListBlockConfig
  ): Omit<Segment, "id" | "hash">[] {
    const segments: Omit<Segment, "id" | "hash">[] = [];
    const lines = body.split(/\r?\n/);
    const langListExt =
      languageListBlock !== undefined ? extractLanguageListBlock(body, languageListBlock) : null;
    const langListStart = langListExt?.startLine ?? -1;
    const langListEnd = langListExt?.endLine ?? -1;
    let currentSegment: string[] = [];
    let currentSegmentStartLine = 0;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockStartLine = 0;
    let admonitionContent: string[] = [];
    let admonitionStartLine = 0;
    /** Stack of opener colon counts; nested admonitions push more colons than their parent. */
    const admonitionDepths: number[] = [];

    const flushCurrentSegment = () => {
      if (currentSegment.length > 0) {
        const segContent = currentSegment.join("\n").trim();
        if (segContent) {
          segments.push(this.classifySegment(segContent, bodyStartLine + currentSegmentStartLine));
        }
        currentSegment = [];
      }
    };

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex] ?? "";
      if (MD_CODE_FENCE_LINE_RE.test(line)) {
        if (inCodeBlock) {
          codeBlockContent.push(line);
          segments.push({
            type: "code",
            content: codeBlockContent.join("\n"),
            translatable: false,
            startLine: bodyStartLine + codeBlockStartLine,
          });
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          flushCurrentSegment();
          codeBlockContent.push(line);
          codeBlockStartLine = lineIndex;
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      if (langListStart !== -1 && lineIndex === langListStart && admonitionDepths.length === 0) {
        const joinTightToPrevious = currentSegment.length > 0;
        flushCurrentSegment();
        const blockLines = lines.slice(langListStart, langListEnd + 1);
        segments.push({
          type: "other",
          content: blockLines.join("\n"),
          translatable: false,
          startLine: bodyStartLine + langListStart,
          ...(joinTightToPrevious ? { tightJoinPrevious: true as const } : {}),
        });
        lineIndex = langListEnd;
        continue;
      }

      const admonitionOpener = line.match(ADMONITION_OPENER_COLONS_RE);
      if (admonitionOpener) {
        if (admonitionDepths.length === 0) {
          flushCurrentSegment();
          admonitionStartLine = lineIndex;
        }
        admonitionDepths.push(admonitionOpener[1]!.length);
        admonitionContent.push(line);
        continue;
      }

      if (admonitionDepths.length > 0 && ADMONITION_CLOSING_NOINDENT_RE.test(line)) {
        admonitionContent.push(line);
        admonitionDepths.pop();
        if (admonitionDepths.length === 0) {
          segments.push({
            type: "admonition",
            content: admonitionContent.join("\n"),
            translatable: true,
            startLine: bodyStartLine + admonitionStartLine,
          });
          admonitionContent = [];
        }
        continue;
      }

      if (admonitionDepths.length > 0) {
        admonitionContent.push(line);
        continue;
      }

      if (line.trim() === "") {
        flushCurrentSegment();
        continue;
      }

      if (currentSegment.length === 0) {
        currentSegmentStartLine = lineIndex;
      }
      currentSegment.push(line);
    }

    flushCurrentSegment();

    if (codeBlockContent.length > 0) {
      segments.push({
        type: "code",
        content: codeBlockContent.join("\n"),
        translatable: false,
        startLine: bodyStartLine + codeBlockStartLine,
      });
    }

    if (admonitionContent.length > 0) {
      segments.push({
        type: "admonition",
        content: admonitionContent.join("\n"),
        translatable: true,
        startLine: bodyStartLine + admonitionStartLine,
      });
    }

    return segments;
  }

  private classifySegment(content: string, startLine: number): Omit<Segment, "id" | "hash"> {
    const trimmed = content.trim();
    const isSingleLine = !trimmed.includes("\n");

    if (/^<br\s*\/?>$/i.test(trimmed)) {
      return { type: "other", content, translatable: false, startLine };
    }

    if (/^---+$/.test(trimmed)) {
      return { type: "other", content, translatable: false, startLine };
    }

    const standaloneImage = parseStandaloneImageMarkdown(trimmed);
    if (standaloneImage) {
      return {
        type: "image",
        content: standaloneImage.alt,
        translatable: hasTranslatableImageAlt(standaloneImage.alt),
        image: { url: standaloneImage.url },
        startLine,
      };
    }

    if (isSingleLine) {
      const textOnly = trimmed
        .replace(/`[^`]*`/g, "")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/[*_#>-]/g, "")
        .replace(/[()[\]{}<>]/g, "")
        .replace(/<[^>]+>/g, "")
        .trim();

      if (!/[A-Za-z0-9]/.test(textOnly)) {
        return { type: "other", content, translatable: false, startLine };
      }
    }

    if (content.match(/^#{1,6}\s/)) {
      return { type: "heading", content, translatable: true, startLine };
    }

    if (MDX_TOPLEVEL_ESM_RE.test(trimmed)) {
      return { type: "other", content, translatable: false, startLine };
    }

    return { type: "paragraph", content, translatable: true, startLine };
  }
}
