---
layout: doc
title: ai-i18n-tools
description: >-
  LLM ka upyog karke JavaScript/TypeScript applications aur documentation sites
  ko internationalize karne ke liye CLI aur toolkit.
---



# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Apne pasand ke AI model ka upyog karke apne app aur documentation ka anuvad karein: koi lock-in nahi, koi rewrites nahi.**

`ai-i18n-tools` JavaScript/TypeScript applications aur documentation sites - jismein Docusaurus, Astro, Starlight, VitePress, aur plain Markdown/MDX shamil hain - ko bade bhasha models ka upyog karke internationalize karne ke liye ek CLI aur toolkit hai.

Ise kisi bhi provider par point karein aur anuvad karna shuru karein: **OpenAI**, **Anthropic**, **Google Gemini**, **NVIDIA**, **DeepSeek**, **Groq**, **Mistral**, **xAI**, **Cerebras**, **Alibaba**, **APIFUN**, koi bhi [OpenRouter](https://openrouter.ai/) model (ek single API key ke saath chunne ke liye saikadon), ya **Ollama** poori tarah se self-hosted, offline anuvad ke liye. Providers ya models ko har project ke liye—ya har bhasha ke liye—bina apne codebase ko badle switch karein.

Ek config file teen anuvad modes ko chalati hai, isliye aap apni content structure ke aadhar par mix aur match kar sakte hain:

- **UI strings** — JS/TS (aur vikalp roop se `.astro` files) se `t("…")` calls nikalta hai aur i18next ya static SSG lookup ke liye flat, per-locale JSON generate karta hai.
- **Documents** — Markdown, MDX, aur `.astro` pages ko translate karta hai jo `docs[].contentPaths` mein `translate-docs` ka upyog karke list kiye gaye hain. **VitePress**, **Starlight**, **Docusaurus**, Astro-based sites, ya kisi bhi static site generator ke saath kaam karta hai jo Markdown/MDX/`.astro` source files se padhta hai.
- **JSON** — `json[]` mein paribhashit manmane nested JSON bundles ka anuvad karta hai. `translate-json` ka upyog karein jab UI copy source mein `t()` calls ke bajaye per-locale JSON files mein ho.

**SVG** assets ko apna alag path milta hai: `features.translateSVG`, top-level `svg` block, aur `translate-svg`—na ki `docs[].contentPaths`.

**Main kiska upyog karoon?**

| Aapki content                                                                 | Command                                     |
|-------------------------------------------------------------------------------|---------------------------------------------|
| Source code `t()` ka upyog karta hai                                        | **UI strings** — `extract` / `translate-ui` |
| Localized pages ya docs sites (VitePress, Starlight, Docusaurus, Astro, aadi) | **Documents** — `translate-docs`            |
| Standalone, nested JSON locale files                                          | **JSON** — `translate-json`                 |

Teeno ek file/SQLite cache share karte hain, isliye keval naye ya badle hue segments (strings ya text chunks) hi model ko dobara bheje jaate hain — reruns tez aur saste hote hain chahe aap koi bhi provider upyog kar rahe hon.

<a id="translation-types"></a>
## Translation types

Har anuvaad prakar ki apni ek guide hai jismein poore configuration details hain: [UI strings](/guide/ui-strings/), [Documents](/guide/documents/), aur [JSON](/guide/json). Side-by-side tulna ke liye [ai-i18n-tools kya hai?](/guide/what-is-ai-i18n-tools) dekhein.

Kuchh baatein jo pehle se jaan lena zaroori hain: UI strings active LLM provider ke zariye har locale ke liye missing entries ka anuvaad karta hai (dekhein [LLM providers](#llm-providers)) aur flat JSON files (`de.json`, `pt-BR.json`, …) likhta hai, jismein English source text runtime lookup key ke roop mein hota hai — `strings.json` extraction cache hai, na ki runtime bundle. Documents `docs[].docsOutput.style` values `"nested"`, `"flat"`, `"doc-system"`, aur aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"` ko support karta hai (dekhein [Output layouts](/guide/documents/output-layouts)). Teeno `ai-i18n-tools.config.json` share karte hain aur combine kiye ja sakte hain; `sync` aapke `features` flags ke anusaar extract, UI translation, translate SVG, `translate-docs`, aur `translate-json` ko kram mein chalata hai.

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

**`package.json` scripts (sifarish ki jaati hai)** — npm aur pnpm scripts chalate samay `node_modules/.bin` ko `PATH` se pehle jodte hain, isliye aap nange command naam ko call kar sakte hain:

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

Phir chalaen jaise ki `pnpm run i18n:sync` — koi `npx` prefix ki zaroorat nahin.

**Interactive shell** — apne project root se (ek local install ke baad):

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
```

Bash/zsh mein nange `ai-i18n-tools` command ko type karne ke liye, local bin directory ko `PATH` se pehle rakhein (PowerShell, direnv, aur Windows notes ke liye [Using the CLI](/guide/installation#using-the-cli) dekhein):

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

`extract`, `translate-ui`, `translate-svg`, `translate-docs`, aur `translate-json` ko manually chain karne ki bajaye `sync` ko prefer karein — manually chalane par order aur feature flags galat ho sakte hain. Quick start guide mein [Recommended `package.json` scripts](/guide/quick-start#recommended-packagejson-scripts) dekhein.

**Zero-install one-off** — `npx ai-i18n-tools <cmd>` ya `pnpm dlx ai-i18n-tools <cmd>` (sirf us invocation ke liye package download karta hai; `package.json` mein koi entry nahin).

Apni provider API key set karein (OpenRouter dikhaya gaya hai; apne provider ke liye matching variable ka upyog karein):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="llm-providers"></a>
## LLM providers

Translation commands (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models`, aur sambandhit scripts) ek LLM provider ko call karte hain; `check-markdown`, `mark-html`, aur `extract` nahin karte hain.

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
|--------------|-----------------------------------------------------------|----------------------|
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

Token ka upyog har provider ke liye report kiya jaata hai; sahi USD laagat tabhi dikhai jaati hai jab provider ise wapas karta hai (OpenRouter). `ai-i18n-tools check-models` active provider ki live `GET /models` list (koi bhi provider) ke khilaaf configured model ids ko validate karta hai, aur jab provider ise wapas karta hai (jaise OpenRouter) to pricing dikhata hai. `ai-i18n-tools list-models` har us model ko list karta hai jise active provider advertise karta hai (doosre configured provider ka nireekshan karne ke liye `-P` / `--provider` ka upyog karein). `ai-i18n-tools bench-models` ek sample ko isolation mein translate karke har configured model ko benchmark karta hai (models parallel mein chalte hain, `concurrency` dwara seemit) aur per-model input/output tokens, wall-clock time, aur USD laagat print karta hai.

Ek legacy top-level `openrouter` config block abhi bhi swikar kiya jaata hai aur load hone par automatically `providers.openrouter` (`provider: "openrouter"` ke saath) mein migrate ho jaata hai.

Ek single document par `-P` ke saath providers ko switch karne ke hands-on demo ke liye, [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/) dekhen.

---

<a id="quick-start"></a>
## Turant shuru karein

<a id="ui-strings"></a>
### UI strings

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Phir `'ai-i18n-tools/runtime'` se helpers ka upyog karke apni app mein i18next ko wire karein. Poore setup ke liye UI strings guide mein [Step 4: Wire i18next at runtime](/guide/ui-strings/i18next-runtime) dekhein.

<a id="documents"></a>
### Documents

Default `init` template (`ui-markdown`) kewal UI extraction ko enable karta hai. Docs-oriented template ka upyog karein (ya `features.translateDocs` ko enable karein aur `docs[]` jodein) `translate-docs` se pehle:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# VitePress documentation (pages + theme JSON)
# npx ai-i18n-tools init -t ui-vitepress

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

`ai-i18n-tools.config.json` ko edit karein: `docs[].contentPaths` ko markdown, MDX, aur/ya `.astro` sources par set karein; `docs[].outputDir` aur `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"vitepress"`, `"flat"`, etc.). Poora field reference: [Documents](/guide/documents/).

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress` `docsOutput.style: "vitepress"` ke saath-saath theme/nav/sidebar strings ke liye ek `json[]` block bhi scaffold karta hai. Page markdown aur `theme.{locale}.json` ko ek saath translate karne ke liye `sync` chalayein. [VitePress integration](/guide/vitepress-integration) aur [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) dekhein.

<a id="astro-plain-astro--starlight"></a>
### Astro (plain Astro & Starlight)

**Astro Starlight** — `init -t ui-starlight`, phir `translate-docs`. Starlight UI overrides ko ek alag `docs[]` block mein `src/content/i18n/en.json` ke saath `jsonPathTemplate` ka upyog kar sakte hain jab zaroorat ho ([Documents — documentation ke liye initialise karein](/guide/documents/#step-1-initialise-for-documentation)).

**Plain Astro** (marketing ya app sites, Starlight nahi) — [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) ko ai-i18n-tools ke saath combine karein. Reference project: [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (English `/` par, locales `/{locale}/` par).

Adhikansh teamein do pipelines ka **hybrid** upyog karti hain:

| Pipeline | Use for | Commands | Output |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **Page HTML** | Headings, paragraphs, nav labels, inline arrays in the template body | `translate-docs` | `src/pages/{locale}/index.astro` per locale |
| **UI strings (`t()`)** | Frontmatter data, tab labels, shared arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (key ke roop mein English source) |

UI ko `init -t ui-astro-website` ke saath scaffold karein. `.astro` pages mein hardcoded HTML ke liye, `features.translateDocs` ko enable karein aur `docsOutput.style: "astro-starlight"` ke saath ek `docs[]` block jodein (dekhein [Astro website pages (parse-and-replace)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). `targetLocales`, `i18n.locales` ko `astro.config.mjs` mein, aur `ui-languages.json` ko align rakhein (Astro routes lowercase codes jaise `pt-br` ka upyog karte hain; flat bundle filenames config casing ka palan karte hain, jaise `pt-BR.json`).

Build time par `t()` ko i18next ke bina wire karein jab tak ki aap client islands na jodein — dekhein [Astro website UI strings (SSG)](/guide/ui-strings/astro-website#astro-website-ui-strings-ssg) aur example ka `src/i18n/t.ts`.

<a id="combined-sync"></a>
### Sanyukt sync

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
| `extractInterpolationNamesForWrap(key)`                                | `wrapT` / key-trim fallback ke liye ek source key se <code v-pre>{{var}}</code> naamon ko parse karta hai.                                                              |
| `wrapI18nWithKeyTrim(i18n)` | Lower-level key-trim wrapper keval (app wiring ke liye deprecated; `setupKeyAsDefaultT` ko prefer karein). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | `makeLoadLocale` ke liye `localeLoaders` map banata hai `ui-languages.json` se (har `code` `sourceLocale` ko chhodkar). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Async locale file loading ke liye factory. |
| `getTextDirection(lng)` | BCP-47 code ke liye `'ltr'` ya `'rtl'` lautata hai. |
| `applyDirection(lng, element?)` | `document.documentElement` par `dir` attribute set karta hai. |
| `getUILanguageLabel(lang, t)` | ek bhasha menu row ke liye display label (i18n ke saath). |
| `getUILanguageLabelNative(lang)` | `t()` ko call kiye bina display label (header-style). |
| `interpolateTemplate(str, vars)`                                       | Ek plain string par low-level <code v-pre>{{var}}</code> substitution (internally upyog kiya jaata hai; app code ko iske bajaye `t()` ka upyog karna chahiye).                               |
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
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
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

Plain HTML apps ke liye, elements ko nange `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` markers ke saath annotate karein (source text element ke apne textContent / title / placeholder se liya jata hai, ek baar likha jata hai); `mark-html` unhe aapke liye insert karta hai aur phir `extract` unhe `strings.json` mein capture karta hai. [Marking HTML for translation](/guide/ui-strings/plain-html#marking-html-for-translation) dekhein.

Poori per-command flag lists [CLI reference](/reference/cli-commands) mein hain. Built-in usage text ke liye `ai-i18n-tools <command> --help` chalayein.

Vaishvik vikalp: `-c <config>` (default: `ai-i18n-tools.config.json`), `-v` (verbose), `-P` / `--provider <name>` (sakriya LLM pradata ko override karen; `providers` ke tahat configure kiya jana chahiye), `-L` / `--ui-lang <code>` (tool ke apne UI/logs ke liye bhasha), `-V` / `--version`, aur `-h` / `--help` — har command par swikrit. `-w` / `--write-logs [path]` console output ko ek log file mein tees karta hai (default: translation cache directory ke tahat), lekin keval translation aur sync commands (`translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, `cleanup`) par prabhavi hota hai. Kai commands `-l` / `--locale <codes>` (comma-separated BCP-47) ko target locales ko simit karne ke liye swikar karte hain; `proofread-ui` ek single source locale ka upyog karta hai. Command overview table ke liye [CLI reference](/reference/cli-commands) dekhen.

