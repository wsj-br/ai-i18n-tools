# v1.0.0 — Initial Release

Unified internationalization toolkit for JavaScript/TypeScript projects and documentation sites, powered by LLM translation via OpenRouter.

---

## Highlights

- **Two independent workflows** — UI string extraction + translation, and document translation — driven by a single config file (`ai-i18n-tools.config.json`).
- **Segment-level SQLite cache** for documents — only new or changed content is sent to the LLM, keeping costs low and runs fast.
- **Model fallback chain** — configure multiple OpenRouter models; the client automatically retries the next model on failure or rate-limit.
- **Runtime helpers** ship as a separate export (`ai-i18n-tools/runtime`) with zero i18next peer dependency.

---

## Features

### UI String Translation (Workflow 1)

- Scan JS/TS source files for `t("…")` and `i18n.t("…")` calls via i18next-scanner.
- Master catalog (`strings.json`) with per-locale translation and model metadata.
- Flat per-locale JSON output (`de.json`, `pt-BR.json`, …) ready for i18next.
- `--force`, `--dry-run`, and `--locale` flags for fine-grained control.
- Optional `ui.preferredModel` to prioritize a specific model for UI strings.
- XLIFF 2.0 export via `export-ui-xliff`.

### Document Translation (Workflow 2)

- Translate `.md`, `.mdx`, and Docusaurus JSON label files.
- Segment-level SHA-256 caching in SQLite — unchanged segments are never re-translated.
- Multiple output styles: `nested`, `docusaurus`, `flat`, or custom `pathTemplate`.
- Automatic link rewriting for flat-style output.
- Placeholder protection for URLs, admonitions, anchors, and code blocks.
- Post-translation structural validation.
- `--force-update` (rebuild outputs, keep cache) and `--force` (full re-translation) modes.

### SVG Translation

- Standalone SVG asset translation via `translate-svg` command.
- Enabled through `features.translateSVG` + top-level `svg` config block.
- Integrated into the `sync` pipeline.

### CLI Commands

| Command | Description |
|---|---|
| `init` | Generate a starter config (`ui-markdown` or `ui-docusaurus` templates) |
| `extract` | Scan source for `t("…")` calls |
| `translate-ui` | Translate UI strings |
| `translate-docs` | Translate markdown and JSON documentation |
| `translate-svg` | Translate SVG assets |
| `sync` | Run extract → translate-ui → translate-svg → translate-docs |
| `status` | Translation coverage per file × locale |
| `editor` | Local web editor for cache, strings, and glossary |
| `cleanup` | Maintain SQLite cache (prune stale/orphaned rows) |
| `export-ui-xliff` | Export UI strings to XLIFF 2.0 |
| `glossary-generate` | Create empty glossary CSV template |

### Runtime Helpers (`ai-i18n-tools/runtime`)

- `defaultI18nInitOptions` — standard i18next init for key-as-default setups.
- `wrapI18nWithKeyTrim` — trim keys and apply `{{var}}` interpolation for source locale.
- `makeLoadLocale` — factory for async locale loading.
- `getTextDirection` / `applyDirection` — RTL detection and `dir` attribute management.
- `getUILanguageLabel` / `getUILanguageLabelNative` — language picker display helpers.
- `flipUiArrowsForRtl` — flip directional arrows for RTL layouts.

### Glossary Support

- Auto-built glossary from `strings.json` translations.
- User-managed CSV glossary for term overrides.
- Glossary hints injected into LLM system prompts.

### Programmatic API

Public exports from `ai-i18n-tools` for use in build scripts and CI pipelines:

- Config loading and validation (`loadI18nConfigFromFile`, `parseI18nConfig`)
- Extractors (`UIStringExtractor`, `MarkdownExtractor`, `JsonExtractor`, `SvgExtractor`)
- Translation pipeline (`OpenRouterClient`, `PlaceholderHandler`, `splitTranslatableIntoBatches`, `validateTranslation`)
- Cache and glossary (`TranslationCache`, `Glossary`, `GlossaryMatcher`)

---

## Requirements

- **Node.js** >= 22.16.0
- **pnpm** >= 10.33.0 (for development)
- **OpenRouter API key** (`OPENROUTER_API_KEY` environment variable)

---

## Installation

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

---

## Documentation

- [Getting Started](docs/GETTING_STARTED.md) — full setup guide, all CLI flags, and config reference.
- [Package Overview](docs/PACKAGE_OVERVIEW.md) — architecture, internals, and extension points.
- [AI Agent Context](docs/ai-i18n-tools-context.md) — concise project context for agents and maintainers.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
