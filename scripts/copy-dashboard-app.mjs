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

const publicAssets = [
  ["docs/public/favicon.ico", "favicon.ico"],
  ["docs/public/ai-i18n-tools_logo.svg", "ai-i18n-tools_logo.svg"],
];
for (const [relSrc, destName] of publicAssets) {
  const assetSrc = path.join(root, relSrc);
  const assetDest = path.join(dest, destName);
  if (fs.existsSync(assetSrc)) {
    fs.copyFileSync(assetSrc, assetDest);
  } else {
    console.warn(`[copy-dashboard-app] asset missing: ${assetSrc}`);
  }
}

// Remove legacy output from the pre-rename folder name.
const legacyDest = path.join(root, "dist", "edit-cache-app");
fs.rmSync(legacyDest, { recursive: true, force: true });
