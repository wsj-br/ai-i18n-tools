import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { resolveTranslationModels } from "../core/config.js";
import {
  OPENROUTER_PROVIDER_KEY,
  resolveActiveProvider,
  resolveModelsListRequestAuth,
  resolveProviderSettings,
} from "../core/llm-providers.js";
import {
  fetchProviderModelsCatalog,
  formatUsdPerMillionTokens,
  isExpirationDatePast,
  modelDisplayName,
  type ProviderModelEntry,
} from "../api/provider-models-catalog.js";

export interface RunCheckModelsResult {
  exitCode: number;
}

/** True when any valid entry carries OpenAI-compatible pricing fields (`pricing.prompt`/`completion`). */
function hasPricing(entry: ProviderModelEntry): boolean {
  return (
    (typeof entry.pricing?.prompt === "string" && entry.pricing.prompt !== "") ||
    (typeof entry.pricing?.completion === "string" && entry.pricing.completion !== "")
  );
}

export async function runCheckModels(config: I18nConfig): Promise<RunCheckModelsResult> {
  let activeProvider: string;
  try {
    activeProvider = resolveActiveProvider(config);
  } catch (e) {
    console.error(chalk.red(e instanceof Error ? e.message : String(e)));
    return { exitCode: 1 };
  }

  const configured = resolveTranslationModels(config);
  if (configured.length === 0) {
    console.error(
      chalk.red(`No models configured (set providers.${activeProvider}.translationModels).`)
    );
    return { exitCode: 1 };
  }

  const settings = resolveProviderSettings(activeProvider, config);
  const apiKey = settings.apiKeyEnv ? (process.env[settings.apiKeyEnv]?.trim() ?? "") : "";
  if (!apiKey && settings.requiresApiKey) {
    console.error(chalk.red(`${settings.apiKeyEnv ?? "API key"} is required`));
    return { exitCode: 1 };
  }

  const isOpenRouter = activeProvider === OPENROUTER_PROVIDER_KEY;
  const auth = resolveModelsListRequestAuth(activeProvider, apiKey, {
    xTitle: "ai-i18n-tools check-models",
  });

  let catalog: Map<string, ProviderModelEntry>;
  try {
    catalog = await fetchProviderModelsCatalog({
      baseUrl: settings.baseUrl,
      apiKey: auth.apiKey,
      providerLabel: activeProvider,
      requestTimeoutMs: settings.requestTimeoutMs,
      extraHeaders: auth.extraHeaders,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(chalk.red(msg));
    return { exitCode: 1 };
  }

  const missing: { id: string }[] = [];
  const expired: { id: string; expirationDate: string }[] = [];
  const ok: { id: string; entry: ProviderModelEntry }[] = [];

  for (const id of configured) {
    const entry = catalog.get(id);
    if (!entry) {
      missing.push({ id });
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
      `check-models: provider "${activeProvider}" — ${total} configured model(s); ${ok.length} ok; ${problemCount} problem(s).`
    )
  );
  console.log();

  if (missing.length > 0) {
    console.log(chalk.red.bold(`Not in ${activeProvider} models list`));
    for (const m of missing) {
      console.log(chalk.red(`  • ${m.id}`));
    }
    const listModelsCommand = `ai-i18n-tools list-models -P ${activeProvider}`;
    console.log(
      chalk.yellow(
        `\n  Run ${chalk.cyan(listModelsCommand)} to see the available models.`
      )
    );
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
    const showPricing = ok.some(({ entry }) => hasPricing(entry));
    console.log(
      chalk.green.bold(
        showPricing ? "Valid (in models list) — pricing USD per 1M tokens" : "Valid (in models list)"
      )
    );
    const idW = Math.max(8, ...ok.map((o) => o.id.length));
    for (const { id, entry } of ok) {
      const label = modelDisplayName(entry);
      const name = label.length > 0 ? chalk.gray(` (${label})`) : "";
      if (showPricing) {
        const input = formatUsdPerMillionTokens(entry.pricing?.prompt);
        const output = formatUsdPerMillionTokens(entry.pricing?.completion);
        console.log(
          `  ${id.padEnd(idW)}   input: ${input.padStart(8)}   output: ${output.padStart(8)}  ${name}`
        );
      } else {
        console.log(`  ${id.padEnd(idW)}${name}`);
      }
    }
    console.log();
  }

  if (isOpenRouter) {
    console.log(
      chalk.gray("Source: OpenRouter models directory @ ") +
        chalk.cyan("https://openrouter.ai/models\n")
    );
  } else {
    console.log(chalk.gray(`Source: ${settings.baseUrl}/models\n`));
  }

  const exitCode = problemCount > 0 ? 1 : 0;
  return { exitCode };
}
