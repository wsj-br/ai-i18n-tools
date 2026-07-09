<a id="docusaurus-integration"></a>
# Docusaurus-Integration

Verwenden Sie `init -t ui-docusaurus` und `docsOutput.style: "docusaurus"` für [Docusaurus](https://docusaurus.io/)-Dokumentationsseiten. Das Preset erstellt einen `docs[]`-Block mit `docusaurusCatalogDir`, sodass `translate-docs` sowohl Seiten-Markdown als auch Docusaurus-Shell-JSON in einem Befehl übersetzen kann.

Siehe auch [Dokumente](/guide/documents/), die ausführbare Demo [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (Next.js-App plus verschachteltes `docs-site/`) und [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) für eine fokussierte Docusaurus-only-Anleitung.

<a id="quick-start"></a>
## Schnellstart

```bash
npx ai-i18n-tools init -t ui-docusaurus
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # Docusaurus build (project-specific script)
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

Verweisen Sie `contentPaths` auf Ihre englischen `.md` / `.mdx`-Dateien und -Verzeichnisse. Setzen Sie `docsRoot` auf denselben Ordner, den Docusaurus als Inhaltsstamm verwendet. Setzen Sie `outputDir` auf das übergeordnete Verzeichnis jedes Sprachordners unter `i18n/`.

Verbinden Sie die [Internationalisierung](https://docusaurus.io/docs/i18n/introduction) von Docusaurus: Halten Sie `targetLocales` in `ai-i18n-tools.config.json` mit dem `locales`-Array in `docusaurus.config.js` synchron. Jedes `localeConfigs[locale].path` muss mit dem Ordnernamen unter `i18n/` übereinstimmen (zum Beispiel `path: "fr"` für `i18n/fr/`).

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

<a id="framework-shell-translation"></a>
## Übersetzung der Framework-Shell

| Framework | Shell / Theme-Strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations`-Katalog (`{ message, description }`) | Dokumente — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Theme-/Navigations-/Seitenleistenkatalog | Dokumente – `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts`-Seitenleistenbeschriftungen | Dokumente – automatisch, wenn `style: "nextra"` + `translate-docs` |
| Nextra | Theme-Wörterbuch `.ts` | Dokumente – `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json`-Seitenleistenbeschriftungen | Dokumente – automatisch, wenn `style: "fumadocs"` + `translate-docs` |
| Fumadocs | UI-Überschreibungskatalog | Dokumente – `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Integrierte UI-Strings (viele Sprachen); keine zusätzliche Shell-Pipeline | Dokumente – `translate-docs` (nur Seiten) |

Legen Sie **keine** Framework-Shell-/Theme-Strings in `json[]` ab – diese Pipeline ist für nicht verwandte App-Locale-Bundles vorgesehen. Siehe [VitePress-Integration](/guide/vitepress-integration), [Nextra-Integration](/guide/nextra-integration) und [Fumadocs-Integration](/guide/fumadocs-integration) für die anderen Framework-Muster.

<a id="example-project"></a>
## Beispielprojekt

[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) – Englische Quellen unter `docs/`, übertragene Übersetzungen unter `i18n/<locale>/docusaurus-plugin-content-docs/current/`, plus übersetzte Shell-JSON. Führen Sie `pnpm start` auf Port 3040 für die Entwicklung aus; verwenden Sie `pnpm run start:fr` (und ähnliches), um eine einzelne Sprache im Entwicklungsmodus vorab anzuzeigen.
