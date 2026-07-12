<a id="output-layouts"></a>
# Ausgabe-Layouts

`docsOutput.style` steuert, wohin übersetzte Markdown-Dateien geschrieben werden. Verwenden Sie die genauen Zeichenfolgenwerte unten in `docs[].docsOutput.style`. Aliase sind voreingestellte `doc-system`-Layouts (oder Fumadocs-Punkt-Suffix-Layout), keine separaten Engines – das Laden der Konfiguration kann Alias-`style`-Werte in kanonische `"doc-system"` umschreiben, während die ursprüngliche Voreinstellung in `stylePreset` beibehalten wird.

Setzen Sie `docs[].docsOutput.pathTemplate` (Markdown/MDX) oder `jsonPathTemplate` (JSON-Label-Dateien), um ein integriertes Layout zu überschreiben. Siehe [pathTemplate-Platzhalter](#pathtemplate--jsonpathtemplate-placeholders) unten.

<a id="layout-overview"></a>
## Layout-Übersicht

| `docsOutput.style` | Engine | Typische Verwendung |
| --- | --- | --- |
| `"nested"` | Locale-Ordner spiegelt vollständigen Quellbaum wider | Standard; generische i18n-Ausgabe unter `{outputDir}/{locale}/` |
| `"flat"` | Locale-Suffix im Dateinamen (optionale Unterverzeichnisse) | README, Changelogs, Repo-Root-Dokumente, [Sprachumschalter](/de/guide/documents/language-switcher) |
| `"doc-system"` | Locale-Ordner + optional `localeSubpath` unter `docsRoot` | Benutzerdefinierte statische Dokumentationsgeneratoren |
| `"docusaurus"` | `doc-system`-Voreinstellung | [Docusaurus](/de/guide/integrations/docusaurus) i18n-Plugin-Layout |
| `"astro-starlight"` | `doc-system`-Voreinstellung (`localeSubpath: ""`) | [Astro Starlight](/de/guide/integrations/astro#astro-starlight), einfache Astro-Locale-Seiten |
| `"vitepress"` | `doc-system`-Voreinstellung (`localeSubpath: ""`) | [VitePress](/de/guide/integrations/vitepress) Locale-Ordner neben Englisch |
| `"nextra"` | `doc-system`-Voreinstellung (`localeSubpath: ""`) | [Nextra](/de/guide/integrations/nextra) Locale-Ordner (`content/en/` → `content/{locale}/`) |
| `"fumadocs"` | Punkt-Suffix (Standard) oder `doc-system` wenn `fumadocsParser: "dir"` | [Fumadocs](/de/guide/integrations/fumadocs) Punkt- oder Verzeichnis-Inhaltslayout |

<a id="nested-default"></a>
## `nested` (Standard)

`docsOutput.style = "nested"` (Standard, wenn weggelassen) – spiegelt den Quellbaum unter `{outputDir}/{locale}/` wider.

```text
docs/guide.md  →  i18n/de/docs/guide.md
README.md      →  i18n/de/README.md
```

Pfade außerhalb eines `docsRoot` (wenn gesetzt) verwenden dieselbe verschachtelte Form.

<a id="flat"></a>
## `flat`

`docsOutput.style = "flat"` – schreibt übersetzte Dateien unter `outputDir` mit einem Locale-Suffix im Dateinamen. Standardmäßig wird nur der Basisname beibehalten (`{outputDir}/{stem}.{locale}{extension}`), sodass `docs/guide.md` und `docs/other/guide.md` kollidieren würden, es sei denn, Sie aktivieren `flatPreserveRelativeDir`.

```text
README.md           →  translated-docs/README.de.md
docs/guide.md       →  translated-docs/guide.de.md   (default: basename only)
```

Relative Links zwischen Seiten werden automatisch umgeschrieben, wenn `docsOutput.style = "flat"` (es sei denn, `rewriteRelativeLinks: false` oder ein benutzerdefiniertes `pathTemplate` ist gesetzt). Siehe [Anker-Links](/de/guide/documents/anchor-links) für die seitenübergreifende `#anchor`-Behandlung.

<a id="flat-with-flatpreserverelativedir"></a>
### `flat` mit `flatPreserveRelativeDir`

Setzen Sie `docsOutput.flatPreserveRelativeDir` auf `true`, um Quell-Unterverzeichnisse unter `outputDir` beizubehalten. Verwenden Sie dies, wenn Sie mehrere Markdown-Dateien übersetzen, die Basisnamen in verschiedenen Ordnern teilen, oder wenn flache Ausgaben einen flachen Baum widerspiegeln müssen (z. B. README im Repo-Root plus `docs/*.md`).

```text
docs/guide.md       →  translated-docs/docs/guide.de.md
docs/sub/page.md    →  translated-docs/docs/sub/page.de.md
```

Der flache Link-Umschreiber verwendet den pro-Datei-Ausgabepfad, wenn er Tiefenpräfixe für Asset-URLs berechnet – siehe [Link-Umschreibung](/de/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir).

<a id="doc-system"></a>
## `doc-system`

`docsOutput.style = "doc-system"` – lokalisierter Dokumentationsbaum für statische Dokumentationsseiten. Dateien unter `docsRoot` werden geschrieben nach:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Pfade außerhalb von `docsRoot` greifen auf das [verschachtelte](#nested) Layout (`{outputDir}/{locale}/{relPath}`) zurück.

Setzen Sie `docs[].docsOutput.docsRoot` auf Ihr englisches Quellverzeichnis (z. B. `"docs"`, `"src/content/docs"` oder `"content/en"`). Wenn `docsOutput.style = "doc-system"`, müssen Sie `localeSubpath` explizit festlegen (verwenden Sie einen Alias unten für Voreinstellungen). Verwenden Sie `localeSubpath: ""`, wenn übersetzte Seiten direkt unter `{outputDir}/{locale}/` liegen (Starlight-Stil).

Docusaurus-Shell-JSON aus `docusaurusCatalogDir` und andere JSON-Artefakte unter Doc-System-Voreinstellungen folgen dem gleichen Ordnerlayout wie Markdown. Mit `style: "flat"` verwenden JSON-Label-Dateien weiterhin die verschachtelte Form, es sei denn, Sie legen `jsonPathTemplate` fest.

<a id="doc-system-aliases"></a>
## Doc-System-Aliase

**Aliase** (gleiche `doc-system`-Engine, voreingestelltes `localeSubpath` und Standardwerte):

- `docsOutput.style = "docusaurus"` – `localeSubpath` ist standardmäßig `docusaurus-plugin-content-docs/current` (Docusaurus i18n-Plugin-Layout).
- `docsOutput.style = "astro-starlight"` – `localeSubpath` ist standardmäßig `""`; `localePathLowercase` ist standardmäßig `true`. Übersetzte Seiten unter `{outputDir}/{locale}/`, passend zu [Starlight](https://starlight.astro.build/guides/i18n/), wenn Englisch im Inhaltsstamm liegt und `outputDir` gleich `docsRoot` ist. Wird auch für einfache Astro-Locale-Seiten verwendet (`src/pages/index.astro` → `src/pages/{locale}/index.astro`) – siehe [Astro-Website-Seiten](/de/guide/ui-strings/astro-website#pages-parse-and-replace).
- `docsOutput.style = "vitepress"` – gleiches Layout wie `doc-system` mit leerem `localeSubpath`; BCP-47-Locale-Ordnernamen bleiben erhalten (`localePathLowercase` ist standardmäßig `false`). Siehe [VitePress-Integration](/de/guide/integrations/vitepress).
- `docsOutput.style = "nextra"` – gleiches Layout wie `doc-system` mit leerem `localeSubpath`; englische Quelle liegt unter einem Locale-Ordner (z. B. `content/en/`). Siehe [Nextra-Integration](/de/guide/integrations/nextra).

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

Optionale JSON-Bezeichnungen — Docusaurus-Shell-Zeichenketten aus `docusaurusCatalogDir` (nicht MDX-Textkörper):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight liefert UI-Zeichenketten für viele Sprachen; optionale benutzerdefinierte UI-Überschreibungen verwenden `src/content/i18n/en.json` mit `jsonPathTemplate: "{outputDir}/{locale}.json"` in einem separaten `docs[]`-Block, wenn nötig.

VitePress Navigations-/Seitenleisten-/Fußzeilen-Strings sind nicht in Markdown – konfigurieren Sie `docsOutput.vitepressThemeCatalog` und übersetzen Sie innerhalb von **`translate-docs`**. Siehe [VitePress-Integration](/de/guide/integrations/vitepress).

Nextra Theme-Wörterbuch (`.ts`) und `_meta.ts` Seitenleistenbeschriftungen sind nicht in Markdown – verwenden Sie `docs[].nextraDictionaryPath` und die automatische `_meta`-Sammlung, wenn `style: "nextra"`, alles innerhalb von **`translate-docs`**. Siehe [Nextra-Integration](/de/guide/integrations/nextra).

<a id="fumadocs"></a>
## `fumadocs`

`docsOutput.style = "fumadocs"` – Fumadocs-Inhaltslayout über `docsOutput.fumadocsParser`:

- **`"dot"` (Standard)** – Locale-Suffix im Dateinamen neben englischen Quellen unter `outputDir` (kein Locale-Ordner). Dies ist getrennt von der `doc-system`-Pfadform.

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

- **`"dir"`** – Locale-Ordner im Nextra-Stil; verwendet die gleiche `doc-system`-Engine mit leerem `localeSubpath`.

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Fumadocs UI-Überschreibungen (`lib/layout.shared.ts`) und `meta.json` Seitenleistenbeschriftungen sind nicht in Markdown – verwenden Sie `docsOutput.fumadocsUiCatalog` und die automatische `meta.json`-Sammlung, wenn `style: "fumadocs"`, alles innerhalb von **`translate-docs`**. Siehe [Fumadocs-Integration](/de/guide/integrations/fumadocs).

Informationen zum Umschreiben von Link- und Asset-URLs, die über die integrierten Korrekturen für relative Links hinausgehen, finden Sie unter [Link-Umschreibung](/de/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`).

Für Screenshots und Raster-Assets auf übersetzten Seiten siehe [Bilder & Screenshots](/de/guide/images-and-screenshots/).

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` Platzhalter

Überschreiben Sie, wohin übersetzte Dateien geschrieben werden, indem Sie `docs[].docsOutput.pathTemplate` (Markdown und MDX) oder `jsonPathTemplate` (JSON-Label-Dateien) festlegen. Beide akzeptieren dieselben Platzhalter. Aufgelöste Pfade müssen innerhalb des `outputDir` dieses Blocks bleiben (die CLI lehnt Pfade ab, die diesen verlassen).

Wenn Sie eine benutzerdefinierte `pathTemplate` verwenden, ist `rewriteRelativeLinks` standardmäßig auf `false` gesetzt, sofern Sie ihn nicht explizit festlegen – die Umwandlung relativer Links ist für `docsOutput.style = "flat"` ohne benutzerdefinierte Vorlage konzipiert.

Für integrierte Layouts (`nested`, `flat`, `doc-system` ohne benutzerdefinierte Vorlage) setzen Sie `docsOutput.localePathLowercase` auf `true`, um kleingeschriebene Locale-Ordner- oder Dateinamen-Segmente zu schreiben (z. B. `pt-br` anstelle von `pt-BR`). Der `astro-starlight`-Alias und `doc-system` mit leerem `localeSubpath` setzen dies beim Laden der Konfiguration standardmäßig auf `true`. Benutzerdefinierte `pathTemplate` / `jsonPathTemplate`-Werte bleiben unverändert – verwenden Sie dort `{llocale}`, wenn Sie kleingeschriebene Segmente benötigen, während `{locale}` als BCP-47 beibehalten wird.

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
