import fs from "fs";
import path from "path";
import chalk from "chalk";
import { matter, stringify as matterStringify } from "gray-matter-es";
import type {
  I18nConfig,
  I18nDocTranslateConfig,
  LanguageListBlockConfig,
  RegexAdjustmentConfig,
} from "../core/types.js";
import { normalizeLocale } from "../core/config.js";
import { resolveDocumentationOutputPath, toPosix } from "../core/output-paths.js";
import { loadUiLanguageEntries, resolveUiLanguagesAbsPath } from "../core/ui-languages.js";

const ADJUSTMENT_PLACEHOLDER_RE = /\$\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;

/**
 * Plain `pattern` uses flag `g`. Slash form `/pattern/flags` only works when `pattern` contains no `/`
 * (otherwise the last `/` is parsed as the end delimiter and the regex is wrong).
 */
export function parseAdjustmentSearchToRegExp(search: string): RegExp {
  const trimmed = search.trim();
  if (trimmed.startsWith("/")) {
    const lastSlash = trimmed.lastIndexOf("/");
    if (lastSlash > 0) {
      const pattern = trimmed.slice(1, lastSlash);
      let flags = trimmed.slice(lastSlash + 1);
      const allowed = new Set([..."gimsuy"]);
      flags = [...flags].filter((c) => allowed.has(c)).join("");
      if (!flags.includes("g")) flags += "g";
      return new RegExp(pattern, flags);
    }
  }
  return new RegExp(trimmed, "g");
}

export function interpolateAdjustmentTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(ADJUSTMENT_PLACEHOLDER_RE, (full, key: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) return vars[key]!;
    return full;
  });
}

/** Variables for `regexAdjustments[].replace` templates. */
export function buildMarkdownAdjustmentVars(
  sourceAbs: string,
  translatedAbs: string,
  sourceLocaleRaw: string,
  translatedLocaleRaw: string
): Record<string, string> {
  const src = path.normalize(path.resolve(sourceAbs));
  const tr = path.normalize(path.resolve(translatedAbs));
  const sourceLocale = normalizeLocale(sourceLocaleRaw);
  const translatedLocale = normalizeLocale(translatedLocaleRaw);
  return {
    sourceFullPath: toPosix(src),
    sourceFilename: path.basename(src),
    sourceBaseName: path.parse(src).name,
    sourceExtension: path.extname(src),
    translatedFullPath: toPosix(tr),
    translatedFilename: path.basename(tr),
    translatedBaseName: path.parse(tr).name,
    translatedExtension: path.extname(tr),
    sourceLocale,
    translatedLocale,
    sourceBasedir: toPosix(path.dirname(src)),
    translatedBasedir: toPosix(path.dirname(tr)),
  };
}

function splitBodyLines(body: string): string[] {
  return body.split(/\r?\n/);
}

function joinBodyLines(lines: string[]): string {
  return lines.join("\n");
}

/**
 * Find the language-list block by scanning lines for `cfg.start` then `cfg.end` (no regex across lines).
 */
export function extractLanguageListBlock(
  body: string,
  cfg: LanguageListBlockConfig
): { block: string; startLine: number; endLine: number } | null {
  const lines = splitBodyLines(body);
  const startLine = lines.findIndex((line) => line.includes(cfg.start));
  if (startLine === -1) return null;

  let endLine: number;
  if (lines[startLine]!.includes(cfg.end)) {
    endLine = startLine;
  } else {
    const found = lines.findIndex((line, idx) => idx > startLine && line.includes(cfg.end));
    if (found === -1) return null;
    endLine = found;
  }

  const block = lines.slice(startLine, endLine + 1).join("\n");
  return { block, startLine, endLine };
}

export function replaceLanguageListBlockInBody(
  body: string,
  cfg: LanguageListBlockConfig,
  replacement: string
): { body: string; replaced: boolean } {
  const ext = extractLanguageListBlock(body, cfg);
  if (!ext) return { body, replaced: false };
  const lines = splitBodyLines(body);
  const replacementLines = splitBodyLines(replacement);
  const newLines = [
    ...lines.slice(0, ext.startLine),
    ...replacementLines,
    ...lines.slice(ext.endLine + 1),
  ];
  return { body: joinBodyLines(newLines), replaced: true };
}

function markdownRelativeHref(fromTranslatedFile: string, toTargetFile: string): string {
  let rel = path.relative(path.dirname(fromTranslatedFile), toTargetFile);
  if (!rel.startsWith(".") && !path.isAbsolute(rel)) {
    rel = `./${rel}`;
  }
  return rel.split(path.sep).join("/");
}

/** Ordered locale rows for the language switcher (manifest order when `ui-languages.json` is available). */
export function buildLanguageSwitcherRows(
  config: I18nDocTranslateConfig,
  cwd: string
): Array<{ code: string; label: string }> {
  const abs = resolveUiLanguagesAbsPath(config as unknown as I18nConfig, cwd);
  if (abs && fs.existsSync(abs)) {
    const entries = loadUiLanguageEntries(abs);
    return entries.map((e) => ({
      code: normalizeLocale(e.code),
      label: (e.label && e.label.trim()) || e.englishName.trim(),
    }));
  }

  const src = normalizeLocale(config.sourceLocale);
  const names = config.localeDisplayNames ?? {};
  const doc = config.documentation.targetLocales;
  const useDoc = Array.isArray(doc) && doc.length > 0;
  const rawList = useDoc ? doc! : config.targetLocales;
  const targets = [...new Set(rawList.map((l) => normalizeLocale(l)))].filter((c) => c !== src);
  targets.sort();
  const rows: Array<{ code: string; label: string }> = [{ code: src, label: names[src] ?? src }];
  for (const t of targets) {
    rows.push({ code: t, label: names[t] ?? t });
  }
  return rows;
}

