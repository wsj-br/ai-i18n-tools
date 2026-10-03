#!/usr/bin/env node
/**
 * Copies the plain-HTML catalog runtime from src/html-runtime into dist/html-runtime
 * so package exports `ai-i18n-tools/html-runtime/i18n.js` resolve after build.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "src", "html-runtime");
const dest = path.join(root, "dist", "html-runtime");

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
