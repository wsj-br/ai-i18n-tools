#!/usr/bin/env node
/**
 * Sync README.md -> docs/index.md for the VitePress site homepage.
 * Run from repo root: node scripts/sync-readme-to-docs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeVitepressDocLinks } from "../dist/processors/vitepress-link-normalize.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = path.join(ROOT, "README.md");
const outPath = path.join(ROOT, "docs/index.md");

let content = fs.readFileSync(readmePath, "utf8");

content = content.replace(/<!-- START doctoc[\s\S]*?-->\n<!-- DON'T EDIT[\s\S]*?-->\n/, "");
content = content.replace(
  /\*\*Table of Contents\*\*[\s\S]*?<!-- END doctoc[\s\S]*?-->\n\n?/m,
  ""
);
content = content.replace(
  /<small>\*\*Read in other languages:\*\*[\s\S]*?<\/small>\n\n?/m,
  ""
);
content = content.replace(
  /<small id="lang-list">[\s\S]*?<\/small>\n\n?/m,
  ""
);
content = content.replace(/^<a id="ai-i18n-tools"><\/a>\n/m, "");
content = content.replace(/^# ai-i18n-tools\n\n/m, "");
content = content.replace(/^## ai-i18n-tools\n\n/m, "");

// Legacy prose references to removed doc filenames (not always markdown links).
const proseRewrites = [
  [/docs\/GETTING_STARTED\.md#([^)\s]+)/g, "/guide/$1"],
  [/docs\/GETTING_STARTED\.md/g, "/guide/quick-start"],
  [/GETTING_STARTED\.md#([^)\s]+)/g, "/guide/$1"],
  [/GETTING_STARTED\.md/g, "/guide/quick-start"],
  [/docs\/PACKAGE_OVERVIEW\.md/g, "/reference/architecture"],
  [/PACKAGE_OVERVIEW\.md/g, "/reference/architecture"],
  [/docs\/LOCALE-ASSETS-GUIDE\.md/g, "/guide/images-and-screenshots/"],
  [/LOCALE-ASSETS-GUIDE\.md/g, "/guide/images-and-screenshots/"],
];

for (const [pattern, replacement] of proseRewrites) {
  content = content.replace(pattern, replacement);
}

content = normalizeVitepressDocLinks(content, {
  relPath: "docs/index.md",
  docsRoot: "docs",
});

content = content.replace(/\n{3,}/g, "\n\n");

const frontmatter = `---
layout: doc
title: ai-i18n-tools
description: CLI and toolkit for internationalizing JavaScript/TypeScript applications and documentation sites using LLMs.
---

# ai-i18n-tools

`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, frontmatter + content.trim() + "\n", "utf8");
console.log(`Wrote ${path.relative(ROOT, outPath)} from README.md`);
