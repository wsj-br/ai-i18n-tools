# Astro website example (ai-i18n-tools)

This example shows how to take a **vanilla** Astro marketing site (one English page with hardcoded copy) and wire it for **multiple locales** using:

1. [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) — URL prefixes such as `/`, `/de/`, `/pt-br/`
2. **ai-i18n-tools** — two complementary translation paths:
   - **`translate-docs`** — full `.astro` page copies with translated HTML
   - **`extract` + `translate-ui` + `t()`** — dynamic strings in frontmatter (screenshot tab labels, arrays, and similar)

To run **all** enabled steps in one go — UI extract, UI translation, and document (`.astro`) translation — use `pnpm i18n:sync` (or `ai-i18n-tools sync` from the repo root). That is the usual command after you change English copy or add `t('…')` calls; see [Sync (one command)](#sync-one-command) below.

You do not need i18next or `ai-i18n-tools/runtime` for this static site; translations are resolved at **build time** (SSG).

For catalog vs flat JSON key shapes, see [`docs/ai-i18n-tools-context.md`](../../docs/ai-i18n-tools-context.md) in the main repo.

---

## From vanilla Astro to a multilingual site

### Starting point (typical vanilla site)

- Single page: `src/pages/index.astro` with English text in the template
- `astro.config.mjs` with Tailwind (or other integrations) only — **no** `i18n` block
- No locale folders, no `t()` helper

### What this example adds

| Area             | Change                                                                                                     |
|------------------|------------------------------------------------------------------------------------------------------------|
| **Astro**        | `i18n.locales`, `defaultLocale`, `routing.prefixDefaultLocale: false`                                      |
| **Pages**        | English source at `src/pages/index.astro`; one `index.astro` per target locale under `src/pages/{locale}/` |
| **Layout**       | `MainLayout.astro` sets `<html lang>` and `<html dir>` from `Astro.currentLocale`                          |
| **UI**           | `LanguagePicker.astro` using `astro:i18n` `getRelativeLocaleUrl`                                           |
| **i18n helpers** | `src/i18n/t.ts`, `utils.ts`, `locale.ts`, generated `ui-languages.json`                                    |
| **Bundles**      | `public/locales/{locale}.json` — English source text as keys (from `translate-ui`)                         |
| **Catalog**      | `src/i18n/strings.json` — extraction cache for the CLI (not used at runtime by `makeT`)                    |
| **Tooling**      | `ai-i18n-tools.config.json` + `package.json` scripts                                                       |

```text
vanilla                          this example
────────                         ────────────
src/pages/index.astro     →      src/pages/index.astro          (en source)
                                 src/pages/de/index.astro       (generated / synced)
                                 src/pages/pt-br/index.astro
                                 …
                                 src/i18n/t.ts, utils.ts, locale.ts
                                 public/locales/de.json, pt-BR.json, …
                                 src/i18n/ui-languages.json
astro.config (no i18n)    →      astro.config.mjs (i18n.locales, …)
```

---

## URL layout and locales

| URL       | File                             | `Astro.currentLocale`           |
|-----------|----------------------------------|---------------------------------|
| `/`       | `src/pages/index.astro`          | `en` (default)                  |
| `/de/`    | `src/pages/de/index.astro`       | `de`                            |
| `/pt-br/` | `src/pages/pt-br/index.astro`    | `pt-br`                         |
| …         | `src/pages/{locale}/index.astro` | matches folder name (lowercase) |

`prefixDefaultLocale: false` keeps English at `/` without `/en/` (same idea as [hide default language in the URL](https://docs.astro.build/en/recipes/i18n/#hide-default-language-in-the-url) in the Astro i18n recipe).

Locale metadata (`label`, `direction`, BCP-47 `code`) lives in `src/i18n/ui-languages.json` (`ui.uiLanguagesPath` in config). Regenerate it after changing `targetLocales`:

```bash
pnpm i18n:locales
```

Keep **three lists aligned** when you add or remove a language:

1. `targetLocales` (+ `sourceLocale`) in `ai-i18n-tools.config.json`
2. `i18n.locales` in `astro.config.mjs` (Astro uses **lowercase** route codes: `zh-cn`, `pt-br`)
3. Regenerated `src/i18n/ui-languages.json`

Flat bundle **filenames** use config casing (`pt-BR.json`, `zh-Hans.json`); `src/i18n/locale.ts` maps Astro’s `pt-br` route to manifest code `pt-BR` when loading JSON.

---

## Astro changes for multiple locales

### `astro.config.mjs`

```js
export default defineConfig({
  integrations: [tailwind()],
  i18n: {
    locales: ['en', 'de', 'fr', 'es', 'ar', 'ja', 'ko', 'zh-cn', 'zh-tw', 'pt-br'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,  // English at /, others at /{locale}/
    },
  },
});
```

- Every code in `locales` must have a matching page (or Astro will not emit that route).
- English uses `src/pages/index.astro` at the root of `pages/`, not `src/pages/en/`.

### `MainLayout.astro`

Uses `resolveUiLanguage(Astro.currentLocale)` so each built page gets correct `lang` and `dir` (including RTL for `ar`):

```astro
const ui = resolveUiLanguage(Astro.currentLocale);
---
<html lang={ui.code} dir={ui.direction}>
```

### `LanguagePicker.astro`

Uses Astro’s built-in helpers (not the recipe’s manual `getLangFromUrl`):

```astro
import { getRelativeLocaleUrl } from 'astro:i18n';
// …
<a href={getRelativeLocaleUrl(code)} hreflang={code} dir={row.direction}>
```

---

## ai-i18n-tools configuration

`ai-i18n-tools.config.json` in this folder enables both pipelines:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "es", "ar", "ja", "ko", "zh-Hans", "zh-Hant", "pt-BR"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/i18n/strings.json",
    "flatOutputDir": "public/locales",
    "uiLanguagesPath": "src/i18n/ui-languages.json",
    "uiExtractor": {
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro"],
      "funcNames": ["t", "i18n.t"]
    }
  },
  "documentations": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "markdownOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

- `markdownOutput.style: "astro-starlight"` writes `src/pages/de/index.astro`, `src/pages/fr/index.astro`, etc., and fixes relative imports (`../` → `../../` where needed).
- `addFrontmatter: false` avoids wrapping translated pages in YAML metadata.

Scaffold a similar config from the template (UI extraction only — merge in the `documentations[]` block above for page HTML):

```bash
npx ai-i18n-tools init -t ui-astro-website
```

---

## Pipeline 1: Translate `.astro` page HTML (`translate-docs`)

Use this for **most visible copy**: headings, paragraphs, `alt` text, button labels in the template body.

### How it works

1. You edit **only** the English source: `src/pages/index.astro`.
2. `pnpm i18n:translate` runs `translate-docs`, which:
   - Extracts translatable text nodes and attributes from the template
   - Skips `t('…')` literals, `<script>`, `<style>`, and protected expression attributes (`class`, `id`, …)
   - Writes one `.astro` file per target locale under `src/pages/{locale}/`
3. `pnpm build` compiles each locale route separately.

### Workflow

```bash
# Edit HTML copy in src/pages/index.astro, then:
pnpm i18n:translate   # OPENROUTER_API_KEY required
pnpm build
pnpm preview
```

Optional protection for custom JSX attribute names or object keys in `{expression}` blocks: `documentations[].protectAttributes` / `protectKeys` (see [GETTING_STARTED — protectAttributes / protectKeys](../../docs/GETTING_STARTED.md#protectattributes-protectkeys)).

### After changing English HTML

Re-run `pnpm i18n:translate` so locale pages stay in sync. Review diffs under `src/pages/de/`, etc.

---

## Pipeline 2: UI strings with `t()` (`extract` + `translate-ui`)

Use this for **data in frontmatter** or inline arrays/objects that should not be duplicated as separate translated `.astro` files — for example screenshot tab labels:

```astro
const screenshots = [
  { src: '…', label: t('Translate'), icon: '🌐' },
  { src: '…', label: t('Transform'), icon: '✨' },
  // …
];
```

Template usage stays `{s.label}`; no change in the HTML section.

### Wiring (per page)

Add to the frontmatter of **every** locale page that uses `t()` (English and `src/pages/{locale}/index.astro` copies):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

`makeT` in `src/i18n/t.ts` looks up **`flat[englishSource]`** in `public/locales/{code}.json` (e.g. `"Translate": "Traduzir"`). It does **not** read `strings.json` at runtime.

### Workflow

```bash
# After adding or changing t('…') literals in src/:
pnpm i18n:extract        # → src/i18n/strings.json (catalog cache)
pnpm i18n:translate-ui   # OPENROUTER_API_KEY → public/locales/de.json, pt-BR.json, …
pnpm build
```

For `sourceLocale` (`en`), missing keys fall back to the English literal passed to `t()`; `public/locales/en.json` may be `{}`.

### Why both pipelines do not clash

`translate-docs` treats string literals inside `t('…')` as **protected** and leaves them unchanged. Those strings are translated only via `translate-ui` into `public/locales/*.json`.

---

## Sync (one command)

When both pipelines are enabled in `ai-i18n-tools.config.json` (as in this example), `sync` runs every step that config allows, in order:

1. **`extract`** — scan `src/` for `t('…')` → `src/i18n/strings.json`
2. **`translate-ui`** — catalog → `public/locales/*.json`
3. **`translate-docs`** — English `src/pages/index.astro` → `src/pages/{locale}/index.astro`

```bash
pnpm i18n:sync          # or: ai-i18n-tools sync
pnpm build
pnpm preview
```

Set `OPENROUTER_API_KEY` before running sync (translation steps call OpenRouter). Use the individual scripts (`i18n:extract`, `i18n:translate-ui`, `i18n:translate`) only when you need a single step in isolation — for example re-translating page HTML without touching UI strings.

`sync` does **not** run `generate-ui-languages`; after adding or removing a locale in config, run `pnpm i18n:locales` separately and update `astro.config.mjs`.

---

## File reference

```text
examples/astro-website/
├── astro.config.mjs              # i18n.locales, defaultLocale, routing
├── ai-i18n-tools.config.json     # sourceLocale, targetLocales, ui + documentations
├── package.json                  # i18n:* scripts
├── public/locales/
│   ├── en.json                   # optional; often {} (fallback to source text)
│   ├── de.json                   # "English key": "translation"
│   └── pt-BR.json
├── src/
│   ├── i18n/
│   │   ├── t.ts                  # loadFlatBundle, makeT
│   │   ├── utils.ts              # resolvePageLocale, useTranslations
│   │   ├── locale.ts             # Astro locale ↔ ui-languages row
│   │   ├── ui-languages.json     # generate-ui-languages
│   │   └── strings.json          # extract catalog (CLI only)
│   ├── layouts/MainLayout.astro  # lang + dir
│   ├── components/LanguagePicker.astro
│   └── pages/
│       ├── index.astro           # English source (edit this)
│       ├── de/index.astro        # from translate-docs (+ same t() frontmatter)
│       └── pt-br/index.astro
```

`src/components/SiteContent.astro` is an alternate full-page demo using the same `t()` helpers; the live site uses inline content in `index.astro`.

---

## Commands (quick reference)

| Script                   | Command                  | Purpose                                            |
|--------------------------|--------------------------|----------------------------------------------------|
| Dev                      | `pnpm dev`               | Local dev (single locale per URL)                  |
| Build                    | `pnpm build`             | Static build for all locales                       |
| Page HTML (.astro files) | `pnpm i18n:translate`    | `translate-docs` → `src/pages/{locale}/`           |
| UI extract               | `pnpm i18n:extract`      | Scan `t('…')` → `strings.json`                     |
| UI translate             | `pnpm i18n:translate-ui` | → `public/locales/*.json`                          |
| Manifest                 | `pnpm i18n:locales`      | → `ui-languages.json`                              |
| **All steps**            | `pnpm i18n:sync`         | `extract` + `translate-ui` + `translate-docs` (per config) |

Set `OPENROUTER_API_KEY` for translate commands that call the API.

---

## Recommended edit loop

1. Change **English HTML** and/or **`t('…')` strings** in `src/pages/index.astro`
2. **`pnpm i18n:sync`** — runs extract, UI translation, and page HTML translation in one command (or run the individual scripts from [Commands](#commands-quick-reference) if you only need one pipeline)
3. If you changed frontmatter imports/paths on the English page, sync already re-runs `translate-docs`; otherwise copy the frontmatter block into locale pages manually
4. `pnpm build` and spot-check `/`, `/de/`, `/pt-br/`
5. After changing `targetLocales`, run `pnpm i18n:locales` and update `astro.config.mjs` `i18n.locales`

---

## Further reading

- [Astro i18n guide](https://docs.astro.build/en/guides/internationalization/)
- [Astro i18n recipe](https://docs.astro.build/en/recipes/i18n/) (`useTranslations` pattern; this example uses `Astro.currentLocale` + flat JSON instead of a hand-written `ui` object)
- [GETTING_STARTED — Astro website (hybrid)](../../docs/GETTING_STARTED.md#astro-website)
- [GETTING_STARTED — Astro website UI strings](../../docs/GETTING_STARTED.md#astro-website-ui-strings)
- [GETTING_STARTED — Astro website pages (parse-and-replace)](../../docs/GETTING_STARTED.md#astro-website-parse-and-replace)
- [ai-i18n-tools-context — Astro hybrid workflow](../../docs/ai-i18n-tools-context.md#astro-hybrid)
