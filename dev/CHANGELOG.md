<!-- DOCTOC SKIP -->

# Changelog

All notable changes to this project will be documented in this file.

Use conventional types (**Added**, **Changed**, **Fixed**, etc.), a short **scope** (subsystem or UI area), and a clear description—see `.cursor/rules/project.mdc` for when to log and the bullet shape.

Add new entries in the `## [Unreleased]` section. When releasing a new version, move all entries in "[Unreleased]" to a new entry `## [x.y.z] - YYYY-MM-DD`.


## [Unreleased]

- **Fixed**: SVG — `translate-svg` reassembly decodes XML entities in model output (`&gt;`, `&amp;`, etc.) before writing, matching batch XML unescape behavior so text is not double-escaped (e.g. `&amp;gt;`).

- **Changed**: config — `svg.forceLowercase` replaces nested `svg.svgExtractor.forceLowercase` (`translate-svg`); legacy nested keys are still accepted and hoisted when loading config.

- **Fixed**: cli — `collectFilesByExtension` glob handling when the pattern resolves to a single file (`fullPath` / `relFromCwd` were undefined in that branch).

- **Added**: CLI `sync-ui` — run extract (if `features.extractUIStrings` is enabled) then translate UI strings (if `features.translateUIStrings` is enabled); same `-l/--locale`, `--force`, `--dry-run`, and `-j/--concurrency` options as `translate-ui` for syncing just UI without documentation or SVG translation.

- **Changed**: ui-languages — `isSourceLocale` is now only included in `ui-languages.json` for the source locale (previously it was included for all locales as `true`/`false`).


---

## [1.4.0] - 2026-05-06

- **Changed**: docs — `README.md`, `GETTING_STARTED.md`, `docs-site` example README, and `PACKAGE_OVERVIEW.md` clarify that Docusaurus **markdown/MDX** under `contentPaths` is the primary documentation output; JSON from `jsonSource` / `write-translations` is **site shell** (theme/nav/footer), not page body copy.

- **Fixed**: mdx-placeholders / `translate-docs` — user-facing JSX string attributes (`label`, `tooltip`, `aria-label`) are rewritten to `{{JXA_N}}` inside preserved tags, appended for translation as `||JXA_N: …||` lines after `protectSegmentForTranslation`, merged back in `restoreMdx`, and called out in document core rules and placeholder leak checks. Previously attributes were recorded but not appended to segments or substituted after translation.

- **Changed**: mdx-placeholders — also extracts translatable copy from `label: '…'` inside `<Tabs values={[ … ]}>` objects and from `<TabItem value="…">` when that opener has no `label` attribute (skips lowercase slug-like values so keys stay aligned with `defaultValue` / `values`).

- **Fixed**: markdown extractor — YAML front matter is no longer translated (`translatable: false`), so `slug`, `id`, and other routing keys stay stable across locales.

- **Fixed**: admonition placeholders — only the directive prefix on the opening line (for example `:::note` or `:::note ` when a same-line title exists) is replaced by `{{ADM_OPEN_N}}`; the title suffix on that line is left for the model to translate.

- **Fixed**: markdown extractor — multi-line MDX that starts with a capital JSX tag (for example a `<Tabs>` block) is classified as a translatable paragraph; inner prose is no longer skipped because the whole block was treated as a non-translatable `other` segment.

- **Changed**: cli `strip-md-bold-inline` — backup files now use `.tmp` extension (e.g., `file.backup.2026-05-04T22-46-00-000Z.md.tmp`) to prevent accidental translation.

- **Fixed**: cli — warn when `--path` / `--file` points to a path that does not exist (`translate-docs`, `translate-svg`, `sync`, `write-heading-ids`, `strip-md-bold-inline`, `check-markdown`).

- **Fixed**: cli — `translate-docs` / `sync` (docs step) with `--path` / `--file` now translate matching `.md` / `.mdx` that sit outside `documentations[].contentPaths` (using `documentations[0]` output settings, with a warning) or that were left out of discovery (e.g. `.translate-ignore`), with a warning. Unit tests: `tests/unit/path-filter-markdown-augment.test.ts`.

- **Changed**: cli — root `ai-i18n-tools --help` appends a short guide (`--help` per command, `-l` / `--locale` on translation commands, `lint-source` semantics); `translate-docs`, `translate-svg`, `translate-ui`, `sync`, and `export-ui-xliff` append Examples after `--help`; command descriptions and `sync -l` hint text mention comma-separated locale codes.

- **Fixed**: doc-translate — protect MDX-only constructs that previously leaked into the translation prompt: heading-id comments `{/* #my-id */}`, generic MDX comments `{/* … */}`, capitalized JSX tag pairs (`<Highlight …>` / `</Highlight>`, `<TOCInline />`), and depth-aware brace expressions (`{frontMatter.title}`, `style={{…}}`). Each match is replaced by a `{{MDX_N}}` token via the new `src/processors/mdx-placeholders.ts`, threaded through `PlaceholderHandler.protectForTranslation` after `protectDocAnchors` and before URL/inline-code/emphasis scanners.

- **Fixed**: markdown extractor — top-level MDX `export …` blocks (e.g. `export const Highlight = (...) => (...)`) are now classified as non-translatable code in `MarkdownExtractor.classifySegment`, matching the existing `import …` rule, so React component source no longer reaches the model.

