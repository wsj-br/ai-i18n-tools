import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { resolveTranslationModels } from "../core/config.js";
import {
  fetchOpenRouterModelsCatalog,
  formatUsdPerMillionTokens,
  isExpirationDatePast,
  type OpenRouterCatalogModelEntry,
} from "../api/openrouter-models-catalog.js";

export interface RunCheckModelsResult {
  exitCode: number;
}

export async function runCheckModels(config: I18nConfig): Promise<RunCheckModelsResult> {
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  if (!apiKey) {
    console.error(chalk.red("OPENROUTER_API_KEY is required"));
    return { exitCode: 1 };
  }

  const configured = resolveTranslationModels(config.openrouter);
  if (configured.length === 0) {
    console.error(
      chalk.red(
        "No OpenRouter models configured (set openrouter.translationModels or defaultModel / fallbackModel)."
      )
    );
    return { exitCode: 1 };
  }

  let catalog: Map<string, OpenRouterCatalogModelEntry>;
  try {
    catalog = await fetchOpenRouterModelsCatalog({
      baseUrl: config.openrouter.baseUrl,
      apiKey,
      requestTimeoutMs: config.openrouter.requestTimeoutMs,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(chalk.red(msg));
    return { exitCode: 1 };
  }

  const missing: { id: string; reason: string }[] = [];
  const expired: { id: string; expirationDate: string }[] = [];
  const ok: { id: string; entry: OpenRouterCatalogModelEntry }[] = [];

  for (const id of configured) {
    const entry = catalog.get(id);
    if (!entry) {
      missing.push({ id, reason: "not in OpenRouter catalog" });
      continue;
    }
    const exp = entry.expiration_date;
    if (typeof exp === "string" && isExpirationDatePast(exp)) {
      expired.push({ id, expirationDate: exp });
      continue;
    }
    ok.push({ id, entry });
  }

  const problemCount = missing.length + expired.length;
  const total = configured.length;

  console.log(
    chalk.bold(
      `check-models: ${total} configured model(s); ${ok.length} ok; ${problemCount} problem(s).`
    )
  );
  console.log();

  if (missing.length > 0) {
    console.log(chalk.red.bold("Not in OpenRouter catalog"));
    for (const m of missing) {
      console.log(chalk.red(`  • ${m.id}`));
      console.log(chalk.gray(`    ${m.reason}`));
    }
    console.log();
  }

  if (expired.length > 0) {
    console.log(chalk.red.bold("Past expiration_date (removed or scheduled removal)"));
    for (const e of expired) {
      console.log(chalk.red(`  • ${e.id}`));
      console.log(chalk.gray(`    expiration_date: ${e.expirationDate}`));
    }
    console.log();
  }

  if (ok.length > 0) {
    console.log(chalk.green.bold("Valid (catalog) — pricing USD per 1M tokens"));
    const idW = Math.max(8, ...ok.map((o) => o.id.length));
    for (const { id, entry } of ok) {
      const name =
        typeof entry.name === "string" && entry.name.trim().length > 0
          ? chalk.gray(` (${entry.name})`)
          : "";
      const input = formatUsdPerMillionTokens(entry.pricing?.prompt);
      const output = formatUsdPerMillionTokens(entry.pricing?.completion);
      console.log(
        `  ${id.padEnd(idW)}   input: ${input.padStart(8)}   output: ${output.padStart(8)}  ${name}`
      );
    }
    console.log();
  }

  console.log(
    chalk.gray("Source: OpenRouter models directory @ ") +
      chalk.cyan("https://openrouter.ai/models\n")
  );

  const exitCode = problemCount > 0 ? 1 : 0;
  return { exitCode };
}
