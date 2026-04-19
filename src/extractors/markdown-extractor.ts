import { matter, stringify as matterStringify } from "gray-matter-es";
import type {
  LanguageListBlockConfig,
  Segment,
  SegmentSplittingConfig,
  SegmentTranslationMapValue,
} from "../core/types.js";
import { extractLanguageListBlock } from "../processors/doc-postprocess.js";
import { BaseExtractor } from "./base-extractor.js";
import { expandSegmentsWithSplitting } from "./markdown-segment-split.js";

/** Optional extraction behavior for markdown docs (e.g. skip language-list blocks from translation). */
export type MarkdownExtractOptions = {
  languageListBlock?: LanguageListBlockConfig;
  segmentSplitting?: SegmentSplittingConfig;
};

/** CommonMark fenced code: line starts (after optional indent) with 3+ ``` or 3+ ~~~. */
const MD_CODE_FENCE_LINE_RE = /^\s*(?:`{3,}|~{3,})/;

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
      const frontMatterStr = matterStringify("", frontMatter).trim();
      segments.push({
        id: `seg-${segmentIndex++}`,
        type: "frontmatter",
        content: frontMatterStr,
        hash: this.computeHash(frontMatterStr),
        translatable: true,
        startLine: 1,
      });
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
        parts.push(segment.content);
        parts.push("");
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
    const lines = body.split("\n");
    const langListExt =
      languageListBlock !== undefined ? extractLanguageListBlock(body, languageListBlock) : null;
    const langListStart = langListExt?.startLine ?? -1;
    const langListEnd = langListExt?.endLine ?? -1;
    let currentSegment: string[] = [];
    let currentSegmentStartLine = 0;
    let inCodeBlock = false;
    let inAdmonition = false;
    let codeBlockContent: string[] = [];
    let codeBlockStartLine = 0;
    let admonitionContent: string[] = [];
    let admonitionStartLine = 0;

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

      if (langListStart !== -1 && lineIndex === langListStart && !inAdmonition) {
        flushCurrentSegment();
        const blockLines = lines.slice(langListStart, langListEnd + 1);
        segments.push({
          type: "other",
          content: blockLines.join("\n"),
          translatable: false,
          startLine: bodyStartLine + langListStart,
        });
        lineIndex = langListEnd;
        continue;
      }

      if (line.match(/^:::\w+/)) {
        flushCurrentSegment();
        admonitionContent.push(line);
        admonitionStartLine = lineIndex;
        inAdmonition = true;
        continue;
      }

      if (line === ":::" && inAdmonition) {
        admonitionContent.push(line);
        segments.push({
          type: "admonition",
          content: admonitionContent.join("\n"),
          translatable: true,
          startLine: bodyStartLine + admonitionStartLine,
        });
        admonitionContent = [];
        inAdmonition = false;
        continue;
      }

      if (inAdmonition) {
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

    if (content.match(/^!\[.*\]\(.*\)$/)) {
      return { type: "other", content, translatable: false, startLine };
    }

    if (content.startsWith("import ") || /^<[A-Z]/.test(trimmed) || /^<\/\w+>$/.test(trimmed)) {
      return { type: "other", content, translatable: false, startLine };
    }

    return { type: "paragraph", content, translatable: true, startLine };
  }
}