- **Added**: `{{MDX_N}}` to the document core-rules prompt (`src/core/prompts.ts`) and the internal-placeholder leak detector (`src/processors/translation-placeholder-leaks.ts`); `protectMdx` / `restoreMdx` re-exported from `src/index.ts`.

---

## [1.4.1] - 2026-05-06

- **Changed**: dependencies — downgraded `express` from `^5.2.1` to `^4.22.1` for Docusaurus 3.x compatibility.

---

## [1.3.1] - 2026-05-03

- **Changed**: docs — expanded `docs/ai-i18n-tools-context.md` with code patterns, a runtime wiring sketch, RTL notes, generated-file layout, and extra CLI entries; remains audience-agnostic for downstream agents.

- **Fixed**: markdown source diagnostics — `STRONG_OUTSIDE_INLINE_CODE` no longer treats the closer of `**word**` / `__word__` (a letter or digit immediately before the delimiter run) as an opener wrapping a following `` `...` `` span; fixes false positives such as `**Bare** `ai-i18n-tools` **in the terminal**`. Strong/link issues now apply `segmentStartLine` to reported file lines like other diagnostics.

- **Added**: markdown source diagnostics — `STRONG_OUTSIDE_INLINE_CODE` and `STRONG_OUTSIDE_LINK` detect `**`/`__` wrapping a `` `...` `` span or a `[text](url)` link (same segment scan as existing checks); reported by `check-markdown`, `translate-docs` when `warnMarkdownSourceIssues` is enabled, and the Translation Cache Editor **Markdown issues** tab.

- **Changed**: translate-docs — markdown source diagnostics (`warnMarkdownSourceIssues`) run **once per source file** (after the same segment extraction as translation) before locale-parallel work, so `markdown_source_issues` refresh and stderr warnings are not duplicated for each target locale.

- **Fixed**: Translation Cache Editor — `POST /api/log-links` (cache segments and **Markdown issues** link button) logs `path:line` with the project-relative file path only, omitting the `doc-block:{n}:` cache key prefix (for example `README.md:57` instead of `doc-block:0:README.md:57`).

- **Added**: CLI `clean-temp` — walks a tree for `*.log` and `cache.db.backup*.sqlite`, prints `./…` lines like `find -print`; `-f` / `--force` deletes without prompting, otherwise prompts `Delete these files? (y/n)` and deletes only on exact `y`; no prompt when nothing matches; optional `-r` / `--root` and `--dry-run` (list only, overrides `--force`). The `package.json` `clean-temp` script invokes this command.

- **Added**: CLI `check-markdown` — scans each `documentations[]` markdown/MDX source (same paths and segment extraction as `translate-docs`, honours `.translate-ignore` and `--path`), prints `path:line: [CODE] detail` to stderr (or JSON with `--json`), exits **1** when issues exist, and refreshes the `markdown_source_issues` SQLite table unless `--no-cache`.

- **Added**: Translation Cache Editor — **Markdown issues** tab with filters, pagination, and `GET /api/markdown-source-issues`, `GET /api/markdown-source-issues/summary`, and `GET /api/markdown-source-issue-codes` (static delimiter / inline-code diagnostics, not translation failures).

- **Added**: SQLite `markdown_source_issues` table (schema version **4**) with `TranslationCache.replaceMarkdownIssuesForFilepath`, `listMarkdownSourceIssues`, `getMarkdownSourceIssueSummary`, and `getUniqueMarkdownSourceIssueCodes`; rows are replaced per cache filepath on scan and removed when translations for that filepath are deleted.

- **Added**: `documentations[].warnMarkdownSourceIssues` (optional, default **true**) — during `translate-docs`, log markdown source warnings and refresh `markdown_source_issues` for each processed file.

- **Added**: `src/processors/markdown-source-diagnostics.ts` and exports `collectMarkdownSourceIssues`, `collectMarkdownIssuesForSegment`, `shouldDiagnoseMarkdownSegment`, and `MARKDOWN_SOURCE_ISSUE_CODES`; `emphasis-placeholders` exports `collectMarkdownDelimiterRuns`, `pairMarkdownEmphasisDelimitersFromRuns`, `findCodeSpanEnd`, `findUnclosedInlineCodeLine1Starts`, and `MarkdownDelimiterRun` for shared pairing rules.

- **Added**: `buildMarkdownExtractOpts` in `doc-translate.ts` so `translate-docs` and `check-markdown` share the same markdown extractor options.

---

## [1.2.8] - 2026-05-03

- **Fixed**: CI — `.github/workflows/ci.yml` runs `node scripts/write-build-info.mjs` after install and before `pnpm run lint`, because `src/build-info.generated.ts` is gitignored and typecheck requires it (same output as the first step of `pnpm build`).

- **Changed**: docs — UK spelling and light grammar edits in `README.md`, `docs/GETTING_STARTED.md`, and `dev/DEVEL.md` (for example **-ise** verbs, **licence** where appropriate, clearer phrasing for runtime helpers, version bumping, `editor --no-open`, and the `"flat"` layout line).

