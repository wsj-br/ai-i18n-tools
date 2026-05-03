# ai-i18n-tools 1.2.8 Release Notes

## Highlights

- **OpenRouter and CLI:** New `check-models` command loads your configured translation models, compares them to the live OpenRouter catalog (including pricing in USD per 1M tokens), and exits non-zero when any id is missing or expired. Before translation runs, `sync`, `translate-docs`, `translate-ui`, `translate-svg`, `lint-source`, and `cleanup` fetch the catalog and drop unknown model ids with a clear `[models]` warning (or fail if none remain). Each chat-completion and `GET /models` call respects **`openrouter.requestTimeoutMs`** (default 30s); label helper scripts use the same setting.
- **Translation Cache Editor (web):** If the local server stops, the UI shows a full-page “Editor server unavailable” state with periodic health checks and recovery when the server returns; **Close window** uses primary accent styling. Startup logs no longer duplicate when the HTTP port falls back.
- **Docs and installation:** README, Getting Started, and `dev/DEVEL.md` are aligned with the current CLI, engines, `init` flags, recommended `sync` workflow, and UK spelling where relevant. New guidance covers `npx` / `pnpm exec`, global install, and linking the CLI globally during development (including `pnpm setup` / `ERR_PNPM_NO_GLOBAL_BIN_DIR`).
- **Tooling:** Shared strict `tsconfig.base.json`, production sources with **`noImplicitOverride`**, dedicated **`tsconfig.tests.json`** for Vitest; **`pnpm lint`** runs ESLint then **`pnpm typecheck`** (both `tsconfig.json` and `tsconfig.tests.json`). The CLI binary is **`chmod 0755`** after build so `pnpm i18n:*` works from a fresh clone.


## Why this release matters

You get predictable OpenRouter usage—timeouts, optional model validation before expensive runs, and a dedicated **`check-models`** report—plus a translation editor that degrades and recovers cleanly when the local server restarts. Documentation and TypeScript/ESLint layout match how the package is meant to be installed and extended today.


## Changes

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

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.


---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
