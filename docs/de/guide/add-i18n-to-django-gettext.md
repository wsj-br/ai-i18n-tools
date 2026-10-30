<a id="add-i18n-to-a-django--python-gettext-app"></a>
# i18n zu einer Django-/Python-gettext-App hinzufügen

Diese Seite ist für eine Python-Anwendung, die mit GNU gettext übersetzt wird oder dies tun wird: Django, Flask mit Flask-Babel-ähnlichen Katalogen oder jede App, die `gettext()` aufruft. Sie behalten die gettext-Aufrufe bei. ai-i18n-tools liest sie, übersetzt die Nachrichten und schreibt die `.po`- und kompilierten `.mo`-Dateien, die Ihre App bereits lädt. Es wird kein Hilfsmodul benötigt.

Der schnellste Weg ist, einem Coding-Agenten den Prompt auf dieser Seite zu geben. Er richtet die Konfiguration ein, umschließt Ihre Zeichenketten, prüft das Ergebnis und kann einen Sprachumschalter hinzufügen. Sie installieren die CLI, wählen den Anbieter und initialisieren das Projekt selbst, da dies Ihren API-Schlüssel und Ihre Entscheidungen erfordert. Sie führen die Übersetzung auch selbst aus, da dies Kosten auf Ihrem Konto verursacht und Ihre `.po`- und `.mo`-Dateien neu schreibt.

