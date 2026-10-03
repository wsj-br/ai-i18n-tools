import fs from "fs";
import path from "path";
import { t } from "../i18n/index.js";
import type { I18nDocTranslateConfig } from "../core/types.js";
import { resolveDocumentationOutputPath, toPosix } from "../core/output-paths.js";
import { buildLanguageSwitcherRows, type LocaleLabelStyle } from "./doc-postprocess.js";

export const DEFAULT_LANG_LIST_START = "<!-- ai-i18n:lang-list -->";
export const DEFAULT_LANG_LIST_END = "<!-- /ai-i18n:lang-list -->";
export const DEFAULT_HREFLANG_START = "<!-- ai-i18n:hreflang -->";
export const DEFAULT_HREFLANG_END = "<!-- /ai-i18n:hreflang -->";

export interface HtmlLanguageListConfig {
  start: string;
  end: string;
  format: "links" | "select";
  separator: string;
  label: LocaleLabelStyle;
}

export interface HtmlHreflangConfig {
  start: string;
  end: string;
  siteUrl?: string;
  xDefault?: string;
  stripIndexHtml: boolean;
}

export interface HtmlMarkerContext {
  cwd: string;
  config: I18nDocTranslateConfig;
  /** Locale of the file being written. Source refresh passes `sourceLocale`. */
  locale: string;
  sourceRelPath: string;
  /** Absolute path of the file whose links are relative (output file, or the source on refresh). */
  absCurrentFile: string;
  /** Locales that have (or will have) an output for this page. Source locale is always included. */
  availableLocales: ReadonlySet<string>;
  languageList?: HtmlLanguageListConfig;
  hreflang?: HtmlHreflangConfig;
  verbose?: boolean;
  /** When true, missing markers are not warned (used while scanning pages that opted out). */
  quiet?: boolean;
}

const PROTECTED_REGION = /<(script|style|pre|code)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

/**
 * Replace language-list and hreflang marker interiors.
 * Markers inside script, style, pre, and code are left alone.
 * Returns the original string when neither block is present.
 */
export function applyHtmlMarkerBlocks(html: string, ctx: HtmlMarkerContext): string {
  const lang = ctx.languageList ?? defaultLanguageList();
  const href = ctx.hreflang ?? defaultHreflang();
  const withLang = replaceUnprotectedRegions(html, lang.start, lang.end, () =>
    languageListInner(ctx, lang)
  );
  if (withLang.replaced === 0 && ctx.languageList && ctx.verbose && !ctx.quiet) {
    console.warn(t("{{path}}: no language-list markers", { path: ctx.sourceRelPath }));
  }
  const withHref = replaceUnprotectedRegions(withLang.html, href.start, href.end, () =>
    hreflangInner(ctx, href)
  );
  if (withHref.replaced === 0 && ctx.hreflang && ctx.verbose && !ctx.quiet) {
    console.warn(t("{{path}}: no hreflang markers", { path: ctx.sourceRelPath }));
  }
  return withHref.html;
}

export function defaultLanguageList(): HtmlLanguageListConfig {
  return {
    start: DEFAULT_LANG_LIST_START,
    end: DEFAULT_LANG_LIST_END,
    format: "links",
    separator: " · ",
    label: "local",
  };
}

export function defaultHreflang(): HtmlHreflangConfig {
  return {
    start: DEFAULT_HREFLANG_START,
    end: DEFAULT_HREFLANG_END,
    stripIndexHtml: false,
  };
}

function maskProtected(html: string): string {
  return html.replace(PROTECTED_REGION, (match) => " ".repeat(match.length));
}

/** Replace every start/end pair that is outside script, style, pre, and code. */
function replaceUnprotectedRegions(
  html: string,
  start: string,
  end: string,
  inner: () => string
): { html: string; replaced: number } {
  const masked = maskProtected(html);
  const ranges: { startAt: number; endAt: number }[] = [];
  let cursor = 0;
  while (cursor < masked.length) {
    const startAt = masked.indexOf(start, cursor);
    if (startAt < 0) break;
    const endAt = masked.indexOf(end, startAt + start.length);
    if (endAt < 0) break;
    ranges.push({ startAt, endAt });
    cursor = endAt + end.length;
  }
  if (ranges.length === 0) return { html, replaced: 0 };
  const body = inner();
  let out = html;
  for (let i = ranges.length - 1; i >= 0; i--) {
    const range = ranges[i]!;
    out = out.slice(0, range.startAt + start.length) + body + out.slice(range.endAt);
  }
  return { html: out, replaced: ranges.length };
}

