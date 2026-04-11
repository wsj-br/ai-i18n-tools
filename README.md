# ai-i18n-tools

CLI and programmatic toolkit for internationalising JavaScript/TypeScript applications and documentation sites. Extracts UI strings, translates them with LLMs via OpenRouter, and generates locale-ready JSON files for i18next, plus pipelines for markdown, Docusaurus JSON, and (via `translate-svg`) standalone SVG assets.

## Two core workflows

**Workflow 1 - UI Translation** (React, Next.js, Node.js, any i18next project)

Scans source files for `t("…")` calls, builds a master catalog (`strings.json`), translates missing entries per locale via OpenRouter, and writes flat JSON files (`de.json`, `pt-BR.json`, …) ready for i18next.

**Workflow 2 - Document translation** (Markdown, Docusaurus JSON)

Translates `.md` and `.mdx` from `documentation.contentPaths` and JSON label files from `documentation.jsonSource` when enabled. Supports Docusaurus-style and flat locale-suffixed layouts (`documentation.markdownOutput`). SQLite cache ensures only new or changed segments are sent to the LLM. **SVG:** use `translate-svg` with a top-level `svg` block (also run from `sync` when `svg` is set).

Both workflows share a single config file and can be used independently or together.

---

## Installation

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
npx ai-i18n-tools sync   # extract UI strings, then translate UI strings, optional standalone SVG, then docs
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
                                                    --force-update, --force, --stats, --clear-cache
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (requires config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only
ai-i18n-tools sync                                  Extract UI strings, then UI, optional SVG, then docs
ai-i18n-tools status                                Translation status per file × locale
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>] [-y]   Clean stale + orphaned cache rows; confirms first (see --help); backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

All commands accept `-c <config>` (default: `ai-i18n-tools.config.json`), `-v` (verbose), and optional `-w` / `--write-logs [path]` to append console output to a log file (default: under the translation cache directory).

---

## Documentation

- [Getting Started](docs/GETTING_STARTED.md) - full setup guide for both workflows, all CLI flags, and config field reference.
- [Package Overview](docs/PACKAGE_OVERVIEW.md) - architecture, internals, programmatic API, and extension points.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
