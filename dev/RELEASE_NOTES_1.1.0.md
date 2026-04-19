# v1.1.0 — UI languages, document translation polish, and CLI improvements

This release adds **UI language metadata** generation and optional English names in extraction, improves **document translation** (HTML placeholder masking, emphasis handling, debug tooling), refines **path filtering** and **status** output, and ships **version/build metadata** in the CLI. Documentation is split more clearly between **package consumers** and **this repository’s maintainers**.

For the authoritative per-change list, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/v1.1.0/dev/CHANGELOG.md) (`## [1.1.0] - 2026-04-16`).

---

## Highlights

- **`generate-ui-languages`** — writes `ui-languages.json` from `sourceLocale` + `targetLocales` using the shipped IANA-derived master catalog (`data/ui-languages-complete.json`), with optional `--master` and `--dry-run`.
- **Optional English names in `extract`** — `ui.reactExtractor.includeUiLanguageEnglishNames` merges `englishName` values from `ui-languages.json` into `strings.json` when enabled (default off).
- **Document translation** — allowlisted HTML tags/comments masked as stable placeholders; optional `--emphasis-placeholders` and `--debug-failed` on `translate-docs` and `sync`.
- **Defaults** — documentation translation now defaults to **`json-array`** prompts (was `xml`); single-segment prompts use raw segment text in the user message.
- **`--version` / `version`** — includes an ISO **build timestamp** (written during `pnpm build`).

---

## Upgrade notes

- **Documentation prompt format**: the default `--prompt-format` for document translation is now **`json-array`** (including the translate step used by `sync` / `cleanup`). If you relied on **`xml`**, pass `--prompt-format xml` explicitly on `translate-docs` where you need the old behavior. `sync` / `cleanup` do not expose a CLI flag for this; they use the internal **`json-array`** default for docs.
- **Path filters**: `--path` / `--file` paths are normalized to **project-relative POSIX** form; paths outside the project root are rejected. `-f` is an alias for `-p` (using both is an error). Scoping applies to **markdown + JSON** in `translate-docs` / `sync`, and **SVG** in `translate-svg`.

---

## Added

### UI languages

- **`generate-ui-languages`** CLI — builds `ui-languages.json`; requires `uiLanguagesPath` in config; warns and uses `TODO` for locales missing from the master file.
- **`data/ui-languages-complete.json`** — IANA-derived master list (BCP-47-style codes such as `de-DE`, `pt-BR`, plus bare ISO 639 rows); rebuild via `pnpm run build:ui-languages-master`.
- **`extract`** — optional `ui.reactExtractor.includeUiLanguageEnglishNames` to pull `englishName` from `ui-languages.json` into `strings.json`.

### Document translation and quality

- **`--emphasis-placeholders`** — optionally masks markdown emphasis delimiters before translation (default off) on **`translate-docs`** and **`sync`**.
- **`--debug-failed`** — during per-segment retries, writes `DEBUG-TRANSLATION` / `FAILED-TRANSLATION` detail logs under `cacheDir` on **`translate-docs`** and **`sync`**.
- **HTML tag/comment placeholders** — allowlisted HTML masked as `{{HTM_N}}` with leak detection and updated core rules.

### Tooling and docs

- **Build info** — `scripts/write-build-info.mjs` at the start of `pnpm build` writes `src/build-info.generated.ts` for version output.
- **`dev/package-context.md`** — maintainer-focused context for work in this repo (not the primary downstream integration doc).
- **Tests** — `path-filter` and `html-tag-placeholders` unit coverage.

---

## Changed

- **Single-segment document prompts** — user message is **raw segment text** (no `<translate>` wrapper); system prompt uses `singleSegmentOutputInstruction` instead of `translateFooter`.
- **`status`** — UI string coverage is **per-locale**; markdown file × locale tables are **chunked** with **`--max-columns <n>`** (default 9).
- `translate-svg` **/ shared doc totals** — summary includes **segment cache hit rate**; reports `segmentValidationFailures` and `individualSegmentTranslations`; quality-retry warnings show fallback position `(k/n)` in the model list.
- **Default OpenRouter models** — `DEFAULT_OPENROUTER_MODELS` updated (reordered; adds newer/alternate models such as Qwen 3 235B, Anthropic Haiku variants, GPT-5.3 Codex, Gemini 3 Flash preview).
- **`translate-ui-strings`** — pending-work log line uses 📄 instead of 🔃.
- **`scripts/fill-ui-language-labels.mjs`** — uppercases the first character of model-returned native labels when it is a Unicode letter (`\p{L}`), via `toLocaleUpperCase("und")`.
- **Emphasis handling** — delimiter pairing fixes and `applyEmphasisCloserSpacing` when emphasis masking is off (CommonMark edge cases near CJK and similar).
- **Consumer docs** — `docs/ai-i18n-tools-context.md` rewritten for **downstream** use; maintainer depth lives in `dev/package-context.md`. README and getting-started / package overview updated for new CLI flags, `extract` inputs, `ui-languages.json` shape, and `translationModels` fallback guidance.

---

## Requirements

- **Node.js** >= 22.16.0  
- **pnpm** >= 10.33.0 (for developing this package)  
- **OpenRouter API key** (`OPENROUTER_API_KEY`)

---

## Installation

```bash
npm install ai-i18n-tools@1.1.0
# or
pnpm add ai-i18n-tools@1.1.0
```

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/v1.1.0/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/v1.1.0/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/v1.1.0/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
