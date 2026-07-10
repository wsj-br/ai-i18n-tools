<a id="output-layouts"></a>
# Ausgabe-Layouts

`docsOutput.style` steuert, wohin übersetzte Markdown-Dateien geschrieben werden. Verwenden Sie exakt die unten angegebenen Zeichenketten in `docs[].docsOutput.style` (Aliase sind voreingestellte Layouts, keine separaten Engines).

`docsOutput.style = "nested"` (Standard, wenn weggelassen) — spiegelt die Quellstruktur unter `{outputDir}/{locale}/` wider (z. B. `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — sprachpräfixierte Dokumentationsstruktur für statische Dokumentationsseiten. Dateien unter `docsRoot` werden nach `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` geschrieben. Pfade außerhalb von `docsRoot` fallen auf das verschachtelte Layout zurück. Legen Sie `docs[].docsOutput.docsRoot` auf Ihren englischen Quellstamm fest (z. B. `"docs"` oder `"src/content/docs"`). Wenn `docsOutput.style = "doc-system"`, müssen Sie `localeSubpath` explizit festlegen (verwenden Sie einen Alias unten für Voreinstellungen).

**Aliase** (gleicher Layout-Engine, voreingestellter `localeSubpath`):

- `docsOutput.style = "docusaurus"` – `localeSubpath` ist standardmäßig `docusaurus-plugin-content-docs/current` (Docusaurus i18n-Plugin-Layout).
- `docsOutput.style = "astro-starlight"` – `localeSubpath` ist standardmäßig `""` (übersetzte Seiten direkt unter `{outputDir}/{locale}/`, passend zu [Starlight](https://starlight.astro.build/guides/i18n/), wenn Englisch im Inhaltsstamm liegt und `outputDir` gleich `docsRoot` ist).
- `docsOutput.style = "vitepress"` – gleiches Layout wie `doc-system` mit leerem `localeSubpath`; BCP-47-Gebietsschema-Ordnernamen bleiben erhalten (`localePathLowercase` ist standardmäßig `false`). Siehe [VitePress-Integration](/de/guide/integrations/vitepress).
- `docsOutput.style = "nextra"` – gleiches Layout wie `doc-system` mit leerem `localeSubpath`; englische Quelle befindet sich unter einem Gebietsschema-Ordner (z. B. `content/en/`). Siehe [Nextra-Integration](/de/guide/integrations/nextra).
- `docsOutput.style = "fumadocs"` – gleiches Layout wie `doc-system` mit leerem `localeSubpath`; englische Quelle verwendet Dateien mit Punktsuffix (Standard) oder einen Gebietsschema-Ordner, wenn `fumadocsParser` `"dir"` ist. Siehe [Fumadocs-Integration](/de/guide/integrations/fumadocs).

Docusaurus-Voreinstellung (primäre Dokumentationsseiten):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight-Voreinstellung (gleiche Blockstruktur, unterschiedliche Pfade):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

VitePress-Voreinstellung (Englisch im Inhalts-Root, Gebietsschema-Ordner neben der Quelle):

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Nextra-Voreinstellung (Englisch unter einem Gebietsschema-Ordner, gleichrangige Gebietsschema-Ordner für Ziele):

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

Fumadocs-Voreinstellung – Punkt-Parser (Standard; Gebietsschema-Suffix neben englischer Quelle):

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

Fumadocs-Voreinstellung – Verzeichnis-Parser (Nextra-Stil Gebietsschema-Ordner):

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Optionale JSON-Bezeichnungen — Docusaurus-Shell-Zeichenketten aus `docusaurusCatalogDir` (nicht MDX-Textkörper):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight liefert UI-Zeichenketten für viele Sprachen; optionale benutzerdefinierte UI-Überschreibungen verwenden `src/content/i18n/en.json` mit `jsonPathTemplate: "{outputDir}/{locale}.json"` in einem separaten `docs[]`-Block, wenn nötig.

VitePress Navigations-/Seitenleisten-/Fußzeilen-Strings sind nicht in Markdown – konfigurieren Sie `docsOutput.vitepressThemeCatalog` und übersetzen Sie innerhalb von **`translate-docs`**. Siehe [VitePress-Integration](/de/guide/integrations/vitepress).

Nextra Theme-Wörterbuch (`.ts`) und `_meta.ts` Seitenleistenbeschriftungen sind nicht in Markdown – verwenden Sie `docs[].nextraDictionaryPath` und die automatische `_meta`-Sammlung, wenn `style: "nextra"`, alles innerhalb von **`translate-docs`**. Siehe [Nextra-Integration](/de/guide/integrations/nextra).

Fumadocs UI-Überschreibungen (`lib/layout.shared.ts`) und `meta.json` Seitenleistenbeschriftungen sind nicht in Markdown – verwenden Sie `docsOutput.fumadocsUiCatalog` und die automatische `meta.json`-Sammlung, wenn `style: "fumadocs"`, alles innerhalb von **`translate-docs`**. Siehe [Fumadocs-Integration](/de/guide/integrations/fumadocs).

`docsOutput.style = "flat"` — platziert übersetzte Dateien neben der Quelle mit einem Sprachsuffix oder in einem Unterverzeichnis. Relative Links zwischen Seiten werden automatisch umgeschrieben, wenn `docsOutput.style = "flat"` (es sei denn, `rewriteRelativeLinks: false` oder ein benutzerdefiniertes `pathTemplate` ist gesetzt).

```text
docs/guide.md → i18n/guide.de.md
```

Für seitenübergreifende Ankerlinks in einem flachen Layout siehe [Ankerlinks](/de/guide/documents/anchor-links).

Informationen zum Umschreiben von Link- und Asset-URLs, die über die integrierten Korrekturen für relative Links hinausgehen, finden Sie unter [Link-Umschreibung](/de/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`).

