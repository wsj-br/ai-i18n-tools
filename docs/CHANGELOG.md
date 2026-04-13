<!-- DOCTOC SKIP -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Use conventional types (Added, Changed, Fixed, etc.) and short descriptions.

## Unreleased

### Changed

- Renamed documentation block config field `injectTranslationMetadata` to `addFrontmatter`.

- `cleanup` now runs `sync --force-update` before pruning the SQLite cache (no interactive confirmation).

### Added

- Optional `ui.preferredModel`: `translate-ui` tries this OpenRouter model id before `openrouter.translationModels` (see [Getting Started](./GETTING_STARTED.md#ui)).
