#!/usr/bin/env node
/**
 * Copies static translation-editor UI from src/edit-cache-app into dist/edit-cache-app
 * so resolveEditCacheStaticDir() finds assets next to compiled server code.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "src", "edit-cache-app");
const dest = path.join(root, "dist", "edit-cache-app");

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