function generateCanonicalLanguageListBlock(
  rows: Array<{ code: string; label: string }>,
  cfg: LanguageListBlockConfig,
  absCurrentFile: string,
  relPath: string,
  cwd: string,
  config: I18nDocTranslateConfig,
  sourceLocale: string
): string {
  const srcNorm = normalizeLocale(sourceLocale);
  const parts: string[] = [];
  for (const { code, label } of rows) {
    const c = normalizeLocale(code);
    const absTarget =
      c === srcNorm
        ? path.join(cwd, relPath)
        : resolveDocumentationOutputPath(config, cwd, c, relPath, "markdown");
    const href = markdownRelativeHref(absCurrentFile, absTarget);
    parts.push(`[${label}](${href})`);
  }
  return `${cfg.start}${parts.join(cfg.separator)}${cfg.end}`;
}

function applyLanguageListBlockToBody(
  body: string,
  args: {
    config: I18nDocTranslateConfig;
    cwd: string;
    relPath: string;
    absCurrentFile: string;
    verbose: boolean;
    docStem: string;
    missingBlockTarget?: string;
  }
): string {
  const langCfg = args.config.documentation.markdownOutput.postProcessing?.languageListBlock;
  if (!langCfg) return body;

  const rows = buildLanguageSwitcherRows(args.config, args.cwd);
  if (rows.length === 0) return body;

  const canonical = generateCanonicalLanguageListBlock(
    rows,
    langCfg,
    args.absCurrentFile,
    args.relPath,
    args.cwd,
    args.config,
    args.config.sourceLocale
  );
  const { body: nextBody, replaced } = replaceLanguageListBlockInBody(body, langCfg, canonical);
  if (!replaced && args.verbose) {
    const target = args.missingBlockTarget ?? "translated output";
    console.warn(
      chalk.yellow(
        `   ${args.docStem}: ${target} had no language-list block (${langCfg.start}…${langCfg.end}); lang-list not replaced`
      )
    );
  }
  return nextBody;
}

export function applyRegexAdjustmentsToBody(
  body: string,
  rules: RegexAdjustmentConfig[],
  vars: Record<string, string>,
  verbose: boolean,
  docStem: string
): string {
  if (!rules.length) return body;
  let out = body;
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]!;
    const name = rule.description?.trim() || `rule ${i + 1}`;
    try {
      const re = parseAdjustmentSearchToRegExp(rule.search);
      const replacement = interpolateAdjustmentTemplate(rule.replace, vars);
      out = out.replace(re, () => replacement);
    } catch (e) {
      if (verbose) {
        console.warn(
          chalk.yellow(
            `   ${docStem}: markdownOutput.postProcessing.regexAdjustments "${name}" skipped (invalid regex): ${e}`
          )
        );
      }
    }
  }
  return out;
}

/**
 * Post-process translated markdown: optional regex replacements, then optional language-list block rewrite.
 * Operates on YAML body only (front matter preserved).
 */
export function applyMarkdownPostProcessing(
  markdown: string,
  args: {
    config: I18nDocTranslateConfig;
    cwd: string;
    relPath: string;
    locale: string;
    absSource: string;
    absTranslated: string;
    verbose: boolean;
    docStem: string;
  }
): string {
  const post = args.config.documentation.markdownOutput.postProcessing;
  if (!post) return markdown;

  const rules = post.regexAdjustments ?? [];
  const langCfg = post.languageListBlock;
  if (rules.length === 0 && !langCfg) return markdown;

  const parsed = matter(markdown);
  let body = typeof parsed.content === "string" ? parsed.content : String(parsed.content);

  const vars = buildMarkdownAdjustmentVars(
    args.absSource,
    args.absTranslated,
    args.config.sourceLocale,
    args.locale
  );

  if (rules.length > 0) {
    body = applyRegexAdjustmentsToBody(body, rules, vars, args.verbose, args.docStem);
  }

  if (langCfg) {
    body = applyLanguageListBlockToBody(body, {
      config: args.config,
      cwd: args.cwd,
      relPath: args.relPath,
      absCurrentFile: args.absTranslated,
      verbose: args.verbose,
      docStem: args.docStem,
      missingBlockTarget: "translated output",
    });
  }

  return matterStringify(body, parsed.data);
}

export function applyMarkdownLanguageListPostProcessing(
  markdown: string,
  args: {
    config: I18nDocTranslateConfig;
    cwd: string;
    relPath: string;
    absCurrentFile: string;
    verbose: boolean;
    docStem: string;
    missingBlockTarget?: string;
  }
): string {
  const langCfg = args.config.documentation.markdownOutput.postProcessing?.languageListBlock;
  if (!langCfg) return markdown;

  const parsed = matter(markdown);
  const body = typeof parsed.content === "string" ? parsed.content : String(parsed.content);
  const nextBody = applyLanguageListBlockToBody(body, args);
  return matterStringify(nextBody, parsed.data);
}
