import path from "path";
import type { I18nConfig, I18nDocTranslateConfig } from "./types.js";
import { isFumadocsDotParser } from "./fumadocs-parser.js";

function posixBasename(filePath: string): string {
  return path.posix.basename(filePath.replace(/\\/g, "/"));
}

function stemWithoutExtension(filePath: string): string {
  const base = posixBasename(filePath);
  const ext = path.posix.extname(base);
  return ext ? base.slice(0, -ext.length) : base;
}

/**
 * Locale codes that may appear as filename suffixes for dot-parser Fumadocs sources.
 * Includes `targetLocales` and the documentation source locale route code when set.
 */
export function fumadocsDotLocaleSuffixes(
  config: I18nDocTranslateConfig,
  fullConfig?: I18nConfig
): string[] {
  const locales = new Set<string>();
  for (const loc of config.targetLocales ?? []) {
    locales.add(loc);
  }
  if (fullConfig?.sourceLocale) {
    locales.add(fullConfig.sourceLocale);
  }
  return [...locales];
}

/**
 * When `fumadocsParser` is `dot`, skip locale-suffixed markdown sources (e.g. `foo.pt.mdx`)
 * so `sync` does not re-translate generated outputs.
 */
export function isFumadocsDotLocaleSuffixedSource(
  relPath: string,
  config: I18nDocTranslateConfig,
  fullConfig?: I18nConfig
): boolean {
  if (!isFumadocsDotParser(config.doc.docsOutput)) {
    return false;
  }
  const stem = stemWithoutExtension(relPath);
  for (const locale of fumadocsDotLocaleSuffixes(config, fullConfig)) {
    if (stem.endsWith(`.${locale}`)) {
      return true;
    }
  }
  return false;
}

/** Filter markdown paths for Fumadocs dot-parser locale suffix exclusion. */
export function filterFumadocsDotMarkdownSources(
  relPaths: string[],
  config: I18nDocTranslateConfig,
  fullConfig?: I18nConfig
): string[] {
  if (!isFumadocsDotParser(config.doc.docsOutput)) {
    return relPaths;
  }
  return relPaths.filter((rel) => !isFumadocsDotLocaleSuffixedSource(rel, config, fullConfig));
}

/** Filter `meta.{locale}.json` files from Fumadocs meta collection (dot parser). */
export function isFumadocsDotLocaleSuffixedMeta(
  relPath: string,
  config: I18nDocTranslateConfig,
  fullConfig?: I18nConfig
): boolean {
  if (!isFumadocsDotParser(config.doc.docsOutput)) {
    return false;
  }
  const posix = relPath.replace(/\\/g, "/");
  const base = path.posix.basename(posix, ".json");
  if (!base.startsWith("meta.")) {
    return false;
  }
  const suffix = base.slice("meta.".length);
  return fumadocsDotLocaleSuffixes(config, fullConfig).includes(suffix);
}
