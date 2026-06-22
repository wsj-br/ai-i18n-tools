#!/usr/bin/env node
/**
 * List a fixed set of UI languages (pt-BR, en, zh-Hans, ar) from the bundled
 * master catalog, like `ai-i18n-tools list-languages`, but with the columns
 * reordered to: Code, English name, Native Name, Dir.
 *
 * Usage:
 *   node scripts/list-selected-languages.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { eastAsianWidth } from "get-east-asian-width";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const CATALOG_PATH = path.join(REPO_ROOT, "data", "ui-languages-complete.json");

const WANTED = ["pt-BR", "en", "zh-Hans", "ar"];

// ── display-width helpers ──────────────────────────────────────────────────

/** Heuristic: emoji code points that terminals render as 2 columns. */
function isEmojiWide(cp) {
  return (
    (cp >= 0x1f300 && cp <= 0x1faff) || // Misc Symbols, Emoticons, Transport, Supplemental
    (cp >= 0x2600  && cp <= 0x26ff)  || // Misc Symbols (☀ ☁ ⛵ …)
    (cp >= 0x2700  && cp <= 0x27bf)  || // Dingbats
    (cp >= 0xfe00  && cp <= 0xfe0f)  || // Variation selectors
    (cp >= 0x1f1e0 && cp <= 0x1f1ff)    // Regional indicator letters (flag sequences)
  );
}

/** Returns the number of terminal columns a single code point occupies. */
function cpWidth(cp) {
  if (cp === 0x200d) return 0;           // Zero-width joiner (ZWJ) — contributes nothing
  if (cp >= 0xfe00 && cp <= 0xfe0f) return 0; // Variation selectors — no extra width
  if (isEmojiWide(cp)) return 2;
  return eastAsianWidth(cp);
}

/** Returns the number of terminal columns a string occupies. */
function displayWidth(str) {
  let width = 0;
  for (const char of str) {
    width += cpWidth(char.codePointAt(0));
  }
  return width;
}

/** Like String.padEnd but column-aware. */
function padEndDisplay(str, targetWidth) {
  const current = displayWidth(str);
  const needed = Math.max(0, targetWidth - current);
  return str + " ".repeat(needed);
}

// ── data ──────────────────────────────────────────────────────────────────

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
const byCode = new Map(catalog.map((entry) => [entry.code, entry]));

const rows = WANTED.map((code) => {
  const entry = byCode.get(code);
  if (!entry) {
    return { code, englishName: "(not found)", label: "", direction: "" };
  }
  const englishName = entry.englishName ?? "";
  return {
    code: entry.code,
    englishName: code === "pt-BR" ? `${englishName} 🌎` : englishName,
    label: entry.label ?? "",
    direction: entry.direction ?? "",
  };
});

// ── column widths (in display columns, not char count) ────────────────────

const codeW   = Math.max(displayWidth("Code"),         ...rows.map((r) => displayWidth(r.code)));
const enW     = Math.max(displayWidth("English name"), ...rows.map((r) => displayWidth(r.englishName)));
const nativeW = Math.max(displayWidth("Native Name"),  ...rows.map((r) => displayWidth(r.label)));

// ── render ────────────────────────────────────────────────────────────────

const header =
  "  " + padEndDisplay("Code",         codeW) +
  "  " + padEndDisplay("English name", enW) +
  "  " + padEndDisplay("Native Name",  nativeW) +
  "  " + "Dir";

const rule =
  "  " + "-".repeat(codeW) +
  "  " + "-".repeat(enW) +
  "  " + "-".repeat(nativeW) +
  "  " + "-".repeat(3);

console.log(header);
console.log(rule);
for (const r of rows) {
  console.log(
    "  " + padEndDisplay(r.code,        codeW) +
    "  " + padEndDisplay(r.englishName, enW) +
    "  " + padEndDisplay(r.label,       nativeW) +
    "  " + r.direction
  );
}
