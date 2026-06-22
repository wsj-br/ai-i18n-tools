# AGENT.md — ai-i18n-tools

Maintainer and AI agent guide for working inside this repository. For integrating the published npm package into another project, read `docs/ai-i18n-tools-context.md` instead.

---

## Project overview

TypeScript (strict) + ESM CLI and library. Node ≥ 22.16, pnpm ≥ 11.0. Automates i18n for JS/TS projects via three composable workflows:

| Workflow | Trigger | Output |
|----------|---------|--------|
| 1 — UI strings | `t("…")` / `i18n.t("…")` in source, or `data-i18n*` markers in `.html` | `strings.json` catalog → flat per-locale JSON |
| 2 — Documents | `.md`, `.mdx`, `.astro` under `docs[]` | Translated pages + optional Docusaurus catalog JSON |
| 3 — Nested JSON | `json[].contentPaths` (Workflow 3 only) | Per-locale `outputPathTemplate` files |

Everything is driven by `ai-i18n-tools.config.json`. Runtime helpers export from `ai-i18n-tools/runtime`. Public programmatic API exports from `src/index.ts`. The LLM transport is provider-agnostic (`LlmClient`): configure providers under `providers` and select one with `provider` (or the global `-P` / `--provider` flag).

The tool also localizes its own UI (CLI help, high-traffic logs/summaries, and the Translation Dashboard). The UI locale resolves from `-L` / `--ui-lang` > `AI_I18N_LANG` > config `uiLanguage` > host OS locale, falling back to the source locale (`en-GB`). The runtime lives in `src/i18n/` and is dogfooded through the package's own extract → `translate-ui` pipeline (`pnpm i18n:self`, driven by `ai-i18n-self.config.json`).

---

## Required reading before any code change

Read `docs/ai-i18n-tools-context.md` before modifying source, tests, examples, or config. Especially:

- `strings.json` is the **extraction cache** (MD5-8 keyed by source string) — it is NOT the runtime bundle.
- English source text is the key in flat locale files (e.g. `de.json`). Never implement `t()` lookup by hash outside `src/runtime/`.
- `translated-docs/` is pipeline output from `translate-docs`. Never hand-edit it unless intentionally refreshing generated artifacts.
- Decision tree: `t()` in source → Workflow 1. Localized pages / Docusaurus catalog → Workflow 2. Standalone nested locale JSON → Workflow 3.

---

## Build and test commands

```bash
pnpm install          # install dependencies
pnpm build            # tsc + asset copy → dist/
pnpm dev              # tsc --watch + asset copy (development)
pnpm test             # vitest run --coverage  (run after code changes)
pnpm lint             # eslint + tsc --noEmit  (run before committing)
pnpm lint:fix         # auto-fix ESLint issues
pnpm format           # prettier --write src/ tests/
pnpm typecheck        # tsc --noEmit (src + tests tsconfigs)
pnpm i18n:self        # regenerate the tool's own UI bundles (src/i18n/locales) via ai-i18n-self.config.json
pnpm clean && pnpm build   # full rebuild from scratch
```

Run `pnpm test` and `pnpm lint` after every behavioral change. The CLI entry is `bin/ai-i18n-tools.mjs` (compiled to `dist/cli/index.js`). When you change user-facing CLI/log/dashboard strings (wrapped in `t()` or `data-i18n*` markers), run `pnpm i18n:self` so `src/i18n/locales/*.json` stay in sync; `pnpm build` then ships them to `dist/i18n/locales`.

---

## Source layout

