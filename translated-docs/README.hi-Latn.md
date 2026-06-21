<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

Bade bhasha model ka upyog karke JavaScript/TypeScript application aur documentation site ko internationalize karne ke liye ek CLI aur toolkit. Yah [OpenRouter](https://openrouter.ai/) aur kisi bhi OpenAI-compatible provider (OpenAI, Anthropic, Gemini, DeepSeek, Groq, Mistral, xAI, Cerebras, NVIDIA, Alibaba, APIFUN, Ollama, aur bahut kuch) ke saath kaam karta hai. Teen modular workflow, sabhi ek single config file share karte hain, jo alag-alag translation ki zarooraton ko support karte hain:

- **Workflow 1 — UI Translation:** JS/TS se `t("…")` calls (aur optional roop se `.astro` files se) nikalta hai aur i18next ya static SSG lookup ke liye flat, per-locale JSON generate karta hai.
- **Workflow 2 — Document Translation:** `docs[].contentPaths` mein list kiye gaye markdown, MDX, aur `.astro` pages (websites aur Starlight ke liye) ko `translate-docs` ka upyog karke translate karta hai.
- **Workflow 3 — JSON File Translation:** `json[]` mein define kiye gaye arbitrary nested JSON bundles ko translate karta hai. `translate-json` ka upyog tab karein jab UI copy source mein `t()` ka upyog karne ke bajaye per-locale JSON files mein store ki jaati hai.

**SVG** assets ko `features.translateSVG`, top-level `svg` block, aur `translate-svg` ka upyog karke translate kiya jaata hai — `docs[].contentPaths` ka nahi.

**Mujhe kaun sa workflow use karna chahiye?**
- Source `t()` ka upyog karta hai → **Workflow 1** (`extract` / `translate-ui`)
- Localized pages ya Docusaurus catalog JSON → **Workflow 2** (`translate-docs`)
- Sirf standalone, nested JSON locale files → **Workflow 3** (`translate-json`)

Sabhi workflow ek file/SQLite cache maintain karte hain taaki yeh sunishchit kiya ja sake ki sirf naye ya badle hue segments (strings ya text chunks) hi LLM ko bheje jaate hain.

<small>**Anya bhashaon mein padhen:** </small>
<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Vishay-soochi**

- [Core workflows](#core-workflows)
- [Installation](#installation)
  - [CLI ka upyog karna](#using-the-cli)
- [LLM providers](#openrouter)
- [Turant shuru karein](#quick-start)
  - [Workflow 1 - UI Translation](#workflow-1---ui-translation)
  - [Workflow 2 - Document Translation](#workflow-2---document-translation)
  - [Astro (plain Astro & Starlight)](#astro-plain-astro--starlight)
  - [Sanyukt workflow](#combined-workflow)
- [Runtime helpers](#runtime-helpers)
- [CLI commands](#cli-commands)
- [Documentation](#documentation)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## Core workflows

**Workflow 1 - UI Translation** — i18next (React, Next.js, Node.js, CLIs) ya static Astro SSG ka upyog karne wale kisi bhi JS/TS project ke liye

Source files ko `t("…")` / `i18n.t("…")` literals ke liye scan karta hai (Astro frontmatter aur template expressions ke liye `ui.uiExtractor.extensions` mein `.astro` jodein), ek master catalog (`strings.json`) banata hai, OpenRouter ke madhyam se har locale ke liye missing entries ko translate karta hai, aur flat JSON files (`de.json`, `pt-BR.json`, …) likhta hai. English source text un bundles mein runtime lookup key hai — `strings.json` extraction cache hai, runtime bundle nahi.

**Workflow 2 - Document Translation** — `docs[].contentPaths` ke antargat markdown, MDX, aur `.astro` ke liye

Mukhya roop se **markdown, MDX, aur `.astro` documentation** (Docusaurus, [Astro Starlight](https://starlight.astro.build/), plain README files, aur plain Astro marketing pages) ke liye design kiya gaya hai. `translate-docs` ek shared SQLite cache ke saath localized copies likhta hai. Docusaurus sites par, `docs[].docusaurusCatalogDir` ko `write-translations` catalog folder par set karein taaki shell JSON (navbar, footer, theme strings) ko usi command mein translate kiya ja sake. `docs[].docsOutput.style` `"nested"`, `"flat"`, `"doc-system"`, aur aliases `"docusaurus"` / `"astro-starlight"` ko support karta hai (Getting Started mein [Output layouts](docs/GETTING_STARTED.hi-Latn.md#output-layouts) dekhein). Arbitrary nested UI JSON jo Docusaurus catalog nahi hai, Workflow 3 (`json[]` / `translate-json`) mein aata hai, `docs[]` mein nahi.

**Workflow 3 - JSON file translation** — source mein `t()` ke bina nested locale JSON

Files ko translate karein jaise ki `src/i18n/en/translation.json` top-level `json[]`, `features.translateJson`, aur `translate-json` ke maadhyam se. `init -t ui-json-bundles` ke saath scaffold karein.

Sabhi workflows `ai-i18n-tools.config.json` share karte hain aur unhein joda ja sakta hai; `sync` extract, UI translation, translate SVG, `translate-docs`, aur `translate-json` ko aapke `features` flags ke anusaar chalata hai.

---

<a id="installation"></a>
## Sthaapana

Prakashit package **ESM-only** (`"type": "module"`) hai. Node.js `>=22.16.0` aavashyak hai.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### CLI ka upyog karna

**Prati-project (sifarish kiya gaya)** — ek dev dependency ke roop mein install karein, phir `npx`, `pnpm exec`, ya ek `package.json` script ke maadhyam se chalayein:

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Aap ai-i18n-tools CLI commands ka seedhe upyog bhi kar sakte hain, jaise ki `ai-i18n-tools sync`.

`extract`, `translate-ui`, `translate-svg`, `translate-docs`, aur `translate-json` ko haath se chain karne ke bajaye `sync` ko prefer karein — order aur feature flags manually chalane par galat ho sakte hain. Getting Started mein [Recommended `package.json` scripts](docs/GETTING_STARTED.hi-Latn.md#recommended-packagejson-scripts) dekhein.

**Zero-install one-off** — `npx ai-i18n-tools <cmd>` ya `pnpm dlx ai-i18n-tools <cmd>` (sirf us invocation ke liye download karta hai).

> **Tip:** `npx` ke bina ek interactive shell mein `ai-i18n-tools` ko seedhe chalane ke liye, `node_modules/.bin` ko apne `PATH` mein jodein (bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`). direnv aur Windows instructions ke liye [Getting Started](docs/GETTING_STARTED.hi-Latn.md#installation) dekhein.

Apni provider API key set karein (OpenRouter dikhaya gaya hai; apne provider ke liye matching variable ka upyog karein):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## LLM providers

Translation commands (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models`, aur sambandhit scripts) ek LLM provider ko call karte hain; `check-markdown` nahi karta.

Providers ko top-level `providers` map ke tahat configure karein aur active wale ko top-level `provider` selector ke saath chunein (jab theek ek provider configure kiya gaya ho to optional). Adhikansh providers ko sirf ek `translationModels` list ki zaroorat hoti hai — `baseUrl` aur API-key environment variable ek built-in preset se aate hain; aap `baseUrl`, `apiKeyEnv`, `headers`, `maxTokens`, `temperature`, aur `requestTimeoutMs` ko prati provider override kar sakte hain. `requestTimeoutMs` har request ke liye intezaar karne ka adhiktam samay milliseconds mein hai (default `30000`).

Config ko edit kiye bina ek single run ke liye providers switch karne ke liye, global `-P` / `--provider <name>` option pass karein (jaise `ai-i18n-tools -P groq translate-ui`); naam configured `providers` keys mein se ek hona chahiye.

```jsonc
{
  "provider": "openrouter",
  "providers": {
    "openrouter": { "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"] },
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

Built-in provider presets (key — base URL — API-key env var):

| Provider | Base URL | API-key env var |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (koi nahi) |

`baseUrl` (aur `apiKeyEnv` jab tak ki use kisi key ki zaroorat na ho) ke saath ek nayi key jodkar ek custom OpenAI-compatible provider define karein. Model ids plain upstream ids hain — provider ko config level par chuna jaata hai, isliye kisi `provider/` prefix ki zaroorat nahi hai (OpenRouter ids apne native `vendor/model` form ko barkarar rakhte hain).

Token usage har provider ke liye report kiya jaata hai; exact USD cost tabhi dikhaya jaata hai jab provider ise return karta hai (OpenRouter). `ai-i18n-tools check-models` active provider ki live `GET /models` list (koi bhi provider) ke khilaaf configured model ids ko validate karta hai, aur jab provider ise return karta hai (jaise OpenRouter) to pricing dikhata hai. `ai-i18n-tools list-models` har us model ko list karta hai jise active provider advertise karta hai (kisi anya configured provider ka nireekshan karne ke liye `-P` / `--provider` ka upyog karein).

Ek legacy top-level `openrouter` config block abhi bhi swikar kiya jaata hai aur load hone par automatically `providers.openrouter` (`provider: "openrouter"` ke saath) mein migrate ho jaata hai.

Ek single document par `-P` ke saath providers ko switch karne ka hands-on demo dekhne ke liye, [`examples/multi-provider`](../examples/multi-provider/) dekhein (`openai`, `anthropic`, `nvidia`, aur `deepseek` ke saath ek config).

---

<a id="quick-start"></a>
## Turant shuru karein

<a id="workflow-1---ui-translation"></a>
### Workflow 1 - UI Translation

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Phir `'ai-i18n-tools/runtime'` se helpers ka upyog karke apne app mein i18next ko wire karein. Poore setup ke liye Getting Started guide mein [Step 4: Wire i18next at runtime](docs/GETTING_STARTED.hi-Latn.md#step-4-wire-i18next-at-runtime) dekhein.

<a id="workflow-2---document-translation"></a>
### Workflow 2 - Document Translation

Default `init` template (`ui-markdown`) kewal UI extraction ko enable karta hai. Docs-oriented template ka upyog karein (ya `features.translateDocs` ko enable karein aur `docs[]` jodein) `translate-docs` se pehle:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

`ai-i18n-tools.config.json` ko edit karein: `docs[].contentPaths` ko markdown, MDX, aur/ya `.astro` sources par set karein; `docs[].outputDir` aur `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"flat"`, aadi). Poora field reference: [Workflow 2 - Document Translation](docs/GETTING_STARTED.hi-Latn.md#workflow-2---document-translation).

<a id="astro-plain-astro--starlight"></a>
### Astro (plain Astro & Starlight)

**Astro Starlight** — `init -t ui-starlight`, phir `translate-docs`. Starlight UI overrides ko ek alag `docs[]` block mein `src/content/i18n/en.json` ke saath `jsonPathTemplate` ka upyog kar sakte hain jab zaroorat ho ([Shuruat karna → Workflow 2](docs/GETTING_STARTED.hi-Latn.md#step-1-initialise-for-documentation)).

**Sadharan Astro** (marketing ya app sites, Starlight nahi) — [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) ko ai-i18n-tools ke saath jodein. Sandarbh project: [`examples/astro-website`](../examples/astro-website/) (English `/` par, locales `/{locale}/` par).

Adhikansh teamein do pipelines ka **hybrid** upyog karti hain:

| Pipeline | Iske liye upyog karein | Commands | Output |
|----------|---------|----------|--------|
| **Page HTML** | Headings, paragraphs, nav labels, template body mein inline arrays | `translate-docs` | `src/pages/{locale}/index.astro` har locale ke liye |
| **UI strings (`t()`)** | Frontmatter data, tab labels, shared arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (key ke roop mein English source) |

`init -t ui-astro-website` ke saath UI scaffold karein. `.astro` pages mein hardcoded HTML ke liye, `features.translateDocs` enable karein aur `docsOutput.style: "astro-starlight"` ke saath ek `docs[]` block jodein ([Astro website pages (parse-and-replace)](docs/GETTING_STARTED.hi-Latn.md#astro-website-pages-parse-and-replace) dekhein). `targetLocales`, `i18n.locales` ko `astro.config.mjs` mein, aur `ui-languages.json` ko align rakhein (Astro routes lowercase codes ka upyog karte hain jaise `pt-br`; flat bundle filenames config casing ka palan karte hain, jaise `pt-BR.json`).

Build time par `t()` ko i18next ke bina wire karein jab tak aap client islands nahi jodte — [Astro website UI strings (SSG)](docs/GETTING_STARTED.hi-Latn.md#astro-website-ui-strings-ssg) aur example ke `src/i18n/t.ts` ko dekhein.

<a id="combined-workflow"></a>
### Sanyukt workflow

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## Runtime helpers

Nimnalikhit helpers `'ai-i18n-tools/runtime'` se export kiye jaate hain aur kisi bhi JavaScript environment mein kaam karte hain. Inka upyog karne ke liye aapko i18next import karne ki zaroorat nahi hai:

| Helper | Vivaran |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)` | Key-as-default setups ke liye standard i18next init options. |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Anushansit wiring: key-trim + plural `wrapT` `strings.json` se, vikalp roop se `translate-ui` `{sourceLocale}.json` plural keys ko merge karta hai. |
| `wrapT(i18n, options)` | Lower-level plural-aware `t()` wrapper (aam taur par `setupKeyAsDefaultT` dwara install kiya jaata hai). |
| `buildPluralIndexFromStringsJson(entries)` | Plural group index banata hai jiska upyog `wrapT` `"plural": true` ke saath catalog rows se karta hai. |
| `extractInterpolationNamesForWrap(key)` | `wrapT` / key-trim fallback ke liye source key se `{{var}}` names ko parse karta hai. |
| `wrapI18nWithKeyTrim(i18n)` | Lower-level key-trim wrapper keval (app wiring ke liye deprecated; `setupKeyAsDefaultT` ko prefer karein). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | `makeLoadLocale` ke liye `localeLoaders` map banata hai `ui-languages.json` se (har `code` `sourceLocale` ko chhodkar). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Async locale file loading ke liye factory. |
| `getTextDirection(lng)` | BCP-47 code ke liye `'ltr'` ya `'rtl'` lautata hai. |
| `applyDirection(lng, element?)` | `document.documentElement` par `dir` attribute set karta hai. |
| `getUILanguageLabel(lang, t)` | ek bhasha menu row ke liye display label (i18n ke saath). |
| `getUILanguageLabelNative(lang)` | `t()` ko call kiye bina display label (header-style). |
| `interpolateTemplate(str, vars)` | ek saadhaaran string par low-level `{{var}}` substitution (internally upyog kiya jaata hai; app code ko iske bajaye `t()` ka upyog karna chahiye). |
| `flipUiArrowsForRtl(text, isRtl)` | RTL layouts ke liye `→` ko `←` mein flip karein. |

---

<a id="cli-commands"></a>
## CLI commands

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools lint-source …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

Pratyek command ke liye flag lists [Getting Started — CLI reference](docs/GETTING_STARTED.hi-Latn.md#cli-reference) mein hain. Built-in upyog text ke liye `ai-i18n-tools <command> --help` chalaayein.

Har command par global options: `-c <config>` (default: `ai-i18n-tools.config.json`), `-v` (verbose), `-P` / `--provider <name>` (active LLM provider ko override karein; `providers` ke tahat configure kiya jaana chahiye), optional `-w` / `--write-logs [path]` console output ko ek log file mein tee karne ke liye (default: translation cache directory ke tahat), `-V` / `--version`, aur `-h` / `--help`. Kai commands `-l` / `--locale <codes>` (comma-separated BCP-47) ko target locales ko seemit karne ke liye swikaar karte hain; `lint-source` ek single source locale ka upyog karta hai. Command overview table ke liye [Getting Started](docs/GETTING_STARTED.hi-Latn.md#cli-reference) dekhein.

---

<a id="documentation"></a>
## Documentation

- [Getting Started](docs/GETTING_STARTED.hi-Latn.md) - sabhi workflows ke liye poora setup (UI, docs/`.astro`, JSON bundles, Astro Starlight aur plain Astro), CLI reference, aur config field reference.
- [Locale assets guide](docs/LOCALE-ASSETS-GUIDE.hi-Latn.md) - translated docs mein screenshots aur illustrated SVGs (Patterns A–E, flat link rewriter, screenshot scripts).
- [Package Overview](docs/PACKAGE_OVERVIEW.hi-Latn.md) - architecture, internals, programmatic API, aur extension points.
- [AI Agent Context](../docs/ai-i18n-tools-context.md) - **package ka upyog karne wale apps ke liye:** downstream projects ke liye integration prompts (apne repo ke agent rules mein copy karein).
- **Is** repository ke liye Maintainer internals: `dev/package-context.md` (clone-only; npm par nahi).

---

<a id="license"></a>
## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