- **Changed**: docs — `docs/GETTING_STARTED.md` recommended `package.json` scripts now prefer `sync` over chaining `translate-ui && translate-svg && translate-docs`.

- **Changed**: docs — `README.md`, `docs/GETTING_STARTED.md`, and `dev/DEVEL.md` now match the CLI (`write-heading-ids`, `strip-md-bold-inline`, `lint-source`, `statistics`), `package.json` `engines.node`, published `data/`, and `init` flags (`-o`, `--with-translate-ignore`).

- **Fixed**: `ai-i18n-tools.config.json` — `markdownOutput.postProcessing.regexAdjustments` rewrites the Translation Cache Editor screenshot link so flat outputs under `translated-docs/docs/` resolve to `../../docs/translation-cache-editor.png` (the image is not emitted into `translated-docs/`).

- **Added**: tests — expanded Vitest coverage for `openrouter`, `cache`, `locale-utils`, `prompt-builder`, `ui-languages-catalog`, `ui-string-babel`, `write-heading-ids-core`, and the translation editor HTTP app (including `GET /api/stats` error handling and OpenRouter `lintUISourceBatch` / plural batch paths).

- **Fixed**: config — explicit callback parameter types in `parseI18nConfig`, `resolveTranslationModels`, and `validateI18nBusinessRules` so strict editors no longer report TS7006 (`implicit any`) on those closures.

- **Changed**: TypeScript / tooling — shared strict baseline `tsconfig.base.json`; build still uses root `tsconfig.json` (extends base, `src/` only, emits `dist/`); **`noImplicitOverride`** enabled for production sources (requires explicit `override` on subclasses). Added **`tsconfig.tests.json`** with relaxed compiler settings plus **`vitest/globals`** types so Vitest files type-check and IDE tooling aligns without using the main include-only-`src/` program.

- **Changed**: scripts — `pnpm typecheck` runs `tsc --noEmit` on `tsconfig.json` and `tsconfig.tests.json`; **`pnpm lint`** runs ESLint and then `typecheck`.

- **Changed**: ESLint — typed lint uses **`tsconfig.json` for `src/**/*.ts`** and **`tsconfig.tests.json` for `tests/**/*.ts`** (replaces the removed `tsconfig.eslint.json`); production sources enable **`@typescript-eslint/no-floating-promises`** and **`no-misused-promises`** at **error**; tests keep the prior relaxed `@typescript-eslint` disables plus floating-promise rules **off** for Vitest ergonomics.

- **Fixed**: CLI `editor` — startup logs (listening message, port fallback banner, URL) no longer print twice when the requested TCP port is unavailable and the server binds to the next port.

- **Added**: translation editor (web) — when the local HTTP server stops, the UI shows a full-page “Editor server unavailable” state (failed `fetch` plus periodic `GET /api/health` while the tab is visible); the screen clears when the server responds again, with a “Close window” action (`window.close()` when the browser allows).

- **Changed**: translation editor (web) — “Close window” on the server-unavailable overlay uses the same primary accent button styling as other primary actions.

- **Added**: OpenRouter — `openrouter.requestTimeoutMs` (default `30000`) aborts each chat-completion and `GET /models` request after that many milliseconds; helper scripts `fill-ui-language-labels` / `validate-ui-language-labels` read the same field from config.

- **Changed**: config — Default `openrouter.translationModels` (`DEFAULT_OPENROUTER_MODELS`), example apps under `examples/`, and `docs/GETTING_STARTED.md` now match the curated fallback chain (adds `google/gemma-4-31b-it`, `~anthropic/claude-haiku-latest`, `~anthropic/claude-sonnet-latest`; reorders so `google/gemini-3-flash-preview` precedes those aliases and `openai/gpt-5.3-codex` is last; drops fixed `anthropic/claude-sonnet-4.6`).

- **Fixed**: build — `dist/cli/index.js` is now `chmod 0o755` after `tsc` via `scripts/chmod-cli-bin.mjs`, so running `pnpm i18n:*` scripts from a fresh clone no longer fails with `sh: ai-i18n-tools: Permission denied`. Cross-platform safe (no-op on Windows).

- **Added**: docs — README `Installation` gains a `Using the CLI` subsection covering per-project install plus `npx`/`pnpm exec`, global install with `npm i -g` / `pnpm add -g` (including the `ERR_PNPM_NO_GLOBAL_BIN_DIR` / `pnpm setup` note), and `npx`/`pnpm dlx`.

- **Added**: docs — `dev/DEVEL.md` gains an "Exposing the CLI globally during development" subsection covering `pnpm link --global`, the `pnpm setup` prerequisite, the exact `ERR_PNPM_NO_GLOBAL_BIN_DIR` error, and Linux/Windows notes.

- **Added**: cli — New `check-models` command loads `openrouter.translationModels` (via `resolveTranslationModels`), fetches OpenRouter `GET /models`, reports ids missing from the catalog or past `expiration_date`, and lists valid models with input/output pricing (USD per 1M tokens). Requires `OPENROUTER_API_KEY`; exits non-zero when any configured model is invalid.

- **Changed**: cli — `check-models` prints the OpenRouter models directory URL (`https://openrouter.ai/models`) at the end of the report.

