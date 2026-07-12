<a id="ui-strings"></a>
# UI strings

Kisi bhi JS/TS project ke liye design kiya gaya hai jo i18next ka upyog karta hai: React apps, Next.js (client aur server components), Node.js services, Plain HTML, Astro websites aur CLI tools.

<a id="which-guide-to-read"></a>
## Kaun sa guide padhein

| Aap | Agla padhen |
| --- | --- |
| React / Next.js / Node + i18next | [Wire i18next](/hi-Latn/guide/ui-strings/i18next-runtime) (Step 4) |
| Plain HTML (markup mein koi `t()` nahi) | [Plain HTML apps](/hi-Latn/guide/ui-strings/plain-html) |
| Astro marketing site (hybrid) | [Astro website](/hi-Latn/guide/ui-strings/astro-website) |
| `t()` rules, interpolation, plurals | [t() calls & plurals](/hi-Latn/guide/ui-strings/t-calls-and-plurals) |
| Language picker / RTL | [Language switcher & RTL](/hi-Latn/guide/ui-strings/language-switcher) |
| Runtime API signatures | [Runtime helpers](/hi-Latn/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## Step 1: Initialise (Shuru karen)

```bash
ai-i18n-tools init [-P <provider>]
```

Yah `ai-i18n-tools.config.json` ko `ui-markdown` template ke saath likhta hai (ek default `provider` / `providers` block sahit). `translate-ui` ya `sync` chalane se pahle, environment ya `.env` mein apne active provider ke liye API key set karein — Ollama ko chhodkar; [Provider aur API key](/hi-Latn/guide/quick-start#provider-and-api-key) dekhein. Config ko edit karke set karein:

- `provider` aur `providers` — kam se kam ek provider jismein `translationModels` ho; preset ya model list badal dein agar default aapki pasand nahi hai (`init -P <provider>`). [LLM providers aur models](/hi-Latn/guide/providers-and-models) dekhein.
- `sourceLocale` - aapki source language ka BCP-47 code (jaise `"en-GB"`). Aapke runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`) se export kiye gaye `SOURCE_LOCALE` se **milna chahiye**.
- `targetLocales` - aapki target languages ke liye BCP-47 codes ka array (jaise `["de", "fr", "pt-BR"]`). Is list se `ui-languages.json` manifest banane ke liye `generate-ui-languages` chalayein.
- `ui.sourceRoots` - `t("…")` calls ko scan karne ke liye directories ya glob patterns (jaise `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - master catalog kahan likhna hai (jaise `"src/locales/strings.json"`).
- `ui.flatOutputDir` - `de.json`, `pt-BR.json`, aadi kahan likhna hai (jaise `"src/locales/"`).
- `providers.<active>.uiModels` (optional) - `translate-ui`, plural generation, aur `proofread-ui` ke liye ordered UI-only model list (kisi bhi matching `localeModels` entry ke baad, `translationModels` se pahle). [Providers aur models](/hi-Latn/guide/providers-and-models#model-fallback-chain) dekhein.

<a id="step-2-extract-strings"></a>
## Step 2: Strings nikalen

```bash
ai-i18n-tools extract
```

`ui.sourceRoots` ke antargat sabhi JS/TS files ko `t("literal")` aur `i18n.t("literal")` calls ke liye scan karta hai. `ui.stringsJson` mein likhta hai (ya merge karta hai).

Scanner configurable hai: `ui.uiExtractor.funcNames` (ya legacy `ui.reactExtractor.funcNames`) ke madhyam se custom function names joden. Astro pages aur components ke liye, `ui.uiExtractor.extensions` mein `.astro` joden. Plain HTML ke liye, [Plain HTML apps](/hi-Latn/guide/ui-strings/plain-html) dekhen.

<a id="step-3-translate-ui-strings"></a>
## Step 3: UI strings ka anuvad karen

```bash
ai-i18n-tools translate-ui
```

`strings.json` padhta hai, har target locale ke liye active LLM provider ko batches bhejta hai, flat JSON files (`de.json`, `fr.json`, aadi) ko `ui.flatOutputDir` mein likhta hai. Model selection UI chain ka upyog karta hai: `localeModels(locale)` → `uiModels` → `translationModels` ([Providers and models](/hi-Latn/guide/providers-and-models#model-fallback-chain) dekhen).

<a id="per-locale-model-overrides"></a>
### Pratyaik sthanik model override

Target bhasha ke adhar par, kuchh translation models doosron ki tulna mein kafi behtar pradarshan kar sakte hain—udharan ke liye, qwen aur z-ai models aksar kai Western (Occidental) bhasha models ki tulna mein Asian bhashaon ke liye uchch gunvatta wale anuvad utpann karte hain. Iska fayda uthane ke liye, aap pratyek BCP-47 locale ke liye models ki prathmikta wali list nirdisht karne ke liye optional `providers.<active>.localeModels` entries ka upyog kar sakte hain. Ye model lists us vishesh locale ke liye adhik samanya `uiModels` aur `translationModels` se **pahle** prayas ki jati hain. Yah aapko model selection ko anukoolit karne aur pratyek bhasha ke liye behtar anuvad gunvatta prapt karne ki anumati deta hai. Locale tags case-insensitively match kiye jate hain (isliye `zh-cn` aur `ZH-CN` barabar hain). Yadi koi custom entry kisi locale se match nahi karta hai, to tool UI translations ke liye default `uiModels` aur `translationModels` order par wapas aa jata hai. Yahi `localeModels` mechanism document, JSON, aur SVG translation par bhi lagu hota hai.

<a id="translations-database-stringsjson"></a>
### Translations database (`strings.json`)

Har entry ke liye, `translate-ui` ek optional `models` object mein **active provider se model id** store karta hai jisne har locale ka safaltapoorvak anuvad kiya (`translated` ke saman locale keys). Translation Dashboard mein edit kiye gaye strings ko us locale ke liye `models` mein sentinel value `user-edited` se mark kiya jata hai. `ui.flatOutputDir` ke tahat per-locale flat files keval **source string → translation** rahte hain; unmein `models` shamil nahi hota (isliye runtime bundles aparivartit rahte hain).

> **Note:** UI strings mein Dashboard edits `strings.json` mein rahte hain, na ki SQLite documentation cache mein. Catalog se flat locale files ko rewrite karne ke liye plain `sync` ya `translate-ui` (koi special flag nahi) chalayen — `--force-update` UI step par **forward nahi** kiya jata hai. Manual edits ke baad UI commands par `--force` se bachen: yah har entry ka phir se anuvad karta hai aur aapki `user-edited` rows ko overwrite kar sakta hai.

Phir runtime par i18next ko wire karen — [Wire i18next](/hi-Latn/guide/ui-strings/i18next-runtime).

<a id="exporting-to-xliff-20-optional"></a>
## XLIFF 2.0 mein export karna (optional)

UI strings ko translation vendor, TMS, ya CAT tool ko dene ke liye, catalog ko **XLIFF 2.0** ke roop mein export karen (har target locale ke liye ek file). Yah command **read-only** hai: yah `strings.json` ko modify nahi karta hai aur na hi kisi API ko call karta hai.

```bash
ai-i18n-tools export-ui-xliff
```

By default, files `ui.stringsJson` ke bagal mein likhe jaate hain, jinka naam `strings.de.xliff`, `strings.pt-BR.xliff` (aapke catalog ka basename + locale + `.xliff`) jaisa hota hai. Kahin aur likhne ke liye `-o` / `--output-dir` ka upyog karein. `strings.json` se maujooda anuvaad `<target>` mein dikhai dete hain; gayab locale `state="initial"` ka upyog karte hain bina `<target>` ke taaki tools unhe bhar sakein. Har locale ke liye jin units ko abhi bhi anuvaad ki zaroorat hai, unhe export karne ke liye `--untranslated-only` ka upyog karein (vendor batches ke liye upyogi). `--dry-run` files likhe bina paths print karta hai.
