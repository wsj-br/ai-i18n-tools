# Getting Started with ai-i18n-tools

This guide will help you get started with the unified i18n tools package. **All docs:** [Documentation home](./README.md).

## Installation

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

## Quick Start (5 minutes)

### 1. Initialize Configuration

```bash
# Default: UI extraction/translation + markdown under app paths
npx ai-i18n-tools init

# Or: UI extraction + Docusaurus-style docs (markdown, JSON, SVG under i18n/)
npx ai-i18n-tools init -t ui-docusaurus
```

This writes `ai-i18n-tools.config.json` (or the path you pass with `-o`). Templates:

- **`ui-markdown`** (default) — UI strings + markdown in your app tree; `targetLocales` is typically a path to `ui-languages.json`.
- **`ui-docusaurus`** — same engine with paths aimed at a Docusaurus-style layout; `targetLocales` may be that manifest path **or** a locale array — both are valid (see [README](../README.md) use cases).

### 2. Set API Key

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Or create a `.env` file:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 3. Extract Strings

```bash
npx ai-i18n-tools extract
```

This scans your source files and extracts translatable strings.

### 4. Translate

```bash
npx ai-i18n-tools translate
```

This translates all extracted strings to your target locales.

### 5. Check Status

```bash
npx ai-i18n-tools status
```

See which files are translated, outdated, or missing.

## Configuration Examples

The config file has a **shared root** (locales, OpenRouter, `features`, `glossary`) and two path namespaces:

- **`ui`** — where to scan for `t()` / `i18n.t()`, where **`strings.json`** lives, and where flat **`de.json`**, **`pt-BR.json`**, … are written.
- **`documentation`** — markdown / MDX / SVG roots, translated output base, Docusaurus **`jsonSource`**, cache dir, and **`markdownOutput`** (layout style, optional path templates).

### For React Apps

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",
  "openrouter": {
    "baseUrl": "https://openrouter.ai/api/v1",
    "translationModels": [
      "qwen/qwen3-235b-a22b-2507",
      "stepfun/step-3.5-flash:free",
      "anthropic/claude-3.5-haiku"
    ],
    "maxTokens": 8192,
    "temperature": 0.2
  },
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "documentation": {
    "contentPaths": [],
    "outputDir": "./i18n",
    "cacheDir": ".translation-cache"
  }
}
```

For **React** apps, set **`targetLocales`** to a **string** path to **`ui-languages.json`** (same file your UI imports). On load it is expanded to locale codes; **`uiLanguagesPath`** is set automatically. If you also translate **markdown**, list those roots under **`documentation.contentPaths`**; targets still come from the same manifest when **`targetLocales`** is the file path.

Set **`translateUIStrings`** to run **`translate-ui`** (or the UI step inside **`translate`** / **`sync`**) after **`extract`**.

#### `targetLocales`: string path vs locale array

- **String** — path to **`ui-languages.json`**. After normalization it is treated like a one-element list; if it **ends with `.json`** or **contains `/` or `\\`**, the file is loaded and **`targetLocales`** becomes the list of **`code`** values (excluding **`sourceLocale`**). A string such as **`"de"`** (no `.json`, no path separator) stays a single locale code.
- **Array** — explicit locale codes, e.g. **`["de", "fr", "es"]`**, for docs-only setups or when you do not use a manifest. You can still use a **one-element array** with a manifest path (e.g. **`["src/locales/ui-languages.json"]`**) for the same behavior as the string form.

#### `documentation.targetLocales` (optional, docs only)

Root **`targetLocales`** drives **`translate-ui`** and the default set for markdown / JSON / SVG when you do **not** override docs.

Set **`documentation.targetLocales`** when the **app** ships more languages than you want for **documentation** — e.g. UI in 10 locales, docs only in 5. Same formats as root: **locale array**, or a **single path** to a `ui-languages.json`-shaped manifest (expanded at load; does **not** change **`uiLanguagesPath`**).

- **`translate`**, **`sync`** (doc steps), and **`status`** (markdown) use **`documentation.targetLocales`** when it is non-empty; otherwise they use root **`targetLocales`**.
- **`--locale`** for those commands is intersected with that documentation list (not with the full UI list when a doc override exists).
- **`translate-ui`** and the **`edit`** web UI still follow root **`targetLocales`** / manifest rules.

If you enable doc translation with **no** root **`targetLocales`**, you must set non-empty **`documentation.targetLocales`** (docs-only projects).

Manifest shape: JSON array of **`{ "code", "label", "englishName" }`** (all three required on each object):

- **`code`**: BCP-47 locale id (e.g. `de`, `pt-BR`).
- **`label`**: the language name **in that language** (what users see in the menu), e.g. `Deutsch`, `日本語` — not necessarily English.
- **`englishName`**: a clear English (or Latin-script) name for LLM prompts, **`localeDisplayNames`**, and **`t(englishName)`** in dropdowns; must be a non-empty string. If it equals **`label`** (e.g. `English (UK)`), helpers show a single string.

Example **`ui-languages.json`** (trim or extend for your app; **`code`** uses BCP-47, e.g. **`pt-BR`** not `pt_BR`):

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "en-US", "label": "English (US)", "englishName": "English (US)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "es", "label": "Español", "englishName": "Spanish" },
  { "code": "fr", "label": "Français", "englishName": "French" },
  { "code": "de", "label": "Deutsch", "englishName": "German" },
  { "code": "zh-CN", "label": "简体中文", "englishName": "Chinese (CN)" },
  { "code": "uk", "label": "Українська", "englishName": "Ukrainian" }
]
```

