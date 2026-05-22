import { ConfigValidationError } from "./errors.js";
import { DOCUSAURUS_LOCALE_SUBPATH } from "./types.js";
import type { DocumentationBlock, I18nConfig, MarkdownOutputConfig } from "./types.js";

type MarkdownOutputStyle = MarkdownOutputConfig["style"];

/** Resolve alias styles to canonical `doc-system` with default `localeSubpath`. */
export function normalizeMarkdownOutputStyle(mo: MarkdownOutputConfig): MarkdownOutputConfig {
  const style = mo.style as MarkdownOutputStyle;
  if (style === "docusaurus") {
    return {
      ...mo,
      style: "doc-system",
      localeSubpath: mo.localeSubpath !== undefined ? mo.localeSubpath : DOCUSAURUS_LOCALE_SUBPATH,
    };
  }
  if (style === "astro-starlight") {
    return {
      ...mo,
      style: "doc-system",
      localeSubpath: mo.localeSubpath !== undefined ? mo.localeSubpath : "",
    };
  }
  return mo;
}

export function normalizeDocumentationBlockMarkdownOutput(
  block: DocumentationBlock
): DocumentationBlock {
  return {
    ...block,
    markdownOutput: normalizeMarkdownOutputStyle(block.markdownOutput),
  };
}

export function normalizeI18nConfigMarkdownOutput(config: I18nConfig): I18nConfig {
  return {
    ...config,
    documentations: config.documentations.map(normalizeDocumentationBlockMarkdownOutput),
  };
}

/** Require explicit `localeSubpath` when style is canonical `doc-system`. */
export function assertDocSystemLocaleSubpath(config: I18nConfig): void {
  for (let i = 0; i < config.documentations.length; i++) {
    const mo = config.documentations[i]!.markdownOutput;
    if (mo.style === "doc-system" && mo.localeSubpath === undefined) {
      throw new ConfigValidationError(
        `documentations[${i}].markdownOutput.localeSubpath is required when style is "doc-system" ` +
          `(use style "docusaurus" or "astro-starlight" for presets, or set localeSubpath explicitly)`
      );
    }
  }
}
