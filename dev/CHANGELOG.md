<!-- DOCTOC SKIP -->

# Changelog

All notable changes to this project will be documented in this file.

Use conventional types (**Added**, **Changed**, **Fixed**, etc.), a short **scope** (subsystem or UI area), and a clear description—see `.cursor/rules/project.mdc` (CHANGELOG section) for the full bullet pattern. 

Add new entries in the `## [Unreleased]` section. When releasing a new version, move all entries in "[Unreleased]" to a new entry `## [x.y.z] - YYYY-MM-DD`. 


## [Unreleased]

- **Changed**: root `package.json` — set `pnpm.onlyBuiltDependencies` to include `sharp` (Next’s optional dep in `examples/nextjs-app`); pnpm only honors this list on the workspace root, so the Next example’s manifest alone does not apply.
- **Changed**: `.github/workflows/ci.yml` — bump `actions/checkout` to `v6`, `actions/setup-node` to `v6` (drops deprecated `always-auth` from generated `.npmrc`; aligns action runtime with Node 24), and `pnpm/action-setup` to `v5`; remove `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` now that those actions ship on Node 24; drop `token` on the publish job’s `setup-node` step (`v6` uses `token` only for Node downloads; publish auth stays on `NODE_AUTH_TOKEN`).
- **Fixed**: `examples/nextjs-app/docs-site` — set `pnpm.onlyBuiltDependencies` to include `core-js` so pnpm v10 runs its postinstall (removes the misleading "run pnpm approve-builds" banner; `approve-builds` from that folder targets the monorepo workspace and often shows no pending packages).
- **Changed**: `scripts/upgrade-dependencies.sh` — runs `npm-check-updates` and `pnpm audit` (with fix pass) for the repo root, `examples/console-app`, `examples/nextjs-app`, and `examples/nextjs-app/docs-site`; preserves `workspace:^` for `ai-i18n-tools` in examples; uses `pnpm install` / `pnpm audit --ignore-workspace` for the nested Docusaurus app; comments explain nested install vs `approve-builds`.
- **Security**: `examples/nextjs-app/docs-site` — raised pnpm overrides so `webpack`, `serialize-javascript`, and `follow-redirects` resolve to patched releases; pin `webpack` to `5.105.0` because `5.106.x` rejects webpackbar’s legacy `ProgressPlugin` options and breaks `docusaurus build`.

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
- **Changed**: `--path` / `--file` — `-f` is an alias for `-p` (using both throws); filter paths normalized to project-relative POSIX form (rejects paths outside the project root). Scopes **markdown + JSON** under `translate-docs` and `sync`, and **SVG assets** under `translate-svg`. **`--emphasis-placeholders`** and **`--debug-failed`** are on **`translate-docs`** and **`sync`**. **`--prompt-format`** is only on **`translate-docs`** (`sync` / `cleanup` use the internal **`json-array`** default for docs, no CLI flag). **`translate-svg`** only gains path scoping (no emphasis, debug, or prompt-format flags).
- **Changed**: `status` — UI string coverage is a **per-locale** table; markdown file × locale tables are **chunked** with `--max-columns <n>` (default 9).
- **Changed**: `config` / `init` defaults — `DEFAULT_OPENROUTER_MODELS` list updated (reordered; adds e.g. `qwen/qwen3-235b-a22b-2507`, Anthropic Haiku variants, `openai/gpt-5.3-codex`, `google/gemini-3-flash-preview`).
- **Changed**: `translate-svg` (and shared doc totals) — summary prints **segment cache hit rate**; reports `segmentValidationFailures` and `individualSegmentTranslations`; quality-retry warnings include fallback position `(k/n)` in the model list.
- **Changed**: `translate-ui-strings` — log line for pending work uses 📄 instead of 🔃.
- **Changed**: `emphasis-placeholders` — delimiter pairing fixes and `applyEmphasisCloserSpacing` when emphasis masking is off so closers stay valid CommonMark near CJK and similar edges.
- **Changed**: `dev/package-context.md` — `translate-docs` default `--prompt-format` noted as `json-array`.


## [1.0.0] - 2023-04-14

- **Added**: initial release.