- **Fixed**: cli — `check-models` pricing now converts OpenRouter’s per-token API values to USD per 1M tokens (matching the website) and shows three decimal places.

- **Changed**: cli — Before calling OpenRouter for translation, `sync`, `translate-docs`, `translate-ui`, `translate-svg`, `lint-source`, and `cleanup` (via sync) fetch the OpenRouter model catalog and drop configured ids that are not listed; a `[models]` warning names ignored ids and suggests editing `openrouter.translationModels` and running `check-models`. If every id is unknown, the command fails with a clear error.

---

## [1.2.7] - 2026-05-02

- **Fixed**: documentation cache / translation editor — `translation_failures` now stores optional `filepath` and `source_text` when recording doc translation failures, and list/summary queries use `COALESCE` with `translations` so the editor shows file and source for segments that never got a cached translation row (fatal quality/API errors). SQLite schema v3 adds these columns; existing DBs migrate on open.

- **Changed**: CLI `editor` — default HTTP port is now `8675` (previous default `8787` often falls in Windows Hyper-V / excluded TCP ranges such as 8705–8804). If binding fails (`EADDRINUSE`, `EACCES`, etc.), the server retries the next port until one succeeds (up to 1000 attempts) and logs the chosen port.

---

## [1.2.6] - 2026-04-28

- **Fixed**: UI translation (`translate-ui` / `sync`) — parallel locale workers no longer each atomically rewrite `strings.json` on Windows (that caused `EPERM` on rename); the catalog is written once per parallel batch (and for a single locale after it finishes). `writeAtomicUtf8` retries rename on Windows for transient `EPERM`/`EACCES`/`EBUSY`.

---

## [1.2.5] - 2026-04-28

- **Fixed**: UI languages master build — `decodeHtmlEntities` in `scripts/lib/decode-html-entities-ui-languages.mjs` peels `&amp;` before numeric/hex references and repeats decoding until stable so sequences like `&amp;#160;` cannot leave literal `&#160;` in `data/ui-languages-complete.json`.

---

## [1.2.4] - 2026-04-28

- **Changed**: UI languages scripts — `pnpm run build:ui-languages-master` uses `node --env-file-if-exists=.env`, and `scripts/build-ui-languages-complete.mjs`, `scripts/fill-ui-language-labels.mjs`, and `scripts/validate-ui-language-labels.mjs` load repo-root `.env` via `scripts/lib/load-repo-dotenv.mjs` (`process.loadEnvFile`) so `OPENROUTER_API_KEY` is picked up without exporting it in the shell.

- **Fixed**: UI languages master catalog — `scripts/build-ui-languages-complete.mjs` now decodes HTML character references (for example `&#160;` from Wikimedia table cells) when extracting English names so `data/ui-languages-complete.json` stores plain Unicode text instead of literal entity strings.

- **Fixed**: CI — `pnpm/action-setup` no longer pins a pnpm version that conflicts with `packageManager` in `package.json` (the action reads the version from `package.json` when `version` is omitted).

- **Changed**: Release tooling — `scripts/release.sh` removes an existing GitHub release (`gh release delete --cleanup-tag`), an orphan remote tag, or a local tag when needed, then recreates an annotated tag at HEAD and pushes before `gh release create`; `--dry-run` still performs no deletes.

---

## [1.2.3] - 2026-04-27

- **Changed**: Markdown post-processing — `documentations[].markdownOutput.postProcessing.languageListBlock` now supports `label` (`local` or `english`) for switcher labels; generation uses `ui-languages.json` when present, otherwise falls back to bundled `data/ui-languages-complete.json` for `sourceLocale` + target locales. Default is `local` so generated links use each locale endonym unless explicitly overridden.

- **Added**: Release tooling — add `scripts/release.sh` to create GitHub releases locally with `gh release create` using versioned markdown notes from `dev/RELEASE_NOTES_<version>.md`, including preflight checks and `--dry-run`; root `package.json` now provides `pnpm release:github` and `pnpm release:github:dry`.

- **Changed**: UI languages catalog build — `scripts/build-ui-languages-complete.mjs` now adds a Wikimedia fallback source for missing bare 2–3 letter language tags when glibc locales do not include them (for example `jv` / Javanese), while still excluding non-primary wiki keys like `be-x-old`; `scripts/fill-ui-language-labels.mjs` now fixes both `label` and `direction` in one OpenRouter pass (same `openrouter.translationModels` fallback chain), and the separate in-build review pass/`--no-label-review` flow was removed to avoid duplicate full-model runs.

---


## [1.2.2] - 2026-04-20

- **Fixed**: Packaging — removed erroneous **`dependencies`** entry **`link:…/ai-i18n-tools`** from root **`package.json`** (local-only symlink must not ship in the npm manifest).

- **Fixed**: Runtime — **`ui-languages-master-direction`** loads **`data/ui-languages-complete.json`** via **`import … with { type: "json" }`** (resolved through a symlink **`src/runtime/ui-languages-complete.json`**) instead of **`node:fs`**, so **`ai-i18n-tools/runtime`** bundles in Next.js / Turbopack client chunks without **`node:fs`**; **`pnpm build`** copies the JSON beside **`dist/runtime`** for Node consumers.

