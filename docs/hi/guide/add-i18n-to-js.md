<a id="add-i18n-to-a-jsts-app"></a>
# एक JS/TS ऐप में i18n जोड़ें

यह पृष्ठ एक JS/TS ऐप (React, Next.js, Node, या एक CLI) लेता है जिसमें एक ही भाषा है और ai-i18n-tools के साथ स्थानीय भाषाएँ जोड़ता है। यह एक ही मार्ग का अनुसरण करता है: i18next, एक छोटी बूटस्ट्रैप फ़ाइल, और अनुवादों की JSON फ़ाइलें। `extract` एक UI स्ट्रिंग को तभी रिकॉर्ड करता है जब वह `t()` या `i18n.t()` के अंदर एक स्ट्रिंग लिटरल हो, इसलिए सादे स्रोत पाठ की एक कैटलॉग खाली होगी।

सबसे तेज़ तरीका यह है कि एक कोडिंग एजेंट को इस पृष्ठ पर प्रॉम्प्ट दिया जाए। यह i18next स्थापित करता है, बूटस्ट्रैप जोड़ता है, आपकी स्ट्रिंग्स को रैप करता है, और एक भाषा स्विच जोड़ सकता है। आप CLI स्थापित करते हैं, प्रदाता चुनते हैं, और परियोजना को स्वयं आरंभ करते हैं, क्योंकि इसके लिए आपकी API कुंजी और आपकी पसंद की आवश्यकता होती है। आप अनुवाद भी स्वयं चलाते हैं, क्योंकि यह आपके खाते पर पैसे खर्च करता है।

