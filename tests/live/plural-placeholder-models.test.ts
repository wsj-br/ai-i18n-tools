/**
 * Live OpenRouter smoke for plural placeholder prompts.
 * Excluded from default `pnpm test` (see vitest.config.ts). Run with:
 *   pnpm exec vitest run tests/live/plural-placeholder-models.test.ts
 *   # or: pnpm test:live
 *
 * Prompt / return / check-detail dumps are off by default; enable with
 * `pnpm test:live -- --verbose`.
 */
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { LlmClient } from "../../src/api/llm-client.js";
import { buildPluralPassBPrompt, buildPluralStep0Prompt } from "../../src/core/prompt-builder.js";
import { pluralFormPlaceholderIssues } from "../../src/core/plural-placeholders.js";
import { requiredCldrPluralForms } from "../../src/core/plural-forms.js";
import type { I18nConfig } from "../../src/core/types.js";
import { loadDotenv } from "../../src/utils/load-dotenv.js";
import { logLiveBanner, logLiveSection } from "./_live-detail.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadDotenv(repoRoot);

const MODELS = [
  "mistralai/codestral-2508",
  "openai/gpt-4o-mini",
  "google/gemma-4-26b-a4b-it",
] as const;

const hasKey = Boolean(process.env.OPENROUTER_API_KEY?.trim());

function llmConfig(
  model: string
): Pick<I18nConfig, "provider" | "providers" | "sourceLocale" | "localeDisplayNames"> {
  return {
    sourceLocale: "en-GB",
    localeDisplayNames: {
      "en-GB": "English (United Kingdom)",
      de: "German",
    },
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: [model],
        maxTokens: 1024,
        temperature: 0,
        requestTimeoutMs: 60_000,
      },
    },
  };
}

function logPluralCase(opts: {
  label: string;
  model: string;
  source: string;
  msgs: { systemPrompt: string; userContent: string };
  forms: Record<string, string>;
  rawAssistantContent?: string;
  issues: ReturnType<typeof pluralFormPlaceholderIssues>;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost?: number;
  usedModel?: string;
}): void {
  const { label, model, source, msgs, forms, rawAssistantContent, issues, usage, cost, usedModel } =
    opts;
  logLiveBanner(`${label} · ${model}`);
  logLiveSection("source literal", source);
  logLiveSection("system prompt sent", msgs.systemPrompt);
  logLiveSection("user content sent", msgs.userContent);
  logLiveSection("model return (raw assistant)", rawAssistantContent ?? "(unavailable)");
  logLiveSection("model return (parsed forms)", forms);
  logLiveSection("usage / cost", { requestedModel: model, usedModel, usage, cost });
  logLiveSection("placeholder check results", {
    issueCount: issues.length,
    issues:
      issues.length === 0
        ? "pass (no placeholder / qty issues)"
        : issues.map((i) => ({ form: i.form, kind: i.kind, detail: i.detail })),
    everyFormHasCountPlaceholder: Object.fromEntries(
      Object.entries(forms).map(([k, v]) => [k, v.includes("{{count}}")])
    ),
  });
}

describe.skipIf(!hasKey)("live plural placeholder models", () => {
  for (const model of MODELS) {
    describe(model, () => {
      it("Step 0 Minutes stays noun-only", async () => {
        const source = "Minutes";
        const forms = requiredCldrPluralForms("en-GB");
        const msgs = buildPluralStep0Prompt({
          sourceLanguageLabel: "en-GB: English (United Kingdom)",
          originalLiteral: source,
          requiredForms: forms,
          zeroDigit: false,
          intlPluralLocaleTag: "en-GB",
        });
        const client = new LlmClient({ config: llmConfig(model) });
        const batch = await client.translatePluralCardinalBatch(forms, msgs, {
          originalLiteral: source,
        });
        const issues = pluralFormPlaceholderIssues(source, batch.forms);
        logPluralCase({
          label: "Step 0 Minutes (noun-only)",
          model,
          source,
          msgs,
          forms: batch.forms,
          rawAssistantContent: batch.rawAssistantContent,
          issues,
          usage: batch.usage,
          cost: batch.cost,
          usedModel: batch.model,
        });
        expect(issues).toEqual([]);
      }, 60_000);

      it("Step 0 Merge Selected Servers keeps {{count}} in every form", async () => {
        const source = "Merge Selected Servers ({{count}})";
        const forms = requiredCldrPluralForms("en-GB");
        const msgs = buildPluralStep0Prompt({
          sourceLanguageLabel: "en-GB: English (United Kingdom)",
          originalLiteral: source,
          requiredForms: forms,
          zeroDigit: false,
          intlPluralLocaleTag: "en-GB",
        });
        const client = new LlmClient({ config: llmConfig(model) });
        const batch = await client.translatePluralCardinalBatch(forms, msgs, {
          originalLiteral: source,
        });
        const issues = pluralFormPlaceholderIssues(source, batch.forms);
        logPluralCase({
          label: "Step 0 Merge Selected Servers (keep {{count}})",
          model,
          source,
          msgs,
          forms: batch.forms,
          rawAssistantContent: batch.rawAssistantContent,
          issues,
          usage: batch.usage,
          cost: batch.cost,
          usedModel: batch.model,
        });
        expect(issues).toEqual([]);
        for (const v of Object.values(batch.forms)) {
          expect(v).toContain("{{count}}");
        }
      }, 60_000);

      it("Pass B de Minutes stays noun-only", async () => {
        const source = "Minutes";
        const forms = requiredCldrPluralForms("de");
        const msgs = buildPluralPassBPrompt({
          sourceLanguageLabel: "en-GB: English (United Kingdom)",
          targetLanguageLabel: "de: German",
          sourceForms: { one: "Minute", other: "Minutes" },
          requiredTargetForms: forms,
          originalLiteral: source,
          intlPluralLocaleTag: "de",
          targetLocale: "de",
        });
        const client = new LlmClient({ config: llmConfig(model) });
        const batch = await client.translatePluralCardinalBatch(forms, msgs, {
          targetLocale: "de",
          originalLiteral: source,
        });
        const issues = pluralFormPlaceholderIssues(source, batch.forms);
        logPluralCase({
          label: "Pass B de Minutes (noun-only)",
          model,
          source,
          msgs,
          forms: batch.forms,
          rawAssistantContent: batch.rawAssistantContent,
          issues,
          usage: batch.usage,
          cost: batch.cost,
          usedModel: batch.model,
        });
        expect(issues).toEqual([]);
      }, 60_000);
    });
  }
});