- **Changed**: TypeScript — **`module`** / **`moduleResolution`** use **`NodeNext`** so JSON import attributes compile and **`dist/runtime`** stays loadable under Node’s JSON module semantics.

- **Fixed**: CLI — **`translate-ui`** / **`sync`** plural compaction (`compactIdenticalPluralForms`): when optional **`locale`** is passed (source locale for Step 0, target locale for Pass B), duplicate cardinal strings no longer drop **`one`** while keeping **`other`** alone—doing so broke **`pluralTranslatedLocaleHasContent`** and caused repeated Arabic (and similar) plural API runs every sync.

- **Changed**: Examples — **`examples/nextjs-app/README.md`** aligned with current scripts and layout (engines, **`i18n:translate`** / per-step CLI, **`i18n:clean`** / **`i18n:editor`**, project tree, Docusaurus **`docusaurus.config.mjs`**, removed stale **`sync-docs`** references); **`examples/nextjs-app/package.json`** adds **`i18n:clean`** and **`i18n:editor`** scripts.

- **Added**: Translation Cache Editor — **Failures** page with paginated, filterable translation failure rows and summary metrics; **`GET /api/translation-failures`**, **`GET /api/translation-failures/summary`**, and **`GET /api/failure-quality-errors`**; **`TranslationCache`** adds **`listTranslationFailures`**, **`getTranslationFailureSummary`**, and **`getUniqueFailureQualityErrors`**.

- **Changed**: Dependencies — add **`emoji-regex`** and **`remove-markdown`**; remove devDependency **`github-slugger`** (slug styles are implemented in **`write-heading-ids-core`**).

- **Changed**: Docs — **`README.md`** (TOC and sections), **`docs/GETTING_STARTED.md`**, and **`docs/PACKAGE_OVERVIEW.md`** expanded for recent CLI commands, config options, plural workflows, and cache tooling.

- **Added**: CLI — `strip-md-bold-inline` walks all `documentations[].contentPaths` markdown/MDX files (same discovery as `write-heading-ids`, including `.translate-ignore` and optional `--path` / `--file`), rewrites bold-wrapped inline code to plain code spans, writes a timestamped `.backup.<ISO>.md` sibling before overwrite unless `--no-backup`, and supports `--dry-run`.

- **Changed**: Cursor rules — `.cursor/rules/project.mdc` no longer uses bold around inline code (headings, paths, and filenames follow plain backticks).

