/**
 * Resolve OpenRouter + batch options for fill-ui-language-labels from ai-i18n-tools.config.json
 * (same shape as src/core/config mergeWithDefaults).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_MODELS = ["openai/gpt-4o-mini"];
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

/** Mirrors {@link resolveTranslationModels} in src/core/config.ts */
export function resolveTranslationModels(openrouter) {
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

/**
 * @param {string | undefined} explicitPath - from `--config`
 * @returns {string | null} absolute path or null if not found
 */
export function findAiI18nConfigPath(explicitPath) {
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

/**
 * @param {{ explicitConfigPath?: string }} opts
 * @returns {{
 *   configPath: string | null,
 *   baseUrl: string,
 *   models: string[],
 *   maxTokens: number,
 *   temperature: number,
 *   batchSize: number,
 *   concurrency: number,
 * }}
 */
export function getFillLabelRuntimeOptions(opts = {}) {
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
    batchSize,
    concurrency,
  };
}