```
src/
├── index.ts          Public API (all programmatic re-exports)
├── cli/              CLI command implementations (commander)
├── core/             Config, Zod schemas, TranslationCache, output paths, config-migrate
├── extractors/       UIStringExtractor, MarkdownExtractor, JsonExtractor, NestedJsonExtractor, SvgExtractor
├── processors/       PlaceholderHandler, batch splitting, validation, link rewriting, emphasis diagnostics
├── api/              LlmClient — provider-agnostic Vercel AI SDK client with model fallback
├── glossary/         CSV + auto-glossary loading and term matching
├── runtime/          i18next helpers, RTL helpers, display helpers (no i18next import at module level)
├── i18n/             Self-localization runtime (t() + per-locale bundles for the tool's own UI)
├── server/           Express Translation Dashboard (cache / glossary UI)
└── utils/            Logger, hash, .translate-ignore parser, display-width table, .env loader
tests/                Vitest test files (mirror src/ structure)
data/                 Bundled JSON (ui-languages-complete.json; published to npm)
dev/                  Maintainer internals: CHANGELOG.md, DEVEL.md, package-context.md
docs/                 Canonical docs (published to npm)
translated-docs/      Pipeline output — do not hand-edit
examples/             astro-docs, astro-website, console-app, multi-provider, nextjs-app, test-markdown (use the locally-built CLI)
scripts/              Build helpers (chmod, asset copy, release)
```

---

## Code style — project-specific rules

- Use `async/await`; no empty `catch` blocks. Log or rethrow errors explicitly.
- Validate all config and external API shapes with **Zod** (see `src/core/config.ts` for patterns).
- Tests: Vitest `describe` / `it`. No default exports in test files. Mock only at boundaries (no deep mocking of internal modules).
- Imports at the top of every file — never inline in function bodies.
- Exhaustive `switch` over discriminated unions: add a `never` check in the `default` case.
- Never bold inline code (`**\`code\`**` is forbidden) — use plain `` `code` `` spans only.
- Never bold links (`**[text](url)**` is forbidden) — use plain `[text](url)`.

---

## Critical invariants — never violate

- `strings.json` keys are MD5-8 hex hashes of the source string. Never rename them.
- `sourceLocale` in config must exactly match `SOURCE_LOCALE` exported from the consumer app's i18n bootstrap.
- Do not implement `t()` key-as-hash lookup outside `src/runtime/`. The runtime uses source-string keys at runtime (key-as-default model).
- Docusaurus catalog JSON (`{ message, description }` shape) goes through Workflow 2 (`docs[].docusaurusCatalogDir`), not Workflow 3 (`json[]`).
- Flat locale files (`de.json`, etc.) are fully regenerated by `translate-ui` — never edit them manually.
- `translated-docs/` is generated output. Treat it like a build artifact.

---

## CHANGELOG — required for every behavioral change

After any behavioral change, bug fix, config/schema change, or dependency update, add a bullet under `## [Unreleased]` in `dev/CHANGELOG.md` **in the same edit session** as the code.

Format: `- **{Type}**: {scope} - description.` Types: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. Use backticks for identifiers. One bullet per logical change.

Skip only for documentation-only or comment-only edits with no user-visible effect.

---

## Patterns to follow — search before guessing

- Config loading and Zod schemas: `src/core/config.ts`
- Cache access: `src/core/cache.ts` (`TranslationCache`)
- Adding a CLI command: follow an existing command in `src/cli/`; register in `src/cli/index.ts`
- Adding an extractor: extend `BaseExtractor` from `src/extractors/base-extractor.ts`
- LLM calls: use `LlmClient` from `src/api/llm-client.ts` — do not add new HTTP clients
- New user-facing CLI/log/dashboard prose: wrap in `t()` (or `data-i18n*` for dashboard HTML), keyed by the English source string; UI-locale resolution is `resolveUiLocale` (`src/core/ui-locale.ts`) and the runtime is `src/i18n/index.ts`. Then run `pnpm i18n:self`. Leave dynamic tokens (paths, model ids, locales) and `e.message` strings untranslated.
- Config migration for renamed fields: `src/core/config-migrate.ts`

Prefer `rg` (ripgrep) to locate symbols before assuming file locations.

---

## Files to never modify

- `translated-docs/` — pipeline output; run `translate-docs` instead.
- `data/ui-languages-complete.json` — hand-maintained master list; edit only intentionally (the build copies it to the runtime via `scripts/copy-runtime-ui-languages-json.mjs`).
- `src/i18n/locales/*.json` — the tool's own UI bundles; regenerated by `pnpm i18n:self` (extract → `translate-ui` against `ai-i18n-self.config.json`), not hand-edited.
- `dist/` — build output; regenerated by `pnpm build`.
- `.env` files — never read or commit secrets.
