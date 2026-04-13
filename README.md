# ai-i18n-tools

CLI and programmatic toolkit for internationalising JavaScript/TypeScript applications and documentation sites. Extracts UI strings, translates them with LLMs via OpenRouter, and generates locale-ready JSON files for i18next, plus pipelines for markdown, Docusaurus JSON, and (via `features.translateSVG`, `translate-svg`, and the `svg` block) standalone SVG assets.


<small>**Read in other languages:** </small>
<small id="lang-list">[en-GB](./README.md) · [de](./translated-docs/README.de.md) · [es](./translated-docs/README.es.md) · [fr](./translated-docs/README.fr.md) · [hi](./translated-docs/README.hi.md) · [ja](./translated-docs/README.ja.md) · [ko](./translated-docs/README.ko.md) · [pt-BR](./translated-docs/README.pt-BR.md) · [zh-CN](./translated-docs/README.zh-CN.md) · [zh-TW](./translated-docs/README.zh-TW.md)</small>

## Two core workflows

**Workflow 1 - UI Translation** (React, Next.js, Node.js, any i18next project)

Scans source files for `t("…")` calls, builds a master catalog (`strings.json` with optional per-locale **`models`** metadata), translates missing entries per locale via OpenRouter, and writes flat JSON files (`de.json`, `pt-BR.json`, …) ready for i18next.

**Workflow 2 - Document translation** (Markdown, Docusaurus JSON)

Translates `.md` and `.mdx` from each `documentations` block’s `contentPaths` and JSON label files from that block’s `jsonSource` when enabled. Supports Docusaurus-style and flat locale-suffixed layouts per block (`documentations[].markdownOutput`). Shared root `cacheDir` holds the SQLite cache so only new or changed segments are sent to the LLM. **SVG:** enable `features.translateSVG`, add the top-level `svg` block, then use `translate-svg` (also run from `sync` when both are set).

Both workflows share a single `ai-i18n-tools.config.json` file and can be used independently or together. Standalone SVG translation uses `features.translateSVG` plus the top-level `svg` block and runs through `translate-svg` (or the SVG stage inside `sync`).

---

## Installation

The published package is **ESM-only** (`"type": "module"`). Use `import` from Node.js, bundlers, or `import()` — **`require('ai-i18n-tools')` is not supported.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

Set your OpenRouter API key:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Quick start

### Workflow 1 - UI strings

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract t("…") calls from source
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Wire i18next in your app using the helpers from `'ai-i18n-tools/runtime'`:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);
export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

### Workflow 2 - Documentation

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### Both workflows

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

## Runtime helpers

Exported from `'ai-i18n-tools/runtime'` - work in any JS environment, no i18next import required:

| Helper | Description |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | Standard i18next init options for key-as-default setups. |
| `wrapI18nWithKeyTrim(i18n)` | Wrap `i18n.t` so keys are trimmed before lookup. |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Factory for async locale file loading. |
| `getTextDirection(lng)` | Returns `'ltr'` or `'rtl'` for a BCP-47 code. |
| `applyDirection(lng, element?)` | Sets `dir` attribute on `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Display label for a language menu row (with i18n). |
| `getUILanguageLabelNative(lang)` | Display label without calling `t()` (header-style). |
| `interpolateTemplate(str, vars)` | Low-level `{{var}}` substitution on a plain string (used internally; app code should use `t()` instead). |
| `flipUiArrowsForRtl(text, isRtl)` | Flip `→` to `←` for RTL layouts. |

---

## CLI commands

```
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools extract                               Scan source for t("…") calls
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status                                Translation status per file × locale
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

All commands accept `-c <config>` (default: `ai-i18n-tools.config.json`), `-v` (verbose), and optional `-w` / `--write-logs [path]` to append console output to a log file (default: under the translation cache directory).

---

## Documentation

- [Getting Started](docs/GETTING_STARTED.md) - full setup guide for both workflows, all CLI flags, and config field reference.
- [Package Overview](docs/PACKAGE_OVERVIEW.md) - architecture, internals, programmatic API, and extension points.
- [AI Agent Context](docs/ai-i18n-tools-context.md) - concise project context for agents and maintainers making code or config changes.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
