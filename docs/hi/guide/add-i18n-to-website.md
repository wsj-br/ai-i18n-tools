<a id="add-i18n-to-a-website-or-docs-site"></a>
# किसी वेबसाइट या दस्तावेज़ साइट में i18n जोड़ें

यह पृष्ठ एक डॉक्यूमेंटेशन साइट (मार्कडाउन या एमडीएक्स) या एक मार्केटिंग या स्टैटिक साइट (एक एस्ट्रो वेबसाइट या सादा एचटीएमएल) लेता है जिसमें एक ही भाषा है और ai-i18n-tools के साथ लोकल्स जोड़ता है। यह टूल आपके एलएलएम प्रोवाइडर पर मॉडलों के साथ पेज सामग्री का अनुवाद करता है और प्रति भाषा एक स्थानीयकृत कॉपी लिखता है। आपकी साइट फ्रेमवर्क उन कॉपीज़ को सर्व करती है और भाषा स्विचर प्रदान करती है।

सबसे तेज़ तरीका इस पृष्ठ पर दिए गए प्रॉम्प्ट को कोडिंग एजेंट को देना है। यह उस फ्रेमवर्क के i18n को सक्षम करता है और कॉन्फ़िग की जाँच करता है। आप सीएलआई इंस्टॉल करते हैं, प्रोवाइडर चुनते हैं, और प्रोजेक्ट को स्वयं इनिशियलाइज़ करते हैं, क्योंकि इसके लिए आपकी एपीआई कुंजी और आपकी पसंद की आवश्यकता होती है। आप अनुवाद भी स्वयं चलाते हैं, क्योंकि इसमें आपके खाते से पैसे खर्च होते हैं।

