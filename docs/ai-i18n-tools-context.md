# ai-i18n-tools — agent context

Standalone reference for assistants working **in a consumer repo** that depends on `ai-i18n-tools` (CLI, config, extract/translate behavior, runtime imports). Developing the package itself: see `dev/package-context.md` in the upstream repo.

---

## What it is

- **CLI:** `npx ai-i18n-tools <command>` (or `pnpm exec ai-i18n-tools`).
- **Runtime:** `import … from 'ai-i18n-tools/runtime'` — i18next helpers (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `makeLoadLocale`, `makeLocaleLoadersFromManifest`, `applyDirection`, language labels, plural helpers, etc.).
- **Config:** root `ai-i18n-tools.config.json`, or `-c <path>`.

Optional: set `openrouter.requestTimeoutMs` if the default **30000** ms per OpenRouter request is wrong for your network.

### Three workflows (pick one per kind of content)

| Workflow | Config | CLI | Use when |
|----------|--------|-----|----------|
| **1 — UI strings** | `ui.*`, `features.translateUIStrings` | `extract`, `translate-ui`, `sync-ui` | `t("…")` / `i18n.t("…")` in source → `strings.json` + flat `de.json`, … |
| **2 — Documents** | `docs[]`, `features.translateDocs` | `translate-docs` | `.md` / `.mdx` / `.astro` pages; optional Docusaurus shell JSON via `docs[].docusaurusCatalogDir` |
| **3 — Nested JSON** | `json[]`, `features.translateJson` | `translate-json` | Per-locale JSON bundles only (e.g. `src/i18n/en/translation.json`) — not `t()` in source |

