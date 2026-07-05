#!/usr/bin/env node
/** Print markdown paths for markdown-link-check (one per line). */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".vitepress") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".md") || ent.name.endsWith(".mdx")) out.push(p);
  }
  return out;
}

const targets = [
  path.join(ROOT, "README.md"),
  ...walk(path.join(ROOT, "dev")).filter((p) => p.endsWith(".md")),
  ...walk(path.join(ROOT, "docs")).filter((p) => p.endsWith(".md")),
  ...walk(path.join(ROOT, "examples", "console-app")).filter((p) => p.endsWith(".md")),
  ...walk(path.join(ROOT, "examples", "nextjs-app")).filter((p) => p.endsWith(".md")),
  ...walk(path.join(ROOT, "examples", "astro-docs")).filter((p) =>
    p.endsWith(".md") || p.endsWith(".mdx"),
  ),
];

for (const file of targets.sort()) {
  console.log(path.relative(ROOT, file));
}