Set **`sourceLocale`** in config to one of these codes (often **`en-GB`** or **`en-US`**); other entries are default translation targets for UI and (unless you set **`documentation.targetLocales`**) for docs.

**Why a JSON array (not a map)?** For UI work you almost always want **one ordered list** you can import and map straight into a `<select>`, menu, or settings screen. Arrays preserve **display order** (e.g. English first, then alphabetical in English, or regional grouping). An object keyed by locale is fine for **lookup by code** only, but sort order is awkward unless you add a separate `order` field or maintain a parallel array anyway. That is why this package (and Transrewrt’s **`ui-languages.json`**) standardizes on an **array of entries**: same file for the **renderer** and for **`targetLocales`** / **`translate-ui`**, with no second source of truth.

#### Using the list in the UI (dropdown / menu)

Import the **same** JSON your config points at (e.g. `src/renderer/locales/ui-languages.json`). Enable JSON imports in TypeScript if needed (`resolveJsonModule` in `tsconfig.json`).

**react-i18next + extract:** follow the same rules as Transrewrt’s **`dev/i18n.md`** (*Dropdowns and option lists*) and project guidance for option lists:

- Build per-row display strings in **`useMemo`** when the factory calls **`t()`**, with **`[t]`** so rows refresh after **`changeLanguage`**.
- Transrewrt does **not** pass the native **`label`** through **`t()`** (it is already the name in that language). For **settings / content-language** dropdowns it uses **`englishName`** with **`t(englishName)`** so the UI can show a translated language name when the interface locale is not English; see **`getUILanguageLabel`** below. For the **header globe** menu it uses **`getUILanguageLabelNative`**: **`englishName / label`** when they differ (e.g. `German / Deutsch`), with **no** **`t()`** on the row text.

**Display helpers** — this package exports the same behavior as Transrewrt’s **`languageDisplay.js`**: **`getUILanguageLabel`**, **`getUILanguageLabelNative`** (import from **`ai-i18n-tools`**). They take a manifest row shaped like **`UiLanguageEntry`** (`code`, `label`, **`englishName`**).

- **`getUILanguageLabel(lang, t)`** — **`t(englishName)`**; if the translation equals **`englishName`**, show that only; otherwise **`englishName / translated`** (e.g. `German / Deutsch` when `de` UI translates “German”).
- **`getUILanguageLabelNative(lang)`** — **`englishName / label`** when different, else a single string (header-style, no i18n on the row).

