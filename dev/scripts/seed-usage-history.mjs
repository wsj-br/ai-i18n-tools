#!/usr/bin/env node
/**
 * Seed two years of billed API-call rows so dashboard / `usage` time ranges,
 * monthly rollups, and deletion presets can be exercised locally.
 *
 * Usage (repo root, after `pnpm build`):
 *   pnpm seed:usage
 *   pnpm seed:usage -- --clear --months 24
 *   pnpm seed:usage -- --no-consolidate --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");
const require = createRequire(import.meta.url);

const OPERATIONS = [
  "translate-docs",
  "translate-ui",
  "translate-json",
  "translate-svg",
  "proofread-ui",
  "bench-models",
];

const LOCALES = ["de", "fr", "es", "ja", "ko", "zh-Hans", "zh-Hant", "pt-BR", "hi", null];

/** @type {Array<{ provider: string; models: string[]; reportsCost: boolean; inputPerM: number; outputPerM: number }>} */
const PROVIDERS = [
  {
    provider: "openrouter",
    models: ["qwen/qwen3.7-max", "z-ai/glm-5.2", "minimax/minimax-m2.7"],
    reportsCost: true,
    inputPerM: 0.55,
    outputPerM: 2.2,
  },
  {
    provider: "openai",
    models: ["gpt-4o-mini", "gpt-4o"],
    reportsCost: false,
    inputPerM: 0.15,
    outputPerM: 0.6,
  },
  {
    provider: "anthropic",
    models: ["claude-sonnet-latest"],
    reportsCost: false,
    inputPerM: 3,
    outputPerM: 15,
  },
];

function printHelp() {
  console.log(`Seed usage history for dashboard / CLI testing.

Usage:
  pnpm seed:usage -- [options]

Options:
  --cache-dir <path>   Cache directory (default: .translation-cache)
  --months <n>         UTC calendar months to cover, including the current month (default: 24)
  --seed <n>           PRNG seed (default: 1)
  --clear              Delete existing api_calls + api_totals before inserting
  --no-consolidate     Leave every row in api_calls (skip the 7-day monthly rollup)
  --dry-run            Print what would be inserted without writing
  -h, --help           Show this help
`);
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const out = {
    cacheDir: ".translation-cache",
    months: 24,
    seed: 1,
    clear: false,
    consolidate: true,
    dryRun: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      out.help = true;
    } else if (a === "--clear") {
      out.clear = true;
    } else if (a === "--no-consolidate") {
      out.consolidate = false;
    } else if (a === "--dry-run") {
      out.dryRun = true;
    } else if (a === "--cache-dir") {
      const v = argv[++i];
      if (!v) throw new Error("--cache-dir requires a path");
      out.cacheDir = v;
    } else if (a === "--months") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n < 1) throw new Error("--months must be a positive integer");
      out.months = Math.floor(n);
    } else if (a === "--seed") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n)) throw new Error("--seed must be a number");
      out.seed = n >>> 0;
    } else if (a === "--") {
      // pnpm seed:usage -- --clear
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return out;
}

