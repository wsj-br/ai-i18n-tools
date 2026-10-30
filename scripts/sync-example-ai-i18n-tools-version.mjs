#!/usr/bin/env node
/**
 * Keep example package.json `ai-i18n-tools` ranges at `^<root version>` so
 * degit/standalone copies match the version about to be published. The
 * workspace override (`ai-i18n-tools: workspace:*`) still links the monorepo
 * to the local checkout, so the caret range need not exist on npm yet.
 *
 * Also keep `version` in the plugin manifests at the exact root version.
 * A listed manifest that is absent is skipped, so a fixture without those
 * files still syncs example pins. A present manifest with a missing or stale
 * version is rewritten, or reported by `--check`.
 *
 * Usage:
 *   node scripts/sync-example-ai-i18n-tools-version.mjs
 *   node scripts/sync-example-ai-i18n-tools-version.mjs --check
 *
 * `--check` exits 1 if any example pin is not `^<version>` or any present
 * manifest version is not the root version. `pnpm pre-release` runs this
 * script without `--check` so stale pins and manifest versions are rewritten.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEP_FIELDS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

/** JSON pointers whose string values must equal the root package version. */
export const MANIFEST_VERSION_TARGETS = [
  { file: "plugin.json", pointers: [["version"]] },
  { file: ".claude-plugin/plugin.json", pointers: [["version"]] },
  {
    file: ".claude-plugin/marketplace.json",
    pointers: [
      ["metadata", "version"],
      ["plugins", 0, "version"],
    ],
  },
];
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
 * @param {unknown} value
 * @param {(string|number)[]} pointer
 * @returns {unknown}
 */
function readPointer(value, pointer) {
  let current = value;
  for (const key of pointer) {
    if (current === null || typeof current !== "object") return undefined;
    current = /** @type {Record<string, unknown>} */ (current)[key];
  }
  return current;
}

/**
 * @param {unknown} value
 * @param {(string|number)[]} pointer
 * @param {string} next
 * @returns {boolean} true when the stored value changed
 */
function writePointer(value, pointer, next) {
  let current = value;
  for (let index = 0; index < pointer.length - 1; index++) {
    const key = pointer[index];
    if (current === null || typeof current !== "object" || !(key in current)) {
      throw new Error(`Missing ${pointer.join(".")}`);
    }
    current = /** @type {Record<string, unknown>} */ (current)[key];
  }
  const last = pointer[pointer.length - 1];
  if (current === null || typeof current !== "object") {
    throw new Error(`Missing ${pointer.join(".")}`);
  }
  const record = /** @type {Record<string, unknown>} */ (current);
  const previous = record[last];
  record[last] = next;
  return previous !== next;
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
 * @param {string} version
 * @returns {{ file: string, pointer: string, version: unknown }[]}
 */
export function listManifestVersionMismatches(root, version) {
  const mismatches = [];
  for (const target of MANIFEST_VERSION_TARGETS) {
    const file = path.join(root, target.file);
    if (!fs.existsSync(file)) continue;
    let json;
    try {
      json = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not parse ${file}: ${message}`, { cause: error });
    }
    for (const pointer of target.pointers) {
      const found = readPointer(json, pointer);
      if (found !== version) {
        mismatches.push({ file, pointer: pointer.join("."), version: found });
      }
    }
  }
  return mismatches;
}

/**
 * @param {string} root
 * @param {{ checkOnly?: boolean }} [options]
 * @returns {{
 *   version: string,
 *   expected: string,
 *   mismatches: { file: string, field: string, range: string }[],
 *   updated: string[],
 *   manifestMismatches: { file: string, pointer: string, version: unknown }[],
 *   manifestsUpdated: string[]
 * }}
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
  const manifestMismatches = listManifestVersionMismatches(root, version);
  const manifestsUpdated = [];

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

    const manifestFiles = new Set(manifestMismatches.map((item) => item.file));
    for (const file of manifestFiles) {
      const target = MANIFEST_VERSION_TARGETS.find(
        (entry) => path.join(root, entry.file) === file
      );
      if (!target) continue;
      const json = JSON.parse(fs.readFileSync(file, "utf8"));
      let changed = false;
      for (const pointer of target.pointers) {
        if (writePointer(json, pointer, version)) changed = true;
      }
      if (changed) {
        fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, "utf8");
        manifestsUpdated.push(file);
      }
    }
  }

  return { version, expected, mismatches, updated, manifestMismatches, manifestsUpdated };
}

function printHelp() {
  console.log(`Usage: node scripts/sync-example-ai-i18n-tools-version.mjs [--check]

Rewrite every example package.json \`ai-i18n-tools\` range to ^<root version>,
and set version in the plugin manifests to the root version.

Options:
  --check   Do not write files; exit 1 if any pin or manifest version is out of date.
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

  if (result.mismatches.length === 0 && result.manifestMismatches.length === 0) {
    console.log(
      `example ai-i18n-tools pins already match ${result.expected}; plugin manifest versions already match ${result.version}`
    );
    process.exit(0);
  }

  if (checkOnly) {
    if (result.mismatches.length > 0) {
      console.error(`example ai-i18n-tools pins must be ${result.expected}:`);
      for (const pin of result.mismatches) {
        const rel = path.relative(root, pin.file);
        console.error(`  ${rel} (${pin.field}): ${pin.range}`);
      }
    }
    if (result.manifestMismatches.length > 0) {
      console.error(`plugin manifest versions must be ${result.version}:`);
      for (const item of result.manifestMismatches) {
        const rel = path.relative(root, item.file);
        const found = item.version === undefined ? "(missing)" : String(item.version);
        console.error(`  ${rel} (${item.pointer}): ${found}`);
      }
    }
    process.exit(1);
  }

  for (const file of result.updated) {
    console.log(`updated ${path.relative(root, file)} → ${result.expected}`);
  }
  for (const file of result.manifestsUpdated) {
    console.log(`updated ${path.relative(root, file)} → ${result.version}`);
  }
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAs = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedAs && path.normalize(thisFile) === path.normalize(invokedAs)) {
  main();
}
