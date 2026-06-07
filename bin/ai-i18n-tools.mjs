#!/usr/bin/env node
/**
 * Stable package.json "bin" entry. pnpm links this file during install before
 * dist/ exists; the compiled CLI is emitted to dist/cli/index.js by `pnpm build`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliEntry = path.join(root, "dist", "cli", "index.js");

if (!fs.existsSync(cliEntry)) {
  console.error(
    "ai-i18n-tools is not built yet. From the repository root, run:\n  pnpm run build",
  );
  process.exit(1);
}

await import(cliEntry);
