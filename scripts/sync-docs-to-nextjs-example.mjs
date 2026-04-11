#!/usr/bin/env node
/**
 * Copies markdown from repo docs/ into examples/nextjs-app/docs-site/docs/
 * with Docusaurus-compatible heading anchors {#slug} so TOC links stay valid
 * after translation (same IDs as English).
 *
 * This mirrors what `docusaurus write-heading-ids` does (classic `{#id}` syntax),
 * but runs without installing Docusaurus: repo-root `pnpm run sync-docs:nextjs-example`
 * only needs Node + github-slugger. We also skip an explicit id on the "Table of
 * contents" heading to match the example site. If you prefer the official CLI,
 * copy/sync first, then from `examples/nextjs-app/docs-site/` run
 * `pnpm exec docusaurus write-heading-ids -- --syntax classic` on the doc files
 * (slug rules may differ slightly).
 *
 * Usage: node scripts/sync-docs-to-nextjs-example.mjs
 *    or: npm run sync-docs:nextjs-example
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const MAPPINGS = [
  { src: "GETTING_STARTED.md", dest: "getting-started.md" },
  { src: "PACKAGE_OVERVIEW.md", dest: "package-overview.md" },
  { src: "ai-i18n-tools-context.md", dest: "context.md" },
];

const DOCS_SRC = path.join(REPO_ROOT, "docs");
const DOCS_DEST = path.join(
  REPO_ROOT,
  "examples",
  "nextjs-app",
  "docs-site",
  "docs",
);

const HEADING_RE = /^(#{2,6})(\s+)(.+)$/;

/**
 * @param {string} markdown
 * @returns {string}
 */
function addHeadingAnchors(markdown) {
  const slugger = new GithubSlugger();
  const lines = markdown.split(/\r?\n/);
  const out = [];

  for (const line of lines) {
    const m = line.match(HEADING_RE);
    if (!m) {
      out.push(line);
      continue;
    }

    const level = m[1];
    const sp = m[2];
    const rest = m[3].replace(/\s+$/, "");

    if (/\{#([^}]+)\}\s*$/.test(rest)) {
      out.push(line);
      continue;
    }

    const titleOnly = rest.trim();
    // Match published example: no explicit id on the TOC block.
    if (titleOnly.toLowerCase() === "table of contents") {
      out.push(line);
      continue;
    }

    const slug = slugger.slug(titleOnly);
    out.push(`${level}${sp}${rest} {#${slug}}`);
  }

  return out.join("\n");
}

/**
 * @param {string} text
 * @returns {string}
 */
function adaptPackageOverviewLinks(text) {
  return text
    .replace(
      /\[GETTING_STARTED\.md\]\(\.\/GETTING_STARTED\.md\)/g,
      "[Getting Started](./getting-started.md)",
    )
    .replace(/\.\/GETTING_STARTED\.md/g, "./getting-started.md");
}

function main() {
  for (const { src, dest } of MAPPINGS) {
    const from = path.join(DOCS_SRC, src);
    const to = path.join(DOCS_DEST, dest);

    if (!fs.existsSync(from)) {
      console.error(`Missing source: ${from}`);
      process.exit(1);
    }

    let body = fs.readFileSync(from, "utf8");
    if (src === "PACKAGE_OVERVIEW.md") {
      body = adaptPackageOverviewLinks(body);
    }
    body = addHeadingAnchors(body);

    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, body, "utf8");
    console.log(`Wrote ${path.relative(REPO_ROOT, to)}`);
  }
}

main();
