<!-- DOCTOC SKIP -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Use conventional types (**Added**, **Changed**, **Fixed**, etc.), a short **scope** (subsystem or UI area), and a clear description—see `.cursor/rules/project.mdc` (CHANGELOG section) for the full bullet pattern.

## Unreleased

### Changed

- **Changed**: `scripts/fill-ui-language-labels.mjs` — after each model-returned native `label`, if the first character is a letter (Unicode `\p{L}`), it is uppercased via `toLocaleUpperCase("und")`.
- **Changed**: `build:ui-languages-master` — `scripts/build-ui-languages-complete.mjs` now emits **BCP-47-style** codes (`de-DE`, `pt-BR`) instead of glibc underscores, adds **bare ISO 639** rows (`de`, `fr`, …) for every language subtag in the source list, and deduplicates `@euro` / `@latin` glibc variants that map to the same region; regenerated `data/ui-languages-complete.json`.

## [1.1.0] - 2026-04-13

### Added

- **Added**: `extract` — `ui.reactExtractor.includeUiLanguageEnglishNames` merges each `englishName` from `ui-languages.json` into `strings.json` when enabled (default off); warns if the manifest path is missing or unreadable.
- **Added**: CLI — `generate-ui-languages` writes `ui-languages.json` from `sourceLocale` + `targetLocales` and bundled `data/ui-languages-complete.json` (override with `--master`); `--dry-run` prints JSON only; requires `uiLanguagesPath` in config; warns and uses `TODO` placeholders for locales absent from the master file.
- **Added**: `data/ui-languages-complete.json` — IANA-derived master catalog (rebuild with `pnpm run build:ui-languages-master`); shipped in the npm package.
- **Added**: `scripts/build-ui-languages-complete.mjs` — fetches the IANA language-subtag-registry and emits the master JSON (2-letter languages plus common `xx-YY` regional rows).
- **Added**: `dev/package-context.md` — maintainer-focused agent context for this repository (not the primary integration doc for downstream apps).

### Changed

- **Changed**: `docs/ai-i18n-tools-context.md` — rewritten for **consumers** integrating the npm package into other projects; maintainer depth moved to `dev/package-context.md`.
- **Changed**: `.cursor/rules/project.mdc` — documentation pointers now prefer `dev/package-context.md` for work inside this repo.
- **Changed**: `README.md`, `docs/GETTING_STARTED.md`, `docs/PACKAGE_OVERVIEW.md` — document full `extract` inputs (`package.json` description, optional manifest `englishName`), fixed `ui-languages.json` shape, and `generate-ui-languages`.
