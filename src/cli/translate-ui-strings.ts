import fs from "fs";
import path from "path";
import type { I18nConfig } from "../core/types.js";
import { OpenRouterClient } from "../api/openrouter.js";
import { normalizeLocale } from "../core/config.js";
import { resolveStringsJsonPath, writeAtomicUtf8 } from "./helpers.js";

const UI_CHUNK = 50;

export interface TranslateUIOptions {
  cwd: string;
  locales: string[];
  force: boolean;
  dryRun: boolean;
  verbose: boolean;
}

export interface TranslateUISummary {
  stringsUpdated: number;
  localesTouched: string[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

type StringsFile = Record<string, { source?: string; translated?: Record<string, string> }>;

/**
 * Read `strings.json`, translate missing per-locale entries via OpenRouter (ordered models),
 * write merged `strings.json` and flat `{locale}.json` maps (source → translation) under `ui.flatOutputDir`.
 */
export async function runTranslateUI(
  config: I18nConfig,
  opts: TranslateUIOptions
): Promise<TranslateUISummary> {
  if (!config.features.translateUIStrings) {
    throw new Error("Enable features.translateUIStrings in config");
  }

  const stringsPath = resolveStringsJsonPath(config, opts.cwd);
  if (!fs.existsSync(stringsPath)) {
    throw new Error(`strings.json not found: ${stringsPath} (run extract first)`);
  }

  let strings: StringsFile;
  try {
    strings = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as StringsFile;
  } catch (e) {
    throw new Error(`Invalid strings.json: ${e instanceof Error ? e.message : String(e)}`);
  }

  const entries = Object.entries(strings);
  const outDir = path.join(opts.cwd, config.ui.flatOutputDir);
  fs.mkdirSync(outDir, { recursive: true });

  const srcNorm = normalizeLocale(config.sourceLocale);
  const targets = opts.locales
    .map((l) => normalizeLocale(l))
    .filter((l) => l !== srcNorm);

  if (targets.length === 0) {
    throw new Error("No target locales after excluding sourceLocale");
  }

  let client: OpenRouterClient | null = null;
  if (!opts.dryRun) {
    try {
      client = new OpenRouterClient({ config });
    } catch (e) {
      throw new Error(
        `OPENROUTER_API_KEY required for UI translation: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  let stringsUpdated = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;

  for (const locale of targets) {
    const missing = entries.filter(([_hash, entry]) => {
      const src = entry.source ?? "";
      if (!src.trim()) {
        return false;
      }
      if (opts.force) {
        return true;
      }
      const t = entry.translated?.[locale];
      return t === undefined || String(t).trim() === "";
    });

    if (missing.length === 0) {
      if (opts.verbose) {
        console.log(`[translate-ui] ${locale}: up to date`);
      }
    } else {
      if (opts.verbose) {
        console.log(`[translate-ui] ${locale}: ${missing.length} string(s) to translate`);
      }

      for (let i = 0; i < missing.length; i += UI_CHUNK) {
        const chunk = missing.slice(i, i + UI_CHUNK);
        const sources = chunk.map(([, v]) => v.source ?? "");

        if (opts.dryRun || !client) {
          continue;
        }

        const batch = await client.translateUIBatch(sources, locale);
        inputTokens += batch.usage.inputTokens;
        outputTokens += batch.usage.outputTokens;
        costUsd += batch.cost ?? 0;

        chunk.forEach(([h], idx) => {
          const tr = batch.translations[idx];
          if (tr !== undefined && strings[h]) {
            if (!strings[h].translated) {
              strings[h].translated = {};
            }
            strings[h].translated![locale] = tr;
            stringsUpdated++;
          }
        });
      }

      if (!opts.dryRun && missing.length > 0) {
        writeAtomicUtf8(stringsPath, `${JSON.stringify(strings, null, 2)}\n`);
      }
    }

    const flat: Record<string, string> = {};
    for (const entry of Object.values(strings)) {
      const src = entry.source ?? "";
      const tx = entry.translated?.[locale];
      if (src && tx) {
        flat[src] = tx;
      }
    }
    const localePath = path.join(outDir, `${locale}.json`);
    if (!opts.dryRun) {
      writeAtomicUtf8(localePath, `${JSON.stringify(flat, null, 2)}\n`);
    }
    if (opts.verbose) {
      console.log(`[translate-ui] ${locale}: wrote ${Object.keys(flat).length} keys → ${localePath}`);
    }
  }

  return {
    stringsUpdated,
    localesTouched: targets,
    inputTokens,
    outputTokens,
    costUsd,
  };
}
