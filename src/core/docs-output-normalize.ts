import { ConfigValidationError } from "./errors.js";
import { DOCUSAURUS_LOCALE_SUBPATH } from "./types.js";
import type { DocBlock, DocsOutputConfig, I18nConfig } from "./types.js";

type DocsOutputStyle = DocsOutputConfig["style"];

/** Resolve alias styles to canonical `doc-system` with default `localeSubpath`. */
export function normalizeDocsOutputStyle(mo: DocsOutputConfig): DocsOutputConfig {
  const style = mo.style as DocsOutputStyle;
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
      localePathLowercase: mo.localePathLowercase ?? true,
    };
  }
  if (style === "vitepress") {
    return {
      ...mo,
      style: "doc-system",
      localeSubpath: mo.localeSubpath !== undefined ? mo.localeSubpath : "",
      localePathLowercase: mo.localePathLowercase ?? false,
    };
  }
  if (mo.style === "doc-system" && (mo.localeSubpath?.trim() ?? "") === "") {
    return {
      ...mo,
      localePathLowercase: mo.localePathLowercase ?? true,
    };
  }
  return mo;
}

export function normalizeDocBlockDocsOutput(block: DocBlock): DocBlock {
  return {
    ...block,
    docsOutput: normalizeDocsOutputStyle(block.docsOutput),
  };
}

export function normalizeI18nConfigDocsOutput(config: I18nConfig): I18nConfig {
  return {
    ...config,
    docs: config.docs.map(normalizeDocBlockDocsOutput),
  };
}

/** Require explicit `localeSubpath` when style is canonical `doc-system`. */
export function assertDocSystemLocaleSubpath(config: I18nConfig): void {
  for (let i = 0; i < config.docs.length; i++) {
    const mo = config.docs[i]!.docsOutput;
    if (mo.style === "doc-system" && mo.localeSubpath === undefined) {
      throw new ConfigValidationError(
        `docs[${i}].docsOutput.localeSubpath is required when style is "doc-system" ` +
          `(use style "docusaurus", "astro-starlight", or "vitepress" for presets, or set localeSubpath explicitly)`
      );
    }
  }
}

/** @deprecated Use {@link normalizeDocsOutputStyle} */
export const normalizeMarkdownOutputStyle = normalizeDocsOutputStyle;

/** @deprecated Use {@link normalizeDocBlockDocsOutput} */
export const normalizeDocumentationBlockMarkdownOutput = normalizeDocBlockDocsOutput;

/** @deprecated Use {@link normalizeI18nConfigDocsOutput} */
export const normalizeI18nConfigMarkdownOutput = normalizeI18nConfigDocsOutput;
