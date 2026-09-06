#!/usr/bin/env node
/**
 * Opt-in live OpenRouter smokes. Forwards args to Vitest after stripping
 * `--verbose` / `-v` (Vitest rejects those as unknown options) and sets
 * `AI_I18N_LIVE_VERBOSE=1` so tests/live dumps prompts and check details.
 *
 * Usage:
 *   pnpm test:live
 *   pnpm test:live -- --verbose
 *   pnpm test:live -- -v tests/live/plural-placeholder-models.test.ts
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawArgs = process.argv.slice(2);
const verbose = rawArgs.some((a) => a === "--verbose" || a === "-v");
const forwarded = rawArgs.filter(
  (a) => a !== "--verbose" && a !== "-v" && a !== "--"
);

const env = { ...process.env };
if (verbose) {
  env.AI_I18N_LIVE_VERBOSE = "1";
}

const vitestArgs = [
  "exec",
  "vitest",
  "run",
  "--config",
  "vitest.live.config.ts",
  "--coverage.enabled=false",
  ...forwarded,
];

const result = spawnSync("pnpm", vitestArgs, {
  cwd: repoRoot,
  env,
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