/** @param {number} seed */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @param {Date} date */
function toSqliteUtcDatetime(date) {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

/** @param {Date} date */
function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * @template T
 * @param {T[]} items
 * @param {() => number} rnd
 */
function pick(items, rnd) {
  return items[Math.floor(rnd() * items.length)] ?? items[0];
}

/**
 * @param {number} min
 * @param {number} max
 * @param {() => number} rnd
 */
function randInt(min, max, rnd) {
  return min + Math.floor(rnd() * (max - min + 1));
}

/**
 * @param {() => number} rnd
 */
function buildCall(createdAt, rnd) {
  const family = pick(PROVIDERS, rnd);
  const model = pick(family.models, rnd);
  const operation = pick(OPERATIONS, rnd);
  const locale = pick(LOCALES, rnd);
  const outcome = rnd() < 0.12 ? "discarded" : "accepted";
  const inputTokens = randInt(120, 8_400, rnd);
  const outputTokens = randInt(40, 2_200, rnd);
  const totalTokens = inputTokens + outputTokens;
  const reportCost = family.reportsCost ? rnd() >= 0.08 : rnd() < 0.12;
  let costUsd = null;
  if (reportCost) {
    const raw =
      (inputTokens / 1_000_000) * family.inputPerM + (outputTokens / 1_000_000) * family.outputPerM;
    costUsd = rnd() < 0.03 ? 0 : Math.round(raw * 1_000_000) / 1_000_000;
  }
  return {
    createdAt,
    provider: family.provider,
    model,
    operation,
    locale,
    outcome,
    inputTokens,
    outputTokens,
    totalTokens,
    costUsd,
  };
}

/**
 * @param {Date} now
 * @param {number} months
 * @param {() => number} rnd
 */
function generateRows(now, months, rnd) {
  /** @type {Array<ReturnType<typeof buildCall>>} */
  const rows = [];
  const todayStart = startOfUtcDay(now);
  const historyStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

  const burstWindows = [
    { minMs: 0, maxMs: 30 * 60 * 1000, count: 12 },
    { minMs: 30 * 60 * 1000, maxMs: 60 * 60 * 1000, count: 10 },
    { minMs: 60 * 60 * 1000, maxMs: 6 * 60 * 60 * 1000, count: 16 },
    { minMs: 6 * 60 * 60 * 1000, maxMs: 12 * 60 * 60 * 1000, count: 12 },
    { minMs: 12 * 60 * 60 * 1000, maxMs: 23 * 60 * 60 * 1000, count: 10 },
  ];
  for (const win of burstWindows) {
    for (let i = 0; i < win.count; i++) {
      const age = win.minMs + rnd() * Math.max(1, win.maxMs - win.minMs);
      const at = new Date(now.getTime() - age);
      if (at < todayStart) continue;
      rows.push(buildCall(toSqliteUtcDatetime(at), rnd));
    }
  }

  for (
    let day = new Date(historyStart);
    day < todayStart;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const ageDays = Math.round((todayStart.getTime() - day.getTime()) / 86_400_000);
    let count = 0;
    if (ageDays <= 7) count = randInt(14, 32, rnd);
    else if (ageDays <= 31) count = randInt(8, 22, rnd);
    else if (ageDays <= 90) count = randInt(5, 16, rnd);
    else if (ageDays <= 365) count = rnd() < 0.85 ? randInt(2, 10, rnd) : 0;
    else count = rnd() < 0.7 ? randInt(1, 6, rnd) : 0;
    for (let i = 0; i < count; i++) {
      const at = new Date(day.getTime() + Math.floor(rnd() * 86_400_000));
      rows.push(buildCall(toSqliteUtcDatetime(at), rnd));
    }
  }

  rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return rows;
}

async function loadTranslationCache() {
  const distPath = path.join(REPO_ROOT, "dist/core/cache.js");
  if (!fs.existsSync(distPath)) {
    throw new Error("dist/core/cache.js not found. Run `pnpm build` first.");
  }
  const mod = await import(pathToFileURL(distPath).href);
  return mod.TranslationCache;
}

function loadSqlite() {
  return require("node:sqlite");
}

/**
 * @param {string} dbFile
 * @param {Array<ReturnType<typeof buildCall>>} rows
 */
function insertRows(dbFile, rows) {
  const { DatabaseSync } = loadSqlite();
  const db = new DatabaseSync(dbFile);
  try {
    const stmt = db.prepare(
      `INSERT INTO api_calls
       (created_at, provider, model, operation, locale, outcome, input_tokens, output_tokens, total_tokens, cost_usd)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    db.exec("BEGIN");
    for (const row of rows) {
      stmt.run(
        row.createdAt,
        row.provider,
        row.model,
        row.operation,
        row.locale,
        row.outcome,
        row.inputTokens,
        row.outputTokens,
        row.totalTokens,
        row.costUsd
      );
    }
    db.exec("COMMIT");
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Keep the original error if rollback itself fails.
    }
    throw err;
  } finally {
    db.close();
  }
}

function main() {
  return (async () => {
    const opts = parseArgs(process.argv.slice(2));
    if (opts.help) {
      printHelp();
      return;
    }

    const now = new Date();
    const rnd = mulberry32(opts.seed);
    const rows = generateRows(now, opts.months, rnd);
    const withCost = rows.filter((r) => r.costUsd != null).length;
    const discarded = rows.filter((r) => r.outcome === "discarded").length;
    const cacheDir = path.resolve(REPO_ROOT, opts.cacheDir);
    const dbFile = path.join(cacheDir, "cache.db");

    console.log(`Seed usage history`);
    console.log(`  now (UTC):     ${toSqliteUtcDatetime(now)}`);
    console.log(`  months:        ${opts.months}`);
    console.log(`  seed:          ${opts.seed}`);
    console.log(`  rows:          ${rows.length} (${withCost} with cost, ${discarded} discarded)`);
    console.log(`  first/last:    ${rows[0]?.createdAt ?? "—"} … ${rows[rows.length - 1]?.createdAt ?? "—"}`);
    console.log(`  cache:         ${dbFile}`);
    console.log(`  consolidate:   ${opts.consolidate ? "yes (keep last 7 UTC calendar days of detail)" : "no"}`);

    if (opts.dryRun) {
      console.log("Dry-run: no database writes.");
      return;
    }

    const TranslationCache = await loadTranslationCache();
    const setup = new TranslationCache(cacheDir);
    if (opts.clear) {
      const cleared = setup.clearUsage(false);
      console.log(
        `Cleared ${cleared.removedCalls} api_calls + ${cleared.removedTotals} api_totals row(s).`
      );
    }
    setup.close();

    insertRows(dbFile, rows);
    console.log(`Inserted ${rows.length} api_calls row(s).`);

    const cache = new TranslationCache(cacheDir);
    try {
      if (opts.consolidate) {
        const { rolledUpCalls } = cache.consolidateApiCalls(now);
        console.log(`Consolidated ${rolledUpCalls} detail row(s) into api_totals.`);
      }
      const stats = cache.getApiCallStats(undefined, now);
      const detail = cache.listApiCalls({ limit: 1, offset: 0 });
      console.log("");
      console.log("Combined totals:");
      console.log(`  calls:         ${stats.summary.calls}`);
      console.log(`  accepted:      ${stats.summary.acceptedCalls}`);
      console.log(`  discarded:     ${stats.summary.discardedCalls}`);
      console.log(`  tokens:        ${stats.summary.totalTokens.toLocaleString()}`);
      console.log(`  actual cost:   $${stats.summary.actualCostUsd.toFixed(6)}`);
      console.log(`  with cost:     ${stats.summary.callsWithCost}`);
      console.log(`  without cost:  ${stats.summary.callsWithoutCost}`);
      console.log(`  months:        ${stats.byMonth.length} (${stats.byMonth.map((m) => m.month).join(", ")})`);
      console.log(`  detail days:   ${stats.byDay.length}`);
      console.log(`  detail rows:   ${detail.total}`);
      console.log("");
      console.log("Next:");
      console.log("  pnpm i18n:dashboard");
      console.log("  node bin/ai-i18n-tools.mjs usage");
      console.log("  node bin/ai-i18n-tools.mjs usage --since 2mo");
      console.log("  node bin/ai-i18n-tools.mjs usage --clear --older-than 1y --dry-run");
    } finally {
      cache.close();
    }
  })();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
