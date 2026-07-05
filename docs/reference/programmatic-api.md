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

Key exports (commonly used — see `src/index.ts` for the full public surface):

| Export | Description |
|---|---|
| `loadI18nConfigFromFile` | Load, merge, validate config from a JSON file. |
| `parseI18nConfig` | Validate a raw config object. |
| `TranslationCache` | SQLite cache - instantiate with a `cacheDir` path. |
| `UIStringExtractor` | Extract `t("…")` strings from JS/TS source. |
| `collectHtmlI18nStrings` / `markHtmlContent` | Scan / insert `data-i18n*` markers in HTML (powers `extract` for `.html` and the `mark-html` command). |
| `MarkdownExtractor` | Extract translatable segments from markdown. |
| `JsonExtractor` | Extract from Docusaurus JSON label files (UI catalogs, not MDX body). |
| `SvgExtractor` | Extract from SVG files. |
| `LlmClient` | Make translation requests to the active LLM provider (`OpenRouterClient` is a deprecated alias). |
| `PlaceholderHandler` | Protect/restore markdown syntax around translation (HTML tags, admonitions, anchors, MDX comments/JSX/braces, URLs, inline code, emphasis). |
| `protectMdx` / `restoreMdx` | Protect/restore MDX comments, JSX tags, brace expressions, and JSX string attributes (called by `PlaceholderHandler`; also exported for direct use). |
| `splitTranslatableIntoBatches` | Group segments into LLM-sized batches. |
| `validateTranslation` | Structural checks after translation (**async** — must be awaited). |
| `resolveDocumentationOutputPath` | Resolve output file path for a translated document. |
| `Glossary` / `GlossaryMatcher` | Load and apply translation glossaries. |
| `runTranslateUI` | Programmatic translate-UI entry point. |
| `PROVIDER_PRESETS` | Built-in provider preset map (`baseUrl`, `apiKeyEnv`). |
