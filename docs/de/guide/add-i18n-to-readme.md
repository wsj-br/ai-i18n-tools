<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# Fügen Sie i18n zu Ihrer README und Ihren Markdown-Dokumenten hinzu

Diese Seite ist für ein Repository auf GitHub, GitLab, Bitbucket oder einem anderen Host, dessen Leser von `README.md` und einigen anderen Markdown-Dateien ausgehen. Es gibt kein zu konfigurierendes Dokumentations-Site-Framework. Das übliche Projekt hat auch eine App oder CLI, und die README sollte dieselben Sprachen und dieselben Produktbegriffe wie diese App verwenden. Ein Bibliotheks- oder reines Dokumentations-Repository ohne UI-Strings ist der andere Fall, der unten behandelt wird.

Das Tool belässt `README.md` an Ort und Stelle und schreibt eine Locale-Datei pro Sprache, zum Beispiel `translated-docs/README.de.md`. Eine Sprachzeile innerhalb der README verknüpft diese Dateien miteinander.

<a id="which-setup-are-you-in"></a>
## Welches Setup verwenden Sie?

| Sie haben | Gerüst | Dann |
| --- | --- | --- |
| Eine JS/TS-App plus eine README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, die Standardeinstellung) | [Fügen Sie i18n zu einer JS/TS-App hinzu](/de/guide/add-i18n-to-js) für `t()`, und diese Seite für die README |
| Eine Python-App plus eine README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [Fügen Sie i18n zu einer Python-App hinzu](/de/guide/add-i18n-to-python) für die App, und diese Seite für die README |
| Jede andere Vorlage, plus eine README | fügen Sie `--with-readme` zu diesem `init`-Befehl hinzu | Diese Seite für den README-Block |
| Nur README und Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | Diese Seite |

`--with-readme` ist ein No-Op bei `ui-markdown` und `docs-markdown`, da diese Vorlagen den README-Block bereits enthalten.

<a id="what-you-get"></a>
## Was Sie erhalten

- `README.md` bleibt die Quelldatei. Hosts rendern sie weiterhin als Startseite des Repositorys.
- Jedes Ziellokale ist eine gleichgeordnete Datei wie `translated-docs/README.de.md`.
- Die Sprachzeile in der Quelle und in jeder Übersetzung listet jedes Lokale auf, mit Links, die von der Datei aus funktionieren, die der Leser gerade betrachtet.

