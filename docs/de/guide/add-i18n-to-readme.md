<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# Fügen Sie i18n zu Ihrer README und Ihren Markdown-Dokumenten hinzu

Diese Seite nimmt ein Repository auf GitHub, GitLab, Bitbucket oder einem anderen Host, dessen Leser bei `README.md` beginnen, und fügt eine Datei pro Sprache hinzu. Es gibt kein Dokumentations-Site-Framework zu konfigurieren. Das übliche Projekt hat auch eine App oder CLI, und die README sollte dieselben Sprachen und dieselben Produktbegriffe wie diese App verwenden. Ein Bibliotheks- oder reines Dokumentations-Repository ohne UI-Strings ist der andere Fall, der unten behandelt wird.

<a id="what-you-get"></a>

Das Tool belässt `README.md` an Ort und Stelle. Hosts rendern es weiterhin als Startseite des Repositorys. Jedes Zielsprachgebiet ist eine gleichgeordnete Datei wie `translated-docs/README.de.md`. Eine Sprachzeile innerhalb der README verknüpft diese Dateien miteinander, und dieselbe Zeile wird in jede Übersetzung geschrieben, mit Links, die von der Datei aus funktionieren, die der Leser gerade betrachtet. `translate-docs` füllt diese Zeile. Es ersetzt alles vom öffnenden bis zum schließenden Marker durch einen Link pro Sprachgebiet. Fügen Sie `CONTRIBUTING.md`, `CHANGELOG.md` oder einen `docs/`-Ordner zum selben Block hinzu, wenn diese Dateien ebenfalls übersetzt werden sollen. Siehe [Mehr als die README](#step-3-more-than-the-readme).

Der schnellste Weg ist, einem Coding-Agenten die Aufforderung auf dieser Seite zu geben. Er prüft die Konfiguration und fügt den Sprachlisten-Marker hinzu. Sie installieren die CLI, wählen den Anbieter und initialisieren das Projekt selbst, da dies Ihren API-Schlüssel und Ihre Entscheidungen erfordert. Sie führen die Übersetzung auch selbst aus, da sie Geld auf Ihrem Konto ausgibt.

Eine VitePress-, Docusaurus-, Starlight-, Nextra-, Fumadocs- oder Astro-Site verwendet [i18n zu einer Website oder Dokumentations-Site hinzufügen](/de/guide/add-i18n-to-website). Fügen Sie `--with-readme` hinzu, wenn die Repository-README ebenfalls übersetzt werden soll. Nicht sicher, was zutrifft? Siehe [Nicht Ihr Fall?](#not-your-case) am Ende.

Der Ablauf:

1. [Die CLI installieren und einen Anbieter auswählen](#install-and-choose-a-provider).
2. [Das Projekt initialisieren](#initialise-the-project) mit `init`.
3. [Den Agenten-Prompt ausführen](#run-the-agent-prompt).
4. [Das Ergebnis überprüfen](#review-the-result).
5. [Modelle auswählen und übersetzen](#choose-models-and-translate), dann eine Sprache überprüfen.
6. [Übersetzt halten](#keep-it-translated).

Sie möchten die Änderungen lieber selbst vornehmen oder möchten wissen, was der Prompt tut? [Manuell vorgehen](#do-it-by-hand) führt die gleichen Schritte einzeln durch.

<a id="install-and-choose-a-provider"></a>
## Installieren und einen Anbieter auswählen

Diesen Teil erledigen Sie, nicht der Agent. Der Installer ändert Ihre Maschine, und der API-Schlüssel ist ein Geheimnis, das in Ihre Shell gehört, nicht in einen Prompt.

Ein Repository mit einer `package.json` installiert das Paket als Entwicklungsabhängigkeit. Andere Installationsoptionen: [Installation](/de/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` und `yarn add --dev ai-i18n-tools` funktionieren auch.

Ein Repository ohne Node.js-Projekt kann die eigenständige ausführbare Datei verwenden. Linux und macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

Der Installer prüft `SHA256SUMS.txt`, installiert den Befehl als `ai-i18n-tools` und fügt ihn zu `PATH` hinzu. Die Binärdateien sind nicht notariell beglaubigt oder Authenticode-signiert. Manuelle Schritte und Asset-Namen: [Eigenständige ausführbare Dateien](/de/guide/installation#standalone-executables). `npx ai-i18n-tools` funktioniert auch, wenn Node.js installiert ist und Sie keine Projektabhängigkeit wünschen.

Installation überprüfen:

```bash
ai-i18n-tools --version
```

Wählen Sie dann einen Anbieter und legen Sie dessen API-Schlüssel in der Shell fest, die die Übersetzung ausführen wird. Zum Beispiel OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama benötigt keinen Schlüssel. Andere Voreinstellungen: [Integrierte Anbieter](/de/guide/providers-and-models#built-in-providers). Merken Sie sich den Anbieternamen, da Sie ihn im nächsten Schritt an `init` übergeben. Der Agent benötigt den Schlüssel nie: er führt nur Befehle aus, die keine Modellaufrufe tätigen. Sie verwenden den Schlüssel später, wenn Sie [übersetzen](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Projekt initialisieren

Sie führen dies einmal aus, bevor die Aufforderung erfolgt. Es schreibt die Konfiguration und verwendet den oben gewählten Anbieter. Es bearbeitet `README.md` nicht. Wenn die Konfiguration einen README-Block enthält, druckt es die einzufügende Markerzeile und warnt, wenn `README.md` fehlt.

| Sie haben | Gerüst | Dann |
| --- | --- | --- |
| Eine JS/TS-App plus eine README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, die Standardeinstellung) | [Fügen Sie i18n zu einer JS/TS-App hinzu](/de/guide/add-i18n-to-js) für `t()`, und diese Seite für die README |
| Eine Python-App plus eine README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [Fügen Sie i18n zu einer Python-App hinzu](/de/guide/add-i18n-to-python) für die App, und diese Seite für die README |
| Jede andere Vorlage, plus eine README | fügen Sie `--with-readme` zu diesem `init`-Befehl hinzu | Diese Seite für den README-Block |
| Nur README und Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | Diese Seite |

`--with-readme` ist ein No-Op bei `ui-markdown` und `docs-markdown`, da diese Vorlagen den README-Block bereits enthalten.

JS/TS-App und README (ein Befehl; `ui-markdown` ist die Standardvorlage):

```bash
ai-i18n-tools init -P openrouter
```

Python, Astro, einfaches HTML, VitePress, Docusaurus oder eine andere Vorlage, mit demselben hinzugefügten README-Block:

```bash
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

Nur README- und Markdown-Dateien:

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
```

Bearbeiten Sie dann `sourceLocale` und `targetLocales` in `ai-i18n-tools.config.json`. `sourceLocale` ist die Sprache, in der die README verfasst ist. Jede BCP-47-Sprache ist gültig. `features.translateDocs` muss wahr sein. Eine Hybridkonfiguration setzt auch `features.translateUIStrings`. `docs[].contentPaths` listet die zu übersetzenden Markdown-Dateien und -Ordner auf. Das Scaffold listet `README.md` auf.

Führen Sie `init` einmal aus. Es überschreibt `ai-i18n-tools.config.json` jedes Mal, sodass ein zweiter Lauf von Ihnen vorgenommene Änderungen verwirft. Eine bestehende Konfiguration bleibt unberührt, wenn Sie `init` überspringen: Die Aufforderung fügt den README-Block an, und [Schritt 1](#step-1-configure-the-docs-block) zeigt dieselbe Bearbeitung von Hand.

<a id="run-the-agent-prompt"></a>
## Agent-Prompt ausführen

Öffnen Sie das Projekt in Ihrem Coding-Agenten (Cursor, Claude Code, Copilot oder ähnliches), starten Sie einen neuen Chat und fügen Sie die folgende Aufforderung ein. Das Projekt muss bereits initialisiert sein. Es gibt nichts zu bearbeiten. Wenn andere Markdown-Dateien übersetzt werden sollen, nennen Sie diese in derselben Nachricht.

Der Agent prüft zuerst, ob die CLI und die Konfiguration existieren, und stoppt mit Anweisungen, wenn eines fehlt. Dann arbeitet er in zwei Teilen:

- Teil 1 fügt den flachen README-Block an, wenn die Konfiguration `README.md` noch nicht auflistet.
- Teil 2 fügt den Sprachlisten-Marker zur Quell-README hinzu.

Es installiert die CLI nicht, initialisiert die Konfiguration nicht, liest Ihren API-Schlüssel nicht, füllt die Sprachlinks nicht aus und übersetzt nicht. Die Übersetzung ist der Schritt nach der Überprüfung, und Sie führen sie aus.

````markdown
# Prepare README and Markdown translation

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user which command to run, then run this prompt again:

- JS/TS app plus a README: `ai-i18n-tools init -P <provider>`
- README and Markdown only: `ai-i18n-tools init -t docs-markdown -P <provider>`
- Any other template: `ai-i18n-tools init -t <template> -P <provider> --with-readme`

Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, rewrite, or shorten the source README or any other source
  Markdown. Do not edit anything under `translated-docs/` or other generated
  locale trees. Do not hand-edit locale JSON.
- Do not reformat unrelated files. Leave unrelated edits in a dirty tree alone.

## Part 1 — Config

Skip this part when one `docs` entry already lists `README.md`. Do not add a
second block for the same file.

Otherwise set `features.translateDocs` to true and append one `docs` entry:

- `contentPaths` includes `README.md`
- `outputDir` is `translated-docs`
- `addFrontmatter` is false
- `docsOutput.style` is `flat`
- `docsOutput.flatPreserveRelativeDir` is true
- `docsOutput.linkRewriteDocsRoot` is `.`
- `docsOutput.postProcessing.languageListBlock` uses start
  `<small id="lang-list">`, end `</small>`, separator ` · `

```json
{
  "contentPaths": ["README.md"],
  "outputDir": "translated-docs",
  "addFrontmatter": false,
  "docsOutput": {
    "style": "flat",
    "flatPreserveRelativeDir": true,
    "linkRewriteDocsRoot": ".",
    "postProcessing": {
      "languageListBlock": {
        "start": "<small id=\"lang-list\">",
        "end": "</small>",
        "separator": " · "
      }
    }
  }
}
```

Leave `features.translateUIStrings` as it is. Add other source files the user
named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## Part 2 — Language list

In `README.md`, where readers should see the other languages, add this marker
if it is not already there. A short label on the line above it is normal
prose. Add that label only when the spot has no heading of its own.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.
Markers inside fenced code blocks are ignored, so a config sample in the same
file does not match. Do not put the real marker inside a fence.

## Verify and report

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and
exactly one docs block lists `README.md`. The marker is in the source README
and not inside a fence. Nothing under `translated-docs/` changed.

Report the files changed and any Markdown file you left out of `contentPaths`,
with a one-line reason. Then list the commands for the user, and do not run
them: `ai-i18n-tools suggest-models` (optional), `ai-i18n-tools sync`.
````

<a id="review-the-result"></a>
## Ergebnis überprüfen

Der Agent schließt mit einem Bericht ab. Überprüfen Sie ihn, bevor Sie übersetzen:

- Der Diff. Es sollte die Konfiguration und der Marker sein. Der Quelltext sollte sich wie zuvor lesen lassen. `git diff --stat` zeigt an, wie viel sich geändert hat.
- Nichts unter `translated-docs/` oder einem anderen generierten Locale-Baum wurde bearbeitet.
- `ai-i18n-tools.config.json` parst, `features.translateDocs` ist wahr, und genau ein Docs-Block listet `README.md` auf.
- Der Marker ist in `README.md` und nicht innerhalb eines umzäunten Codeblocks. Ein Beispiel des Markers innerhalb eines umzäunten Codeblocks ist in Ordnung. Der eigentliche ist außerhalb.

<a id="choose-models-and-translate"></a>
## Modelle auswählen und übersetzen

Diesen Teil führen Sie aus. Er verwendet Ihren API-Schlüssel und verbraucht Guthaben auf Ihrem Konto.

Die Modellliste von `init` ist ein Ausgangspunkt. Bewerten Sie die Chat-Modelle des aktiven Anbieters und schreiben Sie die Auswahl in `translationModels`, sobald die engere Auswahl korrekt aussieht:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ersetzt nur `translationModels`. Dieselbe Rangfolge finden Sie auf der Registerkarte [Modelle](/de/guide/translation-dashboard/models) von `ai-i18n-tools dashboard`.

Dann übersetzen:

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` führt die aktivierten Schritte der Reihe nach aus: `extract` und `translate-ui`, wenn UI-Strings aktiviert sind, dann `translate-docs`. Ein Cache wird gemeinsam genutzt, sodass ein bereits für die App übersetzter Satz wiederverwendet wird, wenn er in der README auftaucht. UI-Kataloge werden auch als Glossarhinweise an die Dokumentübersetzung übergeben (`ui[].uiGlossary`, standardmäßig aktiviert), was die Konsistenz von Schaltflächen- und Funktionsnamen gewährleistet. Siehe [Glossar](/de/guide/glossary).

Sprachnamen in der Zeile stammen aus `ui-languages.json`, die `extract` neben dem UI-Katalog schreibt. Eine reine README-Konfiguration hat keinen UI-Katalog, daher verwendet die Zeile stattdessen die gebündelte Sprachliste. Die Bezeichnungen sind immer noch die nativen Namen. Führen Sie `generate-ui-languages` nur aus, wenn Sie ein eigenes Projektmanifest wünschen.

Committen Sie `translated-docs/` und öffnen Sie die übersetzte README auf dem Host. Relative Links zwischen der Quell-README und `translated-docs/README.de.md` werden für jede Datei neu geschrieben.

<a id="check-one-language"></a>
### Eine Sprache prüfen

Öffnen Sie `translated-docs/README.de.md` (oder welchen Zielcode Sie gewählt haben) auf dem Host und in der Datei selbst. Die Sprachzeile sollte jedes Gebietsschema auflisten, mit Links, die von der Datei aus funktionieren, die Sie gerade betrachten. Ein Satz, der noch in der Ausgangssprache war, befand sich innerhalb eines Code-Fences, einer URL oder eines Überschriftenankers, oder er war nicht in `contentPaths`.

<a id="keep-it-translated"></a>
## Übersetzt halten

Führen Sie `ai-i18n-tools sync` erneut aus, nachdem sich die Quell-README oder die App-Strings geändert haben. Der Cache sendet nur neuen oder geänderten Text an das Modell. Committen Sie die aktualisierten Dateien unter `translated-docs/`. `ai-i18n-tools dashboard` öffnet das [Übersetzungs-Dashboard](/de/guide/translation-dashboard/), um Übersetzungen zu überprüfen.

Der untenstehende Workflow ist ein Beispiel, keine veröffentlichte Aktion. Er installiert die CLI und führt `sync` aus, wenn sich `README.md` ändert. Speichern Sie den Provider-Schlüssel als Repository-Geheimnis. Überprüfen Sie den `translated-docs/`-Diff und committen Sie ihn, oder pushen Sie ihn auf einen Branch und öffnen Sie einen Pull Request.

```yaml
name: Translate README
on:
  push:
    paths:
      - "README.md"
      - "ai-i18n-tools.config.json"
  workflow_dispatch:
jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm install --save-dev ai-i18n-tools
      - run: npx ai-i18n-tools sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

Verwenden Sie die Umgebungsvariable für den von Ihnen konfigurierten Provider. Ollama funktioniert nicht auf einem gehosteten Runner, es sei denn, Sie installieren es dort.

<a id="hybrid-tips"></a>
### Hybrid-Tipps

- Übersetzen Sie die README mit `docs[].targetLocales` in weniger Sprachen als die App. Siehe [Weniger Gebietsschemas für Dokumente](/de/guide/combining-pipelines#fewer-locales-for-documents).
- Fügen Sie Produktbegriffe in `glossary.userGlossary` ein. Dieselbe CSV-Datei wird für UI-Strings und für die README verwendet.
- Führen Sie nur eine Seite mit `ai-i18n-tools sync --no-docs` oder `ai-i18n-tools sync --no-ui` aus.

<a id="say-that-the-translation-is-automatic"></a>
### Hinweis auf automatische Übersetzung

KI-Übersetzungen können falsch sein. Ein kurzer Hinweis am Ende der README-Datei, wie der in der [README dieses Repositorys](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md), informiert die Leser darüber, dass die anderen Sprachen maschinell übersetzt wurden und überprüft werden sollten, bevor man sich auf sie verlässt.

<a id="do-it-by-hand"></a>
## Manuell vorgehen

Gehen Sie diese Schritte durch, wenn Sie die Änderungen lieber selbst vornehmen möchten oder wenn Sie wissen möchten, was der Prompt tut. Die ersten beiden entsprechen den Teilen des Prompts. Die letzten beiden sind für zusätzliche Dateien und für Links, die auf eine veröffentlichte Website verweisen. Sie [installieren die CLI](#install-and-choose-a-provider), [initialisieren das Projekt](#initialise-the-project) und [übersetzen](#choose-models-and-translate) am Ende trotzdem.

1. [Den Docs-Block konfigurieren](#step-1-configure-the-docs-block).
2. [Die Sprachliste hinzufügen](#step-2-add-the-language-list).
3. [Mehr als die README](#step-3-more-than-the-readme).
4. [Links auf dem Host](#step-4-links-on-the-host).

<a id="step-1-configure-the-docs-block"></a>
## Schritt 1: Den Docs-Block konfigurieren

Vier Schlüssel sind wichtig:

- `sourceLocale`: die Sprache, in der die README verfasst ist. Jede Sprache ist gültig. Englisch ist ein gängiges Beispiel in dieser Anleitung.
- `targetLocales`: die hinzuzufügenden Sprachen.
- `features.translateDocs`: muss wahr sein. Eine Hybrid-Konfiguration setzt auch `features.translateUIStrings`.
- `docs[].contentPaths`: die zu übersetzenden Markdown-Dateien und -Ordner. Das Grundgerüst listet `README.md`.

Überspringen Sie diesen Schritt, wenn `init` den README-Block bereits geschrieben hat. Verwenden Sie ihn, wenn Sie eine bereits vorhandene Konfiguration bearbeiten.

<details>
<summary>Hybrid: UI-Strings und die README</summary>

`ui-markdown` schreibt diese Form. `ui` ist der App-Katalog. Der Eintrag `docs` ist die README.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": ".",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

</details>

<details>
<summary>Nur README und Markdown</summary>

`docs-markdown` schaltet UI-Strings aus und behält den gleichen README-Block bei.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": false,
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": "."
      }
    }
  ]
}
```

Die Einstellungen für die Sprachliste sind die gleichen wie im Hybridbeispiel. Sie werden hier nur weggelassen, um das Snippet kurz zu halten. `init -t docs-markdown` schreibt sie.

</details>

<a id="add-the-block-to-a-config-you-already-have"></a>
### Den Block zu einer bestehenden Konfiguration hinzufügen

Fügen Sie das Objekt `docs` aus dem Hybridbeispiel an und setzen Sie `features.translateDocs` auf `true`. Wenn die Konfiguration bereits ein Array `docs` enthält (z. B. eine VitePress- oder Docusaurus-Site), fügen Sie das README-Objekt als zweiten Eintrag an. `sync` führt jeden Block aus. [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) macht dies: ein Block für die Dokumentationsseite, ein flacher Block für `README.md`.

Fügen Sie keinen zweiten Block hinzu, wenn bereits einer `README.md` auflistet.

<a id="step-2-add-the-language-list"></a>
## Schritt 2: Die Sprachliste hinzufügen

Fügen Sie diese Zeile in `README.md` ein, wo Leser die anderen Sprachen sehen sollen. Ein kurzes Label in der Zeile darüber ist normaler Text und wird übersetzt.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Die Zeile kann leer sein. `translate-docs` ersetzt alles vom öffnenden bis zum schließenden Marker durch einen Link pro Gebietsschema. Marker innerhalb von Codeblöcken werden ignoriert, sodass ein Konfigurationsbeispiel in derselben Datei nicht übereinstimmt. Details: [Sprachumschalter](/de/guide/documents/language-switcher).

<a id="step-3-more-than-the-readme"></a>
## Schritt 3: Mehr als die README

Fügen Sie Pfade zu `contentPaths` hinzu. `flatPreserveRelativeDir` behält Ordner bei, sodass `docs/guide.md` zu `translated-docs/docs/guide.de.md` wird, anstatt mit einem anderen `guide.md` zu kollidieren.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

Eine `.translate-ignore`-Datei überspringt Pfade, die Sie nicht übersetzen möchten. `init --with-translate-ignore` schreibt einen Starter. Codeblöcke, URLs und Überschriftenanker werden nicht übersetzt. Siehe [Ausgabelayouts](/de/guide/documents/output-layouts), [Ankerlinks](/de/guide/documents/anchor-links) und [Link-Umschreibung](/de/guide/documents/link-rewriting).

Screenshots, die sich je nach Sprache unterscheiden: [Bilder und Screenshots](/de/guide/images-and-screenshots/).

<a id="step-4-links-on-the-host"></a>
## Schritt 4: Links auf dem Host

Links zu anderen Dateien im Repository werden auf die Lokalisierungsdatei umgeschrieben. Ein Link zu einer veröffentlichten Dokumentationsseite wird nicht umgeschrieben. Dieses Repository versieht seine Dokumentations-Site-URLs mit dem Gebietsschema unter Verwendung von `regexAdjustments`:

```json
"regexAdjustments": [
  {
    "search": "https://wsj-br\\.github\\.io/ai-i18n-tools/",
    "replace": "https://wsj-br.github.io/ai-i18n-tools/${translatedLocale}/"
  }
]
```

Der Flat-Link-Rewriter wird zuerst ausgeführt, dann diese Ersetzungen. Siehe [Link-Umschreibung](/de/guide/documents/link-rewriting).

Das ist der letzte manuelle Schritt. Fahren Sie fort unter [Modelle auswählen und übersetzen](#choose-models-and-translate).

<a id="not-your-case"></a>
## Nicht Ihr Fall?

| Sie haben | Lesen Sie |
| --- | --- |
| App-UI-Strings und keine README zum Übersetzen | [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) oder [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python) |
| Django, Flask-Babel-Kataloge oder eine App, die bereits GNU gettext verwendet | [i18n zu einer Django-/Python-gettext-App hinzufügen](/de/guide/add-i18n-to-django-gettext) |
| Eine VitePress-, Docusaurus-, Starlight-, Nextra-, Fumadocs- oder Astro-Site | [i18n zu einer Website oder Dokumentations-Site hinzufügen](/de/guide/add-i18n-to-website). Fügen Sie `--with-readme` hinzu, wenn die Repository-README ebenfalls übersetzt werden soll |
| Eine HTML-Datei pro Gebietsschema | [HTML-Seiten](/de/guide/documents/html-pages) |
| Die vollständige `translate-docs`-Referenz | [Dokumente](/de/guide/documents/) |

<a id="examples"></a>
## Beispiele

| Projekt | Was es zeigt |
| --- | --- |
| [console-app](/de/examples#console-app) | Eine kleine Node-App plus ein flacher README-Block |
| [nextjs-app](/de/examples#nextjs-app) | UI-Strings, eine Docs-Site und ein separater flacher README-Block |
| Dieses Repository | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): flacher README-Block, dann die VitePress-Site |
