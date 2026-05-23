#!/usr/bin/env node
/**
 * Copies static Translation Dashboard UI from src/dashboard-app into dist/dashboard-app
 * so resolveDashboardAppStaticDir() finds assets next to compiled server code.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "src", "dashboard-app");
const dest = path.join(root, "dist", "dashboard-app");

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

// Remove legacy output from the pre-rename folder name.
const legacyDest = path.join(root, "dist", "edit-cache-app");
fs.rmSync(legacyDest, { recursive: true, force: true });
