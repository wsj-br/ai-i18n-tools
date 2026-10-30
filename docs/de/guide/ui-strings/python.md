<a id="python-applications"></a>
# Python-Anwendungen

`ai-i18n-tools` extrahiert UI-Strings aus Python und aus Jinja-, Django- und Qt-`.ui`-Dateien und schreibt dann flaches JSON, das nach dem Quellsprachen-String, GNU gettext-Katalogen oder beidem geschlüsselt ist. `sourceLocale` kann jede Sprache sein. Der Laufzeit-Helfer ist ein `i18n.py` der Standardbibliothek (Python 3.10 oder neuer). Streamlit, Tkinter, PyQt, PySide, PyWebView, Flask, Pyramid und FastAPI rufen diesen Helfer auf. Django verwendet sein eigenes gettext.

Hinzufügen von Locales zu einer bestehenden einsprachigen App: [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python), mit ihrem [Agent-Prompt](/de/guide/add-i18n-to-python#run-the-agent-prompt). Für Django, Flask-Babel-Kataloge oder eine App, die bereits gettext verwendet: [i18n zu einer Django-/Python-gettext-App hinzufügen](/de/guide/add-i18n-to-django-gettext), mit ihrem [Agent-Prompt](/de/guide/add-i18n-to-django-gettext#run-the-agent-prompt). Framework-Auswahl: [Python-Integrationen](/de/guide/integrations/python). Funktionsliste: [Python-Laufzeit (`i18n.py`)](/de/reference/programmatic-api#python-runtime).

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

`migrate-python-i18n` ist ein Probelauf, bis Sie `--write` übergeben. Es schreibt `migrate-python-i18n-report.md`. Debug-Felder wie `{value=}` und verschachtelte Format-Spezifikationen werden gemeldet und beibehalten. `--write` wandelt f-Strings und `.format()`-Aufrufe in `t(...)` um, eine Funktion, die nur in der generierten `i18n.py` existiert. In einer gettext- oder Django-App verwenden Sie den Probelauf, um unsichere Aufrufe zu finden und diese manuell mit `%(name)s` zu beheben.

`{% trans %}` und `{% blocktrans %}` werden zu gettext-`%(name)s`-Platzhaltern. Jinja entfernt und reduziert Leerzeichen. Django behält interne Leerzeichen bei, sofern das Tag nicht `trimmed` angibt.

<a id="catalogs"></a>
## Kataloge

Flache JSON-Schlüssel sind der Quellsprachen-String, der Text in `sourceLocale`. Diese Sprache kann jede Sprache sein. Ein Kontext verwendet `context` + U+0004 + diesen Quell-String. Plural-Slots bleiben `{md5}_one`, `{md5}_other` und die anderen CLDR-Formen, die `translate-ui` bereits schreibt. Der Helfer hasht den gekürzten Singular mit MD5 und liest die ersten 8 Hexadezimalzeichen.

Gettext-Dateien verwenden `msgctxt` für den Kontext und `msgid` / `msgid_plural` für Plurale. `ui.gettext.compileMo` schreibt die `.mo` neben die `.po`. `purge-locale` löscht die `.po` und `.mo` dieser Locale. Wenn `flatOutput` false ist, lässt es die flachen JSON-Dateien unverändert, da diese nicht geschrieben wurden.

`t(..., plurals=True)` mit einer englischen Quell-Locale und einer expliziten Pluralquelle überspringt das Modell und speichert `one` / `other` aus den Quell-Strings.

<a id="things-to-know"></a>
## Wissenswertes

- `t()` sucht den Satz in der Ausgangssprache. Die ID in `strings.json` ist nicht der Suchschlüssel. Eine fehlende Locale-Datei oder ein fehlender Schlüssel gibt diesen Satz zurück.
- Der Helfer hält jede geladene JSON-Datei für die Lebensdauer des Prozesses im Speicher, einschließlich einer leeren Map, wenn die Datei beim ersten Nachschlagen fehlte. Starten Sie die App nach `translate-ui` neu.
- Rufen Sie `set_locale` vor dem ersten `t()` dieses Laufs auf. `?lang=` tut nichts, bis die App es liest und `set_locale` aufruft.
- `t()` wird zur Importzeit einmal ausgeführt und behält die Ausgangssprache bei, bis dieses Modul erneut importiert wird. Rufen Sie `t()` auf, wenn das Widget erstellt wird.
- Platzhalter sind `{name}`, `{name:.2%}`, `{name:,.2f}` und `{name!r}`. Ein gepunktetes Feld wie `{row.rate}` wird abgelehnt. Übergeben Sie `rate=row.rate`.
- Ein wörtliches Prozentzeichen, dem unmittelbar ein printf-Typbuchstabe folgt (`%d`, `%a`, `%s` und der Rest), wird als Formatierung im alten Stil behandelt. Bei Schlüsselwortargumenten gibt eine fehlgeschlagene `%`-Formatierung die Vorlage zurück und überspringt die `{name}`-Substitution. Halten Sie ein wörtliches Prozentzeichen von diesen Buchstaben fern, wie in Quelltexten wie `% do CDI` oder `% a.a.`.

<a id="locale-in-each-framework"></a>
## Locale in jedem Framework

`set_locale` gibt ein `ContextVar`-Token zurück. Setzen Sie es in `finally` zurück, einschließlich FastAPI- und Flask-Middleware, damit gleichzeitige Anfragen kein Locale weitergeben.

- <a id="streamlit"></a>**Streamlit.** Rufen Sie `set_locale` vor dem ersten `t()` des Laufs auf, einschließlich `st.set_page_config(page_title=…)`. `streamlit_language_selector(sidebar=True, key="lang_selector")` schreibt `st.session_state.locale` und `st.query_params["lang"]` und ruft `set_locale` auf, wenn das Widget gezeichnet wird, sodass ein übersetzter Titel darüber für diesen Lauf in der vorherigen Sprache bleibt. Sein Label ist fest Englisch. Eine Seite, die einen übersetzten Titel benötigt, sollte [Sprachumschalter hinzufügen](/de/guide/add-i18n-to-python#step-4-add-a-language-switch) befolgen. Geben Sie jedem Widget ein festes `key`. Siehe `examples/python-streamlit`.
- <a id="fastapi"></a>**FastAPI.** Lesen Sie `?lang=` oder `Accept-Language` in der Middleware, rufen Sie `set_locale` auf und `reset_locale` in `finally`. Routen rufen `t()` und `_()` auf. Siehe `examples/python-fastapi`.
- <a id="flask"></a>**Flask und Pyramid.** Legen Sie das Locale aus der Anfrage fest und injizieren Sie `_`, `t`, `current_locale`, `ui_languages` und `direction` in den Template-Kontext. Siehe `examples/python-flask`.
- <a id="gettext"></a>**Bestehendes gettext.** Belassen Sie `_()`, `gettext()` und `ngettext()` an Ort und Stelle. Richten Sie `ui.gettext` auf den aktuellen `locales/`-Baum und führen Sie `extract` und dann `translate-ui` aus. Siehe `examples/python-gettext`.
- <a id="django"></a>**Django.** Verwenden Sie `gettext`, `ngettext` und `{% blocktrans %}`. Das Init-Template `ui-python-django` entspricht dem `locale/`-Verzeichnis und der `django`-Domain von Django.
- <a id="tkinter"></a>**Tkinter.** Rufen Sie `t()` oder `_()` beim Erstellen jedes Widgets auf und bauen Sie dann den sichtbaren Text nach `set_locale` neu auf.
- <a id="pyqt"></a>**PyQt / PySide.** `self.tr("...")` wird extrahiert. Eine `.ui`-Datei trägt `<string>`-Elemente bei, sofern nicht `notr="true"`. Das `comment`-Attribut wird zum gettext-Kontext.
- <a id="pywebview"></a>**PyWebView / PyWebKit.** Extrahieren Sie die Python-Shell mit den oben genannten Python-Templates. Extrahieren Sie die HTML-Seite mit `data-i18n`-Markierungen oder mit einem HTML-Dokument pro Gebietsschema.
