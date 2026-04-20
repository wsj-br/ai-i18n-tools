#!/usr/bin/env node
/**
 * Ships `data/ui-languages-complete.json` next to compiled runtime JS so imports resolve
 * at runtime (Node) and so bundlers (Next.js/Vite) can resolve the asset for browser builds.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "data", "ui-languages-complete.json");
const dest = path.join(root, "dist", "runtime", "ui-languages-complete.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
