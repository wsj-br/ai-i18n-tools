<a id="combining-pipelines"></a>
# Pipelines kombinieren

Lesen Sie dies, wenn ein Projekt mehr als eine Art von Übersetzung benötigt: UI-Strings der App plus Dokumentation, eine Dokumentationsseite plus eine README-Datei im Stammverzeichnis oder Dokumente plus SVG-Illustrationen. Wenn Sie nur eine Art von Inhalt übersetzen, ist der [Schnellstart](/de/guide/quick-start) ausreichend.

Eine App plus ihre Repository-README ist die gängige Hybridlösung. Gerüstet wird sie mit `init` (der `ui-markdown`-Vorlage) oder `init -t <template> --with-readme`, folgen Sie dann [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme). Die gemischte Konfiguration weiter unten auf dieser Seite ist die gleiche Idee neben einer Dokumentationsseite.

Dieses Repository ist ein solches Projekt. [`ai-i18n-tools.config.json`](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) übersetzt die CLI- und Translation Dashboard UI-Strings und diese VitePress-Website in einem `sync`. Der UI-Block umfasst `src/cli`, `src/server`, `src/dashboard-app` und `src/api` und schreibt flaches JSON unter `src/i18n/locales`. Der VitePress-Block verwendet `docsOutput.style: "vitepress"` für `docs/` und den Themenkatalog. Dieselbe Datei schreibt auch `README.md`-Übersetzungen unter `translated-docs/`. Website-Verdrahtung: [VitePress](/de/guide/integrations/vitepress).

<a id="what-sync-runs"></a>
## Was der Sync ausführt

`ai-i18n-tools sync` führt die aktivierten Schritte in dieser Reihenfolge aus:

1. `extract`, dann `translate-ui`, wenn `features.translateUIStrings` aktiviert ist.
2. `translate-svg`, wenn `features.translateSVG` aktiviert ist und ein `svg`-Block existiert.
3. `translate-docs`, wenn `features.translateDocs` aktiviert ist oder ein beliebiges `docs[].docusaurusCatalogDir` gesetzt ist.
4. `translate-json`, wenn `features.translateJson` aktiviert ist und `json[]` Einträge hat.

Überspringen Sie Teile mit `--no-ui`, `--no-svg`, `--no-docs` oder `--no-json`. Die Schritte für Dokumente und `json[]` akzeptieren `--dry-run`, `-p` / `--path`, `--force`, `--force-update` und `--check-cache`. Nur-Dokumente-Flags werden ignoriert, wenn `--no-docs` gesetzt ist. JSON verwendet dieselben Cache-Flags, wenn `--no-json` nicht gesetzt ist.

Bevorzugen Sie `sync` gegenüber dem manuellen Verketten der einzelnen Befehle. Reihenfolge, Extraktion und Gebietsschema-Flags können bei manueller Ausführung leicht falsch sein.

<a id="ui-strings-and-documents-together"></a>
## UI-Strings und Dokumente gemeinsam

Aktivieren Sie beide Funktionen in einer Konfiguration, um UI-Strings und Dokumente in einem einzigen Durchlauf auszuführen:

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

UI-Blöcke enthalten standardmäßig ihre `strings.json`-Kataloge als Glossarhinweise für die Dokumentation (`uiGlossary`). `glossary.userGlossary` fügt CSV-Überschreibungen für Produktbegriffe hinzu. Siehe [Glossar](/de/guide/glossary).

<a id="fewer-locales-for-documents"></a>
## Weniger Gebietsschemas für Dokumente

Verwenden Sie `docs[].targetLocales` für einen Block, um die Dateien dieses Blocks in eine kleinere Untermenge als die UI zu übersetzen. Die effektiven Dokumentations-Gebietsschemas sind die Vereinigung über alle Blöcke hinweg:

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

<a id="mixed-documentation-config"></a>
## Gemischte Dokumentationskonfiguration

Sie können mehrere Dokumentations-Pipelines in derselben Konfiguration kombinieren, indem Sie mehr als einen Eintrag in `docs` hinzufügen. Dies ist eine gängige Einrichtung, wenn ein Projekt eine Docusaurus-Website (`docsOutput.style = "docusaurus"`) plus Markdown-Dateien auf Root-Ebene hat, wie z. B. eine Repository-README mit `docsOutput.style = "flat"`, die mit Dateinamen mit Gebietsschema-Suffix übersetzt werden sollen.

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

- UI-Strings werden aus `src/` extrahiert und in `public/locales/` übersetzt.
- Der erste Dokumentationsblock übersetzt Markdown von `docs-site/docs/` in `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (lokalisierte Dokumentationsseiten).
- Wenn `docs[].docusaurusCatalogDir` gesetzt und `features.translateDocs` aktiviert ist, übersetzt derselbe Block auch Docusaurus-Shell-JSON unter `docs-site/i18n/en/` in jeden Ziel-Gebietsschema-Ordner: Navbar, Footer und Themen-/Plugin-Kataloge, nicht MDX-Haupttext.
- Der zweite Dokumentationsblock übersetzt `README.md` in Dateien mit Gebietsschema-Suffix unter `translated-docs/` (`docsOutput.style = "flat"`).
- Alle Dokumentationsblöcke nutzen `cacheDir` gemeinsam, sodass unveränderte Segmente zwischen den Durchläufen wiederverwendet werden, um API-Aufrufe und Kosten zu reduzieren.

Weiter: zurück zum [Schnellstart](/de/guide/quick-start), oder siehe [Konfiguration](/de/reference/configuration) für das vollständige Schema.
