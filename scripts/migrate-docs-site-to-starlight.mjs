#!/usr/bin/env node
/**
 * One-off: convert Docusaurus docs-site translated markdown to Starlight layout.
 * Reads examples/nextjs-app/docs-site/i18n/<locale>/…/current/*.md
 * Writes examples/astro-docs/src/content/docs/<locale>/…
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const srcBase = path.join(
  repoRoot,
  "examples/nextjs-app/docs-site/i18n"
);
const outBase = path.join(repoRoot, "examples/astro-docs/src/content/docs");
const locales = ["ar", "es", "fr", "de", "pt-BR"];

function convertFrontmatter(fm) {
  let out = fm.replace(/^sidebar_position:\s*(\d+)\s*$/m, "sidebar:\n  order: $1");
  out = out.replace(
    /^source_file_path:\s*docs-site\/docs\//m,
    "source_file_path: src/content/docs/"
  );
  return out;
}

function convertBody(body) {
  let s = body;
  s = s.replace(
    /import Tabs from '@theme\/Tabs';\nimport TabItem from '@theme\/TabItem';/,
    "import { Tabs, TabItem, Aside } from '@astrojs/starlight/components';"
  );
  if (!s.includes("@astrojs/starlight/components")) {
    s = `import { Tabs, TabItem, Aside } from '@astrojs/starlight/components';\n\n${s}`;
  }
  s = s.replace(/<TabItem value="[^"]*" label=/g, "<TabItem label=");
  s = s.replace(
    /:::note\n([\s\S]*?)\n:::/g,
    "<Aside type=\"note\">\n$1\n</Aside>"
  );
  s = s.replace(/:::tip\n([\s\S]*?)\n:::/g, "<Aside type=\"tip\">\n$1\n</Aside>");
  s = s.replace(
    /:::warning\n([\s\S]*?)\n:::/g,
    "<Aside type=\"caution\">\n$1\n</Aside>"
  );
  s = s.replace(
    /:::danger\n([\s\S]*?)\n:::/g,
    "<Aside type=\"danger\">\n$1\n</Aside>"
  );
  s = s.replace(/docs-site\/docs\//g, "src/content/docs/");
  s = s.replace(/docs-site\/i18n\/<locale>\/docusaurus-plugin-content-docs\/current\//g, "src/content/docs/<locale>/");
  s = s.replace(
    /docs-site\/i18n\/(\w[\w-]*)\/docusaurus-plugin-content-docs\/current\//g,
    "src/content/docs/$1/"
  );
  s = s.replace(/"style": "docusaurus"/g, '"style": "astro-starlight"');
  s = s.replace(/docs-site\/i18n/g, "src/content/docs");
  s = s.replace(/cd docs-site\n/g, "pnpm dev\n");
  s = s.replace(/pnpm start -- --locale de/g, "pnpm dev");
  s = s.replace(/Docusaurus dev server/gi, "Starlight dev server");
  s = s.replace(/Start Docusaurus/g, "Start Starlight");
  s = s.replace(/localhost:3040/g, "localhost:3050");
  return s;
}

function convertFile(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return text;
  }
  const fm = convertFrontmatter(match[1]);
  const body = convertBody(match[2]);
  return `---\n${fm}\n---\n${body}`;
}

for (const locale of locales) {
  const inDir = path.join(
    srcBase,
    locale,
    "docusaurus-plugin-content-docs/current"
  );
  const outDir = path.join(outBase, locale);
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of ["quick-start.md", "feature-showcase.md"]) {
    const src = path.join(inDir, name);
    if (!fs.existsSync(src)) {
      console.warn(`skip missing ${src}`);
      continue;
    }
    const raw = fs.readFileSync(src, "utf8");
    const outName = name.replace(/\.md$/, ".mdx");
    const converted = convertFile(raw);
    fs.writeFileSync(path.join(outDir, outName), converted, "utf8");
    console.log(`wrote ${locale}/${outName}`);
  }
}
