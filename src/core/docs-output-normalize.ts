import { ConfigValidationError } from "./errors.js";
import { DOCUSAURUS_LOCALE_SUBPATH } from "./types.js";
import type { DocBlock, DocsOutputConfig, I18nConfig } from "./types.js";

type DocsOutputStyle = DocsOutputConfig["style"];

/**
 * True when `mo` was configured with the given framework alias (`"docusaurus"`, `"astro-starlight"`,
 * `"vitepress"`, `"nextra"`, `"fumadocs"`), whether or not `normalizeDocsOutputStyle` has already rewritten
 * `style` to canonical `"doc-system"`. Use this instead of comparing `mo.style` directly for any
 * check that needs to know which preset was requested.
 */
export function matchesDocsOutputStylePreset(
  mo: DocsOutputConfig,
  preset: DocsOutputStyle
): boolean {
  return mo.style === preset || mo.stylePreset === preset;
}

/** Resolve alias styles to canonical `doc-system` with default `localeSubpath`. */
export function normalizeDocsOutputStyle(mo: DocsOutputConfig): DocsOutputConfig {
  const style = mo.style as DocsOutputStyle;
  if (style === "docusaurus") {
    return {
      ...mo,
      style: "doc-system",
      stylePreset: mo.stylePreset ?? style,
      localeSubpath: mo.localeSubpath !== undefined ? mo.localeSubpath : DOCUSAURUS_LOCALE_SUBPATH,
    };
  }
  if (style === "astro-starlight") {
    return {
      ...mo,
      style: "doc-system",
      stylePreset: mo.stylePreset ?? style,
      localeSubpath: mo.localeSubpath !== undefined ? mo.localeSubpath : "",
      localePathLowercase: mo.localePathLowercase ?? true,
    };
  }
  if (style === "vitepress") {
    return {
      ...mo,
      style: "doc-system",
      stylePreset: mo.stylePreset ?? style,
      localeSubpath: mo.localeSubpath !== undefined ? mo.localeSubpath : "",
      localePathLowercase: mo.localePathLowercase ?? false,
    };
  }
  if (style === "nextra") {
    return {
      ...mo,
      style: "doc-system",
      stylePreset: mo.stylePreset ?? style,
      localeSubpath: mo.localeSubpath !== undefined ? mo.localeSubpath : "",
      localePathLowercase: mo.localePathLowercase ?? false,
    };
  }
  if (style === "fumadocs") {
    return {
      ...mo,
      style: "doc-system",
      stylePreset: mo.stylePreset ?? style,
      localeSubpath: mo.localeSubpath !== undefined ? mo.localeSubpath : "",
      localePathLowercase: mo.localePathLowercase ?? false,
      fumadocsParser: mo.fumadocsParser ?? "dot",
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
          `(use style "docusaurus", "astro-starlight", "vitepress", "nextra", or "fumadocs" for presets, or set localeSubpath explicitly)`
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
