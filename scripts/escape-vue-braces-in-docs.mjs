#!/usr/bin/env node
/**
 * Prepare markdown for VitePress: wrap {{ }} (outside fenced code) in <code v-pre>.
 * Run before docs:dev / docs:build so Vue does not treat mustache syntax as interpolation.
 */
import fs from "node:fs";
import path from "node:path";
import { escapeVueBracesInMarkdown } from "./vue-braces-for-markdown.mjs";

const ROOT = process.cwd();
const TARGET_DIRS = ["docs"];

function processFile(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return;
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(abs)) {
      processFile(path.join(rel, entry));
    }
    return;
  }
  if (!rel.endsWith(".md")) return;
  if (rel.endsWith("docs/ai-i18n-tools-context.md")) return;
  const raw = fs.readFileSync(abs, "utf8");
  const out = escapeVueBracesInMarkdown(raw);
  if (out !== raw) {
    fs.writeFileSync(abs, out, "utf8");
    console.log(`Escaped Vue braces: ${rel}`);
  }
}

for (const t of TARGET_DIRS) {
  processFile(t);
}