Sie entwickeln eine Streamlit-, FastAPI-, Flask-, Desktop- oder Skript-App, die heute noch kein gettext verwendet? Verwenden Sie stattdessen [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python). Es fügt einen kleinen `i18n.py`-Helfer hinzu und schreibt JSON-Kataloge. Nicht sicher, was zutrifft? Siehe [Nicht Ihr Fall?](#not-your-case) am Ende.

Der Ablauf:

1. [CLI installieren und einen Anbieter auswählen](#install-and-choose-a-provider).
2. [Projekt initialisieren](#initialise-the-project) mit `init`.
3. [Agent-Prompt ausführen](#run-the-agent-prompt).
4. [Ergebnis überprüfen](#review-the-result).
5. [Modelle auswählen und übersetzen](#translate), dann eine Sprache überprüfen.
6. [Die Übersetzung aktuell halten](#keep-it-translated).

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

Ollama benötigt keinen Schlüssel. Weitere Voreinstellungen: [Integrierte Anbieter](/de/guide/providers-and-models#built-in-providers). Beachten Sie den Anbieternamen, da Sie ihn im nächsten Schritt an `init` übergeben. Der Agent benötigt den Schlüssel nie: Er führt nur Befehle aus, die keine Modellaufrufe tätigen. Sie verwenden den Schlüssel später, wenn Sie [übersetzen](#translate).

<a id="initialise-the-project"></a>
## Projekt initialisieren

Sie führen dies einmal vor dem Prompt aus. Es schreibt die Konfiguration und verwendet den oben ausgewählten Anbieter. Wählen Sie die Vorlage, die zu Ihrer App passt:

| Ihre App | Vorlage | Kataloge, die es schreibt |
| --- | --- | --- |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` und `.mo` |
| Flask mit Flask-Babel-ähnlichen Katalogen | `ui-python-flask` | `translations/<lang>/LC_MESSAGES/messages.po` und `.mo` |
| Jede andere Python-App, die bereits GNU gettext verwendet | `ui-python-gettext` | `locales/<lang>/LC_MESSAGES/messages.po` und `.mo` |

Führen Sie init mit dem Vorlagennamen und dem von Ihnen gewählten Anbieter aus:

```bash
ai-i18n-tools init -t ui-python-django -P cheaperinference
```

Führen Sie `init` einmal aus. Es überschreibt `ai-i18n-tools.config.json` jedes Mal, sodass ein zweiter Durchlauf von Ihnen vorgenommene Änderungen verwirft. Wenn die Konfiguration bereits existiert und angepasst wurde, überspringen Sie `init` und bearbeiten Sie die Konfiguration.

`ui-python-gettext` und `ui-python-flask` schreiben auch einen `i18n.py`-Helfer, wenn diese Datei fehlt. Eine gettext-Anwendung benötigt ihn nicht, löschen Sie ihn daher (der Prompt erledigt dies für Sie). `ui-python-gettext` schreibt auch JSON-Dateien neben die gettext-Kataloge. Um nur gettext-Kataloge zu schreiben, setzen Sie `"flatOutput": false` im `ui`-Block (der Prompt erledigt dies auch). `ui-python-django` schreibt weder den Helfer noch JSON, da Django sein eigenes Übersetzungssystem verwendet.

Bearbeiten Sie dann `sourceLocale` und `targetLocales` in `ai-i18n-tools.config.json`. `sourceLocale` ist die Sprache der Zeichenketten in Ihrem Code. Jede BCP-47-Sprache ist gültig; Beispiele verwenden oft `en`. Schreiben Sie Zielcodes als `pt-BR`. Der Katalogordner ist `pt_BR`, das Format, das gettext und Django erwarten (`localeFormat` ist `posix`).

<a id="run-the-agent-prompt"></a>
## Agent-Prompt ausführen

Öffnen Sie das Projekt in Ihrem Coding-Agenten (Cursor, Claude Code, Copilot oder Ähnliches), starten Sie einen neuen Chat und fügen Sie den untenstehenden Prompt ein. Das Projekt muss bereits initialisiert sein. Es gibt nichts zu bearbeiten. Wenn Sie etwas weglassen möchten, zum Beispiel keinen Sprachumschalter, teilen Sie dies in derselben Nachricht mit.

Der Agent prüft zuerst, ob die CLI und die Konfiguration existieren, und hält mit Anweisungen an, falls eine davon fehlt. Dann arbeitet er in vier Teilen:

- Teil 1 passt die Konfiguration an Ihre bestehenden Kataloge an und entfernt die `i18n.py`, die einige Vorlagen schreiben.
- Teil 2 umschließt die benutzersichtbaren Zeichenketten mit den gettext-Aufrufen, die Sie bereits verwenden, und den Template-Tags.
- Teil 3 führt `extract` aus und findet Aufrufe, die vor der Suche formatieren.
- Teil 4 fügt den Sprachumschalter hinzu.

Es installiert oder initialisiert nichts, liest Ihren API-Schlüssel nicht und übersetzt nicht. Es führt `makemessages` oder `compilemessages` nicht aus und lässt Ihre `.po`- und `.mo`-Dateien unberührt. Die Übersetzung ist der Schritt nach der Überprüfung, und Sie führen sie aus.

<details class="agent-prompt">
<summary>Agent-Prompt: Sprachen zu einer Django- oder gettext-Anwendung hinzufügen</summary>

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
## Ergebnis überprüfen

Der Agent schließt mit einem Bericht ab. Überprüfen Sie ihn, bevor Sie übersetzen:

- Der Diff. Nur umhüllte Aufrufe, Template-Tags, die Konfiguration und der Sprachumschalter sollten sich geändert haben. Ihre `.po`- und `.mo`-Dateien sollten unberührt bleiben, bis Sie übersetzen.
- `ai-i18n-tools.config.json`: `gettext.outputDir` und `domain` verweisen auf die Kataloge, die Ihre Anwendung lädt, und `sourceRoots` deckt den Anwendungscode ab.
- `ai-i18n-tools extract` listet die neuen Nachrichten auf und behält die Übersetzungen bei, die sich bereits in Ihren `.po`-Dateien befinden.
- Der Probelauf von `migrate-python-i18n` listet nichts auf, was noch zu beheben wäre.
- Die Django-Prüfungen und Ihre Tests bestehen, und die Anwendung sieht in der Ausgangssprache gleich aus.
- Die übersprungenen Zeichenketten und mehrdeutigen Fälle im Bericht: Pluralformen, die als eine Zeichenkette belassen wurden, ein Wort mit zwei Bedeutungen und Sätze, die aus übersetzten Teilen aufgebaut sind. Entscheiden Sie diese manuell.

Committen Sie diesen Zustand. `translate-ui` überschreibt Ihre `.po`-Dateien, daher möchten Sie einen sauberen Diff zur Überprüfung haben.

<a id="choose-models-and-translate"></a>
## Modelle auswählen und übersetzen

Sie führen diesen Teil aus. Er verwendet Ihren API-Schlüssel, gibt Geld auf Ihrem Konto aus und überschreibt Ihre `.po`-Dateien, committen Sie daher zuerst.

Die Modellliste von `init` ist ein Ausgangspunkt. Bewerten Sie die Chat-Modelle des aktiven Anbieters und schreiben Sie die Auswahl in `translationModels`, sobald die engere Auswahl korrekt aussieht:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ersetzt nur `translationModels`. Die gleiche Rangfolge finden Sie auf der Registerkarte [Modelle](/de/guide/translation-dashboard/models). Übersetzen Sie dann:

```bash
ai-i18n-tools translate-ui
```

`translate-ui` schreibt die `.pot`-Vorlage, eine `.po` pro Ziellokale, und die kompilierte `.mo`. Lassen Sie diese Dateien von nun an unbearbeitet, da der nächste Durchlauf sie neu generiert. Überprüfen Sie den ersten Diff, bevor Sie ihn committen.

Starten Sie den Server neu, wenn er die neuen `.mo`-Dateien nicht übernimmt.

<a id="check-one-language"></a>
### Eine Sprache überprüfen

Wechseln Sie zu einer Zielsprache und sehen Sie sich eine Seite mit einigen umhüllten Zeichenketten an. Texte, die immer noch die Ausgangssprache anzeigen, wurden nicht umhüllt, oder die `.mo` wurde nicht neu geladen. Texte, die `%(name)s` in der Ausgabe anzeigen, haben ihr Wörterbuch verloren. Überprüfen Sie die Platzhalter in der `.po`-Datei.

<a id="keep-it-translated"></a>
## Übersetzt halten

`ai-i18n-tools sync` (oder zuerst `extract` und dann `translate-ui`) erneut ausführen, nachdem der Quelltext geändert wurde. Der Cache sorgt dafür, dass nur neue oder geänderte Zeichenfolgen an das Modell gesendet werden. Führen Sie es in CI aus, damit Übersetzungen nicht abweichen. `ai-i18n-tools dashboard` öffnet das [Übersetzungs-Dashboard](/de/guide/translation-dashboard/), um Übersetzungen zu überprüfen.

`purge-locale` entfernt die `.po` und `.mo` eines Gebietsschemas. Committen Sie die `.po`-Dateien. Committen Sie auch die `.mo`-Dateien, es sei denn, Ihr Build kompiliert sie.

Um `README.md` im selben Durchlauf zu übersetzen, erstellen Sie ein Gerüst mit `--with-readme` (oder fügen Sie den Block zu einer bestehenden Konfiguration hinzu). Siehe [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Machen Sie es manuell

Arbeiten Sie diese Schritte durch, wenn Sie die Änderungen lieber selbst vornehmen möchten oder wissen wollen, was die Eingabeaufforderung tut. Jeder Schritt entspricht einem Teil der Eingabeaufforderung. Sie [installieren die CLI](#install-and-choose-a-provider), [initialisieren das Projekt](#initialise-the-project) und [übersetzen](#translate) am Ende trotzdem.

1. [Richten Sie die Konfiguration auf Ihre Kataloge aus](#point-the-config).
2. [Umschließen Sie Zeichenketten](#wrap-strings) mit den bereits verwendeten gettext-Aufrufen.
3. [Extrahieren und überprüfen Sie die Aufrufe](#extract-and-check).
4. [Sprache zur Laufzeit wechseln](#switch-language).

<a id="step-1-point-the-config-at-your-catalogs"></a>
## Schritt 1: Konfiguration auf Ihre Kataloge ausrichten

Die Vorlage schreibt sinnvolle Standardwerte. Dies ist der Django-Standard:

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

Überprüfen Sie vier Punkte in Bezug auf Ihr Projekt:

- `gettext.outputDir` und `potPath` sind die Orte, an denen Ihre Kataloge bereits liegen. Django: der Ordner in `LOCALE_PATHS` oder der `locale/`-Ordner innerhalb einer App. Flask-Babel: `translations/`.
- `gettext.domain` ist der Dateiname, den Ihre App lädt. Django verwendet `django`. Flask-Babel verwendet `messages`. Für reines gettext ist es die Domäne in Ihrem `gettext.translation(...)`-Aufruf.
- `sourceRoots` listet die Ordner auf, die `extract` scannt. Schränken Sie es von `"."` auf Ihren Anwendungscode ein, damit Tests und Skripte nicht im Katalog landen.
- `stringsJson` ist der Extraktions-Cache, eine Datei, die diesem Tool gehört. Bewahren Sie sie neben den Katalogen auf. Es ist keine Laufzeitdatei. Ihre App liest sie nie.

Wenn jede Django-App ihren eigenen `locale/`-Ordner behält, verwenden Sie einen `ui`-Block pro Katalogbaum. `ui` akzeptiert eine Liste, und `--ui-block` führt einen Block aus. Pfade müssen über Blöcke hinweg eindeutig sein. Siehe [Konfiguration](/de/reference/configuration).

`ingestExistingPo` ist standardmäßig aktiviert. Während `extract` füllen Übersetzungen, die sich bereits in Ihren `.po`-Dateien befinden, leere Felder. Eine bereits gesetzte Übersetzung wird nicht ersetzt. Committen Sie Ihre Kataloge vor dem ersten `translate-ui`, da es die `.po`-Dateien neu schreibt und die `.mo`-Dateien kompiliert. Überprüfen Sie diesen Diff.

`compileMo` schreibt die `.mo` für Sie, sodass Sie `compilemessages` in diesem Workflow nicht benötigen. Wählen Sie ein Tool zum Schreiben der Kataloge: Das Ausführen von `makemessages` nach `translate-ui` schreibt dieselben `.po`-Dateien neu.

<a id="step-2-wrap-strings"></a>
## Schritt 2: Zeichenketten umschließen

`extract` erfasst eine Zeichenkette nur, wenn es sich um ein Literal handelt, das an einen der Funktionsnamen in `ui.uiExtractor.funcNames` oder an ein Template-Tag übergeben wird. Behalten Sie die vorhandenen Aufrufe bei. Fügen Sie hinzu, was fehlt.

Python-Code:

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

Platzhalter verwenden `%(name)s`. Übergeben Sie die Werte nach dem Nachschlagen mit `%`, niemals davor. Modelle, Formulare und Einstellungen werden beim Import des Moduls ausgeführt, daher verwenden sie die Lazy-Form. Wenden Sie `%` zur Importzeit nicht auf eine Lazy-Zeichenkette an. Verwenden Sie stattdessen `format_lazy`.

Templates (Django `{% load i18n %}` oder Jinja in Flask):

```jinja
{% load i18n %}
<h1>{% translate "Welcome back" %}</h1>
{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}
```

`{% translate %}`, `{% trans %}`, `{% blocktranslate %}` und `{% blocktrans %}` werden eigenständig gesammelt. Eine Template-Variable wie <code v-pre>{{ name }}</code> wird als `%(name)s` gespeichert. Behalten Sie diese Form bei.

Namen, die `extract` nicht kennt, werden übersprungen. Die Standardliste ist `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext` und `self.tr`. Wenn der Code `gettext_lazy("…")`, `ngettext_lazy`, `pgettext_lazy`, `npgettext` oder `gettext_noop` direkt aufruft, fügen Sie diese Namen zu `ui.uiExtractor.funcNames` hinzu. Wenn Sie die Lazy-Funktion als `_` importieren, wie in `gettext_lazy as _`, ist der Name `_` bereits abgedeckt.

Umschließen Sie Text, den eine Person sieht: Beschriftungen, Überschriften, Nachrichten, Formular- und Modelltext, E-Mails. Lassen Sie Bezeichner, URLs, Feldnamen, Einstellungsschlüssel, Log-Nachrichten und Migrationen unverändert. Formulieren Sie den Quelltext nicht um. Eine fehlende Übersetzung gibt den Quellsatz zurück, sodass die App in der Ausgangssprache gleich aussieht.

Diese Aufrufe werten die Formatierung vor dem Nachschlagen aus, sodass die Zeichenkette niemals einem Katalogeintrag entspricht:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="step-3-extract-and-check-the-calls"></a>
## Schritt 3: Aufrufe extrahieren und prüfen

Führen Sie `extract` aus, sobald die Aufrufe umhüllt sind. Es schreibt den Extraktions-Cache und füllt leere Slots aus Ihren bestehenden `.po`-Dateien. Es ruft kein Modell auf.

```bash
ai-i18n-tools extract
```

Suchen Sie dann nach Aufrufen, die vor dem Nachschlagen formatieren. `migrate-python-i18n` findet sie. Führen Sie es ohne `--write` aus:

```bash
ai-i18n-tools migrate-python-i18n
```

Es schreibt `migrate-python-i18n-report.md`. Lesen Sie es und korrigieren Sie jeden aufgelisteten Aufruf manuell mit `%(name)s` und einem Wörterbuch. Löschen Sie den Bericht oder ignorieren Sie ihn mit Git.

Übergeben Sie `--write` auf dieser Seite nicht. Diese Option schreibt einen f-String oder einen `.format()`-Aufruf in `t("…", name=name)` um, einen Aufruf, der nur im `i18n.py`-Helfer existiert. Eine gettext-App hat kein `t`. Ein Bericht ohne Zeilen bedeutet, dass die umhüllten Aufrufe sicher sind. Das bedeutet nicht, dass jeder Satz umhüllt wurde, lesen Sie also den Diff von `strings.json` und suchen Sie nach Text, den Sie erwartet haben.

<a id="step-4-switch-language-at-runtime"></a>
## Schritt 4: Sprache zur Laufzeit wechseln

Ihr Framework wählt die Sprache. ai-i18n-tools fügt kein Menü oder einen Helfer hinzu.

<a id="django"></a>
### Django

In `settings.py`:

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

`LocaleMiddleware` kommt nach der Session-Middleware und vor `CommonMiddleware`. `LANGUAGE_CODE` ist die Ausgangssprache. `LANGUAGES` listet die Sprachen auf, die ein Besucher auswählen kann. `LOCALE_PATHS` verweist auf den Ordner, in den `gettext.outputDir` schreibt, es sei denn, jede App behält ihren eigenen `locale/`-Ordner.

Fügen Sie die Sprachwechselansicht von Django zu `urls.py` hinzu:

```python
from django.urls import include, path

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    # ...
]
```

Fügen Sie dann ein Formular zu einem Template hinzu:

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

Die Ansicht speichert die Auswahl in einem Cookie. Um die Sprache stattdessen in die URL zu setzen, verwenden Sie `i18n_patterns`. Beides sind Standard-Django-Funktionen. Siehe Djangos Dokumentation zur Internationalisierung.

<a id="plain-gettext-and-flask-babel"></a>
### Einfaches gettext und Flask-Babel

Laden Sie den Katalog für die gewünschte Sprache und rufen Sie ihn auf. Das [python-gettext](/de/examples#python-gettext)-Beispiel macht dies in einem Befehlszeilentool:

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

Konvertieren Sie `pt-BR` in `pt_BR`, den Ordnernamen, den `translate-ui` geschrieben hat. Behalten Sie `fallback=True`, damit ein fehlender Katalog den Quelltext anzeigt. In einer Web-App erstellen Sie das Übersetzungsobjekt pro Anfrage und installieren es nicht global mit `gettext.install`, da sonst gleichzeitige Anfragen eine Sprache teilen würden. In Flask-Babel geben Sie den Code Ihrer Locale-Selektorfunktion zurück und behalten `translations/` als dessen Übersetzungsverzeichnis bei.

Das ist der letzte manuelle Schritt. Fahren Sie fort bei [Modelle auswählen und übersetzen](#translate).

<a id="not-your-case"></a>
## Nicht Ihr Fall?

| Sie haben | Lesen Sie |
| --- | --- |
| Eine Streamlit-, FastAPI-, Flask-, Desktop- oder Skript-App ohne gettext | [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python) |
| Eine JS/TS-App | [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) |
| Eine Website oder Dokumentationsseite | [i18n zu einer Website oder Dokumentationsseite hinzufügen](/de/guide/add-i18n-to-website) |
| Eine Repository-README oder andere Markdown-Dateien | [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Beispiele

| Beispiel | Was es zeigt |
| --- | --- |
| [python-gettext](/de/examples#python-gettext) | Ein bestehendes gettext-Befehlszeilentool; `translate-ui` aktualisiert `.po` und `.mo` |

Es gibt kein Django-Beispielverzeichnis. Das `python-gettext`-Beispiel zeigt die gleiche Konfigurationsform mit Domäne `messages`. Kopieren Sie es mit `npx degit`, oder laden Sie `ai-i18n-tools-python-examples.zip` vom GitHub Release herunter. Befehle: [Beispiele](/de/examples#python-examples).
