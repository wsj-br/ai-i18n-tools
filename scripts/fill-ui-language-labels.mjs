#!/usr/bin/env node
/**
 * Fill `label` (native / endonym) on ui-languages master JSON using OpenRouter.
 * Reads batches of rows, asks the model for localized display names; merges back by `code`.
 * After each translated label, if the first character is a letter (any script), it is uppercased.
 * Writes the same one-object-per-line JSON array format as build-ui-languages-complete.mjs.
 *
 * Configuration (in order): `--config <path>`, then `./ai-i18n-tools.config.json` (cwd), then repo root.
 * Uses `openrouter.translationModels` (fallback chain), `openrouter.baseUrl`, `maxTokens`, `temperature`,
 * plus top-level `batchSize`, `batchConcurrency` or `concurrency` — same as the main translate pipelines.
 * Override batch tuning: `UI_LABEL_BATCH_SIZE`, `UI_LABEL_CONCURRENCY`.
 * If no config or empty `translationModels`, falls back to `OPENROUTER_MODEL` / `OPENROUTER_TRANSLATION_MODEL` or `openai/gpt-4o-mini`.
 *
 *   node scripts/fill-ui-language-labels.mjs --input data/ui-languages-complete.json [--output <json>] [--config <path>]
 *
 * Requires OPENROUTER_API_KEY.
 */
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { formatUiLanguagesJson } from "./lib/format-ui-languages-json.mjs";
import { getFillLabelRuntimeOptions } from "./lib/load-fill-label-config.mjs";
import { formatDurationMs } from "./lib/format-duration.mjs";

function parseArgs() {
  const a = process.argv.slice(2);
  let input;
  let output;
  let configPath;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--input" && a[i + 1]) {
      input = a[++i];
    } else if (a[i] === "--output" && a[i + 1]) {
      output = a[++i];
    } else if (a[i] === "--config" && a[i + 1]) {
      configPath = a[++i];
    }
  }
  return { input, output, configPath };
}

function extractJsonArray(text) {
  const t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t);
  const body = fence ? fence[1].trim() : t;
  const arr = JSON.parse(body);
  if (!Array.isArray(arr)) throw new Error("Model did not return a JSON array");
  return arr;
}

const SYSTEM_PROMPT = `You are a linguistics assistant. Given rows describing UI locales, you output the customary **native-language endonym** for each locale's \`label\` field — the name speakers use for that language in that region (for display in a language picker).

Rules:
- Use the locale \`code\` (glibc-style, e.g. ar_SA, zh_CN, be_BY@latin) to infer script/variant when relevant.
- \`englishName\` is a hint only; the \`label\` must NOT be English unless it is genuinely the usual autonym (e.g. "Deutsch" for German).
- Preserve correct script (Arabic, Devanagari, CJK, etc.).
- Return **only** valid JSON: a JSON array of objects, each with exactly \`"code"\` (string, same as input) and \`"label"\` (string). No markdown, no commentary.`;

/** OpenRouter: prefer throughput; allow backup providers (same as src/api/openrouter.ts). */
const OPENROUTER_PROVIDER = {
  sort: "throughput",
  allow_fallbacks: true,
};

/**
 * @returns {Promise<{ labels: unknown[], modelUsed: string }>}
 */
