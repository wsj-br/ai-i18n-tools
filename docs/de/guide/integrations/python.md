<a id="python"></a>
# Python

Auswahlhilfe für Python-Anwendungen. Extraktion, Kataloge und Aufrufmuster finden sich in [Python-Anwendungen](/de/guide/ui-strings/python). Die Schritt-für-Schritt-Anleitung für eine bestehende Single-Locale-Anwendung ist [i18n zu einer Python-Anwendung hinzufügen](/de/guide/add-i18n-to-python), mit einer [`i18n.py`-Eingabeaufforderung](/de/guide/add-i18n-to-python#agent-prompt-i18n-py) und einer [Django-/gettext-Eingabeaufforderung](/de/guide/add-i18n-to-python#agent-prompt-django-gettext).

Streamlit, FastAPI, Flask, Pyramid, Tkinter, PyQt, PySide und PyWebView rufen den generierten `i18n.py`-Helfer auf (Python 3.10 oder neuer). Django verwendet das gettext von Django. Vier ausführbare Kopien sind im Repository enthalten: `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi` und `examples/python-gettext`. Pyramid, Django, Tkinter, Qt und PyWebView verfügen über kein separates Beispielverzeichnis.

<a id="which-template"></a>
## Welche Vorlage

| Framework | Init-Vorlage | Katalog | Beispiel |
| --- | --- | --- | --- |
| Streamlit | `ui-python` | Flaches JSON, das nach dem Quellstring geschlüsselt ist | [python-streamlit](/de/examples#python-streamlit) |
| FastAPI | `ui-python` | Flaches JSON, das nach dem Quellstring geschlüsselt ist | [python-fastapi](/de/examples#python-fastapi) |
| Flask + Jinja, flaches JSON | `ui-python` | Flaches JSON, das nach dem Quellstring geschlüsselt ist | [python-flask](/de/examples#python-flask) |
| Flask / Jinja gettext | `ui-python-flask` | `.po` / `.mo` unter `translations/` | Siehe die Flask-Hinweise unten |
| Pyramid | `ui-python` oder `ui-python-flask` | Wie bei Flask | Gleiche Einbindung wie bei Flask |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` | Kein Beispielverzeichnis |
| Bestehendes GNU gettext | `ui-python-gettext` | Flaches JSON und `.po` / `.mo` oder nur gettext | [python-gettext](/de/examples#python-gettext) |
| Tkinter | `ui-python` | Flaches JSON, das nach dem Quellstring geschlüsselt ist | Kein Beispielverzeichnis |
| PyQt / PySide | `ui-python` oder eine gettext-Vorlage | Flaches JSON und/oder `.po` | Kein Beispielverzeichnis |
| PyWebView / PyWebKit | Eine Python-Vorlage für die Shell | Shell-Kataloge sowie HTML-Marker oder eine HTML-Datei pro Sprache | Kein Beispielverzeichnis |

`ui-python`, `ui-python-gettext` und `ui-python-flask` schreiben `i18n.py`, wenn diese Datei fehlt. `ui-python-django` tut dies nicht. Fügen Sie `--with-readme` hinzu, um auch die README-Datei des Repositorys zu übersetzen: [i18n zu Ihrer README-Datei und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).

<a id="framework-notes"></a>
## Framework-Hinweise

<a id="streamlit"></a>
### Streamlit

`streamlit_language_selector()` schreibt das Gebietsschema in den Session-State und den Query-String. Geben Sie jedem Widget einen festen `key`. Details: [Locale — Streamlit](/de/guide/ui-strings/python#streamlit).

<a id="fastapi"></a>
### FastAPI

Lesen Sie `?lang=` oder `Accept-Language` in der Middleware, rufen Sie `set_locale` auf und verwenden Sie `reset_locale` in `finally`, damit gleichzeitige Anfragen ihr eigenes Gebietsschema beibehalten. Details: [Locale — FastAPI](/de/guide/ui-strings/python#fastapi).

<a id="flask-and-pyramid"></a>
### Flask und Pyramid

Das [python-flask](/de/examples#python-flask)-Beispiel verwendet flaches JSON. `init -t ui-python-flask` ist das gettext-Layout unter `translations/` für eine Anwendung, die bereits Kataloge im Flask-Babel-Stil verwendet. Legen Sie in jedem Fall das Locale aus der Anfrage fest und fügen Sie `_`, `t`, `current_locale`, `ui_languages` und `direction` in den Template-Kontext ein. Pyramid verwendet dasselbe anfragebasierte Muster. Details: [Locale — Flask and Pyramid](/de/guide/ui-strings/python#flask).

<a id="django"></a>
### Django

Behalten Sie `gettext`, `ngettext` und `{% blocktrans %}` bei. `init -t ui-python-django` entspricht dem `locale/`-Verzeichnis von Django sowie der `django`-Domain und belässt die Django-Laufzeitumgebung unverändert. Details: [Locale — Django](/de/guide/ui-strings/python#django).

<a id="existing-gettext"></a>
### Bestehendes gettext

Belassen Sie `_()`, `gettext()` und `ngettext()` an ihrem Platz. Verweisen Sie `ui.gettext` auf den aktuellen Katalogbaum und führen Sie `extract` sowie anschließend `translate-ui` aus. Das [python-gettext](/de/examples#python-gettext)-Beispiel ist rein gettext-basiert (`flatOutput: false`). `init -t ui-python-gettext` schreibt ebenfalls flaches JSON. Details: [Locale — Existing gettext](/de/guide/ui-strings/python#gettext).

<a id="tkinter-qt-and-pywebview"></a>
### Tkinter, Qt und PyWebView

Rufen Sie `t()` oder `_()` beim Erstellen jedes Tkinter-Widgets auf und bauen Sie den sichtbaren Text nach `set_locale` neu auf. PyQt- und PySide-`self.tr("...")`-Aufrufe werden extrahiert, und Qt-`.ui`-Dateien tragen `<string>`-Elemente bei, sofern nicht `notr="true"` festgelegt ist. Für PyWebView oder PyWebKit extrahieren Sie die Python-Shell mit einem Template wie oben und extrahieren die HTML-Seite mit `data-i18n`-Markierungen oder mit einem HTML-Dokument pro Locale. Details: [Locale — Tkinter](/de/guide/ui-strings/python#tkinter), [PyQt / PySide](/de/guide/ui-strings/python#pyqt) und [PyWebView](/de/guide/ui-strings/python#pywebview).
