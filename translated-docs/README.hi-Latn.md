<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Apne pasand ke AI model ka upyog karke apne app aur documentation ka anuvad karein: koi lock-in nahi, koi rewrites nahi.**

`ai-i18n-tools` JavaScript/TypeScript applications aur documentation sites ko internationalize karne ke liye ek CLI aur toolkit hai - jismein Docusaurus, Astro, Starlight, VitePress, Nextra, Fumadocs, aur plain Markdown/MDX shaamil hain - bade bhasha models ka upyog karke.

Built-in presets (**OpenAI**, **Anthropic**, **Google Gemini**, **NVIDIA**, **DeepSeek**, **Groq**, **Mistral**, **xAI**, **Cerebras**, **Alibaba**, **APIFUN**, **OpenRouter**, **Ollama**) mein se chunein ya kisi bhi OpenAI-compatible API ko point karein. Apne codebase ko modify kiye bina har project—ya har language—ke liye providers ya models badlein.

Ek config file teen anuvad modes ko chalati hai, isliye aap apni content structure ke aadhar par mix aur match kar sakte hain:

- **UI strings** — JS/TS (aur vikalp roop se `.astro` files) se `t("…")` calls nikalta hai aur i18next ya static SSG lookup ke liye flat, per-locale JSON generate karta hai.
- **Documents** — Markdown, MDX, aur `.astro` pages ko translate karta hai jo `docs[].contentPaths` mein `translate-docs` ka upyog karke soochibaddh hain. **VitePress**, **Starlight**, **Docusaurus**, **Nextra**, **Fumadocs**, Astro-based sites, ya kisi bhi static site generator ke saath kaam karta hai jo Markdown/MDX/`.astro` source files se padhta hai.
- **JSON** — `json[]` mein paribhashit manmaane nested JSON bundles ko translate karta hai. `translate-json` ka upyog karein jab UI copy source mein `t()` calls ke bajaye per-locale JSON files mein rehti ho.

**SVG** assets ko apna alag path milta hai: `features.translateSVG`, top-level `svg` block, aur `translate-svg`—na ki `docs[].contentPaths`.

**Mujhe kaun sa upyog karna chahiye?**

| Aapki content                                                                 | Command                                     |
|-------------------------------------------------------------------------------|---------------------------------------------|
| Source code `t()` ka upyog karta hai                                        | **UI strings** — `extract` / `translate-ui` |
| Localized pages ya docs sites (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, aadi) | **Documents** — `translate-docs` |
| Standalone, nested JSON locale files                                          | **JSON** — `translate-json`                 |

Teeno ek file/SQLite cache share karte hain, isliye keval naye ya badle hue segments (strings ya text chunks) hi model ko dobara bheje jaate hain — reruns tez aur saste hote hain chahe aap koi bhi provider upyog kar rahe hon.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Vishay-soochi**

