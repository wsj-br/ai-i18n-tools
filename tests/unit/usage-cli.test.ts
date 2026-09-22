import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import chalk from "chalk";
import { TranslationCache } from "../../src/core/cache.js";
import { runUsage } from "../../src/cli/usage.js";
import type { I18nConfig } from "../../src/core/types.js";
import { stripAnsi } from "../../src/utils/logger.js";

function configFor(cacheDir: string): I18nConfig {
  return {
    sourceLocale: "en",
    targetLocales: ["de"],
    cacheDir,
    provider: "openai",
    providers: {
      openai: {
        translationModels: ["gpt-4o-mini"],
        pricing: { inputPerMTokens: 0.15, outputPerMTokens: 0.6 },
        modelPricing: {
          "gpt-4o": { inputPerMTokens: 2.5, outputPerMTokens: 10 },
        },
      },
    },
  } as unknown as I18nConfig;
}

describe("runUsage", () => {
  const logs: string[] = [];

  afterEach(() => {
    logs.length = 0;
    vi.restoreAllMocks();
  });

  it("prints an empty-cache summary without fabricating $0.00 cost", () => {
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "usage-cli-empty-"));
    try {
      new TranslationCache(dir).close();
      runUsage(configFor("."), dir, {});
      const text = logs.join("\n");
      expect(text).toContain("Total calls");
      expect(text).toMatch(/Total calls.*\b0\b/s);
      expect(text).toMatch(/Cost:.*—/);
      expect(text).not.toMatch(/\$0\.0+/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("prints mixed actual/estimated cost and supports --clear", () => {
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "usage-cli-"));
    try {
      const cache = new TranslationCache(dir);
      cache.recordApiCall({
        provider: "openrouter",
        model: "or-model",
        operation: "translate-docs",
        locale: "de",
        outcome: "accepted",
        inputTokens: 10,
        outputTokens: 10,
        totalTokens: 20,
        costUsd: 0.0025,
      });
      cache.recordApiCall({
        provider: "openai",
        model: "gpt-4o-mini",
        operation: "translate-ui",
        locale: "fr",
        outcome: "discarded",
        inputTokens: 1_000_000,
        outputTokens: 0,
        totalTokens: 1_000_000,
      });
      cache.recordApiCall({
        provider: "openai",
        model: "gpt-4o",
        operation: "translate-ui",
        locale: "es",
        outcome: "accepted",
        inputTokens: 1_000_000,
        outputTokens: 0,
        totalTokens: 1_000_000,
      });
      cache.close();

      runUsage(configFor("."), dir, {});
      const text = logs.join("\n");
      expect(text).toContain("Total calls");
      expect(text).toContain("0.002500");
      expect(text).toContain("0.150000");
      expect(text).toContain("2.500000");
      expect(text).toContain("2.652500");
      expect(text).toContain("translate-docs");
      expect(text).not.toContain("Estimated cost");
      expect(text).not.toContain("Est. cost");

      logs.length = 0;
      runUsage(configFor("."), dir, { clear: true, dryRun: true });
      expect(logs.join("\n")).toMatch(/3/);

      const still = new TranslationCache(dir);
      expect(still.getApiCallStats().summary.calls).toBe(3);
      still.close();

      logs.length = 0;
      runUsage(configFor("."), dir, { clear: true });
      const gone = new TranslationCache(dir);
      expect(gone.getApiCallStats().summary.calls).toBe(0);
      gone.close();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("aligns usage table columns when headers are ANSI-colored", () => {
    const prevLevel = chalk.level;
    chalk.level = 1;
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "usage-cli-align-"));
    try {
      const cache = new TranslationCache(dir);
      cache.recordApiCall({
        provider: "openrouter",
        model: "minimax/minimax-m2.7",
        operation: "translate-ui",
        outcome: "accepted",
        inputTokens: 1,
        outputTokens: 1,
        totalTokens: 2,
        costUsd: 0.001745,
      });
      cache.close();
      runUsage(configFor("."), dir, {});
      const modelTable = stripAnsi(logs.join("\n")).split("By model")[1]?.split("By operation")[0];
      expect(modelTable).toBeTruthy();
      const lines = modelTable!
        .split("\n")
        .map((l) => l.trimEnd())
        .filter((l) => l.includes("|"));
      expect(lines.length).toBeGreaterThanOrEqual(3);
      const pipeAt = (line: string): number[] =>
        [...line.matchAll(/\|/g)].map((m) => m.index ?? -1);
      const headerPipes = pipeAt(lines[0]!);
      for (const line of lines.slice(1)) {
        expect(pipeAt(line)).toEqual(headerPipes);
      }
    } finally {
      chalk.level = prevLevel;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
