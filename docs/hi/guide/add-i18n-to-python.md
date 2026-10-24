<a id="add-i18n-to-a-python-app"></a>
# Python ऐप में i18n जोड़ें

यह वॉकथ्रू एक ऐसे Python एप्लिकेशन को लेता है जिसमें एक ही भाषा है और ai-i18n-tools के साथ लोकेल जोड़ता है। सुरक्षित कॉल-साइट संपादन `migrate-python-i18n` द्वारा लागू किए जाते हैं। जो कुछ भी अभी भी जांच की आवश्यकता है, उसे एक रिपोर्ट में सूचीबद्ध किया गया है।

क्या आप पहले से ही GNU gettext, Django, या Flask कैटलॉग का उपयोग कर रहे हैं? उन कॉल्स को बनाए रखें। नीचे दिए गए मिलान वाले init टेम्प्लेट को चुनें और `extract` को मौजूदा `.po` फ़ाइलों से खाली कैटलॉग स्लॉट भरने दें।

<a id="install"></a>
## इंस्टॉल करें

जब मशीन में पहले से ही Node.js `>=22.16.0` ([Installation](/hi/guide/installation)) हो, तो npm पैकेज का उपयोग करें। Python प्रोजेक्ट के लिए, सामान्य रास्ता GitHub रिलीज़ से स्टैंडअलोन निष्पादन योग्य फ़ाइल है — Linux (`x64`, `arm64`), macOS (`arm64`, `x64`), और Windows (`x64`)। `SHA256SUMS.txt` की जाँच करें, Unix पर `chmod +x` चलाएँ, और फ़ाइल को `PATH` पर रखें। बाइनरी हस्ताक्षरित नहीं हैं। एसेट नाम और चेकसम: [Standalone executables](/hi/guide/installation#standalone-executables)।

`init` को पास किए जाने वाले प्रोवाइडर के लिए API कुंजी सेट करें। उदाहरण के लिए, चीपर इन्फेरेंस:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama को किसी कुंजी की आवश्यकता नहीं है। अन्य प्रीसेट: [Built-in providers](/hi/guide/providers-and-models#built-in-providers)।

<a id="pick-a-template"></a>
## एक टेम्प्लेट चुनें

| आज का ऐप | कमांड | आपको क्या मिलता है |
| --- | --- | --- |
| हार्ड-कोडेड स्ट्रिंग, या नई `t()` / `_()` कॉल | `ai-i18n-tools init -t ui-python -P cheaperinference` | फ्लैट इंग्लिश-की JSON और `i18n.py` |
| GNU gettext, और आप फ्लैट JSON भी चाहते हैं | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON के साथ `.po` / `.mo`, और `i18n.py` |
| `translations/` के तहत फ्लास्क या जिंजा कैटलॉग | `ai-i18n-tools init -t ui-python-flask -P groq` | गेटटेक्स्ट कैटलॉग और `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (कोई `i18n.py` नहीं) |

`sourceLocale` और `targetLocales` को संपादित करें। `sourceLocale` स्रोत में स्ट्रिंग्स की भाषा है (अक्सर `en`)। फ्रेमवर्क वायरिंग: [Python integrations](/hi/guide/integrations/python)। कॉल आकार और कैटलॉग लेआउट: [Python applications](/hi/guide/ui-strings/python)।

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

<a id="migrate"></a>
## कॉल साइट्स को माइग्रेट करें

`migrate-python-i18n` तब तक एक ड्राई रन है जब तक आप `--write` पास नहीं करते। यह हमेशा `migrate-python-i18n-report.md` लिखता है। जनरेट की गई `i18n.py` फ़ाइलों को छोड़ दिया जाता है। `{value=}` जैसे डिबग फ़ील्ड और नेस्टेड फॉर्मेट स्पेक्स की रिपोर्ट की जाती है और उन्हें वैसे ही छोड़ दिया जाता है।

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

जब ड्राई रन मैन्युअल-समीक्षा साइटों को सूचीबद्ध करता है तो `--write` से पहले रिपोर्ट पढ़ें। वैकल्पिक `--report <path>` रिपोर्ट पथ को बदलता है। वैकल्पिक `--ui-block` स्कैन को एक UI ब्लॉक तक सीमित करता है।

<a id="translate"></a>
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
## रनटाइम पर लोकेल बदलें

`set_locale` एक `ContextVar` टोकन लौटाता है। अनुरोध या कॉलबैक समाप्त होने पर इसे रीसेट करें।

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI और Flask मिडलवेयर को `finally` (Flask: `teardown_request`) में रीसेट करना होगा ताकि समवर्ती अनुरोधों में लोकेल लीक न हो। Django प्रोजेक्ट्स Django के लोकेल एक्टिवेशन को बनाए रखते हैं और `i18n.py` का उपयोग नहीं करते हैं। प्रति-फ्रेमवर्क नोट्स: [Locale in each framework](/hi/guide/ui-strings/python#locale)।

<a id="examples"></a>
## उदाहरण

| उदाहरण | यह क्या दिखाता है |
| --- | --- |
| [python-streamlit](/hi/examples#python-streamlit) | डैशबोर्ड, `t()` / `_()`, फ्लैट JSON |
| [python-fastapi](/hi/examples#python-fastapi) | अनुरोध-स्कोप वाला लोकेल, फ्लैट JSON |
| [python-flask](/hi/examples#python-flask) | Flask + Jinja, फ्लैट JSON |
| [python-gettext](/hi/examples#python-gettext) | मौजूदा gettext CLI; `translate-ui` `.po` और `.mo` को रिफ्रेश करता है |

`npx degit` के साथ एक कॉपी करें, या GitHub रिलीज़ से `ai-i18n-tools-python-examples.zip` डाउनलोड करें। कमांड्स: [Examples](/hi/examples#python-examples)।
