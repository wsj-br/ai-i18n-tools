<a id="programmatic-api"></a>
# Programmatic API

All public types and classes are exported from the package root. Example: running the translate-UI step from Node.js without the CLI:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Scaffold a config from Node.js. The fourth argument is the built-in preset (`cwd` is the third). An optional fifth argument `{ withReadme: true }` appends the flat README docs block when the template does not already list `README.md`, and returns whether that block was added:

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'docsMarkdown', process.cwd(), 'openrouter');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiPython', process.cwd(), 'openrouter', {
  withReadme: true,
});
```

Key exports (commonly used — see `src/index.ts` for the full public surface):

| Export | Description |
|---|---|
| `loadI18nConfigFromFile` | Load, merge, validate config from a JSON file. |
| `parseI18nConfig` | Validate a raw config object. |
| `TranslationCache` | SQLite cache - instantiate with a `cacheDir` path. |
| `UIStringExtractor` | Extract `t("…")` strings from JS/TS source. |
| `collectHtmlI18nStrings` / `markHtmlContent` | Scan / insert `data-i18n*` markers in HTML (powers `extract` for `.html` and the `mark-html` command). |
| `MarkdownExtractor` | Extract translatable segments from markdown. |
| `HtmlTemplateExtractor` | Extract and reassemble plain HTML documents (text and translatable attributes; `src` / `href` stay in place). |
| `JsonExtractor` | Extract from Docusaurus JSON label files (UI catalogs, not MDX body). |
| `SvgExtractor` | Extract from SVG files. |
| `LlmClient` | Make translation requests to the active LLM provider (`OpenRouterClient` is a deprecated alias). |
| `rankProviderModels` / `resolveSuggestionWeights` | Rank one provider's chat catalog with the quality or price profile used by `suggest-models`. Does not print or write the config. |
| `PlaceholderHandler` | Protect/restore markdown syntax around translation (HTML tags, admonitions, anchors, MDX comments/JSX/braces, URLs, inline code, emphasis). |
| `protectMdx` / `restoreMdx` | Protect/restore MDX comments, JSX tags, brace expressions, and JSX string attributes (called by `PlaceholderHandler`; also exported for direct use). |
| `splitTranslatableIntoBatches` | Group segments into LLM-sized batches. |
| `validateTranslation` | Structural checks after translation (**async** — must be awaited). |
| `resolveDocumentationOutputPath` | Resolve output file path for a translated document. |
| `Glossary` / `GlossaryMatcher` | Load and apply translation glossaries, including optional term `Context` notes. |
| `loadTranslationContext` / `computeGuidanceFingerprint` | Load `glossary.contextFiles` and fingerprint guidance for cache invalidation. |
| `runTranslateUI` | Programmatic translate-UI entry point. |
| `writeInitConfigFile` | Write a starter config JSON (`template`, `cwd`, a required `providerKey`, and optional `{ withReadme }`). Returns `{ readmeBlockAdded, hasReadmeBlock }`. |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | Starter `translationModels` per built-in preset used by `init -P`. |
| `PROVIDER_PRESETS` | Built-in provider preset map (`baseUrl`, `apiKeyEnv`). |

<a id="python-runtime"></a>
## Python runtime (`i18n.py`)

`init -t ui-python`, `ui-python-gettext`, and `ui-python-flask` write this module into the project when `i18n.py` is missing. It is a standard-library helper for Python 3.10 or newer. Import it from that file. The functions below are separate from the Node exports in the table above. Django projects keep Django's gettext, so `ui-python-django` does not write `i18n.py`.

Call shapes, unsafe f-strings, and per-framework locale wiring: [Python applications](/guide/ui-strings/python).

| Function | Behaviour |
| --- | --- |
| `set_locale(locale)` | Set the current locale. Underscores in the code are stored as hyphens (`pt_BR` becomes `pt-BR`). Returns a `ContextVar` token. |
| `reset_locale(token)` | Restore the locale from that token. Call it in `finally`, including FastAPI and Flask middleware. |
| `get_locale()` | Return the current locale. |
| `set_backend(backend)` | Select `"auto"`, `"json"`, or `"gettext"`. |
| `get_ui_languages()` | Read `ui-languages.json` next to the flat JSON directory, or the gettext directory when flat output is off. |
| `get_direction(locale=None)` | Return `"rtl"` or `"ltr"` from the manifest row for that locale (current locale when omitted). |
| `_(message)` | Look up one literal, then return the catalog string or the message itself. |
| `t(template, *, plurals=False, count=None, **values)` | Look up the literal, then interpolate. `translate` is the same function. On Python 3.14, `translate(t"Hello, {name}!")` keeps the template and its values. Keyword arguments override values taken from a template string. |
| `ngettext(singular, plural, n, **values)` | Plural lookup, then interpolate. `count` is available to the format string. |
| `pgettext(context, message, **values)` | Context lookup (`msgctxt`, or `context` + U+0004 + the English source in flat JSON), then interpolate. |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Streamlit select box. Writes `st.session_state.locale` and `st.query_params["lang"]`, calls `set_locale`, and returns the chosen code. |
