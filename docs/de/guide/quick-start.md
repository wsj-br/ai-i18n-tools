<a id="quick-start"></a>
# Schnellstart

Die Standardvorlage `init` (`ui-markdown`) ermöglicht nur die Extraktion und Übersetzung der **Benutzeroberfläche**. Die Vorlagen `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra` und `ui-fumadocs` ermöglichen die **Dokumentenübersetzung** (`translate-docs`); `ui-vitepress` erstellt auch `docsOutput.vitepressThemeCatalog` für VitePress-Themenzeichenfolgen, `ui-nextra` erstellt `docs[].nextraDictionaryPath` für das Nextra-Themenwörterbuch (Seitenleisten-`_meta.ts` wird automatisch gesammelt) und `ui-fumadocs` erstellt `docsOutput.fumadocsUiCatalog` für Fumadocs-UI-Überschreibungen (Seitenleisten-`meta.json` wird automatisch gesammelt). Die Vorlage `ui-astro-website` erstellt die **UI**-Extraktion für einfache Astro-Apps (einschließlich `.astro`-Dateien); fügen Sie einen `docs[]`-Block hinzu (siehe [Astro-Webseiten (parse-and-replace)](/de/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)), wenn Sie auch `translate-docs` für `.astro`-Seiten-HTML wünschen. Die Referenz [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) verwendet **beide** Pipelines. Verwenden Sie `sync`, wenn Sie einen Befehl wünschen, der die Extraktion, UI-Übersetzung, optionale SVG-Dateiübersetzung und Dokumentationsübersetzung gemäß Ihrer Konfiguration ausführt.

<a id="runnable-examples"></a>
### Ausführbare Beispiele

Neun ausführbare Projekte und Fixtures befinden sich unter [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/). Siehe den [Beispielkatalog](/de/examples) (Konsolen-App, Next.js + Docusaurus, Astro-Website, Astro Starlight-Dokumente, VitePress-Dokumente, Nextra-Dokumente, Fumadocs-Dokumente, Multi-Provider-Vergleich, Markdown-Stresstest).

**Ein Beispiel eigenständig ausführen** (ohne das gesamte Monorepo zu klonen):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

Ersetzen Sie `console-app` durch einen beliebigen Beispielordnernamen. Jedes Beispiel deklariert `"ai-i18n-tools": "^1.7.2"` und installiert die CLI von npm. Die READMEs der einzelnen Beispiele enthalten denselben Snippet mit ausgefülltem Ordnernamen.

**Aus dem vollständigen ai-i18n-tools-Repository** – wenn Sie das gesamte Repository geklont haben (nicht nur einen Beispielordner mit degit):

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