async function callModelsWithFallback(apiKey, runtime, userContent) {
  const url = `${runtime.baseUrl}/chat/completions`;
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];
  let lastError;
  for (const model of runtime.models) {
    try {
      const t0 = Date.now();
      const r = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/wsj-br/ai-i18n-tools",
          "X-Title": "ai-i18n-tools fill-ui-language-labels",
        },
        body: JSON.stringify({
          model,
          max_tokens: runtime.maxTokens,
          temperature: runtime.temperature,
          messages,
          provider: OPENROUTER_PROVIDER,
        }),
      });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`OpenRouter HTTP ${r.status}: ${errText.slice(0, 500)}`);
      }
      const j = await r.json();
      const content = j?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("OpenRouter: missing message content");
      }
      const labels = extractJsonArray(content);
      const ms = Date.now() - t0;
      return { labels, modelUsed: model, ms };
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(
        chalk.yellow("   ⚠️ "),
        chalk.yellow.bold(model),
        chalk.gray("→"),
        chalk.gray(msg.slice(0, 120) + (msg.length > 120 ? "…" : ""))
      );
    }
  }
  throw new Error(
    `All translation models failed (${runtime.models.join(", ")}). Last: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

/**
 * After translation: if the first character is a letter (any script), uppercase it; otherwise leave unchanged.
 */
function ensureFirstLetterUppercase(label) {
  const s = typeof label === "string" ? label.trim() : "";
  if (!s) {
    return label;
  }
  const chars = Array.from(s);
  const first = chars[0];
  if (!/\p{L}/u.test(first)) {
    return s;
  }
  return first.toLocaleUpperCase("und") + chars.slice(1).join("");
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function runPool(tasks, concurrency) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  const { input, output, configPath } = parseArgs();
  if (!input) {
    console.error(
      chalk.red("❌"),
      "Usage: fill-ui-language-labels.mjs --input <json> [--output <json>] [--config <path>]"
    );
    process.exit(1);
  }
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.error(chalk.red("❌"), "OPENROUTER_API_KEY is required");
    process.exit(1);
  }

  console.log();
  console.log(chalk.bold.cyan("🏷️  fill-ui-language-labels"));
  console.log(chalk.gray("─".repeat(52)));

  const runtime = getFillLabelRuntimeOptions({ explicitConfigPath: configPath });
  if (runtime.configPath) {
    console.log(chalk.blue("📋"), chalk.bold("Config"), chalk.gray(path.relative(process.cwd(), runtime.configPath) || runtime.configPath));
  } else {
    console.log(
      chalk.yellow("⚠️ "),
      chalk.bold("No ai-i18n-tools.config.json found"),
      chalk.gray("(cwd + repo root) — using env / default models")
    );
  }

  console.log(chalk.blue("🤖"), chalk.bold("OpenRouter"));
  console.log(
    chalk.gray("   baseUrl:"),
    chalk.white(runtime.baseUrl)
  );
  console.log(
    chalk.gray("   maxTokens:"),
    chalk.white(String(runtime.maxTokens)),
    chalk.gray("· temperature:"),
    chalk.white(String(runtime.temperature))
  );
  console.log(
    chalk.gray("   batchSize:"),
    chalk.white(String(runtime.batchSize)),
    chalk.gray("· concurrency:"),
    chalk.white(String(runtime.concurrency))
  );
  console.log(chalk.gray("   model chain:"));
  for (let i = 0; i < runtime.models.length; i++) {
    const arrow = i === 0 ? "→" : "↳";
    console.log(chalk.gray(`   ${arrow}`), chalk.white(runtime.models[i]));
  }

  const outPath = output ? path.resolve(output) : path.resolve(input);
  const inPath = path.resolve(input);

  console.log();
  console.log(chalk.blue("📂"), chalk.bold("Read input"));
  console.log(chalk.gray(`   ${inPath}`));

  const raw = fs.readFileSync(inPath, "utf8");
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) throw new Error("Input must be a JSON array");

  const batches = chunk(rows, runtime.batchSize);
  console.log(
    chalk.green("✅"),
    `${chalk.white(rows.length)} entries · ${chalk.white(batches.length)} batch(es)`,
    chalk.gray(`(${runtime.batchSize} rows/batch, ${runtime.concurrency} parallel)`)
  );

  console.log();
  console.log(chalk.magenta("🌐"), chalk.bold("Calling OpenRouter (native endonyms)…"));
  console.log();

  const tasks = batches.map(
    (batch, bi) => async () => {
      const payload = batch.map((r) => ({
        code: r.code,
        englishName: r.englishName,
        direction: r.direction ?? "ltr",
      }));
      const userContent = `Return a JSON array of { "code", "label" } for these locales (same order not required; match by code):\n${JSON.stringify(payload, null, 2)}`;
      const { labels, modelUsed, ms } = await callModelsWithFallback(apiKey, runtime, userContent);
      const byCode = new Map(labels.map((x) => [x.code, x.label]));
      for (const r of batch) {
        const lab = byCode.get(r.code);
        if (typeof lab === "string" && lab.trim()) {
          r.label = ensureFirstLetterUppercase(lab.trim());
        }
      }
      console.log(
        chalk.green("✅"),
        chalk.bold(`Batch ${bi + 1}/${batches.length}`),
        chalk.gray("·"),
        chalk.white(`${batch.length} locales`),
        chalk.gray("·"),
        chalk.cyan(modelUsed),
        chalk.gray(`· ${formatDurationMs(ms)}`)
      );
    }
  );

  const tAll = Date.now();
  await runPool(tasks, runtime.concurrency);
  const totalMs = Date.now() - tAll;

  console.log();
  fs.writeFileSync(outPath, formatUiLanguagesJson(rows), "utf8");
  console.log(chalk.blue("💾"), chalk.bold("Wrote output"));
  console.log(chalk.gray(`   ${outPath}`));
  console.log(
    chalk.green("✅"),
    `${rows.length} rows · ${chalk.white(formatDurationMs(totalMs))} total`,
    chalk.gray(`(${kb(fs.statSync(outPath).size)})`)
  );
  console.log();
  console.log(chalk.bold.green("Done."));
  console.log();
}

function kb(n) {
  return `${(n / 1024).toFixed(1)} KB`;
}

main().catch((e) => {
  console.log();
  console.error(chalk.red("❌"), e instanceof Error ? e.message : String(e));
  if (e instanceof Error && e.stack) {
    console.error(chalk.gray(e.stack));
  }
  process.exit(1);
});
