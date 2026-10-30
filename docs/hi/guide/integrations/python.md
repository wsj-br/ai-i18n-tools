<a id="python"></a>
# Python

पायथन एप्लिकेशन के लिए चयनकर्ता। एक्सट्रैक्शन, कैटलॉग और कॉल शेप [पायथन एप्लिकेशन](/hi/guide/ui-strings/python) में रहते हैं। मौजूदा एकल-स्थानिक ऐप के लिए चरण-दर-चरण प्रक्रिया है [पायथन ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python), जिसमें एक [`i18n.py` प्रॉम्प्ट](/hi/guide/add-i18n-to-python#run-the-agent-prompt) और एक [Django / gettext प्रॉम्प्ट](/hi/guide/add-i18n-to-python#agent-prompt-django-gettext) शामिल है।

Streamlit, FastAPI, Flask, Pyramid, Tkinter, PyQt, PySide, और PyWebView जनरेट किए गए `i18n.py` हेल्पर (Python 3.10 या नया) को कॉल करते हैं। Django, Django के gettext को बनाए रखता है। रिपॉजिटरी में चार रन करने योग्य प्रतियां शामिल हैं: `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi`, और `examples/python-gettext`। Pyramid, Django, Tkinter, Qt, और PyWebView के लिए कोई अलग उदाहरण निर्देशिका नहीं है।

<a id="which-template"></a>
## कौन सा टेम्प्लेट

| फ्रेमवर्क | इनिट टेम्पलेट | कैटलॉग | उदाहरण |
| --- | --- | --- | --- |
| स्ट्रीमलेट | `ui-python` | स्रोत स्ट्रिंग द्वारा कुंजीबद्ध फ्लैट JSON | [python-streamlit](/hi/examples#python-streamlit) |
| फास्टएपीआई | `ui-python` | स्रोत स्ट्रिंग द्वारा कुंजीबद्ध फ्लैट JSON | [python-fastapi](/hi/examples#python-fastapi) |
| फ्लास्क + जिंजा, फ्लैट JSON | `ui-python` | स्रोत स्ट्रिंग द्वारा कुंजीबद्ध फ्लैट JSON | [python-flask](/hi/examples#python-flask) |
| Flask / Jinja gettext | `ui-python-flask` | `.po` / `.mo` जो `translations/` के अंतर्गत है | नीचे दिए गए Flask नोट्स का उपयोग करें |
| Pyramid | `ui-python` या `ui-python-flask` | Flask के समान | Flask के समान वायरिंग |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` | कोई उदाहरण निर्देशिका नहीं |
| मौजूदा GNU gettext | `ui-python-gettext` | फ्लैट JSON और `.po` / `.mo`, या केवल gettext | [python-gettext](/hi/examples#python-gettext) |
| टिकइंटर | `ui-python` | स्रोत स्ट्रिंग द्वारा कुंजीबद्ध फ्लैट JSON | कोई उदाहरण डायरेक्टरी नहीं |
| PyQt / PySide | `ui-python` या gettext टेम्प्लेट | फ्लैट JSON और/या `.po` | कोई उदाहरण निर्देशिका नहीं |
| PyWebView / PyWebKit | शेल के लिए एक Python टेम्प्लेट | शेल कैटलॉग, साथ ही HTML मार्कर या प्रति लोकेल एक HTML फ़ाइल | कोई उदाहरण निर्देशिका नहीं |

`ui-python`, `ui-python-gettext` और `ui-python-flask` `i18n.py` लिखते हैं जब वह फ़ाइल गुम होती है। `ui-python-django` ऐसा नहीं करता है। रिपॉजिटरी README का भी अनुवाद करने के लिए `--with-readme` जोड़ें: [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme)।

<a id="framework-notes"></a>
## फ्रेमवर्क नोट्स

<a id="streamlit"></a>
### Streamlit

`streamlit_language_selector()` लोकेल को सेशन स्टेट और क्वेरी स्ट्रिंग में लिखता है। प्रत्येक विजेट को एक निश्चित `key` दें। विवरण: [Locale — Streamlit](/hi/guide/ui-strings/python#streamlit)।

<a id="fastapi"></a>
### FastAPI

मिडलवेयर में `?lang=` या `Accept-Language` पढ़ें, `set_locale` को कॉल करें, और `finally` में `reset_locale` करें ताकि समवर्ती अनुरोध (concurrent requests) अपना स्वयं का लोकेल बनाए रखें। विवरण: [Locale — FastAPI](/hi/guide/ui-strings/python#fastapi)।

<a id="flask-and-pyramid"></a>
### Flask और Pyramid

[python-flask](/hi/examples#python-flask) उदाहरण फ्लैट JSON का उपयोग करता है। `init -t ui-python-flask` उन ऐप्स के लिए `translations/` के अंतर्गत gettext लेआउट है जो पहले से ही Flask-Babel-शैली के कैटलॉग का उपयोग करते हैं। किसी भी स्थिति में, अनुरोध (request) से लोकेल सेट करें और `_`, `t`, `current_locale`, `ui_languages`, और `direction` को टेम्प्लेट संदर्भ में इंजेक्ट करें। Pyramid समान अनुरोध-स्कोप वाले पैटर्न का उपयोग करता है। विवरण: [Locale — Flask and Pyramid](/hi/guide/ui-strings/python#flask)।

<a id="django"></a>
### Django

`gettext`, `ngettext`, और `{% blocktrans %}` को बनाए रखें। `init -t ui-python-django`, Django की `locale/` डायरेक्टरी और `django` डोमेन से मेल खाता है, और Django के रनटाइम को यथावत छोड़ देता है। विवरण: [Locale — Django](/hi/guide/ui-strings/python#django)।

<a id="existing-gettext"></a>
### मौजूदा gettext

`_()`, `gettext()`, और `ngettext()` को यथावत रहने दें। `ui.gettext` को वर्तमान कैटलॉग ट्री पर इंगित करें और `extract` चलाएं, फिर `translate-ui` चलाएं। [python-gettext](/hi/examples#python-gettext) उदाहरण केवल gettext (`flatOutput: false`) है। `init -t ui-python-gettext` भी फ्लैट JSON लिखता है। विवरण: [Locale — Existing gettext](/hi/guide/ui-strings/python#gettext)।

<a id="tkinter-qt-and-pywebview"></a>
### Tkinter, Qt, और PyWebView

प्रत्येक Tkinter विजेट बनाते समय `t()` या `_()` को कॉल करें, फिर `set_locale` के बाद दृश्य टेक्स्ट को फिर से बनाएं। PyQt और PySide `self.tr("...")` कॉल निकाले जाते हैं, और Qt `.ui` फ़ाइलें `<string>` तत्वों में योगदान करती हैं जब तक कि `notr="true"` न हो। PyWebView या PyWebKit के लिए, ऊपर दिए गए टेम्प्लेट के साथ Python शेल निकालें और `data-i18n` मार्करों के साथ या प्रति लोकेल एक HTML दस्तावेज़ के साथ HTML पेज निकालें। विवरण: [Locale — Tkinter](/hi/guide/ui-strings/python#tkinter), [PyQt / PySide](/hi/guide/ui-strings/python#pyqt), और [PyWebView](/hi/guide/ui-strings/python#pywebview)।