**Native `<select>` (React + i18next)** — **`value` / `onChange`** use **`code`**; option text uses **`getUILanguageLabel`** so both **English name** and **native `label`** appear in the familiar Transrewrt shape:

```tsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from "ai-i18n-tools";
import uiLanguages from "../locales/ui-languages.json";

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (localeCode: string) => void;
}) {
  const { t } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        displayText: getUILanguageLabel(lang, t),
      })),
    [t]
  );

  return (
    <label>
      {t("Language")}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t("Language")}
      >
        {options.map((row) => (
          <option key={row.code} value={row.code}>
            {row.displayText}
          </option>
        ))}
      </select>
    </label>
  );
}
```

Use **`getUILanguageLabelNative`** instead of **`getUILanguageLabel`** when you want the row to show **`Portuguese (BR) / Português (BR)`**-style text without calling **`t()`** on each line (Transrewrt’s **header** language grid).

If you add synthetic rows (e.g. “System default”), build them **inside** the same **`useMemo`** factory and extend the dependency array if needed.

**Menu / list UI (e.g. Fluent `MenuList`, MUI `MenuItem`)** — derive **`options`** in **`useMemo`** with **`[t]`** when using **`getUILanguageLabel`**; render **`row.displayText`** or call **`getUILanguageLabelNative(lang)`** for header-style menus; on activate, pass **`lang.code`** to **`onChange`**. Chrome strings such as **`t("Interface language")`** stay separate literals.

**Interpolation (`{{…}}`)** — with **key-as-default** (or whenever **`t()`** does not interpolate), fill placeholders after translating:

```ts
import { interpolateTemplate } from "ai-i18n-tools";

const line = interpolateTemplate(t("Hello {{name}}"), { name: userName });
```

Same idea as Transrewrt **`interpolateTemplate`** in **`dev/i18n.md`** / `formatUtils.js`. Placeholder keys must be ASCII word tokens (`\w+`), matching **`{{name}}`** style.

**RTL arrows** — if a string may contain **→** (U+2192), you can normalize for RTL layouts with **`flipUiArrowsForRtl(text, isRtl)`** (also exported from **`ai-i18n-tools`**), same behavior as Transrewrt’s helper.

**Numbers, dates, currency** — this package does **not** ship helpers like `formatInteger` / `formatDecimal`. Those are easy to get wrong across locales and tend to be **app-specific** (null handling, “free” vs `$0`, duration formats). Prefer the platform APIs:

- Use **`Intl.NumberFormat`**, **`Intl.DateTimeFormat`**, **`Intl.RelativeTimeFormat`** (and friends) with a BCP-47 tag from your UI locale, e.g. **`i18n.language`** from react-i18next, or a small hook that returns **`i18n.language || "en-GB"`** (Transrewrt’s **`useFormatLocale`** pattern in **`dev/i18n.md`**).
- See [MDN: Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) for options (fraction digits, currency, time zones).

```ts
import { useTranslation } from "react-i18next";

function Price({ n }: { n: number }) {
  const { i18n } = useTranslation();
  const locale = i18n.language || "en-GB";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(n);
}
```

If you need the same “em dash for null” or custom duration strings as Transrewrt, keep those helpers **in your app** (or copy from Transrewrt **`formatUtils.js`**) — they are not required for **`ai-i18n-tools`** extract/translate workflows.

**i18next** — after the user picks a code, switch the runtime locale (exact API depends on your setup):

```ts
import i18n from "i18next";

async function applyLocale(code: string) {
  await i18n.changeLanguage(code);
  // Persist if you store preference: localStorage, settings file, etc.
}
```

Wire `LanguageSelect` so `onChange` calls `applyLocale` (and updates any app state that tracks the current `code`).

With an explicit **array** in **`targetLocales`**, you can still set **`uiLanguagesPath`** to the same manifest to get intersection (subset of shipped languages) and display names — but a **string path** (or one-element array path) alone is enough for typical Transrewrt setups.