- [Anuvad ke prakar](#translation-types)
- [Installation](#installation)
  - [CLI ka upyog karna](#using-the-cli)
- [LLM providers](#llm-providers)
- [Turant shuru karein](#quick-start)
  - [UI stringein](#ui-strings)
  - [Dastavej](#documents)
  - [VitePress](#vitepress)
  - [Nextra](#nextra)
  - [Fumadocs](#fumadocs)
  - [Astro (plain Astro & Starlight)](#astro-plain-astro--starlight)
  - [Combined sync](#combined-sync)
- [Runtime helpers](#runtime-helpers)
- [CLI commands](#cli-commands)
  - [Tool UI language (logs, help, dashboard)](#tool-ui-language-logs-help-dashboard)
- [Documentation](#documentation)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="translation-types"></a>
## Translation types

Har anuvad prakar ki apni guide hai jismein poore configuration details hain: [UI strings](../docs/guide/ui-strings/), [Documents](../docs/guide/documents/), aur [JSON](../docs/guide/json.md). Side-by-side tulna ke liye [What is ai-i18n-tools?](../docs/guide/what-is-ai-i18n-tools.md) dekhein.

Kuchh baatein jo shuru mein jaan lena zaroori hain: UI strings active LLM provider (dekhein [LLM providers](#llm-providers)) ke madhyam se har locale ke liye missing entries ko translate karta hai aur flat JSON files (`de.json`, `pt-BR.json`, …) likhta hai, jismein English source text runtime lookup key ke roop mein hota hai — `strings.json` extraction cache hai, na ki runtime bundle. Documents `docs[].docsOutput.style` values `"nested"`, `"flat"`, `"doc-system"`, aur aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` ko support karta hai (dekhein [Output layouts](../docs/guide/documents/output-layouts.md)). Teeno `ai-i18n-tools.config.json` share karte hain aur combine kiye ja sakte hain; `sync` aapke `features` flags ke anusaar extract, UI translation, translate SVG, `translate-docs`, aur `translate-json` ko kram mein chalata hai.

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

Apne project mein package install karne ke baad, npm/pnpm/yarn link published bin entry (`bin/ai-i18n-tools.mjs`) ko `node_modules/.bin/ai-i18n-tools` mein. Vah shim installed package se compiled CLI load karta hai.

Ek interactive shell mein nange `ai-i18n-tools` command ko type karne ke liye, neeche diye gaye vikalpon mein se kisi ek ko configure karein. Setup ke bina, shell binary ko dhoondh nahi payega, bhale hi local install ke baad bhi.

**direnv** — project root mein ek `.envrc` mein jodein (bash/zsh; [direnv.net](https://direnv.net/) dekhein):

```bash
PATH_add node_modules/.bin
```

`direnv allow` ke baad, nanga command tab uplabdh hota hai jab bhi aap project mein `cd` karte hain.

**Manual PATH** — ek interactive shell mein project root se:

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**Global install** — CLI ko ek baar install karein aur ise kisi bhi directory se invoke karein:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Ek global install globally pinned version ka upyog karta hai. Per-project version pinning ke liye, direnv ya manual PATH ko prefer karein taaki `node_modules/.bin` project ki dependency ko resolve kare.

**`package.json` scripts** — jab npm ya pnpm ek script chalata hai, to yah `node_modules/.bin` ko `PATH` mein prepends karta hai, isliye nanga command naam scripts ke andar shell PATH badlav ke bina kaam karta hai:

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

Phir chalaayein jaise `pnpm run i18n:sync` — scripts bina kisi atirikt shell setup ke local binary ko resolve karte hain.

**Vikalp** — agar aap `PATH` ko adjust karna pasand nahi karte hain: `npx ai-i18n-tools …` (npm) ya `pnpm exec ai-i18n-tools …` (pnpm). Bina kisi `package.json` entry ke zero-install one-off ke liye: `npx ai-i18n-tools <cmd>` ya `pnpm dlx ai-i18n-tools <cmd>`.

`extract`, `translate-ui`, `translate-svg`, `translate-docs`, aur `translate-json` ko manually chain karne ke bajaye `sync` ko prefer karein — manually chalane par order aur feature flags galat ho sakte hain. Quick start guide mein [Recommended `package.json` scripts](../docs/guide/quick-start.md#recommended-packagejson-scripts) dekhein.

Apne chune hue provider ke liye API key set karein (environment variable ke naam [LLM providers](#llm-providers) mein hain):

```bash
export PROVIDER_API_KEY=sk-your-key-here
```

---

<a id="llm-providers"></a>
## LLM providers

Translation commands (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models`, aur sambandhit scripts) ek LLM provider ko call karte hain; `check-markdown`, `mark-html`, aur `extract` nahin karte hain.

Providers ko top-level `providers` map ke tahat configure karein aur active wale ko top-level `provider` selector ke saath chunein (jab theek ek provider configure kiya gaya ho to optional). Adhikansh providers ko sirf ek `translationModels` list ki zaroorat hoti hai — `baseUrl` aur API-key environment variable ek built-in preset se aate hain; aap `baseUrl`, `apiKeyEnv`, `headers`, `maxTokens`, `temperature`, aur `requestTimeoutMs` ko prati provider override kar sakte hain. `requestTimeoutMs` har request ke liye intezaar karne ka adhiktam samay milliseconds mein hai (default `30000`).

Pratyek provider block par vikalpik model star:

- `translationModels` — vishvavyapi aadesh pratha (anuvaad visheshon ke liye avashyak).
- `uiModels` — UI-matra pratha (`translate-ui`, bahuvachan utpatti, `proofread-ui`): kisi bhi milte `localeModels` pravesh ke baad koshish ki jaati hai, `translationModels` se pehle.
- `localeModels` — pratyek-lok pratyakshikaran **sabhi** pipeline ke liye: pratyek pravesh ek BCP-47 lok ko ek aadeshit model suchi se jodta hai jo sirf us lok ke liye pehle koshish ki jaati hai (`pt-br` `pt-BR` se milta hai).

Samadhan kram: **UI** → `localeModels(locale)` → `uiModels` → `translationModels`; **docs / JSON / SVG** → `localeModels(locale)` → `translationModels`. Duplicate model ids ko chhodte hue kram banaye rakha jaata hai.

Config ko edit kiye bina ek single run ke liye providers switch karne ke liye, global `-P` / `--provider <name>` option pass karein (jaise `ai-i18n-tools -P groq translate-ui`); naam configured `providers` keys mein se ek hona chahiye.

```jsonc
{
  "provider": "ollama",
  "providers": {
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "openrouter": {
      "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"],
      "uiModels": ["anthropic/claude-sonnet-latest"],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
      ]
    },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

Built-in provider presets (key — base URL — API-key env var):

| Provider | Base URL | API-key env var | 
|---|---|---| 
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (koi nahi) |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |

`baseUrl` (aur `apiKeyEnv` jab tak ki use kisi key ki zaroorat na ho) ke saath ek nayi key jodkar ek custom OpenAI-compatible provider define karein. Model ids plain upstream ids hain — provider ko config level par chuna jaata hai, isliye kisi `provider/` prefix ki zaroorat nahi hai (OpenRouter ids apne native `vendor/model` form ko barkarar rakhte hain).

Token ka upyog har provider ke liye report kiya jaata hai; USD ki sahi laagat tabhi dikhai jaati hai jab provider ise wapas karta hai. `ai-i18n-tools check-models` sabhi configured model ids (`translationModels`, `uiModels`, aur har `localeModels` entry) ko active provider ki live `GET /models` list ke khilaaf validate karta hai, aur jab provider ise wapas karta hai to pricing dikhata hai. `ai-i18n-tools list-models` har us model ko list karta hai jise active provider advertise karta hai (kisi anya configured provider ka nireekshan karne ke liye `-P` / `--provider` ka upyog karein). `ai-i18n-tools bench-models` har unique configured model id (`translationModels`, `uiModels`, aur `localeModels`) ko ek sample ko alag se translate karke benchmark karta hai (models parallel mein chalte hain, `concurrency` dwara seemit) aur per-model input/output tokens, wall-clock time, aur USD cost print karta hai.

Ek single document par `-P` ke saath providers ko switch karne ke hands-on demo ke liye, [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/) dekhen.

---

<a id="quick-start"></a>
## Quick start

Pehle nange command ke liye apni shell configure karein — [Using the CLI](#using-the-cli) dekhein.

<a id="ui-strings"></a>
### UI strings

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
ai-i18n-tools init [-P <provider>]

# 2. Extract UI strings to strings.json
ai-i18n-tools extract

# 3. Translate to all target locales
ai-i18n-tools translate-ui
```

Phir `'ai-i18n-tools/runtime'` se helpers ka upyog karke apne app mein i18next ko wire karein. Poore setup ke liye UI strings guide mein [Step 4: Wire i18next at runtime](../docs/guide/ui-strings/i18next-runtime.md) dekhein.

<a id="documents"></a>
### Documents

Default `init` template (`ui-markdown`) kewal UI extraction ko enable karta hai. Docs-oriented template ka upyog karein (ya `features.translateDocs` ko enable karein aur `docs[]` jodein) `translate-docs` se pehle:

```bash
# Docusaurus docs + optional write-translations catalog
ai-i18n-tools init -t ui-docusaurus [-P <provider>]

# Astro Starlight documentation
# ai-i18n-tools init -t ui-starlight [-P <provider>]

# VitePress documentation (pages + theme catalog)
# ai-i18n-tools init -t ui-vitepress [-P <provider>]

# Nextra documentation (pages + _meta.ts + theme dictionary)
# ai-i18n-tools init -t ui-nextra [-P <provider>]

# Fumadocs documentation (pages + meta.json + UI catalog)
# ai-i18n-tools init -t ui-fumadocs [-P <provider>]

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# ai-i18n-tools init -t ui-astro-website [-P <provider>]

ai-i18n-tools translate-docs
ai-i18n-tools status
# ai-i18n-tools translate-docs --locale de   # single locale
```

`ai-i18n-tools.config.json` edit karein: `docs[].contentPaths` ko markdown, MDX, aur/ya `.astro` sources par set karein; `docs[].outputDir` aur `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, `"flat"`, aadi). Poora field reference: [Documents](../docs/guide/documents/).

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress` nav/sidebar/footer strings ke liye `docsOutput.style: "vitepress"` plus `docsOutput.vitepressThemeCatalog` ko scaffold karta hai. Page markdown aur theme catalog ko ek saath translate karne ke liye `sync` chalaayein — koi alag JSON pipeline nahi. [VitePress integration](../docs/guide/integrations/vitepress.md) aur [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) dekhein.

<a id="nextra"></a>
### Nextra

`init -t ui-nextra` `docsOutput.style: "nextra"` ko scaffold karta hai. `translate-docs` automatically `_meta.ts` sidebar labels ko collect aur translate karta hai; theme dictionary module (jaise `app/_dictionaries/en.ts`) ko bhi translate karne ke liye `docs[].nextraDictionaryPath` set karein — sab ek hi `sync` run mein, bina JSON sidecars ke. [Nextra integration](../docs/guide/integrations/nextra.md) aur [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/) dekhein.

<a id="fumadocs"></a>
### Fumadocs

`init -t ui-fumadocs` Nextra-style locale folders ke liye dot parser (default) ya dir parser ke saath `docsOutput.style: "fumadocs"` ko scaffold karta hai. `translate-docs` automatically `meta.json` sidebar labels ko collect aur translate karta hai; `lib/layout.shared.ts` mein UI overrides ko bhi translate karne ke liye `docsOutput.fumadocsUiCatalog` set karein — sab ek hi `sync` run mein, bina JSON sidecars ke. [Fumadocs integration](../docs/guide/integrations/fumadocs.md) aur [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) dekhein.

<a id="astro-plain-astro--starlight"></a>
### Astro (plain Astro & Starlight)

**Astro Starlight** — `init -t ui-starlight`, phir `translate-docs`. Starlight UI overrides ko ek alag `docs[]` block mein `src/content/i18n/en.json` ke saath `jsonPathTemplate` ka upyog kar sakte hain jab zaroorat ho ([Documents — documentation ke liye initialise karein](../docs/guide/documents/index.md#step-1-initialise-for-documentation)).

**Plain Astro** (marketing ya app sites, Starlight nahi) — [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) ko ai-i18n-tools ke saath combine karein. Reference project: [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (English `/` par, locales `/{locale}/` par).

Adhikansh teamein do pipelines ka **hybrid** upyog karti hain:

| Pipeline | Use for | Commands | Output |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **Page HTML** | Headings, paragraphs, nav labels, inline arrays in the template body | `translate-docs` | `src/pages/{locale}/index.astro` per locale |
| **UI strings (`t()`)** | Frontmatter data, tab labels, shared arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (key ke roop mein English source) |

`init -t ui-astro-website` ke saath UI scaffold karein. `.astro` pages mein hardcoded HTML ke liye, `features.translateDocs` ko enable karein aur `docsOutput.style: "astro-starlight"` ke saath ek `docs[]` block jodein ([Astro website pages (parse-and-replace)](../docs/guide/ui-strings/astro-website.md#astro-website-pages-parse-and-replace) dekhein). `targetLocales`, `astro.config.mjs` mein `i18n.locales`, aur `ui-languages.json` ko align rakhein (Astro routes `pt-br` jaise lowercase codes ka upyog karte hain; flat bundle filenames config casing ka palan karte hain, jaise `pt-BR.json`).

`t()` ko build time par i18next ke bina wire karein jab tak ki aap client islands na jodein — [Astro website UI strings (SSG)](../docs/guide/ui-strings/astro-website.md#astro-website-ui-strings-ssg) aur example ke `src/i18n/t.ts` ko dekhein.

<a id="combined-sync"></a>
### Sanyukt sync

```bash
ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
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
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [-P <provider>] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

Plain HTML apps ke liye, elements ko bare `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` markers ke saath annotate karein (source text element ke apne textContent / title / placeholder se liya gaya hai, ek baar likha gaya); `mark-html` unhein aapke liye insert karta hai aur `extract` phir unhein `strings.json` mein capture karta hai. [Marking HTML for translation](../docs/guide/ui-strings/plain-html.md#marking-html-for-translation) dekhein.

Prati command flag list [CLI reference](../docs/reference/cli-commands/) mein hain. Built-in upyog text ke liye `ai-i18n-tools <command> --help` chalaayein.

Global vikalp: `-c <config>` (default: `ai-i18n-tools.config.json`), `-v` (verbose), `-P` / `--provider <name>` (active LLM provider ko override karta hai; `providers` ke tahat configure kiya jaana chahiye), `-L` / `--ui-lang <code>` (tool ke apne UI/logs ke liye bhasha), `-V` / `--version`, aur `-h` / `--help` — har command par swikrit. `-w` / `--write-logs [path]` console output ko ek log file mein tees karta hai (default: translation cache directory ke tahat), lekin keval translation aur sync commands (`translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, `cleanup`) par prabhavi hota hai. Kai commands `-l` / `--locale <codes>` (comma-separated BCP-47) ko target locales ko seemit karne ke liye swikrit karte hain; `proofread-ui` ek single source locale ka upyog karta hai. Command overview ke liye [CLI reference](../docs/reference/cli-commands/) dekhein.

<a id="tool-ui-language-logs-help-dashboard"></a>
### Tool UI bhasha (logs, help, dashboard)

Yeh tool apni CLI help, log summaries, aur Translation Dashboard ko aapke translate kiye gaye locales se alag localize karta hai. Default roop se yeh aapke OS locale ko follow karta hai; isse config mein `-L pt-BR`, `export AI_I18N_LANG=es`, ya `"uiLanguage"` ke saath override karein. Locale resolution, shipped languages, aur dashboard behaviour ke liye [Tool UI language](../docs/guide/tool-ui-language.md) dekhein.

---

<a id="documentation"></a>
## Documentation

- [Documentation site](https://wsj-br.github.io/ai-i18n-tools/) — VitePress guide (GitHub Pages par 9 locales); poori guide ke links ke saath slim entry point.
- [Quick start](../docs/guide/quick-start.md) — UI strings, documents, aur JSON ke liye setup (UI, docs/`.astro`, JSON bundles, VitePress, Nextra, Fumadocs, Astro Starlight aur plain Astro).
- [Locale assets guide](../docs/guide/images-and-screenshots/) - anuvaadit docs mein screenshots aur illustrated SVGs (flat link rewriter, screenshot scripts).
- [Architecture](../docs/reference/architecture.md) - architecture, internals, programmatic API, aur extension points.
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - **un apps ke liye jo package ka upyog karte hain:** downstream projects ke liye integration prompts (apne repo ke agent rules mein copy karein).
- **Is** repository ke liye maintainer guide: `AGENT.md` (rules aur workflows; sirf clone karein; npm par nahi). Pipeline reference: `docs/reference/`. Local dev aur publishing: `dev/DEVEL.md`.

---

<a id="license"></a>
## License

Yah project MIT License ke tahat licensed hai.  
Vistrit jankari ke liye [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) file dekhen.

Copyright &copy; 2026 Waldemar Scudeller Jr.
