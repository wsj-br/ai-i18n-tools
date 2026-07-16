# ai-i18n-tools 1.8.2 Release Notes

## Highlights

- **Cache cleanup for retired locales:** `cleanup` now drops SQLite cache rows (`translations`, `file_tracking`, `translation_failures`) for locales no longer present in config — so codes like `hi-Latn` stop lingering after a switch to `hi`. Generated documents and flat UI files are unchanged (use `purge-locale` for those).
- **Hindi defaults to Devanagari:** Bare `hi` (and `hi-IN`) now imply Devanagari for script-aware prompts and wrong-script validation, matching explicit `*-Deva` locales; `hi-Latn` still stays Latin.
- **Slimmer GitHub/npm landing:** `README.md` is a concise value-prop / quick-start page; detailed CLI, provider, runtime, and framework content lives under the VitePress `docs/` site.
- **Maintainer tooling tidy-up:** Ad-hoc scripts moved to `dev/scripts/`; orphaned license/scrape leftovers removed; third-party notices and dashboard screenshot capture hardened for hoisted installs and locale-stable docs PNGs.

## Why this release matters

Version 1.8.2 tightens locale lifecycle hygiene — cache rows for removed locales are pruned on `cleanup`, and Hindi script handling is correct out of the box — while keeping the public landing page and maintainer scripts easier to maintain.

## Detailed Changes

- **Fixed**: scripts — `screenshot-translation-dashboard.sh` starts the dashboard with `-L en-GB` so the shared docs PNG stays English regardless of host OS locale / `AI_I18N_LANG`; `dev/DEVEL.md` link updated to `docs/guide/translation-dashboard/`.
- **Fixed**: scripts — `write-third-party-notices.js` falls back to `require.resolve` / top-level `node_modules/<name>` when `pnpm licenses list` reports a virtual-store path that is missing (e.g. `nodeLinker: hoisted`).
- **Removed**: tooling — deleted orphaned root `3p-lic-clarifications.json` (replaced by `scripts/write-third-party-notices.json` since 1.6.1; nothing referenced it).
- **Changed**: scripts — moved ad-hoc maintainer tools to `dev/scripts/` (`validate-ui-language-labels.mjs`, `gen-han-variant-data.mjs`, and their `lib/` helpers). Root `scripts/` keeps package.json-wired build/docs/release helpers, docs asset capture (`screenshot-translation-dashboard.sh`), and the dependency-upgrade stack.
- **Removed**: scripts — deleted obsolete leftovers: `license-checker-custom-format.json`, `lib/load-fill-label-config.mjs`, `unescape-vue-braces-in-docs.mjs`, `eslint-react-peers-allow-eslint10.js`, and `lib/decode-html-entities-ui-languages.mjs` (plus its Vitest file) from the removed Wikimedia UI-languages scrape pipeline.
- **Changed**: docs — slimmed `README.md` to a concise GitHub/npm landing page (value prop, features table, install, quick start, doc links); detailed CLI, provider, runtime, and framework content now lives only under `docs/`. Updated `docs/index.md`, `docs/guide/installation.md`, VitePress README-role note, and `AGENTS.md` accordingly; regenerated `translated-docs/` and locale guide copies.
- **Changed**: cli/cache — `cleanup` now drops SQLite cache rows (`translations`, `file_tracking`, `translation_failures`) for locales absent from config (`sourceLocale`, root `targetLocales`, and any per-block `docs[]` / `json[]` `targetLocales`). New helpers: `getConfiguredCacheLocales` (`src/core/ui-languages.ts`) and `TranslationCache.pruneUnconfiguredLocales` / `listDistinctLocales` (`src/core/cache.ts`). Cache-only — generated documents, flat UI files, and `strings.json` entries are unchanged (use `purge-locale` for those). Fixes retired codes such as `hi-Latn` lingering after a switch to `hi`.
- **Added**: tests/processors — expanded unit coverage for `fumadocs-link-normalize.ts` (absolute/relative rewrites, mailto/protocol-relative/empty hrefs, fragments, `src` attributes, docs-root edge cases) to ~100% lines.
- **Added**: tests/core — expanded unit coverage for `doc-file-tracking.ts` (all key builders, per-prefix `resolveDocTrackingKeyToAbs`, malformed/unrelated keys) to 100% statements/branches/functions/lines.
- **Added**: locale-utils/api — bare `hi` (and `hi-IN`) now imply Devanagari for script-aware translation. New `effectiveScriptSubtag` returns an explicit ISO 15924 subtag when present (`hi-Latn` stays Latin) or the language default (`hi` → `Deva`). Prompt builders prepend the Devanagari `SCRIPT REQUIREMENT` directive, and `LlmClient` rejects wrong non-Latin scripts with model fallback — matching explicit `*-Deva` locales such as `sd-Deva`. Exported from `config` and the package root.

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
