import matter from "@11ty/gray-matter";
const matterStringify = matter.stringify;
import type {
  LanguageListBlockConfig,
  Segment,
  SegmentSplittingConfig,
  SegmentTranslationMapValue,
} from "../core/types.js";
import {
  isCodeFenceClose,
  matchCodeFenceOpen,
  type OpenCodeFence,
} from "../processors/code-fence.js";
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
  containerHasTranslatableProse,
  MKDOCS_ADMONITION_OPENER_RE,
  mkdocsAdmonitionEndIndex,
} from "../processors/admonition-syntax.js";
import { parseColonContainers } from "../processors/colon-container-parser.js";

/** Optional extraction behavior for markdown docs (e.g. skip language-list blocks from translation). */
export type MarkdownExtractOptions = {
  languageListBlock?: LanguageListBlockConfig;
  segmentSplitting?: SegmentSplittingConfig;
  /** When false, entire YAML front matter stays non-translatable. Default true. */
  translateFrontmatterFields?: boolean | string[];
};

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
    let openFence: OpenCodeFence | null = null;
    let codeBlockContent: string[] = [];
    let codeBlockStartLine = 0;
    /** Join the next emitted segment to the previous one with a single newline. */
    let pendingTight = false;
    const containers = parseColonContainers(lines.join("\n"));
    const containerAt = new Map(containers.map((container) => [container.startLine, container]));

    const pushSegment = (segment: Omit<Segment, "id" | "hash">) => {
      if (pendingTight) {
        segment.tightJoinPrevious = true;
        pendingTight = false;
      }
      segments.push(segment);
    };

    const flushCurrentSegment = () => {
      if (currentSegment.length === 0) {
        return;
      }
      const raw = currentSegment.join("\n");
      // A tight join is a list or blockquote continuation, so its indent is part of the line.
      const segContent = pendingTight ? raw.trimEnd() : raw.trim();
      if (segContent.trim()) {
        pushSegment(this.classifySegment(segContent, bodyStartLine + currentSegmentStartLine));
      }
      currentSegment = [];
    };

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex] ?? "";
      if (openFence) {
        codeBlockContent.push(line);
        if (isCodeFenceClose(line, openFence)) {
          pushSegment({
            type: "code",
            content: codeBlockContent.join("\n"),
            translatable: false,
            startLine: bodyStartLine + codeBlockStartLine,
          });
          codeBlockContent = [];
          openFence = null;
        }
        continue;
      }

      const container = containerAt.get(lineIndex);
      if (container) {
        const joinToPrevious = currentSegment.length > 0;
        flushCurrentSegment();
        if (joinToPrevious) {
          pendingTight = true;
        }
        const content = lines.slice(container.startLine, container.endLine + 1).join("\n");
        pushSegment({
          type: "admonition",
          content,
          translatable: containerHasTranslatableProse(content),
          startLine: bodyStartLine + container.startLine,
        });
        const nextLine = container.endLine + 1;
        if (nextLine < lines.length && (lines[nextLine] ?? "").trim() !== "") {
          pendingTight = true;
        }
        lineIndex = container.endLine;
        continue;
      }

      const fenceOpen = matchCodeFenceOpen(line);
      if (fenceOpen) {
        flushCurrentSegment();
        codeBlockContent.push(line);
        codeBlockStartLine = lineIndex;
        openFence = fenceOpen;
        continue;
      }

      if (langListStart !== -1 && lineIndex === langListStart) {
        const joinTightToPrevious = currentSegment.length > 0;
        flushCurrentSegment();
        if (joinTightToPrevious) {
          pendingTight = true;
        }
        const blockLines = lines.slice(langListStart, langListEnd + 1);
        pushSegment({
          type: "other",
          content: blockLines.join("\n"),
          translatable: false,
          startLine: bodyStartLine + langListStart,
        });
        lineIndex = langListEnd;
        continue;
      }

      if (MKDOCS_ADMONITION_OPENER_RE.test(line)) {
        flushCurrentSegment();
        const endIndex = mkdocsAdmonitionEndIndex(lines, lineIndex);
        const mkdocsContent = lines.slice(lineIndex, endIndex + 1).join("\n");
        pushSegment({
          type: "admonition",
          content: mkdocsContent,
          translatable: containerHasTranslatableProse(mkdocsContent),
          startLine: bodyStartLine + lineIndex,
        });
        lineIndex = endIndex;
        continue;
      }

      if (line.trim() === "") {
        flushCurrentSegment();
        pendingTight = false;
        continue;
      }

      if (currentSegment.length === 0) {
        currentSegmentStartLine = lineIndex;
      }
      currentSegment.push(line);
    }

    flushCurrentSegment();

    if (codeBlockContent.length > 0) {
      pushSegment({
        type: "code",
        content: codeBlockContent.join("\n"),
        translatable: false,
        startLine: bodyStartLine + codeBlockStartLine,
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
        // Drop images (badge rows) but keep link labels so a lone [text](url) line stays translatable.
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
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
