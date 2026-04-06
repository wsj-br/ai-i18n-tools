import type { Segment } from "../core/types.js";

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
 * Compare translated segments to source (Transrewrt-aligned checks).
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
