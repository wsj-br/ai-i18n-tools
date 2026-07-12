# ai-i18n-tools — agent context

Standalone reference for assistants working **in a consumer repo** that depends on `ai-i18n-tools` (CLI, config, extract/translate behavior, runtime imports). Developing the package itself: see `AGENT.md` and `docs/reference/` in the upstream repo.

---

## What it is

- **CLI:** `ai-i18n-tools <command>` — configure PATH, direnv, or a global install so the bare command resolves (see [Using the CLI](/guide/installation#using-the-cli)).
- **Runtime:** `import … from 'ai-i18n-tools/runtime'` — i18next helpers (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `makeLoadLocale`, `makeLocaleLoadersFromManifest`, `applyDirection`, language labels, plural helpers, etc.).
- **Config:** root `ai-i18n-tools.config.json`, or `-c <path>`.
- **Tool UI language:** the CLI help/logs and the dashboard localize themselves (separate from your project's locales). Resolution order, highest first: `-L` / `--ui-lang <code>`, the `AI_I18N_LANG` env var, the config `uiLanguage` key, then the host OS locale; unmatched values fall back to the closest shipped variation and finally to `en-GB`.

- **LLM provider:** configure under `providers.<name>` and select the active one with the top-level `provider` key (optional when only one provider is configured). Built-in presets (OpenRouter, OpenAI, Anthropic, Gemini, DeepSeek, Cerebras, Groq, Mistral, xAI, NVIDIA, Alibaba, APIFUN, Ollama) need only a `translationModels` list; their `baseUrl` and API-key env var are built in. Any OpenAI-compatible endpoint works by setting `providers.<name>.baseUrl` (+ `apiKeyEnv`). A legacy top-level `openrouter` block is auto-migrated to `providers.openrouter` on load.

Optional: set `providers.<name>.requestTimeoutMs` if the default **45000** ms per request is wrong for your network.

Optional model tiers under `providers.<active>`: `uiModels` (UI-only fallback after per-locale overrides) and `localeModels` (per-locale overrides for all pipelines). Resolution order — UI: `localeModels` → `uiModels` → `translationModels`; docs/JSON/SVG: `localeModels` → `translationModels`. See [Providers and models — Model fallback chain](/guide/providers-and-models#model-fallback-chain).

The CLI auto-loads a `.env` file from the working directory (does not override variables already set in the shell).

### Translation pipelines (pick one per kind of content)

| Pipeline | Config | CLI | Use when |
|----------|--------|-----|----------|
| **UI strings** | `ui.*`, `features.translateUIStrings` | `extract`, `translate-ui`, `sync-ui` | `t("…")` / `i18n.t("…")` in source, or `data-i18n*` in `.html` → `strings.json` + flat `de.json`, … |
| **Documents** | `docs[]`, `features.translateDocs` | `translate-docs` | `.md` / `.mdx` / `.astro` pages plus framework shell strings (nav, sidebar, theme catalogs) |
| **JSON** | `json[]`, `features.translateJson` | `translate-json` | Standalone nested locale JSON (e.g. `src/i18n/en/translation.json`) — not `t()` in source, not doc-framework shell |
| **SVG** | `svg`, `features.translateSVG` | `translate-svg` | Illustrated SVGs with `<text>` / `<title>` / `<desc>` labels — separate from doc markdown assets |

`sync` runs enabled steps in order (skip with `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`): UI → SVG → docs → `json[]`. Full guide: [Quick start](/guide/quick-start) (JSON: [JSON](/guide/json); SVG: [SVG translation](/guide/svg-translation/)).

**Config naming (current):** top-level `docs[]` (not `documentations[]`); `docs[].docsOutput` (not `markdownOutput`); `docs[].docusaurusCatalogDir` (not `jsonSource`); `languagesManifestPath` (not `uiLanguagesPath`). Legacy keys still load via preprocess and are rewritten when the config file is writable. There is no `features.extractUIStrings` (extract runs automatically before UI translation). The legacy `features.translateJSON` flag is gone — Docusaurus catalog JSON runs inside `translate-docs` when `docusaurusCatalogDir` is set; standalone nested locale JSON uses `features.translateJson` with top-level `json[]` (JSON).

---

## Invariant: `sourceLocale` === `SOURCE_LOCALE`

`sourceLocale` in config must **exactly match** the `SOURCE_LOCALE` constant your app exports from its i18n bootstrap. If they differ, extract and translation targets are wrong.

---

## Code patterns

Extract only sees string literals in `t` / `i18n.t` (and names in `ui.uiExtractor.funcNames`, or legacy `ui.reactExtractor.funcNames`), plus bare `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` markers in `.html` / `.htm` when those extensions are listed in `ui.uiExtractor.extensions`. Variables as keys are not extracted. Use `ai-i18n-tools mark-html` to auto-insert HTML markers (dry run by default; `--write` to apply).

```js
t("Save");
t("Hello {{name}}", { name: userName });
```

For dropdowns and option lists, call `t()` at definition time (for example inside `useMemo(..., [t])`), not with a dynamic key.

Plurals and catalog shape: see **Extract and `strings.json`** below.

---

## Runtime wiring (sketch)

Full runnable example: [UI strings — Wire i18next at runtime](/guide/ui-strings/i18next-runtime) and [Runtime helpers](/guide/runtime-helpers). Prefer `setupKeyAsDefaultT` over lower-level `wrapI18nWithKeyTrim` for app wiring.

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

`ai-i18n-tools generate-ui-languages`

Writes `ui-languages.json` to root `languagesManifestPath` if set, otherwise `{ui.flatOutputDir}/ui-languages.json`. Unknown locales get TODO placeholders and a warning; customised `label`/`englishName` may be overwritten by the bundled master list — review after generate. At runtime, `makeLoadLocale` maps should align bundle keys with `targetLocales` (omit `sourceLocale` from dynamic import maps).

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
- **Sources:** string literals to `t` / `i18n.t` (and names in `ui.uiExtractor.funcNames` / `ui.reactExtractor.funcNames`) under `ui.sourceRoots`; `data-i18n*` element text / `title` / `placeholder` in HTML when `.html` is in `ui.uiExtractor.extensions`; optionally `package.json` `description` and manifest `englishName` rows when the matching extractor flags are on. **Literal keys only** — variables are not extracted.
- **Extract timing:** `extract` updates `strings.json` from source. It runs automatically before `translate-ui`, `sync-ui`, and the UI phase of `sync` when `features.translateUIStrings` is true. You can still run `extract` alone to refresh the catalog (requires non-empty `ui.sourceRoots`).
- **Re-runs:** existing `translated` / `models` for surviving catalog ids are kept.
- **Plurals:** `t('…', { plurals: true, … })` → catalog row with `"plural": true` and per-locale CLDR-shaped objects; `translate-ui` expands flat bundles with suffix keys (`groupId_one`, …) as needed. Use `setupKeyAsDefaultT` from `ai-i18n-tools/runtime` with `strings.json` and optional `sourcePluralFlatBundle` so the source locale resolves plural suffixes.

### Astro / static sites (hybrid with `translate-docs`) {#astro-hybrid}

Reference: [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) and [UI strings — Astro website](/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight).

| What | Pipeline | Notes |
|------|----------|-------|
| Template HTML (headings, nav, feature lists in the body) | `translate-docs` | Writes `src/pages/{locale}/index.astro`; adjusts relative imports |
| Frontmatter / `t('…')` data (tab labels, shared arrays) | `extract` → `translate-ui` | Flat JSON under `ui.flatOutputDir`; lookup by English source key |
| Locale labels / RTL | `generate-ui-languages` | Manifest at `languagesManifestPath` (required; e.g. `src/i18n/ui-languages.json`) |

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
| Putting Docusaurus / VitePress / Nextra / Fumadocs shell strings under `json[]` | Use the framework config keys below + `translate-docs` instead. |
| Using `json[]` for UI from `t()` in TS/Astro | UI strings (`translate-ui`), not JSON. |
| Using `i18n:translate:pages` script name | Example uses `i18n:translate` for `translate-docs`; either name is fine in your own `package.json`. |
| Forgetting to align three locale lists | Keep `targetLocales`, `astro.config.mjs` `i18n.locales`, and `ui-languages.json` in sync. |

---

## JSON — nested JSON bundles

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
- `outputPathTemplate`: required; placeholders include `{locale}`, `{LOCALE}`, `{llocale}`, `{basename}`, `{stem}`, `{relativeToSourceRoot}`. Use `{llocale}` when output folders must match Astro-style lowercase route codes (`pt-br`, `zh-hans`) while `targetLocales` stays BCP-47 (`pt-BR`, `zh-Hans`).
- `keyPolicy.mode`: `allowlist`, `denylist`, or `both` (allowlist first, then subtract denylist). Paths use dot notation (`nav.home.label`); globs use minimatch. Bare names like `slug` match the final key segment.
- Cache file tracking: `json-block:{blockIndex}:{projectRelPath}`.

**Commands:** `ai-i18n-tools translate-json`, or `sync` / `sync --no-json`. Init template: `init -t ui-json-bundles`.

**vs Documents:** Docusaurus shell files (`{ "key": { "message": "…", "description": "…" } }`) belong under `docs[].docusaurusCatalogDir` and are translated by `translate-docs`, not `translate-json`. The same rule applies to VitePress theme catalogs, Nextra dictionaries, and Fumadocs UI catalogs — all via `docs[]`, not `json[]`.

---

## SVG translation

For SVG illustrations with human-readable labels in `<text>`, `<title>`, or `<desc>`. Separate from markdown alt-text handling in `translate-docs`.

- Enable `features.translateSVG` and configure the top-level `svg` block (source paths, `outputDir`, optional `forceLowercase`).
- **Command:** `ai-i18n-tools translate-svg`, or `sync` / `sync --no-svg`.
- Writes one output SVG per target locale; shares `cacheDir` with other pipelines.
- Do **not** use for decorative icons, raster images, or text baked into path data.

Guide: [SVG translation](/guide/svg-translation/).

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
- Per-locale SVG outputs — from `svg.outputDir` when `translateSVG` is on.
- Outputs from `json[]` — paths from each block’s `outputPathTemplate` (e.g. `src/i18n/pt-br/translation.json` when using `{llocale}`).
- Optional CSV at `glossary.userGlossary` — influences `translate-ui` and `proofread-ui` when present.

Full config field reference: [Configuration](/reference/configuration).

---

## Commands (common)

When set, `glossary.userGlossary` points at an optional CSV used by `translate-ui` and `proofread-ui`.

- **Scaffold config:** `ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [-P <provider>]`
- **Validate model ids:** `ai-i18n-tools check-models` (validates the union of `translationModels`, `uiModels`, and `localeModels`)
- **List available models:** `ai-i18n-tools list-models` (use `-P` / `--provider` to inspect another configured provider)
- **Benchmark models:** `ai-i18n-tools bench-models` (one sample translation per model; `--model` to override the configured list)
- **List bundled locales:** `ai-i18n-tools list-languages [search]`
- **Build `ui-languages.json`:** `ai-i18n-tools generate-ui-languages`
- **Refresh UI catalog:** `ai-i18n-tools extract` (also runs before UI translate when `translateUIStrings` is on)
- **Insert HTML i18n markers:** `ai-i18n-tools mark-html [paths...]` (dry run; `--write` to apply)
- **Translate UI:** `ai-i18n-tools translate-ui` (runs extract first)
- **Translate documentation:** `ai-i18n-tools translate-docs` — `docs[]` pages plus framework shell catalogs (see **Documentation frameworks** below)
- **Insert heading anchor ids:** `ai-i18n-tools write-heading-ids` (before re-translating when section links break)
- **Translate SVG labels:** `ai-i18n-tools translate-svg` — `svg` block when `translateSVG` is on
- **Translate nested JSON:** `ai-i18n-tools translate-json` — `json[]` when `translateJson` is on
- **UI only (extract + translate):** `ai-i18n-tools sync-ui`
- **Proofread source-locale UI copy (advisory):** `ai-i18n-tools proofread-ui` (requires `translateUIStrings`; runs extract first)
- **Export UI catalog to XLIFF:** `ai-i18n-tools export-ui-xliff`
- **Markdown static checks:** `ai-i18n-tools check-markdown` (no API; exit 1 on issues; updates `markdown_source_issues` in `cacheDir` unless `--no-cache`). Same rules run during `translate-docs` when `warnMarkdownSourceIssues` is enabled, including `STRONG_OUTSIDE_LINK` when `**`/`__` wrap a `[text](url)` link (put bold inside the link text only). Bold around inline code is handled at translation time via emphasis placeholders — not flagged as a source issue.
- **Status tables:** `ai-i18n-tools status` (UI strings; markdown per `docs[]` block; `json[]` when `translateJson` is on)
- **Cache aggregates:** `ai-i18n-tools statistics` (documentation cache + `strings.json` aggregates; same idea as the dashboard Statistics view)
- **Web dashboard:** `ai-i18n-tools dashboard`
- **Cleanup:** `ai-i18n-tools cleanup` (clears the entire `markdown_source_issues` table, runs `sync --force-update`, then prunes stale cache rows; backs up SQLite only when `--backup` is set)
- **Purge one locale:** `ai-i18n-tools purge-locale -l <code>` (cache + generated artifacts; `--dry-run`, `--keep-files`)
- **Remove temp/log files:** `ai-i18n-tools clean-temp`
- **All enabled pipelines:** `ai-i18n-tools sync` (`--no-ui`, `--no-svg`, `--no-json`, `--no-docs` to skip)

Exhaustive CLI list and global flags: [CLI commands reference](/reference/cli-commands/). Use `-c <path>` when the config file is not the default. Flags and env vars: `ai-i18n-tools --help` and per-command `--help`.

The `ai-i18n-tools dashboard` UI includes a **Markdown issues** tab (same `markdown_source_issues` data as `check-markdown`), separate from translation failures.

---

## Documentation frameworks

All documentation sites use `docs[]` + `translate-docs` (or `sync`). **Framework shell strings** (nav, sidebar, theme labels) belong in the Documents pipeline — do **not** put them in `json[]` (that pipeline is for unrelated app locale bundles only).

Start here: [Integrations index](/guide/integrations/). Layout details: [Output layouts](/guide/documents/output-layouts).

| Framework | Init template | `docsOutput.style` | Page layout (typical) | Shell / theme strings |
|-----------|---------------|--------------------|-----------------------|------------------------|
| VitePress | `ui-vitepress` | `vitepress` | `docs/guide.md` → `docs/de/guide.md` | `docsOutput.vitepressThemeCatalog` |
| Nextra 4 | `ui-nextra` | `nextra` | `content/en/…` → `content/pt-BR/…` | auto `_meta.ts` + `docs[].nextraDictionaryPath` |
| Fumadocs 4 | `ui-fumadocs` | `fumadocs` | dot: `page.mdx` → `page.pt.mdx`; or dir: `content/docs/en/` → `content/docs/pt-BR/` | auto `meta.json` + `docsOutput.fumadocsUiCatalog` |
| Docusaurus | `ui-docusaurus` | `docusaurus` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` | `docs[].docusaurusCatalogDir` |
| Astro Starlight | `ui-starlight` | `astro-starlight` | `src/content/docs/guide.md` → `src/content/docs/de/guide.md` | built-in UI (pages only); optional `en.json` overrides in a separate `docs[]` block |
| Plain Astro pages | hybrid UI + docs | `astro-starlight` | `src/pages/index.astro` → `src/pages/{locale}/index.astro` | see [Astro hybrid](#astro-hybrid) |
| Repo-root markdown | `ui-markdown` | `flat` or `nested` | `README.md` → `translated-docs/README.de.md` | — |

`docsOutput.style` values: `"nested"`, `"flat"`, `"doc-system"`, and aliases `"docusaurus"`, `"astro-starlight"`, `"vitepress"`, `"nextra"`, `"fumadocs"`.

### Framework shell translation (do not use `json[]`)

| Framework | Shell artifact | Config key | Pipeline |
|-----------|----------------|------------|----------|
| Docusaurus | `write-translations` catalog (`{ message, description }`) | `docs[].docusaurusCatalogDir` | `translate-docs` |
| VitePress | Theme/nav/sidebar/footer JSON | `docsOutput.vitepressThemeCatalog` | `translate-docs` |
| Nextra | `_meta.ts` sidebar labels | auto when `style: "nextra"` | `translate-docs` |
| Nextra | Theme dictionary `.ts` | `docs[].nextraDictionaryPath` | `translate-docs` |
| Fumadocs | `meta.json` sidebar labels | auto when `style: "fumadocs"` | `translate-docs` |
| Fumadocs | UI overrides in layout shared module | `docsOutput.fumadocsUiCatalog` | `translate-docs` |

### Per-framework notes

- **VitePress** — English at the content root; locale folders beside source (`docs/de/…`). Use site routes (`/guide/…`) for in-site links in English markdown; `rewriteVitepressLinks` defaults on for `style: "vitepress"`. Wire `config.mts` to load generated `theme.{locale}.json` via `loadTheme()` after the first sync. Guide: [VitePress](/guide/integrations/vitepress). Example: [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/).
- **Nextra 4** — English MDX under a locale folder (e.g. `content/en/`); translated siblings under `content/{locale}/`. Set `docsRoot` to the English folder. Align `targetLocales` with `next.config` i18n. `rewriteNextraLinks` defaults on. Guide: [Nextra](/guide/integrations/nextra). Example: [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/).
- **Fumadocs 4** — Default **dot** parser: locale suffix in filename (`index.pt.mdx`). Set `fumadocsParser: "dir"` for Nextra-style locale folders. Align `targetLocales` with `defineI18n().languages`. `rewriteFumadocsLinks` defaults on. Guide: [Fumadocs](/guide/integrations/fumadocs). Example: [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/).
- **Docusaurus** — Set `docusaurusCatalogDir` to the English `write-translations` folder. Guide: [Docusaurus](/guide/integrations/docusaurus). Example: [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/).
- **Starlight** — `init -t ui-starlight`; optional custom UI overrides via `src/content/i18n/en.json` with `jsonPathTemplate` in a separate `docs[]` block. Example: [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/).

General rules for all doc frameworks:

- Do not hand-edit link targets under locale output trees — re-run `translate-docs` / `sync`.
- Locale-specific screenshots and illustrated SVGs in markdown: [Locale assets guide](/guide/images-and-screenshots/) (`docsOutput.postProcessing.regexAdjustments`, flat link rewriter).
- Do **not** use bold formatting around inline code — use plain `` `code` `` spans.
- Do **not** use bold formatting around links — use plain `` [link text](url) `` spans, or put bold inside the link text.


---

## Troubleshooting

- **String not extracted** — only string-literal keys; add manual catalog entries or merge if you use dynamic keys.
- **Language picker names not translated** — ensure `englishName` (or equivalent) is covered by extract flags or manual rows, then `translate-ui`.
- `generate-ui-languages` fails — set `languagesManifestPath` (manifest output) in config.
- **Section anchor links broken in translated docs** — run `write-heading-ids` on source markdown to insert or refresh `<a id="…"></a>` lines, then re-run `translate-docs`; see [Documents — Troubleshooting](/guide/documents/troubleshooting).
- **Broken links on VitePress (404 in dev or GitHub Pages)** — English sources should use site routes (`/guide/…`), not `docs/guide/…` or `../guide/…`. Enable `rewriteVitepressLinks` (default for `style: "vitepress"`) and re-run `translate-docs` / `sync`. Do not patch locale trees by hand.
- **Nextra / Fumadocs sidebar labels not translated** — confirm `style` is `"nextra"` or `"fumadocs"`, English sources live under the configured `docsRoot`, and `features.translateDocs` is on; re-run `sync`.
- **Fumadocs wrong output paths** — check `fumadocsParser`: `"dot"` writes `page.{locale}.mdx` beside English; `"dir"` writes locale folders like Nextra.

---

## More detail in-repo

- `README.md` — install, quick start, runtime helper overview.
- [Integrations](/guide/integrations/) — framework-specific setup (VitePress, Nextra, Fumadocs, Docusaurus, Astro).
- [Providers and models](/guide/providers-and-models/) — provider presets, `uiModels`, `localeModels`, fallback chains.
- `docs/guide/images-and-screenshots/` — screenshots and SVG assets in translated documentation.
- `docs/reference/architecture.md` — how extract and translation pipelines fit together.