Der Workspace-Eintrag [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) (`ai-i18n-tools: workspace:*`) verknüpft Workspace-Beispiele automatisch mit Ihrem lokalen Checkout. Standalone-Fixtures (`multi-provider`, `test-markdown`) sind keine Workspace-Pakete – verwenden Sie aus deren Ordner `node ../../bin/ai-i18n-tools.mjs …`. Um die CLI aus dem **Repository-Stammverzeichnis** (die eigenen Docs/i18n dieses Pakets) auszuführen, verwenden Sie `pnpm i18n:sync` oder `node bin/ai-i18n-tools.mjs …` – siehe [Installation – Geklontes Monorepo](/de/guide/installation#cloned-monorepo) und den [Entwicklungsleitfaden](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development).

<a id="provider-and-api-key-required-for-translation"></a>
### Anbieter und API-Schlüssel (für die Übersetzung erforderlich)

Jeder Befehl, der ein LLM aufruft – `translate-ui`, `translate-docs`, `translate-json`, `translate-svg` und `sync` – benötigt **beides**:

1. **Mindestens ein Anbieter** in `ai-i18n-tools.config.json`: ein `providers.<name>`-Block mit `translationModels` und ein `provider`-Schlüssel der obersten Ebene, wenn mehr als ein Anbieter konfiguriert ist. `init` erstellt einen Standardanbieterblock (`openrouter`, es sei denn, Sie übergeben `-P <provider>`); wechseln Sie Voreinstellungen, fügen Sie Anbieter hinzu oder optimieren Sie Modelllisten – siehe [LLM-Anbieter und -Modelle](/de/guide/providers-and-models).
2. **Der passende API-Schlüssel** in Ihrer Umgebung oder einer `.env`-Datei im Projektstammverzeichnis. Jede integrierte Voreinstellung liest eine benannte Umgebungsvariable aus der [Voreinstellungstabelle](/de/guide/providers-and-models#built-in-providers) (z. B. `OPENROUTER_API_KEY` für die Standardeinstellung oder `ANTHROPIC_API_KEY`, wenn Sie mit `-P anthropic` gerüstet sind); **Ollama** ist die Ausnahme – es verwendet einen lokalen Endpunkt und benötigt keinen Schlüssel. Siehe [Installation – API-Schlüssel des Anbieters festlegen](/de/guide/installation#using-the-cli).

`extract`, `status` und andere Befehle, die das LLM nicht aufrufen, benötigen keinen Anbieter oder API-Schlüssel.

<a id="core-cli-commands"></a>
### Kern-CLI-Befehle

Führen Sie dies von Ihrem **Projektstammverzeichnis** aus, nachdem Sie `ai-i18n-tools` installiert und [Ihre Shell für den Bare-Befehl konfiguriert](/de/guide/installation#using-the-cli) haben. Die folgenden Beispiele verwenden `ai-i18n-tools` direkt.

```bash
# Set the API key for your active provider (see preset table; skip for local Ollama)
# Default init uses openrouter:
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Or scaffold another preset at init, e.g. anthropic:
# export ANTHROPIC_API_KEY=sk-ant-your-key-here

# UI strings (default template enables extract + translate-ui)
ai-i18n-tools init [-P <provider>]    # default: openrouter
ai-i18n-tools init -P anthropic
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight [-P <provider>]
# VitePress docs: ai-i18n-tools init -t ui-vitepress [-P <provider>]
# Nextra docs: ai-i18n-tools init -t ui-nextra [-P <provider>]
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs [-P <provider>]
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website [-P <provider>]
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles [-P <provider>]
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Empfohlene `package.json`-Skripte

Wenn das Paket lokal installiert ist, lösen `package.json`-Skripte `ai-i18n-tools` aus `node_modules/.bin` ohne zusätzliche Shell-Einrichtung auf. Für interaktive Shells konfigurieren Sie zuerst PATH – siehe [Verwenden der CLI](/de/guide/installation#using-the-cli).

**Bevorzugen** Sie `sync` für alles, was früher „führe `translate-ui` aus, dann `translate-svg`, dann `translate-docs`, dann `translate-json`“ war: `ai-i18n-tools sync` führt **extract** (wenn aktiviert), **translate-ui**, optional **translate-svg**, **translate-docs** und anschließend optional **translate-json** – in der richtigen Reihenfolge und mit gemeinsamen Flags – entsprechend Ihrer Konfiguration aus. Das manuelle Verketten dieser Schritte ist fehleranfällig (Reihenfolge, Extraktion, Locale-Flags). Verwenden Sie `i18n:translate:ui`, `i18n:translate:svg`, `i18n:translate:docs` und `i18n:translate:json` nur, wenn Sie einen **einzelnen** Schritt isoliert benötigen.

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

**Tipp:** Übergeben Sie `-L <code>` oder legen Sie `AI_I18N_LANG` fest, wenn Sie die CLI-Ausgabe und das Dashboard in einer anderen Sprache wünschen – siehe [Sprache der Tool-Benutzeroberfläche](/de/guide/tool-ui-language).

<a id="combined-sync"></a>
## Kombinierte Synchronisierung

Aktivieren Sie alle Funktionen in einer einzigen Konfiguration, um UI-Strings und Dokumente zusammen auszuführen:

<details>
<summary>Beispiel für kombinierte UI- und Dokumentationskonfiguration</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` verweist die Dokumentenübersetzung auf denselben `strings.json`-Katalog wie die UI, sodass die Terminologie konsistent bleibt; `glossary.userGlossary` fügt CSV-Überschreibungen für Produktbegriffe hinzu.

Führen Sie `ai-i18n-tools sync` aus, um eine Pipeline auszuführen: Wenn `features.translateUIStrings` aktiviert ist, **extrahieren** und **übersetzen** Sie dann UI-Strings; optional **SVG übersetzen** (`features.translateSVG` + `svg`-Block); **Dokumentation übersetzen** (`docs[]` wie konfiguriert); dann optional **JSON übersetzen** (`features.translateJson` + `json[]`). Überspringen Sie Teile mit `--no-ui`, `--no-svg`, `--no-docs` oder `--no-json`. Die Docs- und `json[]`-Schritte akzeptieren `--dry-run`, `-p` / `--path`, `--force` und `--force-update` (nur-Docs-Flags werden ignoriert, wenn `--no-docs`; JSON verwendet dieselben Cache-Flags, wenn `--no-json` nicht gesetzt ist).

Verwenden Sie `docs[].targetLocales` in einem Block, um dessen Dateien in eine **kleinere Teilmenge** als die UI zu übersetzen (die effektiven Dokumentations-Localen ergeben sich als **Vereinigung** über alle Blöcke):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-config-docsoutputstyle--docusaurus--flat"></a>
### Gemischte Dokumentationskonfiguration (`docsOutput.style = "docusaurus"` + `"flat"`)

Sie können mehrere Dokumentations-Pipelines in derselben Konfiguration kombinieren, indem Sie mehrere Einträge in `docs` hinzufügen. Dies ist eine übliche Konfiguration, wenn ein Projekt eine Docusaurus-Website (`docsOutput.style = "docusaurus"`) sowie Markdown-Dateien auf Root-Ebene (z. B. ein Repository-README mit `docsOutput.style = "flat"`) enthält, die mit lokalisierten Dateinamen übersetzt werden sollen.

<details>
<summary>Beispiel für gemischte Docusaurus- und flache README-Konfiguration</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

So läuft dies mit `ai-i18n-tools sync` ab:

- UI-Texte werden aus `src/` in `public/locales/` extrahiert/übersetzt.
- Der erste Dokumentations-Block übersetzt **Markdown** aus `docs-site/docs/` nach `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (lokalisierte Dokumentationsseiten).
- Bei gesetztem `docs[].docusaurusCatalogDir` und aktiviertem `features.translateDocs` übersetzt derselbe Block zusätzlich **Docusaurus-Shell-JSON** unter `docs-site/i18n/en/` in jeden Ziel-Locale-Ordner – dazu gehören Navbar, Footer und Theme-/Plugin-Kataloge, nicht jedoch MDX-Inhalte.
- Der zweite Dokumentations-Block übersetzt `README.md` in lokalisierte Dateien unter `translated-docs/` (`docsOutput.style = "flat"`).
- Alle Dokumentationsblöcke nutzen `cacheDir` gemeinsam, sodass unveränderte Segmente zwischen den Durchläufen wiederverwendet werden, um API-Aufrufe und Kosten zu reduzieren.
