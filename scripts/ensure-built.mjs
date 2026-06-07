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

console.log("dist/ missing — building ai-i18n-tools…");
const result = spawnSync("pnpm", ["run", "build"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
