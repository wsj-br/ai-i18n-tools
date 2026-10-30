<a id="add-i18n-to-a-django--python-gettext-app"></a>
# एक Django / Python gettext ऐप में i18n जोड़ें

यह पृष्ठ एक Python एप्लिकेशन के लिए है जो GNU gettext के साथ अनुवाद करता है, या जो करेगा: Django, Flask-Babel शैली कैटलॉग के साथ Flask, या कोई भी ऐप जो `gettext()` को कॉल करता है। आप gettext कॉल को वैसे ही रखते हैं। ai-i18n-tools उन्हें पढ़ता है, संदेशों का अनुवाद करता है, और `.po` और संकलित `.mo` फ़ाइलें लिखता है जिन्हें आपका ऐप पहले से लोड करता है। किसी सहायक मॉड्यूल की आवश्यकता नहीं है।

सबसे तेज़ तरीका इस पृष्ठ पर दिए गए प्रॉम्प्ट को एक कोडिंग एजेंट को देना है। यह कॉन्फ़िग सेट करता है, आपकी स्ट्रिंग्स को रैप करता है, परिणाम की जाँच करता है, और एक भाषा स्विच जोड़ सकता है। आप CLI इंस्टॉल करते हैं, प्रदाता चुनते हैं, और परियोजना को स्वयं इनिशियलाइज़ करते हैं, क्योंकि इसके लिए आपकी API कुंजी और आपकी पसंद की आवश्यकता होती है। आप अनुवाद भी स्वयं चलाते हैं, क्योंकि यह आपके खाते से पैसे खर्च करता है और आपकी `.po` और `.mo` फ़ाइलों को फिर से लिखता है।

