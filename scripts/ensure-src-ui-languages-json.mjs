#!/usr/bin/env node
/**
 * Ensures `src/runtime/ui-languages-complete.json` is real JSON for `tsc`.
 *
 * In git this path is a symlink to `data/ui-languages-complete.json`. On Windows
 * with `core.symlinks=false` (or without symlink privilege) the checkout is a
 * plain text file containing the path, which breaks `import … with { type: "json" }`.
 * Materialize a copy when the file is missing or not a JSON array.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "data", "ui-languages-complete.json");
const dest = path.join(root, "src", "runtime", "ui-languages-complete.json");

function isJsonArrayFile(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(parsed);
  } catch {
    return false;
  }
}

if (isJsonArrayFile(dest)) {
  process.exit(0);
}

if (!fs.existsSync(src)) {
  console.error(`ensure-src-ui-languages-json: missing ${src}`);
  process.exit(1);
}

try {
  fs.unlinkSync(dest);
} catch (err) {
  if (err && typeof err === "object" && "code" in err && err.code !== "ENOENT") {
    console.error(`ensure-src-ui-languages-json: cannot replace ${dest}: ${err.message}`);
    process.exit(1);
  }
}

fs.copyFileSync(src, dest);
console.log("Synced src/runtime/ui-languages-complete.json from data/ (broken or missing symlink)");
