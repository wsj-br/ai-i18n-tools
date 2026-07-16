#!/usr/bin/env node
/**
 * Validate and repair `label` (native endonym) and `direction` (ltr|rtl)
 * on ui-languages master JSON using OpenRouter.
 *
 * Runtime/model chain:
 * - openrouter.translationModels from ai-i18n-tools.config.json
 * - baseUrl / maxTokens / temperature
 * - batchSize / batchConcurrency (or concurrency)
 *
 * Usage:
 *   node dev/scripts/validate-ui-language-labels.mjs --input data/ui-languages-complete.json [--output <json>] [--config <path>]
 *
 * Requires OPENROUTER_API_KEY (env or repo-root `.env` loaded at startup).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { formatUiLanguagesJson } from "./lib/format-ui-languages-json.mjs";
import { formatDurationMs } from "./lib/format-duration.mjs";
import { loadRepoDotenv } from "./lib/load-repo-dotenv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..", "..");
loadRepoDotenv(REPO_ROOT);

const DEFAULT_MODELS = ["openai/gpt-4o-mini"];
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

/** Mirrors {@link resolveTranslationModels} in src/core/config.ts */
function resolveTranslationModels(openrouter) {
  if (!openrouter || typeof openrouter !== "object") {
    return [];
  }
  const o = openrouter;
  if (Array.isArray(o.translationModels) && o.translationModels.length > 0) {
    const list = o.translationModels
      .filter((m) => typeof m === "string" && m.trim().length > 0)
      .map((m) => m.trim());
    if (list.length > 0) {
      return list;
    }
  }
  const out = [];
  if (typeof o.defaultModel === "string" && o.defaultModel.trim()) {
    out.push(o.defaultModel.trim());
  }
  const fb = typeof o.fallbackModel === "string" ? o.fallbackModel.trim() : "";
  if (fb && fb !== out[0]) {
    out.push(fb);
  }
  return out;
}

function envPositiveInt(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === "") {
    return fallback;
  }
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function findAiI18nConfigPath(explicitPath) {
  if (typeof explicitPath === "string" && explicitPath.trim()) {
    const abs = path.resolve(explicitPath.trim());
    if (fs.existsSync(abs)) {
      return abs;
    }
    throw new Error(`Config file not found: ${abs}`);
  }
  const cwdCandidate = path.join(process.cwd(), "ai-i18n-tools.config.json");
  if (fs.existsSync(cwdCandidate)) {
    return cwdCandidate;
  }
  const repoCandidate = path.join(REPO_ROOT, "ai-i18n-tools.config.json");
  if (fs.existsSync(repoCandidate)) {
    return repoCandidate;
  }
  return null;
}

/** Resolve OpenRouter + batch options from `ai-i18n-tools.config.json` (same shape as src/core/config mergeWithDefaults). */
function getFillLabelRuntimeOptions(opts = {}) {
  const configPath = findAiI18nConfigPath(opts.explicitConfigPath);
  let cfg = null;
  if (configPath) {
    cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }

  const or = cfg?.openrouter && typeof cfg.openrouter === "object" ? cfg.openrouter : {};

  let models = resolveTranslationModels(or);
  if (models.length === 0) {
    const single =
      process.env.OPENROUTER_MODEL?.trim() || process.env.OPENROUTER_TRANSLATION_MODEL?.trim() || "";
    models = single ? [single] : [...DEFAULT_MODELS];
  }

  const baseUrl =
    typeof or.baseUrl === "string" && or.baseUrl.trim()
      ? or.baseUrl.trim().replace(/\/$/, "")
      : DEFAULT_BASE_URL;

  const maxTokens =
    typeof or.maxTokens === "number" && Number.isFinite(or.maxTokens) && or.maxTokens > 0
      ? Math.floor(or.maxTokens)
      : 8192;

  const temperature =
    typeof or.temperature === "number" && Number.isFinite(or.temperature) ? or.temperature : 0.2;

  const requestTimeoutMs =
    typeof or.requestTimeoutMs === "number" &&
    Number.isFinite(or.requestTimeoutMs) &&
    or.requestTimeoutMs > 0
      ? Math.floor(or.requestTimeoutMs)
      : 30_000;

  const defaultBatch =
    typeof cfg?.batchSize === "number" && cfg.batchSize > 0 ? Math.floor(cfg.batchSize) : 12;
  const defaultConc =
    typeof cfg?.batchConcurrency === "number" && cfg.batchConcurrency > 0
      ? Math.floor(cfg.batchConcurrency)
      : typeof cfg?.concurrency === "number" && cfg.concurrency > 0
        ? Math.floor(cfg.concurrency)
        : 3;

  const batchSize = envPositiveInt("UI_LABEL_BATCH_SIZE", defaultBatch);
  const concurrency = envPositiveInt("UI_LABEL_CONCURRENCY", defaultConc);

  return {
    configPath,
    baseUrl,
    models,
    maxTokens,
    temperature,
    requestTimeoutMs,
    batchSize,
    concurrency,
  };
}

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
        signal: AbortSignal.timeout(runtime.requestTimeoutMs),
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
