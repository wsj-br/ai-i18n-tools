<a id="quick-start"></a>
# Schnellstart

Diese Seite führt ein einsprachiges Projekt zu seinen ersten übersetzten Dateien. Sie ist für eine JS/TS-App, eine Python-App, eine Website oder Dokumentationsseite oder eine Repository-README und andere Markdown-Dateien gedacht. Sie setzt voraus:

- Node.js `>=22.16.0` oder die [eigenständige ausführbare Datei](/de/guide/installation#standalone-executables) für ein Python-Projekt.
- Einen API-Schlüssel für einen LLM-Anbieter oder eine lokale Ollama-Installation.
- Das Projekt befindet sich in der Versionskontrolle, sodass Sie überprüfen können, was das Tool schreibt.

Zwei Dinge unterscheiden sich zwischen Projekten: wie das Tool Ihren Text findet und wie Ihre App das Ergebnis lädt. [Wählen Sie Ihren Pfad](#pick-your-path) unten führt Sie zum richtigen Leitfaden dafür.

<a id="runnable-examples"></a>
## Ausführbare Beispiele

Möchten Sie lieber zuerst ein fertiges Projekt ansehen? Kopieren Sie eines, ohne das Repository zu klonen:

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync
```

Ersetzen Sie `console-app` durch ein beliebiges anderes Node.js-Beispiel. Python-Beispiele haben kein `package.json`; kopieren Sie sie auf die gleiche Weise oder laden Sie `ai-i18n-tools-python-examples.zip` vom GitHub Release herunter. Die vollständige Liste, mit dem, was jedes Beispiel zeigt, finden Sie auf der Seite [Beispiele](/de/examples).

<a id="install"></a>
## Installieren

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` und `yarn add --dev ai-i18n-tools` funktionieren auch. Python-Projekte installieren die eigenständige ausführbare Datei und benötigen kein Node.js. Linux und macOS: `curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`. Windows PowerShell: `irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`. Andere Installationsoptionen: [Installation](/de/guide/installation).

<a id="provider-and-api-key"></a>
## Anbieter und API-Schlüssel

Jeder Befehl, der ein LLM aufruft (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg` und `sync`), benötigt beides:

1. Mindestens ein Anbieter in `ai-i18n-tools.config.json`: ein `providers.<name>`-Block mit `translationModels` und ein `provider`-Schlüssel der obersten Ebene, wenn mehr als ein Anbieter konfiguriert ist. `init -P <provider>` erstellt diese Voreinstellung. Informationen zum Hinzufügen von Anbietern finden Sie unter [LLM-Anbieter](/de/guide/providers-and-models). Informationen zur Auswahl der Modellliste finden Sie unter [KI-Modelle](/de/guide/ai-models).
2. Der passende API-Schlüssel in Ihrer Umgebung oder in einer `.env`-Datei im Projektstammverzeichnis. Jede integrierte Voreinstellung liest eine benannte Variable aus der [Voreinstellungstabelle](/de/guide/providers-and-models#built-in-providers), zum Beispiel `OPENROUTER_API_KEY` mit `-P openrouter` oder `OPENAI_API_KEY` mit `-P openai`. Ollama verwendet einen lokalen Endpunkt und benötigt keinen Schlüssel.

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

`extract`, `status` und andere Befehle, die das LLM nicht aufrufen, benötigen keines von beidem. Mehr zu Umgebungsdateien und PATH: [Installation](/de/guide/installation#using-the-cli).

<a id="pick-your-path"></a>
## Wählen Sie Ihren Pfad

Finden Sie, was Sie haben, führen Sie die Befehle in seinem Block aus und fahren Sie dann im verlinkten Leitfaden fort.

<a id="a-jsts-app"></a>
### Eine JS/TS-App

Ihre Schaltflächen und Nachrichten sind im Quelltext noch Klartext, daher hat das Tool noch nichts zu finden. Sie müssen zuerst in `t()` eingeschlossen werden, und die App benötigt eine kleine i18next-Setup-Datei.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models --apply
```

Folgen Sie dann [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js). Es behandelt den Wrapping-Schritt, mit einem Agent-Prompt, vor `extract` und `translate-ui`.

<a id="a-python-app"></a>
### Eine Python-App

```bash
ai-i18n-tools init -t ui-python -P openrouter
ai-i18n-tools suggest-models --apply
```

Befolgen Sie dann [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python).

Eine Django-App, Flask mit Flask-Babel-Katalogen oder eine App, die bereits `gettext` aufruft, behält diese Aufrufe bei. Erstellen Sie stattdessen ein Gerüst mit `ui-python-django`, `ui-python-flask` oder `ui-python-gettext`, und befolgen Sie dann [i18n zu einer Django-/Python-gettext-App hinzufügen](/de/guide/add-i18n-to-django-gettext).

<a id="a-website-or-documentation-site"></a>
### Eine Website oder Dokumentationsseite

Wählen Sie die Vorlage für Ihr Framework:

| Ihre Website | Vorlage |
| --- | --- |
| Astro Starlight | `ui-starlight` |
| Docusaurus | `ui-docusaurus` |
| VitePress | `ui-vitepress` |
| Nextra | `ui-nextra` |
| Fumadocs | `ui-fumadocs` |
| Einfache Astro-Website | `ui-astro-website` |
| Einfache HTML-Seiten | `ui-plain-html` oder `docs-plain-html` |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

Befolgen Sie dann [i18n zu einer Website oder Dokumentationsseite hinzufügen](/de/guide/add-i18n-to-website). Die Eingabeaufforderung des Agenten aktiviert das i18n-Routing des Frameworks. Sie führen `sync` aus, nachdem Sie diese Arbeit überprüft haben.

<a id="a-readme-or-markdown-docs"></a>
### Eine README- oder Markdown-Dokumentation

Die meisten Repositories möchten dies zusammen mit der App: Die Standardvorlage `ui-markdown` enthält bereits einen flachen README-Block. Für jede andere Vorlage fügen Sie `--with-readme` hinzu. Ein Repository, das nur Markdown verwendet, nutzt `docs-markdown`.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
ai-i18n-tools init -t docs-markdown -P openrouter
```

Befolgen Sie dann [i18n zu Ihrer README- und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme). Fügen Sie den Sprachlisten-Marker in `README.md` vor `sync` ein. Der App-Pfad, falls vorhanden, ist weiterhin [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) oder [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python).

<a id="something-else"></a>
### Etwas anderes

- Verschachteltes i18next-JSON, das unverändert bleibt: `ai-i18n-tools init -t ui-json-bundles -P openrouter`, dann [JSON](/de/guide/json).
- SVG-Diagramme mit Textbeschriftungen: [SVG-Übersetzung](/de/guide/svg-translation/).
- Umstieg von Intlayer: [Migration von Intlayer](/de/guide/migrating-from-intlayer).
- Intlayer beibehalten und nur die Übersetzungen ausfüllen: [Intlayer vor Ort übersetzen](/de/guide/translating-intlayer).

Die vollständige Vorlagenliste mit jeder `init`-Option finden Sie in der [CLI-Setup-Referenz](/de/reference/cli-commands/setup).

<a id="run-and-check"></a>
## Ausführen und überprüfen

Wenn Ihr Projekt bereit ist:

```bash
ai-i18n-tools doctor
ai-i18n-tools sync
ai-i18n-tools status
```

`doctor` prüft, ob die Konfiguration, Pfade, Provider und Umgebung bereit sind. Es überprüft auch Modell-IDs mit dem Provider, es sei denn, Sie übergeben `--local`. `sync` führt jeden Schritt aus, den Ihre Konfiguration aktiviert, und zwar der Reihe nach. `status` zeigt an, was pro Gebietsschema übersetzt wurde. Ein erster Durchlauf bei einem Projekt, in dem das Tool keinen Text erkennen kann, endet fehlerfrei und schreibt nichts Nützliches. Wenn also `status` keine Zeichenfolgen anzeigt, kehren Sie zum Leitfaden für Ihren Pfad zurück.

`suggest-models` stuft die Chat-Modelle des aktiven Anbieters anhand veröffentlichter Benchmarks ein. `suggest-models --apply` ersetzt `translationModels` und lässt `uiModels` und `localeModels` unverändert. Dasselbe Ranking befindet sich auf dem Dashboard auf dem Tab **Modelle**. Wie das Ranking funktioniert und warum die Liste mehr als ein Modell enthält: [KI-Modelle](/de/guide/ai-models). Befehlsreferenz: [suggest-models](/de/reference/cli-commands/models#suggest-models).

<a id="keep-it-translated"></a>
## Übersetzt halten

Führen Sie `sync` erneut aus, wann immer sich der Quelltext ändert. Ein SQLite-Cache bedeutet, dass nur neuer oder geänderter Text an das Modell gesendet wird, sodass erneute Ausführungen kostengünstig sind. Das Ausführen von `sync` in CI verhindert, dass Übersetzungen abweichen. `ai-i18n-tools dashboard` öffnet das [Übersetzungs-Dashboard](/de/guide/translation-dashboard/), um zwischengespeicherte Übersetzungen zu überprüfen und zu bearbeiten.

<a id="recommended-packagejson-scripts"></a>
### Empfohlene package.json-Skripte

Wenn das Paket lokal installiert ist, lösen Skripte `ai-i18n-tools` aus `node_modules/.bin` ohne zusätzliche Shell-Einrichtung auf. Für eine interaktive Shell konfigurieren Sie zuerst PATH: siehe [Verwenden der CLI](/de/guide/installation#using-the-cli).

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

Bevorzugen Sie `sync` gegenüber dem Verketten der einzelnen Übersetzungs-Skripte. Verwenden Sie die Einzelschritt-Skripte nur, wenn Sie einen Schritt isoliert benötigen.

Um die CLI-Ausgabe und das Dashboard in einer anderen Sprache anzuzeigen, übergeben Sie `-L <code>` oder legen Sie `AI_I18N_LANG` fest: siehe [Sprache der Tool-Benutzeroberfläche](/de/guide/tool-ui-language).

<a id="combined-sync"></a>

Übersetzen Sie mehr als eine Art von Inhalt, wie z. B. App-Strings und eine Dokumentations-Website zusammen? Siehe [Pipelines kombinieren](/de/guide/combining-pipelines).

Weiter: die Anleitung für Ihren Pfad unter [Wählen Sie Ihren Pfad](#pick-your-path).
