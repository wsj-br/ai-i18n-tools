<a id="fumadocs-integration"></a>
# Fumadocs-Integration

Verwenden Sie `init -t ui-fumadocs` und `docsOutput.style: "fumadocs"` für [Fumadocs](https://www.fumadocs.dev/) 4 Dokumentationsseiten auf Next.js App Router. Das Preset ist ein Alias für `doc-system` mit einem leeren `localeSubpath` und beibehaltenen BCP-47- oder kurzen Gebietsschema-Codes (`localePathLowercase` ist standardmäßig `false`).

Siehe auch [Dokumente](/de/guide/documents/) und die ausführbare Demo [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) (Dot-Parser, Port 3080).

<a id="quick-start"></a>
## Schnellstart

```bash
npx ai-i18n-tools init -t ui-fumadocs
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Aktivieren Sie `features.translateDocs`, wenn Sie Seiteninhalte, `meta.json`-Seitenleistenbeschriftungen und Fumadocs-UI-Überschreibungen in einem `sync`-Lauf übersetzen.

<a id="page-layout"></a>
## Seitenlayout

Fumadocs unterstützt zwei i18n-Inhaltslayouts über `docsOutput.fumadocsParser`. Der **Dot**-Parser ist der Standard (Fumadocs-intern und Produktionsseiten wie [SWR](https://github.com/vercel/swr-site)).

<a id="dot-parser-default"></a>
### Dot-Parser (Standard)

Englisches MDX befindet sich im Stammverzeichnis der Sammlung. Übersetzte Kopien verwenden einen Gebietsschema-Suffix im selben Verzeichnis:

```text
content/docs/index.mdx                    →  content/docs/index.pt.mdx
content/docs/guide/getting-started.mdx    →  content/docs/guide/getting-started.zh.mdx
```

```json
{
  "contentPaths": ["content/docs"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs",
    "fumadocsParser": "dot",
    "rewriteFumadocsLinks": true
  }
}
```

Richten Sie `targetLocales` genau an `defineI18n().languages` in `lib/i18n.ts` aus (das Beispiel verwendet die Kurzcodes `pt` und `zh`).

<a id="dir-parser-nextra-style"></a>
### Dir-Parser (Nextra-Stil)

Für Teams, die an Gebietsschema-Ordner gewöhnt sind (`content/docs/en/` → `content/docs/pt-BR/`), setzen Sie `fumadocsParser` auf `"dir"`:

```text
content/docs/en/index.mdx           →  content/docs/pt-BR/index.mdx
content/docs/en/guide/foo.mdx       →  content/docs/zh-Hans/guide/foo.mdx
```

```json
{
  "contentPaths": ["content/docs/en"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs/en",
    "fumadocsParser": "dir",
    "rewriteFumadocsLinks": true
  }
}
```

Siehe `ai-i18n-tools.config.dir.example.json` in [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) für eine Copy-Paste-Dir-Konfiguration. Das mentale Modell entspricht der [Nextra-Integration](/de/guide/integrations/nextra#page-layout).

<a id="sidebar-metajson"></a>
## Seitenleiste (`meta.json`)

Fumadocs verwendet JSON-`meta.json`-Dateien für die Struktur und Titel der Seitenleiste. Wenn `docsOutput.style` `"fumadocs"` ist, sammelt **`translate-docs`** `meta.json` unter `docsRoot` (oder `docs[].fumadocsMetaGlob`), übersetzt Zeichenfolgenwerte für in `docs[].fumadocsMetaTranslatableKeys` aufgeführte Schlüssel (Standard: `title`, `description`) und schreibt Gebietsschema-Ausgaben:

| Parser | Englische Quelle | Ausgabe |
|--------|------------------|---------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

Übersetzen Sie **nicht** `pages`-Slug-Arrays, `root`, `icon`, `defaultOpen` oder andere strukturelle Schlüssel – nur menschenlesbare Beschriftungen.

<a id="ui-catalog"></a>
## UI-Katalog

Das Fumadocs-Layout-Chrome (Suchplatzhalter, Gebietsschema-Anzeigenamen und andere `defineTranslations` / `i18n.translations()`-Überschreibungen in `lib/layout.shared.ts`) wird nicht aus Markdown extrahiert. Konfigurieren Sie **`docsOutput.fumadocsUiCatalog`** so, dass **`translate-docs`** den englischen Katalog aus `sourcePath` bootstrappt und JSON pro Gebietsschema übersetzt:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/docs"],
      "outputDir": "content/docs",
      "docsOutput": {
        "style": "fumadocs",
        "docsRoot": "content/docs",
        "fumadocsParser": "dot",
        "fumadocsUiCatalog": {
          "sourcePath": "lib/layout.shared.ts",
          "catalogPath": "lib/i18n/ui.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** – generiertes englisches Flat-JSON (Bootstrap-Ausgabe). Führen Sie `sync` erneut aus, wenn sich englische Überschreibungen in `layout.shared.ts` ändern.
- **`outputPathTemplate`** (optional) – Ausgaben pro Gebietsschema; Standard: `ui.{locale}.json` neben `catalogPath`.

Laden Sie JSON pro Gebietsschema in `layout.shared.ts` über `loadUiCatalog(locale)` und führen Sie es mit `i18nProvider(translations, lang)` in Ihrem Root-Layout zusammen. Siehe [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts).

Standard-Gebietsschemas können durch `@fumadocs/language/*`-Voreinstellungen ohne LLM-Kosten abgedeckt werden; der Katalog übersetzt **Projektüberschreibungen** nur im englischen Block.

Verwenden Sie **nicht** `json[]` für Fumadocs-UI-Strings – diese Pipeline ist für unabhängige App-Gebietsschema-Bundles vorgesehen.

<a id="framework-shell-translation"></a>
## Übersetzung der Framework-Shell

| Framework | Shell-/Theme-Strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations`-Katalog | Dokumente – `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Theme-/Navigations-/Seitenleisten-Katalog | Dokumente — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts`-Seitenleistenbeschriftungen | Dokumente — automatisch, wenn `style: "nextra"` + `translate-docs` |
| Nextra | Theme-Wörterbuch `.ts` | Dokumente — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json`-Seitenleistenbeschriftungen | Dokumente — automatisch, wenn `style: "fumadocs"` + `translate-docs` |
| Fumadocs | UI-Überschreibungs-Katalog | Dokumente — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Eingebaute UI-Strings (viele Gebietsschemata); keine zusätzliche Shell-Pipeline | Dokumente — `translate-docs` (nur Seiten) |

Legen Sie **keine** Framework-Shell-/Theme-Strings in `json[]` ab – diese Pipeline ist für nicht verwandte App-Locale-Bundles vorgesehen. Siehe [Docusaurus-Integration](/de/guide/integrations/docusaurus), [VitePress-Integration](/de/guide/integrations/vitepress) und [Nextra-Integration](/de/guide/integrations/nextra) für die anderen Framework-Muster.

<a id="link-conventions"></a>
## Link-Konventionen

Fumadocs bedient sprachpräfixierte Routen über Next.js-Middleware (`/docs/getting-started`, `/pt/docs/getting-started`). **Links innerhalb von Seiten sollten sprachneutral bleiben** (`/docs/getting-started`), damit der aktive Sprachpräfix automatisch angewendet wird.

Aktivieren Sie den integrierten Normalisierer, damit `translate-docs` Links in jeder übersetzten Datei automatisch korrigiert:

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks` ist standardmäßig aktiviert, wenn `style` auf `"fumadocs"` gesetzt ist.

| Autor in englischer Quelle | Nach Normalisierer |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/de/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | unverändert (vollständige URL) |

**Regeln für die Erstellung**

- Dokumentenlinks über mehrere Seiten hinweg: Verwenden Sie **sprachneutrale Site-Routen** (`/docs/…`) in englischem MDX oder `content/docs/…` / relative `.mdx`-Pfade und lassen Sie diese vom Normalisierer während `sync` umschreiben.
- Repository-Dateien außerhalb des Inhaltsbaums: Verwenden Sie **vollständige URLs**.
- Bearbeiten Sie Links in sprachsuffixierten Kopien (`*.pt.mdx`) oder `content/{locale}/`-Bäumen **nicht** manuell – generieren Sie sie mit `sync` / `translate-docs` neu.

Siehe auch [Dokumente – Link-Umschreibung](/de/guide/documents/link-rewriting) und [Konfiguration – `docsOutput`](/de/reference/configuration#docsoutput).

<a id="locale-codes"></a>
## Gebietsschema-Codes

Halten Sie `targetLocales` in `ai-i18n-tools.config.json` **genau** mit `defineI18n().languages` in Ihrer Fumadocs-App synchron. Das Punktbeispiel verwendet Kurzcodes (`pt`, `zh`); Dir-Konfigurationen können BCP-47-Ordner verwenden (`pt-BR`, `zh-Hans`). Es gibt keine erzwungene Normalisierung – nicht übereinstimmende Codes führen zu falschen Ausgabepfaden oder fehlenden Seiten.

<a id="multiple-collections"></a>
## Mehrere Sammlungen

Fumadocs-Projekte können mehrere `defineDocs`-Blöcke in `source.config.ts` definieren (Dokumente, Blog, Beispiele). Fügen Sie pro zu übersetzender Sammlung einen `docs[]`-Block hinzu, jeweils mit eigenem `contentPaths`, `outputDir` und `docsRoot`.

<a id="example-project"></a>
## Beispielprojekt

[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) – Englisches MDX unter `content/docs/`, übertragene `pt`- und `zh`-Seiten mit Punktsuffix, `meta.json` und `lib/i18n/ui.{locale}.json`. Führen Sie `pnpm run dev` auf Port **3080** aus.

<a id="cross-references"></a>
## Querverweise

- [Konfiguration – `docsOutput`](/de/reference/configuration#docsoutput)
- [Ausgabelayouts](/de/guide/documents/output-layouts)
- [Docusaurus-Integration](/de/guide/integrations/docusaurus)
- [Nextra-Integration](/de/guide/integrations/nextra) (mentales Modell des Dir-Parsers)
- [VitePress-Integration](/de/guide/integrations/vitepress) (UI-Katalog-Bootstrap-Muster)