क्या आप आज एक Streamlit, FastAPI, Flask, डेस्कटॉप, या स्क्रिप्ट ऐप बना रहे हैं जिसमें gettext नहीं है? इसके बजाय [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) का उपयोग करें। यह एक छोटा `i18n.py` सहायक जोड़ता है और JSON कैटलॉग लिखता है। निश्चित नहीं हैं कि कौन सा लागू होता है? अंत में [क्या यह आपका मामला नहीं है?](#not-your-case) देखें।

प्रवाह:

1. [CLI स्थापित करें और एक प्रदाता चुनें](#install-and-choose-a-provider)।
2. `init` के साथ [परियोजना को आरंभ करें](#initialise-the-project)।
3. [एजेंट प्रॉम्प्ट चलाएँ](#run-the-agent-prompt)।
4. [परिणाम की समीक्षा करें](#review-the-result)।
5. [मॉडल चुनें और अनुवाद करें](#translate), फिर एक भाषा की जाँच करें।
6. [इसे अनुवादित रखें](#keep-it-translated)।

परिवर्तन स्वयं करना पसंद करते हैं, या जानना चाहते हैं कि प्रॉम्प्ट क्या करता है? [इसे हाथ से करें](#do-it-by-hand) उन्हीं चरणों को एक-एक करके बताता है।

<a id="install-and-choose-a-provider"></a>
## स्थापित करें और एक प्रदाता चुनें

आप यह हिस्सा करते हैं, एजेंट नहीं। इंस्टॉलर आपकी मशीन को बदलता है, और API कुंजी एक रहस्य है जो आपके शेल में होनी चाहिए, प्रॉम्प्ट में नहीं।

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

स्थापना की जाँच करें:

```bash
ai-i18n-tools --version
```

फिर एक प्रदाता चुनें और उसके API कुंजी को शेल में सेट करें जो अनुवाद चलाएगा। उदाहरण के लिए, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama को किसी कुंजी की आवश्यकता नहीं है। अन्य प्रीसेट: [अंतर्निहित प्रदाता](/hi/guide/providers-and-models#built-in-providers)। प्रदाता का नाम नोट करें, क्योंकि आप इसे अगले चरण में `init` को पास करेंगे। एजेंट को कभी कुंजी की आवश्यकता नहीं होती है: यह केवल ऐसे कमांड चलाता है जो कोई मॉडल कॉल नहीं करते हैं। आप कुंजी का उपयोग बाद में करेंगे, जब आप [अनुवाद करेंगे](#translate)।

<a id="initialise-the-project"></a>
## परियोजना को आरंभ करें

आप इसे प्रॉम्प्ट से पहले, एक बार चलाते हैं। यह कॉन्फ़िग लिखता है, और यह उस प्रदाता का उपयोग करता है जिसे आपने ऊपर चुना था। उस टेम्पलेट को चुनें जो आपके ऐप से मेल खाता हो:

| आपका ऐप | टेम्पलेट | यह जो कैटलॉग लिखता है |
| --- | --- | --- |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` और `.mo` |
| Flask-Babel शैली कैटलॉग के साथ Flask | `ui-python-flask` | `translations/<lang>/LC_MESSAGES/messages.po` और `.mo` |
| कोई भी अन्य Python ऐप जो पहले से GNU gettext का उपयोग करता है | `ui-python-gettext` | `locales/<lang>/LC_MESSAGES/messages.po` और `.mo` |

टेम्पलेट नाम और आपके द्वारा चुने गए प्रदाता के साथ init चलाएँ:

```bash
ai-i18n-tools init -t ui-python-django -P cheaperinference
```

`init` को एक बार चलाएँ। यह हर बार `ai-i18n-tools.config.json` को फिर से लिखता है, इसलिए दूसरी बार चलाने पर आपके द्वारा किए गए संपादन हट जाएंगे। यदि कॉन्फ़िग पहले से मौजूद है और अनुकूलित है, तो `init` को छोड़ दें और कॉन्फ़िग को संपादित करें।

`ui-python-gettext` और `ui-python-flask` उस फ़ाइल के गुम होने पर एक `i18n.py` हेल्पर भी लिखते हैं। एक गेटटेक्स्ट ऐप को इसकी आवश्यकता नहीं होती है, इसलिए इसे हटा दें (प्रॉम्प्ट आपके लिए यह करता है)। `ui-python-gettext` गेटटेक्स्ट कैटलॉग के बगल में JSON फ़ाइलें भी लिखता है। केवल गेटटेक्स्ट कैटलॉग लिखने के लिए, `ui` ब्लॉक में `"flatOutput": false` सेट करें (प्रॉम्प्ट यह भी करता है)। `ui-python-django` न तो हेल्पर लिखता है और न ही JSON, क्योंकि Django अपनी खुद की अनुवाद प्रणाली रखता है।

फिर `ai-i18n-tools.config.json` में `sourceLocale` और `targetLocales` को संपादित करें। `sourceLocale` आपके कोड में स्ट्रिंग्स की भाषा है। कोई भी BCP-47 भाषा मान्य है; उदाहरण अक्सर `en` का उपयोग करते हैं। लक्ष्य कोड को `pt-BR` के रूप में लिखें। कैटलॉग फ़ोल्डर `pt_BR` है, वह फ़ॉर्म जिसकी गेटटेक्स्ट और Django अपेक्षा करते हैं (`localeFormat` `posix` है)।

<a id="run-the-agent-prompt"></a>
## एजेंट प्रॉम्प्ट चलाएँ

अपने कोडिंग एजेंट (कर्सर, क्लाउड कोड, कोपायलट, या इसी तरह के) में प्रोजेक्ट खोलें, एक नई चैट शुरू करें, और नीचे दिए गए प्रॉम्प्ट को पेस्ट करें। प्रोजेक्ट पहले से ही आरंभ किया गया होना चाहिए। संपादित करने के लिए कुछ भी नहीं है। यदि आप कुछ छोड़ना चाहते हैं, उदाहरण के लिए कोई भाषा स्विच नहीं, तो उसी संदेश में ऐसा कहें।

एजेंट पहले जाँचता है कि CLI और कॉन्फ़िग मौजूद हैं, और यदि कोई गुम है तो निर्देशों के साथ रुक जाता है। फिर यह चार भागों में काम करता है:

- भाग 1 कॉन्फ़िग को आपके मौजूदा कैटलॉग से मेल खाता है, और उन `i18n.py` को हटाता है जिन्हें कुछ टेम्पलेट लिखते हैं।
- भाग 2 उपयोगकर्ता-सामने वाली स्ट्रिंग्स को उन गेटटेक्स्ट कॉल्स और टेम्पलेट टैग्स से लपेटता है जिनका आप पहले से उपयोग करते हैं।
- भाग 3 `extract` चलाता है और उन कॉल्स को ढूंढता है जो लुकअप से पहले फ़ॉर्मेट करते हैं।
- भाग 4 भाषा स्विच जोड़ता है।

यह कुछ भी स्थापित या आरंभ नहीं करता है, आपकी API कुंजी नहीं पढ़ता है, या अनुवाद नहीं करता है। यह `makemessages` या `compilemessages` नहीं चलाता है, और यह आपकी `.po` और `.mo` फ़ाइलों को अकेला छोड़ देता है। अनुवाद समीक्षा के बाद का चरण है, और आप इसे चलाते हैं।

<details class="agent-prompt">
<summary>एजेंट प्रॉम्प्ट: Django या गेटटेक्स्ट ऐप में भाषाएँ जोड़ें</summary>

````markdown
# Add languages to this gettext app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs and that
`ai-i18n-tools.config.json` exists with a `ui.gettext` block. If either is
missing, stop now and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-python-django` for Django, `ui-python-flask` for
Flask-Babel catalogs, and `ui-python-gettext` for any other gettext app. Do not
install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API,
  cost money, and `translate-ui` rewrites the `.po` and `.mo` files. The user
  runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not hand-edit `.po`,
  `.mo`, `.pot`, or `strings.json`. Do not run `makemessages` or
  `compilemessages`. Do not create `i18n.py` or any other translation helper.
  Do not edit migrations or change field names.
- Do not reformat unrelated code. Run the project's formatter and linter at the
  end. Leave unrelated edits in a dirty tree alone. Delete throwaway scripts and
  do not commit them.

## Part 1 — Config

1. If init wrote an `i18n.py`, delete it. A gettext app does not use it. If the
   project uses the `ui-python-gettext` template, set `"flatOutput": false` in
   the `ui` block.
2. Make the config match the project. `ui.gettext.outputDir`, `potPath`, and
   `domain` must be where the existing catalogs live and the domain the app
   loads (Django: `django`; Flask-Babel: `messages`). Put `ui.stringsJson` and
   `ui.flatOutputDir` beside the catalogs. Set `ui.sourceRoots` to the
   application code instead of `"."`. Use one `ui` block per catalog tree when
   apps keep separate `locale/` folders.
3. Keep the existing `.po` files. `extract` reads them and keeps their
   translations.

## Part 2 — Wrap strings

Keep the gettext calls the project already uses, and wrap what is missing. The
literal is the source-language message. With the source language active, the
app must behave exactly as before.

- Python: `gettext`, `ngettext`, `pgettext`. Placeholders are `%(name)s`,
  filled after the lookup: `_("Hello, %(name)s!") % {"name": name}`. Strings that
  run at import time (models, forms, apps, settings) use the lazy form, for
  example `from django.utils.translation import gettext_lazy as _`. Never apply
  `%` to a lazy string at import time. Use `format_lazy`.
- Templates: add `{% load i18n %}` where needed. Use `{% translate "…" %}` and
  `{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}`.
  Do not switch templates to `{name}` placeholders.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`. The argument must be a string literal, so `_(variable)` is
  invisible.
- `extract` knows `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`,
  `pgettext`, and `self.tr`. Add every other name the code calls to
  `ui.uiExtractor.funcNames`: for example `gettext_lazy` called directly,
  `ngettext_lazy`, `pgettext_lazy`, `npgettext`, `gettext_noop`.
- Wrap text a person sees: labels, headings, messages, form and model text,
  emails, admin text. Leave identifiers, URLs, route names, field names,
  settings keys, log messages, SQL, and text that is already wrapped. A value
  that is both stored and shown (choices) keeps its stored value. Wrap the
  label.

Work in passes: wrap, run `ai-i18n-tools extract`, look for text still
unwrapped, and repeat.

## Part 3 — Check

1. `ai-i18n-tools extract` lists the new messages and keeps the entries filled
   from the existing `.po` files.
2. Run `ai-i18n-tools migrate-python-i18n` without `--write` and read
   `migrate-python-i18n-report.md`. It finds calls that format before the
   lookup. Fix each one by hand with `%(name)s` and a dict. Never use `--write`:
   it rewrites f-strings and `.format()` calls to `t(...)`, which a gettext app
   does not have. Do not commit the report.
3. Django's checks and the project's tests pass, and the source language still
   shows the original text.

## Part 4 — Language switch

Skip this part when the user asked you to leave the switch out. It changes the
layout.

Goal: the user can pick a language, the choice is remembered, and every request
after that uses it. Use the framework's own mechanism, and accept only the
languages in `sourceLocale` and `targetLocales`.

- Django: `LANGUAGE_CODE` is the source language. `LANGUAGES` lists the
  supported languages with Django's lower-case codes (`pt-br`). `LOCALE_PATHS`
  points at `gettext.outputDir`, unless each app keeps its own `locale/` folder.
  Add `django.middleware.locale.LocaleMiddleware` after `SessionMiddleware` and
  before `CommonMiddleware`. Add `path("i18n/", include("django.conf.urls.i18n"))`
  to the URLconf, and a form that posts to `set_language` with a `next` field
  and a select built from `get_available_languages`, labelled
  `{% translate "Language" %}`.
- Flask-Babel: the locale selector returns, in order, `?lang=`, a cookie that
  remembers it, the `Accept-Language` header, then the source language. Match
  case-insensitively (`pt-br` is `pt-BR`) and ignore unknown codes. Keep
  `translations/` as the translation directory. Add a menu of links that carry
  `?lang=`, and store the cookie.
- Plain gettext: build the translations object with
  `gettext.translation(domain, localedir, languages=[code], fallback=True)`,
  converting `pt-BR` to `pt_BR`. In a web app build it per request. Do not use
  `gettext.install` there, because it is global and concurrent requests would
  share a language.
- Any framework: choose the language where a request or run starts, remember
  the choice, and keep it local to that request.

## Verify and report

The tests pass. With the source language, the output is unchanged. After the
user runs `translate-ui` and restarts the server, switching shows translations.
Before that, it shows the source text.

Report the files changed, each string you skipped with a one-line reason, the
function names you added to `funcNames`, plurals left as one string, one word
with several meanings, and sentences built from translated pieces. Then list
the commands for the user, and do not run them: `ai-i18n-tools translate-ui`,
then restart the server. Remind the user to commit first, because `translate-ui`
rewrites the `.po` files.
````

</details>

<a id="review-the-result"></a>
## परिणाम की समीक्षा करें

एजेंट एक रिपोर्ट के साथ समाप्त होता है। अनुवाद करने से पहले इसकी जाँच करें:

- अंतर (diff)। केवल रैप्ड कॉल्स, टेम्पलेट टैग, कॉन्फ़िग और भाषा स्विच में बदलाव होना चाहिए। आपकी `.po` और `.mo` फ़ाइलें तब तक अछूती रहनी चाहिए जब तक आप अनुवाद नहीं करते।
- `ai-i18n-tools.config.json`: `gettext.outputDir` और `domain` उन कैटलॉग की ओर इशारा करते हैं जिन्हें आपका ऐप लोड करता है, और `sourceRoots` एप्लिकेशन कोड को कवर करता है।
- `ai-i18n-tools extract` नए संदेशों को सूचीबद्ध करता है और आपकी `.po` फ़ाइलों में पहले से मौजूद अनुवादों को रखता है।
- `migrate-python-i18n` का ड्राई रन कुछ भी नहीं दिखाता है जिसे ठीक करना बाकी है।
- Django के चेक और आपके टेस्ट पास होते हैं, और ऐप स्रोत भाषा में वैसा ही दिखता है।
- रिपोर्ट में छोड़ी गई स्ट्रिंग्स और अस्पष्ट मामले: बहुवचन एक स्ट्रिंग के रूप में छोड़े गए, दो अर्थों वाला एक शब्द, और अनुवादित टुकड़ों से बने वाक्य। इन्हें मैन्युअल रूप से तय करें।

इस स्थिति को कमिट करें। `translate-ui` आपकी `.po` फ़ाइलों को फिर से लिखता है, इसलिए आप समीक्षा के लिए एक साफ अंतर (diff) चाहेंगे।

<a id="choose-models-and-translate"></a>
## मॉडल चुनें और अनुवाद करें

आप इस भाग को चलाते हैं। यह आपकी API कुंजी का उपयोग करता है, आपके खाते पर पैसे खर्च करता है, और आपकी `.po` फ़ाइलों को फिर से लिखता है, इसलिए पहले कमिट करें।

`init` से मॉडल सूची एक शुरुआती बिंदु है। सक्रिय प्रदाता के चैट मॉडल को रैंक करें और, जब शॉर्टलिस्ट सही दिखे, तो इसे `translationModels` में लिखें:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` केवल `translationModels` को बदलता है। वही रैंकिंग [मॉडल](/hi/guide/translation-dashboard/models) टैब पर है। फिर अनुवाद करें:

```bash
ai-i18n-tools translate-ui
```

`translate-ui` `.pot` टेम्पलेट, प्रति लक्ष्य स्थानीय एक `.po`, और संकलित `.mo` लिखता है। अब से उन फ़ाइलों को असंपदित छोड़ दें, क्योंकि अगली बार चलाने पर वे फिर से उत्पन्न हो जाएंगी। इसे कमिट करने से पहले पहले अंतर (diff) की समीक्षा करें।

यदि सर्वर नई `.mo` फ़ाइलों को नहीं उठाता है तो उसे पुनरारंभ करें।

<a id="check-one-language"></a>
### एक भाषा की जाँच करें

एक लक्ष्य भाषा पर स्विच करें और कुछ रैप्ड स्ट्रिंग्स वाले पेज को देखें। जो टेक्स्ट अभी भी स्रोत भाषा दिखाते हैं वे रैप नहीं किए गए थे, या `.mo` को फिर से लोड नहीं किया गया था। जो टेक्स्ट आउटपुट में `%(name)s` दिखाते हैं, उन्होंने अपना शब्दकोश खो दिया। `.po` फ़ाइल में प्लेसहोल्डर्स की जाँच करें।

<a id="keep-it-translated"></a>
## इसे अनुवादित रखें

स्रोत टेक्स्ट बदलने के बाद `ai-i18n-tools sync` (या `extract` फिर `translate-ui`) को फिर से चलाएँ। कैश का मतलब है कि केवल नई या बदली हुई स्ट्रिंग ही मॉडल में जाती हैं। इसे CI में चलाएँ ताकि अनुवाद में बदलाव न आए। अनुवादों की समीक्षा करने के लिए `ai-i18n-tools dashboard` [अनुवाद डैशबोर्ड](/hi/guide/translation-dashboard/) खोलता है।

`purge-locale` किसी स्थानीय भाषा/क्षेत्र के `.po` और `.mo` को हटाता है। `.po` फ़ाइलों को कमिट करें। `.mo` फ़ाइलों को भी कमिट करें, जब तक कि आपका बिल्ड उन्हें संकलित न करता हो।

`README.md` को उसी रन में अनुवाद करने के लिए, `--with-readme` के साथ स्कैफोल्ड करें (या किसी मौजूदा कॉन्फ़िग में ब्लॉक जोड़ें)। देखें [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme)।

<a id="do-it-by-hand"></a>
## इसे मैन्युअल रूप से करें

यदि आप स्वयं परिवर्तन करना पसंद करते हैं, या आप जानना चाहते हैं कि प्रॉम्प्ट क्या करता है, तो इन चरणों का पालन करें। प्रत्येक चरण प्रॉम्प्ट के एक भाग से मेल खाता है। आपको अंत में अभी भी [सीएलआई इंस्टॉल करना](#install-and-choose-a-provider), [प्रोजेक्ट को इनिशियलाइज़ करना](#initialise-the-project), और [अनुवाद करना](#translate) होगा।

1. [कॉन्फ़िग को अपने कैटलॉग पर पॉइंट करें](#point-the-config)।
2. [स्ट्रिंग्स को रैप करें](#wrap-strings) उन गेटटेक्स्ट कॉल के साथ जिनका आप पहले से उपयोग करते हैं।
3. [कॉल को निकालें और जाँचें](#extract-and-check)।
4. [रनटाइम पर भाषा बदलें](#switch-language)।

<a id="step-1-point-the-config-at-your-catalogs"></a>
## चरण 1: कॉन्फ़िग को अपने कैटलॉग पर पॉइंट करें

टेम्पलेट समझदार डिफ़ॉल्ट मान लिखता है। यह जेंगो का है:

```json
{
  "ui": {
    "sourceRoots": ["."],
    "stringsJson": "locale/strings.json",
    "flatOutputDir": "locale",
    "flatOutput": false,
    "gettext": {
      "outputDir": "locale",
      "domain": "django",
      "potPath": "locale/django.pot",
      "compileMo": true,
      "ingestExistingPo": true,
      "localeFormat": "posix"
    }
  }
}
```

अपने प्रोजेक्ट के विरुद्ध चार चीज़ों की जाँच करें:

- `gettext.outputDir` और `potPath` वह जगह है जहाँ आपके कैटलॉग पहले से मौजूद हैं। जेंगो: `LOCALE_PATHS` में फ़ोल्डर, या किसी ऐप के अंदर `locale/` फ़ोल्डर। फ्लास्क-बैबेल: `translations/`।
- `gettext.domain` वह फ़ाइल नाम है जिसे आपका ऐप लोड करता है। जेंगो `django` का उपयोग करता है। फ्लास्क-बैबेल `messages` का उपयोग करता है। सामान्य गेटटेक्स्ट के लिए यह आपके `gettext.translation(...)` कॉल में डोमेन है।
- `sourceRoots` उन फ़ोल्डरों को सूचीबद्ध करता है जिन्हें `extract` स्कैन करता है। इसे `"."` से अपने एप्लिकेशन कोड तक सीमित करें, ताकि टेस्ट और स्क्रिप्ट कैटलॉग से बाहर रहें।
- `stringsJson` एक्सट्रैक्शन कैश है, एक फ़ाइल जिसका स्वामित्व इस टूल के पास है। इसे कैटलॉग के बगल में रखें। यह रनटाइम फ़ाइल नहीं है। आपका ऐप इसे कभी नहीं पढ़ता है।

जब प्रत्येक जेंगो ऐप अपना स्वयं का `locale/` फ़ोल्डर रखता है, तो प्रति कैटलॉग ट्री एक `ui` ब्लॉक का उपयोग करें। `ui` एक सूची स्वीकार करता है, और `--ui-block` एक ब्लॉक चलाता है। पाथ को ब्लॉक में अद्वितीय होना चाहिए। [कॉन्फ़िगरेशन](/hi/reference/configuration) देखें।

`ingestExistingPo` डिफ़ॉल्ट रूप से चालू है। `extract` के दौरान, आपकी `.po` फ़ाइलों में पहले से मौजूद अनुवाद खाली स्लॉट भरते हैं। जो अनुवाद पहले से सेट है उसे प्रतिस्थापित नहीं किया जाता है। पहले `translate-ui` से पहले अपने कैटलॉग को कमिट करें, क्योंकि यह `.po` फ़ाइलों को फिर से लिखता है और `.mo` फ़ाइलों को संकलित करता है। उस डिफ़ की समीक्षा करें।

`compileMo` आपके लिए `.mo` लिखता है, इसलिए आपको इस वर्कफ़्लो में `compilemessages` की आवश्यकता नहीं है। कैटलॉग लिखने के लिए एक टूल चुनें: `translate-ui` के बाद `makemessages` चलाने पर वही `.po` फ़ाइलें फिर से लिखी जाती हैं।

<a id="step-2-wrap-strings"></a>
## चरण 2: स्ट्रिंग्स को रैप करें

`extract` एक स्ट्रिंग को तभी रिकॉर्ड करता है जब वह `ui.uiExtractor.funcNames` में फ़ंक्शन नामों में से किसी एक को, या एक टेम्पलेट टैग को पास किया गया लिटरल हो। आपके पास जो कॉल हैं उन्हें रखें। जो गायब है उसे जोड़ें।

पायथन कोड:

```python
from django.utils.translation import gettext as _
from django.utils.translation import gettext_lazy, ngettext, pgettext

_("Welcome back")
_("Hello, %(name)s!") % {"name": name}
ngettext("%(count)d file", "%(count)d files", n) % {"count": n}
pgettext("menu", "Open")

class Article(models.Model):
    title = models.CharField(gettext_lazy("Title"), max_length=200)
```

प्लेसहोल्डर `%(name)s` का उपयोग करते हैं। `%` के साथ लुकअप के बाद मान पास करें, कभी भी इससे पहले नहीं। मॉडल, फ़ॉर्म और सेटिंग्स तब चलते हैं जब मॉड्यूल इम्पोर्ट किया जाता है, इसलिए वे लेज़ी फ़ॉर्म का उपयोग करते हैं। इम्पोर्ट समय पर लेज़ी स्ट्रिंग पर `%` लागू न करें। इसके बजाय `format_lazy` का उपयोग करें।

टेम्पलेट (जेंगो `{% load i18n %}`, या फ्लास्क में जिंजा):

```jinja
{% load i18n %}
<h1>{% translate "Welcome back" %}</h1>
{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}
```

`{% translate %}`, `{% trans %}`, `{% blocktranslate %}`, और `{% blocktrans %}` अपने आप एकत्र किए जाते हैं। एक टेम्पलेट वेरिएबल जैसे <code v-pre>{{ name }}</code> को `%(name)s` के रूप में संग्रहीत किया जाता है। इसे उसी फ़ॉर्म में रखें।

जिन नामों को `extract` नहीं जानता है, उन्हें छोड़ दिया जाता है। डिफ़ॉल्ट सूची `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext`, और `self.tr` है। यदि कोड सीधे `gettext_lazy("…")`, `ngettext_lazy`, `pgettext_lazy`, `npgettext`, या `gettext_noop` को कॉल करता है, तो उन नामों को `ui.uiExtractor.funcNames` में जोड़ें। जब आप लेज़ी फ़ंक्शन को `_` के रूप में इम्पोर्ट करते हैं, जैसा कि `gettext_lazy as _` में है, तो नाम `_` पहले से कवर किया गया है।

उस टेक्स्ट को रैप करें जिसे कोई व्यक्ति देखता है: लेबल, हेडिंग, मैसेज, फ़ॉर्म और मॉडल टेक्स्ट, ईमेल। आइडेंटिफ़ायर, यूआरएल, फ़ील्ड नाम, सेटिंग्स कीज़, लॉग मैसेज और माइग्रेशन को अकेला छोड़ दें। स्रोत टेक्स्ट को फिर से न लिखें। एक गुम अनुवाद स्रोत वाक्य लौटाता है, इसलिए ऐप स्रोत भाषा में समान दिखता है।

ये कॉल लुकअप से पहले फ़ॉर्मेटिंग का मूल्यांकन करते हैं, इसलिए स्ट्रिंग कभी भी कैटलॉग एंट्री से मेल नहीं खाती है:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="step-3-extract-and-check-the-calls"></a>
## चरण 3: कॉल निकालें और जांचें

एक बार जब कॉल रैप हो जाएं, तो `extract` चलाएं। यह एक्सट्रैक्शन कैश लिखता है और आपकी मौजूदा `.po` फ़ाइलों से खाली स्लॉट भरता है। यह किसी मॉडल को कॉल नहीं करता है।

```bash
ai-i18n-tools extract
```

फिर उन कॉलों को देखें जो लुकअप से पहले फ़ॉर्मेट होती हैं। `migrate-python-i18n` उन्हें ढूंढता है। इसे `--write` के बिना चलाएं:

```bash
ai-i18n-tools migrate-python-i18n
```

यह `migrate-python-i18n-report.md` लिखता है। इसे पढ़ें और `%(name)s` और एक डिक्शनरी के साथ सूचीबद्ध प्रत्येक कॉल को मैन्युअल रूप से ठीक करें। रिपोर्ट को हटा दें या उसे git-ignore करें।

इस पृष्ठ पर `--write` पास न करें। वह विकल्प एक f-स्ट्रिंग या `.format()` कॉल को `t("…", name=name)` में फिर से लिखता है, एक ऐसा कॉल जो केवल `i18n.py` हेल्पर में मौजूद है। एक gettext ऐप में कोई `t` नहीं होता है। बिना लाइनों वाली रिपोर्ट का मतलब है कि रैप किए गए कॉल सुरक्षित हैं। इसका मतलब यह नहीं है कि हर वाक्य रैप किया गया था, इसलिए `strings.json` का अंतर पढ़ें और उस टेक्स्ट को देखें जिसकी आपको उम्मीद थी।

<a id="step-4-switch-language-at-runtime"></a>
## चरण 4: रनटाइम पर भाषा बदलें

आपका फ्रेमवर्क भाषा चुनता है। ai-i18n-tools कोई मेनू या हेल्पर नहीं जोड़ता है।

<a id="django"></a>
### Django

`settings.py` में:

```python
LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", "English"),
    ("pt-br", "Português (Brasil)"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]

MIDDLEWARE = [
    # ...
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    # ...
]
```

`LocaleMiddleware` सेशन मिडलवेयर के बाद और `CommonMiddleware` से पहले आता है। `LANGUAGE_CODE` स्रोत भाषा है। `LANGUAGES` उन भाषाओं को सूचीबद्ध करता है जिन्हें एक विज़िटर चुन सकता है। `LOCALE_PATHS` उस फ़ोल्डर की ओर इशारा करता है जिसमें `gettext.outputDir` लिखता है, जब तक कि प्रत्येक ऐप अपना `locale/` फ़ोल्डर नहीं रखता।

Django के भाषा स्विच व्यू को `urls.py` में जोड़ें:

```python
from django.urls import include, path

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    # ...
]
```

फिर एक टेम्पलेट में एक फ़ॉर्म जोड़ें:

```jinja
{% load i18n %}
{% get_current_language as CURRENT %}
{% get_available_languages as LANGUAGES %}
<form action="{% url 'set_language' %}" method="post">
  {% csrf_token %}
  <input name="next" type="hidden" value="{{ request.get_full_path }}">
  <select name="language" onchange="this.form.submit()">
    {% for code, name in LANGUAGES %}
      <option value="{{ code }}"{% if code == CURRENT %} selected{% endif %}>{{ name }}</option>
    {% endfor %}
  </select>
</form>
```

व्यू कुकी में विकल्प सहेजता है। इसके बजाय URL में भाषा डालने के लिए, `i18n_patterns` का उपयोग करें। दोनों मानक Django सुविधाएँ हैं। अंतर्राष्ट्रीयकरण पर Django के दस्तावेज़ देखें।

<a id="plain-gettext-and-flask-babel"></a>
### सादा gettext और Flask-Babel

आप जिस भाषा को चाहते हैं उसके लिए कैटलॉग लोड करें और उसे कॉल करें। [python-gettext](/hi/examples#python-gettext) उदाहरण इसे एक कमांड-लाइन टूल में करता है:

```python
import gettext
from pathlib import Path

LOCALEDIR = Path(__file__).resolve().parent / "locales"


def load_catalog(lang: str) -> gettext.NullTranslations:
    code = lang.replace("-", "_")
    return gettext.translation("messages", localedir=str(LOCALEDIR), languages=[code], fallback=True)


_ = load_catalog("pt-BR").gettext
print(_("Hello"))
```

`pt-BR` को `pt_BR` में बदलें, वह फ़ोल्डर नाम जो `translate-ui` ने लिखा था। `fallback=True` को रखें ताकि एक गुम हुआ कैटलॉग स्रोत टेक्स्ट दिखाए। एक वेब ऐप में, प्रति अनुरोध अनुवाद ऑब्जेक्ट बनाएं और `gettext.install` के साथ वैश्विक स्तर पर एक स्थापित न करें, अन्यथा समवर्ती अनुरोध एक भाषा साझा करेंगे। Flask-Babel में, अपने लोकेल सेलेक्टर फ़ंक्शन से कोड वापस करें, और `translations/` को उसकी अनुवाद निर्देशिका के रूप में रखें।

यह अंतिम मैन्युअल चरण है। [मॉडल चुनें और अनुवाद करें](#translate) पर जारी रखें।

<a id="not-your-case"></a>
## आपका मामला नहीं?

| आपके पास है | पढ़ें |
| --- | --- |
| एक Streamlit, FastAPI, Flask, डेस्कटॉप, या स्क्रिप्ट ऐप जिसमें gettext नहीं है | [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) |
| एक JS/TS ऐप | [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) |
| एक वेबसाइट या डॉक्स साइट | [एक वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website) |
| एक रिपॉजिटरी README या अन्य मार्कडाउन फ़ाइलें | [अपने README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) |

<a id="examples"></a>
## उदाहरण

| उदाहरण | यह क्या दिखाता है |
| --- | --- |
| [python-gettext](/hi/examples#python-gettext) | एक मौजूदा gettext कमांड-लाइन टूल; `translate-ui` `.po` और `.mo` को रीफ्रेश करता है |

कोई Django उदाहरण निर्देशिका नहीं है। `python-gettext` उदाहरण डोमेन `messages` के साथ समान कॉन्फ़िग आकार दिखाता है। इसे `npx degit` के साथ कॉपी करें, या GitHub रिलीज़ से `ai-i18n-tools-python-examples.zip` डाउनलोड करें। कमांड: [उदाहरण](/hi/examples#python-examples)।
