<a id="add-i18n-to-a-python-app"></a>
# i18n zu einer Python-Anwendung hinzufügen

Diese exemplarische Vorgehensweise nimmt eine Python-Anwendung, die eine einzige Sprache hat, und fügt Lokalisierungen mit ai-i18n-tools hinzu. Reine, benutzerseitige Zeichenfolgen werden manuell oder mit den Eingabeaufforderungen unter [Zeichenfolgen umbrechen](#wrap-strings) umbrochen. `migrate-python-i18n` repariert nur unsichere Aufrufe, die bereits umbrochen sind. Alles, was noch überprüft werden muss, wird in einem Bericht aufgeführt.

Verwenden Sie bereits GNU gettext, Django- oder Flask-Kataloge? Behalten Sie diese Aufrufe bei. Wählen Sie unten die passende Init-Vorlage und lassen Sie `extract` leere Katalogplätze aus den vorhandenen `.po`-Dateien füllen.

Die Schritte:

1. Die CLI [installieren](#install-and-choose-a-provider) und den API-Schlüssel festlegen.
2. Eine [Vorlage auswählen](#initialise-the-project) und `init` ausführen.
3. Zeichenfolgen in `t()` oder `_()` [umbrochen](#wrap-strings).
4. Bereits unsicher umbrochene [Aufrufstellen migrieren](#step-3-check-wrapped-calls).
5. [Modelle auswählen und übersetzen](#choose-models-and-translate).
6. [Lokalisierung zur Laufzeit wechseln](#step-4-add-a-language-switch).
7. [Übersetzt halten](#keep-it-translated).

Sie sind sich nicht sicher, ob dies Ihr Fall ist? Siehe [Nicht Ihr Fall?](#not-your-case) am Ende.

<a id="install-and-choose-a-provider"></a>
## Installieren

Verwenden Sie das npm-Paket, wenn der Computer bereits Node.js `>=22.16.0` hat ([Installation](/de/guide/installation)). Für ein Python-Projekt installieren Sie die eigenständige ausführbare Datei (kein Node.js).

Linux und macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

Das Installationsprogramm prüft `SHA256SUMS.txt`, installiert den Befehl als `ai-i18n-tools` und fügt ihn zu `PATH` hinzu. Die Binärdateien sind nicht notariell beglaubigt oder Authenticode-signiert. Manuelle Schritte und Asset-Namen: [Eigenständige ausführbare Dateien](/de/guide/installation#standalone-executables).

Legen Sie den API-Schlüssel für den Anbieter fest, den Sie an `init` übergeben. Zum Beispiel, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama benötigt keinen Schlüssel. Weitere Voreinstellungen: [Integrierte Anbieter](/de/guide/providers-and-models#built-in-providers).

<a id="initialise-the-project"></a>
## Vorlage auswählen

| App heute | Befehl | Was Sie erhalten |
| --- | --- | --- |
| Fest codierte Zeichenfolgen oder neue `t()` / `_()`-Aufrufe | `ai-i18n-tools init -t ui-python -P cheaperinference` | Flaches JSON, das nach der Zeichenfolge der Ausgangssprache und `i18n.py` geschlüsselt ist |
| GNU gettext, und Sie möchten auch flaches JSON | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON plus `.po` / `.mo`, und `i18n.py` |
| Flask- oder Jinja-Kataloge unter `translations/` | `ai-i18n-tools init -t ui-python-flask -P groq` | Gettext-Kataloge und `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (ohne `i18n.py`) |

Bearbeiten Sie `sourceLocale` und `targetLocales`. `sourceLocale` ist die Sprache der Zeichenfolgen in der Quelle. Jede BCP-47-Sprache ist gültig; Beispiele verwenden oft `en`. Framework-Verdrahtung: [Python-Integrationen](/de/guide/integrations/python). Aufrufmuster und Kataloglayout: [Python-Anwendungen](/de/guide/ui-strings/python).

<a id="run-the-agent-prompt"></a>
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

<a id="agent-prompt-i18n-py"></a>

<a id="agent-prompt-i18npy-helper"></a>

Verwenden Sie dies für Streamlit, FastAPI, Flask mit flachem JSON, Tkinter, Qt und eine PyWebView-Shell. Kopieren Sie es in einen Coding-Agenten. Ein Django- oder bestehendes Gettext-Projekt sollte stattdessen die [nächste Eingabeaufforderung](#agent-prompt-django-gettext) verwenden.

<details class="agent-prompt">
<summary>Agenten-Prompt: i18n.py-Helfer</summary>

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

Verwenden Sie dies, wenn die App bereits Django oder GNU gettext aufruft oder wenn Sie bei `.po`-Katalogen bleiben möchten. Fügen Sie `i18n.py` nicht hinzu.

Die Init-Vorlagen erkennen diese Aufrufnamen genau: `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext` und `self.tr`. Lazy- und Noop-Varianten sind nicht in dieser Liste enthalten. Fügen Sie die Namen, die das Projekt tatsächlich aufruft – typischerweise `gettext_lazy`, `ngettext_lazy`, `pgettext_lazy` und `gettext_noop` – zu `ui.uiExtractor.funcNames` hinzu, oder `extract` überspringt sie. `ngettext_lazy` wird als Singular plus Plural und `pgettext_lazy` als Kontext plus Nachricht gelesen, aber nur nachdem der Name aufgeführt ist. `{% trans %}` und `{% blocktrans %}` in Vorlagen werden separat gesammelt.

<details class="agent-prompt">
<summary>Agenten-Prompt: Django und natives Gettext</summary>

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

<a id="review-the-result"></a>
## Aufrufstellen migrieren

`migrate-python-i18n` ist ein Testlauf, bis Sie `--write` übergeben. Es schreibt immer `migrate-python-i18n-report.md`. Generierte `i18n.py`-Dateien werden übersprungen. Debug-Felder wie `{value=}` und verschachtelte Formatangaben werden gemeldet und unverändert gelassen.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

Lesen Sie den Bericht vor `--write`, wenn der Testlauf Stellen auflistet, die manuell überprüft werden müssen. Die optionale Option `--report <path>` ändert den Berichtspfad. Die optionale Option `--ui-block` beschränkt den Scan auf einen UI-Block.

<a id="choose-models-and-translate"></a>
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

<a id="check-one-language"></a>
## Gebietsschema zur Laufzeit wechseln

`set_locale` gibt ein `ContextVar`-Token zurück. Setzen Sie es zurück, wenn die Anfrage oder der Callback endet.

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI- und Flask-Middleware müssen in `finally` (Flask: `teardown_request`) zurückgesetzt werden, damit gleichzeitige Anfragen keine Locale weitergeben. Django-Projekte behalten die Locale-Aktivierung von Django bei und verwenden kein `i18n.py`. Hinweise zu den einzelnen Frameworks: [Locale in each framework](/de/guide/ui-strings/python#locale).

<a id="keep-it-translated"></a>
## Übersetzt halten

`ai-i18n-tools sync` (oder zuerst `extract` und dann `translate-ui`) erneut ausführen, nachdem der Quelltext geändert wurde. Der Cache sorgt dafür, dass nur neue oder geänderte Zeichenfolgen an das Modell gesendet werden. Führen Sie es in CI aus, damit Übersetzungen nicht abweichen. `ai-i18n-tools dashboard` öffnet das [Übersetzungs-Dashboard](/de/guide/translation-dashboard/), um Übersetzungen zu überprüfen.

Um `README.md` im selben Durchlauf zu übersetzen, erstellen Sie ein Gerüst mit `--with-readme` (oder fügen Sie den Block zu einer bestehenden Konfiguration hinzu). Siehe [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Nicht Ihr Fall?

| Sie haben | Lesen Sie |
| --- | --- |
| Eine JS/TS-App | [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) |
| Eine Website oder Dokumentationsseite | [i18n zu einer Website oder Dokumentationsseite hinzufügen](/de/guide/add-i18n-to-website) |
| Eine Repository-README oder andere Markdown-Dateien | [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme) |
| Verschachteltes Gebietsschema-JSON | [JSON](/de/guide/json) |

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## Beispiele

| Beispiel | Beschreibung |
| --- | --- |
| [python-streamlit](/de/examples#python-streamlit) | Dashboard, `t()` / `_()`, flaches JSON |
| [python-fastapi](/de/examples#python-fastapi) | Request-bezogene Locale, flaches JSON |
| [python-flask](/de/examples#python-flask) | Flask + Jinja, flaches JSON |
| [python-gettext](/de/examples#python-gettext) | Bestehendes gettext CLI; `translate-ui` aktualisiert `.po` und `.mo` |

Kopieren Sie eines mit `npx degit` oder laden Sie `ai-i18n-tools-python-examples.zip` vom GitHub-Release herunter. Befehle: [Examples](/de/examples#python-examples).
