<a id="add-i18n-to-a-python-app"></a>
# Python ऐप में i18n जोड़ें

यह पृष्ठ एक Python एप्लिकेशन लेता है जिसमें एक ही भाषा है और ai-i18n-tools के साथ लोकल्स जोड़ता है। यह एक मार्ग का अनुसरण करता है: `ui-python` टेम्पलेट, एक छोटा `i18n.py` हेल्पर, और अनुवादों की JSON फ़ाइलें। यह मार्ग Streamlit, FastAPI, Flask, डेस्कटॉप ऐप्स और स्क्रिप्ट के लिए उपयुक्त है।

सबसे तेज़ तरीका इस पृष्ठ पर दिए गए प्रॉम्प्ट को एक कोडिंग एजेंट को देना है। यह कॉन्फ़िग सेट करता है, आपकी स्ट्रिंग्स को रैप करता है, परिणाम की जाँच करता है, और एक भाषा मेनू जोड़ सकता है। आप CLI इंस्टॉल करते हैं, प्रदाता चुनते हैं, और प्रोजेक्ट को स्वयं इनिशियलाइज़ करते हैं, क्योंकि इसके लिए आपकी API कुंजी और आपकी पसंद की आवश्यकता होती है। आप अनुवाद भी स्वयं चलाते हैं, क्योंकि इसमें आपके खाते से पैसे खर्च होते हैं।

