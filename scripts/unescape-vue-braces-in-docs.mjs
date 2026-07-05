#!/usr/bin/env node
/**
 * One-shot cleanup: remove legacy \{\{ \}\} backslash escapes from markdown sources.
 * VitePress markdown.preprocess now handles Vue brace escaping at render time.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["docs"];

function unescapeFile(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return;
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(abs)) {
      unescapeFile(path.join(rel, entry));
    }
    return;
  }
  if (!rel.endsWith(".md")) return;
  const raw = fs.readFileSync(abs, "utf8");
  const out = raw.replaceAll("\\{\\{", "{{").replaceAll("\\}\\}", "}}");
  if (out !== raw) {
    fs.writeFileSync(abs, out, "utf8");
    console.log(`Unescaped Vue braces: ${rel}`);
  }
}

for (const t of TARGET_DIRS) {
  unescapeFile(t);
}