### For Documentation Sites (and hybrid app + Docusaurus)

**Hybrid products** (app UI + Docusaurus docs) usually point root **`targetLocales`** at the same **`ui-languages.json`** as the UI so **`translate-ui`** matches the app. When docs should cover **fewer** languages, add **`documentation.targetLocales`** (subset array or a smaller manifest file). **Docs-only** repos may use only **`documentation.targetLocales`** with root **`targetLocales`** empty, or share one locale list at the root; both are valid.

**Layouts:**

- **Docusaurus** — `sourceLocale` source under **`docs/`**; translated files belong under  
  **`i18n/<LOCALE>/docusaurus-plugin-content-docs/current/`** with the same relative paths as under **`docs/`**. Set **`documentation.markdownOutput.style`** to **`"docusaurus"`** and **`docsRoot`** to **`"docs"`** (or your site’s doc root). Relative links between doc pages usually need **no** extra rewriting.
- **Flat repo-root docs** (e.g. **`README.md`**, **`USER-GUIDE.md`** written next to the English files with a locale suffix) — use **`markdownOutput.style`** **`"flat"`** and often enable **`rewriteRelativeLinksForFlat`** (defaults on for flat style when no custom **`pathTemplate`**). Combine with **`documentation.contentPaths`** listing both root files and any **`docs/`** tree; see **`markdownOutput`** for per-site overrides.

