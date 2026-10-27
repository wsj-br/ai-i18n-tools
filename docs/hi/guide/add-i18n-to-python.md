<a id="add-i18n-to-a-python-app"></a>
# Python ऐप में i18n जोड़ें

यह वॉकथ्रू एक पायथन एप्लिकेशन लेता है जिसमें एक ही भाषा है और ai-i18n-tools के साथ लोकल्स जोड़ता है। सीधे उपयोगकर्ता-सामने वाली स्ट्रिंग्स को हाथ से या [स्ट्रिंग्स लपेटें](#wrap-strings) के तहत प्रॉम्प्ट के साथ लपेटा जाता है। `migrate-python-i18n` केवल उन असुरक्षित कॉल्स की मरम्मत करता है जो पहले से लपेटी गई हैं। कुछ भी जिसे अभी भी देखने की आवश्यकता है, उसे एक रिपोर्ट में सूचीबद्ध किया गया है।

क्या आप पहले से ही GNU gettext, Django, या Flask कैटलॉग का उपयोग कर रहे हैं? उन कॉल्स को बनाए रखें। नीचे दिए गए मिलान वाले init टेम्प्लेट को चुनें और `extract` को मौजूदा `.po` फ़ाइलों से खाली कैटलॉग स्लॉट भरने दें।

चरण:

1. सीएलआई को [इंस्टॉल करें](#install) और एपीआई कुंजी सेट करें।
2. एक [टेम्पलेट चुनें](#pick-a-template) और `init` चलाएँ।
3. `t()` या `_()` में [स्ट्रिंग्स लपेटें](#wrap-strings)।
4. उन [कॉल साइट्स को माइग्रेट करें](#migrate) जो पहले से असुरक्षित रूप से लपेटी गई हैं।
5. [मॉडल चुनें और अनुवाद करें](#translate)।
6. [रनटाइम पर लोकल स्विच करें](#switch-locale)।
7. [इसे अनुवादित रखें](#keep-it-translated)।

सुनिश्चित नहीं हैं कि यह आपका मामला है? अंत में [क्या यह आपका मामला नहीं है?](#not-your-case) देखें।

<a id="install"></a>
## इंस्टॉल करें

एनपीएम पैकेज का उपयोग करें जब मशीन में पहले से ही Node.js `>=22.16.0` ([इंस्टॉलेशन](/hi/guide/installation)) हो। एक पायथन प्रोजेक्ट के लिए, स्टैंडअलोन निष्पादन योग्य (कोई Node.js नहीं) इंस्टॉल करें।

Linux और macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

इंस्टॉलर `SHA256SUMS.txt` की जाँच करता है, कमांड को `ai-i18n-tools` के रूप में इंस्टॉल करता है, और इसे `PATH` में जोड़ता है। बाइनरीज़ को नोटराइज़ या Authenticode-साइन नहीं किया गया है। मैन्युअल चरण और एसेट नाम: [स्टैंडअलोन निष्पादन योग्य](/hi/guide/installation#standalone-executables)।

`init` को पास किए जाने वाले प्रोवाइडर के लिए API कुंजी सेट करें। उदाहरण के लिए, चीपर इन्फेरेंस:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama को किसी कुंजी की आवश्यकता नहीं है। अन्य प्रीसेट: [Built-in providers](/hi/guide/providers-and-models#built-in-providers)।

<a id="pick-a-template"></a>
## एक टेम्प्लेट चुनें

| आज का ऐप | कमांड | आपको क्या मिलता है |
| --- | --- | --- |
| हार्ड-कोडेड स्ट्रिंग्स, या नई `t()` / `_()` कॉल्स | `ai-i18n-tools init -t ui-python -P cheaperinference` | स्रोत-भाषा स्ट्रिंग द्वारा कुंजीबद्ध फ्लैट JSON, और `i18n.py` |
| GNU gettext, और आप फ्लैट JSON भी चाहते हैं | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON के साथ `.po` / `.mo`, और `i18n.py` |
| `translations/` के तहत फ्लास्क या जिंजा कैटलॉग | `ai-i18n-tools init -t ui-python-flask -P groq` | गेटटेक्स्ट कैटलॉग और `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (कोई `i18n.py` नहीं) |

`sourceLocale` और `targetLocales` को संपादित करें। `sourceLocale` स्रोत में स्ट्रिंग्स की भाषा है। कोई भी BCP-47 भाषा मान्य है; उदाहरण अक्सर `en` का उपयोग करते हैं। फ़्रेमवर्क वायरिंग: [पायथन इंटीग्रेशन](/hi/guide/integrations/python)। कॉल आकार और कैटलॉग लेआउट: [पायथन एप्लिकेशन](/hi/guide/ui-strings/python)।

<a id="wrap-strings"></a>
## स्ट्रिंग्स को रैप करें

पहले कैटलॉग प्रविष्टि देखें, फिर इंटरपोलेट करें। जनरेट की गई `i18n.py` से `t` और `_` को आयात करें (Django `gettext` और `ngettext` को रखता है)।

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

इनका मूल्यांकन किसी भी कैटलॉग लुकअप से पहले किया जाता है। एक्सट्रैक्टर उन्हें असुरक्षित के रूप में चिह्नित करता है, और `migrate-python-i18n` उन्हें फिर से लिखता है:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="agent-prompt-i18n-py"></a>

<a id="agent-prompt-i18npy-helper"></a>

इसका उपयोग Streamlit, FastAPI, फ्लैट JSON के साथ Flask, Tkinter, Qt, और एक PyWebView शेल के लिए करें। इसे एक कोडिंग एजेंट में कॉपी करें। एक Django या मौजूदा gettext प्रोजेक्ट को इसके बजाय [अगले प्रॉम्प्ट](#agent-prompt-django-gettext) का उपयोग करना चाहिए।

<details class="agent-prompt">
<summary>एजेंट प्रॉम्प्ट: i18n.py हेल्पर</summary>

````markdown
# Wrap user-facing Python strings with i18n.py

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `_()` (and the
other names in `ui.uiExtractor.funcNames`). The literal is the source-language
sentence and the catalog key. After this edit the app must behave the same when
the active locale is the source locale. Do not translate any string.

Call shapes: https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/python

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit Python (and Jinja
templates) under those roots. Skip class names, URLs and routes, import paths,
ids, enum and error codes, object keys used as identifiers, log field names,
regexes, comments, and text that is already wrapped. Do not edit the generated
`i18n.py`.

## Call shape

Import `t` and `_` from the generated `i18n.py`. Placeholders are `{name}` or
`{price:,.2f}`, passed as keyword arguments. `_("…") % x` and `_("…").format(…)`
are safe because the lookup happens first.

Never `_(f"…")`, `_("…" % x)`, or `_("…".format(…))`. If one slips in,
`migrate-python-i18n` can rewrite it later.

Before:

```python
st.write(f"Hello, {name}!")
```

After:

```python
st.write(t("Hello, {name}!", name=name))
```

Framework notes:

- Streamlit widgets keep a fixed `key=`.
- Tkinter text is rebuilt after `set_locale`.
- Qt uses `self.tr("…")` (already in the default function list).
- Jinja uses `{% trans %}` / `{% blocktrans %}` rather than an f-string inside
  the template.
- FastAPI and Flask middleware pair `set_locale` with `reset_locale` in
  `finally`.

## Order

1. `ai-i18n-tools init -t ui-python` (or `ui-python-gettext` / `ui-python-flask`
   if you also want `.po` files) so `i18n.py` exists.
2. Wrap call sites.
3. Run `ai-i18n-tools extract`. Then `ai-i18n-tools migrate-python-i18n` (dry
   run) and read the report.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys.
- Do not create a second helper besides `i18n.py`.
- Do not hand-edit `strings.json`, flat locale JSON, `.po` / `.mo`, or
  `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog.
- The project's tests pass.
- The source locale still shows the original sentences. One target locale shows
  translations after `translate-ui`.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case left for a human (the same word with different meanings,
concatenated sentences, or plurals).
````

</details>

<a id="agent-prompt-django-gettext"></a>

<a id="agent-prompt-django-and-native-gettext"></a>

इसका उपयोग तब करें जब ऐप पहले से ही Django या GNU gettext को कॉल करता हो, या जब आप `.po` कैटलॉग पर बने रहना चाहते हों। `i18n.py` न जोड़ें।

इनिट टेम्पलेट इन कॉल नामों को ठीक से पहचानते हैं: `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext`, और `self.tr`। लेज़ी और नूप वेरिएंट उस सूची में नहीं हैं। उन नामों को जोड़ें जिन्हें प्रोजेक्ट वास्तव में कॉल करता है — आमतौर पर `gettext_lazy`, `ngettext_lazy`, `pgettext_lazy`, और `gettext_noop` — `ui.uiExtractor.funcNames` में, अन्यथा `extract` उन्हें छोड़ देता है। `ngettext_lazy` को एकवचन और बहुवचन के रूप में, और `pgettext_lazy` को संदर्भ और संदेश के रूप में, नाम सूचीबद्ध होने के बाद ही पढ़ा जाता है। टेम्पलेट में `{% trans %}` और `{% blocktrans %}` अपने आप एकत्र किए जाते हैं।

<details class="agent-prompt">
<summary>एजेंट प्रॉम्प्ट: Django और नेटिव gettext</summary>

````markdown
# Wrap user-facing strings with Django / gettext

## Context

ai-i18n-tools extracts string literals passed to gettext calls whose names are
listed in `ui.uiExtractor.funcNames`, plus `{% trans %}` and `{% blocktrans %}`
in templates. The literal is the source-language message. Existing `.po` files
stay; `extract` fills empty catalog slots from them when
`ui.gettext.ingestExistingPo` is on (the default). Do not translate any string.
Do not create `i18n.py`.

## Scope

Edit Python modules, Django templates, and forms under `ui.sourceRoots`. Skip
URLs, import paths, ids, field names used as identifiers, `verbose_name` keys
that are already lazy-wrapped, comments, and migrations that must not change. Do
not wrap strings inside `help_text` that are already `gettext_lazy` calls.

## Call shape

Init with `ui-python-django` (Django `locale/` and the `django` domain) or
`ui-python-gettext` (existing GNU catalogs). Use `gettext`, `ngettext`,
`pgettext`, and `{% blocktrans %}` / `{% trans %}`. Placeholders are `%(name)s`.

Module-level model, form, and settings strings use the lazy form. Add every lazy
or noop name you call to `ui.uiExtractor.funcNames` (for example `gettext_lazy`,
`ngettext_lazy`, `pgettext_lazy`, and `gettext_noop`). The default list does not
include them.

Before:

```python
verbose_name = "Display name"
```

After:

```python
from django.utils.translation import gettext_lazy as _

verbose_name = _("Display name")
```

Template:

```django
{% blocktrans with name=user.name %}Hello, {{ name }}{% endblocktrans %}
```

The extractor stores that message with a `%(name)s` placeholder. Do not switch
Django templates to `{name}` or to i18next `{{name}}` inside a Python `t()`
call.

## Order

1. Pick `ui-python-django` or `ui-python-gettext`. Confirm `funcNames` includes
   every gettext function the code calls.
2. Wrap call sites. Keep existing `.po` files.
3. Run `ai-i18n-tools extract`.

## Do not

- Do not translate, rename, or reword msgid text.
- Do not add `i18n.py` or a flat-JSON `t()` helper next to Django's gettext.
- Do not hand-edit generated `.po`, `.mo`, `strings.json`, or
  `ui-languages.json`.
- Do not change model field names, migrations, or test selectors.

## Verify

- `ai-i18n-tools extract` lists the new messages and does not drop existing
  msgid entries that `ingestExistingPo` already filled.
- Django checks and the project's tests pass.
- The source locale still shows the original copy.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
function names you added to `funcNames`, and any ambiguous case left for a
human.
````

</details>

<a id="migrate"></a>

<a id="migrate-call-sites"></a>
## कॉल साइट्स को माइग्रेट करें

`migrate-python-i18n` तब तक एक ड्राई रन है जब तक आप `--write` पास नहीं करते। यह हमेशा `migrate-python-i18n-report.md` लिखता है। जनरेट की गई `i18n.py` फ़ाइलों को छोड़ दिया जाता है। `{value=}` जैसे डिबग फ़ील्ड और नेस्टेड फॉर्मेट स्पेक्स की रिपोर्ट की जाती है और उन्हें वैसे ही छोड़ दिया जाता है।

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

जब ड्राई रन मैन्युअल-समीक्षा साइटों को सूचीबद्ध करता है तो `--write` से पहले रिपोर्ट पढ़ें। वैकल्पिक `--report <path>` रिपोर्ट पथ को बदलता है। वैकल्पिक `--ui-block` स्कैन को एक UI ब्लॉक तक सीमित करता है।

<a id="translate"></a>

<a id="choose-models-and-translate"></a>
## मॉडल चुनें और अनुवाद करें

`init` से मॉडल सूची एक शुरुआती बिंदु है। सक्रिय प्रदाता के चैट मॉडल को रैंक करें और, जब शॉर्टलिस्ट सही दिखे, तो इसे `translationModels` में लिखें:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` केवल `translationModels` को बदलता है। वही रैंकिंग [Models](/hi/guide/translation-dashboard/models) टैब पर है। फिर निकालें और अनुवाद करें:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` `strings.json` और `ui-languages.json` लिखता है। `translate-ui` फ्लैट JSON फ़ाइलों को भरता है और, जब `ui.gettext` सेट होता है, तो `.po` / `.mo` कैटलॉग को भरता है। उन जनरेट किए गए कैटलॉग को मैन्युअल रूप से संपादित न करें।

<a id="switch-locale"></a>

<a id="switch-locale-at-runtime"></a>
## रनटाइम पर लोकैल स्विच करें

`set_locale` एक `ContextVar` टोकन लौटाता है। अनुरोध या कॉलबैक समाप्त होने पर इसे रीसेट करें।

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI और Flask मिडलवेयर को `finally` (Flask: `teardown_request`) में रीसेट करना होगा ताकि समवर्ती अनुरोधों में लोकेल लीक न हो। Django प्रोजेक्ट्स Django के लोकेल एक्टिवेशन को बनाए रखते हैं और `i18n.py` का उपयोग नहीं करते हैं। प्रति-फ्रेमवर्क नोट्स: [Locale in each framework](/hi/guide/ui-strings/python#locale)।

<a id="keep-it-translated"></a>
## इसे अनुवादित रखें

स्रोत टेक्स्ट बदलने के बाद `ai-i18n-tools sync` (या `extract` फिर `translate-ui`) को फिर से चलाएँ। कैश का मतलब है कि केवल नई या बदली हुई स्ट्रिंग ही मॉडल में जाती हैं। इसे CI में चलाएँ ताकि अनुवाद में बदलाव न आए। अनुवादों की समीक्षा करने के लिए `ai-i18n-tools dashboard` [अनुवाद डैशबोर्ड](/hi/guide/translation-dashboard/) खोलता है।

`README.md` को उसी रन में अनुवाद करने के लिए, `--with-readme` के साथ स्कैफोल्ड करें (या किसी मौजूदा कॉन्फ़िग में ब्लॉक जोड़ें)। देखें [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme)।

<a id="not-your-case"></a>
## आपका मामला नहीं?

| आपके पास है | पढ़ें |
| --- | --- |
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
| [python-gettext](/hi/examples#python-gettext) | मौजूदा gettext CLI; `translate-ui` `.po` और `.mo` को रिफ्रेश करता है |

`npx degit` के साथ एक कॉपी करें, या GitHub रिलीज़ से `ai-i18n-tools-python-examples.zip` डाउनलोड करें। कमांड्स: [Examples](/hi/examples#python-examples)।
