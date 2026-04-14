#!/usr/bin/env node
/**
 * Build data/ui-languages-complete.json from:
 * - Wikimedia Meta: Template:List_of_language_names_ordered_by_code (English name + direction; first row wins per code)
 * - lh.2xlibre.net/locales/ (glibc locale ids: first column)
 *
 * Each output row: code is BCP-47-style (`de`, `de-DE`, `fr-FR`) plus bare 2–3 letter ISO 639 tags for each
 * language that appears in the glibc list; englishName = "{Wiki English}" for bare tags and "{Wiki English} ({CC})"
 * for regional rows; direction from wiki base language,
 * label starts as englishName; native endonyms are filled by scripts/fill-ui-language-labels.mjs when OPENROUTER_API_KEY is set (skip with --no-labels). The fill step reads ai-i18n-tools.config.json (see that script for --config and paths).
 *
 * Usage: node scripts/build-ui-languages-complete.mjs [--no-labels] [--no-fetch] [--wiki-cache path] [--libre-cache path]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import chalk from "chalk";
import { formatUiLanguagesJson } from "./lib/format-ui-languages-json.mjs";
import { formatDurationMs } from "./lib/format-duration.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data", "ui-languages-complete.json");

const WIKI_API =
  "https://meta.wikimedia.org/w/api.php?action=parse&page=Template:List_of_language_names_ordered_by_code&prop=text&format=json";
const LIBRE_URL = "https://lh.2xlibre.net/locales/";

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @returns {Map<string, { englishName: string, direction: 'ltr'|'rtl' }>}
 */
function parseWikimediaWikiTable(html) {
  const map = new Map();
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = trRe.exec(html)) !== null) {
    const inner = m[1];
    const tds = [...inner.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (tds.length < 3) continue;
    const code = stripTags(tds[0][1]);
    const english = stripTags(tds[1][1]);
    const dirRaw = stripTags(tds[2][1]).toLowerCase();
    if (!code || /^code$/i.test(code)) continue;
    if (!english || /English\s*language\s*name/i.test(english)) continue;
    if (map.has(code)) continue;
    const direction = dirRaw.startsWith("rtl") ? "rtl" : "ltr";
    map.set(code, { englishName: english, direction });
  }
  return map;
}

async function fetchWikiHtml() {
  const r = await fetch(WIKI_API);
  if (!r.ok) throw new Error(`Wikimedia API HTTP ${r.status}`);
  const j = await r.json();
  const html = j?.parse?.text?.["*"];
  if (typeof html !== "string") throw new Error("Wikimedia API: missing parse.text");
  return html;
}

/**
 * Extract glibc locale ids and optional "— Name —" middle column from 2xlibre HTML table.
 * @returns {{ localeIds: string[], lineByLocale: Map<string, string> }}
 */
function parseLibreLocales(html) {
  const ids = [];
  const lineByLocale = new Map();
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = trRe.exec(html)) !== null) {
    const inner = m[1];
    const linkMatch = /<a href="\/locale\/([^/]+)\/">/.exec(inner);
    if (!linkMatch) continue;
    const localeId = linkMatch[1];
    const nameMatch = /<td>—\s*([^—]+?)\s*—<\/td>/.exec(inner);
    const middle = nameMatch ? nameMatch[1].trim() : "";
    ids.push(localeId);
    lineByLocale.set(localeId, middle ? `| — ${middle} —` : "");
  }
  const localeIds = [...new Set(ids)].sort();
  return { localeIds, lineByLocale };
}

async function fetchLibrePage() {
  const r = await fetch(LIBRE_URL);
  if (!r.ok) throw new Error(`2xlibre HTTP ${r.status}`);
  return r.text();
}

/** ISO region (2 letters) for bracket suffix, e.g. be_BY@latin -> BY */
function regionForEnglishName(localeId) {
  const i = localeId.indexOf("_");
  if (i === -1) return null;
  const rest = localeId.slice(i + 1);
  const m = /^([A-Za-z]{2})/.exec(rest);
  return m ? m[1].toUpperCase() : null;
}

/** Wikimedia language code: part before first underscore */
function wikiLangKey(localeId) {
  const i = localeId.indexOf("_");
  return i === -1 ? localeId : localeId.slice(0, i);
}

/** Middle column "— Name —" fallback when wiki misses */
function languageNameFromLibreLine(line) {
  const m = /\|\s*—\s*([^—|]+?)\s*—/.exec(line);
  return m ? m[1].trim() : null;
}

/**
 * Stable key for deduping glibc ids that map to the same BCP-47 region tag (e.g. de_DE@euro vs de_DE).
 * Uses lowercase lang + uppercase region when present.
 */
function primaryBcp47DedupeKey(localeId) {
  const at = localeId.indexOf("@");
  const base = at === -1 ? localeId : localeId.slice(0, at);
  const parts = base.split("_");
  if (parts.length < 2) {
    return parts[0].toLowerCase();
  }
  return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
}

