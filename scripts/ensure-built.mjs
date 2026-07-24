#!/usr/bin/env node
/**
 * Runs `pnpm run build` when dist/cli/index.js is missing.
 * Used by the root package `prepare` script so a fresh `pnpm install`
 * produces compiled output for workspace bin links and library imports.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliEntry = path.join(root, "dist", "cli", "index.js");

if (fs.existsSync(cliEntry)) {
  process.exit(0);
}

// Nested prepare (pnpm may re-run install from `pnpm run build` deps checks).
// The outer ensure-built is already building — skip so we do not recurse.
if (process.env.AI_I18N_ENSURING_BUILT === "1") {
  process.exit(0);
}

console.log("dist/ missing — building ai-i18n-tools…");

const env = { ...process.env, AI_I18N_ENSURING_BUILT: "1" };

// Prefer `node <npm_execpath> run build` (set during pnpm/npm lifecycle scripts).
// Fall back to a shell invocation: bare spawnSync("pnpm") is ENOENT on Windows
// because Node does not resolve `pnpm.cmd` without `shell: true`.
const execPath = process.env.npm_execpath;
const result = execPath
  ? spawnSync(process.execPath, [execPath, "run", "build"], {
      cwd: root,
      stdio: "inherit",
      env,
    })
  : spawnSync("pnpm run build", {
      cwd: root,
      stdio: "inherit",
      env,
      shell: true,
    });

if (result.error) {
  console.error(`ensure-built: failed to start build: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