Für Screenshots und Raster-Assets auf übersetzten Seiten siehe [Bilder & Screenshots](/de/guide/images-and-screenshots/).

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` Platzhalter

Überschreiben Sie, wohin übersetzte Dateien geschrieben werden, indem Sie `docs[].docsOutput.pathTemplate` (Markdown und MDX) oder `jsonPathTemplate` (JSON-Label-Dateien) festlegen. Beide akzeptieren dieselben Platzhalter. Aufgelöste Pfade müssen innerhalb des `outputDir` dieses Blocks bleiben (die CLI lehnt Pfade ab, die diesen verlassen).

Wenn Sie eine benutzerdefinierte `pathTemplate` verwenden, ist `rewriteRelativeLinks` standardmäßig auf `false` gesetzt, sofern Sie ihn nicht explizit festlegen – die Umwandlung relativer Links ist für `docsOutput.style = "flat"` ohne benutzerdefinierte Vorlage konzipiert.

Für integrierte Layouts (`nested`, `flat`, `doc-system` ohne benutzerdefinierte Vorlage) setzen Sie `docsOutput.localePathLowercase` auf `true`, um klein geschriebene Ordner- oder Dateinamenabschnitte zu erzeugen (z. B. `pt-br` statt `pt-BR`). Der `astro-starlight`-Alias setzt dies standardmäßig auf `true`. Benutzerdefinierte `pathTemplate` / `jsonPathTemplate`-Werte bleiben unverändert – verwenden Sie dort `{llocale}`, wenn Sie klein geschriebene Abschnitte benötigen, aber `{locale}` im BCP-47-Format beibehalten möchten.

| Platzhalter            | Rolle                                                                                                       | Beispiel                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Absoluter aufgelöster Pfad des `outputDir` dieses Dokumentationsblocks                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | Ziel-Sprachcode (gleiche Form wie in Konfiguration / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Dieselbe Sprache in Großbuchstaben | `DE`, `PT-BR` |
| `{llocale}`            | Gleicher kleingeschriebener Gebietsschemaname (entspricht Astro-Routenordnern wie `pt-br`, `zh-cn`)                               | `de`, `pt-br`                                                    |
| `{relPath}` | Quelldateipfad relativ zur Projektwurzel, POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Dateiname **ohne** Erweiterung | `guide` für `docs/guide.md` |
| `{basename}` | Dateiname **mit** Erweiterung | `guide.md` |
| `{extension}` | Erweiterung **einschließlich** des Punkts | `.md`, `.mdx` |
| `{docsRoot}`           | Absoluter aufgelöster Pfad von `docsOutput.docsRoot` (Standard `docs`, falls weggelassen)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` mit entferntem `docsRoot`-Präfix, wenn sich die Pfadzeichenfolgen entsprechen (POSIX); andernfalls unverändert | `docs/guide.md` (üblich); `guide.md` nur, wenn das Entfernen angewendet wird |

**Beispiel**

Konfigurationsausschnitt:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Für das Gebietsschema `de` und die Quelle `docs/guide.md`, mit Projektstammverzeichnis `/home/acme/repo` und `outputDir`, das auf `/home/acme/repo/i18n` aufgelöst wird, lautet der erweiterte Pfad:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Mit `docsOutput.style = "flat"` und ohne benutzerdefinierte `pathTemplate` ist ein übliches Muster, nur den Dateinamen über `{stem}` und `{extension}` beizubehalten, z. B. `{outputDir}/{stem}.{locale}{extension}`, was `…/guide.de.md` im aufgelösten `outputDir` ergibt.