एक वेबसाइट या डॉक्स साइट [एक वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website) का उपयोग करती है। एक Python ऐप [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) का उपयोग करता है। निश्चित नहीं कि कौन सा लागू होता है? अंत में [आपका मामला नहीं?](#not-your-case) देखें।

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

पैकेज को एक देव निर्भरता के रूप में स्थापित करें। बूटस्ट्रैप `ai-i18n-tools/runtime` को आयात करता है, और एक वैश्विक CLI या एक स्टैंडअलोन निष्पादन योग्य उस आयात को संतुष्ट नहीं कर सकता है। अन्य स्थापना विकल्प: [स्थापना](/hi/guide/installation)।

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

आप इसे प्रॉम्प्ट से पहले एक बार चलाते हैं। यह कॉन्फ़िग लिखता है और ऊपर चुने गए प्रदाता का उपयोग करता है।

```bash
ai-i18n-tools init -P openrouter
```

डिफ़ॉल्ट टेम्पलेट `ui-markdown` है। यह एक UI ब्लॉक और एक फ्लैट README ब्लॉक के साथ `ai-i18n-tools.config.json` लिखता है। ऐप के लिए चार कुंजियाँ महत्वपूर्ण हैं:

- `sourceLocale`: स्रोत में स्ट्रिंग्स की भाषा। कोई भी BCP-47 भाषा मान्य है; स्केफ़ोल्ड अक्सर `en-GB` का उपयोग करता है।
- `targetLocales`: जोड़ने वाली भाषाएँ।
- `ui.sourceRoots`: फ़ोल्डर `extract` स्कैन करता है, उदाहरण के लिए `src/`।
- `ui.stringsJson` और `ui.flatOutputDir`: जहाँ कैटलॉग और प्रति-स्थानीय फ़ाइलें लिखी जाती हैं।

`init` i18next स्थापित नहीं करता है और बूटस्ट्रैप नहीं जोड़ता है। वह प्रॉम्प्ट है (हाथ से, [चरण 1](#step-1-install-the-runtime-libraries) और [चरण 2](#step-2-extract-once-and-add-the-bootstrap))।

`init` को एक बार चलाएँ। यह हर बार `ai-i18n-tools.config.json` को फिर से लिखता है, इसलिए दूसरी बार चलाने पर आपके द्वारा किए गए संपादन हटा दिए जाते हैं।

वही टेम्पलेट दस्तावेज़ अनुवाद के लिए `README.md` को सूचीबद्ध करता है। भाषा-सूची मार्कर और रीडमी फ़ाइलें [अपनी README और Markdown डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) हैं। यह पृष्ठ `t()` पाथ है।

हर दूसरी कुंजी [कॉन्फ़िगरेशन](/hi/reference/configuration) में है। कॉल आकार: [t() कॉल और बहुवचन](/hi/guide/ui-strings/t-calls-and-plurals)। बूटस्ट्रैप संदर्भ: [i18next वायर करें](/hi/guide/ui-strings/i18next-runtime)।

<a id="run-the-agent-prompt"></a>
## एजेंट प्रॉम्प्ट चलाएँ

अपने कोडिंग एजेंट (कर्सर, क्लाउड कोड, कोपायलट, या इसी तरह के) में प्रोजेक्ट खोलें, एक नई चैट शुरू करें, और नीचे दिए गए प्रॉम्प्ट को पेस्ट करें। प्रोजेक्ट पहले से ही आरंभ किया गया होना चाहिए। संपादित करने के लिए कुछ भी नहीं है। यदि आप कुछ छोड़ना चाहते हैं, उदाहरण के लिए कोई भाषा स्विच नहीं, तो उसी संदेश में ऐसा कहें।

एजेंट पहले जाँचता है कि CLI और कॉन्फ़िग मौजूद हैं, और यदि कोई अनुपस्थित है तो निर्देशों के साथ रुक जाता है। फिर यह तीन भागों में काम करता है:

- भाग 1 i18next इंस्टॉल करता है, `extract` को एक बार चलाता है, और बूटस्ट्रैप जोड़ता है।
- भाग 2 उपयोगकर्ता-सामने वाली स्ट्रिंग को `t()` या `i18n.t()` में रैप करता है।
- भाग 3 एक भाषा स्विच, या एक CLI भाषा विकल्प जोड़ता है।

यह CLI इंस्टॉल नहीं करता है, कॉन्फ़िग को आरंभ नहीं करता है, आपकी API कुंजी नहीं पढ़ता है, या अनुवाद नहीं करता है। अनुवाद समीक्षा के बाद का चरण है, और आप इसे चलाते हैं।

````markdown
# Add languages to this JS/TS app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists with a `ui` block. If either is missing,
stop now and tell the user to install ai-i18n-tools as a dev dependency and
run `ai-i18n-tools init -P <provider>`, then run this prompt again. Do not
install the CLI or initialise the config yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`).
- Do not introduce semantic keys (`saveButton`, `nav.home`). The literal in
  `t("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Runtime

Skip a piece of this part when it is already done.

1. Install `i18next` with the project's package manager. Install
   `react-i18next` only when a component uses `useTranslation()`.
2. Run `ai-i18n-tools extract` once. It writes `strings.json` and
   `ui-languages.json` even when it finds no `t()` calls, so the app compiles.
   Expect 0 strings, or 1 when `package.json` has a `description`
   (`ui.uiExtractor.includePackageDescription` is on by default).
3. Add the bootstrap below. Put it where this repository keeps its app code,
   and point the JSON imports at `ui.stringsJson`, `ui.flatOutputDir`, and
   `languagesManifestPath` when that key is set. `SOURCE_LOCALE` must equal
   config `sourceLocale`, character for character. The sample uses `en-GB`
   only as the shape.
4. Import the bootstrap from the app entry before the first render. In
   Next.js, import it from a client module. Do not call `changeLanguage` on a
   shared i18next instance inside a server component. Concurrent requests
   share that singleton. Use a per-request `createInstance()`, or a stateless
   lookup of the flat bundle.

Not using React? Drop the `react-i18next` import and the `.use(initReactI18next)` call.

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

For JSON under `public/`, the loader fetches `/locales/<code>.json` and
parses the response. For a Node CLI with no bundler, read the file with
`readFileSync` inside that function. A call that uses `{ plurals: true, count }`
also needs the
source-locale flat file under `flatOutputDir`. That file does not exist until
the user runs `translate-ui`, so leave `sourcePluralFlatBundle` out and name
the plural calls in the report.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

Read `ui.sourceRoots` and edit only those trees (JS, JSX, TS, TSX). Leave
`className`, URLs and routes, import paths, ids, test ids, enum and error
codes, object keys used as identifiers, log field names, CSS, regexes, and
comments.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. A constant that
  would call `t()` at import time must move into a function or
  `useMemo(..., [t])`, so `t()` runs after the locale loads.
- Placeholders: `t("Hello {{name}}", { name })`. The argument must be a string
  literal. `t(variable)` and a template literal as the key are not extracted.
- Plurals: `t("{{count}} items", { plurals: true, count })`. Do not invent
  `_one` / `_other` keys.
- One `t()` per sentence. Split only where the text already branches.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

Work in passes: list string literals that are not passed to `t` or `i18n.t`,
wrap the user-facing ones, then list again. Treat any bulk rewrite as a draft
and review its diff. Then run `ai-i18n-tools extract` again.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A command-line program still gets
this part: a language option, not a widget.

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Accept only codes listed in `ui-languages.json`.

- Restore a saved locale before the first render, then draw a control labelled
  `t("Language")` whose options come from that manifest. On change, call
  `await loadLocale(code)` and then `await i18n.changeLanguage(code)`.
- In Next.js, reading `localStorage` in an effect after hydration paints the
  source locale first. Prefer a cookie the server can read, or load the saved
  locale in the client module before the first client render. Do not call
  `changeLanguage` on a shared instance inside a server component.
- A CLI: add `--lang <code>` and `-L <code>` unless those names are taken.
  Read the option before help text is built, so help can be translated too.
  After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`. Then the source locale.

## Verify and report

The project's build, type check, and tests pass. `extract` writes a non-empty
catalog of the sentences you wrapped. With the source locale, the output is
unchanged.

Report the files changed, each string you skipped with a one-line reason, the
same word used with different meanings, sentences built from translated pieces,
plurals that still need `sourcePluralFlatBundle` after the user translates,
and any `t()` that runs at import time. Then list the commands for the user,
and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then reload the app.
````

<a id="review-the-result"></a>
## परिणाम की समीक्षा करें

एजेंट एक रिपोर्ट के साथ समाप्त होता है। अनुवाद करने से पहले इसकी जाँच करें:

- डिफ़। रैप किया गया टेक्स्ट पहले जैसा ही पढ़ना चाहिए, बिना किसी असंबंधित पुनः स्वरूपण के। `git diff --stat` दिखाता है कि कितना बदला है। बूटस्ट्रैप, इसका इंपोर्ट, रैप किए गए कॉल, और भाषा स्विच अपेक्षित संपादन हैं।
- जनरेट किए गए कैटलॉग (`strings.json`, प्रति-लोकेल JSON, `ui-languages.json`) `extract` द्वारा लिखे गए को छोड़कर अछूते हैं।
- `ai-i18n-tools extract` साफ़ चलता है, और `strings.json` उन वाक्यों को सूचीबद्ध करता है जिनकी आप अपेक्षा करते हैं।
- आपके परीक्षण पास होते हैं, और ऐप मूल भाषा में वैसा ही दिखता है।
- रिपोर्ट में छोड़ी गई स्ट्रिंग और अस्पष्ट मामले: एक शब्द जिसका उपयोग विभिन्न अर्थों के साथ किया गया है, टुकड़ों से बने वाक्य, और बहुवचन। उन्हें हाथ से तय करें।
- बूटस्ट्रैप में `SOURCE_LOCALE` कॉन्फ़िग में `sourceLocale` के बराबर है।

एजेंट द्वारा छोड़ी गई स्ट्रिंग बाद में मूल भाषा में रहने वाले टेक्स्ट के रूप में दिखाई देती हैं।

<a id="choose-models-and-translate"></a>
## मॉडल चुनें और अनुवाद करें

आप इस भाग को चलाते हैं। यह आपकी API कुंजी का उपयोग करता है और आपके खाते पर पैसे खर्च करता है।

`init` से मॉडल सूची एक शुरुआती बिंदु है। सक्रिय प्रदाता के चैट मॉडल को रैंक करें और, जब शॉर्टलिस्ट सही दिखे, तो इसे `translationModels` में लिखें:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` केवल `translationModels` को बदलता है। वही रैंकिंग `ai-i18n-tools dashboard` के [मॉडल](/hi/guide/translation-dashboard/models) टैब पर है।

फिर निकालें और अनुवाद करें:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` `strings.json` और `ui-languages.json` लिखता है। `translate-ui` `ui.flatOutputDir` के तहत प्रति लक्ष्य भाषा एक JSON फ़ाइल लिखता है। उन जनरेट की गई फ़ाइलों को असंपादित छोड़ दें। जब `features.translateUIStrings` चालू होता है तो `sync` `extract` और `translate-ui` को एक साथ चलाता है। `extract` क्या स्कैन करता है और लिखता है: [UI स्ट्रिंग, चरण 2](/hi/guide/ui-strings/#step-2-extract-strings)।

`t()` लोकेल JSON में स्रोत वाक्य को खोजता है। `strings.json` में आईडी लुकअप कुंजी नहीं है। एक लापता फ़ाइल या एक लापता कुंजी स्रोत वाक्य लौटाता है।

<a id="check-one-language"></a>
### एक भाषा की जाँच करें

ऐप को रीलोड करें, एक लक्ष्य भाषा पर स्विच करें, और कुछ रैप की गई स्ट्रिंग वाली स्क्रीन खोलें। एजेंट द्वारा जोड़े गए भाषा स्विच का उपयोग करें, या `loadLocale` और `changeLanguage` को खुद कॉल करें। जो टेक्स्ट अभी भी मूल भाषा में है वह रैप नहीं किया गया था, इंपोर्ट समय पर चलता है, या लोकेल JSON में कोई एंट्री नहीं है। कोड पर संदेह करने से पहले वाक्य के लिए JSON की जाँच करें।

जब एक रैप किया गया कॉल `{ plurals: true, count }` का उपयोग करता है, तो स्रोत-लोकेल फ़्लैट फ़ाइल जोड़ें ताकि बहुवचन रूप हल हो जाएं। यह `flatOutputDir` से `{sourceLocale}.json` का एक इंपोर्ट और एक `sourcePluralFlatBundle` विकल्प जोड़ता है, जैसा कि [i18next वायर करें](/hi/guide/ui-strings/i18next-runtime) में दिखाया गया है।

<a id="keep-it-translated"></a>
## इसे अनुवादित रखें

स्रोत टेक्स्ट बदलने के बाद `ai-i18n-tools sync` (या `extract` फिर `translate-ui`) को फिर से चलाएँ। कैश का मतलब है कि केवल नए या बदले हुए स्ट्रिंग मॉडल में जाते हैं। [अनुशंसित package.json स्क्रिप्ट](/hi/guide/quick-start#recommended-packagejson-scripts) से स्क्रिप्ट जोड़ें, और CI में `sync` चलाएँ ताकि अनुवादों में बदलाव न हो। अनुवाद चलाने के बाद ऐप को फिर से लोड करें ताकि वह नया JSON उठा ले। `ai-i18n-tools dashboard` अनुवादों की समीक्षा करने के लिए [अनुवाद डैशबोर्ड](/hi/guide/translation-dashboard/) खोलता है।

डिफ़ॉल्ट `init` टेम्पलेट में `README.md` भी सूचीबद्ध है। `sync` के अनुवाद करने से पहले भाषा-सूची मार्कर पेस्ट करें। [अपनी README और Markdown डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) देखें।

<a id="do-it-by-hand"></a>
## इसे मैन्युअल रूप से करें

यदि आप स्वयं परिवर्तन करना पसंद करते हैं, या आप जानना चाहते हैं कि प्रॉम्प्ट क्या करता है, तो इन चरणों का पालन करें। चरण प्रॉम्प्ट के भागों से मेल खाते हैं। आप अभी भी अंत में [CLI इंस्टॉल करें](#install-and-choose-a-provider), [प्रोजेक्ट को इनिशियलाइज़ करें](#initialise-the-project), और [अनुवाद करें](#choose-models-and-translate)।

1. [रनटाइम लाइब्रेरीज़ इंस्टॉल करें](#step-1-install-the-runtime-libraries)।
2. [एक बार एक्सट्रेक्ट करें और बूटस्ट्रैप जोड़ें](#step-2-extract-once-and-add-the-bootstrap)।
3. `t()` या `i18n.t()` में [स्ट्रिंग रैप करें](#step-3-wrap-strings)।
4. [भाषा स्विच जोड़ें](#step-4-add-a-language-switch)।

<a id="step-1-install-the-runtime-libraries"></a>
## चरण 1: रनटाइम लाइब्रेरीज़ इंस्टॉल करें

ai-i18n-tools `i18next` या `react-i18next` पर निर्भर नहीं करता है। ऐप उन्हें इंस्टॉल करता है।

- हर JS/TS ऐप जो रनटाइम पर स्ट्रिंग देखता है: `i18next`।
- React कंपोनेंट जो `useTranslation()` को कॉल करते हैं: `react-i18next` भी।

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## चरण 2: एक बार एक्सट्रेक्ट करें और बूटस्ट्रैप जोड़ें

बूटस्ट्रैप `strings.json` और `ui-languages.json` को इम्पोर्ट करता है, और केवल `extract` उन्हें लिखता है। यह दोनों को तब भी लिखता है जब उसे कोई `t()` कॉल नहीं मिलती है, ताकि ऐप कंपाइल हो सके।

```bash
ai-i18n-tools extract
```

0 स्ट्रिंग की अपेक्षा करें, या 1 यदि आपके `package.json` में `description` है, क्योंकि एक्सट्रैक्टर इसे डिफ़ॉल्ट रूप से शामिल करता है (`ui.uiExtractor.includePackageDescription`)।

i18n सेटअप फ़ाइल बनाएँ। यह संस्करण स्ट्रिंग को रैप करने और उनका अनुवाद करने के लिए पर्याप्त है। `ai-i18n-tools.config.json` में `SOURCE_LOCALE` को `sourceLocale` के बराबर होना चाहिए। इम्पोर्ट पाथ को समायोजित करें ताकि वे `ui.stringsJson` और `ui.flatOutputDir` से मेल खाएँ।

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

React का उपयोग नहीं कर रहे हैं? `react-i18next` इम्पोर्ट और `.use(initReactI18next)` कॉल को हटा दें।

`public/` के तहत JSON बंडलों के लिए, लोडर `/locales/${code}.json` को फ़ेच करता है। बंडलर के बिना Node CLI के लिए, फ़ाइल को `readFileSync` से पढ़ें। दोनों आकार [लोकेल लोडर्स](/hi/guide/ui-strings/i18next-runtime#locale-loaders) में हैं।

पहली रेंडरिंग से पहले ऐप एंट्री से इस फ़ाइल को इम्पोर्ट करें। Next.js में, इसे एक क्लाइंट मॉड्यूल से इम्पोर्ट करें, जैसा कि [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts) में दिखाया गया है।

<a id="step-3-wrap-strings"></a>
## चरण 3: स्ट्रिंग रैप करें

`t()` का तर्क स्रोत-भाषा वाक्य है जिसे उपयोगकर्ता को देखना चाहिए। फ़्लैट लोकेल फ़ाइलें उस वाक्य द्वारा कुंजीबद्ध होती हैं।

JSX:

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node, एक CLI, या कोई भी गैर-रिएक्ट मॉड्यूल:

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

नियम ([t() कॉल्स और प्लुरल्स](/hi/guide/ui-strings/t-calls-and-plurals) में भी):

- कुंजी एक लिटरल है। `t(variable)` और <code>{'t(`Hello ${name}`)'}</code> को एक्सट्रेक्ट नहीं किया जाता है, और गैर-लिटरल कॉल्स को बिना किसी चेतावनी के छोड़ दिया जाता है।
- लिटरल के अंदर के प्लेसहोल्डर i18next फॉर्म <code v-pre>{{name}}</code> का उपयोग करते हैं, जिसे दूसरे तर्क में पास किया जाता है।
- बहुवचन: एक स्रोत वाक्य और `{ plurals: true, count }`। [कार्डिनल प्लुरल्स](/hi/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true) देखें। `_one` / `_other` कुंजियाँ स्वयं न बनाएँ।
- रिएक्ट कंपोनेंट्स `useTranslation()` से `t` लेते हैं। अन्य फ़ाइलें `i18n.t` को कॉल करती हैं। इम्पोर्ट समय पर मूल्यांकन किया गया एक स्थिरांक एक फ़ंक्शन या `useMemo(..., [t])` में जाना चाहिए, ताकि लोकैल लोड होने के बाद `t()` चले।
- Next.js सर्वर कंपोनेंट्स को साझा i18next इंस्टेंस पर `changeLanguage` को कॉल नहीं करना चाहिए। समवर्ती अनुरोध उस सिंगलटन को साझा करते हैं। प्रति-अनुरोध `createInstance()` का उपयोग करें, या फ़्लैट बंडल का स्टेटलेस लुकअप करें ([नेक्स्ट्रा हाइब्रिड](/hi/guide/integrations/nextra#optional-t-for-app-react-hybrid) देखें)।

इन्हें अकेला छोड़ दें: `className`, `href` और अन्य URL, इम्पोर्ट पाथ, आईडी, टेस्ट आईडी, एरर कोड, पहचानकर्ताओं के रूप में उपयोग की जाने वाली ऑब्जेक्ट कुंजियाँ, और टिप्पणियों के अंदर का टेक्स्ट।

`ai-i18n-tools extract` को फिर से चलाएँ। कैटलॉग में अब आपके द्वारा रैप किए गए वाक्य सूचीबद्ध होने चाहिए।

<a id="step-4-add-a-language-switch"></a>
## चरण 4: भाषा स्विच जोड़ें

पहले रेंडर से पहले एक सहेजे गए लोकेल को पुनर्स्थापित करें, जैसा कि [i18next को वायर करें](/hi/guide/ui-strings/i18next-runtime#startup-locale) में वर्णित है। फिर एक नियंत्रण जोड़ें जो `await loadLocale(code)` के बाद `await i18n.changeLanguage(code)` को कॉल करता है। `ui-languages.json` से विकल्प बनाएँ। विजेट, लेबल और दाएँ-से-बाएँ लेआउट: [भाषा स्विचर और RTL](/hi/guide/ui-strings/language-switcher)।

एक कमांड-लाइन प्रोग्राम में कोई विजेट नहीं होता है। `--lang <code>` (और `-L` जब वह नाम खाली हो) जोड़ें, फिर एक भाषा पर्यावरण चर जिसे ऐप पहले से ही रखता है। `AI_I18N_LANG` को न पढ़ें; वह चर केवल ai-i18n-tools CLI के लिए है। केवल `ui-languages.json` में सूचीबद्ध कोड स्वीकार करें।

इस चरण को छोड़ दें जब प्रोग्राम कोई ऐसा टेक्स्ट न दिखाए जिसे कोई व्यक्ति पढ़ता हो।

यह अंतिम मैन्युअल चरण है। [मॉडल चुनें और अनुवाद करें](#choose-models-and-translate) पर जारी रखें।

<a id="coming-from-another-tool"></a>
## किसी अन्य टूल से आ रहे हैं

ai-i18n-tools में अपना स्ट्रिंग एक्सट्रैक्टर शामिल है। यदि आपने `i18next-scanner`, `babel-plugin-i18next-extract`, या इसी तरह के किसी अन्य का उपयोग किया है, तो माइग्रेट करने के बाद आप उन देव डिपेंडेंसी को हटा सकते हैं। मौजूदा i18next नेमस्पेस JSON फ़ाइलें [JSON पाइपलाइन](/hi/guide/json#i18next-namespace-files) पर रह सकती हैं। Intlayer `.content.ts` डिक्शनरी को `migrate-intlayer` के साथ इम्पोर्ट किया जा सकता है: [Intlayer से माइग्रेट करना](/hi/guide/migrating-from-intlayer) देखें। रनटाइम पर Intlayer को रखने और केवल उसके अनुवादों को भरने के लिए, `translate-intlayer` का उपयोग करें: [Intlayer को यथास्थान अनुवादित करना](/hi/guide/translating-intlayer) देखें।

<a id="not-your-case"></a>
## आपका मामला नहीं?

| आपका आज का कोड | पढ़ें |
| --- | --- |
| पहले से ही स्रोत-भाषा वाक्य के साथ `t("…")` या `i18n.t("…")` | [UI स्ट्रिंग्स](/hi/guide/ui-strings/) चरण 2-3, फिर [i18next वायर करें](/hi/guide/ui-strings/i18next-runtime) |
| i18next नेमस्पेस JSON (`t("saveButton")` और `en/translation.json`) | [JSON](/hi/guide/json)। उन कुंजियों को स्रोत-भाषा वाक्यों में न बदलें जब तक कि आप हर कॉल को बदलने के लिए तैयार न हों |
| इंटलेयर डिक्शनरी, इंटलेयर से हट रहे हैं | [इंटलेयर से माइग्रेट करना](/hi/guide/migrating-from-intlayer) |
| इंटलेयर डिक्शनरी, इंटलेयर को बनाए रखना | [इंटलेयर को यथास्थान अनुवाद करना](/hi/guide/translating-intlayer) |
| एक HTML फ़ाइल | [प्लेन HTML](/hi/guide/ui-strings/plain-html) और `mark-html` |
| डॉक साइट्स, या एस्ट्रो पेज HTML | [किसी वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website) और [एस्ट्रो वेबसाइट](/hi/guide/ui-strings/astro-website)। `t()` केवल साझा डेटा और फ्रंटमैटर के लिए है |
| एक पायथन ऐप | [एक पायथन ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) |
| Django, Flask-Babel कैटलॉग, या एक ऐप जो पहले से ही GNU gettext का उपयोग करता है | [Django / Python gettext ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-django-gettext) |
| एक रिपॉजिटरी README या अन्य मार्कडाउन फ़ाइलें | [अपने README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) |

<a id="examples"></a>
## उदाहरण

| उदाहरण | यह क्या दिखाता है |
| --- | --- |
| [कंसोल-ऐप](/hi/examples#console-app) | सबसे छोटा Node ऐप, `t()` पहले से ही रैप किया गया है, साथ ही एक README ब्लॉक |
| [नेक्स्टजेएस-ऐप](/hi/examples#nextjs-app) | React बूटस्ट्रैप, बहुवचन, एक डॉक्स साइट, और एक README ब्लॉक |

`npx degit` के साथ एक कॉपी करें। कमांड: [उदाहरण](/hi/examples#nodejs-examples)।
