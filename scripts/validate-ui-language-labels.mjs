#!/usr/bin/env node
/**
 * Validate and repair `label` (native endonym) and `direction` (ltr|rtl)
 * on ui-languages master JSON using OpenRouter.
 *
 * Uses the same runtime/model chain as fill-ui-language-labels:
 * - openrouter.translationModels from ai-i18n-tools.config.json
 * - baseUrl / maxTokens / temperature
 * - batchSize / batchConcurrency (or concurrency)
 *
 * Usage:
 *   node scripts/validate-ui-language-labels.mjs --input data/ui-languages-complete.json [--output <json>] [--config <path>]
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

const SYSTEM_PROMPT = `You are a senior localization QA reviewer for language-picker metadata.

Task:
- Audit each locale row and correct mistakes in:
  1) "label": the language name shown to users, ideally in that language's customary autonym/endonym
  2) "direction": writing direction ("ltr" or "rtl")

Input guarantees:
- Every item has: "code", "englishName", "label", "direction".

Rules:
- Keep "code" EXACTLY unchanged.
- Return one item for every input code.
- "direction" must be exactly "ltr" or "rtl".
- Use "rtl" only for languages/scripts that are normally right-to-left.
- Keep labels concise and natural for a language selector.
- Prefer native-script/autonym labels when widely used; avoid transliteration unless native script is impractical.
- Do not translate country suffixes into English; preserve locale specificity when the label includes it.
- If current value is already correct, keep it.

Output contract (strict):
- Output ONLY valid JSON (no markdown, no commentary).
- JSON array of objects, each with exactly:
  - "code": string (same as input)
  - "label": string (non-empty)
  - "direction": "ltr" | "rtl"`;

const OPENROUTER_PROVIDER = {
  sort: "throughput",
  allow_fallbacks: true,
};

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
          "X-Title": "ai-i18n-tools validate-ui-language-labels",
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
      const reviewRows = extractJsonArray(content);
      const ms = Date.now() - t0;
      return { reviewRows, modelUsed: model, ms };
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

function normalizeDirection(value) {
  if (typeof value !== "string") {
    return null;
  }
  const v = value.trim().toLowerCase();
  if (v === "ltr" || v === "rtl") {
    return v;
  }
  return null;
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
      "Usage: validate-ui-language-labels.mjs --input <json> [--output <json>] [--config <path>]"
    );
    process.exit(1);
  }
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.error(chalk.red("❌"), "OPENROUTER_API_KEY is required");
    process.exit(1);
  }

  console.log();
  console.log(chalk.bold.cyan("🧪 validate-ui-language-labels"));
  console.log(chalk.gray("─".repeat(52)));

  const runtime = getFillLabelRuntimeOptions({ explicitConfigPath: configPath });
  if (runtime.configPath) {
    console.log(
      chalk.blue("📋"),
      chalk.bold("Config"),
      chalk.gray(path.relative(process.cwd(), runtime.configPath) || runtime.configPath)
    );
  } else {
    console.log(
      chalk.yellow("⚠️ "),
      chalk.bold("No ai-i18n-tools.config.json found"),
      chalk.gray("(cwd + repo root) — using env / default models")
    );
  }

  console.log(chalk.blue("🤖"), chalk.bold("OpenRouter"));
  console.log(chalk.gray("   baseUrl:"), chalk.white(runtime.baseUrl));
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
  console.log(chalk.magenta("🌐"), chalk.bold("Calling OpenRouter (label + direction QA)…"));
  console.log();

  let labelChanges = 0;
  let directionChanges = 0;
  const tasks = batches.map(
    (batch, bi) => async () => {
      const payload = batch.map((r) => ({
        code: r.code,
        englishName: r.englishName,
        label: r.label,
        direction: r.direction ?? "ltr",
      }));
      const userContent = `Validate and repair these locale rows:\n${JSON.stringify(payload, null, 2)}`;
      const { reviewRows, modelUsed, ms } = await callModelsWithFallback(apiKey, runtime, userContent);
      const byCode = new Map(reviewRows.map((x) => [x.code, x]));
      for (const row of batch) {
        const reviewed = byCode.get(row.code);
        if (!reviewed || typeof reviewed !== "object") {
          continue;
        }
        const reviewedLabel =
          typeof reviewed.label === "string" && reviewed.label.trim()
            ? reviewed.label.trim()
            : null;
        const reviewedDirection = normalizeDirection(reviewed.direction);
        if (reviewedLabel && reviewedLabel !== row.label) {
          row.label = reviewedLabel;
          labelChanges++;
        }
        if (reviewedDirection && reviewedDirection !== row.direction) {
          row.direction = reviewedDirection;
          directionChanges++;
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
  console.log(
    chalk.gray("   changes:"),
    chalk.white(`${labelChanges} labels`),
    chalk.gray("·"),
    chalk.white(`${directionChanges} directions`)
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
