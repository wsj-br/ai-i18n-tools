import type { Segment } from "../core/types.js";
import { hasInternalPlaceholderLeak } from "./translation-placeholder-leaks.js";

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function segmentMarkdownUrlCountsMatch(
  sourceContent: string,
  translatedContent: string
): boolean {
  const sourceUrls = sourceContent.match(/\]\(([^)]+)\)/g) || [];
  const translatedUrls = translatedContent.match(/\]\(([^)]+)\)/g) || [];
  return sourceUrls.length === translatedUrls.length;
}

/**
 * Compare translated segments to source: count, code-block integrity, URL counts, heading levels, length ratio.
 */
export function validateTranslation(
  sourceSegments: Segment[],
  translatedSegments: Segment[]
): ValidationResult {
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

    const sourceUrls = source.content.match(/\]\(([^)]+)\)/g) || [];
    const translatedUrls = translated.content.match(/\]\(([^)]+)\)/g) || [];
    if (sourceUrls.length !== translatedUrls.length) {
      warnings.push(
        `URL count mismatch at segment ${i}: ${sourceUrls.length} vs ${translatedUrls.length} (hash ${source.hash})`
      );
    }

    const sourceHeading = source.content.match(/^(#{1,6})\s/);
    const translatedHeading = translated.content.match(/^(#{1,6})\s/);
    if (sourceHeading && translatedHeading && sourceHeading[1] !== translatedHeading[1]) {
      errors.push(`Heading level changed at segment ${i} (hash ${source.hash})`);
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
 * Strict checks for markdown doc translation after placeholder restore: same structural rules as
 * {@link validateTranslation}, but URL count and length ratio are errors (not warnings), and any
 * remaining internal `{{...}}` markers fail the segment.
 */
export function validateDocTranslatePair(source: Segment, translatedText: string): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (source.type === "code" && source.content !== translatedText) {
    errors.push(`Code block modified (hash ${source.hash})`);
  }

  const sourceUrls = source.content.match(/\]\(([^)]+)\)/g) || [];
  const translatedUrls = translatedText.match(/\]\(([^)]+)\)/g) || [];
  if (sourceUrls.length !== translatedUrls.length) {
    errors.push(
      `URL count mismatch: ${sourceUrls.length} vs ${translatedUrls.length} (hash ${source.hash})`
    );
  }

  const sourceHeading = source.content.match(/^(#{1,6})\s/);
  const translatedHeading = translatedText.match(/^(#{1,6})\s/);
  if (sourceHeading && translatedHeading && sourceHeading[1] !== translatedHeading[1]) {
    errors.push(`Heading level changed (hash ${source.hash})`);
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