/**
 * Glibc locale id → BCP-47-style code (hyphen + ISO region), preserving @modifiers when present.
 * de_DE → de-DE, en_GB → en-GB, zh_CN → zh-CN, eo → eo, be_BY@latin → be-BY@latin
 */
function localeIdToBcp47Code(localeId) {
  const at = localeId.indexOf("@");
  const base = at === -1 ? localeId : localeId.slice(0, at);
  const modifier = at === -1 ? "" : localeId.slice(at);

  const parts = base.split("_");
  if (parts.length === 1) {
    return parts[0].toLowerCase() + modifier;
  }
  const lang = parts[0].toLowerCase();
  const rest = parts.slice(1);
  const region0 = rest[0];
  const regionOut = /^[A-Za-z]{2}$/.test(region0) ? region0.toUpperCase() : region0;
  const extra = rest.length > 1 ? `_${rest.slice(1).join("_")}` : "";
  return `${lang}-${regionOut}${extra}${modifier}`;
}

/**
 * Regional rows: one entry per (language, region) after BCP-47 normalization; @euro/@latin duplicates collapsed.
 */
function buildRegionalRows(wiki, localeIds, lineByLocale) {
  const byPrimary = new Map();
  for (const localeId of localeIds) {
    const lang = wikiLangKey(localeId);
    const region = regionForEnglishName(localeId);
    const wikiRow = wiki.get(lang);
    const line = lineByLocale.get(localeId) ?? "";
    const fallbackName = languageNameFromLibreLine(line);
    let englishBase = wikiRow?.englishName ?? fallbackName;
    if (!englishBase) {
      englishBase = lang;
    }
    const englishName = region != null ? `${englishBase} (${region})` : englishBase;
    const direction = wikiRow?.direction ?? "ltr";
    const code = localeIdToBcp47Code(localeId);
    const key = primaryBcp47DedupeKey(localeId);
    const row = {
      code,
      label: englishName,
      englishName,
      direction,
    };
    if (!byPrimary.has(key)) {
      byPrimary.set(key, row);
    }
  }
  return [...byPrimary.values()];
}

/**
 * Bare ISO 639 language codes (2–3 letters) for every language subtag that appears in the glibc list.
 */
function buildBareLanguageRows(wiki, localeIds) {
  const langs = new Set();
  for (const localeId of localeIds) {
    langs.add(wikiLangKey(localeId));
  }
  const rows = [];
  for (const lang of langs) {
    const w = wiki.get(lang);
    if (!w) {
      continue;
    }
    rows.push({
      code: lang.toLowerCase(),
      label: w.englishName,
      englishName: w.englishName,
      direction: w.direction,
    });
  }
  return rows;
}

function mergeAndSortRows(bare, regional) {
  const byNorm = new Map();
  const norm = (c) => c.trim().replace(/-/g, "_").toLowerCase();
  for (const r of regional) {
    byNorm.set(norm(r.code), r);
  }
  for (const b of bare) {
    const k = norm(b.code);
    if (!byNorm.has(k)) {
      byNorm.set(k, b);
    }
  }
  const merged = [...byNorm.values()];
  merged.sort((a, b) => a.code.localeCompare(b.code, "en"));
  return merged;
}

function buildRows(wiki, localeIds, lineByLocale) {
  const bare = buildBareLanguageRows(wiki, localeIds);
  const regional = buildRegionalRows(wiki, localeIds, lineByLocale);
  return mergeAndSortRows(bare, regional);
}

function kb(n) {
  return `${(n / 1024).toFixed(1)} KB`;
}