`sync` runs enabled steps in order (skip with `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`): UI → SVG → docs → `json[]`. Full guide: [GETTING_STARTED.md](./GETTING_STARTED.md) (Workflow 3: [JSON file translation](./GETTING_STARTED.md#workflow-3---json-file-translation)).

**Config naming (current):** top-level `docs[]` (not `documentations[]`); `docs[].docsOutput` (not `markdownOutput`); `docs[].docusaurusCatalogDir` (not `jsonSource`). Legacy keys still load via preprocess and are rewritten when the config file is writable. There is no `features.extractUIStrings` (extract runs automatically before UI translation) and no `features.translateJSON` (catalog JSON runs inside `translate-docs` when `docusaurusCatalogDir` is set).

---

## Invariant: `sourceLocale` === `SOURCE_LOCALE`

`sourceLocale` in config must **exactly match** the `SOURCE_LOCALE` constant your app exports from its i18n bootstrap. If they differ, extract and translation targets are wrong.

---

## Code patterns

Extract only sees string literals in `t` / `i18n.t` (and names in `ui.reactExtractor.funcNames`). Variables as keys are not extracted.

```js
t("Save");
t("Hello {{name}}", { name: userName });
```

For dropdowns and option lists, call `t()` at definition time (for example inside `useMemo(..., [t])`), not with a dynamic key.

Plurals and catalog shape: see **Extract and `strings.json`** below.

---

## Runtime wiring (sketch)

Full runnable example: [README.md](../README.md) (Workflow 1 — UI strings). Prefer `setupKeyAsDefaultT` over lower-level `wrapI18nWithKeyTrim` for app wiring.

```js
import aiI18n from "ai-i18n-tools/runtime";
// stringsJson, uiLanguages, SOURCE_LOCALE, sourcePluralFlat from your app

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
i18n.on("languageChanged", aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
```

### Changing the language at runtime

After building `loadLocale` with `makeLoadLocale`, switch with `await loadLocale(code)` then `await i18n.changeLanguage(code)`. Where you persist the chosen locale is app-specific.

### RTL

Use `getTextDirection` for layout decisions, `applyDirection` on `languageChanged` (and once at init), and `flipUiArrowsForRtl` when arrow glyphs in copy should mirror for RTL.

---

## `ui-languages.json` (generated manifest)

Each row: `code` (BCP-47), `label`, `englishName`, `direction` (`ltr` | `rtl`), and optionally `isSourceLocale` (boolean) for the source locale entry. `targetLocales` in config is a BCP-47 array. Generate with:

`npx ai-i18n-tools generate-ui-languages`

Writes `ui-languages.json` to root `uiLanguagesPath` if set, otherwise `{ui.flatOutputDir}/ui-languages.json`. Unknown locales get TODO placeholders and a warning; customised `label`/`englishName` may be overwritten by the bundled master list — review after generate. At runtime, `makeLoadLocale` maps should align bundle keys with `targetLocales` (omit `sourceLocale` from dynamic import maps).

Example with source locale marked:
```jsonc
[
  {
    "code": "en-GB",
    "label": "English (GB)",
    "englishName": "English (GB)",
    "direction": "ltr",
    "isSourceLocale": true
  },
  {
    "code": "de",
    "label": "Deutsch",
    "englishName": "German",
    "direction": "ltr"
  }
]
```

---

## UI strings: catalog vs flat bundles (read this before wiring `t()`)

ai-i18n-tools uses **two different on-disk shapes**. Do not use `strings.json` keys at runtime and do not use MD5 hashes in per-locale flat JSON.

| Artifact | Path (typical) | Key shape | Role |
|----------|----------------|-----------|------|
| **Catalog** | `ui.stringsJson` (e.g. `src/i18n/strings.json`) | **MD5-8** of trimmed source (`deccbe4e`, …) | **Tooling cache:** `source`, `translated`, `models`, `locations`. Updated by `extract` / `translate-ui`. **Not** imported by most apps at runtime. |
| **Flat locale bundle** | `ui.flatOutputDir` (e.g. `public/locales/de.json`) | **English source text** | **Runtime / SSG lookup:** `"Save": "Speichern"`. Written by `translate-ui` (`buildFlatJsonForLocale` uses `flat[entry.source] = translation`). |
| **Plural flat (source only)** | `{flatOutputDir}/{sourceLocale}.json` | `groupId_original`, `groupId_one`, … | Only when plurals exist; loaded with `sourcePluralFlatBundle` for i18next. |

### Lookup rule for custom `t()` (Astro, scripts, non-i18next)

When you implement a small `makeT(flat)` helper (see `examples/astro-website/src/i18n/t.ts`):

```ts
// Correct: key is the same literal passed to t()
t("Translate")  →  flat["Translate"]  →  "Traduzir" | fallback "Translate"

// Wrong: do not hash at runtime
t("Translate")  →  flat[md5("Translate").slice(0, 8)]   // flat files are not keyed this way
```

- Pass the **exact** English source string to `t()` that `extract` recorded (same spelling, spacing, and punctuation).
- If a locale file is missing, fall back to the source string (identity for `sourceLocale`).
- `strings.json` is for the CLI pipeline only unless you use `ai-i18n-tools/runtime` (`setupKeyAsDefaultT`), which reads the catalog internally.

### Extract and `strings.json` (catalog)

- **Catalog row ids:** MD5 of trimmed **source string**, first **8** hex chars (`deccbe4e`, …). These ids appear **only** in `strings.json`, not in `de.json` / `pt-BR.json`.
- **Sources:** string literals to `t` / `i18n.t` (and names in `ui.uiExtractor.funcNames` / `ui.reactExtractor.funcNames`) under `ui.sourceRoots`; optionally `package.json` `description` and manifest `englishName` rows when the matching extractor flags are on. **Literal keys only** — variables are not extracted.
- **Extract timing:** `extract` updates `strings.json` from source. It runs automatically before `translate-ui`, `sync-ui`, and the UI phase of `sync` when `features.translateUIStrings` is true. You can still run `extract` alone to refresh the catalog (requires non-empty `ui.sourceRoots`).
- **Re-runs:** existing `translated` / `models` for surviving catalog ids are kept.
- **Plurals:** `t('…', { plurals: true, … })` → catalog row with `"plural": true` and per-locale CLDR-shaped objects; `translate-ui` expands flat bundles with suffix keys (`groupId_one`, …) as needed. Use `setupKeyAsDefaultT` from `ai-i18n-tools/runtime` with `strings.json` and optional `sourcePluralFlatBundle` so the source locale resolves plural suffixes.

### Astro / static sites (hybrid with `translate-docs`) {#astro-hybrid}

Reference: [`examples/astro-website`](../examples/astro-website/) and [GETTING_STARTED — Astro website](./GETTING_STARTED.md#astro-website).

| What | Pipeline | Notes |
|------|----------|-------|
| Template HTML (headings, nav, feature lists in the body) | `translate-docs` | Writes `src/pages/{locale}/index.astro`; adjusts relative imports |
| Frontmatter / `t('…')` data (tab labels, shared arrays) | `extract` → `translate-ui` | Flat JSON under `ui.flatOutputDir`; lookup by English source key |
| Locale labels / RTL | `generate-ui-languages` | Manifest (`ui-languages.json`); optional `ui.uiLanguagesPath` (e.g. `src/i18n/ui-languages.json`) |

- **Page HTML:** static text nodes and translatable attributes (`alt`, `title`, `aria-label`, `placeholder`). User-facing string literals inside template `{expression}` blocks (inline arrays, object fields) are translated. Protected: attribute/key values (`class`, `id`, `style`, `data-*`, …), configurable `docs[].protectAttributes` / `protectKeys`, `<script>`, `<style>`, and **literals inside `t('…')`** (frontmatter or template).
- **Frontmatter:** not translated by `translate-docs`; copy the same `t()` wiring block to every locale page, or re-run `translate-docs` after editing English frontmatter.
- **Build-time wiring** (every page that uses `t()`):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

- **Routing:** `Astro.currentLocale` + `ui-languages.json`; `LanguagePicker` via `getRelativeLocaleUrl` from `astro:i18n`. Map Astro route codes (`pt-br`) to bundle filenames (`pt-BR.json`) via manifest `code` in `locale.ts`.
- **Init:** `init -t ui-astro-website` scaffolds UI-only config; add `docs[]` + `features.translateDocs` for the HTML pipeline; use `json[]` + `translate-json` for nested locale JSON bundles only.
- **Scripts (example):** `i18n:translate` → `translate-docs`, `i18n:locales` → `generate-ui-languages`, `i18n:sync` → full sync per config.

### Common mistakes (agents)

| Mistake | Why it fails |
|---------|----------------|
| Runtime lookup by MD5-8 in flat JSON | `translate-ui` writes `flat[source] = translation`, not hash keys. |
| Importing `strings.json` in Astro `makeT` | Catalog is for CLI; flat bundles are the SSG/runtime map. |
| Empty `en.json` required | For `sourceLocale`, missing keys should fall back to the source literal; `{}` is fine. |
| Expecting `translate-docs` to translate `t('…')` args | Those literals are protected; use `translate-ui` for them. |
| Putting Docusaurus catalog JSON under `json[]` | Use `docs[].docusaurusCatalogDir` + `translate-docs` instead. |
| Using `json[]` for UI from `t()` in TS/Astro | Workflow 1 (`translate-ui`), not Workflow 3. |
| Using `i18n:translate:pages` script name | Example uses `i18n:translate` for `translate-docs`; either name is fine in your own `package.json`. |
| Forgetting to align three locale lists | Keep `targetLocales`, `astro.config.mjs` `i18n.locales`, and `ui-languages.json` in sync. |

---

## Workflow 3 — nested JSON bundles

For sites that store UI copy in nested JSON files per locale (no `t()` in components), not Docusaurus `write-translations` catalogs.

**Example config:**

```json
{
  "features": { "translateJson": true },
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

- `contentPaths`: string or array; each entry is a `.json` file, directory tree, or glob (minimatch).
- `outputPathTemplate`: required; placeholders include `{locale}`, `{LOCALE}`, `{llocale}`, `{basename}`, `{stem}`, `{relativeToSourceRoot}`. Use `{llocale}` when output folders must match Astro-style lowercase route codes (`pt-br`, `zh-cn`) while `targetLocales` stays BCP-47 (`pt-BR`, `zh-CN`).
- `keyPolicy.mode`: `allowlist`, `denylist`, or `both` (allowlist first, then subtract denylist). Paths use dot notation (`nav.home.label`); globs use minimatch. Bare names like `slug` match the final key segment.
- Cache file tracking: `json-block:{blockIndex}:{projectRelPath}`.

**Commands:** `npx ai-i18n-tools translate-json`, or `sync` / `sync --no-json`. Init template: `init -t ui-json-bundles`.

**vs Workflow 2:** Docusaurus shell files (`{ "key": { "message": "…", "description": "…" } }`) belong under `docs[].docusaurusCatalogDir` and are translated by `translate-docs`, not `translate-json`.

---

## Source locale JSON generation

The `translate-ui` command **only generates a source locale JSON file** (e.g., `en-GB.json`) **if there are plural strings** in `strings.json`. This file contains plural form keys (e.g., `key_original`, `key_zero`, `key_one`, `key_other`, etc.) needed for i18next plural resolution.

If your source code contains **no plural strings** (no `t()` calls with `{ plurals: true }`), **no source locale JSON file is generated**. In this case:

- The `t()` function returns the source string key directly (e.g., `t("Save")` → `"Save"`).
- You do not need a source locale flat JSON bundle.
- Omit the `sourcePluralFlatBundle` parameter in `setupKeyAsDefaultT`.

The source locale JSON file is purely for plural handling — it is never required for plain string localization since the source string itself is already the correct value in the source locale.

---

## Generated files (typical)

Paths depend on your config; common artifacts:

- `strings.json` — **catalog / cache** (MD5-8 id → `source`, `translated`, optional `models`). Used by CLI and `ai-i18n-tools/runtime`, not by typical flat-json `makeT` helpers.
- Per-locale flat JSON — for example `de.json`, `pt-BR.json` under `ui.flatOutputDir` (**source sentence → translation**, English text as key).
- **Source locale JSON** — only if plurals exist (e.g., `en-GB.json` with plural suffix keys).
- `ui-languages.json` — manifest rows (`code`, `label`, `englishName`, `direction`).
- `cacheDir` — SQLite cache for `translate-docs`, `translate-json`, and `translate-svg` (shared segment store).
- Outputs from `json[]` — paths from each block’s `outputPathTemplate` (e.g. `src/i18n/pt-br/translation.json` when using `{llocale}`).
- Optional CSV at `glossary.userGlossary` — influences `translate-ui` and `lint-source` when present.

Full config field reference: [GETTING_STARTED.md](./GETTING_STARTED.md).

---

## Commands (common)

When set, `glossary.userGlossary` points at an optional CSV used by `translate-ui` and `lint-source`.

- **Scaffold config:** `npx ai-i18n-tools init`
- **Validate OpenRouter model ids:** `npx ai-i18n-tools check-models` (`OPENROUTER_API_KEY`)
- **Build `ui-languages.json`:** `npx ai-i18n-tools generate-ui-languages`
- **Refresh UI catalog:** `npx ai-i18n-tools extract` (also runs before UI translate when `translateUIStrings` is on)
- **Translate UI:** `npx ai-i18n-tools translate-ui` (`OPENROUTER_API_KEY`; runs extract first)
- **Translate documentation:** `npx ai-i18n-tools translate-docs` — `docs[]`; Docusaurus catalog when `docusaurusCatalogDir` is set
- **Translate nested JSON:** `npx ai-i18n-tools translate-json` — `json[]` when `translateJson` is on
- **UI only (extract + translate):** `npx ai-i18n-tools sync-ui`
- **Lint source-locale copy (advisory):** `npx ai-i18n-tools lint-source` (requires `translateUIStrings`; runs extract first)
- **Markdown static checks:** `npx ai-i18n-tools check-markdown` (no API; exit 1 on issues; updates `markdown_source_issues` in `cacheDir` unless `--no-cache`). Same rules run during `translate-docs` when `warnMarkdownSourceIssues` is enabled, including `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK` for the patterns in **Documentation (Markdown)** below.
- **Status tables:** `npx ai-i18n-tools status` (UI strings; markdown per `docs[]` block; `json[]` when `translateJson` is on)
- **Cache aggregates:** `npx ai-i18n-tools statistics` (documentation cache + `strings.json` aggregates; same idea as the dashboard Statistics view)
- **Web dashboard:** `npx ai-i18n-tools dashboard`
- **Cleanup:** `npx ai-i18n-tools cleanup` (runs `sync --force-update`, then prunes stale cache rows; backs up SQLite by default)
- **All enabled pipelines:** `npx ai-i18n-tools sync` (`--no-ui`, `--no-svg`, `--no-json`, `--no-docs` to skip)

Exhaustive CLI list and global flags: [README.md](../README.md#cli-commands). Use `-c <path>` when the config file is not the default. Flags and env vars: `npx ai-i18n-tools --help` and per-command `--help`.

The `ai-i18n-tools dashboard` UI includes a **Markdown issues** tab (same `markdown_source_issues` data as `check-markdown`), separate from translation failures.

---

## Documentation (Workflow 2)

- Config block: `docs[]` with `contentPaths`, `outputDir`, `docsOutput` (style `nested`, `flat`, `docusaurus`, `astro-starlight`, …).
- Docusaurus site chrome: set `docs[].docusaurusCatalogDir` to the `write-translations` folder (e.g. `docs-site/i18n/en`); translated with `translate-docs` when `translateDocs` is true — no separate JSON feature flag.
- Locale-specific screenshots and illustrated SVGs: [Locale assets guide](LOCALE-ASSETS-GUIDE.md) (Patterns A–E, `docsOutput.postProcessing.regexAdjustments`, flat link rewriter).
- Do **not** use bold formatting around inline code—avoid putting asterisks outside a backtick span. Use plain `` `code` `` spans, or apply emphasis and code styling separately; never nest both on the same element.
- Do **not** use bold formatting around links—avoid putting asterisks outside a link. Use plain `` [link text](url) `` spans, or apply emphasis and link styling separately; never nest both on the same element. If needed a bold use it inside the link text.


---

## Troubleshooting

- **String not extracted** — only string-literal keys; add manual catalog entries or merge if you use dynamic keys.
- **Language picker names not translated** — ensure `englishName` (or equivalent) is covered by extract flags or manual rows, then `translate-ui`.
- `generate-ui-languages` fails — set `uiLanguagesPath` (manifest output) in config.
- **Section anchor links broken in translated docs** — run `write-heading-ids` on source markdown to insert or refresh `<a id="…"></a>` lines, then re-run `translate-docs`; see [Document translation troubleshooting](GETTING_STARTED.md#document-translation-troubleshooting).

---

## More detail in-repo

- `README.md` — install, quick start, runtime helper overview.
- `docs/LOCALE-ASSETS-GUIDE.md` — screenshots and SVG assets in translated documentation.
- `docs/PACKAGE_OVERVIEW.md` — how extract and translation pipelines fit together.