Optional **`documentation.markdownOutput.pathTemplate`** overrides the built-in layout, e.g. `{outputDir}/custom/{locale}/{relPath}` or `{outputDir}/{stem}.{locale}{extension}`. Placeholders include **`{outputDir}`**, **`{locale}`**, **`{relPath}`**, **`{stem}`**, **`{extension}`**, **`{docsRoot}`**, **`{relativeToDocsRoot}`**.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "openrouter": {
    "baseUrl": "https://openrouter.ai/api/v1",
    "translationModels": [
      "anthropic/claude-3.5-haiku",
      "anthropic/claude-haiku-4.5",
      "stepfun/step-3.5-flash:free"
    ],
    "maxTokens": 8192,
    "temperature": 0.3
  },
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true,
    "translateSVG": false
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "jsonSource": "i18n/en",
    "markdownOutput": {
      "style": "docusaurus",
      "docsRoot": "docs"
    }
  },
  "glossary": {
    "uiGlossaryFromStringsJson": "path/to/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

## Common Commands

```bash
# Extract translatable strings
npx ai-i18n-tools extract

# Translate UI strings (strings.json → de.json, fr.json, …)
npx ai-i18n-tools translate-ui

# Translate documentation (and UI too if translateUIStrings is true)
npx ai-i18n-tools translate

# Translate specific locale
npx ai-i18n-tools translate --locale fr

# Force re-translation (ignore cache)
npx ai-i18n-tools translate --force

# Dry run (no API calls, no writes)
npx ai-i18n-tools translate --dry-run

# Check translation status
npx ai-i18n-tools status

# Clean orphaned cache entries
npx ai-i18n-tools cleanup

# Launch web translation editor (document cache + UI strings + glossary)
npx ai-i18n-tools edit

# Show help
npx ai-i18n-tools --help
```

### Web translation editor (`edit`)

The local UI (default port from `--port`, often `8787`) exposes **three areas**, driven by your config paths:

1. **Document segments** — SQLite cache rows (source/translated fragments); same role as today’s Duplistatus cache editor.
2. **UI strings** — Edit `strings.json` entries (`source` + per-locale `translated`), when a path is configured.
3. **User glossary** — Edit **`glossary-user.csv`** rows (`Original language string`, `locale`, `Translation`), when `glossary.userGlossary` is set.

Tabs without a configured file stay hidden or read-only with an explanation. Full behavior and APIs: [I18N_TOOLS_IMPLEMENTATION_PLAN.md §4.7](./I18N_TOOLS_IMPLEMENTATION_PLAN.md#47-translation-editor-web-ui).

The CLI also accepts **`edit-cache`** as an alias for **`edit`** (same as older docs and scripts).

## Understanding the Workflow

### 1. Extraction Phase

The tool scans your source files for translatable content:

- **React apps**: Finds `t("...")` calls using i18next-scanner
- **Markdown**: Parses headings, paragraphs, frontmatter
- **JSON**: Extracts message fields from Docusaurus JSON files
- **SVG**: Identifies text elements in SVG files

Output: `strings.json` or similar intermediate format

### 2. Translation Phase

For each target locale:
1. Check cache for existing translations
2. Batch remaining segments for API efficiency
3. Call OpenRouter API with glossary hints
4. Validate translations
5. Write output files
6. Update cache

### 3. Caching

Translations are cached in `.translation-cache/cache.db`:
- **Segment-level**: Individual strings/paragraphs
- **File-level**: Skip unchanged files entirely
- **Automatic**: Happens transparently
- **Persistent**: Survives between runs

Result: 70%+ cache hit rate on subsequent runs!

## Tips & Best Practices

### Use Glossaries

Create `glossary-user.csv` with columns **`Original language string`**, **`locale`**, **`Translation`**. Use **`*`** in `locale` for all target languages.

```csv
"Original language string","locale","Translation"
"backup","*","backup"
"backup","pt-BR","cópia de segurança"
"API Key","de","API-Schlüssel"
"API Key","fr","Clé API"
```

Details: [I18N_TOOLS_IMPLEMENTATION_PLAN.md §3.3](./I18N_TOOLS_IMPLEMENTATION_PLAN.md#33-glossary-system).

### Organize Content

**Good (i18next `t()`):**
```tsx
import { useTranslation } from "react-i18next";

function SaveBar() {
  const { t } = useTranslation("my-component");
  return <Button>{t("saveButton")}</Button>;
}

function Toolbar() {
  const { t } = useTranslation("common");
  return <Button>{t("ui.cancel")}</Button>;
}
```

**Avoid:**
```javascript
// Don't use variables as keys
t(dynamicString)  // ❌ Won't be extracted

// Do use literal strings
t("Save Changes")  // ✅ Will be extracted
```

### Test Incrementally

```bash
# Test with one file first
npx ai-i18n-tools translate --path docs/intro.md --locale fr

# Test with one locale
npx ai-i18n-tools translate --locale de

# Then do full translation
npx ai-i18n-tools translate
```

### Monitor Costs

```bash
# Dry run to see what would be translated
npx ai-i18n-tools translate --dry-run

# Check cache stats
npx ai-i18n-tools status

# Clear cache if needed
npx ai-i18n-tools cleanup --clear-cache
```

## Troubleshooting

### "No strings extracted"

- Check `documentation.contentPaths` (and `ui.sourceRoots` for extract) in config
- Verify file extensions match extractor patterns
- Ensure `t()` calls use literal strings

### "API key not set"

```bash
echo $OPENROUTER_API_KEY  # Should show your key
export OPENROUTER_API_KEY=your-key  # Set it
```

### "Translation quality poor"

- Add terms to glossary
- Try different model: `--model anthropic/claude-3.5-sonnet`
- Clear problematic cache entries via web editor

### "Cache not working"

```bash
# Check cache exists
ls -la .translation-cache/cache.db

# Clear and rebuild
npx ai-i18n-tools cleanup --clear-cache
npx ai-i18n-tools translate --force
```

## Next Steps

- 📖 Read [full documentation](./docs/)
- 🔧 See [configuration reference](./docs/CONFIGURATION.md)
- 🚀 Check [migration guides](./docs/) for your project type
- 💬 Join our [Discord community](https://discord.gg/your-server)

## Need Help?

- 📚 [Documentation](./docs/)
- 🐛 [GitHub Issues](https://github.com/wsj-br/ai-i18n-tools/issues)
- 💬 [Discord](https://discord.gg/your-server)

Happy translating! 🌍
