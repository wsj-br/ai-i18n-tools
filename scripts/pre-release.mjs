#!/usr/bin/env node
/**
 * Full release gate: i18n:self, format, lint, clean, build, test, docs build,
 * and production builds for every workspace example with a site build.
 *
 * Usage:
 *   node scripts/pre-release.mjs
 *   pnpm pre-release
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnPackageManager } from "./lib/spawn-package-manager.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const startedMs = Date.now();

function seconds2mmss(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function elapsed() {
  return seconds2mmss(Math.floor((Date.now() - startedMs) / 1000));
}

function banner(message) {
  console.log("================================================");
  console.log(`${message} (${elapsed()})`);
}

/**
 * Run pnpm with the given args. Uses `$npm_execpath` when set (native binary or
 * JS CLI); falls back to a shell `pnpm` so Windows resolves `pnpm.cmd`.
 */
function runPnpm(args) {
  const result = spawnPackageManager(args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(`pre-release: failed to start pnpm: ${result.error.message}`);
    process.exit(1);
  }

  const status = result.status ?? 1;
  if (status !== 0) {
    process.exit(status);
  }
}

const EXAMPLE_BUILDS = [
  ["examples/astro-docs", "build"],
  ["examples/astro-website", "build"],
  ["examples/console-app", "start"],
  ["examples/fumadocs-docs", "build"],
  ["examples/multi-provider", "build"],
  ["examples/docusaurus-docs", "build"],
  ["examples/nextjs-app", "build"],
  ["examples/nextjs-app/docs-site", "build"],
  ["examples/nextra-docs", "build"],
  ["examples/vitepress-docs", "docs:build"],
];

// Build the package and check if all UI strings are translated
banner("Building the package and checking if all UI strings are translated");
runPnpm(["run", "build"]);
runPnpm(["i18n:self"]);

// Format, lint, clean, build, test
banner("Formatting, linting, cleaning, building, and testing");
runPnpm(["run", "format"]);
runPnpm(["run", "lint"]);
runPnpm(["run", "clean"]);
runPnpm(["run", "build"]);
runPnpm(["test"]);

// Translate docs landing (docs/index.md) and theme JSON
banner("Translating docs landing (docs/index.md)");
runPnpm(["i18n:sync"]);

// Update heading ids and translate the docs
banner("Updating heading ids and translating the docs");
runPnpm(["i18n:update-headings"]);
runPnpm(["i18n:translate:sync"]);

// Build the docs
banner("Building the docs");
runPnpm(["run", "docs:build"]);

// Build the examples to check if they are working
for (const [dir, script] of EXAMPLE_BUILDS) {
  banner(`Building ${dir} (${script})`);
  runPnpm(["--dir", dir, "run", script]);
}

console.log("================================================");
console.log(`Pre-release completed (${elapsed()})`);
console.log("================================================");
