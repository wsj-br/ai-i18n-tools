<a id="python-applications"></a>
# Python-Anwendungen

`ai-i18n-tools` extrahiert UI-Strings aus Python und aus Jinja-, Django- und Qt-`.ui`-Dateien und schreibt dann flaches JSON, das nach dem Quellsprachen-String, GNU gettext-Katalogen oder beidem geschlüsselt ist. `sourceLocale` kann jede Sprache sein. Der Laufzeit-Helfer ist ein `i18n.py` der Standardbibliothek (Python 3.10 oder neuer). Streamlit, Tkinter, PyQt, PySide, PyWebView, Flask, Pyramid und FastAPI rufen diesen Helfer auf. Django verwendet sein eigenes gettext.

Hinzufügen von Lokalisierungen zu einer bestehenden einsprachigen App: [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python), einschließlich der [`i18n.py`-Eingabeaufforderung](/de/guide/add-i18n-to-python#run-the-agent-prompt) und der [Django-/gettext-Eingabeaufforderung](/de/guide/add-i18n-to-python#agent-prompt-django-gettext). Framework-Auswahl: [Python-Integrationen](/de/guide/integrations/python). Funktionsliste: [Python-Laufzeit (`i18n.py`)](/de/reference/programmatic-api#python-runtime).

Ausführbare Kopien befinden sich in `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi` und `examples/python-gettext`. Dabei handelt es sich um Python-Projekte. Die ersten drei verwenden ein virtualenv und `pip install -r requirements.txt`. `python-gettext` verwendet nur die Standardbibliothek. Es handelt sich nicht um npm-Pakete. Das Release-Archiv `ai-i18n-tools-python-examples.zip` enthält dieselben vier Verzeichnisse. Der npm-Tarball und die eigenständige ausführbare Datei enthalten diese nicht.

<a id="scaffold"></a>
## Gerüst

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools init -t ui-python-gettext -P anthropic
ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools init -t ui-python-django -P ollama
```

`ui-python` schreibt flaches JSON und `i18n.py`. `ui-python-gettext` schreibt JSON und `.po` / `.mo`. `ui-python-flask` schreibt gettext-Kataloge unter `translations/` und `i18n.py`. `ui-python-django` schreibt `locale/<lang>/LC_MESSAGES/django.po` und schreibt kein `i18n.py`.

Übersetzen Sie auch die README des Repositorys: Fügen Sie `--with-readme` zum obigen `init`-Befehl hinzu. Siehe [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).

Scan-Roots überspringen `node_modules`, `.git`, `.venv`, `venv`, `env`, `site-packages`, `__pycache__`, `.tox`, `.nox`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache` und `.eggs`.

<a id="calls-that-translate"></a>
## Aufrufe, die übersetzen

Suchen Sie zuerst den Katalogeintrag und führen Sie dann die Interpolation durch.

Portabel:

```python
t("Hello, {name}!", name=name)
t("Total: {price:,.2f}", price=price)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Unter Python 3.14 akzeptiert das Hilfsprogramm auch einen Template-String:

```python
translate(t"Hello, {name}!")
```

`translate` ist ein Alias für `t`. Schlüsselwortargumente überschreiben Werte, die aus dem Template-String übernommen wurden.

Natives gettext, weiterhin sicher, da das Template das Argument ist:

```python
_("Hello, %s!") % name
ngettext("1 file", "{count} files", count, count=count)
pgettext("menu", "Open")
```

Diese werden vor jeder Katalogsuche ausgewertet, daher markiert der Extraktor sie als unsicher und `migrate-python-i18n` schreibt sie um:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` ist ein Testlauf, bis Sie `--write` übergeben. Es schreibt `migrate-python-i18n-report.md`. Debug-Felder wie `{value=}` und verschachtelte Format-Spezifikationen werden gemeldet und unverändert belassen.

`{% trans %}` und `{% blocktrans %}` werden zu gettext-`%(name)s`-Platzhaltern. Jinja entfernt und reduziert Leerzeichen. Django behält interne Leerzeichen bei, sofern das Tag nicht `trimmed` angibt.

<a id="catalogs"></a>
## Kataloge

Flache JSON-Schlüssel sind der Quellsprachen-String, der Text in `sourceLocale`. Diese Sprache kann jede Sprache sein. Ein Kontext verwendet `context` + U+0004 + diesen Quell-String. Plural-Slots bleiben `{md5}_one`, `{md5}_other` und die anderen CLDR-Formen, die `translate-ui` bereits schreibt. Der Helfer hasht den gekürzten Singular mit MD5 und liest die ersten 8 Hexadezimalzeichen.

Gettext-Dateien verwenden `msgctxt` für den Kontext und `msgid` / `msgid_plural` für Plurale. `ui.gettext.compileMo` schreibt die `.mo` neben die `.po`. `purge-locale` löscht die `.po` und `.mo` dieser Locale. Wenn `flatOutput` false ist, lässt es die flachen JSON-Dateien unverändert, da diese nicht geschrieben wurden.

`t(..., plurals=True)` mit einer englischen Quell-Locale und einer expliziten Pluralquelle überspringt das Modell und speichert `one` / `other` aus den Quell-Strings.

<a id="things-to-know"></a>
## Locale in jedem Framework

`set_locale` gibt ein `ContextVar`-Token zurück. Setzen Sie es in `finally` zurück, einschließlich FastAPI- und Flask-Middleware, damit gleichzeitige Anfragen kein Locale weitergeben.

- <a id="streamlit"></a>**Streamlit.** `streamlit_language_selector(sidebar=True, key="lang_selector")` schreibt `st.session_state.locale` und `st.query_params["lang"]`. Geben Sie jedem Widget einen festen `key`. Siehe `examples/python-streamlit`.
- <a id="fastapi"></a>**FastAPI.** Lesen Sie `?lang=` oder `Accept-Language` in der Middleware, rufen Sie `set_locale` auf und `reset_locale` in `finally`. Routen rufen `t()` und `_()` auf. Siehe `examples/python-fastapi`.
- <a id="flask"></a>**Flask und Pyramid.** Legen Sie das Gebietsschema aus der Anfrage fest und fügen Sie `_`, `t`, `current_locale`, `ui_languages` und `direction` in den Template-Kontext ein. Siehe `examples/python-flask`.
- <a id="gettext"></a>**Bestehendes gettext.** Belassen Sie `_()`, `gettext()` und `ngettext()` an ihrem Platz. Verweisen Sie `ui.gettext` auf den aktuellen `locales/`-Baum und führen Sie `extract` sowie `translate-ui` aus. Siehe `examples/python-gettext`.
- <a id="django"></a>**Django.** Verwenden Sie `gettext`, `ngettext` und `{% blocktrans %}`. Das Init-Template `ui-python-django` entspricht dem `locale/`-Verzeichnis und der `django`-Domain von Django.
- <a id="tkinter"></a>**Tkinter.** Rufen Sie `t()` oder `_()` beim Erstellen jedes Widgets auf und bauen Sie dann den sichtbaren Text nach `set_locale` neu auf.
- <a id="pyqt"></a>**PyQt / PySide.** `self.tr("...")` wird extrahiert. Eine `.ui`-Datei trägt `<string>`-Elemente bei, sofern nicht `notr="true"`. Das `comment`-Attribut wird zum gettext-Kontext.
- <a id="pywebview"></a>**PyWebView / PyWebKit.** Extrahieren Sie die Python-Shell mit den oben genannten Python-Templates. Extrahieren Sie die HTML-Seite mit `data-i18n`-Markierungen oder mit einem HTML-Dokument pro Gebietsschema.
