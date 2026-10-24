<a id="add-i18n-to-a-python-app"></a>
# i18n zu einer Python-Anwendung hinzufügen

Diese Anleitung zeigt, wie Sie eine einsprachige Python-Anwendung um Lokalisierungen mit ai-i18n-tools erweitern. Sichere Änderungen an Aufrufstellen werden von `migrate-python-i18n` vorgenommen. Alles, was noch überprüft werden muss, wird in einem Bericht aufgelistet.

Verwenden Sie bereits GNU gettext, Django- oder Flask-Kataloge? Behalten Sie diese Aufrufe bei. Wählen Sie unten die passende Init-Vorlage und lassen Sie `extract` leere Katalogplätze aus den vorhandenen `.po`-Dateien füllen.

<a id="install"></a>
## Installieren

Verwenden Sie das npm-Paket, wenn auf dem Rechner bereits Node.js `>=22.16.0` installiert ist ([Installation](/de/guide/installation)). Für ein Python-Projekt ist der übliche Weg die eigenständige ausführbare Datei aus dem GitHub-Release – Linux (`x64`, `arm64`), macOS (`arm64`, `x64`) und Windows (`x64`). Prüfen Sie `SHA256SUMS.txt`, führen Sie `chmod +x` unter Unix aus und legen Sie die Datei in `PATH` ab. Die Binärdateien sind nicht signiert. Asset-Namen und Prüfsummen: [Eigenständige ausführbare Dateien](/de/guide/installation#standalone-executables).

Legen Sie den API-Schlüssel für den Anbieter fest, den Sie an `init` übergeben. Zum Beispiel, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama benötigt keinen Schlüssel. Weitere Voreinstellungen: [Integrierte Anbieter](/de/guide/providers-and-models#built-in-providers).

<a id="pick-a-template"></a>
## Vorlage auswählen

| Aktuelle App | Befehl | Was Sie erhalten |
| --- | --- | --- |
| Fest codierte Zeichenfolgen oder neue `t()` / `_()`-Aufrufe | `ai-i18n-tools init -t ui-python -P cheaperinference` | Flaches JSON mit englischen Schlüsseln und `i18n.py` |
| GNU gettext, und Sie möchten auch flaches JSON | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON plus `.po` / `.mo`, und `i18n.py` |
| Flask- oder Jinja-Kataloge unter `translations/` | `ai-i18n-tools init -t ui-python-flask -P groq` | Gettext-Kataloge und `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (ohne `i18n.py`) |

Bearbeiten Sie `sourceLocale` und `targetLocales`. `sourceLocale` ist die Sprache der Strings im Quellcode (oft `en`). Framework-Anbindung: [Python-Integrationen](/de/guide/integrations/python). Aufrufformate und Katalogstruktur: [Python-Anwendungen](/de/guide/ui-strings/python).

<a id="wrap-strings"></a>
## Strings umschließen

Suchen Sie zuerst den Katalogeintrag und führen Sie dann die Interpolation durch. Importieren Sie `t` und `_` aus der generierten `i18n.py` (Django behält `gettext` und `ngettext`).

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Diese werden vor jeder Katalogsuche ausgewertet. Der Extraktor markiert sie als unsicher, und `migrate-python-i18n` schreibt sie um:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="migrate"></a>
## Aufrufstellen migrieren

`migrate-python-i18n` ist ein Testlauf, bis Sie `--write` übergeben. Es schreibt immer `migrate-python-i18n-report.md`. Generierte `i18n.py`-Dateien werden übersprungen. Debug-Felder wie `{value=}` und verschachtelte Formatangaben werden gemeldet und unverändert gelassen.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

Lesen Sie den Bericht vor `--write`, wenn der Testlauf Stellen auflistet, die manuell überprüft werden müssen. Die optionale Option `--report <path>` ändert den Berichtspfad. Die optionale Option `--ui-block` beschränkt den Scan auf einen UI-Block.

<a id="translate"></a>
## Modelle auswählen und übersetzen

Die Modellliste von `init` ist ein Ausgangspunkt. Bewerten Sie die Chat-Modelle des aktiven Anbieters und schreiben Sie die Auswahl in `translationModels`, sobald die engere Auswahl korrekt aussieht:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ersetzt nur `translationModels`. Das gleiche Ranking finden Sie auf der Registerkarte [Models](/de/guide/translation-dashboard/models). Extrahieren und übersetzen Sie anschließend:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` schreibt `strings.json` und `ui-languages.json`. `translate-ui` füllt die flachen JSON-Dateien und, wenn `ui.gettext` gesetzt ist, die `.po` / `.mo`-Kataloge. Bearbeiten Sie diese generierten Kataloge nicht manuell.

<a id="switch-locale"></a>
## Locale zur Laufzeit umschalten

`set_locale` gibt ein `ContextVar`-Token zurück. Setzen Sie es zurück, wenn die Anfrage oder der Callback endet.

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI- und Flask-Middleware müssen in `finally` (Flask: `teardown_request`) zurückgesetzt werden, damit gleichzeitige Anfragen keine Locale weitergeben. Django-Projekte behalten die Locale-Aktivierung von Django bei und verwenden kein `i18n.py`. Hinweise zu den einzelnen Frameworks: [Locale in each framework](/de/guide/ui-strings/python#locale).

<a id="examples"></a>
## Beispiele

| Beispiel | Beschreibung |
| --- | --- |
| [python-streamlit](/de/examples#python-streamlit) | Dashboard, `t()` / `_()`, flaches JSON |
| [python-fastapi](/de/examples#python-fastapi) | Request-bezogene Locale, flaches JSON |
| [python-flask](/de/examples#python-flask) | Flask + Jinja, flaches JSON |
| [python-gettext](/de/examples#python-gettext) | Bestehendes gettext CLI; `translate-ui` aktualisiert `.po` und `.mo` |

Kopieren Sie eines mit `npx degit` oder laden Sie `ai-i18n-tools-python-examples.zip` vom GitHub-Release herunter. Befehle: [Examples](/de/examples#python-examples).
