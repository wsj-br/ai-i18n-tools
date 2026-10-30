<a id="docusaurus-integration"></a>
# Docusaurus-Integration

Verwenden Sie `init -t ui-docusaurus` und `docsOutput.style: "docusaurus"` für [Docusaurus](https://docusaurus.io/)-Dokumentationsseiten. Das Preset erstellt einen `docs[]`-Block mit `docusaurusCatalogDir`, sodass `translate-docs` sowohl Seiten-Markdown als auch Docusaurus-Shell-JSON in einem Befehl übersetzen kann.

Siehe auch [Dokumente](/de/guide/documents/), die ausführbare Demo [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) und [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) für eine kombinierte Next.js-App mit verschachtelten Docusaurus-Dokumenten, flacher README und SVG-Assets.

<a id="quick-start"></a>
## Schnellstart

```bash
ai-i18n-tools init -t ui-docusaurus -P openai
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # or: cd examples/docusaurus-docs && pnpm build
```

Aktivieren Sie `features.translateDocs` und setzen Sie `docs[].docusaurusCatalogDir`, wenn Sie sowohl Dokumentationsseiten als auch die Site-Oberfläche (Navigationsleiste, Fußzeile, Theme-Strings) übersetzen. Führen Sie `docusaurus write-translations` in Ihrem Docusaurus-Projekt aus, wenn Sie `@docusaurus/*` aktualisieren oder Navigationsleisten-/Fußzeilen-/Theme-Beschriftungen ändern – und führen Sie dann `translate-docs` oder `sync` erneut aus, damit Shell-JSON in jeden Sprachordner übersetzt wird.

<a id="page-layout"></a>
## Seitenlayout

Englisches Markdown und MDX befinden sich unter Ihrem Docusaurus-Ordner `docs/` (zum Beispiel `docs-site/docs/`). Übersetzte Kopien werden in den Inhaltsbaum des Plugins jeder Sprache geschrieben:

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

Konfigurieren Sie einen `docs[]`-Block:

```json
{
  "contentPaths": ["docs-site/docs/"],
  "outputDir": "docs-site/i18n",
  "docusaurusCatalogDir": "docs-site/i18n/en",
  "addFrontmatter": true,
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "docs-site/docs"
  }
}
```

Richten Sie `contentPaths` auf die in `sourceLocale` geschriebenen `.md` / `.mdx` Dateien und Verzeichnisse aus. Diese Sprache kann eine beliebige Sprache sein. Legen Sie `docsRoot` auf dasselbe Verzeichnis fest, das Docusaurus als sein Content-Root-Verzeichnis verwendet. Legen Sie `outputDir` auf das Elternverzeichnis jedes Locale-Ordners unter `i18n/` fest.

Verbinden Sie die [Internationalisierung](https://docusaurus.io/docs/i18n/introduction) von Docusaurus: Halten Sie `targetLocales` in `ai-i18n-tools.config.json` mit dem `locales`-Array in `docusaurus.config.js` synchron. Jedes `localeConfigs[locale].path` muss mit dem Ordnernamen unter `i18n/` übereinstimmen (zum Beispiel `path: "fr"` für `i18n/fr/`).

<a id="enable-i18n-in-an-existing-site"></a>
### i18n auf einer bestehenden Site aktivieren

Die erstmalige Einrichtung erfolgt über die Eingabeaufforderung unter [i18n zu einer Website oder Dokumentationsseite hinzufügen](/de/guide/add-i18n-to-website#run-the-agent-prompt). Die folgende Checkliste beschreibt dieselbe Arbeit, manuell ausgeführt.

- Fügen Sie den `i18n`-Block in `docusaurus.config.js` hinzu: `defaultLocale`, `locales` und `localeConfigs[locale].path`, wenn der URL-Pfad vom Gebietsschema-Code abweichen soll.
- Führen Sie `docusaurus write-translations` aus, damit `i18n/<defaultLocale>/` existiert, richten Sie dann `docusaurusCatalogDir` auf diesen Ordner aus und führen Sie `sync` aus.
- Benutzerdefiniertes React in `src/pages` und `src/components` ist kein Markdown. Markieren Sie benutzerorientierten Text mit `<Translate>` oder `translate()` aus `@docusaurus/Translate`, damit `write-translations` ihn in `code.json` sammeln kann. Die Nachricht muss eine statische Zeichenfolge sein. `write-translations` schreibt `i18n/<locale>/code.json`; wenn `docusaurusCatalogDir` gesetzt ist, übersetzt `translate-docs` dieses JSON zusammen mit dem Rest des Shell-Katalogs. ai-i18n-tools scannt diese JSX-Bäume nicht nach `t()`.

<a id="shell-strings-write-translations"></a>
## Shell-Strings (write-translations)

Docusaurus-Navigationsleiste, Fußzeile, Suchplatzhalter und andere Theme-/Plugin-Beschriftungen werden nicht aus Markdown extrahiert. Führen Sie `docusaurus write-translations` in Ihrem Docusaurus-Projekt aus, um JSON-Kataloge unter dem Standard-Sprachordner (typischerweise `i18n/en/`) zu generieren. Verweisen Sie dann `docs[].docusaurusCatalogDir` auf diesen Ordner:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus pages + shell JSON",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

Wenn `docusaurusCatalogDir` gesetzt und `features.translateDocs` aktiviert ist, übersetzt `translate-docs` beides:

- **Dokumentationsseiten** – Markdown/MDX von `contentPaths` nach `i18n/<locale>/docusaurus-plugin-content-docs/current/`
- **Shell-JSON** – Navigationsleiste, Fußzeile und Theme-/Plugin-Kataloge von `i18n/en/` in gleichgeordnete Sprachordner

Legen Sie Docusaurus-Shell-JSON nicht in `json[]` ab; verwenden Sie stattdessen `docs[].docusaurusCatalogDir` mit Dokumenten.

<a id="example-project"></a>
## Beispielprojekt

[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) – Englische Quellen unter `docs/`, festgeschriebene Übersetzungen unter `i18n/<locale>/docusaurus-plugin-content-docs/current/`, plus übersetztes Shell-JSON. Führen Sie `pnpm start` auf Port 3100 aus (Build + Serve), damit die Sprachauswahl funktioniert; verwenden Sie `pnpm dev` für den englischsprachigen Hot Reload.

Für UI-Strings, SVG-Übersetzung und eine flache README im selben Repository-Layout siehe [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (verschachteltes `docs-site/` auf Port 3040).
