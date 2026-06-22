#!/usr/bin/env node
/**
 * Copies the tool's own UI translation bundles + manifest from src/i18n/locales into
 * dist/i18n/locales so the compiled self-i18n runtime (dist/i18n/index.js) finds
 * `./locales/<code>.json` and `./locales/ui-languages.json` next to it.
 *
 * The bundles are produced by `pnpm run i18n:self` (extract + translate-ui against
 * ai-i18n-self.config.json) and committed; this script only copies them at build time.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "src", "i18n", "locales");
const dest = path.join(root, "dist", "i18n", "locales");

fs.mkdirSync(dest, { recursive: true });
fs.rmSync(dest, { recursive: true, force: true });

if (fs.existsSync(src)) {
  fs.cpSync(src, dest, { recursive: true });
} else {
  // No bundles generated yet: ship an empty locales dir so the runtime falls back to source text.
  fs.mkdirSync(dest, { recursive: true });
}
