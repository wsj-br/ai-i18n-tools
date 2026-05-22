#!/usr/bin/env node
/**
 * license-checker-rseidelsohn only applies clarifications.licenseText when --customPath
 * is set, and --plainVertical ignores moduleData.licenseText and always reads licenseFile
 * from disk. Some packages ship without LICENSE and match README.md as the "license file";
 * notices would otherwise embed the README.
 *
 * This script runs the checker with --json (so clarifications + customPath apply) for the
 * root package and each workspace example, merges results, then emits plain-vertical blocks
 * while preferring licenseText when present.
 *
 * `3p-lic-clarifications.json` reuses entries from the transrewrt project where the same
 * packages appear in this workspace (see wsj-br/transrewrt on GitHub). Add ai-i18n-tools-only
 * clarifications there when license-checker mis-detects a license file.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Workspace package roots whose production dependency trees are included in NOTICES. */
const SCAN_ROOTS = [
  ".",
  "examples/console-app",
  "examples/nextjs-app",
  "examples/nextjs-app/docs-site",
  "examples/astro-docs",
];

/** First-party packages in this repository (not third-party). */
const EXCLUDE_PACKAGES = [
  "ai-i18n-tools",
  "console-app-example",
  "nextjs-app-example",
  "nextjs-app-docs-site",
  "astro-docs",
];

function getModuleNameForLicenseTextHeader(moduleName) {
  const i = moduleName.lastIndexOf("@");
  return `${moduleName.slice(0, i)} ${moduleName.slice(i + 1)}\n`;
}

function licenseTitleLine(moduleData) {
  const { licenses } = moduleData;
  if (Array.isArray(licenses) && licenses.length > 0) {
    return licenses
      .map((m) => {
        if (typeof m === "object" && m) return m.type || m.name;
        if (typeof m === "string") return m;
        return "";
      })
      .join("");
  }
  if (typeof licenses === "object" && licenses && (licenses.type || licenses.name)) {
    return licenses.type || licenses.name;
  }
  if (typeof licenses === "string") return licenses;
  return "";
}

function bodyText(moduleData) {
  if (typeof moduleData.licenseText === "string" && moduleData.licenseText.length > 0) {
    return moduleData.licenseText;
  }
  const lf = moduleData.licenseFile;
  if (Array.isArray(lf) && lf.length > 0) {
    return lf
      .map((m) => {
        if (typeof m === "object" && m) return m.type || m.name;
        if (typeof m === "string") return m;
        return "";
      })
      .join("");
  }
  if (typeof lf === "object" && lf && (lf.type || lf.name)) {
    return lf.type || lf.name;
  }
  if (typeof lf === "string" && fs.existsSync(lf)) {
    return fs.readFileSync(lf, "utf8");
  }
  return "";
}

function asPlainVerticalPreferClarifications(sorted) {
  return Object.entries(sorted)
    .map(([moduleName, moduleData]) => {
      let out = getModuleNameForLicenseTextHeader(moduleName);
      out += licenseTitleLine(moduleData);
      out += "\n";
      out += bodyText(moduleData);
      return out;
    })
    .map((block) => `---\n\n${block}`)
    .join("\n\n");
}

function mergeModuleData(existing, incoming) {
  if (!existing) return incoming;
  const existingText =
    typeof existing.licenseText === "string" ? existing.licenseText.length : 0;
  const incomingText =
    typeof incoming.licenseText === "string" ? incoming.licenseText.length : 0;
  if (incomingText > existingText) return incoming;
  if (existingText > incomingText) return existing;
  return incoming;
}

function runCheckerForRoot(checkerJs, scanRoot, customFormat, clarifications) {
  const cwd = path.join(root, scanRoot);
  if (!fs.existsSync(path.join(cwd, "package.json"))) {
    console.error(`Skipping ${scanRoot}: no package.json`);
    return {};
  }
  const jsonRaw = execFileSync(
    process.execPath,
    [
      checkerJs,
      "--production",
      "--json",
      "--excludePackages",
      EXCLUDE_PACKAGES.join(";"),
      "--clarificationsFile",
      clarifications,
      "--customPath",
      customFormat,
    ],
    { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  return JSON.parse(jsonRaw);
}

function sortedMerged(modulesByName) {
  const keys = Object.keys(modulesByName).sort((a, b) => a.localeCompare(b, "en"));
  const sorted = {};
  for (const key of keys) sorted[key] = modulesByName[key];
  return sorted;
}

const outFile = path.join(root, "NOTICES");
const customFormat = path.join(__dirname, "license-checker-custom-format.json");
const clarifications = path.join(root, "3p-lic-clarifications.json");

const checkerJs = path.join(
  root,
  "node_modules",
  "license-checker-rseidelsohn",
  "bin",
  "license-checker-rseidelsohn.js",
);
if (!fs.existsSync(checkerJs)) {
  console.error("license-checker-rseidelsohn not found; run pnpm install");
  process.exit(1);
}

const merged = {};
for (const scanRoot of SCAN_ROOTS) {
  console.error(`Scanning ${scanRoot === "." ? "ai-i18n-tools" : scanRoot}…`);
  const partial = runCheckerForRoot(checkerJs, scanRoot, customFormat, clarifications);
  for (const [moduleName, moduleData] of Object.entries(partial)) {
    merged[moduleName] = mergeModuleData(merged[moduleName], moduleData);
  }
}

const preamble = [
  "Third-party notices for ai-i18n-tools and its examples.",
  "",
  "Auto-generated by scripts/write-third-party-notices.js — do not edit by hand.",
  "Regenerate: pnpm notices:write",
  "",
].join("\n");

const body = asPlainVerticalPreferClarifications(sortedMerged(merged));
fs.writeFileSync(outFile, `${preamble}\n${body}`, "utf8");
console.log(`Wrote ${path.relative(root, outFile)} (${Object.keys(merged).length} packages)`);