ऐसे ऐप के लिए जिसकी यूआई स्ट्रिंग्स `t()` कॉल्स में रहती हैं, [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) या [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) का उपयोग करें। एक रिपॉजिटरी README जिसमें कोई साइट फ्रेमवर्क नहीं है, [अपने README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) का उपयोग करता है। निश्चित नहीं हैं कि कौन सा लागू होता है? अंत में [आपका मामला नहीं?](#not-your-case) देखें।

<a id="steps"></a>

प्रवाह:

1. [CLI स्थापित करें और एक प्रदाता चुनें](#install-and-choose-a-provider)।
2. `init` के साथ [परियोजना को आरंभ करें](#initialise-the-project)।
3. [एजेंट प्रॉम्प्ट चलाएँ](#run-the-agent-prompt)।
4. [परिणाम की समीक्षा करें](#review-the-result)।
5. [मॉडल चुनें और अनुवाद करें](#choose-models-and-translate), फिर एक भाषा की जाँच करें।
6. [इसे अनुवादित रखें](#keep-it-translated)।

परिवर्तन स्वयं करना पसंद करते हैं, या जानना चाहते हैं कि प्रॉम्प्ट क्या करता है? [इसे हाथ से करें](#do-it-by-hand) उन्हीं चरणों को एक-एक करके बताता है।

<a id="install-and-choose-a-provider"></a>
## स्थापित करें और एक प्रदाता चुनें

आप यह हिस्सा करते हैं, एजेंट नहीं। इंस्टॉलर आपकी मशीन को बदलता है, और API कुंजी एक रहस्य है जो आपके शेल में होनी चाहिए, प्रॉम्प्ट में नहीं।

पैकेज को एक देव डिपेंडेंसी के रूप में इंस्टॉल करें। VitePress कॉन्फ़िग `ai-i18n-tools` से `prefixVitepressThemeConfigLinks` को इम्पोर्ट करता है, और एक सादा HTML पेज पैकेज से `i18n.js` को कॉपी करता है। एक स्टैंडअलोन निष्पादन योग्य तभी पर्याप्त होता है जब साइट कभी भी `ai-i18n-tools/runtime` को इम्पोर्ट नहीं करती है और कभी भी अपने कॉन्फ़िग से पैकेज को इम्पोर्ट नहीं करती है। अन्य इंस्टॉल विकल्प: [इंस्टॉलेशन](/hi/guide/installation)।

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` और `yarn add --dev ai-i18n-tools` भी काम करते हैं। नीचे दिए गए उदाहरण केवल `ai-i18n-tools` कमांड का उपयोग करते हैं। एक स्थानीय स्थापना के लिए `PATH` पर `node_modules/.bin` की आवश्यकता होती है, या प्रत्येक कमांड के सामने `pnpm exec` की। [CLI का उपयोग करना](/hi/guide/installation#using-the-cli) देखें।

स्थापना की जाँच करें:

```bash
ai-i18n-tools --version
```

फिर एक प्रदाता चुनें और उसकी API कुंजी उस शेल में सेट करें जो अनुवाद चलाएगा। उदाहरण के लिए, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama को किसी कुंजी की आवश्यकता नहीं है। अन्य प्रीसेट: [अंतर्निहित प्रदाता](/hi/guide/providers-and-models#built-in-providers)। प्रदाता का नाम नोट करें, क्योंकि आप इसे अगले चरण में `init` को पास करते हैं। एजेंट को कभी कुंजी की आवश्यकता नहीं होती है: यह केवल उन कमांड को चलाता है जो कोई मॉडल कॉल नहीं करते हैं। आप कुंजी का उपयोग बाद में करते हैं, जब आप [अनुवाद करते हैं](#choose-models-and-translate)।

<a id="initialise-the-project"></a>
## परियोजना को आरंभ करें

आप इसे प्रॉम्प्ट से पहले, एक बार चलाते हैं। यह `ai-i18n-tools.config.json` लिखता है और आपके द्वारा ऊपर चुने गए प्रोवाइडर का उपयोग करता है। यह किसी मौजूदा साइट में i18n को चालू नहीं करता है। वह प्रॉम्प्ट है।

| आपकी साइट | इनिट टेम्पलेट | विवरण के लिए गाइड |
| --- | --- | --- |
| एस्ट्रो स्टारलाइट | `ui-starlight` | [एस्ट्रो](/hi/guide/integrations/astro) |
| डॉक्यूसॉरस | `ui-docusaurus` | [डॉक्यूसॉरस](/hi/guide/integrations/docusaurus) |
| वाइटप्रेस | `ui-vitepress` | [वाइटप्रेस](/hi/guide/integrations/vitepress) |
| नेक्सट्रा 4 (नेक्स्ट.जेएस ऐप राउटर) | `ui-nextra` | [नेक्सट्रा](/hi/guide/integrations/nextra) |
| फुमाडॉक्स 4 (नेक्स्ट.जेएस ऐप राउटर) | `ui-fumadocs` | [फुमाडॉक्स](/hi/guide/integrations/fumadocs) |
| सादी एस्ट्रो वेबसाइट | `ui-astro-website` | [एस्ट्रो](/hi/guide/integrations/astro#plain-astro-marketing-and-app-sites) |
| एक HTML फ़ाइल जो ब्राउज़र में भाषा बदलती है | `ui-plain-html` | [सादे HTML ऐप्स](/hi/guide/ui-strings/plain-html) |
| प्रति लोकल एक अनुवादित HTML फ़ाइल | `docs-plain-html` | [HTML पेज](/hi/guide/documents/html-pages) |
| कोई साइट फ्रेमवर्क नहीं, केवल एक README और मार्कडाउन फ़ाइलें | `docs-markdown`, या कोई भी टेम्प्लेट और `--with-readme` | [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

तालिका में टेम्पलेट के लिए `ui-vitepress` को बदलें। फिर `sourceLocale`, `targetLocales`, और `docs[].contentPaths` को संपादित करें। `sourceLocale` पृष्ठों की भाषा है। कोई भी BCP-47 भाषा मान्य है। `contentPaths` उस भाषा में लिखे गए पृष्ठ और फ़ोल्डर होने चाहिए। टेम्पलेट में पाथ स्टार्टर हैं। `docsOutput.style` टेम्पलेट के लिए पहले से ही सेट है। `ui-astro-website` और `ui-plain-html` एक `ui` ब्लॉक और एक खाली `docs` ऐरे लिखते हैं। जब आप पेज HTML का अनुवाद कर रहे होते हैं तो प्रॉम्प्ट एक सादी एस्ट्रो साइट के लिए एक पेज-HTML `docs` ब्लॉक जोड़ता है।

`init` को एक बार चलाएँ। यह हर बार `ai-i18n-tools.config.json` को फिर से लिखता है, इसलिए दूसरी बार चलाने पर आपके द्वारा किए गए संपादन हटा दिए जाते हैं।

<a id="run-the-agent-prompt"></a>
## एजेंट प्रॉम्प्ट चलाएँ

अपने कोडिंग एजेंट (कर्सर, क्लाउड कोड, कोपायलट, या इसी तरह के) में प्रोजेक्ट खोलें, एक नई चैट शुरू करें, और नीचे दिए गए प्रॉम्प्ट को पेस्ट करें। प्रोजेक्ट पहले से ही इनिशियलाइज़ किया हुआ होना चाहिए। संपादित करने के लिए कुछ भी नहीं है। यदि आप किसी फ्रेमवर्क विवरण को छोड़ना चाहते हैं, तो उसी संदेश में ऐसा कहें।

एजेंट पहले यह जाँचता है कि सीएलआई और कॉन्फ़िग मौजूद हैं या नहीं, और यदि कोई अनुपस्थित है तो निर्देशों के साथ रुक जाता है। फिर यह फ्रेमवर्क का पता लगाता है और उस फ्रेमवर्क के लोकल राउटिंग को सक्षम करता है। यह सीएलआई इंस्टॉल नहीं करता है, कॉन्फ़िग को इनिशियलाइज़ नहीं करता है, आपकी एपीआई कुंजी नहीं पढ़ता है, या अनुवाद नहीं करता है। अनुवाद समीक्षा के बाद का चरण है, और आप इसे चलाते हैं।

````markdown
# Enable i18n on this website or docs site

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user to install ai-i18n-tools as a dev dependency and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-vitepress`, `ui-docusaurus`, `ui-starlight`, `ui-nextra`,
`ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, or `docs-plain-html`.
Do not install or initialise anything yourself.

`ui-plain-html` and `ui-astro-website` are valid when `docs` is empty. Every
other template needs one `docs` entry. If that entry is missing, stop and name
the init command.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, reword, or rename source pages, nav labels, or dictionary
  strings. Do not edit generated locale trees (`docs/<locale>/`,
  `i18n/<locale>/` other than the source catalog from `write-translations`,
  `theme.<locale>.json`, `content/<locale>/`, locale MDX, or locale HTML).
- Do not reformat unrelated code. Leave unrelated edits in a dirty tree alone.
- Apply one branch. If the framework is unclear, stop and ask.

Detect the branch from `docsOutput.style`, then from the config file and
`package.json`: `vitepress`, `docusaurus`, `nextra`, `fumadocs`,
`astro-starlight` with pages under `src/content/docs` (Starlight), `nested`
with HTML `contentPaths` (`docs-plain-html`), a `ui` block whose extractor
extensions include `.html` (`ui-plain-html`), or an Astro site that is not
Starlight (`ui-astro-website`).

Point `contentPaths` and `docsRoot` at the source-language pages that exist
in this repository. The paths written by `init` are starters.

## VitePress

- In `.vitepress/config`, set `locales.root` for the source locale (`label`,
  `lang`, and the existing `themeConfig`). Add one `locales[code]` per
  `targetLocales` entry: `label`, `lang`, `link: '/<code>/'`, and per-locale
  `title` / `description`. Keep `targetLocales` equal to those keys.
- Author nav and sidebar links once, without a locale prefix. Prefix `link`
  and `activeMatch` per locale with `prefixVitepressThemeConfigLinks` from
  `ai-i18n-tools`. `translate-docs` does not rewrite links inside the config.
- Leave `docsOutput.vitepressThemeCatalog` as `init` wrote it. If the config
  already loads `theme.en.json`, keep that loader and add `locales[code]` the
  same way. If theme strings are still inline, leave them inline. Do not
  create `theme.en.json` or `theme.<locale>.json` yourself, and do not load a
  theme file that is not on disk. The first `sync` bootstraps a missing
  catalog.
- `docsOutput.style` is `vitepress`. `outputDir` is the docs root.

## Docusaurus

- Add the `i18n` block in `docusaurus.config.js`: `defaultLocale`, `locales`
  (source plus each target), and `localeConfigs[locale].path` when the URL
  path differs from the locale code. The path must match the folder under
  `i18n/`.
- Point `docusaurusCatalogDir` at `i18n/<defaultLocale>`. `docsOutput.style`
  is `docusaurus`. `contentPaths` and `docsRoot` are the source docs folder.
  `outputDir` is the parent of the locale folders.
- Run this project's `docusaurus write-translations` so
  `i18n/<defaultLocale>/` exists. That command does not call a model. Do not
  run `sync` or `translate-docs`.
- Custom React in `src/pages` and `src/components` is not markdown. Mark
  user-facing copy with `<Translate>` or `translate()` from
  `@docusaurus/Translate`. The message has to be a static string. Do not wrap
  those calls in `t()`.

## Nextra

- Move source MDX to `content/<sourceLocale>/` (usually `content/en/`). The
  source locale is a folder, not the content root. Leave `_meta.ts` beside
  the pages it labels.
- Set `i18n.locales` and `defaultLocale` in `next.config`. `targetLocales`
  matches `i18n.locales` except the default locale.
- Add an `app/[lang]/` route, `getPageMap('/' + lang)`, and `<Layout i18n>`.
- Add `app/_dictionaries/<source>.ts` (usually `en.ts`) with the English
  chrome as string literals (`siteTitle`, footer, `editLink`, search
  placeholder, table-of-contents title, last-updated label), and
  `get-dictionary.ts` that imports `./${locale}`. Pass those fields into
  `<Layout>`, `<Navbar>`, and `<Footer>`. Keep native language names in a
  labels map, untranslated.
- Config: `features.translateDocs`, `docsOutput.style` `nextra`, `docsRoot`
  `content/<sourceLocale>`, `nextraDictionaryPath` the source dictionary.
- Optional: `proxy.ts` that re-exports `nextra/locales`.
- Do not write `app/_dictionaries/pt-BR.ts`, `content/pt-BR/`, or any other
  locale tree.

## Fumadocs

- `defineI18n` in `lib/i18n.ts` with `languages`, `defaultLanguage`, and
  `parser: "dot"` or `"dir"`. Use `"dot"` unless the source pages already live
  under a locale folder. Set `docsOutput.fumadocsParser` to the same value.
- Add `app/[lang]/` routes. Export `createI18nMiddleware(i18n)` from
  `proxy.ts`.
- Dot: source MDX stays at the collection root (`content/docs/`). Dir: source
  MDX lives under `content/docs/<sourceLocale>/`. Point `contentPaths` and
  `docsRoot` at that source tree. `docsOutput.style` is `fumadocs`.
- `targetLocales` equals `languages` minus the default language, character
  for character.
- Leave English UI overrides as they are. Do not write `ui.<locale>.json` or
  translated MDX. Do not put this catalog in `json[]`.

## Astro Starlight

- In the Starlight config, set `locales`, including a `root` entry when the
  source language should be unprefixed (`label` and required `lang`). Set
  `defaultLocale: 'root'` when that root entry is the source language.
- Source pages stay in `src/content/docs/`. `translate-docs` writes
  `src/content/docs/<locale>/`. Point `contentPaths` at the source pages, not
  at locale folders. `outputDir` and `docsRoot` are `src/content/docs`.
  `docsOutput.style` is `astro-starlight`.
- Align `targetLocales` with the non-root locale keys. Starlight directory
  keys are often lowercase (`pt-br`). If you change case to match, say so in
  the report.
- Prefer sidebar `slug` entries so the label comes from the page title. Do
  not hand-translate sidebar `label` maps or `social[].label`. There is no
  shell catalog to add.

## Plain Astro

- Enable Astro i18n routing: `i18n.locales` includes the source locale and
  each target. Astro route codes are lowercase (`pt-br`). In the report, list
  `targetLocales`, `i18n.locales`, and the note that flat JSON filenames use
  the casing in `targetLocales`.
- `init -t ui-astro-website` leaves `docs` empty and turns on UI strings. When
  page HTML should be translated, set `features.translateDocs` to true and
  append one `docs` entry: `contentPaths` the source pages (for example
  `src/pages/index.astro`), `outputDir` `src/pages`, `addFrontmatter` false,
  `docsOutput.style` `astro-starlight`, `docsRoot` `src/pages`. Leave
  `features.translateUIStrings` as it is.
- If frontmatter or shared data calls `t()`, stop that part and tell the user
  to run the JS/TS prompt and skip i18next. Astro resolves `t` at build time.
  Do not wrap those calls here, and do not install i18next.

## Plain HTML

Each file belongs to only one pipeline. If the same file is both a `docs[]` source and
under `ui.sourceRoots`, stop and ask.

`ui-plain-html` (one page, language switches in the browser):

- Run `ai-i18n-tools mark-html` with no `--write`, read the report, then
  run it again with `--write`. It inserts `data-i18n` markers. It does not
  call a model.
- Copy `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` next to the page.
  Load it at the end of `<body>` with `data-source-locale` equal to
  `sourceLocale`, `data-locales-base` pointing at `flatOutputDir` as a URL
  relative to the script, and `data-locale-select` pointing at an empty
  `<select>`. Do not add a `docs` block for the same file.

`docs-plain-html` (one HTML file per locale):

- Confirm `contentPaths`, `outputDir`, and `docsRoot`. `docsOutput.style` is
  `nested`. Do not add `data-i18n` markers. Do not fill a language list by
  hand. `translate-docs` writes the locale files and the list.

## Verify and report

The framework's locale config matches `targetLocales`. `contentPaths` point
at source-language pages. No generated locale tree was edited. Run the
project's build or typecheck when it has one, and do not run a translation.

Report the branch you applied, the files changed, and any page you left out
of `contentPaths`, with a one-line reason. Then list the commands for the
user, and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools sync`, then build the site and open one localised route.
````

<a id="review-the-result"></a>
## परिणाम की समीक्षा करें

एजेंट एक रिपोर्ट के साथ समाप्त होता है। अनुवाद करने से पहले इसकी जाँच करें:

- डिफ। यह फ्रेमवर्क लोकल कॉन्फ़िग, `contentPaths`, और ब्रांच द्वारा वर्णित राउटिंग होना चाहिए। स्रोत पृष्ठ का गद्य पहले जैसा ही पढ़ना चाहिए। `git diff --stat` दिखाता है कि कितना बदला है।
- `targetLocales` उन लोकल कुंजियों से मेल खाता है जिन्हें फ्रेमवर्क सर्व करेगा।
- `contentPaths` स्रोत-भाषा पृष्ठों की ओर इशारा करते हैं, न कि उस लोकल फ़ोल्डर की ओर जिसे टूल को लिखना चाहिए।
- कोई भी जनरेटेड लोकल ट्री संपादित नहीं किया गया था: `docs/<locale>/`, लोकल HTML, `content/<locale>/`, `theme.<locale>.json`, या `write-translations` से स्रोत कैटलॉग के अलावा कोई Docusaurus `i18n/<locale>/` फ़ोल्डर।
- प्रोजेक्ट का बिल्ड या टाइपचेक अभी भी पास होता है।

<a id="choose-models-and-translate"></a>
## मॉडल चुनें और अनुवाद करें

आप इस भाग को चलाते हैं। यह आपकी API कुंजी का उपयोग करता है और आपके खाते पर पैसे खर्च करता है।

`init` से मॉडल सूची एक शुरुआती बिंदु है। सक्रिय प्रदाता के चैट मॉडल को रैंक करें और, जब शॉर्टलिस्ट सही दिखे, तो इसे `translationModels` में लिखें:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` केवल `translationModels` को बदलता है। वही रैंकिंग `ai-i18n-tools dashboard` के [मॉडल](/hi/guide/translation-dashboard/models) टैब पर है।

फिर अनुवाद करें और बिल्ड करें:

```bash
ai-i18n-tools sync
```

जब `features.translateDocs` चालू होता है, तो `sync` `translate-docs` चलाता है, और जब यूआई स्ट्रिंग्स चालू होती हैं (`ui-plain-html`, और एक सादी एस्ट्रो साइट जो `t()` का भी उपयोग करती है), तो `extract` प्लस `translate-ui` चलाता है। `ai-i18n-tools translate-docs` दस्तावेज़ चरण को अपने आप चलाता है।

<a id="what-gets-translated"></a>
### क्या अनुवादित होता है

पेज बॉडीज़ [डॉक्यूमेंट्स](/hi/guide/documents/) पाइपलाइन से होकर गुजरती हैं। फ़्रेमवर्क क्रोम (नेविगेशन, साइडबार, थीम लेबल) को उसी रन में संभाला जाता है जहाँ फ़्रेमवर्क इसका समर्थन करता है। यह अलग [JSON](/hi/guide/json) पाइपलाइन नहीं है। एक सादा HTML पेज जो ब्राउज़र में भाषा बदलता है, वह अपवाद है: `mark-html` और `translate-ui` फ़्लैट JSON लिखते हैं, और ब्राउज़र स्क्रिप्ट इसे लागू करती है। प्रति लोकेल एक HTML फ़ाइल डॉक्यूमेंट्स पाइपलाइन पर रहती है।

| फ्रेमवर्क | शेल और थीम स्ट्रिंग | कैसे |
| --- | --- | --- |
| डॉक्यूसॉरस | `write-translations` कैटलॉग (`{ message, description }`) | `docs[].docusaurusCatalogDir` और `translate-docs` |
| वाइटप्रेस | थीम, नेविगेशन और साइडबार कैटलॉग | `docsOutput.vitepressThemeCatalog` और `translate-docs` |
| नेक्सट्रा | `_meta.ts` साइडबार लेबल | `style: "nextra"` के साथ स्वचालित |
| नेक्सट्रा | थीम डिक्शनरी `.ts` | `docs[].nextraDictionaryPath` |
| फुमाडॉक्स | `meta.json` साइडबार लेबल | `style: "fumadocs"` के साथ स्वचालित |
| Fumadocs | UI ओवरराइड कैटलॉग | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | कई लोकेल में अंतर्निहित UI स्ट्रिंग्स | केवल पृष्ठ |

छवियां और स्क्रीनशॉट `translate-docs` द्वारा अनुवादित नहीं होते हैं। लोकेल-विशिष्ट फ़ाइलों के लिए, [छवियां और स्क्रीनशॉट](/hi/guide/images-and-screenshots/) देखें।

पहले `sync` के बाद, कुछ फ़्रेमवर्क को अभी भी उस कैटलॉग को लोड करने के लिए कॉन्फ़िग की आवश्यकता होती है जिसे कमांड ने अभी लिखा है। वे प्रॉम्प्ट इंटीग्रेशन पेजों पर रहते हैं: [वाइटप्रेस थीम कैटलॉग](/hi/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off), [नेक्स्ट्रा डिक्शनरी](/hi/guide/integrations/nextra#agent-prompt-dictionary-and-routes), और [फ़ुमाडॉक्स यूआई कैटलॉग](/hi/guide/integrations/fumadocs#agent-prompt)।

<a id="check-one-language"></a>
### एक भाषा की जाँच करें

साइट बनाएं और ब्राउज़र में एक स्थानीयकृत रूट खोलें। फ़्रेमवर्क का अपना लोकेल ड्रॉपडाउन स्विचर है। एक HTML फ़ाइल के लिए जो ब्राउज़र में स्विच करती है, उस सेलेक्ट का उपयोग करें जिसे रनटाइम भरता है। प्रति लोकेल एक HTML फ़ाइल के लिए, लोकेल फ़ोल्डर के तहत फ़ाइल खोलें।

वह टेक्स्ट जो अभी भी स्रोत भाषा में है, उसे `contentPaths` से बाहर रखा गया था, वह एक कोड फेंस, एक URL, या एक हेडिंग एंकर है, या रूट वायर्ड नहीं है। एक वाइटप्रेस नेव लेबल जो अभी भी स्रोत भाषा में है, वह थीम कैटलॉग है: पहले `sync` चलाएं, फिर [थीम-कैटलॉग प्रॉम्प्ट](/hi/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) यदि स्ट्रिंग अभी भी कॉन्फ़िग में इनलाइन हैं।

<a id="keep-it-translated"></a>
## इसे अनुवादित रखें

स्रोत पेज बदलने के बाद `ai-i18n-tools sync` को फिर से चलाएं। कैश का मतलब है कि केवल नया या बदला हुआ टेक्स्ट मॉडल में जाता है। पाइपलाइन द्वारा लिखे गए लोकेल ट्रीज़ को कमिट करें। `ai-i18n-tools dashboard` अनुवादों की समीक्षा करने के लिए [अनुवाद डैशबोर्ड](/hi/guide/translation-dashboard/) खोलता है।

`README.md` को उसी रन में अनुवाद करने के लिए, `--with-readme` के साथ स्कैफोल्ड करें (या किसी मौजूदा कॉन्फ़िग में ब्लॉक जोड़ें)। देखें [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme)।

<a id="do-it-by-hand"></a>
## इसे मैन्युअल रूप से करें

इन चरणों का पालन करें यदि आप स्वयं परिवर्तन करना पसंद करते हैं, या आप जानना चाहते हैं कि प्रॉम्प्ट क्या करता है। आपको अंत में अभी भी [CLI इंस्टॉल करना](#install-and-choose-a-provider), [प्रोजेक्ट को इनिशियलाइज़ करना](#initialise-the-project), और [अनुवाद करना](#choose-models-and-translate) होगा।

1. `contentPaths` और `docsRoot` को स्रोत-भाषा पेजों पर इंगित करें। टेम्पलेट पाथ स्टार्टर हैं।
2. फ़्रेमवर्क के लोकेल रूटिंग को सक्षम करें। उस ब्रांच का उपयोग करें जो टेम्पलेट से मेल खाती है। इंटीग्रेशन पेज में पूरा संदर्भ है।

शेल स्ट्रिंग जिन्हें फ़्रेमवर्क एक कैटलॉग से पढ़ता है, उन्हें पहले `sync` के बाद वायर्ड किया जाता है। नीचे दी गई प्रत्येक ब्रांच उस फॉलो-अप को लिंक करती है।

<a id="vitepress"></a>
### वाइटप्रेस

`locales.root` और प्रति लक्ष्य एक `locales[code]` जोड़ें, और नेव और साइडबार लिंक को `prefixVitepressThemeConfigLinks` से प्रीफ़िक्स करें। इनलाइन थीम स्ट्रिंग को पहले `sync` के लिए छोड़ दें। चेकलिस्ट: [मौजूदा साइट में i18n सक्षम करें](/hi/guide/integrations/vitepress#enable-i18n-in-an-existing-site)। `sync` द्वारा `theme.<locale>.json` लिखने के बाद, [थीम कैटलॉग प्रॉम्प्ट](/hi/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) पेस्ट करें यदि कॉन्फ़िग में अभी भी स्ट्रिंग इनलाइन हैं।

<a id="docusaurus"></a>
### डोकोसॉरस

`i18n` ब्लॉक जोड़ें, `docusaurusCatalogDir` को स्रोत कैटलॉग पर इंगित करें, और `docusaurus write-translations` चलाएं। चेकलिस्ट: [मौजूदा साइट में i18n सक्षम करें](/hi/guide/integrations/docusaurus#enable-i18n-in-an-existing-site)। शेल JSON: [शेल स्ट्रिंग](/hi/guide/integrations/docusaurus#shell-strings-write-translations)।

<a id="nextra"></a>
### नेक्स्ट्रा

MDX को `content/<sourceLocale>/` के तहत ले जाएं, `app/[lang]/` जोड़ें, और स्रोत डिक्शनरी मॉड्यूल जोड़ें। चेकलिस्ट: [मौजूदा साइट में i18n सक्षम करें](/hi/guide/integrations/nextra#enable-i18n-in-an-existing-site)। [डिक्शनरी प्रॉम्प्ट](/hi/guide/integrations/nextra#agent-prompt-dictionary-and-routes) उसी वायरिंग के लिए लंबा पास है। ऐप रिएक्ट जिसे `t()` की आवश्यकता है: [हाइब्रिड प्रॉम्प्ट](/hi/guide/integrations/nextra#optional-t-for-app-react-hybrid)।

<a id="fumadocs"></a>
### फ़ुमाडॉक्स

`defineI18n`, `app/[lang]/`, और मिडलवेयर जोड़ें। `fumadocsParser` को `dot` या `dir` से मिलाएं। चेकलिस्ट: [मौजूदा साइट में i18n सक्षम करें](/hi/guide/integrations/fumadocs#enable-i18n-in-an-existing-site)। [यूआई कैटलॉग प्रॉम्प्ट](/hi/guide/integrations/fumadocs#agent-prompt) रूट्स के मौजूद होने के बाद `i18n.translations()` को वायर करता है।

<a id="astro-starlight"></a>
### एस्ट्रो स्टारलाइट

`locales` जोड़ें, जिसमें `root` भी शामिल है जब स्रोत भाषा अनप्रीफिक्स्ड हो। पेज `src/content/docs/` में रहते हैं। चेकलिस्ट: [मौजूदा साइट में i18n सक्षम करें](/hi/guide/integrations/astro#enable-i18n-in-an-existing-site)। स्टारलाइट अपनी खुद की यूआई स्ट्रिंग भेजता है। `slug` साइडबार एंट्रीज़ को प्राथमिकता दें।

<a id="plain-astro"></a>
### प्लेन एस्ट्रो

एस्ट्रो के `i18n.locales` को चालू करें और, जब पेज HTML का अनुवाद किया जाना चाहिए, तो [प्लेन एस्ट्रो](/hi/guide/integrations/astro#plain-astro-marketing-and-app-sites) से `docs` ब्लॉक जोड़ें। फ्रंटमैटर `t()` कॉल i18next इंस्टॉल किए बिना [JS/TS प्रॉम्प्ट](/hi/guide/add-i18n-to-js#run-the-agent-prompt) का उपयोग करते हैं। एस्ट्रो बिल्ड टाइम पर `t` को हल करता है।

<a id="plain-html"></a>
### सादा HTML

दो विकल्प, और एक फ़ाइल उनमें से किसी एक से संबंधित है:

- एक पेज जो ब्राउज़र में भाषा बदलता है: `ui-plain-html`। `ai-i18n-tools mark-html` चलाएँ (ड्राई रन, फिर `--write`) और `i18n.js` लोड करें। [प्लेन HTML ऐप्स](/hi/guide/ui-strings/plain-html) देखें।
- प्रति लोकले एक अनुवादित HTML फ़ाइल: `docs-plain-html`। [HTML पेज](/hi/guide/documents/html-pages) देखें।

यह अंतिम मैन्युअल चरण है। [मॉडल चुनें और अनुवाद करें](#choose-models-and-translate) पर जारी रखें।

<a id="not-your-case"></a>
## आपका मामला नहीं?

| आपके पास है | पढ़ें |
| --- | --- |
| ऐप UI स्ट्रिंग्स | [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) या [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) |
| Django, Flask-Babel कैटलॉग, या एक ऐप जो पहले से ही GNU gettext का उपयोग करता है | [Django / Python gettext ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-django-gettext) |
| साइट के बगल में एक रिपॉजिटरी README, या मार्कडाउन फ़ाइलें और कोई साइट फ्रेमवर्क नहीं | [अपने README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme)। `init … --with-readme` साइट टेम्पलेट के बगल में वह ब्लॉक जोड़ता है |
| स्टैंडअलोन नेस्टेड लोकले JSON | [JSON](/hi/guide/json) |
| एक कॉन्फ़िग में एक साइट और ऐप स्ट्रिंग्स | [पाइपलाइनों का संयोजन](/hi/guide/combining-pipelines) |

साझा विकल्पों और प्रति-फ़्रेमवर्क अंतर के लिए संदर्भ: [एकीकरण](/hi/guide/integrations/)।

<a id="examples"></a>
## उदाहरण

| उदाहरण | यह क्या दिखाता है |
| --- | --- |
| [vitepress-docs](/hi/examples#vitepress-docs) | VitePress पेज और थीम कैटलॉग |
| [docusaurus-docs](/hi/examples#docusaurus-docs) | Docusaurus पेज और शेल JSON |
| [astro-docs](/hi/examples#astro-docs) | Starlight पेज |
| [nextra-docs](/hi/examples#nextra-docs) | Nextra 4 रूट्स और डिक्शनरी |
| [fumadocs-docs](/hi/examples#fumadocs-docs) | Fumadocs रूट्स और UI कैटलॉग |
| [astro-website](/hi/examples#astro-website) | Astro लैंडिंग पेज, HTML प्लस `t()` |
| [plain-html](/hi/examples#plain-html) | एक HTML फ़ाइल, `data-i18n` मार्कर |
| [plain-html-docs](/hi/examples#plain-html-docs) | प्रति लोकले एक HTML फ़ाइल |

`npx degit` के साथ एक कॉपी करें। कमांड: [उदाहरण](/hi/examples#nodejs-examples)।
