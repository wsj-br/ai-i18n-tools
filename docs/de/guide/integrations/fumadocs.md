<a id="fumadocs-integration"></a>
# Fumadocs-Integration

Verwenden Sie `init -t ui-fumadocs` und `docsOutput.style: "fumadocs"` für [Fumadocs](https://www.fumadocs.dev/) 4 Dokumentationsseiten auf Next.js App Router. Das Preset ist ein Alias für `doc-system` mit einem leeren `localeSubpath` und beibehaltenen BCP-47- oder kurzen Gebietsschema-Codes (`localePathLowercase` ist standardmäßig `false`).

Siehe auch [Dokumente](/de/guide/documents/) und die ausführbare Demo [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) (Dot-Parser, Port 3080).

<a id="quick-start"></a>
## Schnellstart

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
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

<a id="enable-i18n-in-an-existing-site"></a>
### i18n auf einer bestehenden Site aktivieren

Eine Fumadocs-App, die nur Englisch unterstützt, benötigt eine Locale-Route und `defineI18n`, bevor `translate-docs` Geschwisterdateien schreiben kann. Der [Agent-Prompt](#agent-prompt) führt durch eine bestehende Website. Checkliste:

- `defineI18n` in `lib/i18n.ts` mit `languages`, `defaultLanguage` und `parser: "dot"` oder `"dir"`.
- `app/[lang]/`-Routen und `createI18nMiddleware` aus `proxy.ts` (der Datei des Beispiels).
- `i18n.translations()` in `lib/layout.shared.ts`, an `i18nProvider` übergeben.
- Englisches MDX im Sammlungs-Root (Punkt) oder unter `content/docs/en/` (Verzeichnis).
- `targetLocales` gleich `languages` abzüglich der Standardsprache, dann `sync`.

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

| Parser | Quell-Locale | Ausgabe |
|--------|----------------|--------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

Übersetzen Sie **nicht** `pages`-Slug-Arrays, `root`, `icon`, `defaultOpen` oder andere strukturelle Schlüssel – nur menschenlesbare Beschriftungen.

<a id="ui-catalog"></a>
## UI-Katalog

Fumadocs Layout-Chrome (Suchplatzhalter, Anzeigenamen für Locales und andere `defineTranslations` / `i18n.translations()`-Überschreibungen in `lib/layout.shared.ts`) wird nicht aus Markdown extrahiert. Konfigurieren Sie **`docsOutput.fumadocsUiCatalog`**, sodass **`translate-docs`** den Quell-Locale-Katalog aus `sourcePath` bootstrappt und pro-Locale-JSON übersetzt:

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

- **`catalogPath`** – Englisches flaches JSON. Der Bootstrap liest nur das `en`-Objekt von `.add({ … })` in `sourcePath`. String-Literale in diesem Objekt werden zu Katalogschlüsseln (`displayName`, `Search(search trigger)`). `.add()` akzeptiert nur Schlüssel, die die Fumadocs UI-Presets registriert haben, sodass ein Navigations-Titel wie `site.title` dort nicht existieren kann. Das Beispiel behält `site.title` im JSON und liest `catalog["site.title"]` für `nav.title`. Schlüssel, die bereits in der Datei vorhanden, aber im `en`-Objekt fehlen, bleiben erhalten: Der Merge ist `{ ...existing, ...extracted }`. Führen Sie `sync` erneut aus, wenn sich die englischen Literale ändern.
- **`outputPathTemplate`** (optional) – pro-Locale-Ausgaben; Standard: `ui.{locale}.json` neben `catalogPath`.

Ein übersetzter Schlüssel bewirkt nichts, bis die App ihn liest. `i18n.translations().get(lang)` gibt nur Schlüssel zurück, die bei `.extend()` registriert sind (den Fumadocs UI-Presets). Verteilen Sie den Locale-Katalog in `.add()`, damit diese Schlüssel angewendet werden, und platzieren Sie das native `displayName` **nach** dem Spread, damit eine Übersetzung des englischen Namens es nicht ersetzt:

```ts
"pt-BR": {
  ...loadUiCatalog("pt-BR"),
  displayName: "Português (Brasil)",
},
```

`site.title` ist kein Fumadocs UI-Schlüssel. Das Beispiel liest ihn aus dem Katalog für `nav.title`. Ein Suchlabel, das nur in `ui.pt-BR.json` existiert, bleibt auf dem integrierten Preset, bis dieser Spread (oder ein anderer Lesevorgang) es verwendet.

Siehe [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts).

Standard-Gebietsschemas können durch `@fumadocs/language/*`-Voreinstellungen ohne LLM-Kosten abgedeckt werden; der Katalog übersetzt **Projektüberschreibungen** nur im englischen Block.

<a id="agent-prompt"></a>
## Agenten-Prompt

Kopieren Sie dies, wenn eine Fumadocs-Website, die nur Englisch unterstützt, Locales erhalten soll. Es verbindet das Routing und den UI-Katalog. Es übersetzt keine Strings.

<details class="agent-prompt">
<summary>UI-Katalog-Prompt</summary>

````markdown
# Enable Fumadocs i18n and the UI catalog

## Context

ai-i18n-tools translates Fumadocs MDX, `meta.json` titles, and the English block
of `i18n.translations().add({ en: { … } })` via `translate-docs` and
`docsOutput.fumadocsUiCatalog`. The literal in that `en` object is the source
string. Locale JSON takes effect only for keys the app reads: either a catalog
spread into `.add()` for registered UI keys, or a direct read such as
`catalog["site.title"]` for the nav title. Do not translate any string.

Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs

## Scope

Edit `lib/i18n.ts`, `lib/layout.shared.ts`, `proxy.ts`, `app/[lang]/` routes,
and `ai-i18n-tools.config.json`. Skip URLs, slugs, and native language names
(`displayName` on each locale entry).

## Call shape

- `defineI18n({ languages, defaultLanguage, parser })`. Use `"dot"` unless the
  project already keeps English under a locale folder (`"dir"`).
- `export default createI18nMiddleware(i18n)` from `proxy.ts`.
- Move pages under `app/[lang]/…` and pass `lang` into `baseOptions` and
  `i18nProvider(translations, lang)`.
- In `lib/layout.shared.ts`, keep English UI overrides as string literals inside
  `.add({ en: { … } })`. For each other locale, spread `loadUiCatalog(locale)`
  and then set `displayName` to the native name.
- Config: `features.translateDocs`, `docsOutput.style: "fumadocs"`,
  `fumadocsParser` matching `defineI18n`, and `fumadocsUiCatalog.sourcePath`
  pointing at `lib/layout.shared.ts`. `targetLocales` must equal `languages`
  except the default language, character for character.

## Order

1. Routing and `defineI18n`.
2. English literals in the `en` block, and the catalog spread for other locales.
3. Ask the user to run `sync`. Do not hand-write `ui.<locale>.json` or
   translated MDX.

## Do not

- Do not translate, rename, or reword the English literals.
- Do not put native language names only in the `en` block (they would be
  extracted and translated).
- Do not hand-edit locale JSON, `meta.<locale>.json`, or locale MDX.
- Do not use `json[]` for this catalog.

## Verify

- `pnpm build` passes.
- The default locale still shows the English overrides.
- After `sync`, one other locale shows the translated search trigger and nav
  title, and `displayName` in the language menu is still the native name.

## Report back

List files changed, each key you added to the `en` block, each key you left
unread (and so unused) with a one-line reason, and whether the parser is `dot`
or `dir`.
````

</details>

Verwenden Sie **nicht** `json[]` für Fumadocs-UI-Strings – diese Pipeline ist für unabhängige App-Gebietsschema-Bundles vorgesehen.

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

| Autor in der Quell-Locale | Nach Normalisierer |
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
