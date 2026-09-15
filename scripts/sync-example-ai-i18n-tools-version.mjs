#!/usr/bin/env node
/**
 * Keep example package.json `ai-i18n-tools` ranges at `^<root version>` so
 * degit/standalone copies match the version about to be published. The
 * workspace override (`ai-i18n-tools: workspace:*`) still links the monorepo
 * to the local checkout, so the caret range need not exist on npm yet.
 *
 * Usage:
 *   node scripts/sync-example-ai-i18n-tools-version.mjs
 *   node scripts/sync-example-ai-i18n-tools-version.mjs --check
 *
 * `--check` exits 1 if any example pin is not `^<version>`. `pnpm pre-release`
 * runs this script without `--check` so stale pins are rewritten.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEP_FIELDS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const SKIP_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  ".git",
  "coverage",
  ".next",
  ".astro",
  ".vitepress",
]);

export function expectedAiI18nToolsRange(version) {
  return `^${version}`;
}

/**
 * @param {string} dir
 * @param {string[]} [out]
 * @returns {string[]}
 */
function walkPackageJsonFiles(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkPackageJsonFiles(full, out);
    } else if (entry.isFile() && entry.name === "package.json") {
      out.push(full);
    }
  }
  return out;
}

/**
 * @param {string} root
 * @returns {{ file: string, field: string, range: string }[]}
 */
export function listExampleAiI18nToolsPins(root) {
  const examplesDir = path.join(root, "examples");
  const pins = [];
  for (const file of walkPackageJsonFiles(examplesDir)) {
    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not parse ${file}: ${message}`, { cause: error });
    }
    for (const field of DEP_FIELDS) {
      const range = pkg[field]?.["ai-i18n-tools"];
      if (typeof range === "string") {
        pins.push({ file, field, range });
      }
    }
  }
  return pins;
}

/**
 * @param {string} root
 * @param {{ checkOnly?: boolean }} [options]
 * @returns {{ expected: string, mismatches: { file: string, field: string, range: string }[], updated: string[] }}
 */
export function syncExampleAiI18nToolsVersion(root, options = {}) {
  const { checkOnly = false } = options;
  const packageJsonPath = path.join(root, "package.json");
  let version;
  try {
    version = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).version;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read package.json version: ${message}`, { cause: error });
  }
  if (!version || typeof version !== "string") {
    throw new Error("Could not read package.json version.");
  }

  const expected = expectedAiI18nToolsRange(version);
  const pins = listExampleAiI18nToolsPins(root);
  const mismatches = pins.filter((pin) => pin.range !== expected);
  const updated = [];

  if (!checkOnly) {
    const files = new Set(mismatches.map((pin) => pin.file));
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      const next = source.replace(/("ai-i18n-tools"\s*:\s*")[^"]+(")/g, `$1${expected}$2`);
      if (next !== source) {
        fs.writeFileSync(file, next, "utf8");
        updated.push(file);
      }
    }
  }

  return { expected, mismatches, updated };
}

function printHelp() {
  console.log(`Usage: node scripts/sync-example-ai-i18n-tools-version.mjs [--check]

Rewrite every example package.json \`ai-i18n-tools\` range to ^<root version>.

Options:
  --check   Do not write files; exit 1 if any pin is out of date.
  -h, --help  Show this help.`);
}

function main(argv = process.argv.slice(2)) {
  let checkOnly = false;
  for (const arg of argv) {
    switch (arg) {
      case "--check":
        checkOnly = true;
        break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
    }
  }

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  let result;
  try {
    result = syncExampleAiI18nToolsVersion(root, { checkOnly });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  if (result.mismatches.length === 0) {
    console.log(`example ai-i18n-tools pins already match ${result.expected}`);
    process.exit(0);
  }

  if (checkOnly) {
    console.error(`example ai-i18n-tools pins must be ${result.expected}:`);
    for (const pin of result.mismatches) {
      const rel = path.relative(root, pin.file);
      console.error(`  ${rel} (${pin.field}): ${pin.range}`);
    }
    process.exit(1);
  }

  for (const file of result.updated) {
    console.log(`updated ${path.relative(root, file)} → ${result.expected}`);
  }
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAs = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedAs && path.normalize(thisFile) === path.normalize(invokedAs)) {
  main();
}
