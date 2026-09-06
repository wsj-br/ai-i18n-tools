/**
 * Opt-in live smoke against OpenRouter for docs placeholder integrity.
 * Excluded from default `pnpm test` / CI. Run with `pnpm test:live`.
 *
 * Prompt / return / check-detail dumps are off by default; enable with
 * `pnpm test:live -- --verbose`.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { LlmClient } from "../../src/api/llm-client.js";
import { protectSegmentForTranslation } from "../../src/cli/doc-translate.js";
import { Glossary } from "../../src/glossary/glossary.js";
import {
  collectPostRestorePlaceholderErrors,
  collectPreRestorePlaceholderErrors,
  compareHtmlTagKindSequences,
  compareIdentTokenSequences,
  extractIdentTokens,
} from "../../src/processors/placeholder-integrity.js";
import { PlaceholderHandler } from "../../src/processors/placeholder-handler.js";
import { restoreGlossaryForcedTerms } from "../../src/processors/glossary-force-placeholders.js";
import type { I18nConfig } from "../../src/core/types.js";
import { loadDotenv } from "../../src/utils/load-dotenv.js";
import { logLiveBanner, logLiveSection } from "./_live-detail.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadDotenv(REPO_ROOT);

const HAS_KEY = Boolean(process.env.OPENROUTER_API_KEY?.trim());

const SOURCE_1_1 =
  '<li><a href="display-settings.md">Display Settings</a>: Configure theme, chart time range, chart style, format locale, auto-refresh interval, card sort order, and week start</li>';

const SOURCE_1_2 =
  "- Optional [API keys](settings/api-keys-settings.md) for Duplicati uploads and Homepage widgets, with upload size and rate limits";

const MODELS = [
  "mistralai/codestral-2508",
  "openai/gpt-4o-mini",
  "google/gemma-4-26b-a4b-it",
] as const;

function llmConfig(
  model: string
): Pick<I18nConfig, "provider" | "providers" | "sourceLocale" | "localeDisplayNames"> {
  return {
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: [model],
        maxTokens: 2048,
        temperature: 0.2,
        requestTimeoutMs: 90_000,
      },
    },
    sourceLocale: "en-GB",
    localeDisplayNames: {},
  };
}

function restore(
  raw: string,
  state: ReturnType<typeof protectSegmentForTranslation>["state"]
): string {
  const ph = new PlaceholderHandler();
  let out = ph.restoreAfterTranslation(raw, state);
  out = restoreGlossaryForcedTerms(out, state.glossaryForceReplacements ?? []);
  return out;
}

function logAndAssertIntegrity(opts: {
  label: string;
  model: string;
  source: string;
  protectedText: string;
  protectState: ReturnType<typeof protectSegmentForTranslation>["state"];
  glossaryHints: string[];
  systemPrompt?: string;
  userContent?: string;
  raw: string;
  rawAssistantContent?: string;
  restored: string;
  locale: string;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost?: number;
}): void {
  const {
    label,
    model,
    source,
    protectedText,
    protectState,
    glossaryHints,
    systemPrompt,
    userContent,
    raw,
    rawAssistantContent,
    restored,
    locale,
    usage,
    cost,
  } = opts;

  const preErrors = collectPreRestorePlaceholderErrors(protectState, raw);
  const postErrors = collectPostRestorePlaceholderErrors(source, restored);
  const identSeq = compareIdentTokenSequences(protectedText, raw);
  const tagKind = compareHtmlTagKindSequences(source, restored);
  const integrityFailed = preErrors.length > 0 || postErrors.length > 0;
  const hasTam = /\{\{\s*TAM\s*\}\}/i.test(raw) || /\{\{\s*TAM\s*\}\}/i.test(restored);
  const looksLike11Swap =
    /Anzeigeeinstellungen<\/li>:/i.test(restored) ||
    (tagKind !== null && /<\/a>/i.test(source) && !/<\/a>/i.test(restored));
  const expectedIdents = extractIdentTokens(protectedText);
  const actualIdents = extractIdentTokens(raw);

  logLiveBanner(`${label} · ${model} · locale=${locale}`);
  logLiveSection("source", source);
  logLiveSection("protected text (user segment)", protectedText);
  logLiveSection("glossary hints", glossaryHints);
  if (systemPrompt !== undefined) {
    logLiveSection("system prompt sent", systemPrompt);
  }
  if (userContent !== undefined) {
    logLiveSection("user content sent", userContent);
  }
  if (rawAssistantContent !== undefined && rawAssistantContent !== raw) {
    logLiveSection("model return (raw assistant, before strip)", rawAssistantContent);
  }
  logLiveSection("model return (raw / stripped)", raw);
  logLiveSection("restored text", restored);
  logLiveSection("usage / cost", { model, usage, cost });
  logLiveSection("check results", {
    preRestoreErrors: preErrors,
    postRestoreErrors: postErrors,
    identTokenSequence: identSeq === null ? "pass" : identSeq,
    htmlTagKindSequence: tagKind === null ? "pass" : tagKind,
    expectedIdentTokens: expectedIdents,
    actualIdentTokens: actualIdents,
    hasInventedTam: hasTam,
    looksLike11TagSwap: looksLike11Swap,
    integrityFailed,
    emptyModelOutput: raw.trim().length === 0,
  });

  expect(raw.trim().length, `${locale}: empty model output`).toBeGreaterThan(0);

  if (looksLike11Swap || tagKind !== null) {
    expect(
      integrityFailed,
      `${locale}: tag-swap / tag-kind mismatch must fail integrity (pre=${preErrors.join("; ")} post=${postErrors.join("; ")})`
    ).toBe(true);
  }
  if (hasTam) {
    expect(integrityFailed, `${locale}: invented {{TAM}} must fail integrity`).toBe(true);
  }

  if (!integrityFailed) {
    expect(compareHtmlTagKindSequences(source, restored)).toBeNull();
    expect(collectPostRestorePlaceholderErrors(source, restored)).toEqual([]);
    expect(compareIdentTokenSequences(protectedText, raw)).toBeNull();
  }

  if (locale === "ar" && !integrityFailed) {
    expect(actualIdents.map((t) => t.replace(/\s/g, ""))).toEqual(
      expectedIdents.map((t) => t.replace(/\s/g, ""))
    );
  }
}

describe.skipIf(!HAS_KEY)("live docs placeholder restore smoke", () => {
  it.each(MODELS)(
    "1.1 de HTML tags — %s",
    async (model) => {
      const glossary = new Glossary(undefined, undefined);
      const { text, state } = protectSegmentForTranslation(SOURCE_1_1, glossary, "de", true, false);
      const client = new LlmClient({
        config: llmConfig(model),
        translationModels: [model],
      });
      const hints = glossary.findTermsInText(text, "de");
      const res = await client.translateDocumentSegment(text, "de", hints, {
        contentType: "markdown",
      });
      const restored = restore(res.content, state);
      logAndAssertIntegrity({
        label: "1.1 de HTML tags",
        model,
        source: SOURCE_1_1,
        protectedText: text,
        protectState: state,
        glossaryHints: hints,
        systemPrompt: res.debugPrompt?.systemPrompt,
        userContent: res.debugPrompt?.userContent,
        raw: res.content,
        rawAssistantContent: res.rawAssistantContent,
        restored,
        locale: "de",
        usage: res.usage,
        cost: res.cost,
      });
    },
    90_000
  );

  it.each(MODELS)(
    "1.2 es invented braces with Size→Tam hint — %s",
    async (model) => {
      const dir = path.join(REPO_ROOT, "tests/live");
      const csvPath = path.join(dir, "_tmp-glossary-size-tam.csv");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        csvPath,
        ["Original language string,locale,Translation,Force", "Size,es,Tam,"].join("\n"),
        "utf8"
      );
      try {
        const glossary = new Glossary(undefined, csvPath, ["es"]);
        const { text, state } = protectSegmentForTranslation(
          SOURCE_1_2,
          glossary,
          "es",
          true,
          false
        );
        const client = new LlmClient({
          config: llmConfig(model),
          translationModels: [model],
        });
        const hints = glossary.findTermsInText(SOURCE_1_2, "es");
        expect(hints.some((h) => /Size/i.test(h) && /Tam/i.test(h))).toBe(true);
        const res = await client.translateDocumentSegment(text, "es", hints, {
          contentType: "markdown",
        });
        const restored = restore(res.content, state);
        logAndAssertIntegrity({
          label: "1.2 es invented braces (Size→Tam)",
          model,
          source: SOURCE_1_2,
          protectedText: text,
          protectState: state,
          glossaryHints: hints,
          systemPrompt: res.debugPrompt?.systemPrompt,
          userContent: res.debugPrompt?.userContent,
          raw: res.content,
          rawAssistantContent: res.rawAssistantContent,
          restored,
          locale: "es",
          usage: res.usage,
          cost: res.cost,
        });
      } finally {
        fs.unlinkSync(csvPath);
      }
    },
    90_000
  );

  it("1.1 ar RTL logical order — openai/gpt-4o-mini", async () => {
    const model = "openai/gpt-4o-mini";
    const glossary = new Glossary(undefined, undefined);
    const { text, state } = protectSegmentForTranslation(SOURCE_1_1, glossary, "ar", true, true);
    const client = new LlmClient({
      config: llmConfig(model),
      translationModels: [model],
    });
    const hints = glossary.findTermsInText(text, "ar");
    const res = await client.translateDocumentSegment(text, "ar", hints, {
      contentType: "markdown",
    });
    const restored = restore(res.content, state);
    logAndAssertIntegrity({
      label: "1.1 ar RTL logical order",
      model,
      source: SOURCE_1_1,
      protectedText: text,
      protectState: state,
      glossaryHints: hints,
      systemPrompt: res.debugPrompt?.systemPrompt,
      userContent: res.debugPrompt?.userContent,
      raw: res.content,
      rawAssistantContent: res.rawAssistantContent,
      restored,
      locale: "ar",
      usage: res.usage,
      cost: res.cost,
    });
  }, 90_000);
});