<a id="tool-ui-language-logs-help-dashboard"></a>
### Tool UI bhasha (logs, help, dashboard)

Tool apne CLI help, high-traffic log/summary messages, aur Translation Dashboard ko localize karta hai. UI locale in sources se resolve hota hai, sabse highest priority pehle:

1. `-L` / `--ui-lang <code>` global flag (e.g. `-L pt-BR`).
2. `AI_I18N_LANG` environment variable (e.g. `export AI_I18N_LANG=es`).
3. `ai-i18n-tools.config.json` mein `uiLanguage` config key (BCP-47 string).
4. Host OS locale (`Intl.DateTimeFormat().resolvedOptions().locale` ke through).

Anurodh kiye gaye locale ka milan shipped UI bhashaon se theek ya sabse nikat variation se kiya jata hai (udharan ke liye `pt-PT` `pt-BR` mein resolve hota hai, aur `en-US` `en-GB` mein resolve hota hai); jab kuch bhi match nahi hota hai to yah source locale (`en-GB`) par wapas aa jata hai. Jab ek UI bhasha ka spasht roop se anurodh kiya jata hai (flag, env var, ya `uiLanguage` ke madhyam se) lekin koi shipped bundle match nahi hota hai, to CLI ek one-time warning print karta hai ki default locale ka upyog kiya jayega; host OS se anumanit locale kabhi warn nahi karta hai. Yah aapke project ke `sourceLocale` / `targetLocales` se swatantra hai. Shipped UI bhashaen: `en-GB` (source) plus `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans`, aur `zh-Hant`. Koi configuration ki avashyakta nahi hai — default roop se tool aapke OS locale ka palan karta hai. Vistrit jankari ke liye [Tool UI language](/reference/environment-variables#tool-ui-language) dekhen.

---

<a id="documentation"></a>
## Documentation

- [Documentation site](https://wsj-br.github.io/ai-i18n-tools/) — poori VitePress guide (GitHub Pages par 9 locales).
- [Quick start](/guide/quick-start) — UI strings, documents, aur JSON ke liye setup (UI, docs/`.astro`, JSON bundles, Astro Starlight aur plain Astro).
- [Locale assets guide](/guide/images-and-screenshots/) - anuvadit docs mein screenshots aur illustrated SVGs (flat link rewriter, screenshot scripts).
- [Architecture](/reference/architecture) - architecture, internals, programmatic API, aur extension points.
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - **package ka upyog karne wale apps ke liye:** downstream projects ke liye integration prompts (apne repo ke agent rules mein copy karen).
- **Is** repository ke liye maintainer internals: `dev/package-context.md` (keval clone; npm par nahi).

---

<a id="license"></a>
## License

Yah project MIT License ke tahat licensed hai.  
Vistrit jankari ke liye [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) file dekhen.

Copyright &copy; 2026 Waldemar Scudeller Jr.