Fügen Sie `CONTRIBUTING.md`, `CHANGELOG.md` oder einen `docs/`-Ordner zum selben Block hinzu, wenn diese Dateien ebenfalls übersetzt werden sollen. Siehe [Mehr als die README](#more-than-the-readme).

<a id="install"></a>
## Installieren

Installieren Sie die CLI ([Installation](/de/guide/installation)) und legen Sie den API-Schlüssel für Ihren Anbieter fest ([Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key)). Ollama benötigt keinen Schlüssel.

Ein Repository mit einem `package.json` installiert das Paket als Entwicklungsabhängigkeit. Ein Repository ohne Node.js-Projekt kann `npx ai-i18n-tools` ausführen oder die [eigenständige ausführbare Datei](/de/guide/installation#standalone-executables) verwenden.

<a id="scaffold"></a>
## Gerüst

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

`init` schreibt nur `ai-i18n-tools.config.json`. Es bearbeitet `README.md` nicht. Wenn die Konfiguration einen README-Block enthält, druckt es die einzufügende Markierungszeile und warnt, wenn `README.md` fehlt. Eine bestehende Konfiguration wird nicht angetastet: Fügen Sie den Block manuell hinzu, wie unter [Fügen Sie den Block zu einer bereits vorhandenen Konfiguration hinzu](#add-the-block-to-a-config-you-already-have).

<a id="configure"></a>
## Konfigurieren

Vier Schlüssel sind wichtig:

- `sourceLocale`: die Sprache, in der die README verfasst ist. Jede Sprache ist gültig. Englisch ist ein gängiges Beispiel in dieser Anleitung.
- `targetLocales`: die hinzuzufügenden Sprachen.
- `features.translateDocs`: muss wahr sein. Eine Hybrid-Konfiguration setzt auch `features.translateUIStrings`.
- `docs[].contentPaths`: die zu übersetzenden Markdown-Dateien und -Ordner. Das Grundgerüst listet `README.md`.

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

<a id="add-the-language-list"></a>
## Sprachliste hinzufügen

Fügen Sie diese Zeile in `README.md` ein, wo Leser die anderen Sprachen sehen sollen. Ein kurzes Label in der Zeile darüber ist normaler Text und wird übersetzt.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Die Zeile kann leer sein. `translate-docs` ersetzt alles vom öffnenden bis zum schließenden Marker durch einen Link pro Gebietsschema. Marker innerhalb von Codeblöcken werden ignoriert, sodass ein Konfigurationsbeispiel in derselben Datei nicht übereinstimmt. Details: [Sprachumschalter](/de/guide/documents/language-switcher).

<a id="translate"></a>
## Übersetzen

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` führt die aktivierten Schritte der Reihe nach aus: `extract` und `translate-ui`, wenn UI-Strings aktiviert sind, dann `translate-docs`. Ein Cache wird gemeinsam genutzt, sodass ein bereits für die App übersetzter Satz wiederverwendet wird, wenn er in der README auftaucht. UI-Kataloge werden auch als Glossarhinweise an die Dokumentübersetzung übergeben (`ui[].uiGlossary`, standardmäßig aktiviert), was die Konsistenz von Schaltflächen- und Funktionsnamen gewährleistet. Siehe [Glossar](/de/guide/glossary).

Sprachnamen in der Zeile stammen aus `ui-languages.json`, die `extract` neben dem UI-Katalog schreibt. Eine reine README-Konfiguration hat keinen UI-Katalog, daher verwendet die Zeile stattdessen die gebündelte Sprachliste. Die Bezeichnungen sind immer noch die nativen Namen. Führen Sie `generate-ui-languages` nur aus, wenn Sie ein eigenes Projektmanifest wünschen.

Committen Sie `translated-docs/` und öffnen Sie die übersetzte README auf dem Host. Relative Links zwischen der Quell-README und `translated-docs/README.de.md` werden für jede Datei neu geschrieben.

<a id="hybrid-tips"></a>
## Hybrid-Tipps

- Übersetzen Sie die README mit `docs[].targetLocales` in weniger Sprachen als die App. Siehe [Weniger Gebietsschemas für Dokumente](/de/guide/combining-pipelines#fewer-locales-for-documents).
- Fügen Sie Produktbegriffe in `glossary.userGlossary` ein. Dieselbe CSV-Datei wird für UI-Strings und für die README verwendet.
- Führen Sie nur eine Seite mit `ai-i18n-tools sync --no-docs` oder `ai-i18n-tools sync --no-ui` aus.

<a id="more-than-the-readme"></a>
## Mehr als die README

Fügen Sie Pfade zu `contentPaths` hinzu. `flatPreserveRelativeDir` behält Ordner bei, sodass `docs/guide.md` zu `translated-docs/docs/guide.de.md` wird, anstatt mit einem anderen `guide.md` zu kollidieren.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

Eine `.translate-ignore`-Datei überspringt Pfade, die Sie nicht übersetzen möchten. `init --with-translate-ignore` schreibt einen Starter. Codeblöcke, URLs und Überschriftenanker werden nicht übersetzt. Siehe [Ausgabelayouts](/de/guide/documents/output-layouts), [Ankerlinks](/de/guide/documents/anchor-links) und [Link-Umschreibung](/de/guide/documents/link-rewriting).

Screenshots, die sich je nach Sprache unterscheiden: [Bilder und Screenshots](/de/guide/images-and-screenshots/).

<a id="links-on-the-host"></a>
## Links auf dem Host

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

<a id="keep-it-translated"></a>
## Übersetzt halten

Führen Sie `sync` erneut aus, nachdem die Quell-README oder die App-Strings geändert wurden. Der Cache sendet nur neuen oder geänderten Text an das Modell. Committen Sie die aktualisierten Dateien unter `translated-docs/`.

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

<a id="say-that-the-translation-is-automatic"></a>
## Darauf hinweisen, dass die Übersetzung automatisch erfolgt

KI-Übersetzungen können falsch sein. Ein kurzer Hinweis am Ende der README-Datei, wie der in der [README dieses Repositorys](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md), informiert die Leser darüber, dass die anderen Sprachen maschinell übersetzt wurden und überprüft werden sollten, bevor man sich auf sie verlässt.

<a id="not-your-case"></a>
## Nicht Ihr Fall?

| Sie haben | Lesen Sie |
| --- | --- |
| App-UI-Strings und keine README zum Übersetzen | [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) oder [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python) |
| Eine VitePress-, Docusaurus-, Starlight-, Nextra-, Fumadocs- oder Astro-Site | [i18n zu einer Website oder Dokumentations-Site hinzufügen](/de/guide/add-i18n-to-website). Fügen Sie `--with-readme` hinzu, wenn die Repository-README ebenfalls übersetzt werden soll |
| Eine HTML-Datei pro Gebietsschema | [HTML-Seiten](/de/guide/documents/html-pages) |
| Die vollständige `translate-docs`-Referenz | [Dokumente](/de/guide/documents/) |

<a id="examples"></a>
## Beispiele

| Projekt | Was es zeigt |
| --- | --- |
| [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) | Eine kleine Node-App plus ein flacher README-Block |
| [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) | UI-Strings, eine Dokumentations-Site und ein separater flacher README-Block |
| Dieses Repository | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): flacher README-Block, dann die VitePress-Site |

<a id="agent-prompt"></a>
## Agenten-Prompt

Kopieren Sie dies in Cursor oder einen anderen Coding-Agenten. Es bereitet das Repository vor. Es übersetzt die README nicht.

````markdown
# Prepare README and Markdown translation

## Context

ai-i18n-tools translates Markdown listed in `docs[]` and writes one file per locale. The source README stays in place. Flat output for a README looks like `translated-docs/README.de.md`. Guide: https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-readme

## Scope

Edit `ai-i18n-tools.config.json` and the source Markdown files that should grow a language list. Do not edit anything under `translated-docs/` or other generated locale trees.

## Config

- If there is no config, run `ai-i18n-tools init -P <provider>` for a JS/TS app (this template already includes the README block), `ai-i18n-tools init -t docs-markdown -P <provider>` for Markdown only, or `ai-i18n-tools init -t <template> -P <provider> --with-readme` for any other template.
- If a config exists, set `features.translateDocs` to true and append one `docs` entry: `contentPaths` includes `README.md`, `outputDir` is `translated-docs`, `addFrontmatter` is false, `docsOutput.style` is `flat`, `flatPreserveRelativeDir` is true, and `postProcessing.languageListBlock` uses start `<small id="lang-list">`, end `</small>`, separator ` · `.
- Do not add a second block when one already lists `README.md`.
- Add other source files the user named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## README

Add this line where the language row should appear, if it is not already there:

```markdown
<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.

## Do not

- Do not translate, rewrite, or shorten the source README.
- Do not hand-edit `translated-docs/` or locale JSON.
- Do not run a translation yourself.

## Verify

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and exactly one docs block lists `README.md`.

## Report back

List files changed and any Markdown file you left out of `contentPaths`, with a one-line reason.
````