function pageHref(
  ctx: HtmlMarkerContext,
  targetLocale: string,
  hreflang: HtmlHreflangConfig | HtmlLanguageListConfig
): string {
  const source = ctx.config.sourceLocale;
  const absTarget =
    targetLocale === source
      ? path.resolve(ctx.cwd, ctx.sourceRelPath)
      : resolveDocumentationOutputPath(
          ctx.config,
          ctx.cwd,
          targetLocale,
          ctx.sourceRelPath,
          "html"
        );
  let rel = toPosix(path.relative(path.dirname(ctx.absCurrentFile), absTarget));
  if (!rel) rel = `./${path.basename(absTarget)}`;
  if (!rel.startsWith(".")) rel = `./${rel}`;
  if ("stripIndexHtml" in hreflang && hreflang.stripIndexHtml) {
    rel = rel.replace(/\/index\.html?$/i, "/").replace(/^\.\/index\.html?$/i, "./");
  }
  const siteUrl = "siteUrl" in hreflang ? hreflang.siteUrl?.replace(/\/$/, "") : undefined;
  if (siteUrl) {
    const web = rel.replace(/^\.\//, "");
    return `${siteUrl}/${web}`;
  }
  return rel;
}

function languageListInner(ctx: HtmlMarkerContext, cfg: HtmlLanguageListConfig): string {
  const rows = buildLanguageSwitcherRows(ctx.config, ctx.cwd, cfg.label).filter((row) =>
    ctx.availableLocales.has(row.code)
  );
  const insideList = markersInsideList(ctx, cfg);
  if (cfg.format === "select") {
    return rows
      .map((row) => {
        const selected = row.code === ctx.locale ? " selected" : "";
        return `<option value="${escapeAttr(pageHref(ctx, row.code, cfg))}" lang="${escapeAttr(row.code)}"${selected}>${escapeText(row.label)}</option>`;
      })
      .join("");
  }
  const links = rows.map((row) => {
    const current = row.code === ctx.locale ? ` aria-current="true"` : "";
    const body = `<a href="${escapeAttr(pageHref(ctx, row.code, cfg))}" lang="${escapeAttr(row.code)}" hreflang="${escapeAttr(row.code)}"${current}>${escapeText(row.label)}</a>`;
    return insideList ? `<li>${body}</li>` : body;
  });
  return insideList ? links.join("") : links.join(cfg.separator);
}

function hreflangInner(ctx: HtmlMarkerContext, cfg: HtmlHreflangConfig): string {
  if (!cfg.siteUrl) {
    console.warn(
      t("{{path}}: hreflang siteUrl is unset; writing relative alternate links", {
        path: ctx.sourceRelPath,
      })
    );
  }
  const rows = buildLanguageSwitcherRows(ctx.config, ctx.cwd, "local").filter((row) =>
    ctx.availableLocales.has(row.code)
  );
  const links = rows.map(
    (row) =>
      `<link rel="alternate" hreflang="${escapeAttr(row.code)}" href="${escapeAttr(pageHref(ctx, row.code, cfg))}">`
  );
  const xDefault = cfg.xDefault || ctx.config.sourceLocale;
  if (ctx.availableLocales.has(xDefault)) {
    links.push(
      `<link rel="alternate" hreflang="x-default" href="${escapeAttr(pageHref(ctx, xDefault, cfg))}">`
    );
  }
  return links.join("");
}

function markersInsideList(ctx: HtmlMarkerContext, cfg: HtmlLanguageListConfig): boolean {
  const abs = path.resolve(ctx.cwd, ctx.sourceRelPath);
  let html: string;
  try {
    html = fs.readFileSync(abs, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
    return false;
  }
  const startAt = html.indexOf(cfg.start);
  if (startAt < 0) return false;
  const before = html.slice(0, startAt);
  const ul = Math.max(
    before.lastIndexOf("<ul"),
    before.lastIndexOf("<nav"),
    before.lastIndexOf("<ol")
  );
  if (ul < 0) return false;
  const close =
    before.lastIndexOf("</ul>") > ul ||
    before.lastIndexOf("</nav>") > ul ||
    before.lastIndexOf("</ol>") > ul;
  return !close;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}