- **Added**: CLI — **`write-heading-ids`** inserts an HTML anchor line **`<a id="…"></a>`** immediately **before** each flat ATX heading (outside fenced code blocks); supports **`--slug-style`** **`github`** (doctoc / anchor-markdown-header), **`bitbucket`**, **`gitlab`**, **`pymdown`** (with **`--pymdown-*`** options), and **`azure-devops`**; **`--dry-run`** and **`--path`** / **`--file`** match other documentation commands.
- **Removed**: OpenRouter client — Anthropic-style **`cache_control`** on system messages, config **`openrouter.promptCacheTtl`**, HTTP **400** retry without cache metadata, and aggregation of **`usage.prompt_tokens_details`** into **`OpenRouterUsageStats`**; **`translate-docs`**, **`translate-ui`**, and **`translate-svg`** summaries no longer print prompt-cache token lines.
- **Changed**: Prompts — **`translate-ui`** and **`lint-source`** use a stable system prefix (locale routing + contracts) and a JSON-only user payload; glossary hint lines in **`buildGlossaryBlock`** are sorted for deterministic prefixes.
- **Added**: Dev tooling — **`markdownlint-cli`** with **`pnpm run lint:md`** / **`pnpm run lint:md:fix`**; lints **only non-recursive** **`*.md`** in **`dev/`**, **`docs/`**, the repo root, **`examples/console-app/`**, **`examples/nextjs-app/`**, and **`examples/nextjs-app/docs-site/docs/`** (no markdown in subfolders of those paths); root **`.markdownlint.json`** disables **`MD013`** (line length) for changelog-style prose.
- **Changed**: Dev tooling — **`.markdownlint.json`** allows inline HTML **`<small>`** via **`MD033`** **`allowed_elements`**.
- **Added**: Config — each **`documentations`** block supports optional **`emphasisPlaceholders`** (`true` / `false`) to force markdown emphasis masking on or off for that pipeline; when omitted, **CJK** (`zh`, `ja`, `ko`) and **RTL** locales (built-in RTL primaries plus root **`rtlLocales`**) mask emphasis by default; other locales default off.
- **Added**: CLI — **`translate-docs`** and **`sync`** accept **`--no-emphasis-placeholders`** to disable masking when the locale would otherwise default to on; **`--emphasis-placeholders`** still forces masking for all locales unless **`documentations[].emphasisPlaceholders`** is set.
- **Added**: **`translate-docs`** — per locale, a gray log line when markdown emphasis placeholders are enabled by the automatic CJK/RTL default (also captured in **`--write-logs`** output).
- **Changed**: CLI — **`translate-docs`** / **`sync`** (docs step) prints the same **`📊 Summary`** (tokens, cache vs translated segments, **total cost**) plus **OpenRouter models** and **batch prompt format** after a **fatal** translation error so a failed run still shows spend and configuration; per-locale work is caught so other locales finish and totals include all completed API work before the failure.
- **Added**: `MarkdownExtractor` — optional **`documentations[].segmentSplitting`** (`markdown-segment-split.ts`): split dense paragraphs, GFM pipe tables (first chunk keeps header, separator, and first data row), and long markdown lists; sub-segments use **`Segment.tightJoinPrevious`** so reassembly joins them with single newlines between parts. **`translate-docs`** passes **`segmentSplitting`** when **`enabled`** is **`true`** (default **on** when **`segmentSplitting`** is omitted).
- **Changed**: Config — **`segmentSplitting`** lives at the same level as **`markdownOutput`** inside each **`documentations`** block (not under **`markdownOutput`**); it governs extraction for the whole docs pipeline for that block.
- **Changed**: Config — **`segmentSplitting.enabled`** defaults to **`true`** when the **`segmentSplitting`** object is omitted or partial; set **`"segmentSplitting": { "enabled": false }`** to disable finer-grained segments.
- **Changed**: CLI — subcommand help (e.g. **`ai-i18n-tools help translate-docs`** or **`translate-docs --help`**) includes a **Global Options** section listing the root program flags (`--config`, `--verbose`, `--write-logs`, etc.) **above** that command’s **Options** block (same flags as the main **`ai-i18n-tools --help`** options list).
- **Changed**: CLI — **`statistics`** — default **`--max-columns`** is **6** ( **`status`** remains **9**); prints **UI strings** before **Documentation cache**; model × locale tables use the same chunking pattern as **`status`** (multiple tables + gray locale range labels).
- **Added**: CLI — **`statistics`** — prints documentation-cache and **`strings.json`** aggregates (cards, **By model**, **By model and locale**) matching Translation Cache Editor → **Statistics**; supports **`--max-columns`** for wide locale matrices.
- **Added**: CLI — **`lint-source`** — aggregates OpenRouter **`cost`** across successful batches into **`summary.totalCostUsd`** (JSON and human **`.log`** summary); prints **`Total OpenRouter cost`** on the terminal after the final status line.
- **Changed**: CLI — **`lint-source`** — **`lint-source-results_<timestamp>.log`** is **human-readable** (header, summary with **`ok`** / issue counts, **Issues**, **OK** listings, optional batch errors); machine-readable JSON is written to stdout **only** with **`--json`**. Console prints the same summary line (first), issue blocks, **OK** section, then the results filename on the last line.
- **Changed**: CLI — **`lint-source`** glossary hints use **`glossary.userGlossary`** only (same as **`translate-ui`**); **`uiGlossary`** / **`strings.json`** are not loaded so incorrect catalog copy is not suggested as canonical terminology.
- **Changed**: CLI — **`lint-source`** runs **`extract`** before linting (requires **`features.extractUIStrings`**) so **`strings.json`** is refreshed from source; **`--dry-run`** still performs **`extract`** then skips API calls.
- **Changed**: **`lint-source`** LLM prompts — glossary hints are **violation-only** (no “consistency” warnings when the string already matches); reduced false positives on product/package names such as hyphenated project ids.
- **Changed**: CLI — **`lint-source`** terminal output omits per-string **`[ok]`** listings (summary counts unchanged); **OK** details remain in **`lint-source-results_*.log`** and in **`--json`** stdout.
- **Fixed**: `expandPluralFormsForFlatOutput` — when filling a missing **`many`**, **`few`**, or **`two`** form, try **`other`** before other siblings so compacted Arabic (and similar) plural rows copy the generic counted string instead of **`one`**.
- **Added**: `ai-i18n-tools/runtime` — **`makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoaderForLocale)`** builds the async loader map for **`makeLoadLocale`** from **`ui-languages.json`** (skips **`sourceLocale`** with **`normalizeLocale`**). **`examples/console-app`** and **`examples/nextjs-app`** use it for **`localeLoaders`**.
- **Added**: `ai-i18n-tools/runtime` — **`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })`** combines **`wrapI18nWithKeyTrim`**, optional merge of **`translate-ui`** `{sourceLocale}.json` plural flat keys, and plural-aware **`wrapT`**; **`wrapI18nWithKeyTrim`** is deprecated for application wiring (prefer **`setupKeyAsDefaultT`**). **`examples/console-app`** and **`examples/nextjs-app`** use the new helper.
- **Changed**: `examples/nextjs-app/docs-site/docs/` — **`quick-start.md`** adds Step 7 (Next.js demo, **`?locale=`**, cardinal plurals + README pointer); **`feature-showcase.md`** adds a **Cardinal plural UI strings** section and table / pipeline notes (English sources for Docusaurus).
- **Changed**: `examples/nextjs-app/README.md` — adds **`?locale=`** deep-link note and documents the home page **cardinal plurals** demo (`PLURAL_DEMO_COUNTS`, **`plurals: true`**, runtime helpers, locale JSON outputs).
- **Changed**: `dev/DEVEL.md` — documents optional **`jq`** / **`chromium-headless-shell`** prerequisites and **`pnpm dev`** for **`examples/nextjs-app/scripts/screenshot-locales.sh`**.
- **Added**: `examples/nextjs-app` — `scripts/screenshot-locales.sh` runs **`chromium-headless-shell`** per **`sourceLocale`** plus **`targetLocales`** from `ai-i18n-tools.config.json` (via **`jq`**; source first, deduped) and writes **`images/screenshots/<locale>/screenshot.png`** (expects **`pnpm dev`** at **`http://localhost:3030`** by default).
- **Added**: `examples/nextjs-app` — home page reads **`?locale=`** (BCP-47 codes from `ui-languages.json`), keeps the dropdown and `router` URL in sync, and wraps content in **`Suspense`** for `useSearchParams`.
- **Added**: `translate-ui` — flat locale JSON uses **`expandPluralFormsForFlatOutput`** (`src/core/plural-forms.ts`): for each locale, every plural suffix required by **`Intl.PluralRules`** is written even when `strings.json` dropped a duplicate string after **`compactIdenticalPluralForms`** (e.g. Arabic **`many`** matching **`other`**); cardinal plural prompts include an optional **`Intl.PluralRules`** sample-count line and stress emitting every requested JSON key.
- **Fixed**: CLI — `status` and **`translate-ui`** plural handling use `pluralTranslatedLocaleHasContent` (`src/core/plural-forms.ts`): a plural row counts as translated when `translated[locale]` has non-empty **`other`** and non-empty **`one`** if `Intl.PluralRules` exposes a `one` category for that locale (otherwise **`other`** alone, e.g. Chinese). This avoids treating a single leftover form as “done” and avoids repeat runs that **re-translated every locale** because full CLDR completeness expected extra categories (`many`, etc.). Step 0 uses the same rule unless **`--force`**. Use **`--force`** to regenerate all plural batches.
- **Changed**: ESLint — enables **typed linting** (`typescript-eslint` `recommendedTypeChecked`) with `parserOptions.project` → `tsconfig.eslint.json` so `src/` and `tests/` share one program while build `tsconfig.json` stays `src/`-only; disables a handful of `@typescript-eslint` preset rules (`no-unsafe-*`, `restrict-template-expressions`, etc.) that are prohibitively noisy for this codebase; skips TypeScript under `examples/` (example apps retain their own configs); spreads `disableTypeChecked` for plain JS.
- **Added**: `translate-ui` — logs each completed OpenRouter batch with a green ✔️ line (catalog path, batch range or plural index, string/group counts, and tokens), matching `translate-docs` batch logging; removes the redundant verbose-only “Plain chunk …” pre-flight line for non–dry-run runs.
- **Changed**: CLI — `status` prints **Plain UI strings** and **Plural UI string groups** as separate tables (each with its own total and percentages) so plural-form completeness is not mixed with single-string rows.
- **Added**: `extract` / `translate-ui` — cardinal plural support via `t('…', { plurals: true, zeroDigit?: boolean })`; Babel-AST scan of call options; single-entry plural rows in `strings.json`; Step 0 + Pass A/B in `translate-ui`; suffixed flat JSON (`<id>_original`, `<id>_one`, …) plus `{sourceLocale}.json` for plural keys; runtime **`wrapT`** + **`buildPluralIndexFromStringsJson`**; XLIFF export emits multi-segment units for plural groups; docs in `GETTING_STARTED.md` / `ai-i18n-tools-context.md`.
- **Changed**: root `package.json` — set `pnpm.onlyBuiltDependencies` to include `sharp` (Next’s optional dep in `examples/nextjs-app`); pnpm only honors this list on the workspace root, so the Next example’s manifest alone does not apply.
- **Changed**: `.github/workflows/ci.yml` — bump `actions/checkout` to `v6`, `actions/setup-node` to `v6` (drops deprecated `always-auth` from generated `.npmrc`; aligns action runtime with Node 24), and `pnpm/action-setup` to `v5`; remove `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` now that those actions ship on Node 24; drop `token` on the publish job’s `setup-node` step (`v6` uses `token` only for Node downloads; publish auth stays on `NODE_AUTH_TOKEN`).