Django, Flask-Babel कैटलॉग, या GNU gettext का उपयोग कर रहे हैं, और उन कॉल्स को बनाए रखना चाहते हैं? इसके बजाय [Add i18n to a Django / Python gettext app](/hi/guide/add-i18n-to-django-gettext) का उपयोग करें। यह `gettext` को रखता है और बिना किसी हेल्पर के `.po` और `.mo` फ़ाइलें लिखता है। निश्चित नहीं हैं कि कौन सा लागू होता है? अंत में [Not your case?](#not-your-case) देखें।

प्रवाह:

1. [CLI इंस्टॉल करें और एक प्रदाता चुनें](#install-and-choose-a-provider)।
2. `init` के साथ [परियोजना को इनिशियलाइज़ करें](#initialise-the-project)।
3. [एजेंट प्रॉम्प्ट चलाएँ](#run-the-agent-prompt)।
4. [परिणाम की समीक्षा करें](#review-the-result)।
5. [मॉडल चुनें और अनुवाद करें](#choose-models-and-translate), फिर एक भाषा की जाँच करें।
6. [इसे अनुवादित रखें](#keep-it-translated)।

क्या आप स्वयं परिवर्तन करना पसंद करते हैं, या जानना चाहते हैं कि प्रॉम्प्ट क्या करता है? [इसे मैन्युअल रूप से करें](#do-it-by-hand) उन्हीं चरणों को एक-एक करके बताता है।

<a id="install-and-choose-a-provider"></a>
## इंस्टॉल करें और एक प्रदाता चुनें

यह हिस्सा आप करते हैं, एजेंट नहीं। इंस्टॉलर आपकी मशीन को बदलता है, और API कुंजी एक रहस्य है जो आपके शेल में होना चाहिए, प्रॉम्प्ट में नहीं।

एनपीएम पैकेज का उपयोग करें जब मशीन में पहले से ही Node.js `>=22.16.0` ([इंस्टॉलेशन](/hi/guide/installation)) हो। एक पायथन प्रोजेक्ट के लिए, स्टैंडअलोन निष्पादन योग्य (कोई Node.js नहीं) इंस्टॉल करें।

Linux और macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

इंस्टॉलर `SHA256SUMS.txt` की जाँच करता है, कमांड को `ai-i18n-tools` के रूप में इंस्टॉल करता है, और इसे `PATH` में जोड़ता है। बाइनरीज़ नोटराइज़्ड या Authenticode-हस्ताक्षरित नहीं हैं। मैन्युअल चरण और एसेट नाम: [स्टैंडअलोन निष्पादन योग्य](/hi/guide/installation#standalone-executables)।

इंस्टॉलेशन की जाँच करें:

```bash
ai-i18n-tools --version
```

फिर एक प्रदाता चुनें और उसके API कुंजी को शेल में सेट करें जो अनुवाद चलाएगा। उदाहरण के लिए, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama को किसी कुंजी की आवश्यकता नहीं है। अन्य प्रीसेट: [बिल्ट-इन प्रोवाइडर](/hi/guide/providers-and-models#built-in-providers)। प्रदाता का नाम नोट करें, क्योंकि आप इसे अगले चरण में `init` को पास करेंगे। एजेंट को कभी कुंजी की आवश्यकता नहीं होती है: यह केवल ऐसे कमांड चलाता है जो कोई मॉडल कॉल नहीं करते हैं। आप कुंजी का उपयोग बाद में करते हैं, जब आप [अनुवाद करते हैं](#choose-models-and-translate)।

<a id="initialise-the-project"></a>
## परियोजना को इनिशियलाइज़ करें

आप इसे प्रॉम्प्ट से पहले, एक बार चलाते हैं। यह कॉन्फ़िग और `i18n.py` हेल्पर लिखता है, और यह ऊपर चुने गए प्रदाता का उपयोग करता है।

यह पृष्ठ एक टेम्पलेट, `ui-python` का उपयोग करता है। यह कॉन्फ़िग, `i18n.py` हेल्पर, और JSON कैटलॉग लिखता है। यह इन ऐप्स के लिए उपयुक्त है:

| आपका ऐप | नोट्स |
| --- | --- |
| Streamlit | भाषा मेनू को ऐप में कुछ पंक्तियों की आवश्यकता होती है; [भाषा स्विच जोड़ें](#step-4-add-a-language-switch) देखें |
| FastAPI | लोकल प्रति अनुरोध सेट किया जाता है |
| Flask | फ्लैट JSON कैटलॉग। `translations/` में Flask-Babel कैटलॉग के लिए, [gettext पृष्ठ](/hi/guide/add-i18n-to-django-gettext) का उपयोग करें |
| Pyramid | Flask के समान वायरिंग |
| डेस्कटॉप ऐप्स (Tkinter, PyQt, PySide) | लोकल बदलने के बाद दृश्यमान टेक्स्ट को फिर से बनाएँ |
| PyWebView | टेम्पलेट Python शेल को कवर करता है। इसके HTML पृष्ठ का अलग से अनुवाद करें |
| कमांड-लाइन उपकरण और स्क्रिप्ट | सबसे सरल मामला |

आपके द्वारा चुने गए प्रदाता के साथ init चलाएँ (इस उदाहरण में Cheaper Inference):

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
```

फिर `ai-i18n-tools.config.json` में `sourceLocale` और `targetLocales` को संपादित करें। `sourceLocale` स्रोत में स्ट्रिंग्स की भाषा है। कोई भी BCP-47 भाषा मान्य है; उदाहरणों में अक्सर `en` का उपयोग किया जाता है।

`init` को एक बार चलाएँ। यह हर बार `ai-i18n-tools.config.json` को फिर से लिखता है, इसलिए दूसरी बार चलाने पर आपके द्वारा किए गए संपादन हट जाते हैं। यदि `i18n.py` में पहले से ही मार्कर `ai-i18n-tools-i18n-py` है, तो प्रोजेक्ट पहले से ही इनिशियलाइज़ हो चुका है: इस चरण को छोड़ दें।

`init` `ui.sourceRoots` को `"."` पर सेट करता है, इसलिए `extract` पूरे रिपॉजिटरी (परीक्षण, स्क्रिप्ट, डॉक्स) को स्कैन करेगा। प्रॉम्प्ट इसे आपके एप्लिकेशन कोड तक सीमित करता है (मैन्युअल रूप से, यानी [चरण 1](#place-the-helper))।

फ्रेमवर्क वायरिंग: [Python इंटीग्रेशन](/hi/guide/integrations/python)। कॉल आकार और कैटलॉग लेआउट: [Python एप्लिकेशन](/hi/guide/ui-strings/python)।

<a id="run-the-agent-prompt"></a>
## एजेंट प्रॉम्प्ट चलाएँ

अपने कोडिंग एजेंट (Cursor, Claude Code, Copilot, या इसी तरह के) में प्रोजेक्ट खोलें, एक नई चैट शुरू करें, और नीचे दिए गए प्रॉम्प्ट को पेस्ट करें। प्रोजेक्ट पहले से ही इनिशियलाइज़ होना चाहिए। संपादित करने के लिए कुछ भी नहीं है। यदि आप कुछ छोड़ना चाहते हैं, उदाहरण के लिए कोई भाषा मेनू नहीं, तो उसी संदेश में ऐसा कहें।

एजेंट पहले जाँचता है कि CLI, कॉन्फ़िग और `i18n.py` मौजूद हैं, और यदि कोई अनुपस्थित है तो निर्देशों के साथ रुक जाता है। फिर यह तीन भागों में काम करता है:

- भाग 1, `i18n.py` और `locales/` को वहाँ रखता है जहाँ रिपॉजिटरी अपना कोड रखती है, और कॉन्फ़िग को उन पर इंगित करता है।
- भाग 2, उपयोगकर्ता-सामने वाली स्ट्रिंग को `t()` और `_()` में लपेटता है, `extract` चलाता है, और लपेटे गए कॉल्स को `migrate-python-i18n` से जाँचता है।
- भाग 3, एक भाषा मेनू, या एक CLI भाषा विकल्प और परिवेश लोकेल जोड़ता है।

यह कुछ भी इंस्टॉल या इनिशियलाइज़ नहीं करता है, आपकी API कुंजी नहीं पढ़ता है, या अनुवाद नहीं करता है। अनुवाद समीक्षा के बाद का चरण है, और आप इसे चलाते हैं।

````markdown
# Add languages to this Python app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists, and that an `i18n.py` containing
`ai-i18n-tools-i18n-py` exists. If any of them is missing, stop now and tell
the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-python -P <provider>`, then run this prompt again.
Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API
  and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `i18n.py` or
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`). Do not
  add another helper module.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and the catalogs

Skip this part when `i18n.py` and `locales/` already sit with the code that
uses them and the config points at them.

1. Move `i18n.py` and `locales/` together to where this repository keeps its
   code. A script: leave them at the root. A package or `src/` layout: put them
   in the package, beside the modules that import them. `i18n.py` loads
   `locales/` from its own folder, so do not edit paths inside it.
2. In `ai-i18n-tools.config.json`, point `ui.stringsJson`, `ui.flatOutputDir`,
   and `languagesManifestPath` (if it is set) at the new `locales/`. Set
   `ui.sourceRoots` to the application code instead of `"."`.
3. Update imports (`from i18n import t`, or `from mypkg.i18n import t`). If the
   app is installed or shipped (wheel, container), include `locales/*.json` as
   package data.
4. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text that
is already wrapped needs no change.

- Wrap text a person sees: labels, titles, captions, messages, errors,
  validation text, progress lines, emails. Leave SQL, regexes, file formats, log
  messages, CSS, identifiers, widget keys, status and enum codes, number and
  date formats, and prompts sent to a model.
- Call shapes: `t("Hello, {name}!", name=name)` and `_("Hello, %s!") % name`.
  Placeholders are `{name}`, `{price:,.2f}`, `{rate:.2%}`, or `{item!r}`, passed
  as keyword arguments. No dotted fields: pass `rate=row.rate`. Keep a literal
  `%` away from a printf letter such as `%d`.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`.
- The argument must be a string literal, so `t(variable)` is invisible. Use one
  `t()` per sentence or paragraph, with values as placeholders. Split only where
  the text already branches. Keep markers that the code detects outside `t()`.
- A value that is both stored and shown keeps its source-language value.
  Translate the label where it is displayed, and compare against the stored
  value.
- `t()` at module level runs once and freezes. Call it where the text is shown.
- Put the import with the project's other first-party imports.

Work in passes: list string literals that are not passed to `t` or `_` (a
throwaway script is fine), wrap the user-facing ones, then list again. Treat any
bulk rewrite as a draft and review its diff.

Then run `ai-i18n-tools extract` and `ai-i18n-tools migrate-python-i18n`
without `--write`, and read `migrate-python-i18n-report.md`. It finds calls that
format before the lookup. Apply its edits with `--write` only after reading
them, run `extract` again, and repeat until the dry run lists nothing. Fix
manual-review lines by hand. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads (a silent
job or a JSON-only API), or when the user asked you to leave language choice
out. A command-line program still gets this part: it has no menu, but it gets
a language option and the process locale, the same idea as the ai-i18n-tools
CLI (`-L` / `--ui-lang`, then `AI_I18N_LANG`, then a saved setting, then the
operating-system locale).

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Work out how this project's framework does it, using these
rules:

1. Choose the locale where one unit of work starts (process start, a request,
   a script rerun, window start-up, a UI event), and call `set_locale` before
   the first `t()`. That includes CLI help, usage errors, and page titles set
   before the body.
2. Choose in this order: the explicit choice (CLI option, selector, `?lang=`),
   the stored choice (settings, cookie, session), the environment, then the
   source locale. Accept only codes from `get_ui_languages()`, matched
   case-insensitively and by language (`pt-br` and `pt` become `pt-BR`).
   `set_locale` does not match. An explicit option or the app's own language
   variable that names an unavailable language warns once, then uses the source
   locale. A locale taken only from the operating system does not warn.
3. Keep the locale local to the unit of work: keep the token from `set_locale`
   and call `reset_locale(token)` in `finally` or a teardown hook. A new thread
   starts in the source locale.
4. On a screen, add a selector built from `get_ui_languages()` (each row has
   `code` and `label`), labelled `t("Language")`, on every screen that should
   switch, and store the choice. A CLI does not get a selector.
5. Make the change visible on the next command, a page reload, `st.rerun()`, or
   a function that re-applies every visible string. Each string is a
   `t("literal")` so the extractor sees it.
6. Set the text direction from `get_direction()` where the framework needs it.

Command-line programs:

- Add `--lang <code>`, `-L <code>`, and `--lang=<code>`, unless the program
  already uses those names. Read the option from the raw arguments before
  argparse builds help, so `--help` is translated too. Document the option in
  that help.
- After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`; that variable is only for the ai-i18n-tools CLI.
  With no such variable, use `LC_ALL`, then `LC_MESSAGES`, then `LANG`, and
  ignore a value of `C` or `POSIX`.
- After the environment, use a language already stored in the app's config.
  Then the host locale, then the source locale. Do not add a new config file
  just to remember the language.

Hints, to adapt rather than copy. Web apps: a middleware or before-request hook
chooses the locale, an after-request hook stores the cookie, and templates get
`t`, `_`, and the language helpers. Streamlit: set the locale at the top of the
entry script, before `st.set_page_config`, with a selectbox that has a fixed
`key`, sets `?lang=`, and calls `st.rerun()`; `streamlit_language_selector()`
sets the locale only after it is drawn. Desktop: set the saved locale before
building the window, and refresh the visible text in the selector handler.

## Verify and report

The tests pass, and none leaves a non-source locale active (`reset_locale` needs
the token from `set_locale`). `extract` writes a non-empty catalog. With the
source locale, the output is unchanged.

Report the files changed, skipped strings grouped by reason, plurals left as one
string, one word with several meanings, sentences built from translated pieces,
and any `t()` that runs at import time. Then list the commands for the user, and
do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then restart the app.
````

<a id="review-the-result"></a>
## परिणाम की समीक्षा करें

एजेंट एक रिपोर्ट के साथ समाप्त होता है। अनुवाद करने से पहले इसकी जाँच करें:

- अंतर। लपेटा हुआ टेक्स्ट पहले जैसा ही दिखना चाहिए, जिसमें कोई असंबद्ध रीफ़ॉर्मेटिंग न हो। `git diff --stat` दिखाता है कि कितना बदला है।
- रिपोर्ट में छोड़ी गई स्ट्रिंग और अस्पष्ट मामले: एक स्ट्रिंग के रूप में छोड़े गए बहुवचन, एक शब्द जिसका उपयोग संग्रहीत मान और कैप्शन के रूप में किया जाता है, और अनुवादित टुकड़ों से बने वाक्य। इन्हें मैन्युअल रूप से तय करें।
- `ai-i18n-tools extract` साफ़ चलता है, और `strings.json` उस फ़ोल्डर में है जिसकी आप अपेक्षा करते हैं।
- आपके परीक्षण पास होते हैं, और ऐप स्रोत भाषा में वैसा ही दिखता है।
- कोई भी अस्थायी स्क्रिप्ट या `migrate-python-i18n-report.md` पीछे नहीं छोड़ा गया था।

एजेंट द्वारा छोड़ी गई स्ट्रिंग बाद में स्रोत भाषा में रहने वाले टेक्स्ट के रूप में दिखाई देती हैं। [चरण 2](#wrap-strings) में एक वैकल्पिक स्क्रिप्ट है जो उस टेक्स्ट को प्रिंट करती है जो लपेटा नहीं गया है।

<a id="choose-models-and-translate"></a>
## मॉडल चुनें और अनुवाद करें

आप इस भाग को चलाते हैं। यह आपकी API कुंजी का उपयोग करता है और आपके खाते पर पैसे खर्च करता है।

`init` से मॉडल सूची एक शुरुआती बिंदु है। सक्रिय प्रदाता के चैट मॉडल को रैंक करें और, जब शॉर्टलिस्ट सही दिखे, तो इसे `translationModels` में लिखें:

```bash
ai-i18n-tools suggest-models 
ai-i18n-tools suggest-models --apply
```

`--apply` केवल `translationModels` को बदलता है। उन मॉडलों को बाहर करने के लिए `--max-output-price` का उपयोग करें जिनकी आउटपुट कीमत एक सीमा से अधिक है। यदि आप GUI पसंद करते हैं, तो [मॉडल](/hi/guide/translation-dashboard/models) चुनने के लिए `ai-i18n-tools dashboard` का उपयोग करें।

फिर निकालें और अनुवाद करें:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` `strings.json` और `ui-languages.json` लिखता है। `translate-ui` प्रति लक्ष्य भाषा एक JSON फ़ाइल लिखता है। उन जेनरेट की गई फ़ाइलों को बिना संपादित किए छोड़ दें।

`t()` लोकेल JSON में स्रोत वाक्य को देखता है। `strings.json` में आईडी लुकअप कुंजी नहीं है। एक गुम फ़ाइल या एक गुम कुंजी स्रोत वाक्य लौटाती है। हेल्पर लोड किए गए JSON को प्रक्रिया के लिए मेमोरी में रखता है, जिसमें पहली लुकअप पर फ़ाइल गुम होने पर एक खाली मैप भी शामिल है, इसलिए `translate-ui` के बाद ऐप को पुनरारंभ करें।

<a id="check-one-language"></a>
### एक भाषा की जाँच करें

ऐप को पुनरारंभ करें, एक लक्ष्य भाषा पर स्विच करें, और कुछ लपेटी हुई स्ट्रिंग वाला एक पृष्ठ खोलें। एजेंट द्वारा जोड़े गए भाषा मेनू का उपयोग करें, या लोकेल को मैन्युअल रूप से सेट करें। जो टेक्स्ट अभी भी स्रोत भाषा में है वह लपेटा नहीं गया था, आयात के समय चलता है, या `locales/<code>.json` में कोई प्रविष्टि नहीं है। कोड पर संदेह करने से पहले वाक्य के लिए JSON की जाँच करें।

<a id="keep-it-translated"></a>
## इसे अनुवादित रखें

स्रोत टेक्स्ट बदलने के बाद `ai-i18n-tools sync` (या `extract` फिर `translate-ui`) को फिर से चलाएँ। कैश का मतलब है कि केवल नई या बदली हुई स्ट्रिंग मॉडल में जाती हैं। इसे CI में चलाएँ ताकि अनुवाद विचलित न हों। अनुवाद चलाने के बाद ऐप को पुनरारंभ करें ताकि यह JSON को फिर से लोड करे। `ai-i18n-tools dashboard` अनुवादों की समीक्षा करने के लिए [अनुवाद डैशबोर्ड](/hi/guide/translation-dashboard/) खोलता है।

`README.md` को उसी रन में अनुवाद करने के लिए, `--with-readme` के साथ स्कैफोल्ड करें (या किसी मौजूदा कॉन्फ़िग में ब्लॉक जोड़ें)। देखें [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme)।

<a id="do-it-by-hand"></a>
## इसे मैन्युअल रूप से करें

यदि आप स्वयं परिवर्तन करना पसंद करते हैं, या आप जानना चाहते हैं कि प्रॉम्प्ट क्या करता है, तो इन चरणों का पालन करें। प्रत्येक चरण प्रॉम्प्ट के एक भाग से मेल खाता है। आप अंत में अभी भी [CLI इंस्टॉल करें](#install-and-choose-a-provider), [प्रोजेक्ट को इनिशियलाइज़ करें](#initialise-the-project), और [अनुवाद करें](#choose-models-and-translate)।

1. [हेल्पर और कैटलॉग रखें](#place-the-helper) जहाँ यह रिपॉजिटरी अपना कोड रखती है।
2. स्ट्रिंग को `t()` या `_()` में [लपेटें](#wrap-strings)।
3. `migrate-python-i18n` के साथ [लपेटे गए कॉल्स की जाँच करें](#step-3-check-wrapped-calls)।
4. [एक भाषा स्विच जोड़ें](#step-4-add-a-language-switch)।

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## चरण 1: हेल्पर और कैटलॉग रखें

`init` इन्हें रिपॉजिटरी रूट पर लिखता है:

| फ़ाइल | यह क्या है | इसे संपादित करें? |
| --- | --- | --- |
| `i18n.py` | हेल्पर जिसे आपका कोड आयात करता है (`t`, `_`, `set_locale`) | नहीं। यह जेनरेट किया गया है |
| `locales/strings.json` | एक्सट्रैक्शन कैश। ऐप इसे कभी नहीं पढ़ता है | नहीं। यह एक्सट्रैक्टर द्वारा जेनरेट किया गया है |
| `locales/<code>.json` | अनुवाद जिन्हें ऐप लोड करता है, प्रति भाषा एक फ़ाइल | नहीं। `translate-ui` उन्हें लिखता है |
| `locales/ui-languages.json` | भाषाओं की सूची, भाषा मेनू के लिए | नहीं। यह एक्सट्रैक्टर द्वारा जनरेट किया जाता है |

`i18n.py` उस फ़ोल्डर से `locales/` लोड करता है जिसमें वह स्थित है। हेल्पर और `locales/` फ़ोल्डर को एक साथ ले जाएँ, और `i18n.py` के अंदर के पाथ को अपरिवर्तित छोड़ दें।

| आपकी रिपॉजिटरी | वे कहाँ जाते हैं |
| --- | --- |
| रिपॉजिटरी रूट पर एक स्क्रिप्ट | `i18n.py` और `locales/` को वहीं छोड़ दें जहाँ `init` ने उन्हें लिखा था |
| एक पैकेज, जिसमें एक `src/` लेआउट शामिल है | दोनों को पैकेज में ले जाएँ, उस कोड के बगल में जो उन्हें इम्पोर्ट करता है |

उदाहरण: `src/mypkg/` के तहत एक इंस्टाल करने योग्य पैकेज `mypkg` में `src/mypkg/i18n.py` और `src/mypkg/locales/` रहते हैं।

कॉन्फ़िग को नई जगह पर अपडेट करें:

```json
{
  "ui": {
    "sourceRoots": ["src/mypkg"],
    "stringsJson": "src/mypkg/locales/strings.json",
    "flatOutputDir": "src/mypkg/locales"
  }
}
```

`sourceRoots` वह फ़ोल्डर है जिसे `extract` स्कैन करता है। इसे एप्लिकेशन पैकेज पर रखें ताकि टेस्ट और डेटा फ़ाइलें कैटलॉग से बाहर रहें। भाषा सूची पाथ, `languagesManifestPath`, `flatOutputDir` का अनुसरण करता है जब यह सेट नहीं होता है। यदि कॉन्फ़िग इसे पहले से सेट करता है, तो इसे मिलान करने के लिए बदलें।

आपके द्वारा चुने गए मॉड्यूल पाथ से `t` इम्पोर्ट करें: रिपॉजिटरी रूट पर `from i18n import t`, या एक पैकेज के अंदर `from mypkg.i18n import t`।

जब ऐप इंस्टॉल किया जाता है या कंटेनर में शिप किया जाता है, तो लोकेल JSON को पैकेज के साथ यात्रा करनी होती है। इसे पैकेज डेटा में जोड़ें (पैटर्न पैकेज डायरेक्टरी के सापेक्ष है):

```toml
[tool.setuptools.package-data]
mypkg = ["locales/*.json"]
```

`ai-i18n-tools extract` से पुष्टि करें। कैटलॉग नए `locales/` फ़ोल्डर में दिखना चाहिए।

<a id="step-2-wrap-strings"></a>
## चरण 2: स्ट्रिंग्स को रैप करें

`extract` एक स्ट्रिंग को तभी रिकॉर्ड करता है जब वह `t()` या `_()` को पास किया गया एक लिटरल हो। उन्हें जनरेटेड मॉड्यूल से इम्पोर्ट करें।

पहले कैटलॉग एंट्री देखें, फिर इंटरपोलेट करें:

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

ये किसी भी लुकअप से पहले फ़ॉर्मेटिंग चलाते हैं, इसलिए एक्सट्रैक्टर उन्हें असुरक्षित के रूप में चिह्नित करता है। [अगला चरण](#step-3-check-wrapped-calls) उन्हें ढूँढता है:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

उस टेक्स्ट को रैप करें जिसे कोई व्यक्ति देखता है: विजेट लेबल, पेज टाइटल, कैप्शन, UI में दिखाए गए एरर, प्रोग्रेस लाइन, वैलिडेशन मैसेज, और ऐसे पैराग्राफ जिनमें कुछ संख्याएँ शामिल हों। इंटरपोलेटेड संख्याओं वाला एक पैराग्राफ अभी भी एक `t()` कॉल है। प्लेसहोल्डर `{name}`, `{price:,.2f}`, या `{rate:.2%}` जैसे नाम हैं। `rate=row.rate` पास करें। `{row.rate:.2%}` जैसा प्लेसहोल्डर अस्वीकृत है।

स्रोत शब्दांकन को वैसे ही छोड़ दें। एक गुम अनुवाद उस वाक्य को लौटाता है, इसलिए ऐप स्रोत भाषा में समान रहता है।

उस टेक्स्ट को छोड़ दें जिसे प्रोग्राम मैच करता है या लॉग करता है: SQL, रेगुलर एक्सप्रेशन, फ़ाइल हेडर, लॉगर लाइनें, CSS, विजेट कुंजियाँ, एनम कोड, और वे प्रॉम्प्ट जो आप किसी मॉडल को भेजते हैं। जब कोई मान संग्रहीत और प्रदर्शित दोनों होता है (एक सेलेक्ट बॉक्स जिसका विकल्प कोड में भी तुलना किया जाता है), तो संग्रहीत मान को स्रोत भाषा में रखें और लेबल को `format_func` से अनुवादित करें।

इम्पोर्ट समय पर `t()` एक बार चलता है और स्रोत भाषा को तब तक रखता है जब तक कि उस मॉड्यूल को फिर से इम्पोर्ट नहीं किया जाता। विजेट बनने पर `t()` को कॉल करें।

<a id="find-unwrapped-strings"></a>

चरणों में काम करें: उन लिटरल को सूचीबद्ध करें जो `t()` या `_()` के आर्गुमेंट नहीं हैं, उपयोगकर्ता-सामने वाले को रैप करें, फिर से सूचीबद्ध करें। नीचे दिया गया स्क्रिप्ट वैकल्पिक है। यह f-स्ट्रिंग और `+` से जुड़े टेक्स्ट सहित उम्मीदवारों को प्रिंट करता है। यह डॉकस्ट्रिंग, SQL, और बिना स्पेस वाले टेक्स्ट को छोड़ देता है, इसलिए `Overview` जैसे छोटे लेबल को अभी भी देखने की आवश्यकता है। जब आप काम पूरा कर लें तो इसे हटा दें। फ़ाइलों को फिर से लिखने वाला एक स्क्रिप्ट एक ड्राफ्ट है: मौजूदा खाली लाइनों को रखें, नए इम्पोर्ट को प्रोजेक्ट के अन्य इम्पोर्ट के साथ रखें, प्रोजेक्ट के फ़ॉर्मेटर को चलाएं, और इसे रखने से पहले अंतर की समीक्षा करें।

<details>
<summary>वैकल्पिक: उन स्ट्रिंग को सूचीबद्ध करें जो रैप नहीं की गई हैं</summary>

```python
"""List string literals that are not passed to t() or _().

Usage: python scan_unwrapped.py path/to/package
"""

import ast
import sys
from pathlib import Path

WRAPPERS = {"t", "_", "translate", "gettext", "ngettext", "pgettext"}
SKIP_DIRS = {".venv", "venv", "env", "site-packages", "__pycache__", "node_modules"}
SQL_START = ("SELECT ", "INSERT ", "UPDATE ", "DELETE ", "WITH ", "PRAGMA ")


class Scanner(ast.NodeVisitor):
    def __init__(self) -> None:
        self.hits: list[tuple[int, str]] = []
        self.skip: set[int] = set()

    def mark_docstring(self, body: list[ast.stmt]) -> None:
        first = body[0] if body else None
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
            self.skip.add(id(first.value))

    def visit_Module(self, node: ast.Module) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_ClassDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
        if name in WRAPPERS and node.args:
            self.skip.add(id(node.args[0]))
        self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp) -> None:
        if id(node) in self.skip:
            return
        if not isinstance(node.op, ast.Add):
            self.generic_visit(node)
            return
        pieces: list[ast.expr] = []

        def flatten(item: ast.expr) -> None:
            if isinstance(item, ast.BinOp) and isinstance(item.op, ast.Add):
                flatten(item.left)
                flatten(item.right)
            else:
                pieces.append(item)

        flatten(node)
        texts = [p for p in pieces if isinstance(p, ast.Constant) and isinstance(p.value, str)]
        if not texts:
            self.generic_visit(node)
            return
        joined = "".join(p.value if p in texts else "{...}" for p in pieces)  # type: ignore[union-attr]
        for piece in texts:
            self.skip.add(id(piece))
        self.report(node.lineno, joined)
        for piece in pieces:
            if piece not in texts:
                self.visit(piece)

    def visit_JoinedStr(self, node: ast.JoinedStr) -> None:
        if id(node) not in self.skip:
            parts = [v.value if isinstance(v, ast.Constant) else "{...}" for v in node.values]
            self.report(node.lineno, "".join(str(p) for p in parts))
        # Never report the pieces of an f-string on their own.

    def visit_Constant(self, node: ast.Constant) -> None:
        if id(node) not in self.skip and isinstance(node.value, str):
            self.report(node.lineno, node.value)

    def report(self, line: int, text: str) -> None:
        if " " not in text.strip() or not any(ch.isalpha() for ch in text):
            return
        if text.startswith(SQL_START):
            return
        preview = " ".join(text.split())
        self.hits.append((line, preview if len(preview) <= 140 else preview[:137] + "..."))


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for path in sorted(root.rglob("*.py")):
        if path.name == "i18n.py" or SKIP_DIRS & set(path.parts):
            continue
        scanner = Scanner()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except SyntaxError as error:
            print(f"\n# {path}\nskipped, cannot parse with this Python: {error.msg} (line {error.lineno})")
            continue
        scanner.visit(tree)
        if scanner.hits:
            print(f"\n# {path}")
            for line, preview in scanner.hits:
                print(f"{line}: {preview}")


if __name__ == "__main__":
    main()
```

</details>

<a id="step-3-check-wrapped-calls"></a>
## चरण 3: रैप किए गए कॉल की जाँच करें

इस चरण का उपयोग तब करें जब कोड में ऐसे कॉल हों जो कैटलॉग लुकअप से पहले स्ट्रिंग को फ़ॉर्मेट करते हैं। यह पुराने रैपिंग और एजेंट स्लिप की खासियत है:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` उन्हें एक ऐसे लुकअप में फिर से लिखता है जो पहले होता है। दूसरी बार चलाने पर कुछ भी नहीं बदलता।

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
t("Hello, {name}!", name=name)
```

`st.write(f"Hello, {name}!")` जैसी बेयर स्ट्रिंग वैसी ही रहती हैं। उन्हें रैप करना [स्ट्रिंग रैप करें](#wrap-strings) है। यदि `extract` साफ है और कोड में ऊपर दिए गए तीन में से कोई भी आकार नहीं है, तो फिर से लिखने के लिए कुछ भी नहीं है।

इसे `extract` के बाद और `translate-ui` से पहले चलाएँ, ताकि कैटलॉग कभी भी f-स्ट्रिंग को कुंजी के रूप में संग्रहीत न करे।

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-python-i18n
```

यह कमांड तब तक ड्राई रन है जब तक आप `--write` पास नहीं करते। यह `migrate-python-i18n-report.md` लिखता है। उस रिपोर्ट को पढ़ें। जब संपादन सही लगें:

```bash
ai-i18n-tools migrate-python-i18n --write
ai-i18n-tools extract
```

ड्राई रन को फिर से चलाएँ। जब यह कोई संपादन सूचीबद्ध न करे तो रुक जाएँ, फिर प्रोजेक्ट के टेस्ट चलाएँ।

कमांड द्वारा छोड़ी गई लाइनें (जैसे `{value=}` जैसे डीबग फ़ील्ड, नेस्टेड फ़ॉर्मेट स्पेसिफ़िकेशन) रिपोर्ट में सूचीबद्ध हैं। उन्हें मैन्युअल रूप से ठीक करें और ड्राई रन को फिर से चलाएँ। जनरेट किया गया `i18n.py` छोड़ दिया जाता है। रिपोर्ट एक बिल्ड आर्टिफैक्ट है: इसे हटा दें या गिट-इग्नोर करें।

बिना किसी संपादन वाली रिपोर्ट का मतलब है कि रैप किए गए कॉल सुरक्षित हैं। इसका मतलब यह नहीं है कि हर उपयोगकर्ता-सामने वाले वाक्य को रैप किया गया था। [अनव्रैप्ड-लिटरल सूची](#find-unwrapped-strings) इसकी जाँच है।

वैकल्पिक `--report <path>` रिपोर्ट पाथ को बदलता है। वैकल्पिक `--ui-block` स्कैन को एक UI ब्लॉक तक सीमित करता है।

<a id="step-4-add-a-language-switch"></a>
## चरण 4: भाषा स्विच जोड़ें

हर फ़्रेमवर्क को इन्हीं चार चीज़ों की ज़रूरत होती है:

1. प्रत्येक अनुरोध, स्क्रिप्ट रन या विंडो इवेंट की शुरुआत में लोकेल चुनें, और पहले `t()` से पहले `set_locale` को कॉल करें।
2. केवल `ui-languages.json` (`get_ui_languages()`) में सूचीबद्ध भाषाओं को स्वीकार करें, और उन्हें शिथिल रूप से मिलान करें। ब्राउज़र `pt-br` भेजते हैं, जबकि कैटलॉग `pt-BR` है।
3. `get_ui_languages()` से बना एक सेलेक्टर प्रदान करें।
4. चुनाव याद रखें।

`?lang=pt-BR` खोलने से तब तक कुछ नहीं होता जब तक ऐप उसे पढ़ नहीं लेता। [एजेंट प्रॉम्प्ट](#run-the-agent-prompt) उन ऐप्स के लिए यह सब करता है जिनमें उपयोगकर्ता इंटरफ़ेस होता है, और यह अपने लिए फ़्रेमवर्क का पता लगाता है। नीचे दिए गए अनुभाग Streamlit, FastAPI, Flask और Tkinter के लिए परिणाम दिखाते हैं। अन्य फ़्रेमवर्क भी इन्हीं नियमों का पालन करते हैं।

<a id="streamlit"></a>
### Streamlit

एक Streamlit स्क्रिप्ट हर इंटरैक्शन पर फिर से चलती है, इसलिए हर रन पर स्क्रिप्ट के शीर्ष पर लोकेल चुना जाता है। क्रम:

1. पिछले रन से सेलेक्टर मान पढ़ें, फिर `?lang=`, फिर संग्रहीत लोकेल।
2. उस कोड के साथ `set_locale` को कॉल करें, `st.set_page_config` से पहले।
3. `st.set_page_config(page_title=t("…"))` को कॉल करें।
4. सेलेक्टर ड्रा करें। बदलने पर, कोड को स्टोर करें, `?lang=` सेट करें, और `st.rerun()`।

एक बार जब उपयोगकर्ता चुन लेता है तो सेलेक्टर मान जीत जाता है। `?lang=` एक नई विज़िट पर लागू होता है, उस मान के मौजूद होने से पहले। मेनू ऐप में रहता है, `i18n.py` में नहीं, इसलिए इसका लेबल `t("Language")` हो सकता है। इसे हर उस स्क्रीन पर दिखाएँ जिसे स्विच करना चाहिए, जिसमें साइन-इन पेज भी शामिल है।

<details>
<summary>विजेट कोड</summary>

```python
import streamlit as st
from i18n import get_locale, get_ui_languages, set_locale, t


def apply_requested_locale() -> str:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows] or [get_locale()]
    requested = (
        st.session_state.get("lang_selector")
        or st.query_params.get("lang")
        or st.session_state.get("locale")
        or get_locale()
    )
    choice = requested if requested in codes else codes[0]
    set_locale(choice)
    st.session_state["locale"] = choice
    if st.query_params.get("lang") != choice:
        st.query_params["lang"] = choice
    return choice


def render_language_selector() -> None:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows]
    if len(codes) < 2:
        return
    labels = {str(row["code"]): str(row.get("label") or row["code"]) for row in rows}
    current = get_locale()
    choice = st.sidebar.selectbox(
        t("Language"),
        options=codes,
        index=codes.index(current),
        format_func=lambda code: labels.get(code, code),
        key="lang_selector",
    )
    if choice != current:
        st.session_state["locale"] = choice
        st.query_params["lang"] = choice
        set_locale(choice)
        st.rerun()


apply_requested_locale()
st.set_page_config(page_title=t("My app"))


def main() -> None:
    render_language_selector()
    st.write(t("Hello"))


main()
```

</details>

`from i18n import …` को [हेल्पर और कैटलॉग रखें](#place-the-helper) से पैकेज पाथ में बदलें। हर दूसरे विजेट को एक निश्चित `key` दें, और जब विजेट बनाया जाए तो `t()` को कॉल करें। इंपोर्ट समय पर गणना किए गए लेबल स्विच के बाद स्रोत भाषा में रहते हैं। जब बाद में किसी पेज के शीर्षक की तुलना की जाती है, तो दोनों पक्षों को रैप करें: `nav.title != t("Forecast settings")`, क्योंकि `nav.title` पहले से ही अनुवादित है।

`i18n.py` से `streamlit_language_selector()` एक छोटी स्क्रिप्ट के लिए पर्याप्त है जिसका शीर्षक एक सादा स्ट्रिंग है। यह विजेट ड्रा होने पर `set_locale` को कॉल करता है, इसलिए इसके ऊपर एक अनुवादित `page_title` उस रन के लिए पिछली भाषा में रहता है, और इसका लेबल अंग्रेजी में रहता है। `examples/python-streamlit` देखें।

<a id="fastapi-flask-and-tkinter"></a>
### FastAPI, Flask, और Tkinter

<a id="choose-the-locale-for-a-request"></a>
#### किसी अनुरोध के लिए लोकले चुनें

एक वेब ऐप में भाषा के लिए तीन स्रोत होते हैं, इस क्रम में: विज़िटर की स्पष्ट पसंद (`?lang=`), वह कुकी जो इसे याद रखती है, और ब्राउज़र का `Accept-Language` हेडर। स्रोत भाषा फ़ॉलबैक होती है।

`set_locale` उसे दिए गए डेटा को मान्य या सामान्य नहीं करता है। एक ब्राउज़र जो `pt-br` या `pt` भेजता है, उसे चुपचाप स्रोत भाषा मिल जाएगी, क्योंकि कैटलॉग फ़ाइल `pt-BR.json` है। नीचे दिया गया मॉड्यूल मिलान करता है और उन कोड को अनदेखा करता है जो `ui-languages.json` में नहीं हैं। इसे `i18n.py` के बगल में सहेजें, और इसे मिडलवेयर या हुक से आयात करें (जब `i18n.py` किसी पैकेज के अंदर हो तो पैकेज पाथ का उपयोग करें)।

<details>
<summary>request_locale.py</summary>

```python
"""Choose the UI language for a request. Works with any web framework."""

from __future__ import annotations

from i18n import get_ui_languages


def _codes() -> list[str]:
    return [str(row["code"]) for row in get_ui_languages() if row.get("code")]


def source_locale() -> str:
    for row in get_ui_languages():
        if row.get("isSourceLocale"):
            return str(row["code"])
    return (_codes() or ["en"])[0]


def match(candidate: str | None) -> str | None:
    """Map "pt", "pt_br" or "PT-br" onto a language listed in ui-languages.json."""
    if not candidate:
        return None
    wanted = candidate.strip().replace("_", "-").lower()
    codes = _codes()
    for code in codes:
        if code.lower() == wanted:
            return code
    for code in codes:
        if code.lower().split("-")[0] == wanted.split("-")[0]:
            return code
    return None


def from_accept_language(header: str) -> str | None:
    ranked = []
    for part in header.split(","):
        code, _, params = part.strip().partition(";")
        quality = 1.0
        if params.strip().startswith("q="):
            try:
                quality = float(params.strip()[2:])
            except ValueError:
                quality = 0.0
        if code and code != "*" and quality > 0:
            ranked.append((quality, code))
    for _quality, code in sorted(ranked, key=lambda item: -item[0]):
        found = match(code)
        if found:
            return found
    return None


def pick(query: str | None, cookie: str | None, accept_language: str = "") -> str:
    """An explicit choice (?lang=, then the cookie) beats the browser header."""
    return match(query) or match(cookie) or from_accept_language(accept_language) or source_locale()
```

</details>

<a id="fastapi"></a>
#### FastAPI

HTTP मिडलवेयर में लोकले चुनें। `set_locale` से टोकन रखें और इसे `finally` में रीसेट करें, ताकि समवर्ती अनुरोध अपनी भाषा बनाए रखें। मिडलवेयर `?lang=` मौजूद होने पर कुकी को भी सहेजता है, और `Content-Language` और `Vary` भेजता है ताकि कैश प्रति भाषा एक प्रतिलिपि रखें। रूट सामान्य रूप से `t()` और `_()` को कॉल करते हैं। HTML पृष्ठों के लिए, सहायकों को टेम्पलेट वातावरण में एक बार जोड़ें।

<details>
<summary>FastAPI मिडलवेयर और टेम्पलेट</summary>

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = FastAPI()
templates = Jinja2Templates(directory="templates")
templates.env.globals.update(
    _=_, t=t, current_locale=get_locale, ui_languages=get_ui_languages, direction=get_direction
)


@app.middleware("http")
async def locale_middleware(request: Request, call_next):
    code = pick(
        request.query_params.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("accept-language", ""),
    )
    token = set_locale(code)
    try:
        response = await call_next(request)
        if request.query_params.get("lang"):
            response.set_cookie("lang", code, max_age=60 * 60 * 24 * 365, samesite="lax")
        response.headers["Content-Language"] = code
        response.headers.append("Vary", "Accept-Language, Cookie")
        return response
    finally:
        reset_locale(token)


@app.get("/greeting/{name}")
def greeting(name: str) -> JSONResponse:
    return JSONResponse({"message": t("Hello, {name}!", name=name), "locale": get_locale()})


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {"name": "Ada"})
```

</details>

एक API जो केवल JSON लौटाता है, उसे किसी मेनू की आवश्यकता नहीं होती है। क्लाइंट `Accept-Language` या `?lang=` भेजते हैं। मिडलवेयर के लौटने के बाद बनाया गया टेक्स्ट, जैसे कि बैकग्राउंड कार्य में या स्ट्रीमिंग प्रतिक्रिया भेजे जाने के दौरान, रीसेट के बाद चल सकता है। प्रतिक्रिया लौटाने से पहले इसे बनाएं।

<a id="flask"></a>
#### Flask

Flask में प्रत्येक कार्य के लिए एक हुक होता है। `before_request` लोकले चुनता है और टोकन रखता है, `after_request` कुकी को संग्रहीत करता है, `teardown_request` लोकले को रीसेट करता है, और एक संदर्भ प्रोसेसर टेम्पलेट को `t`, `_`, `get_locale`, `get_ui_languages`, और `get_direction` देता है। Pyramid एक `NewRequest` सब्सक्राइबर के साथ समान आकार का उपयोग करता है।

<details>
<summary>Flask हुक</summary>

```python
from flask import Flask, g, render_template, request

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = Flask(__name__)


@app.before_request
def choose_locale():
    g.locale = pick(
        request.args.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("Accept-Language", ""),
    )
    g.locale_token = set_locale(g.locale)


@app.after_request
def remember_locale(response):
    if request.args.get("lang"):
        response.set_cookie("lang", g.locale, max_age=60 * 60 * 24 * 365, samesite="Lax")
    response.headers["Content-Language"] = g.locale
    response.vary.add("Accept-Language")
    response.vary.add("Cookie")
    return response


@app.teardown_request
def clear_locale(_error):
    token = g.pop("locale_token", None)
    if token is not None:
        reset_locale(token)


@app.context_processor
def inject_i18n():
    return {
        "_": _,
        "t": t,
        "current_locale": get_locale,
        "ui_languages": get_ui_languages,
        "direction": get_direction,
    }


@app.get("/")
def home():
    return render_template("home.html", name="Ada")
```

</details>

<a id="the-language-menu-in-a-template"></a>
#### एक टेम्पलेट में भाषा मेनू

FastAPI का `Jinja2Templates` और Flask दोनों इसे रेंडर करते हैं। एक लिंक जो `?lang=` को वहन करता है, पृष्ठ को रखता है और कुकी सेट करता है, ताकि पसंद बाद के पृष्ठों पर बनी रहे। `dir` विशेषता दाएं से बाएं भाषाओं के लिए `get_direction()` का उपयोग करती है।

<details>
<summary>टेम्पलेट</summary>

```html
<!doctype html>
<html lang="{{ current_locale() }}" dir="{{ direction() }}">
  <body>
    <p>{{ t("Hello, {name}!", name=name) }}</p>
    <nav>
      {% for language in ui_languages() %}
        <a href="?lang={{ language.code }}"{% if language.code == current_locale() %} aria-current="true"{% endif %}>{{ language.label }}</a>
      {% endfor %}
    </nav>
  </body>
</html>
```

</details>

<a id="tkinter"></a>
#### Tkinter

Tkinter अपने विजेट एक बार बनाता है, इसलिए भाषा परिवर्तन को उन्हें अपडेट करना होता है। प्रत्येक दृश्यमान टेक्स्ट को एक फ़ंक्शन के रूप में लिखें जो इसके अंदर के शाब्दिक के साथ `t("…")` को कॉल करता है, उस फ़ंक्शन के साथ विजेट को पंजीकृत करें, और `set_locale` के बाद `refresh()` को कॉल करें। `extract` अभी भी हर शाब्दिक को देखता है। चुने गए कोड को ऐप की सेटिंग्स फ़ाइल में सहेजें, और विंडो बनने से पहले इसके साथ `set_locale` को कॉल करें।

<details>
<summary>भाषा मेनू के साथ Tkinter विंडो</summary>

```python
import tkinter as tk
from collections.abc import Callable
from tkinter import ttk

from i18n import get_locale, get_ui_languages, set_locale, t


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self._texts: list[tuple[tk.Misc, Callable[[], str]]] = []
        rows = [row for row in get_ui_languages() if row.get("code")]
        self._codes = [str(row["code"]) for row in rows]
        labels = [str(row.get("label") or row["code"]) for row in rows]
        self.language = ttk.Combobox(self, values=labels, state="readonly")
        self.language.current(self._codes.index(get_locale()))
        self.language.bind("<<ComboboxSelected>>", self._on_language)
        self.language.pack()
        self.greeting = ttk.Label(self)
        self.greeting.pack()
        self.bind_text(self.greeting, lambda: t("Hello, {name}!", name="Ada"))
        self.refresh()

    def bind_text(self, widget: tk.Misc, text: Callable[[], str]) -> None:
        self._texts.append((widget, text))

    def refresh(self) -> None:
        self.title(t("My app"))
        for widget, text in self._texts:
            widget.configure(text=text())

    def _on_language(self, _event: object) -> None:
        set_locale(self._codes[self.language.current()])
        self.refresh()
```

</details>

एक नया थ्रेड स्रोत भाषा में शुरू होता है, न कि विंडो की भाषा में। मुख्य थ्रेड में अनुवाद करें, या थ्रेड फ़ंक्शन की शुरुआत में `set_locale` को कॉल करें। अन्य टूलकिट को समान भागों की आवश्यकता होती है: एक फ़ंक्शन जो हर दृश्यमान टेक्स्ट को सेट करता है, और एक मेनू हैंडलर जो `set_locale` को और फिर उस फ़ंक्शन को कॉल करता है। PyQt और PySide के अपने रीट्रांसलेट हुक होते हैं; [प्रत्येक फ्रेमवर्क में लोकले](/hi/guide/ui-strings/python#locale-in-each-framework) देखें।

यह अंतिम मैन्युअल चरण है। [मॉडल चुनें और अनुवाद करें](#choose-models-and-translate) पर जारी रखें।

<a id="not-your-case"></a>
## आपका मामला नहीं?

| आपके पास है | पढ़ें |
| --- | --- |
| Django, Flask-Babel कैटलॉग, या ऐसा ऐप जो पहले से GNU gettext का उपयोग करता है | [Django / Python gettext ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-django-gettext) |
| एक JS/TS ऐप | [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) |
| एक वेबसाइट या डॉक्स साइट | [एक वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website) |
| एक रिपॉजिटरी README या अन्य मार्कडाउन फ़ाइलें | [अपने README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) |
| नेस्टेड लोकैल JSON | [JSON](/hi/guide/json) |

<a id="examples"></a>
## उदाहरण

| उदाहरण | यह क्या दिखाता है |
| --- | --- |
| [python-streamlit](/hi/examples#python-streamlit) | डैशबोर्ड, `t()` / `_()`, फ्लैट JSON |
| [python-fastapi](/hi/examples#python-fastapi) | अनुरोध-स्कोप वाला लोकेल, फ्लैट JSON |
| [python-flask](/hi/examples#python-flask) | Flask + Jinja, फ्लैट JSON |

`npx degit` के साथ एक कॉपी करें, या GitHub रिलीज़ से `ai-i18n-tools-python-examples.zip` डाउनलोड करें। कमांड: [उदाहरण](/hi/examples#python-examples)। gettext का उपयोग करने वाले ऐप के लिए, [gettext उदाहरण](/hi/examples#python-gettext) देखें।
