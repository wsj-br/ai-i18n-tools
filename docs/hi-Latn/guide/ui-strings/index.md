<a id="ui-strings"></a>
# UI strings

Kisi bhi JS/TS project ke liye design kiya gaya hai jo i18next ka upyog karta hai: React apps, Next.js (client aur server components), Node.js services, CLI tools.

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
npx ai-i18n-tools init
```

Yeh `ai-i18n-tools.config.json` ko `ui-markdown` template ke saath likhta hai. Ise set karne ke liye edit karein:

- `sourceLocale` - aapki source bhasha ka BCP-47 code (jaise `"en-GB"`). Aapke runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`) se export kiye gaye `SOURCE_LOCALE` se **mel khana chahiye**.
- `targetLocales` - aapki target bhashao ke liye BCP-47 codes ka array (jaise `["de", "fr", "pt-BR"]`). Is list se `ui-languages.json` manifest banane ke liye `generate-ui-languages` chalayein.
- `ui.sourceRoots` - `t("…")` calls ke liye scan karne ke liye directories ya glob patterns (jaise `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - master catalog kahan likhna hai (jaise `"src/locales/strings.json"`).
- `ui.flatOutputDir` - jahaan `de.json`, `pt-BR.json`, aadi likhna hai (jaise `"src/locales/"`).
- `providers.<active>.uiModels` (vaikalpik) - `translate-ui`, bahuvachan utpatti, aur `proofread-ui` ke liye kramabaddh UI-only model soochi (kisi bhi milte-julte `localeModels` entry ke baad, `translationModels` se pehle). [Providers and models](/hi-Latn/guide/providers-and-models#model-fallback-chain) dekhen.

<a id="step-2-extract-strings"></a>
## Step 2: Strings nikalen

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` ke antargat sabhi JS/TS files ko `t("literal")` aur `i18n.t("literal")` calls ke liye scan karta hai. `ui.stringsJson` mein likhta hai (ya merge karta hai).

Scanner configurable hai: `ui.uiExtractor.funcNames` (ya legacy `ui.reactExtractor.funcNames`) ke madhyam se custom function names joden. Astro pages aur components ke liye, `ui.uiExtractor.extensions` mein `.astro` joden. Plain HTML ke liye, [Plain HTML apps](/hi-Latn/guide/ui-strings/plain-html) dekhen.

<a id="step-3-translate-ui-strings"></a>
## Step 3: UI strings ka anuvad karen

```bash
npx ai-i18n-tools translate-ui
```

`strings.json` padhta hai, har target locale ke liye active LLM provider ko batches bhejta hai, flat JSON files (`de.json`, `fr.json`, aadi) ko `ui.flatOutputDir` mein likhta hai. Model selection UI chain ka upyog karta hai: `localeModels(locale)` → `uiModels` → `translationModels` ([Providers and models](/hi-Latn/guide/providers-and-models#model-fallback-chain) dekhen).

<a id="per-locale-model-overrides"></a>
### Pratyaik sthanik model override

Vaikalpik `providers.<active>.localeModels` entries ek BCP-47 locale ko ek kramabaddh model soochi se map karti hain jo us locale ke liye `uiModels` aur `translationModels` se **pehle** prayas ki jaati hai. Vahi `localeModels` entries document, JSON, aur SVG translation par bhi lagu hoti hain. Locale tags case-insensitively milte hain (`pt-br` = `pt-BR`). Yadi koi entry nahi milti hai, to UI kaarya ke liye keval `uiModels` aur `translationModels` ka upyog kiya jaata hai.

Har entry ke liye, `translate-ui` ek optional `models` object mein **active provider se model id** store karta hai jisne har locale ka safaltapoorvak anuvad kiya (`translated` ke saman locale keys). Translation Dashboard mein edit kiye gaye strings ko us locale ke liye `models` mein sentinel value `user-edited` se mark kiya jata hai. `ui.flatOutputDir` ke tahat per-locale flat files keval **source string → translation** rahte hain; unmein `models` shamil nahi hota (isliye runtime bundles aparivartit rahte hain).

> **Note:** UI strings mein Dashboard edits `strings.json` mein rahte hain, na ki SQLite documentation cache mein. Catalog se flat locale files ko rewrite karne ke liye plain `sync` ya `translate-ui` (koi special flag nahi) chalayen — `--force-update` UI step par **forward nahi** kiya jata hai. Manual edits ke baad UI commands par `--force` se bachen: yah har entry ka phir se anuvad karta hai aur aapki `user-edited` rows ko overwrite kar sakta hai.

Phir runtime par i18next ko wire karen — [Wire i18next](/hi-Latn/guide/ui-strings/i18next-runtime).

<a id="exporting-to-xliff-20-optional"></a>
## XLIFF 2.0 mein export karna (optional)

UI strings ko translation vendor, TMS, ya CAT tool ko dene ke liye, catalog ko **XLIFF 2.0** ke roop mein export karen (har target locale ke liye ek file). Yah command **read-only** hai: yah `strings.json` ko modify nahi karta hai aur na hi kisi API ko call karta hai.

```bash
npx ai-i18n-tools export-ui-xliff
```

By default, files `ui.stringsJson` ke bagal mein likhe jaate hain, jinka naam `strings.de.xliff`, `strings.pt-BR.xliff` (aapke catalog ka basename + locale + `.xliff`) jaisa hota hai. Kahin aur likhne ke liye `-o` / `--output-dir` ka upyog karein. `strings.json` se maujooda anuvaad `<target>` mein dikhai dete hain; gayab locale `state="initial"` ka upyog karte hain bina `<target>` ke taaki tools unhe bhar sakein. Har locale ke liye jin units ko abhi bhi anuvaad ki zaroorat hai, unhe export karne ke liye `--untranslated-only` ka upyog karein (vendor batches ke liye upyogi). `--dry-run` files likhe bina paths print karta hai.
