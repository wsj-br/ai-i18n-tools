<a id="add-i18n-to-a-python-app"></a>
# i18n zu einer Python-Anwendung hinzufügen

Diese Seite nimmt eine Python-Anwendung, die eine einzige Sprache hat, und fügt Lokalisierungen mit ai-i18n-tools hinzu. Sie folgt einem Pfad: der `ui-python`-Vorlage, einem kleinen `i18n.py`-Helfer und JSON-Dateien mit Übersetzungen. Dieser Pfad passt zu Streamlit, FastAPI, Flask, Desktop-Anwendungen und Skripten.

Der schnellste Weg ist, einem Coding-Agenten den Prompt auf dieser Seite zu geben. Er richtet die Konfiguration ein, umschließt Ihre Zeichenketten, prüft das Ergebnis und kann ein Sprachmenü hinzufügen. Sie installieren die CLI, wählen den Anbieter und initialisieren das Projekt selbst, da dies Ihren API-Schlüssel und Ihre Entscheidungen erfordert. Sie führen die Übersetzung auch selbst aus, da dies Kosten auf Ihrem Konto verursacht.

Sie verwenden Django, Flask-Babel-Kataloge oder GNU gettext und möchten diese Aufrufe beibehalten? Verwenden Sie stattdessen [i18n zu einer Django / Python gettext App hinzufügen](/de/guide/add-i18n-to-django-gettext). Es behält `gettext` bei und schreibt `.po`- und `.mo`-Dateien, ohne Helfer. Nicht sicher, was zutrifft? Siehe [Nicht Ihr Fall?](#not-your-case) am Ende.

Der Ablauf:

1. [CLI installieren und einen Anbieter auswählen](#install-and-choose-a-provider).
2. [Projekt initialisieren](#initialise-the-project) mit `init`.
3. [Agent-Prompt ausführen](#run-the-agent-prompt).
4. [Ergebnis überprüfen](#review-the-result).
5. [Modelle auswählen und übersetzen](#choose-models-and-translate), dann eine Sprache prüfen.
6. [Übersetzt halten](#keep-it-translated).

Möchten Sie die Änderungen lieber selbst vornehmen oder wissen, was der Prompt tut? [Manuell vorgehen](#do-it-by-hand) führt die gleichen Schritte einzeln durch.

<a id="install-and-choose-a-provider"></a>
## Anbieter installieren und auswählen

Diesen Teil erledigen Sie, nicht der Agent. Der Installer nimmt Änderungen an Ihrem System vor, und der API-Schlüssel ist ein Geheimnis, das in Ihre Shell gehört, nicht in einen Prompt.

Verwenden Sie das npm-Paket, wenn der Computer bereits Node.js `>=22.16.0` hat ([Installation](/de/guide/installation)). Für ein Python-Projekt installieren Sie die eigenständige ausführbare Datei (kein Node.js).

Linux und macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

Der Installer prüft `SHA256SUMS.txt`, installiert den Befehl als `ai-i18n-tools` und fügt ihn zu `PATH` hinzu. Die Binärdateien sind nicht notariell beglaubigt oder Authenticode-signiert. Manuelle Schritte und Asset-Namen: [Eigenständige ausführbare Dateien](/de/guide/installation#standalone-executables).

Installation überprüfen:

```bash
ai-i18n-tools --version
```

Wählen Sie dann einen Anbieter und legen Sie dessen API-Schlüssel in der Shell fest, die die Übersetzung ausführen wird. Zum Beispiel, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama benötigt keinen Schlüssel. Andere Voreinstellungen: [Integrierte Anbieter](/de/guide/providers-and-models#built-in-providers). Merken Sie sich den Anbieternamen, da Sie ihn im nächsten Schritt an `init` übergeben. Der Agent benötigt den Schlüssel nie: Er führt nur Befehle aus, die keine Modellaufrufe tätigen. Sie verwenden den Schlüssel später, wenn Sie [übersetzen](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Projekt initialisieren

Sie führen dies einmal aus, vor dem Prompt. Es schreibt die Konfiguration und den `i18n.py`-Helfer, und es verwendet den oben gewählten Anbieter.

Diese Seite verwendet eine Vorlage, `ui-python`. Sie schreibt die Konfiguration, den `i18n.py`-Helfer und JSON-Kataloge. Sie passt zu diesen Apps:

| Ihre App | Hinweise |
| --- | --- |
| Streamlit | Das Sprachmenü benötigt einige Zeilen in der App; siehe [Sprachumschalter hinzufügen](#step-4-add-a-language-switch) |
| FastAPI | Das Gebietsschema wird pro Anfrage festgelegt |
| Flask | Flache JSON-Kataloge. Für Flask-Babel-Kataloge in `translations/` verwenden Sie die [gettext-Seite](/de/guide/add-i18n-to-django-gettext) |
| Pyramid | Gleiche Verdrahtung wie Flask |
| Desktop-Anwendungen (Tkinter, PyQt, PySide) | Sichtbaren Text nach Änderungen des Gebietsschemas neu aufbauen |
| PyWebView | Die Vorlage deckt die Python-Shell ab. Übersetzen Sie die HTML-Seite separat |
| Befehlszeilentools und Skripte | Der einfachste Fall |

Führen Sie init mit dem von Ihnen gewählten Anbieter aus (in diesem Beispiel Cheaper Inference):

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
```

Bearbeiten Sie dann `sourceLocale` und `targetLocales` in `ai-i18n-tools.config.json`. `sourceLocale` ist die Sprache der Zeichenketten in der Quelle. Jede BCP-47-Sprache ist gültig; Beispiele verwenden oft `en`.

Führen Sie `init` einmal aus. Es überschreibt `ai-i18n-tools.config.json` jedes Mal, sodass ein zweiter Durchlauf von Ihnen vorgenommene Änderungen verwirft. Wenn `i18n.py` bereits den Marker `ai-i18n-tools-i18n-py` enthält, ist das Projekt bereits initialisiert: Überspringen Sie diesen Schritt.

`init` setzt `ui.sourceRoots` auf `"."`, sodass `extract` das gesamte Repository (Tests, Skripte, Dokumente) scannen würde. Der Prompt grenzt es auf Ihren Anwendungscode ein (manuell, das ist [Schritt 1](#place-the-helper)).

Framework-Verdrahtung: [Python-Integrationen](/de/guide/integrations/python). Aufrufmuster und Kataloglayout: [Python-Anwendungen](/de/guide/ui-strings/python).

<a id="run-the-agent-prompt"></a>
## Agent-Prompt ausführen

Öffnen Sie das Projekt in Ihrem Coding-Agenten (Cursor, Claude Code, Copilot oder ähnlich), starten Sie einen neuen Chat und fügen Sie den unten stehenden Prompt ein. Das Projekt muss bereits initialisiert sein. Es gibt nichts zu bearbeiten. Wenn Sie etwas weglassen möchten, zum Beispiel kein Sprachmenü, sagen Sie dies in derselben Nachricht.

Der Agent prüft zuerst, ob die CLI, die Konfiguration und `i18n.py` existieren, und stoppt mit Anweisungen, falls eines davon fehlt. Dann arbeitet er in drei Teilen:

- Teil 1 platziert `i18n.py` und `locales/` dort, wo das Repository seinen Code speichert, und verweist die Konfiguration darauf.
- Teil 2 umschließt die benutzerspezifischen Zeichenfolgen in `t()` und `_()`, führt `extract` aus und prüft die umhüllten Aufrufe mit `migrate-python-i18n`.
- Teil 3 fügt ein Sprachmenü oder eine CLI-Sprachoption und ein Umgebungslokal hinzu.

Er installiert oder initialisiert nichts, liest Ihren API-Schlüssel nicht und übersetzt nicht. Die Übersetzung ist der Schritt nach der Überprüfung, und Sie führen sie aus.

````markdown
# Add languages to this Python app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists, and that an `i18n.py` containing
`ai-i18n-tools-i18n-py` exists. If any of them is missing, stop now and tell
the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-python -P <provider>`, then run this prompt again.
Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API
  and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `i18n.py` or
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`). Do not
  add another helper module.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and the catalogs

Skip this part when `i18n.py` and `locales/` already sit with the code that
uses them and the config points at them.

1. Move `i18n.py` and `locales/` together to where this repository keeps its
   code. A script: leave them at the root. A package or `src/` layout: put them
   in the package, beside the modules that import them. `i18n.py` loads
   `locales/` from its own folder, so do not edit paths inside it.
2. In `ai-i18n-tools.config.json`, point `ui.stringsJson`, `ui.flatOutputDir`,
   and `languagesManifestPath` (if it is set) at the new `locales/`. Set
   `ui.sourceRoots` to the application code instead of `"."`.
3. Update imports (`from i18n import t`, or `from mypkg.i18n import t`). If the
   app is installed or shipped (wheel, container), include `locales/*.json` as
   package data.
4. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text that
is already wrapped needs no change.

- Wrap text a person sees: labels, titles, captions, messages, errors,
  validation text, progress lines, emails. Leave SQL, regexes, file formats, log
  messages, CSS, identifiers, widget keys, status and enum codes, number and
  date formats, and prompts sent to a model.
- Call shapes: `t("Hello, {name}!", name=name)` and `_("Hello, %s!") % name`.
  Placeholders are `{name}`, `{price:,.2f}`, `{rate:.2%}`, or `{item!r}`, passed
  as keyword arguments. No dotted fields: pass `rate=row.rate`. Keep a literal
  `%` away from a printf letter such as `%d`.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`.
- The argument must be a string literal, so `t(variable)` is invisible. Use one
  `t()` per sentence or paragraph, with values as placeholders. Split only where
  the text already branches. Keep markers that the code detects outside `t()`.
- A value that is both stored and shown keeps its source-language value.
  Translate the label where it is displayed, and compare against the stored
  value.
- `t()` at module level runs once and freezes. Call it where the text is shown.
- Put the import with the project's other first-party imports.

Work in passes: list string literals that are not passed to `t` or `_` (a
throwaway script is fine), wrap the user-facing ones, then list again. Treat any
bulk rewrite as a draft and review its diff.

Then run `ai-i18n-tools extract` and `ai-i18n-tools migrate-python-i18n`
without `--write`, and read `migrate-python-i18n-report.md`. It finds calls that
format before the lookup. Apply its edits with `--write` only after reading
them, run `extract` again, and repeat until the dry run lists nothing. Fix
manual-review lines by hand. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads (a silent
job or a JSON-only API), or when the user asked you to leave language choice
out. A command-line program still gets this part: it has no menu, but it gets
a language option and the process locale, the same idea as the ai-i18n-tools
CLI (`-L` / `--ui-lang`, then `AI_I18N_LANG`, then a saved setting, then the
operating-system locale).

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Work out how this project's framework does it, using these
rules:

1. Choose the locale where one unit of work starts (process start, a request,
   a script rerun, window start-up, a UI event), and call `set_locale` before
   the first `t()`. That includes CLI help, usage errors, and page titles set
   before the body.
2. Choose in this order: the explicit choice (CLI option, selector, `?lang=`),
   the stored choice (settings, cookie, session), the environment, then the
   source locale. Accept only codes from `get_ui_languages()`, matched
   case-insensitively and by language (`pt-br` and `pt` become `pt-BR`).
   `set_locale` does not match. An explicit option or the app's own language
   variable that names an unavailable language warns once, then uses the source
   locale. A locale taken only from the operating system does not warn.
3. Keep the locale local to the unit of work: keep the token from `set_locale`
   and call `reset_locale(token)` in `finally` or a teardown hook. A new thread
   starts in the source locale.
4. On a screen, add a selector built from `get_ui_languages()` (each row has
   `code` and `label`), labelled `t("Language")`, on every screen that should
   switch, and store the choice. A CLI does not get a selector.
5. Make the change visible on the next command, a page reload, `st.rerun()`, or
   a function that re-applies every visible string. Each string is a
   `t("literal")` so the extractor sees it.
6. Set the text direction from `get_direction()` where the framework needs it.

Command-line programs:

- Add `--lang <code>`, `-L <code>`, and `--lang=<code>`, unless the program
  already uses those names. Read the option from the raw arguments before
  argparse builds help, so `--help` is translated too. Document the option in
  that help.
- After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`; that variable is only for the ai-i18n-tools CLI.
  With no such variable, use `LC_ALL`, then `LC_MESSAGES`, then `LANG`, and
  ignore a value of `C` or `POSIX`.
- After the environment, use a language already stored in the app's config.
  Then the host locale, then the source locale. Do not add a new config file
  just to remember the language.

Hints, to adapt rather than copy. Web apps: a middleware or before-request hook
chooses the locale, an after-request hook stores the cookie, and templates get
`t`, `_`, and the language helpers. Streamlit: set the locale at the top of the
entry script, before `st.set_page_config`, with a selectbox that has a fixed
`key`, sets `?lang=`, and calls `st.rerun()`; `streamlit_language_selector()`
sets the locale only after it is drawn. Desktop: set the saved locale before
building the window, and refresh the visible text in the selector handler.

## Verify and report

The tests pass, and none leaves a non-source locale active (`reset_locale` needs
the token from `set_locale`). `extract` writes a non-empty catalog. With the
source locale, the output is unchanged.

Report the files changed, skipped strings grouped by reason, plurals left as one
string, one word with several meanings, sentences built from translated pieces,
and any `t()` that runs at import time. Then list the commands for the user, and
do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then restart the app.
````

<a id="review-the-result"></a>
## Ergebnis überprüfen

Der Agent schließt mit einem Bericht ab. Überprüfen Sie ihn, bevor Sie übersetzen:

- Der Diff. Umhüllter Text sollte sich wie zuvor lesen, ohne irrelevante Neuformatierung. `git diff --stat` zeigt, wie viel sich geändert hat.
- Die übersprungenen Zeichenfolgen und die mehrdeutigen Fälle im Bericht: Plurale, die als eine Zeichenfolge belassen wurden, ein Wort, das als gespeicherter Wert und als Beschriftung verwendet wird, und Sätze, die aus übersetzten Teilen aufgebaut sind. Entscheiden Sie diese manuell.
- `ai-i18n-tools extract` läuft fehlerfrei, und `strings.json` befindet sich im erwarteten Ordner.
- Ihre Tests bestehen, und die App sieht in der Ausgangssprache gleich aus.
- Es wurde kein Wegwerfskript oder `migrate-python-i18n-report.md` zurückgelassen.

Zeichenfolgen, die der Agent übersehen hat, erscheinen später als Text, der in der Ausgangssprache verbleibt. [Schritt 2](#wrap-strings) enthält ein optionales Skript, das nicht umhüllten Text ausgibt.

<a id="choose-models-and-translate"></a>
## Modelle auswählen und übersetzen

Sie führen diesen Teil aus. Er verwendet Ihren API-Schlüssel und verursacht Kosten auf Ihrem Konto.

Die Modellliste von `init` ist ein Ausgangspunkt. Bewerten Sie die Chat-Modelle des aktiven Anbieters und schreiben Sie die Auswahl in `translationModels`, sobald die engere Auswahl korrekt aussieht:

```bash
ai-i18n-tools suggest-models 
ai-i18n-tools suggest-models --apply
```

`--apply` ersetzt nur `translationModels`. Verwenden Sie `--max-output-price`, um Modelle auszuschließen, deren Ausgabepreis ein Limit überschreitet. Wenn Sie eine GUI bevorzugen, verwenden Sie `ai-i18n-tools dashboard`, um die [Modelle](/de/guide/translation-dashboard/models) auszuwählen.

Dann extrahieren und übersetzen:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` schreibt `strings.json` und `ui-languages.json`. `translate-ui` schreibt eine JSON-Datei pro Zielsprache. Lassen Sie diese generierten Dateien unbearbeitet.

`t()` sucht den Quellsatz in der Locale-JSON-Datei. Die ID in `strings.json` ist nicht der Suchschlüssel. Eine fehlende Datei oder ein fehlender Schlüssel gibt den Quellsatz zurück. Der Helfer hält die geladene JSON-Datei für den Prozess im Speicher, einschließlich einer leeren Map, wenn die Datei beim ersten Nachschlagen fehlte. Starten Sie die App daher nach `translate-ui` neu.

<a id="check-one-language"></a>
### Eine Sprache überprüfen

Starten Sie die App neu, wechseln Sie zu einer Zielsprache und öffnen Sie eine Seite mit einigen umhüllten Zeichenfolgen. Verwenden Sie das vom Agenten hinzugefügte Sprachmenü oder stellen Sie das Gebietsschema manuell ein. Text, der sich noch in der Ausgangssprache befindet, wurde nicht umhüllt, wird zur Importzeit ausgeführt oder hat keinen Eintrag in `locales/<code>.json`. Überprüfen Sie die JSON-Datei auf den Satz, bevor Sie den Code verdächtigen.

<a id="keep-it-translated"></a>
## Übersetzt halten

Führen Sie `ai-i18n-tools sync` (oder `extract` und dann `translate-ui`) erneut aus, nachdem Sie den Quelltext geändert haben. Der Cache bedeutet, dass nur neue oder geänderte Zeichenfolgen an das Modell gesendet werden. Führen Sie es in CI aus, damit Übersetzungen nicht auseinanderdriften. Starten Sie die App nach einem Übersetzungsdurchlauf neu, damit sie die JSON-Datei neu lädt. `ai-i18n-tools dashboard` öffnet das [Übersetzungs-Dashboard](/de/guide/translation-dashboard/), um Übersetzungen zu überprüfen.

Um `README.md` im selben Durchlauf zu übersetzen, erstellen Sie ein Gerüst mit `--with-readme` (oder fügen Sie den Block zu einer bestehenden Konfiguration hinzu). Siehe [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Machen Sie es manuell

Arbeiten Sie diese Schritte durch, wenn Sie die Änderungen lieber selbst vornehmen oder wissen möchten, was die Eingabeaufforderung bewirkt. Jeder Schritt entspricht einem Teil der Eingabeaufforderung. Sie [installieren die CLI](#install-and-choose-a-provider), [initialisieren das Projekt](#initialise-the-project) und [übersetzen](#choose-models-and-translate) am Ende trotzdem.

1. [Platzieren Sie den Helfer und die Kataloge](#place-the-helper) dort, wo dieses Repository seinen Code speichert.
2. [Umschließen Sie Zeichenfolgen](#wrap-strings) in `t()` oder `_()`.
3. [Prüfen Sie umhüllte Aufrufe](#step-3-check-wrapped-calls) mit `migrate-python-i18n`.
4. [Fügen Sie einen Sprachschalter hinzu](#step-4-add-a-language-switch).

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## Schritt 1: Platzieren Sie den Helfer und die Kataloge

`init` schreibt diese im Repository-Stammverzeichnis:

| Datei | Was es ist | Bearbeiten? |
| --- | --- | --- |
| `i18n.py` | Der Helfer, den Ihr Code importiert (`t`, `_`, `set_locale`) | Nein. Er wird generiert |
| `locales/strings.json` | Der Extraktions-Cache. Die App liest ihn nie | Nein. Er wird vom Extraktor generiert |
| `locales/<code>.json` | Die Übersetzungen, die die App lädt, eine Datei pro Sprache | Nein. `translate-ui` schreibt sie |
| `locales/ui-languages.json` | Die Liste der Sprachen, für ein Sprachmenü | Nein. Sie wird vom Extractor generiert |

`i18n.py` lädt `locales/` aus dem Ordner, in dem es sich befindet. Verschieben Sie den Helper und den Ordner `locales/` zusammen, und lassen Sie die Pfade innerhalb von `i18n.py` unverändert.

| Ihr Repository | Wohin sie gehören |
| --- | --- |
| Ein Skript im Repository-Stammverzeichnis | Lassen Sie `i18n.py` und `locales/` dort, wo `init` sie geschrieben hat |
| Ein Paket, das ein `src/`-Layout enthält | Verschieben Sie beides in das Paket, neben den Code, der sie importiert |

Beispiel: Ein installierbares Paket `mypkg` unter `src/mypkg/` behält `src/mypkg/i18n.py` und `src/mypkg/locales/`.

Aktualisieren Sie die Konfiguration auf den neuen Speicherort:

```json
{
  "ui": {
    "sourceRoots": ["src/mypkg"],
    "stringsJson": "src/mypkg/locales/strings.json",
    "flatOutputDir": "src/mypkg/locales"
  }
}
```

`sourceRoots` ist der Ordner, den `extract` scannt. Behalten Sie ihn im Anwendungspaket, damit Tests und Datendateien nicht im Katalog landen. Der Pfad zur Sprachliste, `languagesManifestPath`, folgt `flatOutputDir`, wenn er nicht gesetzt ist. Wenn die Konfiguration ihn bereits setzt, ändern Sie ihn entsprechend.

Importieren Sie `t` aus dem von Ihnen gewählten Modulpfad: `from i18n import t` im Repository-Stammverzeichnis oder `from mypkg.i18n import t` innerhalb eines Pakets.

Wenn die App installiert oder in einem Container ausgeliefert wird, muss die Locale-JSON-Datei mit dem Paket mitgeliefert werden. Fügen Sie sie zu den Paketdaten hinzu (das Muster ist relativ zum Paketverzeichnis):

```toml
[tool.setuptools.package-data]
mypkg = ["locales/*.json"]
```

Bestätigen Sie mit `ai-i18n-tools extract`. Der Katalog sollte im neuen Ordner `locales/` erscheinen.

<a id="step-2-wrap-strings"></a>
## Schritt 2: Zeichenketten umschließen

`extract` erfasst eine Zeichenfolge nur, wenn es sich um ein Literal handelt, das an `t()` oder `_()` übergeben wird. Importieren Sie sie aus dem generierten Modul.

Suchen Sie zuerst den Katalogeintrag, dann interpolieren Sie:

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Diese führen die Formatierung vor jeder Suche aus, daher kennzeichnet der Extractor sie als unsicher. Der [nächste Schritt](#step-3-check-wrapped-calls) findet sie:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

Umschließen Sie Text, den eine Person sieht: Widget-Beschriftungen, Seitentitel, Bildunterschriften, in der Benutzeroberfläche angezeigte Fehler, Fortschrittsanzeigen, Validierungsmeldungen und Absätze, die einige Zahlen enthalten. Ein Absatz mit interpolierten Zahlen ist immer noch ein `t()`-Aufruf. Platzhalter sind Namen wie `{name}`, `{price:,.2f}` oder `{rate:.2%}`. Übergeben Sie `rate=row.rate`. Ein Platzhalter wie `{row.rate:.2%}` wird abgelehnt.

Belassen Sie die Quellformulierung wie sie ist. Eine fehlende Übersetzung gibt diesen Satz zurück, sodass die App in der Ausgangssprache gleich bleibt.

Überspringen Sie Text, den das Programm abgleicht oder protokolliert: SQL, Regexes, Dateikopfzeilen, Logger-Zeilen, CSS, Widget-Schlüssel, Enum-Codes und Prompts, die Sie an ein Modell senden. Wenn ein Wert sowohl gespeichert als auch angezeigt wird (ein Auswahlfeld, dessen Option auch im Code verglichen wird), behalten Sie den gespeicherten Wert in der Ausgangssprache und übersetzen Sie die Beschriftung mit `format_func`.

`t()` wird beim Import einmal ausgeführt und behält die Ausgangssprache bei, bis dieses Modul erneut importiert wird. Rufen Sie `t()` auf, wenn das Widget erstellt wird.

<a id="find-unwrapped-strings"></a>

Arbeiten Sie in Durchläufen: Listen Sie Literale auf, die keine Argumente von `t()` oder `_()` sind, umschließen Sie die benutzerorientierten, und listen Sie dann erneut auf. Das folgende Skript ist optional. Es gibt Kandidaten aus, einschließlich f-Strings und Text, der mit `+` verbunden ist. Es überspringt Docstrings, SQL und Text ohne Leerzeichen, sodass eine kurze Beschriftung wie `Overview` immer noch überprüft werden muss. Löschen Sie es, wenn Sie fertig sind. Ein Skript, das Dateien umschreibt, ist ein Entwurf: Behalten Sie vorhandene Leerzeilen bei, fügen Sie den neuen Import zu den anderen Importen des Projekts hinzu, führen Sie den Formatter des Projekts aus und überprüfen Sie den Diff, bevor Sie es behalten.

<details>
<summary>Optional: Nicht umhüllte Zeichenfolgen auflisten</summary>

```python
"""List string literals that are not passed to t() or _().

Usage: python scan_unwrapped.py path/to/package
"""

import ast
import sys
from pathlib import Path

WRAPPERS = {"t", "_", "translate", "gettext", "ngettext", "pgettext"}
SKIP_DIRS = {".venv", "venv", "env", "site-packages", "__pycache__", "node_modules"}
SQL_START = ("SELECT ", "INSERT ", "UPDATE ", "DELETE ", "WITH ", "PRAGMA ")


class Scanner(ast.NodeVisitor):
    def __init__(self) -> None:
        self.hits: list[tuple[int, str]] = []
        self.skip: set[int] = set()

    def mark_docstring(self, body: list[ast.stmt]) -> None:
        first = body[0] if body else None
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
            self.skip.add(id(first.value))

    def visit_Module(self, node: ast.Module) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_ClassDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
        if name in WRAPPERS and node.args:
            self.skip.add(id(node.args[0]))
        self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp) -> None:
        if id(node) in self.skip:
            return
        if not isinstance(node.op, ast.Add):
            self.generic_visit(node)
            return
        pieces: list[ast.expr] = []

        def flatten(item: ast.expr) -> None:
            if isinstance(item, ast.BinOp) and isinstance(item.op, ast.Add):
                flatten(item.left)
                flatten(item.right)
            else:
                pieces.append(item)

        flatten(node)
        texts = [p for p in pieces if isinstance(p, ast.Constant) and isinstance(p.value, str)]
        if not texts:
            self.generic_visit(node)
            return
        joined = "".join(p.value if p in texts else "{...}" for p in pieces)  # type: ignore[union-attr]
        for piece in texts:
            self.skip.add(id(piece))
        self.report(node.lineno, joined)
        for piece in pieces:
            if piece not in texts:
                self.visit(piece)

    def visit_JoinedStr(self, node: ast.JoinedStr) -> None:
        if id(node) not in self.skip:
            parts = [v.value if isinstance(v, ast.Constant) else "{...}" for v in node.values]
            self.report(node.lineno, "".join(str(p) for p in parts))
        # Never report the pieces of an f-string on their own.

    def visit_Constant(self, node: ast.Constant) -> None:
        if id(node) not in self.skip and isinstance(node.value, str):
            self.report(node.lineno, node.value)

    def report(self, line: int, text: str) -> None:
        if " " not in text.strip() or not any(ch.isalpha() for ch in text):
            return
        if text.startswith(SQL_START):
            return
        preview = " ".join(text.split())
        self.hits.append((line, preview if len(preview) <= 140 else preview[:137] + "..."))


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for path in sorted(root.rglob("*.py")):
        if path.name == "i18n.py" or SKIP_DIRS & set(path.parts):
            continue
        scanner = Scanner()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except SyntaxError as error:
            print(f"\n# {path}\nskipped, cannot parse with this Python: {error.msg} (line {error.lineno})")
            continue
        scanner.visit(tree)
        if scanner.hits:
            print(f"\n# {path}")
            for line, preview in scanner.hits:
                print(f"{line}: {preview}")


if __name__ == "__main__":
    main()
```

</details>

<a id="step-3-check-wrapped-calls"></a>
## Schritt 3: Umschlossene Aufrufe prüfen

Verwenden Sie diesen Schritt, wenn der Code Aufrufe enthält, die die Zeichenkette vor der Katalogsuche formatieren. Dies ist typisch für ältere Kapselungen und einen Agentenfehler:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` schreibt diese in eine Suche um, die zuerst stattfindet. Ein zweiter Durchlauf ändert nichts.

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
t("Hello, {name}!", name=name)
```

Rohe Zeichenketten wie `st.write(f"Hello, {name}!")` bleiben, wie sie sind. Ihr Umschließen ist [Zeichenketten umschließen](#wrap-strings). Wenn `extract` sauber ist und der Code keine der drei oben genannten Formen aufweist, gibt es nichts umzuschreiben.

Führen Sie es nach `extract` und vor `translate-ui` aus, damit der Katalog niemals einen f-String als Schlüssel speichert.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-python-i18n
```

Der Befehl ist ein Testlauf, bis Sie `--write` übergeben. Er schreibt `migrate-python-i18n-report.md`. Lesen Sie diesen Bericht. Wenn die Änderungen korrekt aussehen:

```bash
ai-i18n-tools migrate-python-i18n --write
ai-i18n-tools extract
```

Führen Sie den Testlauf erneut aus. Stoppen Sie, wenn keine Änderungen aufgeführt sind, und führen Sie dann die Tests des Projekts aus.

Zeilen, die der Befehl beibehält (Debug-Felder wie `{value=}`, verschachtelte Formatierungsangaben), werden im Bericht aufgeführt. Beheben Sie diese manuell und führen Sie den Testlauf erneut aus. Generiertes `i18n.py` wird übersprungen. Der Bericht ist ein Build-Artefakt: Löschen Sie ihn oder ignorieren Sie ihn mit Git.

Ein Bericht ohne Änderungen bedeutet, dass die umschlossenen Aufrufe sicher sind. Es bedeutet nicht, dass jeder benutzersichtbare Satz umschlossen wurde. Die [Liste der nicht umschlossenen Literale](#find-unwrapped-strings) ist die Überprüfung dafür.

Optional `--report <path>` ändert den Berichtspfad. Optional `--ui-block` begrenzt den Scan auf einen UI-Block.

<a id="step-4-add-a-language-switch"></a>
## Schritt 4: Sprachumschalter hinzufügen

Jedes Framework benötigt die gleichen vier Dinge:

1. Wählen Sie das Gebietsschema zu Beginn jeder Anfrage, jedes Skriptdurchlaufs oder jedes Fensterereignisses und rufen Sie `set_locale` vor dem ersten `t()` auf.
2. Akzeptieren Sie nur Sprachen, die in `ui-languages.json` (`get_ui_languages()`) aufgeführt sind, und gleichen Sie sie locker ab. Browser senden `pt-br`, während der Katalog `pt-BR` ist.
3. Bieten Sie einen Selektor an, der aus `get_ui_languages()` erstellt wurde.
4. Merken Sie sich die Auswahl.

Das Öffnen von `?lang=pt-BR` bewirkt nichts, bis die App es liest. Die [Agenten-Eingabeaufforderung](#run-the-agent-prompt) erledigt all dies für Apps mit einer Benutzeroberfläche und ermittelt das Framework selbst. Die folgenden Abschnitte zeigen das Ergebnis für Streamlit, FastAPI, Flask und Tkinter. Andere Frameworks folgen den gleichen Regeln.

<a id="streamlit"></a>
### Streamlit

Ein Streamlit-Skript wird bei jeder Interaktion erneut ausgeführt, sodass das Gebietsschema bei jedem Durchlauf am Anfang des Skripts gewählt wird. Reihenfolge:

1. Lesen Sie den Selektorwert aus dem vorherigen Durchlauf, dann `?lang=`, dann das gespeicherte Gebietsschema.
2. Rufen Sie `set_locale` mit diesem Code auf, vor `st.set_page_config`.
3. Rufen Sie `st.set_page_config(page_title=t("…"))` auf.
4. Zeichnen Sie den Selektor. Bei Änderung speichern Sie den Code, setzen `?lang=` und `st.rerun()`.

Der Selektorwert gewinnt, sobald der Benutzer gewählt hat. `?lang=` gilt bei einem neuen Besuch, bevor dieser Wert existiert. Das Menü befindet sich in der App, nicht in `i18n.py`, sodass sein Label `t("Language")` sein kann. Zeigen Sie es auf jedem Bildschirm an, der wechseln soll, einschließlich einer Anmeldeseite.

<details>
<summary>Widget-Code</summary>

```python
import streamlit as st
from i18n import get_locale, get_ui_languages, set_locale, t


def apply_requested_locale() -> str:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows] or [get_locale()]
    requested = (
        st.session_state.get("lang_selector")
        or st.query_params.get("lang")
        or st.session_state.get("locale")
        or get_locale()
    )
    choice = requested if requested in codes else codes[0]
    set_locale(choice)
    st.session_state["locale"] = choice
    if st.query_params.get("lang") != choice:
        st.query_params["lang"] = choice
    return choice


def render_language_selector() -> None:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows]
    if len(codes) < 2:
        return
    labels = {str(row["code"]): str(row.get("label") or row["code"]) for row in rows}
    current = get_locale()
    choice = st.sidebar.selectbox(
        t("Language"),
        options=codes,
        index=codes.index(current),
        format_func=lambda code: labels.get(code, code),
        key="lang_selector",
    )
    if choice != current:
        st.session_state["locale"] = choice
        st.query_params["lang"] = choice
        set_locale(choice)
        st.rerun()


apply_requested_locale()
st.set_page_config(page_title=t("My app"))


def main() -> None:
    render_language_selector()
    st.write(t("Hello"))


main()
```

</details>

Ändern Sie `from i18n import …` in den Paketpfad aus [Helfer und Kataloge platzieren](#place-the-helper). Geben Sie jedem anderen Widget ein festes `key` und rufen Sie `t()` auf, wenn das Widget erstellt wird. Labels, die zur Importzeit berechnet werden, bleiben nach einem Wechsel in der Quellsprache. Wenn ein Seitentitel später verglichen wird, umschließen Sie beide Seiten: `nav.title != t("Forecast settings")`, da `nav.title` bereits übersetzt ist.

`streamlit_language_selector()` von `i18n.py` ist ausreichend für ein kurzes Skript, dessen Titel eine einfache Zeichenkette ist. Es ruft `set_locale` auf, wenn das Widget gezeichnet wird, sodass ein übersetztes `page_title` darüber für diesen Durchlauf in der vorherigen Sprache bleibt und sein Label Englisch bleibt. Siehe `examples/python-streamlit`.

<a id="fastapi-flask-and-tkinter"></a>
### FastAPI, Flask und Tkinter

<a id="choose-the-locale-for-a-request"></a>
#### Gebietsschema für eine Anfrage auswählen

Eine Web-App hat drei Quellen für die Sprache, in dieser Reihenfolge: die explizite Wahl des Besuchers (`?lang=`), das Cookie, das sie speichert, und der `Accept-Language`-Header des Browsers. Die Ausgangssprache ist der Fallback.

`set_locale` validiert oder normalisiert nicht, was ihm übergeben wird. Ein Browser, der `pt-br` oder `pt` sendet, würde stillschweigend die Ausgangssprache erhalten, da die Katalogdatei `pt-BR.json` ist. Das untenstehende Modul führt den Abgleich durch und ignoriert Codes, die nicht in `ui-languages.json` enthalten sind. Speichern Sie es neben `i18n.py` und importieren Sie es aus der Middleware oder dem Hook (verwenden Sie den Paketpfad, wenn `i18n.py` in einem Paket enthalten ist).

<details>
<summary>request_locale.py</summary>

```python
"""Choose the UI language for a request. Works with any web framework."""

from __future__ import annotations

from i18n import get_ui_languages


def _codes() -> list[str]:
    return [str(row["code"]) for row in get_ui_languages() if row.get("code")]


def source_locale() -> str:
    for row in get_ui_languages():
        if row.get("isSourceLocale"):
            return str(row["code"])
    return (_codes() or ["en"])[0]


def match(candidate: str | None) -> str | None:
    """Map "pt", "pt_br" or "PT-br" onto a language listed in ui-languages.json."""
    if not candidate:
        return None
    wanted = candidate.strip().replace("_", "-").lower()
    codes = _codes()
    for code in codes:
        if code.lower() == wanted:
            return code
    for code in codes:
        if code.lower().split("-")[0] == wanted.split("-")[0]:
            return code
    return None


def from_accept_language(header: str) -> str | None:
    ranked = []
    for part in header.split(","):
        code, _, params = part.strip().partition(";")
        quality = 1.0
        if params.strip().startswith("q="):
            try:
                quality = float(params.strip()[2:])
            except ValueError:
                quality = 0.0
        if code and code != "*" and quality > 0:
            ranked.append((quality, code))
    for _quality, code in sorted(ranked, key=lambda item: -item[0]):
        found = match(code)
        if found:
            return found
    return None


def pick(query: str | None, cookie: str | None, accept_language: str = "") -> str:
    """An explicit choice (?lang=, then the cookie) beats the browser header."""
    return match(query) or match(cookie) or from_accept_language(accept_language) or source_locale()
```

</details>

<a id="fastapi"></a>
#### FastAPI

Wählen Sie das Gebietsschema in der HTTP-Middleware. Behalten Sie das Token von `set_locale` und setzen Sie es in `finally` zurück, damit gleichzeitige Anfragen ihre eigene Sprache beibehalten. Die Middleware speichert auch das Cookie, wenn `?lang=` vorhanden ist, und sendet `Content-Language` und `Vary`, damit Caches eine Kopie pro Sprache behalten. Routen rufen `t()` und `_()` wie gewohnt auf. Fügen Sie für HTML-Seiten die Helfer einmal zur Template-Umgebung hinzu.

<details>
<summary>FastAPI-Middleware und -Templates</summary>

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = FastAPI()
templates = Jinja2Templates(directory="templates")
templates.env.globals.update(
    _=_, t=t, current_locale=get_locale, ui_languages=get_ui_languages, direction=get_direction
)


@app.middleware("http")
async def locale_middleware(request: Request, call_next):
    code = pick(
        request.query_params.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("accept-language", ""),
    )
    token = set_locale(code)
    try:
        response = await call_next(request)
        if request.query_params.get("lang"):
            response.set_cookie("lang", code, max_age=60 * 60 * 24 * 365, samesite="lax")
        response.headers["Content-Language"] = code
        response.headers.append("Vary", "Accept-Language, Cookie")
        return response
    finally:
        reset_locale(token)


@app.get("/greeting/{name}")
def greeting(name: str) -> JSONResponse:
    return JSONResponse({"message": t("Hello, {name}!", name=name), "locale": get_locale()})


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {"name": "Ada"})
```

</details>

Eine API, die nur JSON zurückgibt, benötigt kein Menü. Clients senden `Accept-Language` oder `?lang=`. Text, der nach der Rückgabe der Middleware erstellt wird, z. B. in einem Hintergrund-Task oder während eine Streaming-Antwort gesendet wird, kann nach dem Zurücksetzen ausgeführt werden. Erstellen Sie ihn, bevor Sie die Antwort zurückgeben.

<a id="flask"></a>
#### Flask

Flask hat einen Hook für jede Aufgabe. `before_request` wählt das Gebietsschema und behält das Token, `after_request` speichert das Cookie, `teardown_request` setzt das Gebietsschema zurück, und ein Kontextprozessor gibt den Templates `t`, `_`, `get_locale`, `get_ui_languages` und `get_direction`. Pyramid verwendet die gleiche Form mit einem `NewRequest`-Subscriber.

<details>
<summary>Flask-Hooks</summary>

```python
from flask import Flask, g, render_template, request

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = Flask(__name__)


@app.before_request
def choose_locale():
    g.locale = pick(
        request.args.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("Accept-Language", ""),
    )
    g.locale_token = set_locale(g.locale)


@app.after_request
def remember_locale(response):
    if request.args.get("lang"):
        response.set_cookie("lang", g.locale, max_age=60 * 60 * 24 * 365, samesite="Lax")
    response.headers["Content-Language"] = g.locale
    response.vary.add("Accept-Language")
    response.vary.add("Cookie")
    return response


@app.teardown_request
def clear_locale(_error):
    token = g.pop("locale_token", None)
    if token is not None:
        reset_locale(token)


@app.context_processor
def inject_i18n():
    return {
        "_": _,
        "t": t,
        "current_locale": get_locale,
        "ui_languages": get_ui_languages,
        "direction": get_direction,
    }


@app.get("/")
def home():
    return render_template("home.html", name="Ada")
```

</details>

<a id="the-language-menu-in-a-template"></a>
#### Das Sprachmenü in einem Template

FastAPI's `Jinja2Templates` und Flask rendern dies beide. Ein Link, der `?lang=` enthält, behält die Seite bei und setzt das Cookie, damit die Wahl auf späteren Seiten erhalten bleibt. Das `dir`-Attribut verwendet `get_direction()` für Sprachen, die von rechts nach links gelesen werden.

<details>
<summary>Template</summary>

```html
<!doctype html>
<html lang="{{ current_locale() }}" dir="{{ direction() }}">
  <body>
    <p>{{ t("Hello, {name}!", name=name) }}</p>
    <nav>
      {% for language in ui_languages() %}
        <a href="?lang={{ language.code }}"{% if language.code == current_locale() %} aria-current="true"{% endif %}>{{ language.label }}</a>
      {% endfor %}
    </nav>
  </body>
</html>
```

</details>

<a id="tkinter"></a>
#### Tkinter

Tkinter erstellt seine Widgets einmal, daher muss eine Sprachänderung sie aktualisieren. Schreiben Sie jeden sichtbaren Text als Funktion, die `t("…")` mit dem darin enthaltenen Literal aufruft, registrieren Sie das Widget mit dieser Funktion und rufen Sie `refresh()` nach `set_locale` auf. `extract` sieht immer noch jedes Literal. Speichern Sie den gewählten Code in der Einstellungsdatei der App und rufen Sie `set_locale` damit auf, bevor das Fenster erstellt wird.

<details>
<summary>Tkinter-Fenster mit Sprachmenü</summary>

```python
import tkinter as tk
from collections.abc import Callable
from tkinter import ttk

from i18n import get_locale, get_ui_languages, set_locale, t


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self._texts: list[tuple[tk.Misc, Callable[[], str]]] = []
        rows = [row for row in get_ui_languages() if row.get("code")]
        self._codes = [str(row["code"]) for row in rows]
        labels = [str(row.get("label") or row["code"]) for row in rows]
        self.language = ttk.Combobox(self, values=labels, state="readonly")
        self.language.current(self._codes.index(get_locale()))
        self.language.bind("<<ComboboxSelected>>", self._on_language)
        self.language.pack()
        self.greeting = ttk.Label(self)
        self.greeting.pack()
        self.bind_text(self.greeting, lambda: t("Hello, {name}!", name="Ada"))
        self.refresh()

    def bind_text(self, widget: tk.Misc, text: Callable[[], str]) -> None:
        self._texts.append((widget, text))

    def refresh(self) -> None:
        self.title(t("My app"))
        for widget, text in self._texts:
            widget.configure(text=text())

    def _on_language(self, _event: object) -> None:
        set_locale(self._codes[self.language.current()])
        self.refresh()
```

</details>

Ein neuer Thread startet in der Ausgangssprache, nicht in der des Fensters. Übersetzen Sie im Hauptthread oder rufen Sie `set_locale` am Anfang der Thread-Funktion auf. Andere Toolkits benötigen die gleichen Komponenten: eine Funktion, die jeden sichtbaren Text setzt, und einen Menü-Handler, der `set_locale` und dann diese Funktion aufruft. PyQt und PySide haben ihre eigenen Retranslate-Hooks; siehe [Gebietsschema in jedem Framework](/de/guide/ui-strings/python#locale-in-each-framework).

Das ist der letzte manuelle Schritt. Fahren Sie fort unter [Modelle auswählen und übersetzen](#choose-models-and-translate).

<a id="not-your-case"></a>
## Nicht Ihr Fall?

| Sie haben | Lesen Sie |
| --- | --- |
| Django, Flask-Babel-Kataloge oder eine App, die bereits GNU gettext verwendet | [i18n zu einer Django-/Python-gettext-App hinzufügen](/de/guide/add-i18n-to-django-gettext) |
| Eine JS/TS-App | [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) |
| Eine Website oder Dokumentationsseite | [i18n zu einer Website oder Dokumentationsseite hinzufügen](/de/guide/add-i18n-to-website) |
| Eine Repository-README oder andere Markdown-Dateien | [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme) |
| Verschachteltes Gebietsschema-JSON | [JSON](/de/guide/json) |

<a id="examples"></a>
## Beispiele

| Beispiel | Beschreibung |
| --- | --- |
| [python-streamlit](/de/examples#python-streamlit) | Dashboard, `t()` / `_()`, flaches JSON |
| [python-fastapi](/de/examples#python-fastapi) | Request-bezogene Locale, flaches JSON |
| [python-flask](/de/examples#python-flask) | Flask + Jinja, flaches JSON |

Kopieren Sie eine davon mit `npx degit`, oder laden Sie `ai-i18n-tools-python-examples.zip` vom GitHub Release herunter. Befehle: [Beispiele](/de/examples#python-examples). Für eine App, die gettext verwendet, siehe das [gettext-Beispiel](/de/examples#python-gettext).
