<a id="quick-start"></a>
# Schnellstart

Die Standardvorlage `init` (`ui-markdown`) ermöglicht nur die Extraktion und Übersetzung der **Benutzeroberfläche**. Die Vorlagen `ui-docusaurus`, `ui-starlight` und `ui-vitepress` ermöglichen die **Dokumentenübersetzung** (`translate-docs`); `ui-vitepress` erstellt auch JSON für das VitePress-Theme-JSON. Die Vorlage `ui-astro-website` erstellt die **UI**-Extraktion für einfache Astro-Apps (einschließlich `.astro`-Dateien); fügen Sie einen `docs[]`-Block hinzu (siehe [Astro-Webseiten (parse-and-replace)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)), wenn Sie auch `translate-docs` für `.astro`-Seiten-HTML wünschen. Die Referenz [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) verwendet **beide** Pipelines. Verwenden Sie `sync`, wenn Sie einen Befehl wünschen, der Extraktion, UI-Übersetzung, optionale SVG-Dateiübersetzung und Dokumentationsübersetzung gemäß Ihrer Konfiguration ausführt.

<a id="runnable-examples"></a>
### Ausführbare Beispiele

Sieben ausführbare Projekte und Fixtures befinden sich unter [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/). Siehe den [Beispielkatalog](/examples) (Konsolen-App, Next.js + Docusaurus, Astro-Website, Astro Starlight-Dokumente, VitePress-Dokumente, Multi-Provider-Vergleich, Markdown-Stresstest).

**Ein Beispiel eigenständig ausführen** (ohne das gesamte Monorepo zu klonen):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
```

Ersetzen Sie `console-app` durch einen beliebigen Beispielordnernamen. Jedes Beispiel deklariert `"ai-i18n-tools": "^1.7.2"` und installiert die CLI von npm. Die READMEs der einzelnen Beispiele enthalten denselben Snippet mit ausgefülltem Ordnernamen.

**Aus dem vollständigen ai-i18n-tools-Repository:** Wenn Sie das gesamte Repository geklont haben (nicht nur einen Beispielordner mit degit), führen Sie `pnpm install` vom Repository-Stammverzeichnis aus; der Workspace-Eintrag [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) (`ai-i18n-tools: workspace:*`) verknüpft Beispiele automatisch mit Ihrem lokalen Checkout.

```bash
# UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# VitePress docs: npx ai-i18n-tools init -t ui-vitepress
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# JSON (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Empfohlene `package.json`-Skripte

Wenn das Paket lokal installiert ist, können Sie die CLI-Befehle direkt in Skripten verwenden (kein `npx` erforderlich).

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
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**Tipp:** Übergeben Sie `-L <code>` oder setzen Sie `AI_I18N_LANG`, wenn Sie die CLI-Ausgabe und das Dashboard in einer anderen Sprache wünschen – siehe [Tool-UI-Sprache](/reference/environment-variables#tool-ui-language).

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

Führen Sie `npx ai-i18n-tools sync` aus, um eine Pipeline auszuführen: Wenn `features.translateUIStrings` aktiviert ist, werden zuerst UI-Texte **extrahiert** und anschließend **übersetzt**; optional **SVG übersetzen** (`features.translateSVG` + `svg`-Block); **Dokumentation übersetzen** (wie konfiguriert in `docs[]`); danach optional **translate-json** (`features.translateJson` + `json[]`). Teile können mit `--no-ui`, `--no-svg`, `--no-docs` oder `--no-json` übersprungen werden. Die Schritte für Dokumentation und `json[]` akzeptieren `--dry-run`, `-p` / `--path`, `--force`, und `--force-update` (Dokumentations-spezifische Flags werden ignoriert, wenn `--no-docs` verwendet wird; JSON nutzt dieselben Cache-Flags, wenn `--no-json` nicht gesetzt ist).

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

So wird es mit `npx ai-i18n-tools sync` ausgeführt:

- UI-Texte werden aus `src/` in `public/locales/` extrahiert/übersetzt.
- Der erste Dokumentations-Block übersetzt **Markdown** aus `docs-site/docs/` nach `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (lokalisierte Dokumentationsseiten).
- Bei gesetztem `docs[].docusaurusCatalogDir` und aktiviertem `features.translateDocs` übersetzt derselbe Block zusätzlich **Docusaurus-Shell-JSON** unter `docs-site/i18n/en/` in jeden Ziel-Locale-Ordner – dazu gehören Navbar, Footer und Theme-/Plugin-Kataloge, nicht jedoch MDX-Inhalte.
- Der zweite Dokumentations-Block übersetzt `README.md` in lokalisierte Dateien unter `translated-docs/` (`docsOutput.style = "flat"`).
- Alle Dokumentationsblöcke nutzen `cacheDir` gemeinsam, sodass unveränderte Segmente zwischen den Durchläufen wiederverwendet werden, um API-Aufrufe und Kosten zu reduzieren.