async function main() {
  const argv = process.argv.slice(2);
  const noLabels = argv.includes("--no-labels");
  const noFetch = argv.includes("--no-fetch");
  const wikiCache = argv.includes("--wiki-cache")
    ? argv[argv.indexOf("--wiki-cache") + 1]
    : null;
  const libreCache = argv.includes("--libre-cache")
    ? argv[argv.indexOf("--libre-cache") + 1]
    : null;

  console.log();
  console.log(chalk.bold.cyan("📚 build-ui-languages-complete"));
  console.log(chalk.gray("─".repeat(52)));
  console.log(
    chalk.gray("Output:"),
    chalk.white(path.relative(process.cwd(), OUT) || OUT)
  );
  if (noFetch) {
    console.log(chalk.magenta("⏭ "), chalk.bold("--no-fetch"), chalk.gray("(use cache files only)"));
  }
  if (noLabels) {
    console.log(chalk.magenta("⏭ "), chalk.bold("--no-labels"), chalk.gray("(skip OpenRouter native labels)"));
  }
  console.log();

  let wikiHtml;
  if (wikiCache && fs.existsSync(wikiCache)) {
    console.log(chalk.blue("📂"), chalk.bold("Wikimedia template HTML"), chalk.gray("(cache file)"));
    console.log(chalk.gray(`   ${path.resolve(wikiCache)}`));
    wikiHtml = fs.readFileSync(wikiCache, "utf8");
    console.log(chalk.green("✅"), `Read ${kb(wikiHtml.length)}`);
  } else if (noFetch) {
    throw new Error("Need --wiki-cache when using --no-fetch");
  } else {
    console.log(chalk.blue("🌐"), chalk.bold("Fetching Wikimedia Meta API"));
    console.log(chalk.gray(`   Template: List_of_language_names_ordered_by_code`));
    console.log(chalk.gray(`   ${WIKI_API}`));
    const t0 = Date.now();
    wikiHtml = await fetchWikiHtml();
    const ms = Date.now() - t0;
    console.log(
      chalk.green("✅"),
      `HTTP ${chalk.white("200")} in ${chalk.white(formatDurationMs(ms))} · ${kb(wikiHtml.length)} HTML`
    );
  }

  console.log();
  let libreText;
  if (libreCache && fs.existsSync(libreCache)) {
    console.log(chalk.blue("📂"), chalk.bold("2xlibre locales page"), chalk.gray("(cache file)"));
    console.log(chalk.gray(`   ${path.resolve(libreCache)}`));
    libreText = fs.readFileSync(libreCache, "utf8");
    console.log(chalk.green("✅"), `Read ${kb(libreText.length)}`);
  } else if (noFetch) {
    throw new Error("Need --libre-cache when using --no-fetch");
  } else {
    console.log(chalk.blue("🌐"), chalk.bold("Fetching Locale Helper (glibc locale list)"));
    console.log(chalk.gray(`   ${LIBRE_URL}`));
    const t0 = Date.now();
    libreText = await fetchLibrePage();
    const ms = Date.now() - t0;
    console.log(
      chalk.green("✅"),
      `HTTP ${chalk.white("200")} in ${chalk.white(formatDurationMs(ms))} · ${kb(libreText.length)} HTML`
    );
  }

  console.log();
  console.log(chalk.magenta("⚙️ "), chalk.bold("Parse Wikimedia language table"));
  const wiki = parseWikimediaWikiTable(wikiHtml);
  console.log(
    chalk.green("✅"),
    `${chalk.white(wiki.size)} unique language codes`,
    chalk.gray("(English name + direction, first row wins)")
  );

  console.log();
  console.log(chalk.magenta("⚙️ "), chalk.bold("Parse 2xlibre locale rows"));
  const { localeIds, lineByLocale } = parseLibreLocales(libreText);
  console.log(
    chalk.green("✅"),
    `${chalk.white(localeIds.length)} glibc locale ids`,
    chalk.gray("(from HTML table)")
  );

  console.log();
  console.log(chalk.magenta("🔧"), chalk.bold("Merge wiki + locales → catalog rows"));
  const rows = buildRows(wiki, localeIds, lineByLocale);
  console.log(chalk.green("✅"), `Built ${chalk.white(rows.length)} entries`, chalk.gray("(label = englishName until fill step)"));

  console.log();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, formatUiLanguagesJson(rows), "utf8");
  console.log(chalk.blue("💾"), chalk.bold("Wrote master file"));
  console.log(chalk.gray(`   ${OUT}`));
  console.log(chalk.green("✅"), `${rows.length} rows · ${kb(fs.statSync(OUT).size)} on disk`);

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const shouldFillLabels = !noLabels && Boolean(apiKey);
  console.log();
  if (shouldFillLabels) {
    console.log(chalk.cyan("🏷️ "), chalk.bold("Filling native labels via OpenRouter"));
    console.log(chalk.gray("   Spawning scripts/fill-ui-language-labels.mjs …"));
    const fillScript = path.join(__dirname, "fill-ui-language-labels.mjs");
    const t0 = Date.now();
    const res = spawnSync(process.execPath, [fillScript, "--input", OUT, "--output", OUT], {
      stdio: "inherit",
      cwd: ROOT,
      env: process.env,
    });
    const ms = Date.now() - t0;
    if (res.status !== 0) {
      console.log(chalk.red("❌"), `fill-ui-language-labels exited with code ${res.status ?? "?"}`);
      process.exit(res.status ?? 1);
    }
    console.log(chalk.green("✅"), `Native labels done in ${chalk.white(formatDurationMs(ms))}`);
  } else if (!noLabels && !apiKey) {
    console.log(chalk.yellow("⚠️ "), chalk.bold("Skipping native labels"));
    console.log(
      chalk.gray(
        "   OPENROUTER_API_KEY is not set — `label` stays English (same as englishName)."
      )
    );
    console.log(chalk.gray("   Export the key and re-run, or pass --no-labels to silence this."));
  } else {
    console.log(chalk.gray("   (Native labels skipped: --no-labels)"));
  }

  console.log();
  console.log(chalk.bold.green("Done."));
  console.log();
}

main().catch((e) => {
  console.log();
  console.error(chalk.red("❌"), e instanceof Error ? e.message : String(e));
  if (e instanceof Error && e.stack) {
    console.error(chalk.gray(e.stack));
  }
  process.exit(1);
});
