# v1.2.2 — Cardinal plurals, docs tooling, cache editor failures, and bundler-safe runtime

This major release delivers **cardinal plural UI strings** end to end (extract, `translate-ui`, flat JSON, XLIFF, runtime helpers), hardens **plural completion and compaction** for RTL and compacted locales, improves **document translation** (emphasis defaults for CJK/RTL, segment splitting, fatal-error summaries), adds **CLI** commands for documentation maintenance (`write-heading-ids`, `strip-md-bold-inline`), extends **`lint-source`** and **`statistics`**, ships a **Translation Cache Editor** **Failures** view with APIs, makes **`ai-i18n-tools/runtime`** **Next.js / Turbopack–friendly** by loading UI-language master data via JSON imports instead of `node:fs`, and **removes OpenRouter prompt-cache** plumbing from the client and command summaries.

For the authoritative per-change list, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/v1.2.1/dev/CHANGELOG.md) (`## [1.2.1] - 2026-04-20`).

---

## Highlights

- **Cardinal plurals** — `t('…', { plurals: true, zeroDigit?: boolean })`; plural rows in `strings.json`; `translate-ui` Step 0 + Pass A/B; `expandPluralFormsForFlatOutput` and fixed `compactIdenticalPluralForms` / `pluralTranslatedLocaleHasContent` so sync and status do not thrash or mis-count Arabic-style categories; **`makeLocaleLoadersFromManifest`** and **`setupKeyAsDefaultT`** in `ai-i18n-tools/runtime` (examples updated).
- **Runtime + TypeScript** — UI master JSON loaded with `import … with { type: "json" }` (build copies data beside `dist/runtime`); **`module` / `moduleResolution`: `NodeNext`**.
- **Docs translation** — optional per-`documentations` **`emphasisPlaceholders`**; CJK/RTL automatic emphasis masking with **`--no-emphasis-placeholders`** / **`--emphasis-placeholders`**; **`segmentSplitting`** (paragraphs, GFM tables, lists) next to **`markdownOutput`**; partial-run **Summary** after fatal errors.
- **New CLI** — **`write-heading-ids`** (slug styles: GitHub, Bitbucket, GitLab, pymdown, Azure DevOps); **`strip-md-bold-inline`** for bold-wrapped inline code in markdown/MDX; subcommand **`--help`** lists **Global Options**; **`statistics`** aligned with cache-editor stats and **`--max-columns`**; **`lint-source`** runs **`extract` first**, cost totals, human **`.log`**, glossary from **`userGlossary` only**.
- **Translation Cache Editor** — **Failures** page, **`/api/translation-failures`**, summary and quality-error endpoints, cache methods for listing failures.
- **Examples & CI** — Next.js example **`?locale=`**, screenshot script, docs updates; workspace **`pnpm.onlyBuiltDependencies`** includes **`sharp`**; GitHub Actions on checkout/setup-node/pnpm **v6** / **v5**.

---

## Upgrade notes

- **npm package consumers** — prefer **`setupKeyAsDefaultT`** over **`wrapI18nWithKeyTrim`** for app wiring; **`wrapI18nWithKeyTrim`** is deprecated for that use case. Cardinal plural catalogs and flat JSON layouts are new; refresh **`translate-ui`** and regenerate locale files as needed.
- **OpenRouter** — prompt **cache TTL** config and cache-related stats lines are **removed**. Cost and token summaries remain where documented.
- **Markdown docs pipelines** — **CJK** and **RTL** locales may **mask emphasis by default**. Use **`documentations[].emphasisPlaceholders`** or **`translate-docs` / `sync`** **`--no-emphasis-placeholders`** / **`--emphasis-placeholders`** to match prior behavior.
- **`segmentSplitting`** defaults to **enabled** when the object is omitted; set **`"segmentSplitting": { "enabled": false }`** to disable.

---

## Added

### CLI and extraction

- Cardinal plural **`extract`** / **`translate-ui`** pipeline, **`translate-ui`** batch ✔️ logging, **`status`** separate plain vs plural tables.
- **`write-heading-ids`**, **`strip-md-bold-inline`**.
- **`statistics`** documentation-cache / `strings.json` aggregates; **`lint-source`** **`totalCostUsd`** and readable **`.log`** output.

### Config and docs processing

- **`emphasisPlaceholders`** per **`documentations`** block; **`segmentSplitting`** with **`MarkdownExtractor`** integration.

### Runtime

- **`makeLocaleLoadersFromManifest`**, **`setupKeyAsDefaultT`**.

### Translation Cache Editor

- **Failures** UI and REST endpoints; **`TranslationCache`** failure helpers.

### Tooling

- **`markdownlint-cli`** (`pnpm run lint:md` / `lint:md:fix`).

### Examples

- **`examples/nextjs-app`** locale query param, **`screenshot-locales.sh`**, docs-site quick-start / feature-showcase updates.

---

## Changed

- **Prompts** — stable system prefix + JSON user payload for **`translate-ui`** and **`lint-source`**; sorted glossary hint lines.
- **`translate-docs`** / **`sync`** — fatal-error **Summary**; emphasis default logging.
- **Dependencies** — **`emoji-regex`**, **`remove-markdown`**; internal slugging replaces devDependency **`github-slugger`**.
- **Docs** — **`README.md`**, **`docs/GETTING_STARTED.md`**, **`docs/PACKAGE_OVERVIEW.md`**.
- **ESLint** — typed linting for `src/` + `tests/` via **`tsconfig.eslint.json`**.
- **Examples** — Next.js **`README`** / **`package.json`** scripts; **`dev/DEVEL.md`** screenshot prerequisites.
- **CI** — workflow action versions and publish **`setup-node`** usage.
- **Root `package.json`** — **`pnpm.onlyBuiltDependencies`** includes **`sharp`**.

---

## Fixed

- **Plural** — compaction with **`locale`**, **`expandPluralFormsForFlatOutput`** sibling order, **`pluralTranslatedLocaleHasContent`** correctness for **`one`** vs **`other`** across locales.

### Runtime

- Bundler-safe UI-language master JSON (no **`node:fs`** in client bundles).

---

## Removed

- **OpenRouter client** — **`cache_control`** on system messages, **`openrouter.promptCacheTtl`**, HTTP 400 retry path without cache metadata, **`prompt_tokens_details`** aggregation; summaries no longer print prompt-cache token breakdowns.

---

## Requirements

- **Node.js** >= 22.16.0  
- **pnpm** >= 10.33.0 (for developing this package)  
- **OpenRouter API key** (`OPENROUTER_API_KEY`) — for translation commands that call the API

---

## Installation

```bash
npm install ai-i18n-tools@1.2.1
# or
pnpm add ai-i18n-tools@1.2.1
```

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/v1.2.1/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/v1.2.1/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/v1.2.1/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