---

## [1.1.1] - 2026-04-16

- **Fixed**: `examples/nextjs-app/docs-site` — set `pnpm.onlyBuiltDependencies` to include `core-js` so pnpm v10 runs its postinstall (removes the misleading "run pnpm approve-builds" banner; `approve-builds` from that folder targets the monorepo workspace and often shows no pending packages).
- **Changed**: `scripts/upgrade-dependencies.sh` — runs `npm-check-updates` and `pnpm audit` (with fix pass) for the repo root, `examples/console-app`, `examples/nextjs-app`, and `examples/nextjs-app/docs-site`; preserves `workspace:^` for `ai-i18n-tools` in examples; uses `pnpm install` / `pnpm audit --ignore-workspace` for the nested Docusaurus app; comments explain nested install vs `approve-builds`.
- **Security**: `examples/nextjs-app/docs-site` — raised pnpm overrides so `webpack`, `serialize-javascript`, and `follow-redirects` resolve to patched releases; pin `webpack` to `5.105.0` because `5.106.x` rejects webpackbar’s legacy `ProgressPlugin` options and breaks `docusaurus build`.

---

## [1.1.0] - 2026-04-16

- **Added**: `extract` — `ui.reactExtractor.includeUiLanguageEnglishNames` merges each `englishName` from `ui-languages.json` into `strings.json` when enabled (default off); warns if the manifest path is missing or unreadable.
- **Added**: CLI — `generate-ui-languages` writes `ui-languages.json` from `sourceLocale` + `targetLocales` and bundled `data/ui-languages-complete.json` (override with `--master`); `--dry-run` prints JSON only; requires `uiLanguagesPath` in config; warns and uses `TODO` placeholders for locales absent from the master file.
- **Added**: `data/ui-languages-complete.json` — IANA-derived master catalog (rebuild with `pnpm run build:ui-languages-master`); shipped in the npm package.
- **Added**: `scripts/build-ui-languages-complete.mjs` — fetches the IANA language-subtag-registry and emits the master JSON (2-letter languages plus common `xx-YY` regional rows).
- **Added**: `dev/package-context.md` — maintainer-focused agent context for this repository (not the primary integration doc for downstream apps).
- **Changed**: `scripts/fill-ui-language-labels.mjs` — after each model-returned native `label`, if the first character is a letter (Unicode `\p{L}`), it is uppercased via `toLocaleUpperCase("und")`.
- **Changed**: `build:ui-languages-master` — `scripts/build-ui-languages-complete.mjs` now emits **BCP-47-style** codes (`de-DE`, `pt-BR`) instead of glibc underscores, adds **bare ISO 639** rows (`de`, `fr`, …) for every language subtag in the source list, and deduplicates `@euro` / `@latin` glibc variants that map to the same region; regenerated `data/ui-languages-complete.json`.
- **Changed**: `docs/ai-i18n-tools-context.md` — rewritten for **consumers** integrating the npm package into other projects; maintainer depth moved to `dev/package-context.md`.
- **Changed**: `.cursor/rules/project.mdc` — documentation pointers now prefer `dev/package-context.md` for work inside this repo.
- **Changed**: `README.md`, `docs/GETTING_STARTED.md`, `docs/PACKAGE_OVERVIEW.md` — document full `extract` inputs (`package.json` description, optional manifest `englishName`), fixed `ui-languages.json` shape, and `generate-ui-languages`; human-readable language link labels in the nav; expanded CLI reference and `translationModels` fallback guidance.
- **Added**: CLI — `version` subcommand and global `--version` / `-V` output include an ISO **build timestamp** (`scripts/write-build-info.mjs` runs at the start of `pnpm build` and writes `src/build-info.generated.ts`).
- **Added**: `translate-docs` / `sync` — `--emphasis-placeholders` optionally masks markdown emphasis delimiters before translation (default off); `--debug-failed` writes per-segment `DEBUG-TRANSLATION` and `FAILED-TRANSLATION` detail logs under `cacheDir` during individual-segment retries.
- **Added**: Document placeholder pipeline — allowlisted **HTML tags and comments** masked as `{{HTM_N}}` (`html-tag-placeholders.ts`); leak detection and core rules updated for `HTM` tokens.
- **Added**: Tests — `tests/unit/path-filter.test.ts` for `normalizePathFilterForProjectRoot`, `matchesPathFilter`, and `jsonFileProjectRelativePath`; `tests/unit/html-tag-placeholders.test.ts` for HTML masking.
- **Changed**: Default `--prompt-format` for documentation translation from **`xml`** to **`json-array`** (including the `cleanup` / `sync` translate step defaults).
- **Changed**: Single-segment document prompts — user message is **raw segment text** (no `<translate>` wrapper); system prompt uses `singleSegmentOutputInstruction` instead of `translateFooter`.
- **Changed**: `--path` / `--file` — `-f` is an alias for `-p` (using both throws); filter paths normalized to project-relative POSIX form (rejects paths outside the project root). Scopes **markdown + JSON** under `translate-docs` and `sync`, and **SVG files** under `translate-svg`. **`--emphasis-placeholders`** and **`--debug-failed`** are on **`translate-docs`** and **`sync`**. **`--prompt-format`** is only on **`translate-docs`** (`sync` / `cleanup` use the internal **`json-array`** default for docs, no CLI flag). **`translate-svg`** only gains path scoping (no emphasis, debug, or prompt-format flags).
- **Changed**: `status` — UI string coverage is a **per-locale** table; markdown file × locale tables are **chunked** with `--max-columns <n>` (default 9).
- **Changed**: `config` / `init` defaults — `DEFAULT_OPENROUTER_MODELS` list updated (reordered; adds e.g. `qwen/qwen3-235b-a22b-2507`, Anthropic Haiku variants, `openai/gpt-5.3-codex`, `google/gemini-3-flash-preview`).
- **Changed**: `translate-svg` (and shared doc totals) — summary prints **segment cache hit rate**; reports `segmentValidationFailures` and `individualSegmentTranslations`; quality-retry warnings include fallback position `(k/n)` in the model list.
- **Changed**: `translate-ui-strings` — log line for pending work uses 📄 instead of 🔃.
- **Changed**: `emphasis-placeholders` — delimiter pairing fixes and `applyEmphasisCloserSpacing` when emphasis masking is off so closers stay valid CommonMark near CJK and similar edges.
- **Changed**: `dev/package-context.md` — `translate-docs` default `--prompt-format` noted as `json-array`.

---

## [1.0.0] - 2023-04-14

- **Added**: initial release.

