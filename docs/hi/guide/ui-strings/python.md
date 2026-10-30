<a id="python-applications"></a>
# Python एप्लिकेशन

`ai-i18n-tools` Python से और Jinja, Django, और Qt `.ui` फ़ाइलों से UI स्ट्रिंग निकालता है, फिर स्रोत-भाषा स्ट्रिंग, GNU gettext कैटलॉग, या दोनों द्वारा कुंजीबद्ध फ़्लैट JSON लिखता है। `sourceLocale` कोई भी भाषा हो सकती है। रनटाइम हेल्पर एक मानक-पुस्तकालय `i18n.py` है (Python 3.10 या नया)। Streamlit, Tkinter, PyQt, PySide, PyWebView, Flask, Pyramid, और FastAPI उस हेल्पर को कॉल करते हैं। Django अपने स्वयं के gettext का उपयोग करता है।

मौजूदा एकल-भाषा ऐप में लोकेल जोड़ना: [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python), इसके [एजेंट प्रॉम्प्ट](/hi/guide/add-i18n-to-python#run-the-agent-prompt) के साथ। Django, Flask-Babel कैटलॉग, या ऐसे ऐप के लिए जो पहले से gettext का उपयोग करता है: [एक Django / Python gettext ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-django-gettext), इसके [एजेंट प्रॉम्प्ट](/hi/guide/add-i18n-to-django-gettext#run-the-agent-prompt) के साथ। फ़्रेमवर्क चयनकर्ता: [Python इंटीग्रेशन](/hi/guide/integrations/python)। फ़ंक्शन सूची: [Python रनटाइम (`i18n.py`)](/hi/reference/programmatic-api#python-runtime)।

रन करने योग्य प्रतियां `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi`, और `examples/python-gettext` में रहती हैं। ये पायथन प्रोजेक्ट्स हैं। पहले तीन virtualenv और `pip install -r requirements.txt` का उपयोग करते हैं। `python-gettext` केवल स्टैंडर्ड लाइब्रेरी का उपयोग करता है। ये npm पैकेज नहीं हैं। रिलीज़ आर्काइव `ai-i18n-tools-python-examples.zip` में वही चार डायरेक्टरीज़ शामिल हैं। npm टारबॉल और स्टैंडअलोन निष्पादन योग्य फ़ाइल में ये नहीं हैं।

<a id="scaffold"></a>
## स्काफ़ोल्ड

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools init -t ui-python-gettext -P anthropic
ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools init -t ui-python-django -P ollama
```

`ui-python` फ्लैट JSON और `i18n.py` लिखता है। `ui-python-gettext` JSON और `.po` / `.mo` लिखता है। `ui-python-flask` `translations/` और `i18n.py` के अंतर्गत gettext कैटलॉग लिखता है। `ui-python-django` `locale/<lang>/LC_MESSAGES/django.po` लिखता है और `i18n.py` नहीं लिखता है।

रिपॉजिटरी README का भी अनुवाद करें: ऊपर दिए गए `init` कमांड में `--with-readme` जोड़ें। [अपनी README और Markdown डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) देखें।

स्कैन रूट्स `node_modules`, `.git`, `.venv`, `venv`, `env`, `site-packages`, `__pycache__`, `.tox`, `.nox`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache`, और `.eggs` को छोड़ देते हैं।

<a id="calls-that-translate"></a>
## अनुवाद करने वाले कॉल

पहले कैटलॉग प्रविष्टि देखें, फिर इंटरपोलेट करें।

पोर्टेबल:

```python
t("Hello, {name}!", name=name)
t("Total: {price:,.2f}", price=price)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

पायथन 3.14 पर हेल्पर एक टेम्प्लेट स्ट्रिंग भी स्वीकार करता है:

```python
translate(t"Hello, {name}!")
```

`translate`, `t` का एक उपनाम (alias) है। कीवर्ड तर्क टेम्प्लेट स्ट्रिंग से लिए गए मानों को ओवरराइड करते हैं।

नेटिव gettext, अभी भी सुरक्षित है क्योंकि टेम्प्लेट तर्क है:

```python
_("Hello, %s!") % name
ngettext("1 file", "{count} files", count, count=count)
pgettext("menu", "Open")
```

इनका मूल्यांकन किसी भी कैटलॉग लुकअप से पहले किया जाता है, इसलिए एक्सट्रैक्टर उन्हें असुरक्षित चिह्नित करता है और `migrate-python-i18n` उन्हें फिर से लिखता है:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` एक ड्राई रन है जब तक आप `--write` पास नहीं करते। यह `migrate-python-i18n-report.md` लिखता है। `{value=}` जैसे डीबग फ़ील्ड और नेस्टेड फ़ॉर्मेट स्पेसिफ़िकेशन रिपोर्ट किए जाते हैं और अपनी जगह पर छोड़ दिए जाते हैं। `--write` f-स्ट्रिंग और `.format()` कॉल को `t(...)` में बदल देता है, एक फ़ंक्शन जो केवल जेनरेट किए गए `i18n.py` में मौजूद होता है। gettext या Django ऐप में, असुरक्षित कॉल खोजने और उन्हें `%(name)s` के साथ मैन्युअल रूप से ठीक करने के लिए ड्राई रन का उपयोग करें।

`{% trans %}` और `{% blocktrans %}` gettext `%(name)s` प्लेसहोल्डर बन जाते हैं। जिंजा (Jinja) व्हाइटस्पेस को हटाता और सिकोड़ता है। जैंगो (Django) आंतरिक व्हाइटस्पेस को तब तक बनाए रखता है जब तक कि टैग `trimmed` न कहे।

<a id="catalogs"></a>
## कैटलॉग

फ़्लैट JSON कुंजियाँ स्रोत-भाषा स्ट्रिंग होती हैं, जो `sourceLocale` में टेक्स्ट है। वह भाषा कोई भी भाषा हो सकती है। एक संदर्भ `context` + U+0004 + उस स्रोत स्ट्रिंग का उपयोग करता है। बहुवचन स्लॉट `{md5}_one`, `{md5}_other`, और अन्य CLDR फ़ॉर्म रहते हैं जिन्हें `translate-ui` पहले से लिखता है। हेल्पर MD5 के साथ ट्रिम किए गए एकवचन को हैश करता है और पहले 8 हेक्स वर्णों को पढ़ता है।

Gettext फ़ाइलें संदर्भ के लिए `msgctxt` और प्लुरल के लिए `msgid` / `msgid_plural` का उपयोग करती हैं। `ui.gettext.compileMo` `.mo` को `.po` के बगल में लिखता है। `purge-locale` उस लोकेल की `.po` और `.mo` को हटा देता है। जब `flatOutput` गलत (false) होता है, तो यह फ्लैट JSON फ़ाइलों को वैसे ही छोड़ देता है क्योंकि वे नहीं लिखी गई थीं।

एक इंग्लिश सोर्स लोकेल और स्पष्ट प्लुरल सोर्स के साथ `t(..., plurals=True)`, मॉडल को छोड़ देता है और सोर्स स्ट्रिंग्स से `one` / `other` को स्टोर करता है।

<a id="things-to-know"></a>
## जानने योग्य बातें

- `t()` स्रोत-भाषा वाक्य को देखता है। `strings.json` में आईडी लुकअप कुंजी नहीं है। एक गुम हुई लोकेल फ़ाइल या एक गुम हुई कुंजी वह वाक्य लौटाती है।
- हेल्पर प्रत्येक लोड की गई JSON फ़ाइल को प्रक्रिया के जीवनकाल के लिए मेमोरी में रखता है, जिसमें पहली बार लुकअप पर फ़ाइल गुम होने पर एक खाली मैप भी शामिल है। `translate-ui` के बाद ऐप को पुनरारंभ करें।
- उस रन के पहले `t()` से पहले `set_locale` को कॉल करें। `?lang=` तब तक कुछ नहीं करता जब तक ऐप इसे पढ़ता नहीं और `set_locale` को कॉल नहीं करता।
- आयात के समय `t()` एक बार चलता है और स्रोत भाषा को तब तक रखता है जब तक उस मॉड्यूल को फिर से आयात नहीं किया जाता। जब विजेट बनाया जाए तो `t()` को कॉल करें।
- प्लेसहोल्डर `{name}`, `{name:.2%}`, `{name:,.2f}`, और `{name!r}` हैं। `{row.rate}` जैसा डॉटेड फ़ील्ड अस्वीकृत है। `rate=row.rate` पास करें।
- एक शाब्दिक प्रतिशत जिसके तुरंत बाद एक printf प्रकार का अक्षर (`%d`, `%a`, `%s`, और बाकी) आता है, उसे पुरानी शैली के फ़ॉर्मेटिंग के रूप में माना जाता है। कीवर्ड आर्ग्यूमेंट्स के साथ, एक विफल `%` फ़ॉर्मेटिंग टेम्पलेट लौटाता है और `{name}` प्रतिस्थापन को छोड़ देता है। एक शाब्दिक प्रतिशत को उन अक्षरों से दूर रखें, जैसे `% do CDI` या `% a.a.` जैसे स्रोत टेक्स्ट में।

<a id="locale-in-each-framework"></a>
## हर फ़्रेमवर्क में लोकेल

`set_locale` एक `ContextVar` टोकन लौटाता है। इसे `finally` में रीसेट करें, जिसमें FastAPI और Flask मिडलवेयर शामिल हैं, ताकि समवर्ती अनुरोध (concurrent requests) किसी लोकेल को लीक न करें।

- <a id="streamlit"></a>**Streamlit.** रन के पहले `t()` से पहले `set_locale` को कॉल करें, जिसमें `st.set_page_config(page_title=…)` भी शामिल है। `streamlit_language_selector(sidebar=True, key="lang_selector")` `st.session_state.locale` और `st.query_params["lang"]` लिखता है, और जब विजेट खींचा जाता है तो यह `set_locale` को कॉल करता है, इसलिए इसके ऊपर एक अनुवादित शीर्षक उस रन के लिए पिछली भाषा में रहता है। इसका लेबल निश्चित अंग्रेजी है। जिस पेज को अनुवादित शीर्षक की आवश्यकता है, उसे [भाषा स्विच जोड़ें](/hi/guide/add-i18n-to-python#step-4-add-a-language-switch) का पालन करना चाहिए। प्रत्येक विजेट को एक निश्चित `key` दें। `examples/python-streamlit` देखें।
- <a id="fastapi"></a>**FastAPI.** मिडलवेयर में `?lang=` या `Accept-Language` पढ़ें, `set_locale` को कॉल करें, और `finally` में `reset_locale` को कॉल करें। रूट्स `t()` और `_()` को कॉल करते हैं। `examples/python-fastapi` देखें।
- <a id="flask"></a>**Flask और Pyramid.** अनुरोध से लोकेल सेट करें और `_`, `t`, `current_locale`, `ui_languages`, और `direction` को टेम्पलेट संदर्भ में इंजेक्ट करें। `examples/python-flask` देखें।
- <a id="gettext"></a>**मौजूदा gettext.** `_()`, `gettext()`, और `ngettext()` को अपनी जगह पर छोड़ दें। `ui.gettext` को वर्तमान `locales/` ट्री पर इंगित करें और फिर `extract` और `translate-ui` चलाएँ। `examples/python-gettext` देखें।
- <a id="django"></a>**Django.** `gettext`, `ngettext`, और `{% blocktrans %}` का उपयोग करें। इनिट टेम्पलेट `ui-python-django`, Django की `locale/` निर्देशिका और `django` डोमेन से मेल खाता है।
- <a id="tkinter"></a>**Tkinter.** प्रत्येक विजेट बनाते समय `t()` या `_()` को कॉल करें, फिर `set_locale` के बाद दृश्य टेक्स्ट को पुन: निर्मित करें।
- <a id="pyqt"></a>**PyQt / PySide.** `self.tr("...")` निकाला जाता है। एक `.ui` फ़ाइल `<string>` तत्वों का योगदान देती है जब तक कि `notr="true"` न हो। `comment` विशेषता gettext संदर्भ बन जाती है।
- <a id="pywebview"></a>**PyWebView / PyWebKit.** ऊपर दिए गए Python टेम्पलेट्स के साथ Python शेल निकालें। `data-i18n` मार्करों के साथ या प्रति लोकेल एक HTML दस्तावेज़ के साथ HTML पेज निकालें।
