<a id="programmatic-api"></a>
# Programmatic API

Sabhi public types aur classes package root se export kiye jaate hain. Udaharan: CLI ke bina Node.js se translate-UI step chalana:

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

Mukhya exports (aam taur par upyog kiye jaate hain — poore public surface ke liye `src/index.ts` dekhen):

| Export | Vivaran |
|---|---|
| `loadI18nConfigFromFile` | JSON file se config load, merge, validate karen. |
| `parseI18nConfig` | Ek raw config object ko validate karen. |
| `TranslationCache` | SQLite cache - `cacheDir` path ke saath instantiate karen. |
| `UIStringExtractor` | JS/TS source se `t("…")` strings extract karen. |
| `collectHtmlI18nStrings` / `markHtmlContent` | HTML mein `data-i18n*` markers ko scan / insert karein (`extract` ko `.html` aur `mark-html` command ke liye power karta hai). |
| `MarkdownExtractor` | Markdown se anuvadit hone yogya khand nikalein. |
| `JsonExtractor` | Docusaurus JSON label files (UI catalogs, MDX body nahi) se nikalein. |
| `SvgExtractor` | SVG files se nikalein. |
| `LlmClient` | Sakriya LLM pradata ko anuvad anurodh bhejien (`OpenRouterClient` ek aprachalit upnaam hai). |
| `PlaceholderHandler` | Anuvad ke aas-paas markdown syntax (HTML tags, admonitions, anchors, MDX comments/JSX/braces, URLs, inline code, emphasis) ko surakshit/bahal karein. |
| `protectMdx` / `restoreMdx` | MDX comments, JSX tags, brace expressions, aur JSX string attributes ko surakshit/bahal karein (`PlaceholderHandler` dwara call kiya gaya; seedhe upyog ke liye bhi export kiya gaya). |
| `splitTranslatableIntoBatches` | Khandon ko LLM-aakar ke batches mein samoohit karein. |
| `validateTranslation` | Translation ke baad structural checks (**async** — iska intezaar karna hoga). |
| `resolveDocumentationOutputPath` | Anuvadit dastavez ke liye output file path hal karein. |
| `Glossary` / `GlossaryMatcher` | Anuvad shabdavaliyon ko load aur lagu karein. |
| `runTranslateUI` | Programmatic translate-UI entry point. |
| `PROVIDER_PRESETS` | Built-in provider preset map (`baseUrl`, `apiKeyEnv`). |
