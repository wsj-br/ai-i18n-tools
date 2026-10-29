import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import { t } from "../i18n/index.js";
import { resolveAllConfiguredModelIds, resolveTranslationModels } from "../core/config.js";
import {
  OPENROUTER_PROVIDER_KEY,
  providerModelsCatalogQuery,
  resolveActiveProvider,
  resolveModelsListRequestAuth,
  resolveProviderSettings,
} from "../core/llm-providers.js";
import {
  catalogUsdPerMillionDisplay,
  fetchProviderModelsCatalog,
  isExpirationDatePast,
  modelDisplayName,
  providerModelsCatalogUrl,
  type ProviderModelEntry,
} from "../api/provider-models-catalog.js";

export interface RunCheckModelsResult {
  exitCode: number;
}

export interface ModelCatalogStatus {
  activeProvider: string;
  configured: string[];
  ok: { id: string; entry: ProviderModelEntry }[];
  missing: { id: string }[];
  expired: { id: string; expirationDate: string }[];
  /** Set when the catalog request did not run or failed. */
  error?: string;
  catalogUrl?: string;
  zeroDataRetention?: boolean;
}

/**
 * Fetch the active provider catalog and classify configured model ids.
 * Does not print. `check-models` and `doctor` share this.
 */
export async function loadConfiguredModelCatalogStatus(
  config: I18nConfig,
  opts?: { xTitle?: string; fetchImpl?: typeof fetch }
): Promise<ModelCatalogStatus> {
  let activeProvider: string;
  try {
    activeProvider = resolveActiveProvider(config);
  } catch (e) {
    return {
      activeProvider: "",
      configured: [],
      ok: [],
      missing: [],
      expired: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const configured = resolveAllConfiguredModelIds(config);
  const empty = {
    activeProvider,
    configured,
    ok: [] as { id: string; entry: ProviderModelEntry }[],
    missing: [] as { id: string }[],
    expired: [] as { id: string; expirationDate: string }[],
  };

  if (resolveTranslationModels(config).length === 0) {
    return {
      ...empty,
      error: t("No models configured (set {{configKey}}).", {
        configKey: `providers.${activeProvider}.translationModels`,
      }),
    };
  }

  let settings;
  try {
    settings = resolveProviderSettings(activeProvider, config);
  } catch (e) {
    return { ...empty, error: e instanceof Error ? e.message : String(e) };
  }

  const apiKey = settings.apiKeyEnv ? (process.env[settings.apiKeyEnv]?.trim() ?? "") : "";
  if (!apiKey && settings.requiresApiKey) {
    return {
      ...empty,
      error: t("{{keyName}} is required", { keyName: settings.apiKeyEnv ?? "API key" }),
    };
  }

  const auth = resolveModelsListRequestAuth(activeProvider, apiKey, {
    xTitle: opts?.xTitle ?? "ai-i18n-tools check-models",
  });
  const catalogQuery = providerModelsCatalogQuery(settings);
  const catalogUrl = providerModelsCatalogUrl(settings.baseUrl, catalogQuery);

  let catalog: Map<string, ProviderModelEntry>;
  try {
    catalog = await fetchProviderModelsCatalog({
      baseUrl: settings.baseUrl,
      apiKey: auth.apiKey,
      providerLabel: activeProvider,
      requestTimeoutMs: settings.requestTimeoutMs,
      extraHeaders: auth.extraHeaders,
      query: catalogQuery,
      ...(opts?.fetchImpl ? { fetchImpl: opts.fetchImpl } : {}),
    });
  } catch (e) {
    return {
      ...empty,
      catalogUrl,
      zeroDataRetention: settings.zeroDataRetention,
      error: e instanceof Error ? e.message : String(e),
    };
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

  return {
    activeProvider,
    configured,
    ok,
    missing,
    expired,
    catalogUrl,
    zeroDataRetention: settings.zeroDataRetention,
  };
}

export async function runCheckModels(config: I18nConfig): Promise<RunCheckModelsResult> {
  const status = await loadConfiguredModelCatalogStatus(config);
  if (status.error) {
    console.error(chalk.red(status.error));
    return { exitCode: 1 };
  }

  const { activeProvider, missing, expired, ok, configured } = status;
  const settings = resolveProviderSettings(activeProvider, config);
  const isOpenRouter = activeProvider === OPENROUTER_PROVIDER_KEY;
  const catalogUrl = status.catalogUrl ?? "";

  const problemCount = missing.length + expired.length;
  const total = configured.length;

  console.log(
    chalk.bold(
      t(
        'check-models: provider "{{provider}}" — {{total}} configured model(s); {{ok}} ok; {{problems}} problem(s).',
        { provider: activeProvider, total, ok: ok.length, problems: problemCount }
      )
    )
  );
  console.log();

  if (missing.length > 0) {
    console.log(
      chalk.red.bold(
        settings.zeroDataRetention
          ? t("Not in the Cheaper Inference zero-data-retention catalog")
          : t("Not in {{provider}} models list", { provider: activeProvider })
      )
    );
    for (const m of missing) {
      console.log(chalk.red(`  • ${m.id}`));
    }
    const listModelsCommand = `ai-i18n-tools list-models -P ${activeProvider}`;
    console.log(
      chalk.yellow(
        t("\n  Run {{command}} to see the available models.", {
          command: chalk.cyan(listModelsCommand),
        })
      )
    );
    console.log();
  }

  if (expired.length > 0) {
    console.log(chalk.red.bold(t("Past expiration date (removed or scheduled removal)")));
    for (const e of expired) {
      console.log(chalk.red(`  • ${e.id}`));
      console.log(chalk.gray(`    expiration_date: ${e.expirationDate}`));
    }
    console.log();
  }

  if (ok.length > 0) {
    const showPricing = ok.some(({ entry }) => catalogUsdPerMillionDisplay(entry) !== undefined);
    console.log(
      chalk.green.bold(
        showPricing
          ? t("Valid (in models list) — pricing USD per 1M tokens")
          : t("Valid (in models list)")
      )
    );
    const idW = Math.max(8, ...ok.map((o) => o.id.length));
    for (const { id, entry } of ok) {
      const label = modelDisplayName(entry);
      const name = label.length > 0 ? chalk.gray(` (${label})`) : "";
      if (showPricing) {
        const rates = catalogUsdPerMillionDisplay(entry);
        const input = rates?.input ?? "—";
        const output = rates?.output ?? "—";
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
      chalk.gray(t("Source: OpenRouter models directory @ ")) +
        chalk.cyan("https://openrouter.ai/models\n")
    );
  } else {
    console.log(chalk.gray(t("Source: {{catalogUrl}}\n", { catalogUrl })));
  }

  const exitCode = problemCount > 0 ? 1 : 0;
  return { exitCode };
}
